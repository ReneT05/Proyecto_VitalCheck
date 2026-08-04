document.addEventListener('DOMContentLoaded', function() {
    // Referencias actualizadas
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const ticketBody = document.getElementById('itemList');
    const totalVenta = document.getElementById('cartSubtotal');
    const currentTicketSpan = document.getElementById('currentTicketNumber');

    // Endpoints de la API
    const API_PRODUCTOS_URL = 'https://elrjtd.online/DDI/API/productos.php';
    const API_VENTAS_URL = 'https://elrjtd.online/DDI/API/ventas.php';

    let productosOriginales = [];
    let carrito = [];
    let ultimoTicketId = null;

    function formatearPrecio(valor) {
        return `$${Number(valor).toFixed(2)}`;
    }

    function formatearNumeroTicket(id) {
        if (!id) return 'Ticket #---';
        return `Ticket #${String(id).padStart(3, '0')}`;
    }

    function actualizarNumeroTicket() {
        if (currentTicketSpan) {
            if (ultimoTicketId) {
                currentTicketSpan.textContent = formatearNumeroTicket(ultimoTicketId);
                currentTicketSpan.style.color = '#28a745';
                currentTicketSpan.style.fontWeight = 'bold';
            } else {
                currentTicketSpan.textContent = 'Ticket #---';
                currentTicketSpan.style.color = '';
                currentTicketSpan.style.fontWeight = '';
            }
        }
    }

    function renderizarProductos(productos) {
        if (!productGrid) return;

        productGrid.innerHTML = '';

        if (productos.length === 0) {
            productGrid.innerHTML = '<div class="col-12 text-center p-5 text-muted">No se encontraron productos.</div>';
            return;
        }

        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'product-card card shadow-sm h-100';
            card.innerHTML = `
                <div class="card-body d-flex flex-column justify-content-between p-3">
                    <div>
                        <h6 class="fw-bold mb-1">${producto.nombre || '-'}</h6>
                        <p class="small text-muted mb-2">${producto.descripcion || ''}</p>
                        <small class="text-muted">Código: ${producto.id || 'N/A'}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="fs-5 fw-bold text-primary">${formatearPrecio(producto.precio || 0)}</span>
                        <button class="btn btn-sm btn-primary rounded-circle add-to-cart-btn" 
                                data-product='${JSON.stringify(producto).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;

            const addBtn = card.querySelector('.add-to-cart-btn');
            addBtn.addEventListener('click', () => {
                agregarAlCarrito(producto);
            });

            productGrid.appendChild(card);
        });
    }

    function actualizarTicket() {
        if (!ticketBody || !totalVenta) return;

        ticketBody.innerHTML = '';
        let total = 0;

        if (carrito.length === 0) {
            ticketBody.innerHTML = '<div class="text-center text-muted p-4">El ticket está vacío</div>';
            totalVenta.textContent = formatearPrecio(0);
            const mobileTotalSpan = document.getElementById('mobileTotalSpan');
            if (mobileTotalSpan) mobileTotalSpan.textContent = formatearPrecio(0);
            const payButton = document.getElementById('payButtonMobileStyle');
            if (payButton) payButton.innerHTML = `<i class="fas fa-credit-card me-2"></i> Pagar ${formatearPrecio(0)}`;
            return;
        }

        carrito.forEach((item, index) => {
            const subtotal = Number(item.precio) * item.cantidad_carrito;
            total += subtotal;

            const itemTicket = document.createElement('div');
            itemTicket.className = 'd-flex justify-content-between align-items-center mb-3 border-bottom pb-2';
            itemTicket.innerHTML = `
                <div style="flex-grow: 1;">
                    <div class="fw-bold text-truncate" style="max-width: 150px;">${item.nombre}</div>
                    <small class="text-muted">${item.cantidad_carrito} x ${formatearPrecio(item.precio)}</small>
                </div>
                <div class="text-end me-3">
                    <span class="fw-bold">${formatearPrecio(subtotal)}</span>
                </div>
                <button class="btn btn-sm text-danger border-0 p-1 delete-item" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            ticketBody.appendChild(itemTicket);
        });

        document.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'));
                eliminarDelCarrito(index);
            });
        });

        totalVenta.textContent = formatearPrecio(total);
        const mobileTotalSpan = document.getElementById('mobileTotalSpan');
        if (mobileTotalSpan) mobileTotalSpan.textContent = formatearPrecio(total);
        const payButton = document.getElementById('payButtonMobileStyle');
        if (payButton) payButton.innerHTML = `<i class="fas fa-credit-card me-2"></i> Pagar ${formatearPrecio(total)}`;
    }

    function cargarProductos() {
        if (productGrid) {
            productGrid.innerHTML = '<div class="col-12 text-center p-5">Cargando catálogo...</div>';
        }

        fetch(API_PRODUCTOS_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    productosOriginales = data.data;
                    renderizarProductos(productosOriginales);
                } else {
                    throw new Error('Formato de respuesta inválido');
                }
            })
            .catch(error => {
                console.error('Error cargando catálogo para ventas:', error);
                if (productGrid) {
                    productGrid.innerHTML = `<div class="col-12 alert alert-danger">Error: ${error.message}</div>`;
                }
            });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = productosOriginales.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
                (p.id && String(p.id).includes(term))
            );
            renderizarProductos(filtrados);
        });
    }

    window.agregarAlCarrito = function(producto) {
        const itemEnCarrito = carrito.find(p => p.id === producto.id);
        if (itemEnCarrito) {
            itemEnCarrito.cantidad_carrito += 1;
        } else {
            carrito.push({
                ...producto,
                cantidad_carrito: 1
            });
        }
        actualizarTicket();
    };

    window.eliminarDelCarrito = function(index) {
        carrito.splice(index, 1);
        actualizarTicket();
    };

    // === FUNCIONALIDAD DE PAGO ===
    const payButton = document.getElementById('payButtonMobileStyle');
    const paymentModal = document.getElementById('paymentPreview');
    const previewItemsList = document.getElementById('previewItemsList');
    const previewSubtotal = document.getElementById('previewSubtotal');
    const previewTotalAmount = document.getElementById('previewTotalAmount');
    const previewCloseBtn = document.getElementById('previewCloseBtn');
    const previewCancelBtn = document.getElementById('previewCancelBtn');
    const previewConfirmBtn = document.getElementById('previewConfirmBtn');

    function mostrarModalPago() {
        if (!paymentModal || carrito.length === 0) return;

        previewItemsList.innerHTML = '';
        let subtotal = 0;

        carrito.forEach(item => {
            const subtotalItem = Number(item.precio) * item.cantidad_carrito;
            subtotal += subtotalItem;
            const itemElement = document.createElement('div');
            itemElement.className = 'd-flex justify-content-between mb-2 pb-2 border-bottom';
            itemElement.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong>
                    <small class="d-block text-muted">${item.cantidad_carrito} x ${formatearPrecio(item.precio)}</small>
                </div>
                <span class="fw-bold">${formatearPrecio(subtotalItem)}</span>
            `;
            previewItemsList.appendChild(itemElement);
        });

        previewSubtotal.textContent = formatearPrecio(subtotal);
        previewTotalAmount.textContent = formatearPrecio(subtotal);
        paymentModal.classList.remove('d-none');
    }

    function cerrarModalPago() {
        if (paymentModal) {
            paymentModal.classList.add('d-none');
        }
    }

    async function registrarVentaEnBD(ventaData) {
        const response = await fetch(API_VENTAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            return { success: true, venta_id: result.venta_id, total: result.total };
        } else {
            throw new Error(result.error || 'Error al registrar la venta');
        }
    }

    async function procesarPago() {
        if (carrito.length === 0) {
            alert('No hay productos en el carrito');
            return;
        }

        const confirmBtn = previewConfirmBtn;
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;

        try {
            const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * item.cantidad_carrito), 0);
            const ventaData = {
                items: carrito.map(item => ({
                    producto_id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidad_carrito,
                    precio_unitario: parseFloat(item.precio),
                    subtotal: parseFloat(Number(item.precio) * item.cantidad_carrito)
                }))
            };

            const resultado = await registrarVentaEnBD(ventaData);

            if (resultado.success) {
                ultimoTicketId = resultado.venta_id;
                actualizarNumeroTicket();

                alert(`✅ ¡Venta completada con éxito!\n\n${formatearNumeroTicket(resultado.venta_id)}\nTotal: ${formatearPrecio(resultado.total)}`);

                carrito = [];
                actualizarTicket();
                cerrarModalPago();

                // Recargar el historial si está visible
                const historyModal = document.getElementById('historyPreview');
                if (historyModal && !historyModal.classList.contains('d-none')) {
                    await cargarHistorialVentas();
                }
            } else {
                throw new Error(resultado.message || 'Error al guardar la venta');
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert(`❌ Error al procesar el pago: ${error.message}`);
        } finally {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }

    if (payButton) {
        payButton.addEventListener('click', () => {
            if (carrito.length > 0) {
                mostrarModalPago();
            } else {
                alert('El carrito está vacío. Agrega productos primero.');
            }
        });
    }

    if (previewCloseBtn) previewCloseBtn.addEventListener('click', cerrarModalPago);
    if (previewCancelBtn) previewCancelBtn.addEventListener('click', cerrarModalPago);
    if (previewConfirmBtn) previewConfirmBtn.addEventListener('click', procesarPago);

    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) cerrarModalPago();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && paymentModal && !paymentModal.classList.contains('d-none')) {
            cerrarModalPago();
        }
    });

    // === FUNCIONALIDAD DE HISTORIAL DE TICKETS ===
    const historyButton = document.getElementById('historyButton');
    const historyModal = document.getElementById('historyPreview');
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    const historyCancelBtn = document.getElementById('historyCancelBtn');
    const ticketSearchInput = document.getElementById('ticketSearchInput');

    let todasLasVentas = [];

    window.cargarHistorialVentas = async function() {
        try {
            // Usar el endpoint existente con días = 9999 para traer todas las ventas
            const response = await fetch(`${API_VENTAS_URL}?dias=9999`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                todasLasVentas = result.data;
                renderizarHistorial(todasLasVentas);
            } else {
                throw new Error(result.error || 'Formato de respuesta inválido');
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
            const historyList = document.getElementById('historyList');
            if (historyList) {
                historyList.innerHTML = '<div class="alert alert-danger">Error al cargar historial</div>';
            }
        }
    };

    function renderizarHistorial(ventas) {
        const historyList = document.getElementById('historyList');
        const historyCountSpan = document.getElementById('historyCountSpan');
        const historyTotalSpan = document.getElementById('historyTotalSpan');

        if (!historyList) return;

        historyList.innerHTML = '';
        let totalRecaudado = 0;

        if (ventas.length === 0) {
            historyList.innerHTML = '<div class="text-center text-muted p-4">No hay tickets registrados.</div>';
        } else {
            ventas.forEach(venta => {
                totalRecaudado += venta.total;
                const ticketElement = document.createElement('div');
                ticketElement.className = 'd-flex justify-content-between align-items-center mb-2 pb-2 border-bottom';
                ticketElement.style.cursor = 'pointer';
                ticketElement.innerHTML = `
                    <div>
                        <div class="fw-bold text-primary">${formatearNumeroTicket(venta.id)}</div>
                        <small class="text-muted">${new Date(venta.fecha).toLocaleString()}</small>
                        <div><small>${venta.items} productos</small></div>
                    </div>
                    <div class="text-end">
                        <span class="fw-bold text-success">${formatearPrecio(venta.total)}</span>
                        <button class="btn btn-sm btn-outline-info ms-2 view-ticket-btn" data-id="${venta.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;

                const viewBtn = ticketElement.querySelector('.view-ticket-btn');
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mostrarDetalleTicket(venta);
                });

                historyList.appendChild(ticketElement);
            });
        }

        if (historyCountSpan) historyCountSpan.textContent = ventas.length;
        if (historyTotalSpan) historyTotalSpan.textContent = formatearPrecio(totalRecaudado);
    }

    function mostrarModalHistorial() {
        if (historyModal) {
            historyModal.classList.remove('d-none');
            cargarHistorialVentas();
        }
    }

    function cerrarModalHistorial() {
        if (historyModal) {
            historyModal.classList.add('d-none');
            if (ticketSearchInput) ticketSearchInput.value = '';
        }
    }

    if (ticketSearchInput) {
        ticketSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtrados = todasLasVentas.filter(venta =>
                String(venta.id).includes(searchTerm) ||
                formatearNumeroTicket(venta.id).toLowerCase().includes(searchTerm)
            );
            renderizarHistorial(filtrados);
        });
    }

    // === MODAL DE DETALLE DE TICKET ===
    const ticketDetailModal = document.getElementById('ticketDetailModal');
    const ticketDetailTitle = document.getElementById('ticketDetailTitle');
    const ticketDetailDate = document.getElementById('ticketDetailDate');
    const ticketDetailItems = document.getElementById('ticketDetailItems');
    const ticketDetailTotal = document.getElementById('ticketDetailTotal');
    const ticketDetailCloseBtn = document.getElementById('ticketDetailCloseBtn');
    const ticketDetailCancelBtn = document.getElementById('ticketDetailCancelBtn');

    function mostrarDetalleTicket(venta) {
        if (!ticketDetailModal) return;

        ticketDetailTitle.textContent = formatearNumeroTicket(venta.id);
        ticketDetailDate.textContent = new Date(venta.fecha).toLocaleString();

        ticketDetailItems.innerHTML = '';

        if (venta.detalles && venta.detalles.length > 0) {
            venta.detalles.forEach(detalle => {
                // Buscar el nombre del producto (si no viene en el detalle, mostrar "Producto")
                const nombreProducto = detalle.nombre_producto || `Producto #${detalle.producto_id}`;
                const itemElement = document.createElement('div');
                itemElement.className = 'd-flex justify-content-between mb-2 pb-2 border-bottom';
                itemElement.innerHTML = `
                    <div>
                        <strong>${nombreProducto}</strong>
                        <small class="d-block text-muted">
                            ${detalle.cantidad} x ${formatearPrecio(detalle.precio_unitario)}
                        </small>
                    </div>
                    <span class="fw-bold">${formatearPrecio(detalle.subtotal)}</span>
                `;
                ticketDetailItems.appendChild(itemElement);
            });
        } else {
            ticketDetailItems.innerHTML = '<div class="text-center text-muted p-4">No hay detalles disponibles</div>';
        }

        ticketDetailTotal.textContent = formatearPrecio(venta.total);
        ticketDetailModal.classList.remove('d-none');
    }

    function cerrarDetalleTicket() {
        if (ticketDetailModal) {
            ticketDetailModal.classList.add('d-none');
        }
    }

    if (historyButton) historyButton.addEventListener('click', mostrarModalHistorial);
    if (historyCloseBtn) historyCloseBtn.addEventListener('click', cerrarModalHistorial);
    if (historyCancelBtn) historyCancelBtn.addEventListener('click', cerrarModalHistorial);

    if (ticketDetailCloseBtn) ticketDetailCloseBtn.addEventListener('click', cerrarDetalleTicket);
    if (ticketDetailCancelBtn) ticketDetailCancelBtn.addEventListener('click', cerrarDetalleTicket);

    if (ticketDetailModal) {
        ticketDetailModal.addEventListener('click', (e) => {
            if (e.target === ticketDetailModal) cerrarDetalleTicket();
        });
    }

    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) cerrarModalHistorial();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (ticketDetailModal && !ticketDetailModal.classList.contains('d-none')) {
                cerrarDetalleTicket();
            } else if (historyModal && !historyModal.classList.contains('d-none')) {
                cerrarModalHistorial();
            } else if (paymentModal && !paymentModal.classList.contains('d-none')) {
                cerrarModalPago();
            }
        }
    });

    cargarProductos();
    actualizarNumeroTicket();
});