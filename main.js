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

// IPC Handlers
ipcMain.handle('login', async (event, { usuario, password }) => {
  const user = await db.findUser(usuario, password);
  return user ? { success: true, user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol || 'admin' } } : { success: false };
});

ipcMain.handle('get-productos', async () => {
  return await db.getProductos();
});

ipcMain.handle('get-producto', async (event, id) => {
  return await db.getProducto(id);
});

ipcMain.handle('add-producto', async (event, producto) => {
  return await db.addProducto(producto);
});

ipcMain.handle('update-producto', async (event, id, producto) => {
  return await db.updateProducto(id, producto);
});

ipcMain.handle('delete-producto', async (event, id) => {
  return await db.deleteProducto(id);
});

ipcMain.handle('add-venta', async (event, venta) => {
  return await db.addVenta(venta);
});

ipcMain.handle('add-venta-multiple', async (event, ventas) => {
  return await db.addVentaMultiple(ventas);
});

ipcMain.handle('get-ventas', async (event, fechaInicio, fechaFin) => {
  return await db.getVentas(fechaInicio, fechaFin);
});

ipcMain.handle('get-estadisticas', async () => {
  return await db.getEstadisticas();
});

ipcMain.handle('get-gastos', async () => {
  return await db.getGastos();
});

ipcMain.handle('add-gasto', async (event, gasto) => {
  return await db.addGasto(gasto);
});

ipcMain.handle('delete-gasto', async (event, id) => {
  return await db.deleteGasto(id);
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

