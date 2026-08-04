document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;
    const searchInput = document.getElementById('recordSearch');
    const list = document.getElementById('historyList');

    async function fetchRecords(query = '') {
        const encodedQuery = encodeURIComponent(query);
        const response = await backendFetch(`api/data.php?q=${encodedQuery}&limit=50&offset=0`);
        if (!response) return [];
        const result = await response.json();
        if (!result.success) {
            list.innerHTML = `<div class="record-card"><div class="record-content"><strong>Error:</strong> ${result.error}</div></div>`;
            return [];
        }
        return result.data;
    }

    function renderHistory(records) {
        list.innerHTML = '';
        if (!records.length) {
            list.innerHTML = '<div class="record-card"><div class="record-content"><strong>No se encontraron registros</strong><small>Prueba con otro término de búsqueda.</small></div></div>';
            return;
        }
        records.forEach(record => {
            const card = document.createElement('article');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="record-icon ${record.title === 'Azúcar' ? 'sugar' : 'pressure'}"><i class="fas ${record.title === 'Azúcar' ? 'fa-droplet' : 'fa-heart-pulse'}"></i></div>
                <div class="record-content">
                    <strong>${record.title === 'Azúcar' ? `${record.value} mg/dL` : record.metric}</strong>
                    <div>${record.title === 'Azúcar' ? (record.metric === 'despues' ? 'Después de comer' : 'Ayunas') : `Pulso ${record.value} lpm`}</div>
                    <div class="record-footer">${new Date(record.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    async function refresh(query = '') {
        const records = await fetchRecords(query);
        renderHistory(records);
    }

    searchInput.addEventListener('input', () => refresh(searchInput.value));
    refresh();
});

document.addEventListener('deviceready', () => {
    if (!requireLogin()) return;
});
