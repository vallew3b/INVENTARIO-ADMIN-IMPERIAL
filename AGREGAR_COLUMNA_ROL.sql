-- ============================================
-- AGREGAR COLUMNA ROL A TABLA EXISTENTE
-- Ejecuta estos comandos en Supabase SQL Editor
-- ============================================

-- 1. Agregar la columna 'rol' a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN rol VARCHAR(20) DEFAULT 'admin';

-- 2. Actualizar el usuario admin para que tenga rol 'admin'
UPDATE usuarios 
SET rol = 'admin' 
WHERE usuario = 'admin';

-- 3. Actualizar el usuario vendedor para que tenga rol 'vendedor'
UPDATE usuarios 
SET rol = 'vendedor' 
WHERE usuario = 'vendedor';

-- 4. (Opcional) Agregar constraint para validar los roles
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('admin', 'vendedor'));

-- 5. Verificar que funcionó - deberías ver ambos usuarios con sus roles
SELECT id, usuario, nombre, rol FROM usuarios;




