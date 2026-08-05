var API_ROOT = 'https://elrjtd.online/DDI/RENE';

window.API_ROOT = API_ROOT;

function getAppToken() {
    return localStorage.getItem('jwt');
}

function getCurrentUser() {
    const raw = localStorage.getItem('vital_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function getCurrentUserId() {
    const user = getCurrentUser();
    return user?.id_usuario ?? null;
}

function setAppToken(token) {
    if (token) {
        localStorage.setItem('jwt', token);
    } else {
        localStorage.removeItem('jwt');
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('vital_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('vital_user');
    }
}

function clearAppToken() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('vital_user');
}

function requireLogin() {
    const token = getAppToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function normalizePath(path) {
    return path.replace(/^\/+/, '');
}

function needsLocalUserId(path) {
    const normalized = normalizePath(path);
    return normalized.startsWith('api/data.php') || normalized === 'data.php';
}

function hasUserIdParam(path) {
    return /[?&]user_id=/.test(path);
}

async function backendFetch(path, options = {}) {
    options.headers = options.headers || {};
    if (!options.headers['Content-Type'] && !options.headers['content-type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    const token = getAppToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (options.method || 'GET').toUpperCase();
    const userId = getCurrentUserId();

    if (!/^https?:\/\//i.test(path) && userId) {
        // Keep current user context if needed elsewhere, but JWT is the primary auth mechanism.
    }

    let requestUrl;
    if (/^https?:\/\//i.test(path)) {
        requestUrl = path;
    } else {
        const normalized = normalizePath(path);
        const localPrefix = normalized.startsWith('api/') || normalized === 'data.php';
        if (localPrefix || !API_ROOT) {
            requestUrl = normalized;
        } else {
            requestUrl = API_ROOT.replace(/\/+$/g, '') + '/' + normalized;
        }
    }

    return fetch(requestUrl, options);
}
