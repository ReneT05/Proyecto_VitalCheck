function loadRecords() {
    try {
        const stored = localStorage.getItem('ViatlcheckRecords');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function renderHome() {
    const records = loadRecords().sort((a, b) => b.timestamp - a.timestamp);
    const lastRecord = records[0];
    const title = document.getElementById('lastRecordTitle');
    const value = document.getElementById('lastRecordValue');
    const note = document.getElementById('lastRecordNote');
    const list = document.getElementById('recentList');

    if (lastRecord) {
        title.textContent = lastRecord.type === 'sugar' ? 'Último azúcar' : 'Última presión';
        value.textContent = lastRecord.type === 'sugar'
            ? `${lastRecord.value} mg/dL`
            : `${lastRecord.systolic}/${lastRecord.diastolic} mmHg`;
        note.textContent = `Registrado el ${new Date(lastRecord.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}`;
    } else {
        title.textContent = 'Sin registros aún';
        value.textContent = '';
        note.textContent = 'Registra tu primer dato tocando uno de los botones grandes.';
    }

    list.innerHTML = '';
    if (records.length === 0) {
        list.innerHTML = '<div class="history-item"><div><strong>No hay registros</strong><small>Registra tu primer dato para ver el historial.</small></div></div>';
        return;
    }

    records.slice(0, 3).forEach(record => {
        const item = document.createElement('article');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="icon-box ${record.type}"><i class="fas ${record.type === 'sugar' ? 'fa-droplet' : 'fa-heart-pulse'}"></i></div>
            <div>
                <strong>${record.type === 'sugar' ? `${record.value} mg/dL` : `${record.systolic}/${record.diastolic} mmHg`}</strong>
                <small>${new Date(record.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </div>
        `;
        list.appendChild(item);
    });
}

function attachLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;
    logoutButton.addEventListener('click', () => {
        clearAppToken();
        window.location.href = 'login.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (requireLogin()) {
        renderHome();
        attachLogout();
    }
});

document.addEventListener('deviceready', () => {
    if (requireLogin()) {
        renderHome();
        attachLogout();
    }
});
