<?php

function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data)
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function getAuthorizationHeader()
{
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (!empty($headers['Authorization'])) {
            return trim($headers['Authorization']);
        }
        if (!empty($headers['authorization'])) {
            return trim($headers['authorization']);
        }
    }

    return null;
}

function getBearerToken()
{
    $header = getAuthorizationHeader();
    if (!$header) {
        return null;
    }

    if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

function verifyJwt($token, $secretKey)
{
    if (!$token || substr_count($token, '.') !== 2) {
        return false;
    }

    list($headerB64, $payloadB64, $signatureB64) = explode('.', $token);
    $payloadJson = base64url_decode($payloadB64);
    $payload = json_decode($payloadJson, true);
    if (!$payload || !isset($payload['exp'])) {
        return false;
    }

    if (time() > intval($payload['exp'])) {
        return false;
    }

    $expectedSignature = hash_hmac('sha256', "$headerB64.$payloadB64", $secretKey, true);
    $expectedSignatureB64 = base64url_encode($expectedSignature);

    return hash_equals($expectedSignatureB64, $signatureB64);
}

function decodeJwt($token)
{
    if (!$token || substr_count($token, '.') !== 2) {
        return false;
    }

    list(, $payloadB64,) = explode('.', $token);
    $payloadJson = base64url_decode($payloadB64);
    return json_decode($payloadJson, true) ?: false;
}
