// be/controllers/authController.js
const openDb = require('../database');
const bcrypt = require('bcryptjs');

// 1. Đăng ký
exports.register = async (req, res) => {
    const { username, password } = req.body;
    const db = await openDb();

    // Kiểm tra user tồn tại chưa
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (existingUser) {
        return res.json({ success: false, message: "Tài khoản đã tồn tại!" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào DB
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    
    res.json({ success: true, message: "Đăng ký thành công!" });
};

// 2. Đăng nhập
exports.login = async (req, res) => {
    const { username, password } = req.body;
    const db = await openDb();

    // Tìm user
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        return res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    }

    // Trả về info (bỏ qua password)
    res.json({ success: true, user: { id: user.id, username: user.username } });
};