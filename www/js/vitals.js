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
    if (!banner || !title || !text) return;

    banner.classList.remove('green', 'yellow', 'red');
    banner.classList.add(state.status);
    title.textContent = state.title;
    text.textContent = state.text;
}
