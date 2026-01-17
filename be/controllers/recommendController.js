const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeArea = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=vi`;
        
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (weatherData.cod !== "200") {
            throw new Error("Không lấy được dữ liệu thời tiết");
        }

        // Lọc dữ liệu: API trả về 40 mốc (3h/lần), ta chỉ lấy 1 mốc lúc 12:00 trưa mỗi ngày để đại diện
        const dailyForecast = weatherData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

        // Tạo chuỗi mô tả thời tiết để gửi cho Gemini
        const weatherSummary = dailyForecast.map(day => 
            `- Ngày ${day.dt_txt.split(' ')[0]}: ${day.main.temp}°C, ${day.weather[0].description}, độ ẩm ${day.main.humidity}%`
        ).join("\n");
        
        // Cấu hình Model
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Prompt bắt buộc AI trả về JSON
        const prompt = `
            Đóng vai chuyên gia nông nghiệp. 
            Dựa trên vị trí tọa độ ${lat}, ${lng} và DỮ LIỆU THỜI TIẾT THỰC TẾ 5 ngày tới như sau:
            ${weatherSummary}

            Hãy phân tích:
            1. Đánh giá xu hướng thời tiết này có thuận lợi gieo trồng ngay không?
            2. Gợi ý 3 loại cây trồng ngắn ngày phù hợp nhất với thời tiết này.

            BẮT BUỘC trả về JSON mẫu (không markdown):
            {
                "analysis_text": "Nhận xét ngắn gọn về tình hình thời tiết...",
                "soil_guess": "Dự đoán loại đất (dựa trên vùng địa lý)",
                "crops": [
                    {"name": "Tên cây", "desc": "Lý do chọn (ngắn gọn)"}
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

        res.json({ success: true, data: {
                weather: dailyForecast, // Trả về mảng thời tiết để vẽ biểu đồ
                ai: data              // Trả về lời khuyên của AI
            } });

    } catch (error) {
        console.error("Lỗi AI:", error);
        res.status(500).json({ success: false, message: "Lỗi phân tích từ AI" });
    }
};