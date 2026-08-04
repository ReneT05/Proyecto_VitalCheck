<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/conector.php';


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}



try {

    $db = getConexion();

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);

    exit;

}



$method = $_SERVER['REQUEST_METHOD'];

$id = isset($_GET['id']) ? intval($_GET['id']) : null;


$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    $input = $_POST;
}



function mapUserRow($r)
{

    return [

        "id_usuario" => intval($r['id_usuario']),
        "nombre" => $r['nombre'],
        "apellido" => $r['apellido'],
        "usuario" => $r['usuario'],
        "correo" => $r['correo'],
        "pin" => $r['pin'],
        "fecha_nacimiento" => $r['fecha_nacimiento'],
        "sexo" => $r['sexo'],
        "telefono" => $r['telefono'],
        "fecha_registro" => $r['fecha_registro']

    ];

}




try {


    switch ($method) {



        /*
        ================================================
                            GET
        ================================================
        */


        case "GET":


            if ($id) {


                $stmt = $db->prepare(
                    "SELECT id_usuario,nombre,apellido,usuario,correo,pin,
            fecha_nacimiento,sexo,telefono,fecha_registro
            FROM usuarios
            WHERE id_usuario=:id"
                );


                $stmt->execute([
                    ":id" => $id
                ]);


                $user = $stmt->fetch(PDO::FETCH_ASSOC);



                if (!$user) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "error" => "Usuario no encontrado"
                    ]);

                    exit;

                }



                echo json_encode([
                    "success" => true,
                    "data" => mapUserRow($user)
                ]);

                exit;


            }



            $stmt = $db->query(
                "SELECT id_usuario,nombre,apellido,usuario,correo,pin,
        fecha_nacimiento,sexo,telefono,fecha_registro
        FROM usuarios
        ORDER BY fecha_registro DESC"
            );


            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);



            echo json_encode([

                "success" => true,

                "data" => array_map("mapUserRow", $usuarios)

            ]);



            break;





        /*
        ================================================
                            POST
        ================================================
        */


        case "POST":



            // ===============================
// LOGIN
// ===============================

            if (isset($input['accion']) && $input['accion'] == "login") {


                $usuario = trim($input['usuario'] ?? '');
                $contrasena = trim($input['contrasena'] ?? '');
                $pin = trim($input['pin'] ?? '');



                // LOGIN USUARIO PASSWORD

                if ($usuario != "" && $contrasena != "") {


                    $stmt = $db->prepare(
                        "SELECT * FROM usuarios
             WHERE usuario=:usuario
             LIMIT 1"
                    );


                    $stmt->execute([
                        ":usuario" => $usuario
                    ]);


                    $user = $stmt->fetch(PDO::FETCH_ASSOC);



                    if (!$user) {

                        http_response_code(401);

                        echo json_encode([
                            "success" => false,
                            "error" => "Usuario no encontrado"
                        ]);

                        exit;

                    }

                $passwordOk = false;
                if (password_needs_rehash($user['contrasena'], PASSWORD_DEFAULT)) {
                    $passwordOk = ($contrasena === $user['contrasena']);
                } else {
                    $passwordOk = password_verify($contrasena, $user['contrasena']);
                    if (!$passwordOk && $contrasena === $user['contrasena']) {
                        $passwordOk = true;
                    }
                }

                if (!$passwordOk) {
                    http_response_code(401);
                    echo json_encode([
                        "success" => false,
                        "error" => "Contraseña incorrecta"
                    ]);
                    exit;
                }

                if (!password_get_info($user['contrasena'])['algo']) {
                    // plain password stored, optionally rehash on login
                    $newHash = password_hash($contrasena, PASSWORD_DEFAULT);
                    $rehashStmt = $db->prepare('UPDATE usuarios SET contrasena = :hash WHERE id_usuario = :id');
                    $rehashStmt->execute([':hash' => $newHash, ':id' => $user['id_usuario']]);
                }

                echo json_encode([
                    "success" => true,
                    "token" => "vital-" . time(),
                    "usuario" => [
                        "id_usuario" => $user['id_usuario'],
                        "nombre" => $user['nombre'],
                        "usuario" => $user['usuario']
                    ]
                ]);


                    $stmt = $db->prepare(
                        "SELECT * FROM usuarios
             WHERE pin=:pin
             LIMIT 1"
                    );


                    $stmt->execute([
                        ":pin" => $pin
                    ]);



                    $user = $stmt->fetch(PDO::FETCH_ASSOC);



                    if (!$user) {


                        http_response_code(401);


                        echo json_encode([

                            "success" => false,

                            "error" => "PIN incorrecto"

                        ]);


                        exit;

                    }




                    echo json_encode([

                        "success" => true,

                        "token" => "vital-" . time(),

                        "usuario" => [

                            "id_usuario" => $user['id_usuario'],

                            "nombre" => $user['nombre'],

                            "usuario" => $user['usuario']

                        ]

                    ]);



                    exit;


                }



                echo json_encode([

                    "success" => false,

                    "error" => "Faltan datos de login"

                ]);


                exit;


            }




            // ===============================
