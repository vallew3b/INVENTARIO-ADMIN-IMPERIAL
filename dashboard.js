// Verificar si hay sesión activa
const user = JSON.parse(sessionStorage.getItem('user'));
if (!user) {
    window.location.href = 'index.html';
}

// Mostrar nombre de usuario
document.getElementById('userName').textContent = user.nombre;

// Ocultar secciones según el rol del usuario
function configurarPermisos() {
    const rol = user.rol || 'admin';
    const esVendedor = rol === 'vendedor';
    
    console.log('Rol del usuario:', rol, 'Es vendedor:', esVendedor);
    
    // Ocultar elementos del menú para vendedores
    if (esVendedor) {
        // Ocultar menú de agregar producto
        document.querySelectorAll('.sidebar-menu a[data-section="agregar"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Ocultar menú de estadísticas
        document.querySelectorAll('.sidebar-menu a[data-section="estadisticas"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Ocultar menú de inicio (dashboard)
        document.querySelectorAll('.sidebar-menu a[data-section="inicio"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Ocultar cards del dashboard
        document.querySelectorAll('.dashboard-card[data-section="agregar"]').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.dashboard-card[data-section="estadisticas"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Ocultar sección de agregar producto
        const seccionAgregar = document.getElementById('agregar');
        if (seccionAgregar) {
            seccionAgregar.style.display = 'none';
        }
        
        // Ocultar sección de estadísticas
        const seccionEstadisticas = document.getElementById('estadisticas');
        if (seccionEstadisticas) {
            seccionEstadisticas.style.display = 'none';
        }
        
        // Ocultar sección de inicio (dashboard)
        const seccionInicio = document.getElementById('inicio');
        if (seccionInicio) {
            seccionInicio.style.display = 'none';
        }
        
        // Si está en una sección no permitida, redirigir a inventario
        const currentSection = document.querySelector('.content-section.active');
        if (currentSection && (currentSection.id === 'agregar' || currentSection.id === 'estadisticas' || currentSection.id === 'inicio')) {
            navigateToSection('inventario');
        }
        
        // Asegurar que el menú de inventario esté activo
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'inventario') {
                link.classList.add('active');
            }
        });
        
        // Ocultar botón de INVENTARIO TOTAL para vendedores
        const btnInventarioTotal = document.getElementById('btnInventarioTotal');
        if (btnInventarioTotal) {
            btnInventarioTotal.style.display = 'none';
        }
    }
}

// Configurar permisos al cargar
configurarPermisos();

// Mostrar mensaje de conexión exitosa al cargar
window.addEventListener('DOMContentLoaded', () => {
    showToast('Conexión exitosa', 'Conectado correctamente a Supabase', 'success');
    
    // Configurar listener para el historial de ventas
    const btnBuscarHistorial = document.getElementById('btnBuscarHistorial');
    if (btnBuscarHistorial) {
        btnBuscarHistorial.addEventListener('click', () => {
            const fecha = document.getElementById('fechaHistorial').value;
            if (fecha) {
                loadVentasDia(fecha);
                showToast('Consultando...', `Buscando ventas del ${fecha}`, 'info');
            } else {
                showToast('Advertencia', 'Por favor seleccione una fecha', 'error');
            }
        });
    }

    // Inicializar pestañas después de que el DOM esté listo
    setTimeout(() => {
        inicializarPestanas();
        // Asegurar que la pestaña "ACCESORIOS" esté activa por defecto en inventario
        const inventarioTabAccesorios = document.querySelector('#inventario .categorias-tabs .tab-btn[data-categoria="ACCESORIOS"]');
        if (inventarioTabAccesorios && !document.querySelector('#inventario .categorias-tabs .tab-btn.active')) {
            inventarioTabAccesorios.classList.add('active');
        }
        // Asegurar que la pestaña correspondiente esté activa por defecto en ventas (OTROS en móvil para mayor rapidez)
        const isMobile = window.innerWidth <= 991;
        const defaultVentasCat = isMobile ? 'OTROS' : 'TODAS';
        const ventasTabDefault = document.querySelector(`#ventas .categorias-tabs .tab-btn[data-categoria-venta="${defaultVentasCat}"]`);
        if (ventasTabDefault && !document.querySelector('#ventas .categorias-tabs .tab-btn.active')) {
            ventasTabDefault.classList.add('active');
        }
    }, 100);
});

// Función para mostrar notificaciones toast
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 4000);
}

// Navegación entre secciones
function navigateToSection(section) {
    // Actualizar menú activo
    document.querySelectorAll('.sidebar-menu a').forEach(l => {
        if (l.getAttribute('data-section') === section) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // Mostrar sección correspondiente
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar título
    const titles = {
        'inicio': 'Inicio',
        'estadisticas': 'Estadísticas',
        'inventario': 'Inventario',
        'ventas': 'Ventas',
        'agregar': 'Agregar Producto'
    };
    document.getElementById('sectionTitle').textContent = titles[section] || 'Inicio';
    
    // Cargar datos según la sección
    if (section === 'estadisticas') {
        loadEstadisticas();
    } else if (section === 'inventario') {
        // Asegurar que las pestañas estén inicializadas y visibles
        setTimeout(() => {
            inicializarPestanas();
            // Asegurar que la pestaña ACCESORIOS esté activa por defecto
            const inventarioTabAccesorios = document.querySelector('#inventario .categorias-tabs .tab-btn[data-categoria="ACCESORIOS"]');
            if (inventarioTabAccesorios) {
                document.querySelectorAll('#inventario .categorias-tabs .tab-btn[data-categoria]').forEach(b => b.classList.remove('active'));
                inventarioTabAccesorios.classList.add('active');
            }
            loadInventario();
        }, 100);
    } else if (section === 'ventas') {
        // Resetear pestañas de ventas a TODAS
        setTimeout(() => {
            inicializarPestanas();
            const isMobile = window.innerWidth <= 991;
            const defaultVentasCat = isMobile ? 'OTROS' : 'TODAS';
            document.querySelectorAll('#ventas .categorias-tabs .tab-btn[data-categoria-venta]').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-categoria-venta') === defaultVentasCat) {
                    btn.classList.add('active');
                }
            });
            loadProductosVenta();
        }, 100);
    }
}

document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        navigateToSection(section);
    });
});

// Navegación desde cards del dashboard
document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', () => {
        const section = card.getAttribute('data-section');
        navigateToSection(section);
    });
});

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
});

// Cargar estadísticas
async function loadEstadisticas() {
    try {
        const stats = await window.electronAPI.getEstadisticas();
        document.getElementById('statTotalProductos').textContent = stats.totalProductos;
        document.getElementById('statInventarioTotal').textContent = '$' + stats.inventarioTotal;
        document.getElementById('statGanancias').textContent = '$' + stats.gananciasTotales;
        document.getElementById('statVentasHoy').textContent = '$' + stats.ventasHoy;
        
        // Cargar ventas del día
        await loadVentasDia();
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        showToast('Error', 'No se pudieron cargar las estadísticas', 'error');
    }
}

