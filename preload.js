const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credenciales) => ipcRenderer.invoke('login', credenciales),
  getProductos: () => ipcRenderer.invoke('get-productos'),
  getProducto: (id) => ipcRenderer.invoke('get-producto', id),
  addProducto: (producto) => ipcRenderer.invoke('add-producto', producto),
  updateProducto: (id, producto) => ipcRenderer.invoke('update-producto', id, producto),
  deleteProducto: (id) => ipcRenderer.invoke('delete-producto', id),
  addVenta: (venta) => ipcRenderer.invoke('add-venta', venta),
  addVentaMultiple: (ventas) => ipcRenderer.invoke('add-venta-multiple', ventas),
  getVentas: (fechaInicio, fechaFin) => ipcRenderer.invoke('get-ventas', fechaInicio, fechaFin),
  getEstadisticas: () => ipcRenderer.invoke('get-estadisticas'),
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
  getImagenPath: (imagenPath) => ipcRenderer.invoke('get-imagen-path', imagenPath)
});


