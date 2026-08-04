document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;

    const searchInput = document.getElementById('recordSearch');
    const list = document.getElementById('historyList');
    let recordsCache = [];

    function normalizeQuery(value) {
        return value.trim().toLowerCase();
    }

    function itemMatchesQuery(record, query) {
        const text = [
            record.tipo_registro,
            record.title,
            record.metric,
            String(record.value),
            new Date(record.created_at).toLocaleDateString('es-ES', { dateStyle: 'short' }),
            new Date(record.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return text.includes(query);
    }

    async function loadRecords() {
        try {
            const response = await backendFetch('data.php?limit=200&offset=0');
            const result = await response.json();
            if (!result.success) {
                list.innerHTML = `<div class="record-card"><strong>Error:</strong> ${result.error}</div>`;
                return [];
            }
            return result.data || [];
        } catch (error) {
            console.error('Error historial:', error);
            list.innerHTML = `<div class="record-card">Error cargando historial</div>`;
            return [];
        }
    }

    function createRecordCard(record) {
        const card = document.createElement('article');
        card.className = 'record-card';
        const isSugar = record.tipo_registro === 'Azúcar';
        const icon = isSugar ? 'fa-droplet' : 'fa-heart-pulse';
        const valor = isSugar ? `${record.value} mg/dL` : `${record.metric} mmHg`;
        const subtitle = isSugar ? `${record.metric === 'despues' ? 'Después de comer' : 'Ayunas'}` : `Pulso ${record.value} bpm`;
        card.innerHTML = `
            <div class="record-icon ${isSugar ? 'sugar' : 'pressure'}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="record-content">
                <strong>${valor}</strong>
                <div class="record-type">${record.tipo_registro}</div>
                <small>${subtitle}</small>
                <div class="record-footer">${new Date(record.created_at).toLocaleString('es-ES')}</div>
            </div>
        `;
        return card;
    }

    function renderSection(title, records, emptyMessage, typeClass) {
        const section = document.createElement('div');
        section.className = `record-section ${typeClass}`;
        const heading = document.createElement('div');
        heading.className = 'record-section-heading';
        heading.innerHTML = `
            <h2>${title}</h2>
            <span>${records.length} registro${records.length === 1 ? '' : 's'}</span>
        `;
        const container = document.createElement('div');
        container.className = 'record-list';
        if (records.length === 0) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'record-card record-card-empty';
            emptyCard.innerHTML = `<div><strong>${emptyMessage}</strong></div>`;
            container.appendChild(emptyCard);
        } else {
            records.forEach(record => container.appendChild(createRecordCard(record)));
        }
        section.appendChild(heading);
        section.appendChild(container);
        return section;
    }

    function renderHistory(records) {
        list.innerHTML = '';
        if (records.length === 0) {
            list.innerHTML = `
            <div class="record-card record-card-empty">
                <strong>No hay registros</strong>
            </div>`;
            return;
        }
        const sugarRecords = records.filter(r => r.tipo_registro === 'Azúcar');
        const pressureRecords = records.filter(r => r.tipo_registro === 'Presión');
        if (sugarRecords.length) list.appendChild(renderSection('Azúcar', sugarRecords, 'No hay datos de azúcar aún.', 'sugar'));
        if (pressureRecords.length) list.appendChild(renderSection('Presión', pressureRecords, 'No hay datos de presión aún.', 'pressure'));
        if (!sugarRecords.length && !pressureRecords.length) {
            list.innerHTML = `
            <div class="record-card record-card-empty">
                <strong>No hay registros</strong>
            </div>`;
        }
    }

    function applySearch(query) {
        const normalized = normalizeQuery(query);
        if (!normalized) {
            return recordsCache;
        }
        return recordsCache.filter(record => itemMatchesQuery(record, normalized));
    }

    async function refresh() {
        if (!recordsCache.length) {
            recordsCache = await loadRecords();
        }
        const filtered = applySearch(searchInput.value);
        renderHistory(filtered);
    }

    searchInput.addEventListener('input', refresh);
    refresh();
});