// Cargar ventas del día u otra fecha específica
async function loadVentasDia(fechaRequerida = null) {
    const tbody = document.getElementById('ventasDiaTableBody');
    if (!tbody) return; // Si no existe el elemento, salir
    
    try {
        const fecha = fechaRequerida || new Date().toISOString().split('T')[0];
        
        // Poner la fecha en el input por defecto
        const inputFecha = document.getElementById('fechaHistorial');
        if (inputFecha && !inputFecha.value) {
            inputFecha.value = fecha;
        }

        const ventas = await window.electronAPI.getVentas(fecha, fecha);
        
        if (ventas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="loading">No hay ventas registradas el ${fecha}</td></tr>`;
            return;
        }
        
        // Obtener información completa de productos para cada venta
        const ventasConDetalles = await Promise.all(ventas.map(async (v) => {
            const producto = await window.electronAPI.getProducto(v.producto_id);
            return {
                ...v,
                producto_nombre: producto ? producto.nombre : 'Producto eliminado',
                producto_codigo: producto ? producto.codigo : 'N/A'
            };
        }));
        
        let totalVendidoDia = 0;
        
        const filas = ventasConDetalles.map(v => {
            const fechaHora = new Date(v.fecha);
            const total = parseFloat(v.total);
            totalVendidoDia += total;
            return `
                <tr>
                    <td>${fechaHora.toLocaleTimeString()}</td>
                    <td>${v.producto_nombre}</td>
                    <td>${v.producto_codigo}</td>
                    <td>${v.cantidad}</td>
                    <td>$${parseFloat(v.precio_unitario).toFixed(2)}</td>
                    <td>$${total.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = filas + `
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #e2e8f0;">
                <td colspan="5" style="text-align: right; padding-right: 20px;">TOTAL RECAUDADO EN ESTA FECHA:</td>
                <td style="color: #22c55e; font-size: 1.1em;">$${totalVendidoDia.toFixed(2)}</td>
            </tr>
        `;
    } catch (error) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Error al cargar ventas del día</td></tr>';
        }
        console.error('Error cargando ventas del día:', error);
    }
}

// Variable global para almacenar todos los productos del inventario
let todosLosProductos = [];

// Cargar inventario
async function loadInventario() {
    const tbody = document.getElementById('productosTableBody');
    const esVendedor = (user.rol || 'admin') === 'vendedor';
    const esAdmin = !esVendedor;
    const colspan = esAdmin ? 10 : 9;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading">Cargando...</td></tr>`;
    
    try {
        todosLosProductos = await window.electronAPI.getProductos();
        
        // Procesar productos para obtener rutas de imágenes
        todosLosProductos = await Promise.all(todosLosProductos.map(async (p) => {
            let imagenPath = null;
            if (p.imagen) {
                imagenPath = await window.electronAPI.getImagenPath(p.imagen);
            }
            return { ...p, imagenPath };
        }));
        
        // Filtrar por categoría activa (buscar en la sección de inventario)
        const categoriaActiva = document.querySelector('#inventario .categorias-tabs .tab-btn.active')?.getAttribute('data-categoria') || 'ACCESORIOS';
        filtrarInventarioPorCategoria(categoriaActiva);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading">Error al cargar productos</td></tr>`;
        console.error('Error cargando inventario:', error);
    }
}

// Filtrar inventario por categoría (muestra TODOS los productos, incluso con stock 0)
function filtrarInventarioPorCategoria(categoria) {
    const tbody = document.getElementById('productosTableBody');
    const tableContainer = document.querySelector('#inventario .table-container');
    
    // Si es INVENTARIO TOTAL, mostrar resumen
    if (categoria === 'INVENTARIO_TOTAL') {
        mostrarInventarioTotal();
        return;
    }
    
    // Mostrar tabla normal
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
    
    // Ocultar resumen total si existe
    const totalContainer = document.getElementById('inventarioTotalContainer');
    if (totalContainer) {
        totalContainer.style.display = 'none';
    }
    
    let productosFiltrados = todosLosProductos;
    if (categoria === 'SIN_STOCK') {
        productosFiltrados = todosLosProductos.filter(p => (p.stock || 0) === 0);
    } else if (categoria !== 'TODAS') {
        // Filtrar por categoría exacta (incluye categorías personalizadas de "OTROS")
        productosFiltrados = todosLosProductos.filter(p => {
            const pCategoria = (p.categoria || '').toUpperCase();
            return pCategoria === categoria.toUpperCase();
        });
    }
    
    const esVendedor = (user.rol || 'admin') === 'vendedor';
    const esAdmin = !esVendedor;
    const colspan = esAdmin ? 10 : 9; // Admin tiene una columna extra (precio inventario)
    
    // Mostrar/ocultar columna de precio inventario según el rol
    const precioInventarioHeader = document.getElementById('precioInventarioHeader');
    if (precioInventarioHeader) {
        precioInventarioHeader.style.display = esAdmin ? 'table-cell' : 'none';
    }
    
    if (productosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading">No hay productos en esta categoría</td></tr>`;
        return;
    }
    
    tbody.innerHTML = productosFiltrados.map(p => {
        let imagenCell = '-';
        if (p.imagenPath) {
            imagenCell = `<img src="${p.imagenPath}" alt="${p.nombre}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover;">`;
        }
        const precioInventario = p.precioInventario || p.precio_inventario || 0;
        const precioVenta = p.precioVenta || p.precio || 0;
        const botonesAccion = esVendedor ? '' : `
            <button class="btn btn-small btn-primary" onclick="editarProducto(${p.id})" style="margin-right: 5px;">✏️ Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteProducto(${p.id})">🗑️ Eliminar</button>
        `;
        
        const precioInventarioCell = esAdmin ? `<td>$${parseFloat(precioInventario).toFixed(2)}</td>` : '';
        
        return `
        <tr>
            <td>${imagenCell}</td>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria || '-'}</td>
            ${precioInventarioCell}
            <td>$${parseFloat(precioVenta).toFixed(2)}</td>
            <td><span class="${p.stock < 10 ? 'text-danger' : ''}">${p.stock}</span></td>
            <td>${botonesAccion}</td>
        </tr>
    `;
    }).join('');
}

