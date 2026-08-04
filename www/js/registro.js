document.addEventListener('DOMContentLoaded', function () {
    const measurementType = document.getElementById('measurementType');
    const glucosaSection = document.getElementById('glucosaSection');
    const presionSection = document.getElementById('presionSection');
    const form = document.getElementById('measurement-form');
    const messageElement = document.getElementById('formMessage');
    const submitButton = document.getElementById('submitButton');

    const API_GLUCOSE = 'api/glucosa.php';
    const API_PRESSURE = 'api/presion.php';
    const DEFAULT_USER_ID = 1;

    function updateSections() {
        const selected = measurementType.value;
        glucosaSection.style.display = selected === 'glucosa' ? 'block' : 'none';
        presionSection.style.display = selected === 'presion' ? 'block' : 'none';
    }

    function showMessage(text, isError = false) {
        if (!messageElement) {
            alert(text);
            return;
        }
        messageElement.textContent = text;
        messageElement.style.backgroundColor = isError ? '#fee2e2' : '#eff6ff';
        messageElement.style.color = isError ? '#b91c1c' : '#1d4ed8';
        messageElement.classList.add('visible');
        setTimeout(() => {
            messageElement.classList.remove('visible');
        }, 4500);
    }

    function getFormData() {
        const tipo = measurementType.value;
        const observaciones = document.getElementById('observaciones')?.value.trim() || '';

        if (tipo === 'glucosa') {
            const nivel = Number(document.getElementById('nivel_glucosa')?.value);
            const momento = document.getElementById('momento')?.value;
            if (!nivel || nivel <= 0) {
                showMessage('Ingresa un valor válido de glucosa.', true);
                return null;
            }
            return {
                endpoint: API_GLUCOSE,
                payload: {
                    user_id: DEFAULT_USER_ID,
                    nivel_glucosa: nivel,
                    momento: momento || 'Ayunas',
                    observaciones: observaciones
                }
            };
        }

        if (tipo === 'presion') {
            const sistolica = Number(document.getElementById('sistolica')?.value);
            const diastolica = Number(document.getElementById('diastolica')?.value);
            const pulso = Number(document.getElementById('pulso')?.value);
            if (!sistolica || !diastolica || !pulso) {
                showMessage('Completa los valores de presión y pulso.', true);
                return null;
            }
            return {
                endpoint: API_PRESSURE,
                payload: {
                    user_id: DEFAULT_USER_ID,
                    sistolica: sistolica,
                    diastolica: diastolica,
                    pulso: pulso,
                    observaciones: observaciones
                }
            };
        }

        return null;
    }

    async function submitMeasurement(event) {
        event.preventDefault();
        const data = getFormData();
        if (!data) return;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Guardando...';
        }

        try {
            const response = await fetch(data.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload)
            });
            const json = await response.json();
            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Error al guardar la medición.');
            }
            showMessage('Medición guardada correctamente.');
            form.reset();
            updateSections();
        } catch (error) {
            console.error(error);
            showMessage(error.message || 'Error al guardar.', true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar medición';
            }
        }
    }

    if (measurementType) {
        measurementType.addEventListener('change', updateSections);
    }

    updateSections();

    if (form) {
        form.addEventListener('submit', submitMeasurement);
    }
});
