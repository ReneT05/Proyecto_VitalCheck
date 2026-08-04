<?php
require_once __DIR__ . '/conector.php';
require_once __DIR__ . '/jwt.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

$secretKey = 'ViatlcheckJWTSecret';
$token = getBearerToken();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!verifyJwt($token, $secretKey)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$payload = decodeJwt($token);
$userId = $payload['uid'] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Token inválido']);
    exit;
}

try {
    $db = getConexion();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {
    switch ($method) {
        case 'GET':
            $q = isset($_GET['q']) ? trim($_GET['q']) : null;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

            if ($id) {
                $select = $db->select('vital_data');
                $select->where('id', '=', $id);
                $select->where_and('user_id', '=', $userId);
                $rows = $select->execute();
                if (empty($rows)) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Elemento no encontrado']);
                    exit;
                }
                echo json_encode(['success' => true, 'data' => $rows[0]], JSON_UNESCAPED_UNICODE);
            } else {
                if ($q !== null && $q !== '') {
                    $sql = 'SELECT * FROM vital_data WHERE user_id = ? AND (title LIKE ? OR metric LIKE ? OR created_at LIKE ?) ORDER BY created_at DESC';
                    $params = [$userId, "%$q%", "%$q%", "%$q%"];
                    if ($limit > 0) {
                        $sql .= ' LIMIT ?, ?';
                        $params[] = $offset;
                        $params[] = $limit;
                    }
                    $stmt = $db->prepare($sql);
                    foreach ($params as $index => $value) {
                        $stmt->bindValue($index + 1, $value);
                    }
                    $stmt->execute();
                    $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $select = $db->select('vital_data');
                    $select->where('user_id', '=', $userId);
                    $select->orderby('created_at DESC');
                    if ($limit > 0) {
                        $select->limit("$offset, $limit");
                    }
                    $all = $select->execute();
                }
                echo json_encode(['success' => true, 'data' => $all], JSON_UNESCAPED_UNICODE);
            }
            break;
        case 'POST':
            if (!isset($input['title']) || !isset($input['metric']) || !isset($input['value'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
                exit;
            }
            $insert = $db->insert('vital_data', 'user_id,title,metric,value,created_at');
            $insert->value($userId);
            $insert->value($input['title']);
            $insert->value($input['metric']);
            $insert->value($input['value']);
            $insert->value(date('Y-m-d H:i:s'));
            $insert->execute();
            echo json_encode(['success' => true, 'message' => 'Dato creado'], JSON_UNESCAPED_UNICODE);
            break;
        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }
            $update = $db->update('vital_data');
            $updated = false;
            foreach (['title', 'metric', 'value'] as $field) {
                if (isset($input[$field])) {
                    $update->set($field, $input[$field]);
                    $updated = true;
                }
            }
            if (!$updated) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No hay campos para actualizar']);
                exit;
            }
            $update->where('id', '=', $id);
            $update->where_and('user_id', '=', $userId);
            $update->execute();
            echo json_encode(['success' => true, 'message' => 'Dato actualizado'], JSON_UNESCAPED_UNICODE);
            break;
        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }
            $del = $db->delete('vital_data');
            $del->where('id', '=', $id);
            $del->where_and('user_id', '=', $userId);
            $del->execute();
            echo json_encode(['success' => true, 'message' => 'Dato eliminado'], JSON_UNESCAPED_UNICODE);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