// Mostrar resumen total del inventario
async function mostrarInventarioTotal() {
    const tbody = document.getElementById('productosTableBody');
    const tableContainer = document.querySelector('#inventario .table-container');
    
    // Ocultar tabla normal
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }
    
    // Limpiar tbody
    tbody.innerHTML = '';
    
    const esVendedor = (user.rol || 'admin') === 'vendedor';
    const esAdmin = !esVendedor;
    
    // Calcular estadísticas locales
    const totalProductos = todosLosProductos.length;
    const totalStock = todosLosProductos.reduce((sum, p) => sum + (p.stock || 0), 0);
    const valorInventarioTotal = todosLosProductos.reduce((sum, p) => {
        const precioInv = p.precioInventario || p.precio_inventario || 0;
        return sum + (precioInv * (p.stock || 0));
    }, 0);
    const valorVentaTotal = todosLosProductos.reduce((sum, p) => {
        const precioVenta = p.precioVenta || p.precio || 0;
        return sum + (precioVenta * (p.stock || 0));
    }, 0);
    const productosSinStock = todosLosProductos.filter(p => (p.stock || 0) === 0).length;
    const productosBajoStock = todosLosProductos.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
    
    // Obtener estadísticas globales para la ganancia de forma asíncrona para no bloquear
    if (esAdmin) {
        window.electronAPI.getEstadisticas().then(stats => {
            const elementoGanancia = document.getElementById('gananciaAcumuladaValor');
            if (elementoGanancia) {
                elementoGanancia.innerText = '$' + parseFloat(stats.gananciasTotales || 0).toFixed(2);
            }
        }).catch(e => {
            console.error('Error al obtener ganancias acumuladas:', e);
            const elementoGanancia = document.getElementById('gananciaAcumuladaValor');
            if (elementoGanancia) {
                elementoGanancia.innerText = 'Error';
            }
        });
    }

    // Agrupar por categoría
    const productosPorCategoria = {};
    todosLosProductos.forEach(p => {
        const categoria = p.categoria || 'SIN CATEGORÍA';
        if (!productosPorCategoria[categoria]) {
            productosPorCategoria[categoria] = {
                cantidad: 0,
                stock: 0,
                valorInventario: 0,
                valorVenta: 0
            };
        }
        productosPorCategoria[categoria].cantidad++;
        productosPorCategoria[categoria].stock += (p.stock || 0);
        const precioInv = p.precioInventario || p.precio_inventario || 0;
        const precioVenta = p.precioVenta || p.precio || 0;
        productosPorCategoria[categoria].valorInventario += (precioInv * (p.stock || 0));
        productosPorCategoria[categoria].valorVenta += (precioVenta * (p.stock || 0));
    });
    
    // Crear HTML del resumen
    let resumenHTML = `
        <div class="inventario-total-container">
            <div class="inventario-total-stats">
                <div class="stat-card-total">
                    <div class="stat-icon-total">📦</div>
                    <div class="stat-info-total">
                        <h3>${totalProductos}</h3>
                        <p>Total de Productos</p>
                    </div>
                </div>
                <div class="stat-card-total">
                    <div class="stat-icon-total">📊</div>
                    <div class="stat-info-total">
                        <h3>${totalStock}</h3>
                        <p>Total de Unidades</p>
                    </div>
                </div>
                ${esAdmin ? `
                <div class="stat-card-total">
                    <div class="stat-icon-total">💰</div>
                    <div class="stat-info-total">
                        <h3>$${parseFloat(valorInventarioTotal).toFixed(2)}</h3>
                        <p>Valor Total Inventario</p>
                    </div>
                </div>
                <div class="stat-card-total" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">
                    <div class="stat-icon-total">📈</div>
                    <div class="stat-info-total">
                        <h3 id="gananciaAcumuladaValor">Cargando...</h3>
                        <p>Ganancias Generadas</p>
                    </div>
                </div>
                ` : ''}
                <div class="stat-card-total">
                    <div class="stat-icon-total">💵</div>
                    <div class="stat-info-total">
                        <h3>$${parseFloat(valorVentaTotal).toFixed(2)}</h3>
                        <p>Valor Total Venta</p>
                    </div>
                </div>
                <div class="stat-card-total">
                    <div class="stat-icon-total">⚠️</div>
                    <div class="stat-info-total">
                        <h3>${productosSinStock}</h3>
                        <p>Productos Sin Stock</p>
                    </div>
                </div>
                <div class="stat-card-total">
                    <div class="stat-icon-total">🔴</div>
                    <div class="stat-info-total">
                        <h3>${productosBajoStock}</h3>
                        <p>Productos Bajo Stock (< 10)</p>
                    </div>
                </div>
            </div>
            
            <div class="inventario-total-categorias">
                <h3>📋 Resumen por Categoría</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Productos</th>
                            <th>Stock Total</th>
                            ${esAdmin ? '<th>Valor Inventario</th>' : ''}
                            <th>Valor Venta</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Ordenar categorías por cantidad de productos
    const categoriasOrdenadas = Object.entries(productosPorCategoria)
        .sort((a, b) => b[1].cantidad - a[1].cantidad);
    
    categoriasOrdenadas.forEach(([categoria, datos]) => {
        resumenHTML += `
            <tr>
                <td><strong>${categoria}</strong></td>
                <td>${datos.cantidad}</td>
                <td>${datos.stock}</td>
                ${esAdmin ? `<td>$${parseFloat(datos.valorInventario).toFixed(2)}</td>` : ''}
                <td>$${parseFloat(datos.valorVenta).toFixed(2)}</td>
            </tr>
        `;
    });
    
    resumenHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Crear o actualizar contenedor
    let totalContainer = document.getElementById('inventarioTotalContainer');
    if (!totalContainer) {
        totalContainer = document.createElement('div');
        totalContainer.id = 'inventarioTotalContainer';
        totalContainer.className = 'inventario-total-wrapper';
        const tableContainer = document.querySelector('#inventario .table-container');
        if (tableContainer && tableContainer.parentNode) {
            tableContainer.parentNode.insertBefore(totalContainer, tableContainer);
        }
    }
    
    totalContainer.innerHTML = resumenHTML;
    totalContainer.style.display = 'block';
}

// Variable para evitar múltiples listeners
let pestanasInicializadas = false;

// Manejar clics en pestañas de categorías usando event delegation
function inicializarPestanas() {
    // Solo inicializar una vez
    if (pestanasInicializadas) return;
    
    // Usar event delegation para evitar problemas con múltiples listeners
    const inventarioSection = document.getElementById('inventario');
    if (inventarioSection) {
        inventarioSection.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn[data-categoria]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                // Remover activo de todas las pestañas de inventario
                document.querySelectorAll('#inventario .categorias-tabs .tab-btn[data-categoria]').forEach(b => b.classList.remove('active'));
                // Agregar activo a la pestaña clickeada
                btn.classList.add('active');
                // Filtrar productos
                const categoria = btn.getAttribute('data-categoria');
                filtrarInventarioPorCategoria(categoria);
            }
        });
    }
    
    const ventasSection = document.getElementById('ventas');
    if (ventasSection) {
        ventasSection.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn[data-categoria-venta]');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                // Remover activo de todas las pestañas de ventas
                document.querySelectorAll('#ventas .categorias-tabs .tab-btn[data-categoria-venta]').forEach(b => b.classList.remove('active'));
                // Agregar activo a la pestaña clickeada
                btn.classList.add('active');
                // Filtrar productos
                const categoria = btn.getAttribute('data-categoria-venta');
                filtrarProductosVentaPorCategoria(categoria);
                // Limpiar búsqueda
                const buscarInput = document.getElementById('buscarProducto');
                if (buscarInput) buscarInput.value = '';
            }
        });
    }
    
    pestanasInicializadas = true;
    console.log('Pestañas inicializadas correctamente');
}

// Las pestañas se inicializan en el evento DOMContentLoaded anterior

// Editar producto - Abrir modal
async function editarProducto(id) {
    try {
        const producto = await window.electronAPI.getProducto(id);
        if (!producto) {
            showToast('Error', 'Producto no encontrado', 'error');
            return;
        }

        // Llenar formulario con datos del producto
        document.getElementById('editProductId').value = producto.id;
        document.getElementById('editCodigo').value = producto.codigo || '';
        document.getElementById('editNombre').value = producto.nombre || '';
        document.getElementById('editDescripcion').value = producto.descripcion || '';
        document.getElementById('editPrecioInventario').value = producto.precioInventario || 0;
        document.getElementById('editPrecioVenta').value = producto.precioVenta || producto.precio || 0;
        
        // Limpiar y cargar variantes
        const editVariantesBody = document.getElementById('editVariantesBody');
        editVariantesBody.innerHTML = '';
        if (producto.variantes && producto.variantes.length > 0) {
            producto.variantes.forEach(v => agregarFilaVariante('editVariantesBody', v));
        }
        
        // Manejar categoría (si no está en la lista, usar "OTROS")
        const categoriaSelect = document.getElementById('editCategoria');
        const categoriaOtrosGroup = document.getElementById('editCategoriaOtrosGroup');
        const categoriaOtrosInput = document.getElementById('editCategoriaOtros');
        const categoriasLista = Array.from(categoriaSelect.options).map(opt => opt.value);
        
        if (producto.categoria && categoriasLista.includes(producto.categoria)) {
            categoriaSelect.value = producto.categoria;
            categoriaOtrosGroup.style.display = 'none';
            categoriaOtrosInput.required = false;
            categoriaOtrosInput.value = '';
        } else if (producto.categoria) {
            // Categoría personalizada, usar "OTROS"
            categoriaSelect.value = 'OTROS';
            categoriaOtrosGroup.style.display = 'block';
            categoriaOtrosInput.required = true;
            categoriaOtrosInput.value = producto.categoria;
        } else {
            categoriaSelect.value = '';
            categoriaOtrosGroup.style.display = 'none';
            categoriaOtrosInput.required = false;
            categoriaOtrosInput.value = '';
        }

        // Mostrar imagen actual si existe
        const preview = document.getElementById('editImagenPreview');
        if (producto.imagen) {
            const imagenUrl = await window.electronAPI.getImagenPath(producto.imagen);
            if (imagenUrl) {
                preview.innerHTML = `<img src="${imagenUrl}" alt="${producto.nombre}">`;
                preview.classList.add('active');
            }
        } else {
            preview.innerHTML = '';
            preview.classList.remove('active');
        }

        // Mostrar modal
        document.getElementById('editProductModal').classList.add('active');
    } catch (error) {
        showToast('Error', 'Error al cargar producto: ' + error.message, 'error');
    }
}

// Cerrar modal de edición
function closeEditModal() {
    document.getElementById('editProductModal').classList.remove('active');
    document.getElementById('editProductForm').reset();
    document.getElementById('editImagenPreview').innerHTML = '';
    document.getElementById('editImagenPreview').classList.remove('active');
    document.getElementById('editProductMessage').textContent = '';
    document.getElementById('editProductMessage').className = 'message';
    // Ocultar campo "Otros"
    document.getElementById('editCategoriaOtrosGroup').style.display = 'none';
    document.getElementById('editCategoriaOtros').required = false;
    document.getElementById('editCategoriaOtros').value = '';
}

// Actualizar producto
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productoId = document.getElementById('editProductId').value;
    const imagenInput = document.getElementById('editImagen');
    let imagenPath = null;
    
    // Si hay una nueva imagen seleccionada, guardarla
    if (imagenInput.files && imagenInput.files[0]) {
        try {
            const imagenData = await window.electronAPI.saveImagen(imagenInput.files[0]);
            if (imagenData.success) {
                imagenPath = imagenData.path;
                showToast('Imagen guardada', 'La imagen se actualizó correctamente', 'success');
            }
        } catch (error) {
            console.error('Error guardando imagen:', error);
        }
    }
    
    // Obtener categoría (si es "OTROS", usar el texto personalizado)
    let categoria = document.getElementById('editCategoria').value;
    if (categoria === 'OTROS') {
        const categoriaOtros = document.getElementById('editCategoriaOtros').value.trim();
        if (!categoriaOtros) {
            showToast('Error', 'Debe especificar la categoría cuando selecciona "Otros"', 'error');
            return;
        }
        categoria = categoriaOtros.toUpperCase();
    }
    
    const producto = {
        codigo: document.getElementById('editCodigo').value,
        nombre: document.getElementById('editNombre').value,
        descripcion: document.getElementById('editDescripcion').value,
        precioInventario: parseFloat(document.getElementById('editPrecioInventario').value),
        precioVenta: parseFloat(document.getElementById('editPrecioVenta').value),
        precio: parseFloat(document.getElementById('editPrecioVenta').value),
        categoria: categoria,
        variantes: extraerVariantes('editVariantesBody')
    };
    
    // Solo actualizar imagen si se subió una nueva
    if (imagenPath) {
        producto.imagen = imagenPath;
    }
    
    const messageDiv = document.getElementById('editProductMessage');
    
    try {
        const result = await window.electronAPI.updateProducto(productoId, producto);
        
        if (result.success) {
            showToast('Producto actualizado', 'El producto se modificó correctamente', 'success');
            messageDiv.textContent = '✅ Producto actualizado exitosamente';
            messageDiv.className = 'message success';
            closeEditModal();
            loadInventario();
            loadEstadisticas();
        } else {
            showToast('Error', result.error || 'No se pudo actualizar el producto', 'error');
            messageDiv.textContent = '❌ Error: ' + (result.error || 'No se pudo actualizar el producto');
            messageDiv.className = 'message error';
        }
    } catch (error) {
        showToast('Error', 'Error: ' + error.message, 'error');
        messageDiv.textContent = '❌ Error: ' + error.message;
        messageDiv.className = 'message error';
    }
});

// Preview de imagen en modal de edición
document.getElementById('editImagen').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('editImagenPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Vista previa">`;
            preview.classList.add('active');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        preview.classList.remove('active');
    }
});

