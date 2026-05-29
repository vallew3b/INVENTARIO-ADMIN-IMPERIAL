-- ==========================================================
-- SCRIPT DE CONFIGURACIÓN SAAS MULTI-INQUILINO (TENANT)
-- ==========================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/qlinfgsqpzyhioqygevv/sql/new
--
-- Este script adapta la base de datos para soportar múltiples clientes
-- (comercios) compartiendo la misma base de datos pero aislados de forma segura.

-- 1. Crear tabla de comercios (inquilinos)
CREATE TABLE IF NOT EXISTS comercios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT '1_mes' NOT NULL, -- '1_mes', '6_meses', '1_ano', 'gratis'
    estado_suscripcion VARCHAR(20) DEFAULT 'activo' CHECK (estado_suscripcion IN ('activo', 'suspendido', 'vencido')) NOT NULL,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '1 month') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Insertar comercios de prueba iniciales
INSERT INTO comercios (nombre, plan, estado_suscripcion, fecha_vencimiento)
VALUES ('Refaccionaria Axel', '1_mes', 'activo', TIMEZONE('utc'::text, NOW() + INTERVAL '1 month'))
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO comercios (nombre, plan, estado_suscripcion, fecha_vencimiento)
VALUES ('Gorras Shop', '1_mes', 'activo', TIMEZONE('utc'::text, NOW() + INTERVAL '1 month'))
ON CONFLICT (nombre) DO NOTHING;

-- 3. Modificar tabla de usuarios para soportar rol de 'superadmin' y vincular a comercio
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS comercio_id BIGINT REFERENCES comercios(id) ON DELETE CASCADE;

-- Modificar restricción de rol en usuarios para admitir 'superadmin'
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('superadmin', 'admin', 'vendedor'));

-- 4. Modificar tablas operativas para vincularlas a un comercio
ALTER TABLE productos ADD COLUMN IF NOT EXISTS comercio_id BIGINT REFERENCES comercios(id) ON DELETE CASCADE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS comercio_id BIGINT REFERENCES comercios(id) ON DELETE CASCADE;
ALTER TABLE gastos_negocio ADD COLUMN IF NOT EXISTS comercio_id BIGINT REFERENCES comercios(id) ON DELETE CASCADE;

-- 5. Asignar el primer comercio a todos los registros existentes que no tengan comercio asignado
DO $$
DECLARE
    default_comercio_id BIGINT;
BEGIN
    SELECT id INTO default_comercio_id FROM comercios ORDER BY id ASC LIMIT 1;
    IF default_comercio_id IS NOT NULL THEN
        UPDATE usuarios SET comercio_id = default_comercio_id WHERE comercio_id IS NULL AND rol != 'superadmin';
        UPDATE productos SET comercio_id = default_comercio_id WHERE comercio_id IS NULL;
        UPDATE ventas SET comercio_id = default_comercio_id WHERE comercio_id IS NULL;
        UPDATE gastos_negocio SET comercio_id = default_comercio_id WHERE comercio_id IS NULL;
    END IF;
END $$;

-- 6. Insertar cuenta de Super Administrador (Tú, el dueño del SaaS)
-- Con esta cuenta podrás renovar suscripciones, crear nuevos clientes y desactivar accesos.
-- IMPORTANTE: Cambia la contraseña en tu primer inicio de sesión o edítala aquí.
INSERT INTO usuarios (usuario, password, nombre, rol)
VALUES ('admin_mora', 'mora1234', 'Super Administrador Mora', 'superadmin')
ON CONFLICT (usuario) DO NOTHING;

-- 7. Configuración de Row Level Security (RLS) y políticas de seguridad
ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;

-- Aplicar la misma política de seguridad x-app-secret a la tabla comercios
DROP POLICY IF EXISTS "Seguridad comercios" ON comercios;
CREATE POLICY "Seguridad comercios" ON comercios
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

-- Re-aplicar o verificar las políticas de seguridad existentes para todas las tablas
-- (Asegura compatibilidad con tu sistema de seguridad actual)

DROP POLICY IF EXISTS "Seguridad usuarios" ON usuarios;
CREATE POLICY "Seguridad usuarios" ON usuarios
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

DROP POLICY IF EXISTS "Seguridad productos" ON productos;
CREATE POLICY "Seguridad productos" ON productos
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

DROP POLICY IF EXISTS "Seguridad ventas" ON ventas;
CREATE POLICY "Seguridad ventas" ON ventas
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

DROP POLICY IF EXISTS "Seguridad gastos_negocio" ON gastos_negocio;
CREATE POLICY "Seguridad gastos_negocio" ON gastos_negocio
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');

-- 8. Consulta para verificar la migración
SELECT 'Migración Completada con Éxito' as estado;
SELECT id, nombre, plan, estado_suscripcion, fecha_vencimiento FROM comercios;
SELECT id, usuario, nombre, rol, comercio_id FROM usuarios;
