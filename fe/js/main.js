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

function displayAIResult(data) {
    const resultEl = document.getElementById('result-content');
    if(resultEl) resultEl.style.display = 'block';
    
    document.getElementById('res-climate').innerText = data.climate || "Không rõ";
    document.getElementById('res-temp').innerText = data.temp || "--";
    document.getElementById('res-soil').innerText = data.soil || "Không rõ";

    const listDiv = document.getElementById('crop-list');
    listDiv.innerHTML = '';
    
    if (data.crops && data.crops.length > 0) {
        data.crops.forEach(crop => {
            listDiv.innerHTML += `
                <div class="crop-item" style="border-left: 3px solid green; padding-left: 10px; margin-bottom: 10px; background: #fff;">
                    <strong>${crop.name}</strong>
                    <p style="margin: 0; font-size: 0.9em; color: #666;">${crop.desc}</p>
                </div>
            `;
        });
    } else {
        listDiv.innerHTML = "<p>Không có gợi ý phù hợp.</p>";
    }
}

// --- KHỞI CHẠY ---
initMenu();
loadModule('dashboard'); // Mặc định vào dashboard trước