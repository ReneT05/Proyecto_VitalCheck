<?php

const JWT_SECRET = 'cambiar_esto_por_un_secreto_mas_fuerte';
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRE_SECONDS = 3600;

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload, string $secret = JWT_SECRET, string $alg = JWT_ALGORITHM): string
{
    $header = ['typ' => 'JWT', 'alg' => $alg];
    $headerEncoded = base64url_encode(json_encode($header));
    $payloadEncoded = base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
    $signatureEncoded = base64url_encode($signature);
    return "$headerEncoded.$payloadEncoded.$signatureEncoded";
}

function jwt_decode(string $jwt, string $secret = JWT_SECRET, string $alg = JWT_ALGORITHM): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
    $headerJson = base64url_decode($headerEncoded);
    $payloadJson = base64url_decode($payloadEncoded);

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);
    if (!is_array($header) || !is_array($payload)) {
        return null;
    }

    if (($header['alg'] ?? '') !== $alg) {
        return null;
    }

    $expectedSignature = base64url_encode(hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true));
    if (!hash_equals($expectedSignature, $signatureEncoded)) {
        return null;
    }

    if (isset($payload['exp']) && time() > intval($payload['exp'])) {
        return null;
    }

    return $payload;
}

function jwt_get_authorization_header(): ?string
{
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $name => $value) {
            if (strtolower($name) === 'authorization') {
                return trim($value);
            }
        }
    }

    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }

    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }

    return null;
}

function jwt_get_bearer_token(): ?string
{
    $header = jwt_get_authorization_header();
    if (!$header) {
        return null;
    }

    if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

function jwt_require_user(): ?array
{
    $token = jwt_get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization Bearer token requerido']);
        exit;
    }

    $payload = jwt_decode($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'JWT inválido o expirado']);
        exit;
    }

    return $payload;
}

function jwt_create_user_token(array $user): string
{
    $payload = [
        'sub' => intval($user['id_usuario']),
        'usuario' => $user['usuario'],
        'nombre' => $user['nombre'],
        'iat' => time(),
        'exp' => time() + JWT_EXPIRE_SECONDS,
    ];

    return jwt_encode($payload);
}
