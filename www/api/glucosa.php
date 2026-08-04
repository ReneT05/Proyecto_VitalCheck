<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = getConexion();
} catch (Exception $e) {
    respond(['success' => false, 'error' => $e->getMessage()], 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// Determine user id, default to 1
$userId = null;
if (isset($_GET['user_id'])) {
    $userId = intval($_GET['user_id']);
} elseif (isset($input['user_id'])) {
    $userId = intval($input['user_id']);
}
if (!$userId) $userId = 1;

try {
    switch ($method) {
        case 'GET':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

            if ($id) {
                $stmt = $db->prepare('SELECT * FROM glucosa WHERE id_glucosa = :id AND id_usuario = :id_usuario LIMIT 1');
                $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$row) respond(['success' => false, 'error' => 'No encontrado'], 404);
                respond(['success' => true, 'data' => $row]);
            }

            $sql = 'SELECT * FROM glucosa WHERE id_usuario = :id_usuario ORDER BY fecha_registro DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
            $stmt = $db->prepare($sql);
            $stmt->execute([':id_usuario' => $userId]);
            $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
            respond(['success' => true, 'data' => $all]);
            break;

        case 'POST':
            $nivel = isset($input['nivel_glucosa']) ? intval($input['nivel_glucosa']) : (isset($input['value']) ? intval($input['value']) : null);
            $momento = isset($input['momento']) ? trim($input['momento']) : (isset($input['metric']) ? trim($input['metric']) : 'Ayunas');
            $observ = isset($input['observaciones']) ? trim($input['observaciones']) : '';

            if ($nivel === null) respond(['success' => false, 'error' => 'nivel_glucosa requerido'], 400);

            $stmt = $db->prepare('INSERT INTO glucosa (id_usuario, nivel_glucosa, momento, estado, observaciones, fecha_registro) VALUES (:id_usuario, :nivel_glucosa, :momento, :estado, :observaciones, :fecha_registro)');
            $stmt->execute([
                ':id_usuario' => $userId,
                ':nivel_glucosa' => $nivel,
                ':momento' => $momento,
                ':estado' => 'Normal',
                ':observaciones' => $observ,
                ':fecha_registro' => date('Y-m-d H:i:s')
            ]);
            respond(['success' => true, 'id' => intval($db->lastInsertId()), 'message' => 'Creado'], 201);
            break;

        case 'PUT':
            if (!$id) respond(['success' => false, 'error' => 'ID requerido'], 400);

            $updates = [];
            $params = [':id_glucosa' => $id, ':id_usuario' => $userId];

            if (array_key_exists('nivel_glucosa', $input) || array_key_exists('value', $input)) {
                $updates[] = 'nivel_glucosa = :nivel_glucosa';
                $params[':nivel_glucosa'] = intval($input['nivel_glucosa'] ?? $input['value']);
            }
            if (array_key_exists('momento', $input) || array_key_exists('metric', $input)) {
                $updates[] = 'momento = :momento';
                $params[':momento'] = $input['momento'] ?? $input['metric'];
            }
            if (array_key_exists('observaciones', $input)) {
                $updates[] = 'observaciones = :observaciones';
                $params[':observaciones'] = $input['observaciones'];
            }

            if (empty($updates)) respond(['success' => false, 'error' => 'No hay campos para actualizar'], 400);

            $sql = 'UPDATE glucosa SET ' . implode(', ', $updates) . ' WHERE id_glucosa = :id_glucosa AND id_usuario = :id_usuario';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            respond(['success' => true, 'message' => 'Actualizado']);
            break;

        case 'DELETE':
            if (!$id) respond(['success' => false, 'error' => 'ID requerido'], 400);
            $stmt = $db->prepare('DELETE FROM glucosa WHERE id_glucosa = :id AND id_usuario = :id_usuario');
            $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
            if ($stmt->rowCount() === 0) respond(['success' => false, 'error' => 'No encontrado'], 404);
            respond(['success' => true, 'message' => 'Eliminado']);
            break;

        default:
            respond(['success' => false, 'error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    respond(['success' => false, 'error' => $e->getMessage()], 500);
}
