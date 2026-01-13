// --- recommendation.js ---
let mapInstance = null;
let markerInstance = null;

export function initRecommendationMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    if (mapInstance) {
        setTimeout(() => { mapInstance.invalidateSize(); }, 200);
        return;
    }

    // Khởi tạo Map
    mapInstance = L.map('map').setView([21.0285, 105.8542], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    mapInstance.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (markerInstance) mapInstance.removeLayer(markerInstance);
        markerInstance = L.marker([lat, lng]).addTo(mapInstance);

        await callBackendAI(lat, lng);
    });

    setTimeout(() => { mapInstance.invalidateSize(); }, 200);
}

async function callBackendAI(lat, lng) {
    // ... (Giữ nguyên logic call API của bạn) ...
    // Code hiển thị kết quả AI displayAIResult...
    // Vì dài nên mình viết tắt, bạn copy code cũ vào đây nhé
    // Nhớ đổi tên hàm displayAIResult thành function thường
    
    // Ví dụ đoạn fetch:
    try {
        const response = await fetch('http://localhost:3000/api/recommend/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
        });
        const resData = await response.json();
        if (resData.success) displayAIResult(resData.data);
    } catch (e) { console.error(e); }
}

function displayAIResult(data) {
    // ... Logic render HTML kết quả cũ của bạn ...
    const resultEl = document.getElementById('result-content');
    if(resultEl) resultEl.style.display = 'block';
    // ...
}