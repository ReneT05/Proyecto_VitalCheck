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
            <a class="sidebar-link ${activePage === 'historial' ? 'active' : ''}" href="historial.html"><i class="fas fa-history"></i>Historial</a>
            <a class="sidebar-link ${activePage === 'tendencias' ? 'active' : ''}" href="tendencias.html"><i class="fas fa-chart-line"></i>Tendencias</a>
            <a class="sidebar-link ${activePage === 'registro' ? 'active' : ''}" href="registro.html"><i class="fas fa-notes-medical"></i>Registrar valor</a>
            <a class="sidebar-link ${activePage === 'usuarios' ? 'active' : ''}" href="usuarios.html"><i class="fas fa-user-plus"></i>Crear usuario</a>
        </nav>
        <button class="sidebar-logout logout-action" type="button"><i class="fas fa-sign-out-alt"></i>Cerrar sesión</button>
        <div class="sidebar-note">
            Usa tu PIN si olvidaste la contraseña.
        </div>
    `;
    return sidebar;
}

function attachSidebar(containerSelector, activePage) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const existing = container.querySelector('.sidebar');
    if (existing) return;
    container.prepend(createSidebar(activePage));
}

function getActivePageFromPath() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('historial.html')) return 'historial';
    if (path.includes('tendencias.html')) return 'tendencias';
    if (path.includes('registro.html')) return 'registro';
    if (path.includes('usuarios.html')) return 'usuarios';
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
