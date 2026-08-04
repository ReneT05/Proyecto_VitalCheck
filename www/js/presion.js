document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;

    const form = document.getElementById('pressureForm');
    const summary = document.getElementById('lastSummary');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const systolic = document.getElementById('systolicValue').value.trim();
        const diastolic = document.getElementById('diastolicValue').value.trim();
        const pulse = document.getElementById('pulseValue').value.trim();

        if (!systolic || !diastolic || !pulse) {
            updateStatusBanner({ status: 'yellow', title: 'Faltan datos', text: 'Completa todos los campos.' });
            return;
        }

        updateStatusBanner(evaluatePressure(systolic, diastolic));

        const response = await backendFetch('api/data.php', {
            method: 'POST',
            body: JSON.stringify({ title: 'Presión', metric: `${systolic}/${diastolic}`, value: Number(pulse) })
        });

        if (!response) return;
        const result = await response.json();
        if (result.success) {
            summary.textContent = `Guardado: ${systolic}/${diastolic} mmHg · Pulso ${pulse}`;
            form.reset();
        } else {
            summary.textContent = `Error: ${result.error}`;
        }
    });
});
