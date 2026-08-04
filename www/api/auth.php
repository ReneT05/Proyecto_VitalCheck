<?php
require_once __DIR__ . '/conector.php';
require_once __DIR__ . '/jwt.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$secretKey = 'ViatlcheckJWTSecret';
$validPin = '1234';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([ 'success' => false, 'error' => 'Método no permitido' ]);
    exit;
}

if (!isset($input['pin']) || trim($input['pin']) === '') {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'error' => 'PIN requerido' ]);
    exit;
}

$pin = trim($input['pin']);
if ($pin !== $validPin) {
    http_response_code(401);
    echo json_encode([ 'success' => false, 'error' => 'PIN inválido' ]);
    exit;
}

$header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
$payload = base64url_encode(json_encode(['sub' => 'usuario_vital', 'iat' => time(), 'exp' => time() + 3600]));
$signature = hash_hmac('sha256', "$header.$payload", $secretKey, true);
$signature = base64url_encode($signature);
$token = "$header.$payload.$signature";

echo json_encode([ 'success' => true, 'token' => $token ]);
