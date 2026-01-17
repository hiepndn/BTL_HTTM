// --- LOGIC AUTHENTICATION (Đăng nhập/Đăng ký) ---
let isLoginMode = true; // Mặc định là chế độ đăng nhập

// 1. Kiểm tra xem đã đăng nhập chưa khi mới vào web
function checkLoginStatus() {
    const user = localStorage.getItem('user_info');
    if (user) {
        // Đã đăng nhập -> Hiện App, Ẩn Login
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex'; // Flex để chia cột sidebar
        
        const userData = JSON.parse(user);
        document.getElementById('user-display').innerText = `Xin chào, ${userData.username}`;
        
        // Khởi chạy App
        initMenu();
        loadModule('dashboard');
    } else {
        // Chưa đăng nhập -> Hiện Login
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
}

// 2. Chuyển đổi giữa Đăng nhập <-> Đăng ký
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.querySelector('.auth-box button');
    const switchText = document.getElementById('switch-text');
    const link = document.querySelector('.auth-switch a');
    const errorMsg = document.getElementById('auth-error');

    errorMsg.style.display = 'none'; // Xóa lỗi cũ

    if (isLoginMode) {
        title.innerText = "Đăng nhập Nông Trại";
        btn.innerText = "Đăng nhập";
        switchText.innerText = "Chưa có tài khoản?";
        link.innerText = "Đăng ký ngay";
    } else {
        title.innerText = "Đăng ký Tài khoản";
        btn.innerText = "Đăng ký";
        switchText.innerText = "Đã có tài khoản?";
        link.innerText = "Đăng nhập ngay";
    }
}

// 3. Xử lý khi bấm nút (Gọi API)
async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('auth-error');

    if (!username || !password) {
        errorMsg.innerText = "Vui lòng nhập đầy đủ thông tin!";
        errorMsg.style.display = 'block';
        return;
    }

    const endpoint = isLoginMode ? '/login' : '/register';
    const apiUrl = `http://localhost:3000/api/auth${endpoint}`;

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            if (isLoginMode) {
                // Đăng nhập thành công -> Lưu vào LocalStorage
                localStorage.setItem('user_info', JSON.stringify(data.user));
                checkLoginStatus(); // Vào app
            } else {
                // Đăng ký thành công -> Chuyển sang form đăng nhập
                alert("Đăng ký thành công! Hãy đăng nhập.");
                toggleAuthMode();
            }
        } else {
            errorMsg.innerText = data.message;
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        errorMsg.innerText = "Lỗi kết nối Server!";
        errorMsg.style.display = 'block';
    }
}

// 4. Đăng xuất
function logout() {
    if(confirm("Bạn có muốn đăng xuất?")) {
        localStorage.removeItem('user_info');
        location.reload(); // Tải lại trang để về màn hình login
    }
}

// --- KHỞI CHẠY ---
// Thay thế đoạn gọi initMenu() cũ ở cuối file bằng dòng này:
checkLoginStatus();

// Cấu hình: Màn hình mặc định và trạng thái đã tải hay chưa
const modules = {
    'dashboard': { loaded: false, file: 'components/dashboard.html' },
    'recommendation': { loaded: false, file: 'components/recommendation.html' },
    'diagnosis': { loaded: false, file: 'components/diagnosis.html' },
    'management': { loaded: false, file: 'components/management.html' },
    'youtube': { loaded: false, file: 'components/youtube.html' }
};

const container = document.getElementById('content-app');

