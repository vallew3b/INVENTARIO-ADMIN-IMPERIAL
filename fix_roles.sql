-- Script para agregar campo rol y configurar usuarios
-- Ejecuta estos comandos UNO POR UNO en el SQL Editor de Supabase

-- 1. Agregar columna 'rol' si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'admin';

-- 2. Agregar constraint para validar los roles permitidos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'usuarios_rol_check'
    ) THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_rol_check 
        CHECK (rol IN ('admin', 'vendedor'));
    END IF;
END $$;

-- 3. Actualizar usuario vendedor para que tenga rol 'vendedor'
UPDATE usuarios 
SET rol = 'vendedor' 
WHERE usuario = 'vendedor';

-- 4. Asegurar que admin tenga rol 'admin'
UPDATE usuarios 
SET rol = 'admin' 
WHERE usuario = 'admin';

-- 5. Verificar que los cambios se aplicaron correctamente
SELECT id, usuario, nombre, rol FROM usuarios;




