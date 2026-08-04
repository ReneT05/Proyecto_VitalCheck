const API_ROOT = 'https://elrjtd.online/DDI/RENE';

// Autenticación deshabilitada: no se requiere token ni redirección a login
function getAppToken() {
    return null;
}

function setAppToken(token) {
    // no-op
}

function clearAppToken() {
    // no-op
}

function requireLogin() {
    return true;
}

async function backendFetch(path, options = {}) {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';

    let requestUrl = path;
    if (!/^https?:\/\//i.test(path)) {
        const normalizedPath = path.replace(/^\/+/, '').replace(/^api\//, '');
        requestUrl = `${API_ROOT}/${normalizedPath}`;
    }

    const response = await fetch(requestUrl, options);
    return response;
}
