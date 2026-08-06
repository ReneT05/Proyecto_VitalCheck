function createSidebar(activePage) {
    const user = getCurrentUser();
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-profile">
            <div class="avatar">${user?.nombre?.charAt(0) || 'U'}</div>
            <div class="profile-text">
                <strong>${user?.nombre || 'Usuario'}</strong>
                <span>${user?.usuario || 'Sin sesión'}</span>
            </div>
        </div>
        <nav class="sidebar-nav">
            <a class="sidebar-link ${activePage === 'inicio' ? 'active' : ''}" href="inicio.html"><i class="fas fa-home"></i>Inicio</a>
            <a class="sidebar-link ${activePage === 'perfil' ? 'active' : ''}" href="usuarios.html?edit=1"><i class="fas fa-user-cog"></i>Mi cuenta</a>
            <a class="sidebar-link ${activePage === 'registro' ? 'active' : ''}" href="registro.html"><i class="fas fa-notes-medical"></i>Registrar valor</a>
            <a class="sidebar-link ${activePage === 'recordatorios' ? 'active' : ''}" href="recordatorios.html"><i class="fas fa-bell"></i>Recordatorios</a>
            <a class="sidebar-link ${activePage === 'historial' ? 'active' : ''}" href="historial.html"><i class="fas fa-history"></i>Historial</a>
            <a class="sidebar-link ${activePage === 'tendencias' ? 'active' : ''}" href="tendencias.html"><i class="fas fa-chart-line"></i>Tendencias</a>
            <a class="sidebar-link ${activePage === 'usuarios' ? 'active' : ''}" href="usuarios.html"><i class="fas fa-user-plus"></i>Crear usuario</a>
            <a class="sidebar-link ${activePage === 'ayuda' ? 'active' : ''}" href="ayuda.html"><i class="fas fa-question-circle"></i>Ayuda</a>
        </nav>
        <button class="sidebar-logout logout-action" type="button"><i class="fas fa-sign-out-alt"></i>Cerrar sesión</button>
    `;
    return sidebar;
}

function attachSidebar(containerSelector, activePage) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const existing = container.querySelector('.sidebar');
    if (existing) return;

    const sidebar = createSidebar(activePage);
    container.prepend(sidebar);

    if (!document.querySelector('.sidebar-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.type = 'button';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggleButton);

        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar--open');
            overlay.classList.toggle('sidebar-overlay--visible');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('sidebar--open');
            overlay.classList.remove('sidebar-overlay--visible');
        });
    }

    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('sidebar--open');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.classList.remove('sidebar-overlay--visible');
        });
    });
}

function getActivePageFromPath() {
    const path = window.location.pathname.toLowerCase();
    const query = new URLSearchParams(window.location.search);
    if (path.includes('historial.html')) return 'historial';
    if (path.includes('tendencias.html')) return 'tendencias';
    if (path.includes('registro.html')) return 'registro';
    if (path.includes('recordatorios.html')) return 'recordatorios';
    if (path.includes('usuarios.html')) {
        if (query.get('edit') === '1' || query.get('edit') === 'true') {
            return 'perfil';
        }
        return 'usuarios';
    }
    return 'inicio';
}

function logoutUser() {
    clearAppToken();
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebarRoot = document.getElementById('appShell');
    if (sidebarRoot) {
        attachSidebar('#appShell', getActivePageFromPath());
        const logoutBtn = sidebarRoot.querySelector('.logout-action');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    }
});