// --- HÀM TẢI MODULE (Đã sửa để kích hoạt Map) ---
async function loadModule(moduleName) {
    // 1. TRƯỜNG HỢP ĐÃ TẢI RỒI (Chỉ hiển thị lại)
    if (modules[moduleName].loaded) {
        showSection(moduleName);
        
        // 🔴 QUAN TRỌNG: Nếu là tab recommendation thì phải vẽ lại map (hoặc resize)
        if (moduleName === 'recommendation') {
            initRecommendationMap();
        }
        if (moduleName === 'management') {
            initManagement();
        }
        if (moduleName === 'youtube') initYoutube();
        return;
    }

    // 2. TRƯỜNG HỢP CHƯA TẢI (Tải từ server về)
    try {
        console.log(`Đang tải file từ server: ${moduleName}...`);
        const response = await fetch(modules[moduleName].file);
        if (!response.ok) throw new Error("Lỗi tải file");
        
        const html = await response.text();
        
        // Tạo wrapper bọc nội dung
        const wrapper = document.createElement('div');
        wrapper.id = `wrapper-${moduleName}`;
        wrapper.innerHTML = html;
        container.appendChild(wrapper);

        // Đánh dấu đã tải xong
        modules[moduleName].loaded = true;
        
        showSection(moduleName);

        // 🔴 QUAN TRỌNG: Nếu vừa tải xong tab recommendation thì khởi tạo Map ngay
        if (moduleName === 'recommendation') {
            // Delay nhẹ 100ms để HTML kịp render vào DOM
            setTimeout(() => {
                initRecommendationMap();
            }, 100);
        }
        if (moduleName === 'management') {
            setTimeout(() => {
                initManagement(); 
            }, 100);
        }
        if (moduleName === 'youtube') {
            setTimeout(() => {
                initYoutube(); 
            }, 100);
        }

    } catch (err) {
        console.error("Không thể tải module:", err);
    }
}

// Hàm chỉ hiển thị màn hình mong muốn và ẩn các màn khác
function showSection(targetId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => {
        // Lưu ý: ID của section trong file HTML con phải khớp với moduleName (recommendation, dashboard...)
        // Nếu trong file recommendation.html bạn để id="recommendation" thì code này chạy đúng.
        if (s.id === targetId) {
            s.style.display = 'block';
        } else {
            s.style.display = 'none';
        }
    });
}

// Hàm khởi tạo các nút bấm Menu
function initMenu() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.onclick = function() {
            const targetId = this.getAttribute('data-target');

            // Đổi màu menu active
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            loadModule(targetId);
        };
    });
}

// ---------------------------------------------------------
// LOGIC MAP & AI (Giữ nguyên logic của bạn, chỉ tối ưu nhẹ)
// ---------------------------------------------------------

let mapInstance = null;
let markerInstance = null;

function initRecommendationMap() {
    // Kiểm tra div map có tồn tại không
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    // Nếu map đã có rồi -> Chỉ cần resize lại để tránh lỗi xám bản đồ
    if (mapInstance) {
        setTimeout(() => { mapInstance.invalidateSize(); }, 200);
        return;
    }

    // Khởi tạo mới
    console.log("Khởi tạo Leaflet Map...");
    mapInstance = L.map('map').setView([21.0285, 105.8542], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Sự kiện click
    mapInstance.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (markerInstance) mapInstance.removeLayer(markerInstance);
        markerInstance = L.marker([lat, lng]).addTo(mapInstance);

        await callBackendAI(lat, lng);
    });

    // Fix lỗi hiển thị lần đầu
    setTimeout(() => { mapInstance.invalidateSize(); }, 200);
}

// Hàm gọi API Backend
async function callBackendAI(lat, lng) {
    const loadingEl = document.getElementById('loading');
    const resultEl = document.getElementById('result-content');
    const placeholderEl = document.getElementById('placeholder');

    if(loadingEl) loadingEl.style.display = 'block';
    if(resultEl) resultEl.style.display = 'none';
    if(placeholderEl) placeholderEl.style.display = 'none';

    try {
        // Gọi xuống server đang chạy ở port 3000
        const response = await fetch('http://localhost:3000/api/recommend/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
        });

        const resData = await response.json();

        if (resData.success) {
            displayAIResult(resData.data);
        } else {
            alert("Lỗi từ AI: " + (resData.message || "Không xác định"));
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối Server! Hãy chắc chắn bạn đã chạy 'node server.js' ở thư mục be.");
    } finally {
        if(loadingEl) loadingEl.style.display = 'none';
    }
}

