<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
define('JWT_SECRET', '12345678910_aaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

function extraerJWT() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        return $matches[1];
    }
    return null;
}

function verificarJWT($jwt) {
    $secret_key = "12345678910_aaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbbbbbbbbbbbbbbbbbbbbb";// Cambia por tu clave secreta
    if($jwt == null){
          return ['valido' => false, 'error' =>"jwt inexistente"];
          exit;
          
    }
    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return ['valido' => true, 'data' => $decoded->data];
    } catch (Exception $e) {
        return ['valido' => false, 'error' => $e->getMessage()];
    }
}


function generarJWT(array $usuarioAutenticado, int $horasValidez = 1): string {
    $issued_at = time();
    // 60 segundos * 60 minutos * X horas
    $expiration_time = $issued_at + (60 * 60 * $horasValidez); 

    $payload = [
        'iat' => $issued_at,
        'exp' => $expiration_time,
        'data' => [
            'id'      => $usuarioAutenticado['id'],
            'usuario' => $usuarioAutenticado['nombre']
        ]
    ];

    // Generar y retornar el token firmado
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}
?>