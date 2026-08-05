<?php
require_once __DIR__ . '/conector.php';
// JWT removed — API uses explicit user_id parameter for identifying the user

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


function mapGlucoseRow(array $row): array
{
    return [
        'id_registro' => intval($row['id_glucosa'] ?? 0),
        'id_usuario' => intval($row['id_usuario'] ?? 0),
        'tipo_registro' => 'Azúcar',
        'descripcion' => $row['observaciones'] ?? '',
        'valor' => intval($row['nivel_glucosa'] ?? 0),
        'fecha_registro' => $row['fecha_registro'] ?? null,
        'title' => 'Azúcar',
        'metric' => $row['momento'] ?? '',
        'value' => intval($row['nivel_glucosa'] ?? 0),
        'created_at' => $row['fecha_registro'] ?? null
    ];
}

function mapPressureRow(array $row): array
{
    return [
        'id_registro' => intval($row['id_presion'] ?? 0),
        'id_usuario' => intval($row['id_usuario'] ?? 0),
        'tipo_registro' => 'Presión',
        'descripcion' => $row['observaciones'] ?? '',
        'valor' => intval($row['pulso'] ?? 0),
        'fecha_registro' => $row['fecha_registro'] ?? null,
        'title' => 'Presión',
        'metric' => isset($row['sistolica'], $row['diastolica']) ? ($row['sistolica'] . '/' . $row['diastolica']) : '',
        'value' => intval($row['pulso'] ?? 0),
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

$userId = null;
if (isset($_GET['user_id'])) {
    $userId = intval($_GET['user_id']);
} elseif (isset($input['user_id'])) {
    $userId = intval($input['user_id']);
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'user_id requerido']);
    exit;
}