// Eliminar producto
async function deleteProducto(id) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        try {
            const result = await window.electronAPI.deleteProducto(id);
            if (result.success) {
                showToast('Producto eliminado', 'El producto se eliminó correctamente', 'success');
                loadInventario();
                loadEstadisticas(); // Actualizar estadísticas
            } else {
                showToast('Error', 'No se pudo eliminar el producto', 'error');
            }
        } catch (error) {
            showToast('Error', 'Error al eliminar: ' + error.message, 'error');
        }
    }
}

// Actualizar inventario
document.getElementById('refreshInventario').addEventListener('click', () => {
    loadInventario();
    showToast('Inventario actualizado', 'Los datos se actualizaron correctamente', 'success');
});

// ========== PUNTO DE VENTA ==========
let carrito = [];
let productosDisponibles = [];
let todosLosProductosVenta = [];

// Cargar productos para punto de venta
async function loadProductosVenta() {
    const grid = document.getElementById('productosGrid');
    grid.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    try {
        todosLosProductosVenta = await window.electronAPI.getProductos();
        // Filtrar solo productos con stock > 0
        productosDisponibles = todosLosProductosVenta.filter(p => p.stock > 0);
        
        // Procesar productos para obtener rutas de imágenes
        productosDisponibles = await Promise.all(productosDisponibles.map(async (p) => {
            let imagenPath = null;
            if (p.imagen) {
                imagenPath = await window.electronAPI.getImagenPath(p.imagen);
            }
            return { ...p, imagenPath };
        }));
        
        // Filtrar por categoría activa (buscar en la sección de ventas)
        const categoriaActiva = document.querySelector('#ventas .categorias-tabs .tab-btn.active[data-categoria-venta]')?.getAttribute('data-categoria-venta') || 'TODAS';
        filtrarProductosVentaPorCategoria(categoriaActiva);
    } catch (error) {
        grid.innerHTML = '<div class="loading">Error al cargar productos</div>';
        console.error('Error cargando productos:', error);
    }
}

