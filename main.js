const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./database');
const { supabase } = require('./supabase');

let mainWindow;
let db;

// Inicializar base de datos
function initDatabase() {
  db = new Database();
}

// Crear ventana principal
function createWindow() {
  const preloadPath = path.resolve(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
  });

  mainWindow.loadFile('index.html');
  
  // mainWindow.webContents.openDevTools(); // Descomentar para desarrollo
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('login', async (event, { usuario, password }) => {
  const user = await db.findUser(usuario, password);
  if (!user) return { success: false };
  
  return { 
    success: true, 
    user: { 
      id: user.id, 
      usuario: user.usuario, 
      nombre: user.nombre, 
      rol: user.rol || 'admin',
      comercio_id: user.comercio_id,
      comercio: user.comercios ? {
        id: user.comercios.id,
        nombre: user.comercios.nombre,
        plan: user.comercios.plan,
        estado_suscripcion: user.comercios.estado_suscripcion,
        fecha_vencimiento: user.comercios.fecha_vencimiento
      } : null
    } 
  };
});

ipcMain.handle('get-productos', async (event, comercioId) => {
  return await db.getProductos(comercioId);
});

ipcMain.handle('get-producto', async (event, id) => {
  return await db.getProducto(id);
});

ipcMain.handle('add-producto', async (event, producto, comercioId) => {
  return await db.addProducto(producto, comercioId);
});

ipcMain.handle('update-producto', async (event, id, producto) => {
  return await db.updateProducto(id, producto);
});

ipcMain.handle('delete-producto', async (event, id) => {
  return await db.deleteProducto(id);
});

ipcMain.handle('add-venta', async (event, venta, comercioId) => {
  return await db.addVenta(venta, comercioId);
});

ipcMain.handle('add-venta-multiple', async (event, ventas, comercioId) => {
  return await db.addVentaMultiple(ventas, comercioId);
});

ipcMain.handle('get-ventas', async (event, fechaInicio, fechaFin, comercioId) => {
  return await db.getVentas(fechaInicio, fechaFin, comercioId);
});

ipcMain.handle('get-estadisticas', async (event, comercioId) => {
  return await db.getEstadisticas(comercioId);
});

ipcMain.handle('get-gastos', async (event, comercioId) => {
  return await db.getGastos(comercioId);
});

ipcMain.handle('add-gasto', async (event, gasto, comercioId) => {
  return await db.addGasto(gasto, comercioId);
});

ipcMain.handle('delete-gasto', async (event, id) => {
  return await db.deleteGasto(id);
});

// Handlers adicionales de Superadmin
ipcMain.handle('get-comercios', async () => {
  return await db.getComercios();
});

ipcMain.handle('add-comercio', async (event, nombre, plan, fechaVencimiento) => {
  return await db.addComercio(nombre, plan, fechaVencimiento);
});

ipcMain.handle('update-suscripcion', async (event, comercioId, estado, plan, fechaVencimiento) => {
  return await db.updateSuscripcion(comercioId, estado, plan, fechaVencimiento);
});

ipcMain.handle('crear-usuario-comercio', async (event, usuario, password, nombre, rol, comercioId) => {
  return await db.crearUsuarioComercio(usuario, password, nombre, rol, comercioId);
});

// Handler para guardar imágenes en Supabase Storage
ipcMain.handle('save-imagen', async (event, buffer, filename, mimeType) => {
  try {
    // Generar nombre único para la imagen
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || 'jpg';
    const newFilename = `producto_${timestamp}.${extension}`;
    const filePath = `productos/${newFilename}`;
    
    // Subir imagen a Supabase Storage
    const { data, error } = await supabase.storage
      .from('imagenes')
      .upload(filePath, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Error subiendo imagen a Supabase:', error);
      return { success: false, error: error.message };
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase.storage
      .from('imagenes')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error guardando imagen:', error);
    return { success: false, error: error.message };
  }
});

// Handler para obtener la URL de la imagen desde Supabase Storage
ipcMain.handle('get-imagen-path', async (event, imagenPath) => {
  if (!imagenPath) return null;
  
  try {
    // Obtener URL pública de Supabase Storage
    const { data } = supabase.storage
      .from('imagenes')
      .getPublicUrl(imagenPath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error obteniendo URL de imagen:', error);
    return null;
  }
});

