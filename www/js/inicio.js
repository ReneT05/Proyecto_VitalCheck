async function fetchLatestRecords() {
    const response = await backendFetch('data.php?limit=3&offset=0');
    if (!response) return [];
    const result = await response.json();
    if (!result.success) return [];
    return result.data;
}

function renderHome(records) {
    const title = document.getElementById('lastRecordTitle');
    const value = document.getElementById('lastRecordValue');
    const note = document.getElementById('lastRecordNote');
    const list = document.getElementById('recentList');

    if (records.length) {
        const lastRecord = records[0];
        const isSugar = lastRecord.title === 'Azúcar';
        title.textContent = isSugar ? 'Último azúcar' : 'Última presión';
        value.textContent = isSugar
            ? `${lastRecord.value} mg/dL`
            : `${lastRecord.metric} mmHg`;
        note.textContent = `Registrado el ${new Date(lastRecord.created_at).toLocaleDateString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}`;
        list.innerHTML = '';
        records.forEach(record => {
            const item = document.createElement('article');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="icon-box ${record.title === 'Azúcar' ? 'sugar' : 'pressure'}"><i class="fas ${record.title === 'Azúcar' ? 'fa-droplet' : 'fa-heart-pulse'}"></i></div>
                <div>
                    <strong>${record.title === 'Azúcar' ? `${record.value} mg/dL` : `${record.metric} mmHg`}</strong>
                    <small>${new Date(record.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>
                </div>
            `;
            list.appendChild(item);
        });
    } else {
        title.textContent = 'Sin registros aún';
        value.textContent = '';
        note.textContent = 'Registra tu primer dato tocando uno de los botones grandes.';
        list.innerHTML = '<div class="history-item"><div><strong>No hay registros</strong><small>Registra tu primer dato para ver el historial.</small></div></div>';
    }
}

function attachLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;
    logoutButton.addEventListener('click', () => {
        clearAppToken();
        // Login removed — recargar la página en lugar de redirigir a login
        window.location.reload();
    });
}

async function initHome() {
    attachLogout();
    const records = await fetchLatestRecords();
    renderHome(records);
}

document.addEventListener('DOMContentLoaded', async () => {
    if (requireLogin()) {
        await initHome();
    }
});

document.addEventListener('deviceready', async () => {
    if (requireLogin()) {
        await initHome();
    }
});
