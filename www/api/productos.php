<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$remoteBase = 'https://elrjtd.online/DDI/RENE';
$remoteUrl = $remoteBase . '/productos.php';
$query = $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';
$remoteUrl .= $query;

function getRequestHeaders() {
    if (function_exists('getallheaders')) {
        return getallheaders();
    }

    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (strpos($name, 'HTTP_') === 0) {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            $headers[$headerName] = $value;
        }
    }
    return $headers;
}

$ch = curl_init($remoteUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$headers = [];
foreach (getRequestHeaders() as $name => $value) {
    if (strtolower($name) === 'host') {
        continue;
    }
    $headers[] = "$name: $value";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error proxy: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
if ($contentType) {
    header("Content-Type: $contentType");
}
http_response_code($status);
echo $response;
curl_close($ch);
exit;

            if (!$id && !$codigo) {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere id o código en la query string'
                ]);

                exit;
            }

            $allowed = [
                'nombre',
                'descripcion',
                'precio',
                'cantidad'
            ];

            $update = $db->update('productos');

            $setCount = 0;

            foreach ($allowed as $field) {

                if (array_key_exists($field, $input)) {

                    $update->set($field, $input[$field]);

                    $setCount++;
                }
            }

            if ($setCount === 0) {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'No hay campos para actualizar'
                ]);

                exit;
            }

            if ($id) {
                $update->where('id', '=', $id);
            } else {
                $update->where('codigo', '=', $codigo);
            }

            $affected = $update->execute();

            echo json_encode([
                'success' => true,
                'updated' => (int)$affected
            ], JSON_UNESCAPED_UNICODE);

        break;


        // =========================
        // DELETE
        // =========================
        case 'DELETE':

            if (!$id) {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere id en la query string'
                ]);

                exit;
            }

            $del = $db->delete('productos');

            $del->where('id', '=', $id);

            $affected = $del->execute();

            echo json_encode([
                'success' => true,
                'deleted' => (int)$affected
            ], JSON_UNESCAPED_UNICODE);

        break;


        default:

            http_response_code(405);

            echo json_encode([
                'success' => false,
                'error' => 'Método no permitido'
            ]);

        break;
    }

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>