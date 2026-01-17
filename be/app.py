from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
import cv2
import json
import requests
from typing import Optional

app = FastAPI()

# Cấu hình CORS để Frontend gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# CONFIG (Thay đổi các thông số này)
# ======================
IMG_SIZE = 224
# Thay URL này bằng Webhook URL của n8n hoặc API của Dify
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/plant-disease" 

# ======================
# LOAD MODEL & LABELS
# ======================
try:
    model = tf.keras.models.load_model("model/plant_disease_model.h5")
    with open("model/class_indices.json", "r", encoding="utf-8") as f:
        class_indices = json.load(f)
    labels = {v: k for k, v in class_indices.items()}
    
    with open("model/vi_labels.json", "r", encoding="utf-8") as f:
        vi_labels = json.load(f)
except Exception as e:
    print(f"❌ Lỗi Load Model/Labels: {e}")

# ======================
# API CHÍNH
# ======================
@app.post("/chat-plant")
async def chat_plant(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    plant_vi = ""
    disease_vi = ""
    confidence = 0

    # 1. Nếu có file ảnh -> Chạy nhận diện bằng TensorFlow
    if file:
        try:
            image_bytes = await file.read()
            img_array = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
            img = img / 255.0
            img = np.expand_dims(img, axis=0)

            preds = model.predict(img)[0]
            idx = int(np.argmax(preds))
            confidence = float(preds[idx])

            label_en = labels[idx]
            plant_en, disease_en = label_en.split("___")

            plant_vi = vi_labels.get(plant_en, plant_en)
            disease_vi = vi_labels.get(disease_en, disease_en)
        except Exception as e:
            print(f"⚠️ Lỗi nhận diện ảnh: {e}")

    # 2. Gửi dữ liệu sang n8n hoặc Dify để lấy câu trả lời thông minh
    # n8n sẽ nhận text và thông tin bệnh để tư vấn cách chữa
    # ... phần code nhận diện ảnh giữ nguyên ...

    payload = {
        "text": str(text) if text else "Tư vấn giúp tôi về bệnh này",
        "plant": str(plant_vi),
        "disease": str(disease_vi),
        "confidence": float(round(confidence, 3))
    }

    bot_answer = "Xin lỗi, tôi không thể kết nối với trí tuệ nhân tạo lúc này."
    try:
        # THÊM HEADERS RÕ RÀNG
        headers = {'Content-Type': 'application/json'}
        
        # Gửi dữ liệu đi
        response = requests.post(
            N8N_WEBHOOK_URL, 
            json=payload, # requests sẽ tự động chuyển dict thành JSON string
            headers=headers, 
            timeout=10
        )
        
        print(f"DEBUG: n8n Status Code: {response.status_code}")
        print(f"DEBUG: n8n Response: {response.text}") # Xem n8n thực sự trả về gì

        if response.status_code == 200:
            res_data = response.json()
            bot_answer = res_data.get("output") or res_data.get("answer") or "Đã gửi thông tin thành công."
            
    except Exception as e:
        print(f"DEBUG: Lỗi: {str(e)}")
        bot_answer = f"Lỗi kết nối n8n/Dify: {str(e)}"

    return {
        "plant": plant_vi,
        "disease": disease_vi,
        "confidence": f"{round(confidence * 100, 2)}%" if confidence > 0 else "0%",
        "answer": bot_answer
    }
if __name__ == "__main__":
    import uvicorn
    # Chạy server tại cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)