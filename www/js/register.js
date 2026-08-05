document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const errorEl = document.getElementById('registerError');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        errorEl.textContent = '';

        const payload = {
            nombre: document.getElementById('firstName').value.trim(),
            apellido: document.getElementById('lastName').value.trim(),
            usuario: document.getElementById('newUsername').value.trim(),
            correo: document.getElementById('email').value.trim(),
            contrasena: document.getElementById('newPassword').value.trim(),
            pin: document.getElementById('newPin').value.trim(),
            fecha_nacimiento: document.getElementById('birthDate').value,
            sexo: document.getElementById('gender').value,
            telefono: document.getElementById('phone').value.trim()
        };

        if (!payload.nombre || !payload.apellido || !payload.usuario || !payload.contrasena || !payload.pin) {
            errorEl.textContent = 'Completa los campos obligatorios y el PIN.';
            return;
        }

        try {
            const response = await backendFetch('usuarios.php', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                errorEl.textContent = result.error || 'No se pudo crear el usuario.';
                return;
            }
            errorEl.style.color = '#15803d';
            errorEl.textContent = 'Usuario creado correctamente. Ahora inicia sesión.';
            form.reset();
        } catch (error) {
            console.error(error);
            errorEl.textContent = 'Error de conexión al servidor.';
        }
    });
});
