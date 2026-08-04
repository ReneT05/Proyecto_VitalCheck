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
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$usuario = isset($input['usuario']) ? trim($input['usuario']) : (isset($input['username']) ? trim($input['username']) : '');
$contrasena = isset($input['contrasena']) ? trim($input['contrasena']) : (isset($input['password']) ? trim($input['password']) : '');
$pin = isset($input['pin']) ? trim($input['pin']) : '';

$user = null;

try {
    $db = getConexion();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error de conexión al servidor']);
    exit;
}

if ($usuario !== '' && $contrasena !== '') {
    $stmt = $db->prepare('SELECT * FROM usuarios WHERE usuario = :usuario LIMIT 1');
    $stmt->execute([':usuario' => $usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
        exit;
    }

    $storedPassword = $user['contrasena'] ?? '';
    if (!password_verify($contrasena, $storedPassword) && $contrasena !== $storedPassword) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
        exit;
    }
} elseif ($pin !== '') {
    $stmt = $db->prepare('SELECT * FROM usuarios WHERE pin = :pin LIMIT 1');
    $stmt->execute([':pin' => $pin]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        if ($pin !== $validPin) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'PIN inválido']);
            exit;
        }

        $stmt = $db->prepare('SELECT * FROM usuarios WHERE usuario = :usuario LIMIT 1');
        $stmt->execute([':usuario' => 'admin']);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Usuario de emergencia no encontrado']);
            exit;
        }
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Usuario/contraseña o PIN requerido']);
    exit;
}

$header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
$payloadData = [
    'sub' => 'usuario_vital',
    'uid' => intval($user['id_usuario'] ?? 0),
    'username' => $user['usuario'] ?? '',
    'iat' => time(),
    'exp' => time() + 3600
];
$payload = base64url_encode(json_encode($payloadData));
$signature = hash_hmac('sha256', "$header.$payload", $secretKey, true);
$signature = base64url_encode($signature);
$token = "$header.$payload.$signature";

echo json_encode([
    'success' => true,
    'token' => $token,
    'user' => [
        'id' => intval($user['id_usuario'] ?? 0),
        'usuario' => $user['usuario'] ?? '',
        'username' => $user['usuario'] ?? '',
        'full_name' => $user['nombre_completo'] ?? '',
        'nombre_completo' => $user['nombre_completo'] ?? ''
    ]
]);
