<?php
require_once __DIR__ . '/conexion.php';

/**
 * Obtiene una instancia de Conexion con valores por defecto si no se proveen.
 *
 * @param array|null $opts Opciones de conexión: tipo, servidor, bd, usuario, contrasena
 * @return Conexion
 * @throws Exception si la conexión falla
 */
function getConexion(array $opts = null)
{
    if (!is_array($opts)) {
        $opts = [
            'tipo' => 'mysql',
            'servidor' => 'localhost',
            'bd' => 'vitalcheck',
            'usuario' => 'root',
            'contrasena' => ''
        ];
    }

    $db = new Conexion($opts);

    if (!$db->con) {
        throw new Exception('No se pudo conectar a la base de datos');
    }

    return $db;
}
