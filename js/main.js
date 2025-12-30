// Cấu hình: Màn hình mặc định và trạng thái đã tải hay chưa
const modules = {
    'dashboard': { loaded: false, file: 'components/dashboard.html' },
    'recommendation': { loaded: false, file: 'components/recommendation.html' },
    'diagnosis': { loaded: false, file: 'components/diagnosis.html' },
    'management': { loaded: false, file: 'components/management.html' },
    'youtube': { loaded: false, file: 'components/youtube.html' }
};

const container = document.getElementById('content-app');

// Hàm tải nội dung của một module cụ thể
async function loadModule(moduleName) {
    // Nếu đã tải rồi thì chỉ việc hiển thị, không tải lại nữa
    if (modules[moduleName].loaded) {
        showSection(moduleName);
        return;
    }

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

    } catch (err) {
        console.error("Không thể tải module:", err);
    }
}

// Hàm chỉ hiển thị màn hình mong muốn và ẩn các màn khác
function showSection(targetId) {
    // Tìm tất cả các section thực tế đã được add vào DOM
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => {
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

            // Gọi hàm tải module (Nếu tải rồi nó sẽ tự hiện, chưa thì fetch)
            loadModule(targetId);
        };
    });
}

// --- KHI VÀO TRANG HOẶC RELOAD ---
// 1. Gán sự kiện cho Menu
initMenu();

// 2. Chỉ load duy nhất màn hình Dashboard lúc khởi đầu
loadModule('dashboard');