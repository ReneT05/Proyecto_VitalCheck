document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventory-body');
    const totalCount = document.getElementById('total-count');
    const searchInput = document.getElementById('inventorySearchInput');
    const API_GLUCOSE = 'api/glucosa.php';
    const API_PRESSURE = 'api/presion.php';
    const DEFAULT_USER_ID = 1;

    let entries = [];

    function formatDate(value) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function renderTable(items) {
        if (!tableBody) return;
        totalCount.textContent = items.length;
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No hay registros disponibles.</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.type}</td>
                <td>${item.value}</td>
                <td>${item.estado}</td>
                <td>${item.observaciones || '-'}</td>
                <td>${formatDate(item.fecha)}</td>
            `;
            fragment.appendChild(tr);
        });

        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
    }

    function filterEntries(term) {
        const lower = term.toLowerCase();
        return entries.filter(item =>
            item.type.toLowerCase().includes(lower) ||
            item.estado.toLowerCase().includes(lower) ||
            (item.observaciones && item.observaciones.toLowerCase().includes(lower)) ||
            item.value.toLowerCase().includes(lower) ||
            formatDate(item.fecha).toLowerCase().includes(lower)
        );
    }

    async function fetchMeasurements(url) {
        const response = await fetch(`${url}?user_id=${DEFAULT_USER_ID}`);
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error en la respuesta de la API');
        }
        return data.data || [];
    }

    async function loadHistorial() {
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Cargando historial...</td></tr>';
        }
        try {
            const [glucosaData, presionData] = await Promise.all([
                fetchMeasurements(API_GLUCOSE),
                fetchMeasurements(API_PRESSURE)
            ]);

            const glucosaEntries = glucosaData.map(item => ({
                type: 'Glucosa',
                value: `${item.nivel_glucosa} mg/dL (${item.momento})`,
                estado: item.estado || '-',
                observaciones: item.observaciones,
                fecha: item.fecha_registro || item.fecha
            }));

            const presionEntries = presionData.map(item => ({
                type: 'Presión arterial',
                value: `${item.sistolica}/${item.diastolica} mmHg • pulso ${item.pulso}`,
                estado: item.estado || '-',
                observaciones: item.observaciones,
                fecha: item.fecha_registro || item.fecha
            }));

            entries = [...glucosaEntries, ...presionEntries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            renderTable(entries);
        } catch (error) {
            console.error('Error cargando historial:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
            }
            totalCount.textContent = '0';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function (event) {
            const term = event.target.value.trim();
            renderTable(term ? filterEntries(term) : entries);
        });
    }

    loadHistorial();
});
