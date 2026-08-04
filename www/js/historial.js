const STORAGE_KEY = 'ViatlcheckRecords';

function loadRecords() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function formatHeader(record) {
    return record.type === 'sugar'
        ? `Azúcar ${record.value} mg/dL`
        : `Presión ${record.systolic}/${record.diastolic} mmHg`;
}

function renderHistory(filter = '') {
    const records = loadRecords().sort((a, b) => b.timestamp - a.timestamp);
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    const normalized = filter.trim().toLowerCase();
    const filtered = records.filter(record => {
        const header = formatHeader(record).toLowerCase();
        const meal = record.type === 'sugar' ? (record.meal === 'despues' ? 'después de comer' : 'ayunas') : '';
        const timestamp = new Date(record.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).toLowerCase();
        return header.includes(normalized) || meal.includes(normalized) || timestamp.includes(normalized);
    });
    if (!filtered.length) {
        list.innerHTML = '<div class="record-card"><div class="record-content"><strong>No se encontraron registros</strong><small>Prueba con otro término de búsqueda.</small></div></div>';
        return;
    }
    filtered.forEach(record => {
        const card = document.createElement('article');
        card.className = 'record-card';
        card.innerHTML = `
            <div class="record-icon ${record.type}"><i class="fas ${record.type === 'sugar' ? 'fa-droplet' : 'fa-heart-pulse'}"></i></div>
            <div class="record-content">
                <strong>${record.type === 'sugar' ? `${record.value} mg/dL` : `${record.systolic}/${record.diastolic} mmHg`}</strong>
                <div>${record.type === 'pressure' ? `Pulso ${record.pulse} lpm` : (record.meal === 'despues' ? 'Después de comer' : 'Ayunas')}</div>
                <div class="record-footer">${new Date(record.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
        `;
        list.appendChild(card);
    });
}

function initPage() {
    const searchInput = document.getElementById('recordSearch');
    renderHistory();
    searchInput.addEventListener('input', () => renderHistory(searchInput.value));
}

document.addEventListener('DOMContentLoaded', initPage);
document.addEventListener('deviceready', initPage);
