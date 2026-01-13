// --- management.js ---

export function initManagement() {
    loadCrops();
}

async function loadCrops() {
    // ... Logic fetch list cũ ...
    const res = await fetch('http://localhost:3000/api/manager/list');
    const crops = await res.json();
    const tbody = document.getElementById('crop-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    crops.forEach(crop => {
        // Lưu ý: Nút onclick phải gọi window.func
        tbody.innerHTML += `
            <tr>
                <td><b>${crop.name}</b></td>
                <td>
                    <button class="btn-predict" onclick="predictYield(${crop.id})">Dự đoán</button>
                    <button class="btn-delete" onclick="deleteCrop(${crop.id})">Xóa</button>
                </td>
            </tr>
        `;
    });
}

export async function addCrop() {
    // ... Logic addCrop cũ ...
    const data = {
        name: document.getElementById('crop-name').value,
        area: document.getElementById('crop-area').value,
        // ...
    };
    await fetch('http://localhost:3000/api/manager/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    loadCrops();
}

export async function deleteCrop(id) {
    if(!confirm("Xóa?")) return;
    await fetch(`http://localhost:3000/api/manager/delete/${id}`, { method: 'DELETE' });
    loadCrops();
}

export async function predictYield(id) {
    // ... Logic predict cũ ...
    alert("Đang dự đoán cho ID: " + id);
}

// QUAN TRỌNG: Đẩy hàm ra ngoài window để nút bấm HTML gọi được
window.addCrop = addCrop;
window.deleteCrop = deleteCrop;
window.predictYield = predictYield;