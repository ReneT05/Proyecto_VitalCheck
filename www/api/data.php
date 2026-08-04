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

function mapVitalRecord(array $row): array
{
    return [
        'id_registro' => intval($row['id_registro'] ?? 0),
        'id_usuario' => intval($row['id_usuario'] ?? 0),
        'tipo_registro' => $row['tipo_registro'] ?? '',
        'descripcion' => $row['descripcion'] ?? '',
        'valor' => $row['valor'] ?? null,
        'fecha_registro' => $row['fecha_registro'] ?? null,
        'title' => $row['tipo_registro'] ?? '',
        'metric' => $row['descripcion'] ?? '',
        'value' => $row['valor'] ?? null,
        'created_at' => $row['fecha_registro'] ?? null
    ];
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
                $stmt = $db->prepare('SELECT * FROM registros_vitales WHERE id_registro = :id_registro AND id_usuario = :id_usuario LIMIT 1');
                $stmt->execute([':id_registro' => $id, ':id_usuario' => $userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$row) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Elemento no encontrado']);
                    exit;
                }

                echo json_encode(['success' => true, 'data' => mapVitalRecord($row)], JSON_UNESCAPED_UNICODE);
            } else {
                $sql = 'SELECT * FROM registros_vitales WHERE id_usuario = :id_usuario';
                $params = [':id_usuario' => $userId];

                if ($q !== null && $q !== '') {
                    $sql .= ' AND (tipo_registro LIKE :query OR descripcion LIKE :query OR fecha_registro LIKE :query)';
                    $params[':query'] = "%$q%";
                }

                $sql .= ' ORDER BY fecha_registro DESC';

                if ($limit > 0) {
                    $sql .= ' LIMIT ' . $limit . ' OFFSET ' . $offset;
                }

                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $all = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $mapped = array_map('mapVitalRecord', $all);
                echo json_encode(['success' => true, 'data' => $mapped], JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'POST':
            $tipoRegistro = isset($input['tipo_registro']) ? trim($input['tipo_registro']) : (isset($input['title']) ? trim($input['title']) : '');
            $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : (isset($input['metric']) ? trim($input['metric']) : '');
            $valor = isset($input['valor']) ? $input['valor'] : (isset($input['value']) ? $input['value'] : null);

            if ($tipoRegistro === '' || $descripcion === '' || $valor === null || $valor === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
                exit;
            }

            $stmt = $db->prepare('INSERT INTO registros_vitales (id_usuario, tipo_registro, descripcion, valor, fecha_registro) VALUES (:id_usuario, :tipo_registro, :descripcion, :valor, :fecha_registro)');
            $stmt->execute([
                ':id_usuario' => $userId,
                ':tipo_registro' => $tipoRegistro,
                ':descripcion' => $descripcion,
                ':valor' => $valor,
                ':fecha_registro' => date('Y-m-d H:i:s')
            ]);

            echo json_encode(['success' => true, 'message' => 'Dato creado'], JSON_UNESCAPED_UNICODE);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }

            $updates = [];
            $params = [':id_registro' => $id, ':id_usuario' => $userId];

            if (array_key_exists('tipo_registro', $input) || array_key_exists('title', $input)) {
                $value = isset($input['tipo_registro']) ? trim($input['tipo_registro']) : trim($input['title']);
                $updates[] = 'tipo_registro = :tipo_registro';
                $params[':tipo_registro'] = $value;
            }

            if (array_key_exists('descripcion', $input) || array_key_exists('metric', $input)) {
                $value = isset($input['descripcion']) ? trim($input['descripcion']) : trim($input['metric']);
                $updates[] = 'descripcion = :descripcion';
                $params[':descripcion'] = $value;
            }

            if (array_key_exists('valor', $input) || array_key_exists('value', $input)) {
                $value = isset($input['valor']) ? $input['valor'] : $input['value'];
                $updates[] = 'valor = :valor';
                $params[':valor'] = $value;
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No hay campos para actualizar']);
                exit;
            }

            $sql = 'UPDATE registros_vitales SET ' . implode(', ', $updates) . ' WHERE id_registro = :id_registro AND id_usuario = :id_usuario';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'Dato actualizado'], JSON_UNESCAPED_UNICODE);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }

            $stmt = $db->prepare('DELETE FROM registros_vitales WHERE id_registro = :id_registro AND id_usuario = :id_usuario');
            $stmt->execute([':id_registro' => $id, ':id_usuario' => $userId]);

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
