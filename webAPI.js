/**
 * webAPI.js
 * Proporciona una implementación de la interfaz `window.electronAPI` para navegadores web estándar.
 * Se activa automáticamente si la aplicación se ejecuta fuera de Electron.
 */

(function () {
  // Solo se activa si no estamos en entorno de Electron
  if (typeof window.electronAPI !== 'undefined') {
    console.log('Entorno de Electron detectado. Usando API nativa de Electron.');
    return;
  }

  console.log('Entorno Web detectado. Inicializando conexión directa a Supabase...');

  // Configuración de Supabase (Credenciales públicas obtenidas de supabase.js)
  const supabaseUrl = 'https://pyuqebokjhtwyrojwgxd.supabase.co';
  const supabaseAnonKey = 'sb_publishable_IUyaOWBuDvTAURD92VCxQQ_AGQN1-pw';
  const appSecretKey = 'UrbanStoreImperio2026SecretKey!';

  // Verificar que el SDK de Supabase esté cargado
  if (typeof window.supabase === 'undefined') {
    console.error('Error: El SDK de Supabase no está cargado. Asegúrate de incluir la etiqueta script de CDN.');
    return;
  }

  // Inicializar cliente de Supabase con cabecera de seguridad
  const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-app-secret': appSecretKey
      }
    }
  });

  // Función auxiliar para formatear productos tal como lo hace database.js
  function formatearProducto(producto) {
    if (!producto) return null;
    
    // Calcular stock total a partir de las variantes si existen
    let stockTotal = producto.stock || 0;
    if (producto.variantes && producto.variantes.length > 0) {
        stockTotal = producto.variantes.reduce((sum, v) => sum + (v.stock || 0), 0);
    }

    return {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioInventario: producto.precio_inventario || producto.precioInventario || 0,
      precioVenta: producto.precio_venta || producto.precioVenta || producto.precio || 0,
      precio: producto.precio_venta || producto.precioVenta || producto.precio || 0,
      stock: stockTotal,
      variantes: producto.variantes || [],
      categoria: producto.categoria || '',
      imagen: producto.imagen || null,
      fechaCreacion: producto.fecha_creacion || producto.fechaCreacion
    };
  }

  // Definir la interfaz en window.electronAPI
  window.electronAPI = {
    // Autenticación de usuarios
    login: async ({ usuario, password }) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('usuario', usuario)
          .eq('password', password)
          .maybeSingle();

        if (error || !data) {
          console.error('Error o usuario no encontrado:', error);
          return { success: false };
        }

        return { 
          success: true, 
          user: { 
            id: data.id, 
            usuario: data.usuario, 
            nombre: data.nombre, 
            rol: data.rol || 'admin' 
          } 
        };
      } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
      }
    },

    // Obtener todos los productos con sus variantes
    getProductos: async () => {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            variantes:producto_variantes(*)
          `)
          .order('id', { ascending: false });

        if (error) {
          console.error('Error obteniendo productos:', error);
          return [];
        }

        return (data || []).map(p => formatearProducto(p));
      } catch (error) {
        console.error('Error obteniendo productos:', error);
        return [];
      }
    },

    // Obtener un solo producto
    getProducto: async (id) => {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            variantes:producto_variantes(*)
          `)
          .eq('id', id)
          .single();

        if (error || !data) {
          console.error('Error obteniendo producto:', error);
          return null;
        }

        return formatearProducto(data);
      } catch (error) {
        console.error('Error obteniendo producto:', error);
        return null;
      }
    },

    // Agregar un producto con sus variantes
    addProducto: async (producto) => {
      try {
        const nuevoProducto = {
          codigo: producto.codigo || '',
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          precio_inventario: producto.precioInventario || 0,
          precio_venta: producto.precioVenta || producto.precio || 0,
          precio: producto.precioVenta || producto.precio || 0,
          categoria: producto.categoria || '',
          imagen: producto.imagen || null,
          fecha_creacion: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('productos')
          .insert([nuevoProducto])
          .select()
          .single();

        if (error) {
          console.error('Error agregando producto:', error);
          return { success: false, error: error.message };
        }

        // Insertar variantes si existen
        let variantesCreadas = [];
        if (producto.variantes && producto.variantes.length > 0) {
          const variantesData = producto.variantes.map(v => ({
            producto_id: data.id,
            sku: v.sku || `${nuevoProducto.codigo}-${v.talla}-${v.color}`,
            talla: v.talla || '',
            color: v.color || '',
            stock: parseInt(v.stock) || 0
          }));

          const { data: vData, error: vError } = await supabase
            .from('producto_variantes')
            .insert(variantesData)
            .select();
            
          if (!vError && vData) {
            variantesCreadas = vData;
          } else {
            console.error('Error agregando variantes:', vError);
          }
        }

        const productoFormateado = formatearProducto({ ...data, variantes: variantesCreadas });
        return { success: true, producto: productoFormateado };
      } catch (error) {
        console.error('Error agregando producto:', error);
        return { success: false, error: error.message };
      }
    },

    // Actualizar un producto y sus variantes
    updateProducto: async (id, producto) => {
      try {
        const productoActualizado = {
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio_inventario: producto.precioInventario,
          precio_venta: producto.precioVenta || producto.precio,
          precio: producto.precioVenta || producto.precio,
          categoria: producto.categoria,
          imagen: producto.imagen,
          stock: producto.stock
        };

        // Eliminar campos undefined
        Object.keys(productoActualizado).forEach(key => {
          if (productoActualizado[key] === undefined) {
            delete productoActualizado[key];
          }
        });

        const { data, error } = await supabase
          .from('productos')
          .update(productoActualizado)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error actualizando producto:', error);
          return { success: false, error: error.message };
        }

        // Actualizar variantes si vienen en el payload
        if (producto.variantes !== undefined) {
          // Obtenemos variantes actuales
          const { data: currentVars } = await supabase.from('producto_variantes').select('*').eq('producto_id', id);
          
          // Identificar cuáles borrar, actualizar o crear
          const sentIds = producto.variantes.filter(v => v.id).map(v => parseInt(v.id, 10));
          
          // Borrar las que no están en el nuevo arreglo
          if (currentVars && currentVars.length > 0) {
              const toDelete = currentVars.filter(v => !sentIds.includes(parseInt(v.id, 10))).map(v => v.id);
              if (toDelete.length > 0) {
                  await supabase.from('producto_variantes').delete().in('id', toDelete);
              }
          }
          
          // Insertar o actualizar variantes enviadas
          if (producto.variantes.length > 0) {
              for (const v of producto.variantes) {
                  const variObj = {
                      producto_id: id,
                      sku: v.sku || `${data.codigo}-${v.talla}-${v.color}`,
                      talla: v.talla || '',
                      color: v.color || '',
                      stock: parseInt(v.stock) || 0
                  };
                  
                  if (v.id) {
                      await supabase.from('producto_variantes').update(variObj).eq('id', parseInt(v.id, 10));
                  } else {
                      await supabase.from('producto_variantes').insert([variObj]);
                  }
              }
          }
        }

        const { data: productoConVariantes } = await supabase
          .from('productos')
          .select('*, variantes:producto_variantes(*)')
          .eq('id', id)
          .single();

        return { success: true, producto: formatearProducto(productoConVariantes) };
      } catch (error) {
        console.error('Error actualizando producto:', error);
        return { success: false, error: error.message };
      }
    },

    // Eliminar producto
    deleteProducto: async (id) => {
      try {
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error eliminando producto:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        console.error('Error eliminando producto:', error);
        return { success: false, error: error.message };
      }
    },

    // Agregar venta
    addVenta: async (venta) => {
      try {
        const nuevaVenta = {
          producto_id: venta.producto_id,
          cantidad: venta.cantidad,
          precio_unitario: venta.precio_unitario,
          total: venta.cantidad * venta.precio_unitario,
          fecha: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('ventas')
          .insert([nuevaVenta])
          .select()
          .single();

        if (error) {
          console.error('Error agregando venta:', error);
          return { success: false, error: error.message };
        }

        // Actualizar stock del producto o de la variante
        if (venta.variante_id) {
            const { data: varianteData } = await supabase
                .from('producto_variantes')
                .select('stock')
                .eq('id', venta.variante_id)
                .single();
                
            if (varianteData) {
                await supabase
                    .from('producto_variantes')
                    .update({ stock: Math.max(0, varianteData.stock - venta.cantidad) })
                    .eq('id', venta.variante_id);
            }
        } else {
            // Producto antiguo sin variante
            const { data: prodData } = await supabase
                .from('productos')
                .select('stock')
                .eq('id', venta.producto_id)
                .single();
                
            if (prodData) {
                await supabase
                    .from('productos')
                    .update({ stock: Math.max(0, (prodData.stock || 0) - venta.cantidad) })
                    .eq('id', venta.producto_id);
            }
        }

        return { success: true, venta: data };
      } catch (error) {
        console.error('Error agregando venta:', error);
        return { success: false, error: error.message };
      }
    },

    // Agregar ventas múltiples
    addVentaMultiple: async (ventas) => {
      try {
        const fecha = new Date().toISOString();
        const nuevasVentas = ventas.map(venta => ({
          producto_id: venta.producto_id,
          cantidad: venta.cantidad,
          precio_unitario: venta.precio_unitario,
          total: venta.cantidad * venta.precio_unitario,
          fecha: fecha
        }));

        const { data, error } = await supabase
          .from('ventas')
          .insert(nuevasVentas)
          .select();

        if (error) {
          console.error('Error agregando ventas múltiples:', error);
          return { success: false, error: error.message };
        }

        // Actualizar stock de cada producto
        for (const venta of ventas) {
          if (venta.variante_id) {
              const { data: varianteData } = await supabase
                  .from('producto_variantes')
                  .select('stock')
                  .eq('id', venta.variante_id)
                  .single();
                  
              if (varianteData) {
                  await supabase
                      .from('producto_variantes')
                      .update({ stock: Math.max(0, varianteData.stock - venta.cantidad) })
                      .eq('id', venta.variante_id);
              }
          } else {
              // Producto antiguo sin variante
              const { data: prodData } = await supabase
                  .from('productos')
                  .select('stock')
                  .eq('id', venta.producto_id)
                  .single();
                  
              if (prodData) {
                  await supabase
                      .from('productos')
                      .update({ stock: Math.max(0, (prodData.stock || 0) - venta.cantidad) })
                      .eq('id', venta.producto_id);
              }
          }
        }

        return { success: true, ventas: data };
      } catch (error) {
        console.error('Error agregando ventas múltiples:', error);
        return { success: false, error: error.message };
      }
    },

    // Obtener ventas por rango de fechas
    getVentas: async (fechaInicio, fechaFin) => {
      try {
        let query = supabase
          .from('ventas')
          .select('*');

        if (fechaInicio && fechaFin) {
          query = query
            .gte('fecha', fechaInicio + 'T00:00:00.000Z')
            .lte('fecha', fechaFin + 'T23:59:59.999Z');
        }

        const { data, error } = await query.order('fecha', { ascending: false });

        if (error) {
          console.error('Error obteniendo ventas:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Error obteniendo ventas:', error);
        return [];
      }
    },

    // Obtener estadísticas consolidadas
    getEstadisticas: async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0];

        // Obtener todos los productos
        const { data: prods, error: prodsError } = await supabase
          .from('productos')
          .select('*, variantes:producto_variantes(*)');

        if (prodsError) throw prodsError;

        const productos = (prods || []).map(p => formatearProducto(p));
        const totalProductos = productos.length;

        const inventarioTotal = productos.reduce((sum, p) => {
          return sum + (p.precioInventario || 0) * (p.stock || 0);
        }, 0);

        // Obtener todas las ventas
        const { data: ventas, error: ventasError } = await supabase
          .from('ventas')
          .select('*');

        if (ventasError) throw ventasError;

        const ventasData = ventas || [];

        // Calcular ganancias totales
        let gananciasTotales = 0;
        
        // Crear mapa de productos rápidos para acelerar el proceso
        const prodMap = new Map();
        productos.forEach(p => prodMap.set(p.id, p));

        for (const venta of ventasData) {
          const producto = prodMap.get(venta.producto_id);
          if (producto) {
            const precioInventario = producto.precioInventario || 0;
            const ganancia = (venta.precio_unitario - precioInventario) * venta.cantidad;
            gananciasTotales += ganancia;
          }
        }

        // Ventas de hoy
        const ventasHoy = ventasData.filter(v => {
          const fechaVenta = v.fecha.split('T')[0];
          return fechaVenta === hoy;
        });

        const ventasHoyTotal = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);

        return {
          totalProductos,
          inventarioTotal: parseFloat(inventarioTotal.toFixed(2)),
          gananciasTotales: parseFloat(gananciasTotales.toFixed(2)),
          ventasHoy: parseFloat(ventasHoyTotal.toFixed(2))
        };
      } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
          totalProductos: 0,
          inventarioTotal: 0,
          gananciasTotales: 0,
          ventasHoy: 0
        };
      }
    },

    // Guardar imagen en Supabase Storage (directamente desde el navegador)
    saveImagen: async (file) => {
      try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const newFilename = `producto_${timestamp}.${extension}`;
        const filePath = `productos/${newFilename}`;
        
        // Subir directamente el objeto File a Supabase Storage
        const { data, error } = await supabase.storage
          .from('imagenes')
          .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error('Error subiendo imagen a Supabase:', error);
          return { success: false, error: error.message };
        }

        // Obtener URL pública
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
    },

    // Obtener la URL pública de una imagen
    getImagenPath: async (imagenPath) => {
      if (!imagenPath) return null;
      try {
        const { data } = supabase.storage
          .from('imagenes')
          .getPublicUrl(imagenPath);
        return data.publicUrl;
      } catch (error) {
        console.error('Error obteniendo URL de imagen:', error);
        return null;
      }
    }
  };

  console.log('¡API Web de Supabase configurada e instalada con éxito!');
})();
