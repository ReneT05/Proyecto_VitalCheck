document.addEventListener('DOMContentLoaded', () => {

    if (!requireLogin()) return;


    const form = document.getElementById('sugarForm');
    const summary = document.getElementById('lastSummary');


    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        const value = document
            .getElementById('glucoseValue')
            .value
            .trim();

        const meal = document
            .querySelector('input[name="meal"]:checked')
            ?.value || 'Ayunas';

        if (!value) {
            updateStatusBanner({
                status: 'yellow',
                title: 'Falta un valor',
                text: 'Ingresa tu nivel de glucosa.'
            });
            return;
        }
        updateStatusBanner(
            evaluateGlucose(value, meal)
        );

        const response = await backendFetch('/data.php', {
            method: 'POST',
            body: JSON.stringify({
                tipo_registro: 'Azúcar',
                metric: meal,
                valor: Number(value)
            })
        });

        if (!response) {
            summary.textContent = "Error de conexión";
            return;
        }

        const text = await response.text();
        console.log("Respuesta PHP:", text);
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            summary.textContent = "Error del servidor";
            return;
        }

        if (result.success) {
            summary.textContent =
                `Guardado: ${value} mg/dL (${meal})`;
            form.reset();
        } else {
            summary.textContent =
                `Error: ${result.error}`;

        }
    });
});