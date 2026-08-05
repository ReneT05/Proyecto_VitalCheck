document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;
    const normalCount = document.getElementById('normalCount');
    const elevatedCount = document.getElementById('elevatedCount');
    const criticalCount = document.getElementById('criticalCount');
    const sugarChart = document.getElementById('sugarChart');
    const pressureChart = document.getElementById('pressureChart');
    const recentList = document.getElementById('recentTrendList');
    const reportSummary = document.getElementById('reportSummary');
    const whatsappShare = document.getElementById('whatsappShare');
    const emailShare = document.getElementById('emailShare');

    function evaluateGlucose(value, meal) {
        const numeric = Number(value);
        if (meal === 'despues') {
            if (numeric <= 139) return { status: 'green' };
            if (numeric <= 199) return { status: 'yellow' };
            return { status: 'red' };
        }
        if (numeric < 70) return { status: 'red' };
        if (numeric <= 99) return { status: 'green' };
        if (numeric <= 125) return { status: 'yellow' };
        return { status: 'red' };
    }

    function evaluatePressure(systolic, diastolic) {
        const sys = Number(systolic);
        const dia = Number(diastolic);
        if (sys <= 90 || dia <= 60) return { status: 'yellow' };
        if (sys <= 120 && dia <= 80) return { status: 'green' };
        if (sys <= 139 || dia <= 89) return { status: 'yellow' };
        return { status: 'red' };
    }

    function countByStatus(records) {
        return records.reduce((acc, record) => {
            const status = record.title === 'Azúcar'
                ? evaluateGlucose(record.value, record.metric).status
                : evaluatePressure(record.metric.split('/')[0], record.metric.split('/')[1]).status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { green: 0, yellow: 0, red: 0 });
    }

    function groupTrend(records, type) {
        const filtered = records.filter(r => type === 'sugar' ? r.title === 'Azúcar' : r.title === 'Presión')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const slice = filtered.slice(-10);
        return slice.map(record => ({
            label: new Date(record.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            value: type === 'sugar'
                ? Number(record.value)
                : (Number(record.metric.split('/')[0]) + Number(record.metric.split('/')[1])) / 2
        }));
    }

    function renderSvgLine(container, points, color) {
        if (!container) return;
        if (!points.length) {
            container.innerHTML = '<div class="empty-chart">No hay datos suficientes</div>';
            return;
        }
        const width = 320;
        const height = 180;
        const values = points.map(p => p.value);
        const max = Math.max(...values) * 1.1;
        const min = Math.min(...values) * 0.9;
        const range = max - min || 1;
        const gap = width / Math.max(points.length - 1, 1);
        const path = points.map((point, index) => {
            const x = index * gap;
            const y = height - ((point.value - min) / range) * (height - 20) - 10;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join(' ');
        const circles = points.map((point, index) => {
            const x = index * gap;
            const y = height - ((point.value - min) / range) * (height - 20) - 10;
            return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" fill="${color}" />`;
        }).join('');
        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
                <defs>
                    <linearGradient id="grad-${color}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.3" />
                        <stop offset="100%" stop-color="${color}" stop-opacity="0.03" />
                    </linearGradient>
                </defs>
                <path d="${path}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <path d="${path} L ${width} ${height} L 0 ${height} Z" fill="url(#grad-${color})" opacity="0.7" />
                ${circles}
            </svg>
        `;
    }

    function buildRecordLabel(record) {
        if (record.title === 'Azúcar') {
            return `${record.value} mg/dL (${record.metric === 'despues' ? 'Después de comer' : 'Ayunas'})`;
        }
        return `${record.metric} · Pulso ${record.value} lpm`;
    }

    function renderTrends(records) {
        const sorted = [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const counts = countByStatus(sorted);
        normalCount.textContent = counts.green;
        elevatedCount.textContent = counts.yellow;
        criticalCount.textContent = counts.red;
        renderSvgLine(sugarChart, groupTrend(sorted, 'sugar'), '#16a34a');
        renderSvgLine(pressureChart, groupTrend(sorted, 'pressure'), '#0ea5e9');
        recentList.innerHTML = '';
        const recent = sorted.slice(0, 4);
        if (!recent.length) {
            recentList.innerHTML = '<div class="record-card record-card-empty"><strong>No hay registros recientes</strong></div>';
        } else {
            recent.forEach(record => {
                const item = document.createElement('article');
                item.className = 'history-item';
                item.innerHTML = `
                    <div>
                        <strong>${record.title}</strong>
                        <small>${new Date(record.created_at).toLocaleDateString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>
                    </div>
                    <div>
                        <strong>${buildRecordLabel(record)}</strong>
                    </div>
                `;
                recentList.appendChild(item);
            });
        }
        reportSummary.textContent = sorted.length
            ? `Último: ${buildRecordLabel(sorted[0])}. Total registros: ${sorted.length}. Usa compartir para enviar al médico.`
            : 'Registra datos desde Inicio para generar un reporte.';
    }

    function createReportText(records) {
        if (!records.length) return 'Viatlcheck - No hay datos para generar reporte.';
        const lines = ['Reporte Viatlcheck', '', `Fecha: ${new Date().toLocaleString('es-ES')}`, '', 'Últimos registros:'];
        records.slice(0, 10).forEach(record => {
            const date = new Date(record.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
            const detail = record.title === 'Azúcar'
                ? `Azúcar: ${record.value} mg/dL (${record.metric === 'despues' ? 'Después de comer' : 'Ayunas'})`
                : `Presión: ${record.metric}, Pulso: ${record.value} lpm`;
            lines.push(`- ${date}: ${detail}`);
        });
        return lines.join('\n');
    }

    async function fetchRecords() {
        const response = await backendFetch('data.php?limit=100&offset=0');
        if (!response) return [];
        const result = await response.json();
        if (!result.success) {
            reportSummary.textContent = `Error: ${result.error}`;
            return [];
        }
        return result.data;
    }

    function shareReport(method, records) {
        const text = createReportText(records);
        if (method === 'whatsapp') {
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            return;
        }
        const subject = 'Reporte Viatlcheck';
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }

    async function init() {
        const records = await fetchRecords();
        renderTrends(records);
        whatsappShare.addEventListener('click', () => shareReport('whatsapp', records));
        emailShare.addEventListener('click', () => shareReport('email', records));
    }

    init();
});

document.addEventListener('deviceready', () => {
    if (!requireLogin()) return;
});