function displayAIResult(fullData) {
    const weatherData = fullData.weather; // Mảng 5 ngày
    const aiData = fullData.ai;           // Dữ liệu AI phân tích

    const resultEl = document.getElementById('result-content');
    if(resultEl) resultEl.style.display = 'block';

    // 1. Hiển thị Dự báo thời tiết (Vẽ HTML cho 5 ô)
    const weatherGrid = document.getElementById('weather-grid');
    weatherGrid.innerHTML = ''; // Xóa cũ
    
    weatherData.forEach(day => {
        const date = new Date(day.dt * 1000); // Đổi timestamp sang ngày
        const dayName = `${date.getDate()}/${date.getMonth()+1}`;
        const iconCode = day.weather[0].icon;
        const temp = Math.round(day.main.temp);
        
        weatherGrid.innerHTML += `
            <div class="weather-card">
                <div class="w-date">${dayName}</div>
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" width="40">
                <div class="w-temp">${temp}°C</div>
                <div class="w-desc">${day.weather[0].description}</div>
            </div>
        `;
    });

    // 2. Hiển thị thông tin AI
    document.getElementById('res-analysis').innerText = aiData.analysis_text || "Không có đánh giá";
    document.getElementById('res-soil').innerText = aiData.soil_guess || "Chưa xác định";

    // 3. Hiển thị cây trồng
    const listDiv = document.getElementById('crop-list');
    listDiv.innerHTML = '';
    
    if (aiData.crops && aiData.crops.length > 0) {
        aiData.crops.forEach(crop => {
            listDiv.innerHTML += `
                <div class="crop-item" style="border-left: 4px solid #2ecc71; padding: 10px; margin-bottom: 8px; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <strong style="color: #27ae60;">${crop.name}</strong>
                    <p style="margin: 4px 0 0; font-size: 0.9em; color: #555;">${crop.desc}</p>
                </div>
            `;
        });
    }
}

// --- LOGIC QUẢN LÝ (MANAGEMENT) ---

function initManagement() {
    loadCrops(); // Tải danh sách ngay khi vào tab
}

// 1. Lấy danh sách từ Server
async function loadCrops() {
    const userStr = localStorage.getItem('user_info');
    if (!userStr) return; // Chưa đăng nhập thì thôi
    const user = JSON.parse(userStr);
    const userId = user.id; // 👈 Lấy ID user (lưu ý: lúc login backend phải trả về id nhé)

    // 2. Gửi userId lên server qua query param (?userId=...)
    const res = await fetch(`http://localhost:3000/api/manager/list?userId=${userId}`);
    const crops = await res.json();
    
    const tbody = document.getElementById('crop-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    crops.forEach(crop => {
        tbody.innerHTML += `
            <tr>
                <td><b>${crop.name}</b></td>
                <td>${crop.start_date}</td>
                <td>${crop.area} ha</td>
                <td><span style="color:green">N:${crop.n_index}</span> - P:${crop.p_index} - K:${crop.k_index}</td>
                <td>${crop.expected_yield}</td>
                <td style="color: #d35400; font-weight: bold;">${crop.ai_prediction || 'Chưa dự đoán'}</td>
                <td>
                    <button type="button" class="btn-predict" onclick="predictYield(${crop.id}, '${crop.name}', ${crop.area}, ${crop.n_index}, ${crop.p_index}, ${crop.k_index})"> Dự đoán</button>
                    <button class="btn-delete" onclick="deleteCrop(${crop.id})">🗑 Xóa</button>
                </td>
            </tr>
        `;
    });
}

