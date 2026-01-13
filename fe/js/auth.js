// --- auth.js ---
export let isLoginMode = true;

// Kiểm tra trạng thái đăng nhập
export function checkLoginStatus() {
    const user = localStorage.getItem('user_info');
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    
    if (user) {
        if(authScreen) authScreen.style.display = 'none';
        if(mainApp) mainApp.style.display = 'flex';
        
        const userData = JSON.parse(user);
        document.getElementById('user-display').innerText = `Xin chào, ${userData.username}`;
        return true; // Đã login
    } else {
        if(authScreen) authScreen.style.display = 'flex';
        if(mainApp) mainApp.style.display = 'none';
        return false; // Chưa login
    }
}

export function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    // ... (Giữ nguyên logic DOM update text) ...
    const title = document.getElementById('auth-title');
    const btn = document.querySelector('.auth-box button');
    const switchText = document.getElementById('switch-text');
    const link = document.querySelector('.auth-switch a');
    const errorMsg = document.getElementById('auth-error');

    errorMsg.style.display = 'none';

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

export async function handleAuth() {
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
                localStorage.setItem('user_info', JSON.stringify(data.user));
                // Reload trang để main.js chạy lại từ đầu
                location.reload(); 
            } else {
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

export function logout() {
    if(confirm("Bạn có muốn đăng xuất?")) {
        localStorage.removeItem('user_info');
        location.reload();
    }
}

// Gán vào window để HTML onclick gọi được
window.toggleAuthMode = toggleAuthMode;
window.handleAuth = handleAuth;
window.logout = logout;