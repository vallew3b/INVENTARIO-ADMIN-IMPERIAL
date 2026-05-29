const { supabase } = require('./supabase');

class Database {
  constructor() {
    // Ya no necesitamos filePath, usamos Supabase
  }

  // Métodos de usuarios
  async findUser(usuario, password) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          comercios (
            id,
            nombre,
            plan,
            estado_suscripcion,
            fecha_vencimiento
          )
        `)
        .eq('usuario', usuario)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error buscando usuario:', error);
      return null;
    }
  }

  // Método auxiliar para formatear producto
  formatearProducto(producto) {
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

  // Métodos de productos
  async getProductos(comercioId) {
    try {
      let query = supabase
        .from('productos')
        .select(`
          *,
          variantes:producto_variantes(*)
        `);

      if (comercioId) {
        query = query.eq('comercio_id', comercioId);
      }

      const { data, error } = await query.order('id', { ascending: false });

      if (error) {
        console.error('Error obteniendo productos:', error);
        return [];
      }

      // Formatear productos para compatibilidad
      return (data || []).map(p => this.formatearProducto(p));
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      return [];
    }
  }

  async getProducto(id) {
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
        return null;
      }

      return this.formatearProducto(data);
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      return null;
    }
  }

  async addProducto(producto, comercioId) {
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
        fecha_creacion: new Date().toISOString(),
        comercio_id: comercioId
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

      const productoFormateado = this.formatearProducto({ ...data, variantes: variantesCreadas });

      return { success: true, producto: productoFormateado };
    } catch (error) {
      console.error('Error agregando producto:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProducto(id, producto) {
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

      return { success: true, producto: this.formatearProducto(productoConVariantes) };
    } catch (error) {
      console.error('Error actualizando producto:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteProducto(id) {
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
  }

  // Métodos de ventas
  async addVenta(venta, comercioId) {
    try {
      const nuevaVenta = {
        producto_id: venta.producto_id,
        cantidad: venta.cantidad,
        precio_unitario: venta.precio_unitario,
        total: venta.cantidad * venta.precio_unitario,
        fecha: new Date().toISOString(),
        comercio_id: comercioId
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

      // Actualizar stock del producto
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
          const producto = await this.getProducto(venta.producto_id);
          if (producto) {
              await supabase
                  .from('productos')
                  .update({ stock: Math.max(0, (producto.stock || 0) - venta.cantidad) })
                  .eq('id', venta.producto_id);
          }
      }

      return { success: true, venta: data };
    } catch (error) {
      console.error('Error agregando venta:', error);
      return { success: false, error: error.message };
    }
  }

  async addVentaMultiple(ventas, comercioId) {
    try {
      const fecha = new Date().toISOString();
      const nuevasVentas = ventas.map(venta => ({
        producto_id: venta.producto_id,
        cantidad: venta.cantidad,
        precio_unitario: venta.precio_unitario,
        total: venta.cantidad * venta.precio_unitario,
        fecha: fecha,
        comercio_id: comercioId
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
            // Obtener la variante actual
            const { data: varianteData } = await supabase
                .from('producto_variantes')
                .select('stock')
                .eq('id', venta.variante_id)
                .single();
                
            if (varianteData) {
                // Actualizar stock de la variante
                await supabase
                    .from('producto_variantes')
                    .update({ stock: Math.max(0, varianteData.stock - venta.cantidad) })
                    .eq('id', venta.variante_id);
            }
        } else {
            // Si no tiene variante (producto antiguo), intentar actualizar stock en la tabla principal
            const producto = await this.getProducto(venta.producto_id);
            if (producto) {
                await supabase
                    .from('productos')
                    .update({ stock: Math.max(0, (producto.stock || 0) - venta.cantidad) })
                    .eq('id', venta.producto_id);
            }
        }
      }

      return { success: true, ventas: data };
    } catch (error) {
      console.error('Error agregando ventas múltiples:', error);
      return { success: false, error: error.message };
    }
  }

  async getVentas(fechaInicio, fechaFin, comercioId) {
    try {
      let query = supabase
        .from('ventas')
        .select('*');

      if (fechaInicio && fechaFin) {
        query = query
          .gte('fecha', fechaInicio + 'T00:00:00.000Z')
          .lte('fecha', fechaFin + 'T23:59:59.999Z');
      }

      if (comercioId) {
        query = query.eq('comercio_id', comercioId);
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
  }

  async getEstadisticas(comercioId) {
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // Obtener todos los productos
      const productos = await this.getProductos(comercioId);
      const totalProductos = productos.length;

      const inventarioTotal = productos.reduce((sum, p) => {
        return sum + (p.precioInventario || p.precio_inventario || 0) * (p.stock || 0);
      }, 0);

      // Obtener todas las ventas
      let query = supabase
        .from('ventas')
        .select('*');

      if (comercioId) {
        query = query.eq('comercio_id', comercioId);
      }

      const { data: ventas, error: ventasError } = await query;

      if (ventasError) {
        console.error('Error obteniendo ventas para estadísticas:', ventasError);
      }

      const ventasData = ventas || [];

      // Calcular ganancias totales
      let gananciasTotales = 0;
      for (const venta of ventasData) {
        const producto = await this.getProducto(venta.producto_id);
        if (producto) {
          const precioInventario = producto.precioInventario || producto.precio_inventario || 0;
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
  }

  // Métodos de Gastos y Fletes Operativos (OPEX)
  async getGastos(comercioId) {
    try {
      let query = supabase
        .from('gastos_negocio')
        .select('*');

      if (comercioId) {
        query = query.eq('comercio_id', comercioId);
      }

      const { data, error } = await query.order('fecha', { ascending: false });

      if (error) {
        console.error('Error obteniendo gastos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      return [];
    }
  }

  async addGasto(gasto, comercioId) {
    try {
      const nuevoGasto = {
        concepto: gasto.concepto || '',
        monto: parseFloat(gasto.monto) || 0,
        categoria: gasto.categoria || 'Otros',
        fecha: gasto.fecha ? new Date(gasto.fecha).toISOString() : new Date().toISOString(),
        comercio_id: comercioId
      };

      const { data, error } = await supabase
        .from('gastos_negocio')
        .insert([nuevoGasto])
        .select()
        .single();

      if (error) {
        console.error('Error agregando gasto:', error);
        return { success: false, error: error.message };
      }

      return { success: true, gasto: data };
    } catch (error) {
      console.error('Error agregando gasto:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteGasto(id) {
    try {
      const { error } = await supabase
        .from('gastos_negocio')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando gasto:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================================
  // METODOS ADICIONALES EXCLUSIVOS DE SUPERADMIN
  // ==========================================================

  async getComercios() {
    try {
      const { data: comercios, error: comerciosError } = await supabase
        .from('comercios')
        .select('*')
        .order('id', { ascending: true });

      if (comerciosError) {
        console.error('Error obteniendo comercios:', comerciosError);
        return [];
      }

      // Cargar usuarios vinculados
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, usuario, nombre, rol, comercio_id');

      if (usuariosError) {
        console.error('Error obteniendo usuarios para comercios:', usuariosError);
        return comercios || [];
      }

      return (comercios || []).map(c => {
        const uComercio = (usuarios || []).filter(u => u.comercio_id === c.id);
        return {
          ...c,
          usuarios: uComercio,
          usuariosCount: uComercio.length
        };
      });
    } catch (error) {
      console.error('Error en getComercios:', error);
      return [];
    }
  }

  async addComercio(nombre, plan, fechaVencimiento) {
    try {
      const nuevoComercio = {
        nombre,
        plan: plan || '1_mes',
        estado_suscripcion: 'activo',
        fecha_vencimiento: fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('comercios')
        .insert([nuevoComercio])
        .select()
        .single();

      if (error) {
        console.error('Error agregando comercio:', error);
        return { success: false, error: error.message };
      }

      return { success: true, comercio: data };
    } catch (error) {
      console.error('Error agregando comercio:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSuscripcion(comercioId, estado, plan, fechaVencimiento) {
    try {
      const updateData = {};
      if (estado) updateData.estado_suscripcion = estado;
      if (plan) updateData.plan = plan;
      if (fechaVencimiento) updateData.fecha_vencimiento = fechaVencimiento;

      const { data, error } = await supabase
        .from('comercios')
        .update(updateData)
        .eq('id', comercioId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando suscripción:', error);
        return { success: false, error: error.message };
      }

      return { success: true, comercio: data };
    } catch (error) {
      console.error('Error actualizando suscripción:', error);
      return { success: false, error: error.message };
    }
  }

  async crearUsuarioComercio(usuario, password, nombre, rol, comercioId) {
    try {
      const nuevoUsuario = {
        usuario,
        password,
        nombre,
        rol: rol || 'admin',
        comercio_id: comercioId
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert([nuevoUsuario])
        .select()
        .single();

      if (error) {
        console.error('Error creando usuario para comercio:', error);
        return { success: false, error: error.message };
      }

      return { success: true, usuario: data };
    } catch (error) {
      console.error('Error creando usuario de comercio:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Database;
