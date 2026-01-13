nếu có be thì chạy be trước: 
- B1: cd be
- B2: npm i để tải đủ các package cần thiết
- B3: node server.js

tại đang tách ra 2 folder nên muốn chạy giao diện mà đang dùng extendsion go live của vscode thì phải mở thêm 1 cửa sổ của vs và vào thẳng folder fe thì ms run đc giao diện vì chạy go live sẽ mặc định tìm file index để chạy đầu


===========================================================================================================
Trong file frontend/components/recommendation.html (hoặc file JS tương ứng), đổi URL gọi API thành:
// Cấu trúc: Domain + Tiền tố khai báo ở server.js + Đường dẫn trong file routes
const API_URL = "http://localhost:3000/api/recommend/analyze";