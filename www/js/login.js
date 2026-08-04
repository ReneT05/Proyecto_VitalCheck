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

        const username = document.getElementById('usernameInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();
        const pin = document.getElementById('pinInput').value.trim();

        if (!username || !password) {
            if (!pin) {
                errorMessage.textContent = 'Ingresa usuario/contraseña o PIN para entrar.';
                return;
            }
        }

        const payload = username && password
            ? { username, password }
            : { pin };

        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response) {
            errorMessage.textContent = 'Error al conectar con el servidor.';
            return;
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
            errorMessage.textContent = result.error || 'Usuario/contraseña o PIN incorrectos.';
            return;
        }

        setAppToken(result.token);
        window.location.href = 'inicio.html';
    });
});