// Filtrar productos de venta por categoría (solo muestra productos con stock > 0)
function filtrarProductosVentaPorCategoria(categoria) {
    const grid = document.getElementById('productosGrid');
    
    let productosFiltrados = productosDisponibles;
    if (categoria !== 'TODAS') {
        // Filtrar por categoría exacta (incluye categorías personalizadas de "OTROS")
        productosFiltrados = productosDisponibles.filter(p => {
            const pCategoria = (p.categoria || '').toUpperCase();
            return pCategoria === categoria.toUpperCase();
        });
    }
    
    renderProductos(productosFiltrados);
}

// Renderizar productos en el grid
function renderProductos(productos) {
    const grid = document.getElementById('productosGrid');
    
    if (productos.length === 0) {
        grid.innerHTML = '<div class="loading">No hay productos disponibles en esta categoría</div>';
        return;
    }
    
    grid.innerHTML = productos.map(p => {
        const tieneStock = p.stock > 0;
        const imagenSrc = p.imagenPath || '';
        const stockClass = p.stock < 10 ? 'bajo' : '';
        const precioVenta = p.precioVenta || p.precio || 0;
        
        return `
        <div class="producto-card ${!tieneStock ? 'sin-stock' : ''}" ${tieneStock ? `onclick="abrirSelectorVariante(${p.id})"` : ''}>
            ${imagenSrc ? `<img src="${imagenSrc}" alt="${p.nombre}" class="producto-imagen">` : '<div class="producto-imagen">📦</div>'}
            <div class="producto-nombre">${p.nombre}</div>
            <div class="producto-precio">$${parseFloat(precioVenta).toFixed(2)}</div>
            <div class="producto-stock ${stockClass}">Stock: ${p.stock}</div>
        </div>
    `;
    }).join('');
}

// Búsqueda de productos
document.getElementById('buscarProducto').addEventListener('input', (e) => {
    const busqueda = e.target.value.toLowerCase();
    const categoriaActiva = document.querySelector('#ventas .categorias-tabs .tab-btn.active[data-categoria-venta]')?.getAttribute('data-categoria-venta') || 'TODAS';
    
    let productosFiltrados = productosDisponibles;
    
    // Filtrar por categoría
    if (categoriaActiva !== 'TODAS') {
        productosFiltrados = productosFiltrados.filter(p => {
            const pCategoria = (p.categoria || '').toUpperCase();
            return pCategoria === categoriaActiva.toUpperCase();
        });
    }
    
    // Filtrar por búsqueda
    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(busqueda) || 
            p.codigo.toLowerCase().includes(busqueda)
        );
    }
    
    renderProductos(productosFiltrados);
});

// Venta Modal Support
let productoActualVenta = null;