try {

    switch ($method) {
        case 'GET':
            $q = isset($_GET['q']) ? trim($_GET['q']) : null;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

            if ($id) {
                // Try glucose
                $stmt = $db->prepare('SELECT * FROM glucosa WHERE id_glucosa = :id AND id_usuario = :id_usuario LIMIT 1');
                $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    echo json_encode(['success' => true, 'data' => mapGlucoseRow($row)], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Try pressure
                $stmt = $db->prepare('SELECT * FROM presion_arterial WHERE id_presion = :id AND id_usuario = :id_usuario LIMIT 1');
                $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    echo json_encode(['success' => true, 'data' => mapPressureRow($row)], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Elemento no encontrado']);
                exit;
            } else {
                $params = [':id_usuario' => $userId];

                $glucoseSql = 'SELECT * FROM glucosa WHERE id_usuario = :id_usuario';
                $pressureSql = 'SELECT * FROM presion_arterial WHERE id_usuario = :id_usuario';

                if ($q !== null && $q !== '') {
                    $glucoseSql .= ' AND (momento LIKE :query OR observaciones LIKE :query)';
                    $pressureSql .= ' AND (observaciones LIKE :query OR sistolica LIKE :query OR diastolica LIKE :query)';
                    $params[':query'] = "%$q%";
                }

                $glucoseSql .= ' ORDER BY fecha_registro DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
                $pressureSql .= ' ORDER BY fecha_registro DESC LIMIT ' . $limit . ' OFFSET ' . $offset;

                $stmt = $db->prepare($glucoseSql);
                $stmt->execute($params);
                $glucosaAll = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $stmt = $db->prepare($pressureSql);
                $stmt->execute($params);
                $pressureAll = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $mapped = [];
                foreach ($glucosaAll as $r) $mapped[] = mapGlucoseRow($r);
                foreach ($pressureAll as $r) $mapped[] = mapPressureRow($r);

                // Sort by created_at desc
                usort($mapped, function ($a, $b) {
                    return strtotime($b['created_at']) <=> strtotime($a['created_at']);
                });

                echo json_encode(['success' => true, 'data' => $mapped], JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'POST':
            $tipoRegistro = isset($input['tipo_registro']) ? trim($input['tipo_registro']) : (isset($input['title']) ? trim($input['title']) : '');
            $metric = isset($input['metric']) ? trim($input['metric']) : (isset($input['descripcion']) ? trim($input['descripcion']) : '');
            $valor = isset($input['valor']) ? $input['valor'] : (isset($input['value']) ? $input['value'] : null);

            if ($tipoRegistro === '' || $valor === null || $valor === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
                exit;
            }

            if (mb_strtolower($tipoRegistro) === 'azúcar' || mb_strtolower($tipoRegistro) === 'azucar') {
                $momento = $metric ?: 'Ayunas';
                $stmt = $db->prepare('INSERT INTO glucosa (id_usuario, nivel_glucosa, momento, estado, observaciones, fecha_registro) VALUES (:id_usuario, :nivel_glucosa, :momento, :estado, :observaciones, :fecha_registro)');
                $stmt->execute([
                    ':id_usuario' => $userId,
                    ':nivel_glucosa' => intval($valor),
                    ':momento' => $momento,
                    ':estado' => 'Normal',
                    ':observaciones' => '',
                    ':fecha_registro' => date('Y-m-d H:i:s')
                ]);
                echo json_encode(['success' => true, 'message' => 'Dato de glucosa creado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if (mb_strtolower($tipoRegistro) === 'presión' || mb_strtolower($tipoRegistro) === 'presion') {
                // metric expected as 'systolic/diastolic'
                $systolic = 0;
                $diastolic = 0;
                if (strpos($metric, '/') !== false) {
                    [$systolic, $diastolic] = array_map('intval', explode('/', $metric));
                }
                $pulse = intval($valor);
                $stmt = $db->prepare('INSERT INTO presion_arterial (id_usuario, sistolica, diastolica, pulso, estado, observaciones, fecha_registro) VALUES (:id_usuario, :sistolica, :diastolica, :pulso, :estado, :observaciones, :fecha_registro)');
                $stmt->execute([
                    ':id_usuario' => $userId,
                    ':sistolica' => $systolic,
                    ':diastolica' => $diastolic,
                    ':pulso' => $pulse,
                    ':estado' => 'Normal',
                    ':observaciones' => '',
                    ':fecha_registro' => date('Y-m-d H:i:s')
                ]);
                echo json_encode(['success' => true, 'message' => 'Dato de presión creado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Tipo de registro no soportado'], JSON_UNESCAPED_UNICODE);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }

            // Try update glucose
            $updates = [];
            $params = [];
            if (array_key_exists('metric', $input) || array_key_exists('momento', $input)) {
                $updates[] = 'momento = :momento';
                $params[':momento'] = $input['metric'] ?? $input['momento'];
            }
            if (array_key_exists('value', $input) || array_key_exists('nivel_glucosa', $input)) {
                $updates[] = 'nivel_glucosa = :nivel_glucosa';
                $params[':nivel_glucosa'] = intval($input['value'] ?? $input['nivel_glucosa']);
            }
            if ($updates) {
                $sql = 'UPDATE glucosa SET ' . implode(', ', $updates) . ' WHERE id_glucosa = :id_glucosa AND id_usuario = :id_usuario';
                $params[':id_glucosa'] = $id;
                $params[':id_usuario'] = $userId;
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'message' => 'Dato actualizado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Try update pressure
            $updates = [];
            $params = [];
            if (array_key_exists('metric', $input) && strpos($input['metric'], '/') !== false) {
                [$s, $d] = array_map('intval', explode('/', $input['metric']));
                $updates[] = 'sistolica = :sistolica';
                $updates[] = 'diastolica = :diastolica';
                $params[':sistolica'] = $s;
                $params[':diastolica'] = $d;
            }
            if (array_key_exists('value', $input) || array_key_exists('pulso', $input)) {
                $updates[] = 'pulso = :pulso';
                $params[':pulso'] = intval($input['value'] ?? $input['pulso']);
            }
            if ($updates) {
                $sql = 'UPDATE presion_arterial SET ' . implode(', ', $updates) . ' WHERE id_presion = :id_presion AND id_usuario = :id_usuario';
                $params[':id_presion'] = $id;
                $params[':id_usuario'] = $userId;
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'message' => 'Dato actualizado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No hay campos para actualizar']);
            exit;
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                exit;
            }

            // Try delete from glucose
            $stmt = $db->prepare('DELETE FROM glucosa WHERE id_glucosa = :id AND id_usuario = :id_usuario');
            $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Registro eliminado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Try delete from pressure
            $stmt = $db->prepare('DELETE FROM presion_arterial WHERE id_presion = :id AND id_usuario = :id_usuario');
            $stmt->execute([':id' => $id, ':id_usuario' => $userId]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Registro eliminado'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Elemento no encontrado']);
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
