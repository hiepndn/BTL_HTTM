const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
require('dotenv').config();


// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

// Import Routes
const authRoutes = require('./routes/authRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const managerRoutes = require('./routes/managerRoutes');

// Sử dụng Routes
app.use('/api/recommend', recommendRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/auth', authRoutes);

// Weather Proxy Route - Để giải quyết CORS issue từ n8n
app.get('/api/weather', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 5678,
        // Dùng webhook-test nếu bạn đang nhấn nút "Listen for test event"
        path: '/webhook-test/thoi-tiet', 
        method: 'GET' // Đảm bảo trùng với Method trong node Webhook n8n
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => {
            data += chunk;
        });
        proxyRes.on('end', () => {
            try {
                res.json(JSON.parse(data));
            } catch (err) {
                res.status(500).json({ error: 'Lỗi phân tích dữ liệu' });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.error('Weather API Error:', err.message);
        res.status(500).json({ error: 'Không thể lấy dữ liệu thời tiết', message: err.message });
    });

    proxyReq.end();
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});