function abrirSelectorVariante(productoId) {
    const producto = productosDisponibles.find(p => p.id === productoId);
    if (!producto || producto.stock <= 0) return;
    
    if (!producto.variantes || producto.variantes.length === 0) {
        // Compatibilidad con productos viejos sin variantes transformadas (en caso de que queden)
        agregarAlCarrito(producto.id, null, '', '', producto.stock);
        return;
    }
    
    // Si tiene solo 1 variante (ej. no es ropa) o todas las variantes tienen el mismo precio y es la única que tiene stock
    // Para simplificar, si hay 1 variante, la auto-añadimos. Si no, abrimos modal.
    const variantesConStock = producto.variantes.filter(v => v.stock > 0);
    if (variantesConStock.length === 1) {
        const v = variantesConStock[0];
        agregarAlCarrito(producto.id, v.id, v.talla, v.color, v.stock);
        return;
    }
    
    productoActualVenta = producto;
    document.getElementById('variantSelectProductName').textContent = producto.nombre;
    const tbody = document.getElementById('variantSelectorBody');
    tbody.innerHTML = producto.variantes.map(v => {
        const hasStock = v.stock > 0;
        return `
            <tr class="${!hasStock ? 'sin-stock' : ''}" style="${!hasStock ? 'opacity: 0.5' : ''}">
                <td><strong>${v.talla || '-'}</strong></td>
                <td>${v.color || '-'}</td>
                <td>${v.stock}</td>
                <td>
                    <button class="btn btn-small btn-success" ${!hasStock ? 'disabled' : ''} 
                            onclick="agregarAlCarrito(${producto.id}, ${v.id}, '${v.talla || ''}', '${v.color || ''}', ${v.stock})">
                        🛍️ Añadir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('variantSelectorModal').classList.add('active');
}

function closeVariantModal() {
    document.getElementById('variantSelectorModal').classList.remove('active');
    productoActualVenta = null;
}

// Agregar producto al carrito
async function agregarAlCarrito(productoId, varianteId = null, talla = '', color = '', stockEspecificado = null) {
    const producto = productosDisponibles.find(p => p.id === productoId);
    if (!producto) return;
    
    const maxStock = stockEspecificado !== null ? stockEspecificado : producto.stock;
    if (maxStock <= 0) return;
    
    const itemExistente = carrito.find(item => item.id === productoId && item.variante_id === varianteId);
    const precioVenta = producto.precioVenta || producto.precio || 0;
    
    const descripcionTalla = talla ? `${talla}` : '';
    const descripcionColor = color ? ` ${color}` : '';
    const nameSufix = (talla || color) ? ` (${descripcionTalla}${descripcionColor})` : '';
    
    if (itemExistente) {
        if (itemExistente.cantidad < maxStock) {
            itemExistente.cantidad++;
        } else {
            alert('No hay suficiente stock disponible de esta talla');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            variante_id: varianteId,
            nombre: producto.nombre + nameSufix,
            codigo: producto.codigo,
            precio: precioVenta,
            precioOriginal: precioVenta,
            descuento: 0,
            cantidad: 1,
            stock_disponible: maxStock
        });
    }
    
    closeVariantModal();
    actualizarCarrito();
}

// Actualizar visualización del carrito
function actualizarCarrito() {
    const carritoItems = document.getElementById('carritoItems');
    
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<div class="carrito-vacio">El carrito está vacío</div>';
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('total').textContent = '$0.00';
        return;
    }
    
    let subtotal = 0;
    
    carritoItems.innerHTML = carrito.map((item, index) => {
        const totalItem = item.precio * item.cantidad;
        subtotal += totalItem;
        
        let precioHtml = `$${parseFloat(item.precio).toFixed(2)} c/u`;
        if (item.descuento > 0) {
            precioHtml = `<span style="text-decoration: line-through; color: #999; font-size: 0.8em;">$${parseFloat(item.precioOriginal).toFixed(2)}</span> $${parseFloat(item.precio).toFixed(2)} c/u`;
        }
        
        return `
            <div class="carrito-item">
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre} ${item.descuento > 0 ? '<span style="color: #e53e3e; font-size: 0.8em; font-weight: bold;">(Dto. aplicado)</span>' : ''}</div>
                    <div class="carrito-item-detalle">${item.codigo} - ${precioHtml}</div>
                </div>
                <div class="carrito-item-cantidad">
                    <button class="cantidad-btn" onclick="modificarCantidad(${index}, -1)">-</button>
                    <input type="number" class="cantidad-input" value="${item.cantidad}" min="1" max="${item.stock_disponible}" onchange="cambiarCantidad(${index}, this.value)">
                    <button class="cantidad-btn" onclick="modificarCantidad(${index}, 1)">+</button>
                </div>
                <div class="carrito-item-total">
                    $${totalItem.toFixed(2)}
                    ${item.descuento > 0 ? `<br><span style="color: #e53e3e; font-size: 0.8em;">(Ahorro: $${item.descuento.toFixed(2)})</span>` : ''}
                </div>
                <div class="carrito-item-acciones" style="display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn btn-small" style="background-color: #f59e0b; color: white; padding: 4px;" onclick="aplicarDescuentoItem(${index})" title="Añadir Descuento">🏷️</button>
                    <button class="carrito-item-eliminar" onclick="eliminarDelCarrito(${index})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${subtotal.toFixed(2)}`;
}

// Modificar cantidad en el carrito
function modificarCantidad(index, cambio) {
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }
    
    if (nuevaCantidad > item.stock_disponible) {
        alert('No hay suficiente stock disponible');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    actualizarCarrito();
}

// Cambiar cantidad directamente
function cambiarCantidad(index, nuevaCantidad) {
    const item = carrito[index];
    const cantidad = parseInt(nuevaCantidad);
    
    if (isNaN(cantidad) || cantidad < 1) {
        item.cantidad = 1;
    } else if (cantidad > item.stock_disponible) {
        alert('No hay suficiente stock disponible');
        item.cantidad = item.stock_disponible;
    } else {
        item.cantidad = cantidad;
    }
    
    actualizarCarrito();
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Limpiar carrito
document.getElementById('limpiarCarrito').addEventListener('click', () => {
    if (carrito.length > 0 && confirm('¿Está seguro de limpiar el carrito?')) {
        carrito = [];
        actualizarCarrito();
    }
});

// Aplicar descuento a un item específico del carrito
async function aplicarDescuentoItem(index) {
    const item = carrito[index];
    const precioOriginal = item.precioOriginal || item.precio;
    const totalOriginal = precioOriginal * item.cantidad;
    
    // Obtener costo para validación de ganancia
    const producto = await window.electronAPI.getProducto(item.id);
    const precioInventario = producto ? (producto.precioInventario || producto.precio_inventario || 0) : 0;
    const gananciaOriginal = (precioOriginal - precioInventario) * item.cantidad;
    
    // Pedir el monto del descuento aprovechando la función ya existente
    let nuevoPrecioInput = await pedirDescuento(item, precioOriginal, totalOriginal, gananciaOriginal);
    
    if (nuevoPrecioInput !== null && typeof nuevoPrecioInput === 'string' && nuevoPrecioInput.trim() !== '') {
        const nuevoPrecioUnitario = parseFloat(nuevoPrecioInput.trim());
        
        if (isNaN(nuevoPrecioUnitario) || nuevoPrecioUnitario < 0) {
            alert('❌ Precio inválido.');
        } else if (nuevoPrecioUnitario > precioOriginal) {
            alert('❌ El nuevo precio no puede ser mayor al precio original.');
        } else {
            const descuentoUnitario = precioOriginal - nuevoPrecioUnitario;
            const descuentoTotal = descuentoUnitario * item.cantidad;
            
            item.descuento = descuentoTotal;
            // El precio unitario refleja el precio ya rebajado!
            item.precio = nuevoPrecioUnitario;
            // Actualizar vista del carrito
            actualizarCarrito();
            // showToast('Descuento aplicado', `Se descontaron $${descuentoAplicado.toFixed(2)} del producto`, 'success');
        }
    }
}

// ====== Modal Personalizado para Descuento ======
let resolveDescuentoPromise = null;

function pedirDescuento(item, precioOriginal, totalOriginal, gananciaOriginal) {
    return new Promise((resolve) => {
        const modal = document.getElementById('descuentoModal');
        const input = document.getElementById('descuentoInputVal');
        const msj = document.getElementById('descuentoMensaje');
        
        msj.innerHTML = 
            `<strong>Producto:</strong> ${item.nombre}<br>` +
            `<strong style="color: #666;">Precio original:</strong> $${precioOriginal.toFixed(2)} c/u`;
            
        input.value = '';
        modal.classList.add('active');
        input.focus();
        
        // Setup listener for enter key
        const enterListener = function(e) {
            if (e.key === 'Enter') {
                document.getElementById('btnDescuentoAceptar').click();
                input.removeEventListener('keydown', enterListener);
            }
        };
        input.addEventListener('keydown', enterListener);
        
        resolveDescuentoPromise = resolve;
    });
}

function cerrarModalDescuento() {
    document.getElementById('descuentoModal').classList.remove('active');
    if (resolveDescuentoPromise) {
        resolveDescuentoPromise(null);
        resolveDescuentoPromise = null;
    }
}

document.getElementById('btnDescuentoAceptar').addEventListener('click', () => {
    const val = document.getElementById('descuentoInputVal').value;
    document.getElementById('descuentoModal').classList.remove('active');
    if (resolveDescuentoPromise) {
        resolveDescuentoPromise(val);
        resolveDescuentoPromise = null;
    }
});

// Función para aplicar descuentos a los productos del carrito
async function aplicarDescuentos() {
    const ventasConDescuento = [];
    
    for (let i = 0; i < carrito.length; i++) {
        const item = carrito[i];
        const precioOriginal = item.precioOriginal || item.precio;
        const totalOriginal = precioOriginal * item.cantidad;
        
        // Obtener información del producto para calcular ganancia
        const producto = await window.electronAPI.getProducto(item.id);
        const precioInventario = producto ? (producto.precioInventario || producto.precio_inventario || 0) : 0;
        
        const gananciaOriginal = (precioOriginal - precioInventario) * item.cantidad;
        const gananciaFinal = (item.precio - precioInventario) * item.cantidad;
        
        ventasConDescuento.push({
            producto_id: item.id,
            variante_id: item.variante_id || null, // Asegurarse de mantener el ID de variante!!
            cantidad: item.cantidad,
            precio_unitario: item.precio, // YA TIENE DESCUENTO APLICADO
            descuento: item.descuento || 0,
            precio_original: precioOriginal,
            ganancia_original: gananciaOriginal,
            ganancia_final: gananciaFinal
        });
    }
    
    return ventasConDescuento;
}

// Procesar venta
document.getElementById('procesarVenta').addEventListener('click', async () => {
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    // Mostrar resumen antes de aplicar descuentos
    const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    if (!confirm(`¿Confirmar venta?\n\nTotal del carrito: $${totalCarrito.toFixed(2)}\n\nSe le preguntará por descuentos para cada producto.`)) {
        return;
    }
    
    try {
        // Aplicar descuentos a cada producto
        const ventasConDescuento = await aplicarDescuentos();
        
        // Convertir a formato de venta múltiple
        const ventas = ventasConDescuento.map(item => ({
            producto_id: item.producto_id,
            variante_id: item.variante_id || null, // Asegurar añadir la variante_id aquí
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        }));
        
        // Calcular totales
        const totalFinal = ventasConDescuento.reduce((sum, item) => {
            return sum + (item.precio_unitario * item.cantidad);
        }, 0);
        
        const totalDescuentos = ventasConDescuento.reduce((sum, item) => {
            return sum + (item.descuento || 0);
        }, 0);
        
        const gananciaTotal = ventasConDescuento.reduce((sum, item) => {
            return sum + (item.ganancia_final || 0);
        }, 0);
        
        const gananciaOriginalTotal = ventasConDescuento.reduce((sum, item) => {
            return sum + (item.ganancia_original || 0);
        }, 0);
        
        // Confirmación con toda la información ha sido removida a petición del usuario.
        // La venta procede directamente ya que todo se calcula en tiempo real en la UI.
        
        const result = await window.electronAPI.addVentaMultiple(ventas);
        
        if (result.success) {
            showToast('Venta procesada', `Venta registrada por $${totalFinal.toFixed(2)}`, 'success');
            carrito = [];
            actualizarCarrito();
            // Recargar productos para actualizar stock
            await loadProductosVenta();
            // Recargar inventario si estamos en esa sección
            if (document.getElementById('inventario').classList.contains('active')) {
                await loadInventario();
            }
            // Actualizar estadísticas si estamos en esa sección
            if (document.getElementById('estadisticas').classList.contains('active')) {
                loadEstadisticas();
            }
        } else {
            showToast('Error en venta', result.error || 'No se pudo procesar la venta', 'error');
        }
    } catch (error) {
        showToast('Error', 'Error al procesar venta: ' + error.message, 'error');
    }
});


const categoryPrefixes = {
    'SUDADERAS': 'S',
    'CONJUNTOS': 'C',
    'PLAYERAS': 'P',
    'CAMISETAS': 'CA',
    'CALCETAS': 'CL',
    'PANS': 'PA',
    'PANTALONES': 'PT',
    'PLAYERA MANGA LARGA': 'PL',
    'POLO': 'PO',
    'CINTURÓN': 'CI',
    'RELOJ': 'R',
    'SNKRS': 'SK',
    'ACCESORIOS': 'A',
    'GORRAS': 'G',
    'LENTES': 'L',
    'MOCHILA': 'M',
    'MALETA': 'ML',
    'BANDOLERAS': 'B',
    'PERFUMES': 'PE',
    'PELUCHES': 'PLU',
    'SHORT': 'SH',
    'OTROS': 'O'
};

// Mostrar/ocultar campo "Otros" en formulario de agregar y autogenerar código
document.getElementById('categoria').addEventListener('change', async (e) => {
    const categoriaOtrosGroup = document.getElementById('categoriaOtrosGroup');
    const categoriaOtrosInput = document.getElementById('categoriaOtros');
    const selectedCat = e.target.value;
    
    if (selectedCat === 'OTROS') {
        categoriaOtrosGroup.style.display = 'block';
        categoriaOtrosInput.required = true;
    } else {
        categoriaOtrosGroup.style.display = 'none';
        categoriaOtrosInput.required = false;
        categoriaOtrosInput.value = '';
    }
    
    // Autogenerar código
    if (selectedCat && categoryPrefixes[selectedCat]) {
        try {
            const prefijo = categoryPrefixes[selectedCat];
            const productos = await window.electronAPI.getProductos();
            
            let maxNumber = 0;
            productos.forEach(p => {
                const codigo = p.codigo || '';
                if (codigo.toUpperCase().startsWith(prefijo)) {
                    // Extraer solo la parte numérica después del prefijo
                    const strNum = codigo.substring(prefijo.length);
                    // Solo intentar parsing si solo contiene dígitos después del prefijo
                    // para evitar confundir CA1 (Camisetas) con C11 (Conjuntos)
                    if (/^\d+$/.test(strNum)) {
                        const num = parseInt(strNum, 10);
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                }
            });
            
            const nextCode = prefijo + (maxNumber + 1).toString();
            document.getElementById('codigo').value = nextCode;
            
        } catch (error) {
            console.error('Error al autogenerar el código:', error);
        }
    } else if (!selectedCat || selectedCat === 'OTROS') {
        document.getElementById('codigo').value = '';
    }
});

// Mostrar/ocultar campo "Otros" en formulario de editar
document.getElementById('editCategoria').addEventListener('change', (e) => {
    const editCategoriaOtrosGroup = document.getElementById('editCategoriaOtrosGroup');
    const editCategoriaOtrosInput = document.getElementById('editCategoriaOtros');
    if (e.target.value === 'OTROS') {
        editCategoriaOtrosGroup.style.display = 'block';
        editCategoriaOtrosInput.required = true;
    } else {
        editCategoriaOtrosGroup.style.display = 'none';
        editCategoriaOtrosInput.required = false;
        editCategoriaOtrosInput.value = '';
    }
});

// Preview de imagen
document.getElementById('imagen').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('imagenPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Vista previa">`;
            preview.classList.add('active');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        preview.classList.remove('active');
    }
});

// Formulario de producto
document.getElementById('productoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imagenInput = document.getElementById('imagen');
    let imagenPath = null;
    
    // Si hay una imagen seleccionada, guardarla
    if (imagenInput.files && imagenInput.files[0]) {
        try {
            const imagenData = await window.electronAPI.saveImagen(imagenInput.files[0]);
            if (imagenData.success) {
                imagenPath = imagenData.path;
                showToast('Imagen guardada', 'La imagen se subió correctamente a Supabase', 'success');
            } else {
                showToast('Error', 'No se pudo guardar la imagen', 'error');
            }
        } catch (error) {
            console.error('Error guardando imagen:', error);
            showToast('Error', 'Error al guardar imagen: ' + error.message, 'error');
        }
    }
    
    // Obtener categoría (si es "OTROS", usar el texto personalizado)
    let categoria = document.getElementById('categoria').value;
    if (categoria === 'OTROS') {
        const categoriaOtros = document.getElementById('categoriaOtros').value.trim();
        if (!categoriaOtros) {
            showToast('Error', 'Debe especificar la categoría cuando selecciona "Otros"', 'error');
            return;
        }
        categoria = categoriaOtros.toUpperCase();
    }
    
    const producto = {
        codigo: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precioInventario: parseFloat(document.getElementById('precioInventario').value),
        precioVenta: parseFloat(document.getElementById('precioVenta').value),
        precio: parseFloat(document.getElementById('precioVenta').value), // Para compatibilidad
        categoria: categoria,
        variantes: extraerVariantes('variantesBody'),
        imagen: imagenPath
    };
    
    const messageDiv = document.getElementById('productoMessage');
    
    try {
        const result = await window.electronAPI.addProducto(producto);
        
        if (result.success) {
            showToast('Producto agregado', 'El producto se agregó correctamente', 'success');
            messageDiv.textContent = '✅ Producto agregado exitosamente';
            messageDiv.className = 'message success';
            document.getElementById('productoForm').reset();
            document.getElementById('imagenPreview').innerHTML = '';
            document.getElementById('imagenPreview').classList.remove('active');
            // Ocultar campo "Otros"
            document.getElementById('categoriaOtrosGroup').style.display = 'none';
            document.getElementById('categoriaOtros').required = false;
            document.getElementById('categoriaOtros').value = '';
            loadInventario();
            loadEstadisticas();
            
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }, 3000);
        } else {
            showToast('Error', result.error || 'No se pudo agregar el producto', 'error');
            messageDiv.textContent = '❌ Error: ' + (result.error || 'No se pudo agregar el producto');
            messageDiv.className = 'message error';
        }
    } catch (error) {
        showToast('Error', 'Error: ' + error.message, 'error');
        messageDiv.textContent = '❌ Error: ' + error.message;
        messageDiv.className = 'message error';
    }
});

