function evaluateGlucose(value, meal) {
    const numeric = Number(value);
    if (meal === 'despues') {
        if (numeric <= 139) return { status: 'green', title: 'Normal', text: 'Azúcar en rango normal después de comer.' };
        if (numeric <= 199) return { status: 'yellow', title: 'Elevado', text: 'Nivel de azúcar alto. Revísalo con tu médico.' };
        return { status: 'red', title: 'Crítico', text: 'Nivel de azúcar muy alto. Busca ayuda pronto.' };
    }
    if (numeric < 70) return { status: 'red', title: 'Bajo', text: 'Azúcar demasiado baja. Puede ser peligroso.' };
    if (numeric <= 99) return { status: 'green', title: 'Normal', text: 'Azúcar en rango saludable en ayunas.' };
    if (numeric <= 125) return { status: 'yellow', title: 'Elevado', text: 'Ayunas ligeramente alto. Observa tu médico.' };
    return { status: 'red', title: 'Crítico', text: 'Azúcar en rango hiperglucémico.' };
}

function evaluatePressure(systolic, diastolic) {
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (sys <= 90 || dia <= 60) return { status: 'yellow', title: 'Bajo', text: 'Presión arterial baja. Observa síntomas.' };
    if (sys <= 120 && dia <= 80) return { status: 'green', title: 'Normal', text: 'Presión dentro de rango saludable.' };
    if (sys <= 139 || dia <= 89) return { status: 'yellow', title: 'Elevado', text: 'Presión elevada. Monitorea con tu médico.' };
    return { status: 'red', title: 'Crítico', text: 'Presión arterial alta. Busca atención médica.' };
}

function updateStatusBanner(state) {
    const banner = document.getElementById('statusBanner');
    const title = document.getElementById('statusTitle');
    const text = document.getElementById('statusText');
    banner.classList.remove('green', 'yellow', 'red');
    banner.classList.add(state.status);
    title.textContent = state.title;
    text.textContent = state.text;
}

function setActiveType(type) {
    document.getElementById('formTitle').textContent = type === 'pressure' ? 'Registrar Presión' : 'Registrar Azúcar';
    document.getElementById('formDescription').textContent = type === 'pressure'
        ? 'Ingresa presión sistólica, diastólica y pulso con controles grandes.'
        : 'Ingresa tu glucosa y elige si es ayunas o después de comer.';
    document.getElementById('sugarFields').classList.toggle('hidden', type === 'pressure');
    document.getElementById('pressureFields').classList.toggle('hidden', type !== 'pressure');
    document.getElementById('sugarType').classList.toggle('active', type === 'sugar');
    document.getElementById('pressureType').classList.toggle('active', type === 'pressure');
}

async function fetchRecentRecords(limit = 2) {
    const response = await backendFetch(`data.php?limit=${limit}&offset=0`);
    if (!response) return [];
    const result = await response.json();
    if (!result.success) return [];
    return result.data;
}

function formatRecordSummary(record) {
    const date = new Date(record.created_at);
    if (record.title === 'Azúcar') {
        const meal = record.metric === 'despues' ? 'Después de comer' : 'Ayunas';
        return `<strong>${record.value} mg/dL</strong><small>${meal} · ${date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>`;
    }
    return `<strong>${record.metric} mmHg</strong><small>Pulso ${record.value} lpm · ${date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>`;
}

async function refreshLastSummary() {
    const records = await fetchRecentRecords(2);
    const container = document.getElementById('lastSummary');
    if (!records.length) {
        container.innerHTML = 'No hay registros guardados todavía.';
        return;
    }
    container.innerHTML = records.map(formatRecordSummary).join('');
}

async function handleSubmit(event) {
    event.preventDefault();
    const type = document.getElementById('sugarType').classList.contains('active') ? 'sugar' : 'pressure';

    if (type === 'sugar') {
        const value = document.getElementById('glucoseValue').value.trim();
        const meal = document.querySelector('input[name="meal"]:checked')?.value || 'ayunas';
        if (!value) {
            updateStatusBanner({ status: 'yellow', title: 'Falta un valor', text: 'Ingresa tu nivel de glucosa antes de guardar.' });
            return;
        }

        updateStatusBanner(evaluateGlucose(value, meal));

        const response = await backendFetch('data.php', {
            method: 'POST',
            body: JSON.stringify({ title: 'Azúcar', metric: meal, value: Number(value) })
        });
        if (!response) return;
        const result = await response.json();
        if (result.success) {
            document.getElementById('lastSummary').textContent = `Guardado: ${value} mg/dL (${meal === 'despues' ? 'Después de comer' : 'Ayunas'})`;
            document.getElementById('dataForm').reset();
            await refreshLastSummary();
        } else {
            document.getElementById('lastSummary').textContent = `Error: ${result.error}`;
        }
        return;
    }

    const systolic = document.getElementById('systolicValue').value.trim();
    const diastolic = document.getElementById('diastolicValue').value.trim();
    const pulse = document.getElementById('pulseValue').value.trim();
    if (!systolic || !diastolic || !pulse) {
        updateStatusBanner({ status: 'yellow', title: 'Faltan datos', text: 'Completa todos los campos de presión y pulso.' });
        return;
    }

    updateStatusBanner(evaluatePressure(systolic, diastolic));

    const response = await backendFetch('data.php', {
        method: 'POST',
        body: JSON.stringify({ title: 'Presión', metric: `${systolic}/${diastolic}`, value: Number(pulse) })
    });
    if (!response) return;
    const result = await response.json();
    if (result.success) {
        document.getElementById('lastSummary').textContent = `Guardado: ${systolic}/${diastolic} mmHg · Pulso ${pulse}`;
        document.getElementById('dataForm').reset();
        await refreshLastSummary();
    } else {
        document.getElementById('lastSummary').textContent = `Error: ${result.error}`;
    }
}

function initForm() {
    const type = new URLSearchParams(window.location.search).get('type') === 'pressure' ? 'pressure' : 'sugar';
    setActiveType(type);
    document.getElementById('sugarType').addEventListener('click', () => setActiveType('sugar'));
    document.getElementById('pressureType').addEventListener('click', () => setActiveType('pressure'));
    document.getElementById('dataForm').addEventListener('submit', handleSubmit);
    refreshLastSummary();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;
    initForm();
});

document.addEventListener('deviceready', () => {
    if (!requireLogin()) return;
    initForm();
});
