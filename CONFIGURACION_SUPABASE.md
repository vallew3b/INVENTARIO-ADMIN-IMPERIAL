# Configuración de Supabase

## Pasos para configurar Supabase

### 1. Crear las tablas en Supabase

1. Ve a tu proyecto en Supabase: https://pyuqebokjhtwyrojwgxd.supabase.co
2. Ve a **SQL Editor** en el menú lateral
3. Copia y pega el contenido del archivo `supabase_setup.sql`
4. Ejecuta el script completo

### 2. Configurar Storage para imágenes

1. Ve a **Storage** en el menú lateral de Supabase
2. Crea un nuevo bucket llamado `imagenes`
3. Marca el bucket como **Público** (public)
4. Las políticas de seguridad ya están configuradas en el script SQL

### 3. Verificar credenciales

Las credenciales ya están configuradas en `supabase.js`:
- URL: https://pyuqebokjhtwyrojwgxd.supabase.co
- Service Key: Configurada (para operaciones del backend)
- Anon Key: Configurada (para operaciones del frontend)

### 4. Usuario por defecto

El script SQL crea automáticamente un usuario por defecto:
- **Usuario:** admin
- **Contraseña:** admin123

## Estructura de las tablas

### usuarios
- `id` (BIGSERIAL PRIMARY KEY)
- `usuario` (VARCHAR, UNIQUE)
- `password` (VARCHAR)
- `nombre` (VARCHAR)
- `created_at` (TIMESTAMP)

### productos
- `id` (BIGSERIAL PRIMARY KEY)
- `codigo` (VARCHAR, UNIQUE)
- `nombre` (VARCHAR)
- `descripcion` (TEXT)
- `precio_inventario` (DECIMAL)
- `precio_venta` (DECIMAL)
- `precio` (DECIMAL)
- `stock` (INTEGER)
- `talla` (VARCHAR)
- `categoria` (VARCHAR)
- `color` (VARCHAR)
- `imagen` (TEXT) - Ruta en Storage
- `fecha_creacion` (TIMESTAMP)

### ventas
- `id` (BIGSERIAL PRIMARY KEY)
- `producto_id` (BIGINT, FK a productos)
- `cantidad` (INTEGER)
- `precio_unitario` (DECIMAL)
- `total` (DECIMAL)
- `fecha` (TIMESTAMP)

## Funcionalidades implementadas

✅ **Autenticación** - Login con usuarios de Supabase
✅ **Productos** - CRUD completo de productos
✅ **Imágenes** - Almacenamiento en Supabase Storage
✅ **Ventas** - Registro y consulta de ventas
✅ **Estadísticas** - Cálculo de estadísticas desde Supabase
✅ **Historial** - Consulta de ventas por fecha

## Notas importantes

- Las imágenes se almacenan en el bucket `imagenes` de Supabase Storage
- Las URLs de las imágenes son públicas y se generan automáticamente
- El sistema actualiza automáticamente el stock cuando se realizan ventas
- Todas las operaciones usan la service key para máxima compatibilidad




