?php
// Fijar el directorio de trabajo a la ubicación del script (Esencial para Cron)
chdir(__DIR__);

// Ocultar salida de errores en consola
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Rutas absolutas para CLI
require_once __DIR__ . '/../conector.php';
require_once __DIR__ . '/../../../vendor/autoload.php';

try {
    $db = getConexion();
} catch (Exception $e) {
    error_log("Error de conexión a BD en Cron: " . $e->getMessage());
    exit(1);
}

$serviceAccount = __DIR__ . '/serviceAccountRecordatorio.json';
if (!file_exists($serviceAccount)) {
    error_log("No existe el archivo de credenciales de Firebase.");
    exit(1);
}

$firebase = (new Kreait\Firebase\Factory)->withServiceAccount($serviceAccount)->createMessaging();

// Obtener tokens registrados en la BD
$select = $db->Select("usuario", "token_firebase", "WHERE token_firebase IS NOT NULL");
$results = $select->execute();

if (empty($results)) {
    exit(0);
}


// Estructurar notificación
$message = [
    'notification' => [
        'title' => "Gastos",
        'body'  => "No olvides mantenerte al dia con tus gastos"
    ]
];

// Enviar a cada token
foreach ($results as $result) {
    $token = trim($result["token_firebase"] ?? '');

    if (empty($token)) {
        continue;
    }

    $message['token'] = $token;

    try {
        $firebase->send($message);
    } catch (Exception $e) {
        echo "error";
        // En caso de token inválido o expirado, lo registra en el log del servidor
        error_log("Error Firebase al enviar a {$token}: " . $e->getMessage());
    }
}

// Finalización silenciosa para la consola
exit(0);