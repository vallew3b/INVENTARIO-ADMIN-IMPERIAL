const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credenciales) => ipcRenderer.invoke('login', credenciales),
  getProductos: (comercioId) => ipcRenderer.invoke('get-productos', comercioId),
  getProducto: (id) => ipcRenderer.invoke('get-producto', id),
  addProducto: (producto, comercioId) => ipcRenderer.invoke('add-producto', producto, comercioId),
  updateProducto: (id, producto) => ipcRenderer.invoke('update-producto', id, producto),
  deleteProducto: (id) => ipcRenderer.invoke('delete-producto', id),
  addVenta: (venta, comercioId) => ipcRenderer.invoke('add-venta', venta, comercioId),
  addVentaMultiple: (ventas, comercioId) => ipcRenderer.invoke('add-venta-multiple', ventas, comercioId),
  getVentas: (fechaInicio, fechaFin, comercioId) => ipcRenderer.invoke('get-ventas', fechaInicio, fechaFin, comercioId),
  getEstadisticas: (comercioId) => ipcRenderer.invoke('get-estadisticas', comercioId),
  getGastos: (comercioId) => ipcRenderer.invoke('get-gastos', comercioId),
  addGasto: (gasto, comercioId) => ipcRenderer.invoke('add-gasto', gasto, comercioId),
  deleteGasto: (id) => ipcRenderer.invoke('delete-gasto', id),
  saveImagen: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = Buffer.from(reader.result);
        ipcRenderer.invoke('save-imagen', buffer, file.name, file.type)
          .then(resolve)
          .catch(reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },
  getImagenPath: (imagenPath) => ipcRenderer.invoke('get-imagen-path', imagenPath),
  // Métodos de Superadmin
  getComercios: () => ipcRenderer.invoke('get-comercios'),
  addComercio: (nombre, plan, fechaVencimiento) => ipcRenderer.invoke('add-comercio', nombre, plan, fechaVencimiento),
  updateSuscripcion: (comercioId, estado, plan, fechaVencimiento) => ipcRenderer.invoke('update-suscripcion', comercioId, estado, plan, fechaVencimiento),
  crearUsuarioComercio: (usuario, password, nombre, rol, comercioId) => ipcRenderer.invoke('crear-usuario-comercio', usuario, password, nombre, rol, comercioId)
});


