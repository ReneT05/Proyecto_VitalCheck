-- ==========================================
-- BASE DE DATOS: VITALCHECK
-- ==========================================

CREATE DATABASE IF NOT EXISTS vitalcheck;
USE vitalcheck;

-- ==========================================
-- TABLA DE USUARIOS
-- ==========================================

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100),
    contrasena VARCHAR(255) NOT NULL,
    pin VARCHAR(10),
    fecha_nacimiento DATE,
    sexo ENUM('Masculino','Femenino','Otro'),
    telefono VARCHAR(15),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA DE MÉDICOS
-- ==========================================

CREATE TABLE medicos (
    id_medico INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(15),
    correo VARCHAR(100)
);

-- ==========================================
-- TABLA DE GLUCOSA
-- ==========================================

CREATE TABLE glucosa (
    id_glucosa INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nivel_glucosa INT NOT NULL,
    momento ENUM(
        'Ayunas',
        'Antes de comer',
        'Después de comer',
        'Antes de dormir'
    ),
    estado ENUM(
        'Normal',
        'Elevado',
        'Critico'
    ),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ==========================================
-- TABLA DE PRESIÓN ARTERIAL
-- ==========================================

CREATE TABLE presion_arterial (
    id_presion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    sistolica INT NOT NULL,
    diastolica INT NOT NULL,
    pulso INT NOT NULL,
    estado ENUM(
        'Normal',
        'Elevado',
        'Critico'
    ),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ==========================================
-- TABLA DE ALERTAS
-- ==========================================

CREATE TABLE alertas (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50),
    mensaje VARCHAR(255),
    nivel ENUM(
        'Verde',
        'Amarillo',
        'Rojo'
    ),
    leida BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ==========================================
-- TABLA DE REPORTES
-- ==========================================

CREATE TABLE reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    formato ENUM('PDF') DEFAULT 'PDF',
    archivo VARCHAR(255),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ==========================================
-- DATOS DE PRUEBA
-- ==========================================

INSERT INTO usuarios
(nombre, apellido, usuario, correo, contrasena, pin, telefono)
VALUES
('René', 'Treviño', 'admin', 'admin@vitalcheck.com', 'admin123', '1234', '8661234567');

INSERT INTO medicos
(nombre, especialidad, telefono, correo)
VALUES
('Carlos Martínez', 'Cardiólogo', '8669876543', 'carlos@hospital.com');

INSERT INTO glucosa
(id_usuario, nivel_glucosa, momento, estado)
VALUES
(1, 95, 'Ayunas', 'Normal');

INSERT INTO glucosa
(id_usuario, nivel_glucosa, momento, estado)
VALUES
(1, 145, 'Después de comer', 'Elevado');

INSERT INTO presion_arterial
(id_usuario, sistolica, diastolica, pulso, estado)
VALUES
(1, 120, 80, 72, 'Normal');

INSERT INTO presion_arterial
(id_usuario, sistolica, diastolica, pulso, estado)
VALUES
(1, 145, 95, 90, 'Critico');