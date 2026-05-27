# Sistema de Inventario - Electron

Sistema completo de inventario desarrollado con Electron, que puede ser empaquetado como aplicación .exe para Windows.

## Características

- 🔐 **Sistema de autenticación** - Inicio de sesión seguro
- 📊 **Dashboard con estadísticas** - Vista general del negocio
- 📋 **Gestión de inventario** - Visualización y gestión de productos
- 💰 **Módulo de ventas** - Registro y consulta de ventas
- ➕ **Agregar productos** - Formulario para nuevos productos
- 💾 **Base de datos SQLite** - Almacenamiento local persistente

## Instalación

1. Instalar dependencias:
```bash
npm install
```

## Uso

### Modo Desarrollo

Para ejecutar la aplicación en modo desarrollo:
```bash
npm start
```

### Credenciales por Defecto

- **Usuario:** admin
- **Contraseña:** admin123

## Empaquetado como .exe

Para crear el ejecutable de Windows:

```bash
npm run build-win
```

El archivo .exe se generará en la carpeta `dist/`.

### Requisitos para Empaquetado

- Windows 10 o superior
- Node.js instalado
- Todas las dependencias instaladas (`npm install`)

## Estructura del Proyecto

```
INVENTA/
├── main.js              # Proceso principal de Electron
├── preload.js           # Script de preload (seguridad)
├── index.html           # Página de inicio de sesión
├── dashboard.html       # Dashboard principal
├── login.js             # Lógica de autenticación
├── dashboard.js         # Lógica del dashboard
├── styles.css           # Estilos de la aplicación
├── package.json         # Configuración del proyecto
└── README.md           # Este archivo
```

## Base de Datos

La aplicación utiliza SQLite para almacenar:
- Usuarios
- Productos
- Ventas

La base de datos se crea automáticamente en la carpeta de datos del usuario de Electron.

## Distribución

Una vez generado el .exe, puedes:
1. Copiar el instalador desde la carpeta `dist/`
2. Distribuirlo a otras computadoras
3. Instalarlo en múltiples laptops

El instalador incluye todas las dependencias necesarias.

## Notas

- La base de datos se almacena localmente en cada instalación
- Para compartir datos entre computadoras, necesitarías implementar sincronización adicional
- El usuario por defecto puede ser cambiado desde la base de datos después de la primera ejecución


