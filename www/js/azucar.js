document.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;

    const form = document.getElementById('sugarForm');
    const summary = document.getElementById('lastSummary');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const value = document.getElementById('glucoseValue').value.trim();
        const meal = document.querySelector('input[name="meal"]:checked')?.value || 'ayunas';

        if (!value) {
            updateStatusBanner({ status: 'yellow', title: 'Falta un valor', text: 'Ingresa tu nivel de glucosa.' });
            return;
        }

        updateStatusBanner(evaluateGlucose(value, meal));

        const response = await backendFetch('api/data.php', {
            method: 'POST',
            body: JSON.stringify({ title: 'Azúcar', metric: meal, value: Number(value) })
        });

        if (!response) return;
        const result = await response.json();
        if (result.success) {
            summary.textContent = `Guardado: ${value} mg/dL (${meal === 'despues' ? 'Después de comer' : 'Ayunas'})`;
            form.reset();
        } else {
            summary.textContent = `Error: ${result.error}`;
        }
    });
});
