const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

// Import Routes
const recommendRoutes = require('./routes/recommendRoutes');

// Sử dụng Routes
app.use('/api/recommend', recommendRoutes);

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});