// 2. Thêm mới
async function addCrop() {
    const user = JSON.parse(localStorage.getItem('user_info'));
    const data = {
        user_id: user.id,
        name: document.getElementById('crop-name').value,
        area: document.getElementById('crop-area').value,
        start_date: document.getElementById('crop-date').value,
        expected: document.getElementById('crop-yield').value,
        n: document.getElementById('n-val').value,
        p: document.getElementById('p-val').value,
        k: document.getElementById('k-val').value
    };

    if(!data.name || !data.area) return alert("Vui lòng nhập tên và diện tích!");

    await fetch('http://localhost:3000/api/manager/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    // Reset form và tải lại bảng
    document.getElementById('crop-name').value = '';
    loadCrops();
}

// 3. Xóa
async function deleteCrop(id) {
    if(!confirm("Bạn chắc chắn muốn xóa?")) return;
    await fetch(`http://localhost:3000/api/manager/delete/${id}`, { method: 'DELETE' });
    loadCrops();
}

// 4. Gọi AI Dự đoán
async function predictYield(id, name, area, n, p, k) {
    // Hiện loading tạm thời
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "⏳ Đang tính...";
    btn.disabled = true;

    try {
        const res = await fetch('http://localhost:3000/api/manager/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, area, n, p, k })
        });
        const data = await res.json();
        
        if(data.success) {
            alert(`AI Dự đoán: ${data.prediction}`);
            loadCrops(); // Load lại bảng để hiện kết quả lưu trong DB
        } else {
            alert("Lỗi AI");
        }
    } catch(e) {
        console.error(e);
        alert("Lỗi kết nối");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// LOGIC YOUTUBE (Dán xuống cuối main.js)
// ==========================================

const YOUTUBE_API_KEY = 'đã ẩn';

function initYoutube() {
    console.log("Youtube Tab Loaded");
    // Bắt sự kiện phím Enter
    const input = document.getElementById('yt-keyword');
    if (input) {
        input.onkeypress = function(e) {
            if (e.key === "Enter") handleSearch('guide');
        };
    }
}

async function handleSearch(type) {
    const input = document.getElementById('yt-keyword');
    const query = input.value.trim();
    
    if (!query) {
        alert("Vui lòng nhập tên cây!");
        return;
    }

    let keyword = query;
    let guideText = "";

    // Tùy chỉnh từ khóa tìm kiếm cho chuẩn xác
    if (type === 'guide') {
        keyword = `Cách trồng cây ${query} hiệu quả`;
        guideText = `Video hướng dẫn kỹ thuật trồng <b>${query}</b>:`;
    } else {
        keyword = `Giới thiệu đặc điểm cây ${query}`;
        guideText = `Thông tin tổng quan về <b>${query}</b>:`;
    }

    // Hiển thị box hướng dẫn
    const textInst = document.getElementById('yt-text-instruction');
    const contentInst = document.getElementById('instruction-content');
    if (textInst && contentInst) {
        textInst.style.display = 'block';
        contentInst.innerHTML = guideText;
    }

    await callYoutubeAPI(keyword);
}

async function callYoutubeAPI(keyword) {
    const loading = document.getElementById('yt-loading');
    const resultsDiv = document.getElementById('yt-results');
    
    if(loading) loading.style.display = 'block';
    if(resultsDiv) resultsDiv.innerHTML = '';

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&q=${encodeURIComponent(keyword)}&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if(loading) loading.style.display = 'none';

        if (data.error) {
            console.error(data.error);
            alert("Lỗi API Youtube: " + data.error.message);
            return;
        }

        if (!data.items || data.items.length === 0) {
            resultsDiv.innerHTML = '<p>Không tìm thấy video nào.</p>';
            return;
        }

        // Vẽ video ra màn hình
        data.items.forEach(item => {
            const videoId = item.id.videoId;
            const snip = item.snippet;
            
            const div = document.createElement('div');
            div.className = 'video-card';
            div.onclick = function() {
                window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            };

            div.innerHTML = `
                <img src="${snip.thumbnails.medium.url}" class="video-thumb">
                <div class="video-info">
                    <div class="video-title">${snip.title}</div>
                    <div style="font-size: 0.8em; color: #666">👤 ${snip.channelTitle}</div>
                </div>
            `;
            resultsDiv.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        if(loading) loading.style.display = 'none';
        alert("Lỗi kết nối!");
    }
}

// --- KHỞI CHẠY ---
initMenu();
loadModule('dashboard'); // Mặc định vào dashboard trước