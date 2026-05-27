-- ==========================================================
-- SCRIPT PARA AGREGAR LA TABLA DE GASTOS E INVERSIONES (OPEX)
-- ==========================================================
-- Ejecuta estos comandos en el SQL Editor de tu panel de Supabase
-- para crear la tabla de control de gastos e inversiones del negocio.

CREATE TABLE IF NOT EXISTS gastos_negocio (
    id BIGSERIAL PRIMARY KEY,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Otros' NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1. Habilitar Row Level Security (RLS) para proteger la información
ALTER TABLE gastos_negocio ENABLE ROW LEVEL SECURITY;

-- 2. Crear política de acceso seguro mediante la cabecera secreta de tu aplicación
-- Esto garantiza que solo tu panel de control tenga acceso a leer y guardar datos
CREATE POLICY "Seguridad gastos_negocio" ON gastos_negocio
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!')
    WITH CHECK (current_setting('request.headers', true)::json->>'x-app-secret' = 'UrbanStoreImperio2026SecretKey!');
