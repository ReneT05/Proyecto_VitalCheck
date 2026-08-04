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
                $stmt = $db->prepare('SELECT * FROM presion_arterial WHERE id_presion = :id AND id_usuario = :id_usuario LIMIT 1');
                $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$row) respond(['success' => false, 'error' => 'No encontrado'], 404);
                respond(['success' => true, 'data' => $row]);
            }

            $sql = 'SELECT * FROM presion_arterial WHERE id_usuario = :id_usuario ORDER BY fecha_registro DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
            $stmt = $db->prepare($sql);
            $stmt->execute([':id_usuario' => $userId]);
            $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
            respond(['success' => true, 'data' => $all]);
            break;

        case 'POST':
            $metric = isset($input['metric']) ? trim($input['metric']) : null;
            $systolic = null;
            $diastolic = null;
            if ($metric && strpos($metric, '/') !== false) {
                [$systolic, $diastolic] = array_map('intval', explode('/', $metric));
            }
            $systolic = $systolic ?? (isset($input['sistolica']) ? intval($input['sistolica']) : null);
            $diastolic = $diastolic ?? (isset($input['diastolica']) ? intval($input['diastolica']) : null);
            $pulso = isset($input['pulso']) ? intval($input['pulso']) : (isset($input['value']) ? intval($input['value']) : null);

            if ($systolic === null || $diastolic === null || $pulso === null) respond(['success' => false, 'error' => 'sistolica, diastolica y pulso requeridos'], 400);

            $observ = isset($input['observaciones']) ? trim($input['observaciones']) : '';

            $stmt = $db->prepare('INSERT INTO presion_arterial (id_usuario, sistolica, diastolica, pulso, estado, observaciones, fecha_registro) VALUES (:id_usuario, :sistolica, :diastolica, :pulso, :estado, :observaciones, :fecha_registro)');
            $stmt->execute([
                ':id_usuario' => $userId,
                ':sistolica' => $systolic,
                ':diastolica' => $diastolic,
                ':pulso' => $pulso,
                ':estado' => 'Normal',
                ':observaciones' => $observ,
                ':fecha_registro' => date('Y-m-d H:i:s')
            ]);
            respond(['success' => true, 'id' => intval($db->lastInsertId()), 'message' => 'Creado'], 201);
            break;

        case 'PUT':
            if (!$id) respond(['success' => false, 'error' => 'ID requerido'], 400);
            $updates = [];
            $params = [':id_presion' => $id, ':id_usuario' => $userId];
            if (array_key_exists('metric', $input) && strpos($input['metric'], '/') !== false) {
                [$s, $d] = array_map('intval', explode('/', $input['metric']));
                $updates[] = 'sistolica = :sistolica';
                $updates[] = 'diastolica = :diastolica';
                $params[':sistolica'] = $s;
                $params[':diastolica'] = $d;
            }
            if (array_key_exists('sistolica', $input)) {
                $updates[] = 'sistolica = :sistolica';
                $params[':sistolica'] = intval($input['sistolica']);
            }
            if (array_key_exists('diastolica', $input)) {
                $updates[] = 'diastolica = :diastolica';
                $params[':diastolica'] = intval($input['diastolica']);
            }
            if (array_key_exists('pulso', $input) || array_key_exists('value', $input)) {
                $updates[] = 'pulso = :pulso';
                $params[':pulso'] = intval($input['pulso'] ?? $input['value']);
            }
            if (array_key_exists('observaciones', $input)) {
                $updates[] = 'observaciones = :observaciones';
                $params[':observaciones'] = $input['observaciones'];
            }
            if (empty($updates)) respond(['success' => false, 'error' => 'No hay campos para actualizar'], 400);
            $sql = 'UPDATE presion_arterial SET ' . implode(', ', $updates) . ' WHERE id_presion = :id_presion AND id_usuario = :id_usuario';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            respond(['success' => true, 'message' => 'Actualizado']);
            break;

        case 'DELETE':
            if (!$id) respond(['success' => false, 'error' => 'ID requerido'], 400);
            $stmt = $db->prepare('DELETE FROM presion_arterial WHERE id_presion = :id AND id_usuario = :id_usuario');
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
