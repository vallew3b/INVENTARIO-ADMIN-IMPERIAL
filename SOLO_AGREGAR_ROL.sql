-- ============================================
-- SOLO ESTOS COMANDOS - Ejecuta en Supabase SQL Editor
-- ============================================

-- 1. Agregar columna 'rol' si no existe (ejecuta este primero)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'admin';

-- 2. Actualizar el usuario vendedor para que tenga rol 'vendedor'
UPDATE usuarios 
SET rol = 'vendedor' 
WHERE usuario = 'vendedor';

-- 3. Asegurar que admin tenga rol 'admin' (por si acaso)
UPDATE usuarios 
SET rol = 'admin' 
WHERE usuario = 'admin';

-- 4. Verificar que funcionó (esto solo muestra los resultados)
SELECT id, usuario, nombre, rol FROM usuarios;




