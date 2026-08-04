document.addEventListener('DOMContentLoaded', () => {
    if (getAppToken()) {
        window.location.href = 'inicio.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginError');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const pin = document.getElementById('pinInput').value.trim();
        if (!pin) {
            errorMessage.textContent = 'Ingrese su PIN de acceso.';
            return;
        }

        const response = await backendFetch('api/auth.php', {
            method: 'POST',
            body: JSON.stringify({ pin })
        });

        if (!response) {
            return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
            errorMessage.textContent = result.error || 'PIN incorrecto o servidor inaccesible.';
            return;
        }

        setAppToken(result.token);
        window.location.href = 'inicio.html';
    });
});
