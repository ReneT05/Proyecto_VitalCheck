var API_ROOT = 'https://elrjtd.online/DDI/RENE';

window.API_ROOT = API_ROOT;

function getAppToken() {
    return localStorage.getItem('vital_token');
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
        localStorage.setItem('vital_token', token);
    } else {
        localStorage.removeItem('vital_token');
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
    localStorage.removeItem('vital_token');
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
    options.headers['Content-Type'] = 'application/json';

    const method = (options.method || 'GET').toUpperCase();
    const userId = getCurrentUserId();
    const localApi = !/^https?:\/\//i.test(path) && needsLocalUserId(path);

    if (localApi && userId) {
        if (method === 'GET') {
            if (!hasUserIdParam(path)) {
                path += path.includes('?') ? `&user_id=${userId}` : `?user_id=${userId}`;
            }
        } else {
            let body = {};
            if (options.body) {
                try {
                    body = JSON.parse(options.body);
                } catch {
                    body = {};
                }
            }
            if (typeof body === 'object' && body !== null) {
                body.user_id = userId;
                options.body = JSON.stringify(body);
            }
        }
    }

    let requestUrl;
    if (/^https?:\/\//i.test(path)) {
        requestUrl = path;
    } else if (API_ROOT) {
        requestUrl = API_ROOT.replace(/\/+$/g, '') + '/' + normalizePath(path);
    } else {
        requestUrl = normalizePath(path);
    }

    return fetch(requestUrl, options);
}
