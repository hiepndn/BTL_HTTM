const openDb = require('../database');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// 👇 Dùng đúng model mà tài khoản bạn được cấp phép
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// 1. Lấy danh sách
exports.getAllCrops = async (req, res) => {
    const db = await openDb();
    const crops = await db.all('SELECT * FROM crops ORDER BY id DESC');
    res.json(crops);
};

// 2. Thêm mới
exports.addCrop = async (req, res) => {
    const { name, start_date, area, n, p, k, expected } = req.body;
    const db = await openDb();
    await db.run(
        `INSERT INTO crops (name, start_date, area, n_index, p_index, k_index, expected_yield, ai_prediction) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, start_date, area, n, p, k, expected, "Chưa dự đoán"]
    );
    res.json({ success: true });
};

// 3. Xóa
exports.deleteCrop = async (req, res) => {
    const { id } = req.params;
    const db = await openDb();
    await db.run('DELETE FROM crops WHERE id = ?', id);
    res.json({ success: true });
};

// 4. AI Dự đoán năng suất
exports.predictYield = async (req, res) => {
    const { id, name, area, n, p, k } = req.body;
    
    try {
        const prompt = `
            Đóng vai kỹ sư nông nghiệp.
            Dựa trên thông số đất: Cây trồng: ${name}, Diện tích: ${area} ha.
            Chỉ số NPK: Nitơ=${n}, Phốt pho=${p}, Kali=${k}.
            Hãy dự đoán sản lượng thu hoạch (tấn/ha) và tổng sản lượng.
            
            CHỈ TRẢ VỀ JSON mẫu (không markdown):
            { "prediction": "Khoảng 15-20 tấn (Lý do: Đất giàu đạm...)" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(text);

        // Lưu kết quả AI vào Database luôn
        const db = await openDb();
        await db.run('UPDATE crops SET ai_prediction = ? WHERE id = ?', [data.prediction, id]);

        res.json({ success: true, prediction: data.prediction });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi AI" });
    }
};