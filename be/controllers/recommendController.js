const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeArea = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        // Cấu hình Model
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Prompt bắt buộc AI trả về JSON
        const prompt = `
            Đóng vai chuyên gia nông nghiệp. Phân tích tọa độ: ${lat}, ${lng}.
            Dựa trên vị trí thực tế, hãy đoán khí hậu, đất đai và gợi ý cây trồng.
            BẮT BUỘC trả về định dạng JSON thuần (không markdown) mẫu:
            {
                "climate": "Mô tả khí hậu ngắn",
                "soil": "Loại đất",
                "temp": "Nhiệt độ TB",
                "crops": [
                    {"name": "Tên cây", "desc": "Lý do ngắn"}
                ]
            }
            Trả lời bằng Tiếng Việt.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Làm sạch chuỗi JSON nếu AI lỡ thêm dấu ```
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Parse sang object để kiểm tra
        const data = JSON.parse(text);

        res.json({ success: true, data: data });

    } catch (error) {
        console.error("Lỗi AI:", error);
        res.status(500).json({ success: false, message: "Lỗi phân tích từ AI" });
    }
};