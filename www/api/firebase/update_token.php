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
require_once '../../../vendor/autoload.php';
require_once '../jwtUtils.php';


try{
    $jwt = verificarJWT(extraerJWT());
if (!$jwt || $jwt['valido'] == false) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Token JWT no proporcionado o invalido'
    ]);
    exit;
}
}
catch(Exception $e) {
    
        http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'jwt no encontrado'.$e
    ]);
    exit;
}

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

$method = $_SERVER['REQUEST_METHOD'];
if ($method != "POST") {
http_response_code(401); 

echo json_encode([
    'success' => false,
    'error' => 'No autorizado. Se requiere iniciar sesión o un token válido.',
    'code' => 401
]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;


if(!isset($input) || !isset($input["token"])){
    http_response_code(400); 
    echo json_encode([
    'success' => false,
    'error' => 'parametros faltantes(se requiere un UUID y un token)',
    'code' => 400
]);
exit;
    
}
$usuario = $jwt['data'];

try{
    $update = $db->update("usuario");

    $update->set("token_firebase",$input["token"]);
    $update->where("id_usuario","=",$usuario->id_usuario);
    
    $update->execute();
    if($update){
          http_response_code(200); 
    
    echo json_encode([
        'success' => true,
        'error' => 'actualización correcta',
        'code' => 200
    ]);
    }else{
          http_response_code(400); 
        echo json_encode([
        'success' => false,
        'error' => "no se pudo actualizar",
        'code' => 400
    ]);
    }
  

} catch (Exception $e) {
     http_response_code(400); 
        echo json_encode([
        'success' => false,
        'error' => $e,
        'code' => 400
    ]);
}
