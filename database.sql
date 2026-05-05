-- =============================================
-- CARNICERÍA CONTROL DE DEUDAS - Base de Datos
-- Compatible con MySQL 5.7+
-- =============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio_kilo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado ENUM('pendiente','pagado','parcial') NOT NULL DEFAULT 'pendiente',
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS venta_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto VARCHAR(100) NOT NULL,
  kilos DECIMAL(10,3) NOT NULL,
  precio_kilo DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacion TEXT,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Usuario admin (contraseña: 123)
INSERT INTO usuarios (usuario, password, nombre) VALUES
('admin', '$2b$10$l0GGzzFvN2igB96Q7zYB..j2at64AVILZX9Uly7C3tppeqQCdBORK', 'Administrador')
ON DUPLICATE KEY UPDATE id=id;

-- Productos iniciales
INSERT INTO productos (nombre, precio_kilo, activo) VALUES
('Paletilla',   35.00, 1),
('Hueso Rojo',  15.00, 1),
('Pulpa',       45.00, 1),
('Pecho',       28.00, 1),
('Molida',      38.00, 1)
ON DUPLICATE KEY UPDATE id=id;
