<?php
header('Content-Type: application/json; charset=utf-8');

http_response_code(200);
echo json_encode([
    'success' => true,
    'app' => 'Vitalcheck API',
    'endpoints' => [
        'glucosa' => 'glucosa.php',
        'presion' => 'presion.php'
    ],
    'note' => 'Use los endpoints GET/POST/PUT/DELETE con opcional user_id en la query string o body.'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
