<?php

ini_set('display_errors', 1);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
require_once '../conector.php';
require_once "../../../vendor/autoload.php";


$method = $_SERVER['REQUEST_METHOD'];

try {

    $db = getConexion();
} catch (Exception $e) {
    // http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);

    exit;
}
if ($method != "POST") {
    echo json_encode([
        'success' => false,
        'error' => 'metodo incorrecto(se esperaba POST)'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$UUID = $input["UUID"];
$title = $input["title"];
$body = $input["body"];

$user_token = $db->Select("usuarios", "firebase_token");
$user_token->Where("id_usuario", "=", $UUID);
$user_token = $user_token->execute();

if (!isset($user_token) || !isset($user_token[0])) {
    echo json_encode([
        'success' => false,
        'error' => 'usuario no encontrado'
    ]);
    exit;
}

$user_token = $user_token[0]["firebase_token"];
$select = $db->Select("usuarios", "firebase_token");
$select->where("id_usuario", "!=", $UUID);

$results = $select->execute();

$serviceAccount = __DIR__ . '/serviceAccount.json';
$firebase = (new Kreait\Firebase\Factory)->withServiceAccount($serviceAccount)->createMessaging();

foreach ($results as $result) {

    $message = [];
    
    if(trim($result["firebase_token"]) === ''){
    continue;
    }

    $message["token"] = $result["firebase_token"];

    $notification = [];
    
    $notification["title"] = $title;
    $notification["body"] = $body;
    $message["notification"] = $notification;

    if (isset($input["data"])) {
        $message["data"] =$input["data"];
       
        
    }
        var_dump($message);


try {
    $firebase->send($message);
    
    echo json_encode([
        'success' => true,
        'message' => 'Enviado correctamente'
    ]);
} catch (\Kreait\Firebase\Exception\Messaging\InvalidMessage $e) {
    echo json_encode([
        'success' => false,
        'error_tipo' => 'Mensaje Rechazado por Firebase',
        'detalles_google' => $e->errors() // El método de Kreait para ver el error real de la API
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
}