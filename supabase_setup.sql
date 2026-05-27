-- Script de configuración de Supabase para el Sistema de Inventario
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 1. Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'vendedor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_inventario DECIMAL(10, 2) DEFAULT 0,
    precio_venta DECIMAL(10, 2) DEFAULT 0,
    precio DECIMAL(10, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    talla VARCHAR(20),
    categoria VARCHAR(100),
    color VARCHAR(50),
    imagen TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Crear tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Insertar usuarios (Ejecutar directamente en el SQL Editor con tus propios usuarios/contraseñas seguros)
-- NOTA DE SEGURIDAD: Nunca guardes contraseñas reales en tu código público de GitHub.
-- Puedes crear tu usuario administrador ejecutando un comando como este en tu editor SQL de Supabase:
-- INSERT INTO usuarios (usuario, password, nombre, rol)
-- VALUES ('tu_usuario_admin', 'tu_contraseña_segura', 'Tu Nombre', 'admin');

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_variantes ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS (Permiten el acceso únicamente si se incluye la llave secreta en los headers)
-- Esto protege la base de datos contra accesos directos no autorizados mediante la Anon Key pública.

CREATE POLICY "Seguridad usuarios" ON usuarios
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

CREATE POLICY "Seguridad productos" ON productos
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

CREATE POLICY "Seguridad ventas" ON ventas
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

CREATE POLICY "Seguridad producto_variantes" ON producto_variantes
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

-- 7. Crear bucket de Storage para imágenes (ejecutar en Storage de Supabase)
-- Ve a Storage en el panel de Supabase y crea un bucket llamado "imagenes"
-- O ejecuta esto en el SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Crear política para el bucket de imágenes (permite lectura pública y escritura con service key)
CREATE POLICY "Permitir lectura pública de imágenes" ON storage.objects
    FOR SELECT USING (bucket_id = 'imagenes');

CREATE POLICY "Permitir subida de imágenes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'imagenes');

CREATE POLICY "Permitir actualización de imágenes" ON storage.objects
    FOR UPDATE USING (bucket_id = 'imagenes');

CREATE POLICY "Permitir eliminación de imágenes" ON storage.objects
    FOR DELETE USING (bucket_id = 'imagenes');


-- 9. Crear tabla de gastos e inversiones (OPEX Tracker)
CREATE TABLE IF NOT EXISTS gastos_negocio (
    id BIGSERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Otros' NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE gastos_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seguridad gastos_negocio" ON gastos_negocio
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