// Cargar estadísticas al iniciar (solo si estamos en la sección de estadísticas)
if (document.getElementById('estadisticas').classList.contains('active')) {
    loadEstadisticas();
}

// Helper methods for Variantes
function agregarFilaVariante(tbodyId, variant = {}) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <input type="hidden" class="var-id" value="${variant.id || ''}">
        <input type="hidden" class="var-sku" value="${variant.sku || ''}">
        <td><input type="text" class="var-talla" placeholder="S, M, 5, 28..." value="${variant.talla || ''}" required style="padding:5px; border-radius:4px; border:1px solid #ccc; width:100px;"></td>
        <td><input type="text" class="var-color" placeholder="Rojo, Azul..." value="${variant.color || ''}" style="padding:5px; border-radius:4px; border:1px solid #ccc; width:100px;"></td>
        <td><input type="number" class="var-stock" placeholder="0" min="0" value="${variant.stock || 0}" required style="padding:5px; border-radius:4px; border:1px solid #ccc; width:60px;"></td>
        <td><button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.parentElement.remove()">❌</button></td>
    `;
    tbody.appendChild(tr);
}

function extraerVariantes(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const filas = tbody.querySelectorAll('tr');
    const variantes = [];
    filas.forEach(fila => {
        variantes.push({
            id: fila.querySelector('.var-id').value || undefined,
            sku: fila.querySelector('.var-sku').value || '',
            talla: fila.querySelector('.var-talla').value.toUpperCase(),
            color: fila.querySelector('.var-color').value.toUpperCase(),
            stock: parseInt(fila.querySelector('.var-stock').value)
        });
    });
    return variantes;
}

// Agregar estilo para texto de peligro
const style = document.createElement('style');
style.textContent = '.text-danger { color: #e53e3e; font-weight: bold; }';
document.head.appendChild(style);

// ==================================================
// FUNCIONALIDAD RESPONSIVA PARA DISPOSITIVOS MÓVILES
// ==================================================
window.addEventListener('DOMContentLoaded', () => {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('active');
            }
        });
    }
    
    // Cerrar sidebar al hacer clic en el velo de fondo (overlay)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // Función auxiliar para cerrar sidebar en dispositivos móviles
    function checkAndCloseSidebar() {
        if (sidebar && window.innerWidth <= 991) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    }
    
    // Cerrar sidebar al hacer clic en cualquier enlace del menú de la barra lateral
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            checkAndCloseSidebar();
        });
    });
    
    // Cerrar sidebar al hacer clic en los botones del pie de la barra lateral (como Cerrar Sesión)
    const sidebarFooterBtns = document.querySelectorAll('.sidebar-footer button');
    sidebarFooterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            checkAndCloseSidebar();
        });
    });
    
    // Cerrar sidebar al navegar mediante las tarjetas principales del panel (Dashboard Cards)
    // Usamos event delegation en el área de contenido para captar los clics en .dashboard-card
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.addEventListener('click', (e) => {
            const card = e.target.closest('.dashboard-card');
            if (card) {
                checkAndCloseSidebar();
            }
        });
    }
});

