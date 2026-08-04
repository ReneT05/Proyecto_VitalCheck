const API_ROOT = 'api';

function getAppToken() {
    return localStorage.getItem('vitalcheckToken');
}

function setAppToken(token) {
    localStorage.setItem('vitalcheckToken', token);
}

function clearAppToken() {
    localStorage.removeItem('vitalcheckToken');
}

function requireLogin() {
    if (!getAppToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

async function backendFetch(path, options = {}) {
    const token = getAppToken();
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    let requestUrl = path;
    if (!/^https?:\/\//i.test(path)) {
        const normalizedPath = path.replace(/^\/+/, '').replace(/^api\//, '');
        requestUrl = `${API_ROOT}/${normalizedPath}`;
    }

    const response = await fetch(requestUrl, options);

    if (response.status === 401) {
        clearAppToken();
        window.location.href = 'login.html';
        return null;
    }

    return response;
}
