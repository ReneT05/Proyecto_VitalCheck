-- ============================================
-- BASE DE DATOS VITALCHECK
-- ============================================

CREATE DATABASE IF NOT EXISTS `vitalcheck`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE `vitalcheck`;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================

CREATE TABLE IF NOT EXISTS `usuarios` (

    `id_usuario` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    `usuario` VARCHAR(100) NOT NULL UNIQUE,

    `contrasena` VARCHAR(255) NOT NULL,

    `nombre_completo` VARCHAR(255),

    `pin` VARCHAR(10),

    `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),

    PRIMARY KEY (`id_usuario`)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;

-- Usuario administrador

INSERT INTO `usuarios`
(`usuario`,`contrasena`,`nombre_completo`,`pin`)
VALUES
('admin','admin123','Administrador Principal','1234');

-- ============================================
-- TABLA DE REGISTROS DE SIGNOS VITALES
-- ============================================

CREATE TABLE IF NOT EXISTS `registros_vitales` (

    `id_registro` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    `id_usuario` INT UNSIGNED NOT NULL,

    `tipo_registro` VARCHAR(50) NOT NULL,

    `descripcion` VARCHAR(100) NOT NULL,

    `valor` DECIMAL(10,2) NOT NULL,

    `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),

    PRIMARY KEY (`id_registro`),

    INDEX `idx_usuario` (`id_usuario`),

    CONSTRAINT `fk_usuario_registro`
        FOREIGN KEY (`id_usuario`)
        REFERENCES `usuarios`(`id_usuario`)
        ON DELETE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;d`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
