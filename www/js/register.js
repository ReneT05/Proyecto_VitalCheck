document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const errorEl = document.getElementById('registerError');
    const headerTitle = document.querySelector('.page-header h1');
    const headerDesc = document.querySelector('.page-header p');
    const submitButton = form.querySelector('button[type="submit"]');
    const urlParams = new URLSearchParams(window.location.search);
    const editModeRequested = urlParams.get('edit') === '1' || urlParams.get('edit') === 'true';
    let userId = urlParams.get('id');
    if (!userId && editModeRequested) {
        userId = getCurrentUserId();
    }
    const isEditMode = Boolean(userId) && editModeRequested;

    function getFormValues() {
        return {
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
    }

    async function loadUserData(id) {
        try {
            const response = await backendFetch(`usuarios.php?id=${id}`);
            const result = await response.json();
            if (!response.ok || !result.success) {
                errorEl.textContent = result.error || 'No se pudo cargar el usuario.';
                return;
            }
            const data = result.data;
            document.getElementById('firstName').value = data.nombre || '';
            document.getElementById('lastName').value = data.apellido || '';
            document.getElementById('newUsername').value = data.usuario || '';
            document.getElementById('email').value = data.correo || '';
            document.getElementById('birthDate').value = data.fecha_nacimiento || '';
            document.getElementById('gender').value = data.sexo || '';
            document.getElementById('phone').value = data.telefono || '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newPin').value = '';
        } catch (error) {
            console.error(error);
            errorEl.textContent = 'Error de conexión al servidor.';
        }
    }

    if (isEditMode) {
        if (headerTitle) headerTitle.textContent = 'Editar usuario';
        if (headerDesc) headerDesc.textContent = 'Actualiza el PIN o los datos del usuario existente.';
        if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
        document.getElementById('newPassword').removeAttribute('required');
        document.getElementById('newPin').removeAttribute('required');
        document.getElementById('firstName').removeAttribute('required');
        document.getElementById('lastName').removeAttribute('required');
        document.getElementById('newUsername').removeAttribute('required');
        loadUserData(userId);
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        errorEl.textContent = '';

        const values = getFormValues();

        let payload;
        let method;
        let endpoint;

        if (isEditMode) {
            method = 'PUT';
            endpoint = `usuarios.php?id=${encodeURIComponent(userId)}`;
            payload = {};
            Object.entries(values).forEach(([key, value]) => {
                if (value !== '') {
                    payload[key] = value;
                }
            });
            if (Object.keys(payload).length === 0) {
                errorEl.textContent = 'Ingresa al menos un valor para actualizar.';
                return;
            }
        } else {
            method = 'POST';
            endpoint = 'usuarios.php';
            payload = values;
            if (!payload.nombre || !payload.apellido || !payload.usuario || !payload.contrasena || !payload.pin) {
                errorEl.textContent = 'Completa los campos obligatorios y el PIN.';
                return;
            }
        }

        try {
            const response = await backendFetch(endpoint, {
                method,
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                errorEl.textContent = result.error || 'No se pudo procesar la solicitud.';
                return;
            }
            if (isEditMode) {
                errorEl.style.color = '#15803d';
                errorEl.textContent = 'Usuario actualizado correctamente.';
            } else {
                errorEl.style.color = '#15803d';
                errorEl.textContent = 'Usuario creado correctamente. Ahora inicia sesión.';
                form.reset();
            }
        } catch (error) {
            console.error(error);
            errorEl.textContent = 'Error de conexión al servidor.';
        }
    });
});
