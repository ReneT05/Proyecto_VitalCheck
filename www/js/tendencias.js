document.addEventListener('DOMContentLoaded', function () {
    const summaryCards = document.getElementById('summaryCards');
    const averageCards = document.getElementById('averageCards');
    const updatedAt = document.getElementById('updated-at');
    const API_GLUCOSE = 'api/glucosa.php';
    const API_PRESSURE = 'api/presion.php';
    const DEFAULT_USER_ID = 1;

    function formatDate(value) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function createCard(title, value, subtitle) {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML = `
            <article class="summary-card">
                <span>${title}</span>
                <strong>${value}</strong>
                <p style="margin: 0.75rem 0 0; color: #475569; font-size: 0.95rem;">${subtitle}</p>
            </article>
        `;
        return col;
    }

    function populateCards(glucosaData, presionData) {
        if (!summaryCards || !averageCards) return;
        summaryCards.innerHTML = '';
        averageCards.innerHTML = '';

        const latestGlucosa = glucosaData[0];
        const latestPresion = presionData[0];
        const totalGlucosa = glucosaData.length;
        const totalPresion = presionData.length;

        summaryCards.appendChild(createCard('Mediciones de glucosa', `${totalGlucosa}`, latestGlucosa ? `Última: ${formatDate(latestGlucosa.fecha_registro || latestGlucosa.fecha)}` : 'Sin registros'));
        summaryCards.appendChild(createCard('Mediciones de presión', `${totalPresion}`, latestPresion ? `Última: ${formatDate(latestPresion.fecha_registro || latestPresion.fecha)}` : 'Sin registros'));

        const avgGlucosa = totalGlucosa ? Math.round(glucosaData.reduce((acc, item) => acc + Number(item.nivel_glucosa), 0) / totalGlucosa) : 0;
        const avgSistolica = totalPresion ? Math.round(presionData.reduce((acc, item) => acc + Number(item.sistolica), 0) / totalPresion) : 0;
        const avgDiastolica = totalPresion ? Math.round(presionData.reduce((acc, item) => acc + Number(item.diastolica), 0) / totalPresion) : 0;
        const avgPulso = totalPresion ? Math.round(presionData.reduce((acc, item) => acc + Number(item.pulso), 0) / totalPresion) : 0;

        averageCards.appendChild(createCard('Promedio glucosa', `${avgGlucosa} mg/dL`, 'Valor promedio de glucosa'));
        averageCards.appendChild(createCard('Promedio presión', `${avgSistolica}/${avgDiastolica} mmHg`, 'Presión arterial promedio'));
        averageCards.appendChild(createCard('Promedio pulso', `${avgPulso} lpm`, 'Pulso promedio registrado'));
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

    async function loadTrends() {
        try {
            const [glucosaData, presionData] = await Promise.all([
                fetchMeasurements(API_GLUCOSE),
                fetchMeasurements(API_PRESSURE)
            ]);
            populateCards(glucosaData, presionData);
            if (updatedAt) {
                updatedAt.textContent = new Date().toLocaleString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
        } catch (error) {
            console.error('Error cargando tendencias:', error);
            if (summaryCards) {
                summaryCards.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            }
        }
    }

    loadTrends();
});
