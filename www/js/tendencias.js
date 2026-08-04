const STORAGE_KEY = 'ViatlcheckRecords';

function loadRecords() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

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
        const status = record.type === 'sugar'
            ? evaluateGlucose(record.value, record.meal).status
            : evaluatePressure(record.systolic, record.diastolic).status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { green: 0, yellow: 0, red: 0 });
}

function groupTrend(records, type) {
    const filtered = records.filter(r => r.type === type).sort((a, b) => a.timestamp - b.timestamp);
    const slice = filtered.slice(-10);
    return slice.map(record => ({
        label: new Date(record.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        value: type === 'sugar' ? record.value : (record.systolic + record.diastolic) / 2
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
    if (record.type === 'sugar') {
        return `${record.value} mg/dL (${record.meal === 'despues' ? 'Después de comer' : 'Ayunas'})`;
    }
    return `${record.systolic}/${record.diastolic} mmHg · Pulso ${record.pulse} lpm`;
}

function renderTrends() {
    const records = loadRecords().sort((a, b) => b.timestamp - a.timestamp);
    const counts = countByStatus(records);
    document.getElementById('normalCount').textContent = counts.green;
    document.getElementById('elevatedCount').textContent = counts.yellow;
    document.getElementById('criticalCount').textContent = counts.red;
    renderSvgLine(document.getElementById('sugarChart'), groupTrend(records, 'sugar'), '#16a34a');
    renderSvgLine(document.getElementById('pressureChart'), groupTrend(records, 'pressure'), '#0ea5e9');
    const recentList = document.getElementById('recentTrendList');
    recentList.innerHTML = '';
    records.slice(0, 4).forEach(record => {
        const item = document.createElement('article');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${record.type === 'sugar' ? 'Azúcar' : 'Presión'}</strong>
                <small>${new Date(record.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </div>
            <div>
                <strong>${buildRecordLabel(record)}</strong>
            </div>
        `;
        recentList.appendChild(item);
    });
    const summary = document.getElementById('reportSummary');
    summary.textContent = records.length
        ? `Último: ${buildRecordLabel(records[0])}. Total registros: ${records.length}. Usa compartir para enviar al médico.`
        : 'Registra datos desde Inicio para generar un reporte.';
}

function createReportText() {
    const records = loadRecords().sort((a, b) => b.timestamp - a.timestamp);
    if (!records.length) return 'Viatlcheck - No hay datos para generar reporte.';
    const lines = ['Reporte Viatlcheck', '', `Fecha: ${new Date().toLocaleString('es-ES')}`, '', 'Últimos registros:'];
    records.slice(0, 10).forEach(record => {
        const date = new Date(record.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        const detail = record.type === 'sugar'
            ? `Azúcar: ${record.value} mg/dL (${record.meal === 'despues' ? 'Después de comer' : 'Ayunas'})`
            : `Presión: ${record.systolic}/${record.diastolic} mmHg, Pulso: ${record.pulse} lpm`;
        lines.push(`- ${date}: ${detail}`);
    });
    return lines.join('\n');
}

function shareReport(method) {
    const text = createReportText();
    if (method === 'whatsapp') {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        return;
    }
    const subject = 'Reporte Viatlcheck';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

function initPage() {
    document.getElementById('whatsappShare').addEventListener('click', () => shareReport('whatsapp'));
    document.getElementById('emailShare').addEventListener('click', () => shareReport('email'));
    renderTrends();
}

document.addEventListener('DOMContentLoaded', initPage);
document.addEventListener('deviceready', initPage);