// REGISTRO
// ===============================


            $nombre = $input['nombre'] ?? "";
            $apellido = $input['apellido'] ?? "";
            $usuario = $input['usuario'] ?? "";
            $correo = $input['correo'] ?? "";
            $contrasena = $input['contrasena'] ?? "";
            $pin = $input['pin'] ?? null;
            $fecha = $input['fecha_nacimiento'] ?? null;
            $sexo = $input['sexo'] ?? null;
            $telefono = $input['telefono'] ?? null;



            if (
                $nombre == "" ||
                $apellido == "" ||
                $usuario == "" ||
                $contrasena == ""
            ) {


                http_response_code(400);


                echo json_encode([

                    "success" => false,

                    "error" => "Faltan campos obligatorios"

                ]);


                exit;


            }



            $stmt = $db->prepare(
                "SELECT id_usuario 
     FROM usuarios
     WHERE usuario=:usuario"
            );


            $stmt->execute([
                ":usuario" => $usuario
            ]);



            if ($stmt->fetch()) {


                http_response_code(409);


                echo json_encode([

                    "success" => false,

                    "error" => "Usuario ya existe"

                ]);


                exit;


            }




            $stmt = $db->prepare(

                "INSERT INTO usuarios

(nombre,apellido,usuario,correo,contrasena,pin,
fecha_nacimiento,sexo,telefono)

VALUES

(:nombre,:apellido,:usuario,:correo,:contrasena,
:pin,:fecha,:sexo,:telefono)"

            );



            $stmt->execute([


                ":nombre" => $nombre,
                ":apellido" => $apellido,
                ":usuario" => $usuario,
                ":correo" => $correo,
                ":contrasena" => $contrasena,
                ":pin" => $pin,
                ":fecha" => $fecha,
                ":sexo" => $sexo,
                ":telefono" => $telefono


            ]);



            echo json_encode([

                "success" => true,

                "message" => "Usuario creado",

                "id" => $db->lastInsertId()

            ]);



            break;






        /*
        ================================================
                            PUT
        ================================================
        */


        case "PUT":


            if (!$id) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "error" => "ID requerido"
                ]);

                exit;

            }



            $campos = [];
            $params = [];



            foreach ([

                "nombre",
                "apellido",
                "usuario",
                "correo",
                "contrasena",
                "pin",
                "fecha_nacimiento",
                "sexo",
                "telefono"

            ] as $campo) {


                if (isset($input[$campo])) {

                    $campos[] = "$campo=:$campo";

                    $params[":$campo"] = $input[$campo];

                }


            }



            if (!$campos) {

                echo json_encode([

                    "success" => false,

                    "error" => "Nada que actualizar"

                ]);

                exit;

            }



            $params[":id"] = $id;



            $sql = "UPDATE usuarios SET "
                . implode(",", $campos) .
                " WHERE id_usuario=:id";



            $stmt = $db->prepare($sql);

            $stmt->execute($params);



            echo json_encode([

                "success" => true,

                "message" => "Usuario actualizado"

            ]);



            break;





        /*
        ================================================
                            DELETE
        ================================================
        */


        case "DELETE":


            if (!$id) {

                http_response_code(400);

                echo json_encode([

                    "success" => false,

                    "error" => "ID requerido"

                ]);

                exit;

            }



            $stmt = $db->prepare(
                "DELETE FROM usuarios
WHERE id_usuario=:id"
            );



            $stmt->execute([

                ":id" => $id

            ]);



            echo json_encode([

                "success" => true,

                "message" => "Usuario eliminado"

            ]);



            break;




        default:


            http_response_code(405);


            echo json_encode([

                "success" => false,

                "error" => "Metodo no permitido"

            ]);


    }




} catch (Exception $e) {


    http_response_code(500);


    echo json_encode([

        "success" => false,

        "error" => $e->getMessage()

    ]);


}


?>