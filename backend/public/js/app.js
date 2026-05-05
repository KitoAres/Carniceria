/* =============================================
   CARNICERÍA CONTROL DE DEUDAS - app.js
   ============================================= */

// ── Estado global ────────────────────────────
const state = {
  clienteVenta: null,
  productoSel: null,
  detalleVenta: [],
  productos: []
};

// ── Helpers ──────────────────────────────────
const API = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts
  });
  if (res.status === 401) { mostrarLogin(); return null; }
  return res.json();
};

const fmt = n => 'Bs ' + parseFloat(n || 0).toFixed(2);

const fmtFecha = f => {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-BO', { day:'2-digit', month:'2-digit', year:'numeric' });
};

function toast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + tipo;
  setTimeout(() => t.className = '', 2500);
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
}

function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

// ── AUTH ─────────────────────────────────────
function mostrarLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function mostrarApp(nombre) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('userNameLabel').textContent = nombre;
}

async function doLogin() {
  const usuario  = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!usuario || !password) return;
  const data = await API('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password })
  });
  if (!data) return;
  if (data.ok) {
    mostrarApp(data.nombre);
    cargarDashboard();
  } else {
    document.getElementById('loginError').textContent = data.error || 'Error';
  }
}

async function doLogout() {
  await API('/api/auth/logout', { method: 'POST' });
  mostrarLogin();
}

document.getElementById('loginPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ── NAVEGACIÓN ───────────────────────────────
function navTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottomnav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');
  if (page === 'dashboard') cargarDashboard();
  if (page === 'clientes')  cargarClientes();
  if (page === 'deudas')    cargarDeudas();
  if (page === 'precios')   cargarPrecios();
  if (page === 'venta')     iniciarVenta();
}

// ── DASHBOARD ────────────────────────────────
async function cargarDashboard() {
  const data = await API('/api/dashboard');
  if (!data) return;
  document.getElementById('dash-stats').innerHTML = `
    <div class="dash-stat">
      <div class="num">${data.total_clientes}</div>
      <div class="lbl">👥 Clientes</div>
    </div>
    <div class="dash-stat">
      <div class="num">${data.deudas_pendientes}</div>
      <div class="lbl">📋 Deudas</div>
    </div>
    <div class="dash-stat naranja">
      <div class="num" style="font-size:20px">${fmt(data.monto_pendiente)}</div>
      <div class="lbl">💰 Por cobrar</div>
    </div>
    <div class="dash-stat azul">
      <div class="num">${data.ventas_hoy}</div>
      <div class="lbl">📅 Hoy</div>
    </div>
  `;
  const topEl = document.getElementById('top-deudores');
  if (!data.top_deudores.length) {
    topEl.innerHTML = '<div class="empty-state"><div class="emoji">🎉</div><p>Sin deudas pendientes</p></div>';
    return;
  }
  topEl.innerHTML = data.top_deudores.map(d => `
    <div class="top-deudor">
      <div>
        <div class="nombre">${d.nombre}</div>
      </div>
      <div class="monto">${fmt(d.deuda)}</div>
    </div>
  `).join('');
}

// ── CLIENTES ─────────────────────────────────
async function cargarClientes() {
  const q = document.getElementById('buscarCliente').value;
  const data = await API('/api/clientes' + (q ? '?q=' + encodeURIComponent(q) : ''));
  if (!data) return;
  const el = document.getElementById('listaClientes');
  if (!data.length) {
    el.innerHTML = '<div class="empty-state"><div class="emoji">👥</div><p>No se encontraron clientes</p></div>';
    return;
  }
  el.innerHTML = data.map(c => `
    <div class="list-item">
      <div class="info">
        <div class="nombre">${c.nombre}</div>
        <div class="sub">${c.telefono || 'Sin teléfono'} ${c.observacion ? '· ' + c.observacion : ''}</div>
      </div>
      <div class="${parseFloat(c.deuda_total) > 0 ? 'deuda' : 'deuda cero'}">${parseFloat(c.deuda_total) > 0 ? fmt(c.deuda_total) : '✓ Al día'}</div>
      <div class="acciones">
        <button class="btn btn-secondary btn-sm" onclick="editarCliente(${c.id})">✏️</button>
        <button class="btn btn-primary btn-sm" onclick="confirmarEliminar(${c.id},'${c.nombre.replace(/'/g,"\\'")}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function abrirModalCliente() {
  document.getElementById('clienteEditId').value = '';
  document.getElementById('clienteNombre').value = '';
  document.getElementById('clienteTelefono').value = '';
  document.getElementById('clienteObservacion').value = '';
  document.getElementById('modalClienteTitulo').textContent = 'Nuevo Cliente';
  abrirModal('modal-cliente');
}

async function editarCliente(id) {
  const data = await API('/api/clientes/' + id);
  if (!data) return;
  document.getElementById('clienteEditId').value = data.id;
  document.getElementById('clienteNombre').value = data.nombre;
  document.getElementById('clienteTelefono').value = data.telefono || '';
  document.getElementById('clienteObservacion').value = data.observacion || '';
  document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
  abrirModal('modal-cliente');
}

async function guardarCliente() {
  const id = document.getElementById('clienteEditId').value;
  const nombre = document.getElementById('clienteNombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio', 'rojo'); return; }
  const body = {
    nombre,
    telefono:    document.getElementById('clienteTelefono').value.trim(),
    observacion: document.getElementById('clienteObservacion').value.trim()
  };
  const url    = id ? '/api/clientes/' + id : '/api/clientes';
  const method = id ? 'PUT' : 'POST';
  const data   = await API(url, { method, body: JSON.stringify(body) });
  if (data && data.ok) {
    cerrarModal('modal-cliente');
    toast(id ? 'Cliente actualizado ✓' : 'Cliente agregado ✓', 'verde');
    cargarClientes();
  } else {
    toast('Error al guardar', 'rojo');
  }
}

async function confirmarEliminar(id, nombre) {
  if (!confirm(`¿Eliminar a "${nombre}"?\nSe eliminarán todas sus deudas.`)) return;
  const data = await API('/api/clientes/' + id, { method: 'DELETE' });
  if (data && data.ok) { toast('Cliente eliminado', 'rojo'); cargarClientes(); }
}

// ── NUEVA VENTA ──────────────────────────────
async function iniciarVenta() {
  state.clienteVenta = null;
  state.productoSel  = null;
  state.detalleVenta = [];
  document.getElementById('venta-paso1').style.display = '';
  document.getElementById('venta-paso2').style.display = 'none';
  document.getElementById('buscarClienteVenta').value = '';
  document.getElementById('listaClientesVenta').innerHTML = '';
  // Cargar productos en cache
  const prods = await API('/api/productos');
  if (prods) state.productos = prods;
}

async function buscarClienteParaVenta() {
  const q = document.getElementById('buscarClienteVenta').value.trim();
  if (!q) { document.getElementById('listaClientesVenta').innerHTML = ''; return; }
  const data = await API('/api/clientes?q=' + encodeURIComponent(q));
  if (!data) return;
  const el = document.getElementById('listaClientesVenta');
  if (!data.length) { el.innerHTML = '<div class="text-muted text-center" style="padding:16px">No encontrado</div>'; return; }
  el.innerHTML = data.map(c => `
    <div class="cliente-sel-item" onclick="seleccionarClienteVenta(${c.id},'${c.nombre.replace(/'/g,"\\'")}')">
      <div class="nombre">${c.nombre}</div>
      <div class="deuda">${parseFloat(c.deuda_total) > 0 ? 'Debe: ' + fmt(c.deuda_total) : '✓ Sin deuda'}</div>
    </div>
  `).join('');
}

function seleccionarClienteVenta(id, nombre) {
  state.clienteVenta = { id, nombre };
  document.getElementById('venta-paso1').style.display = 'none';
  document.getElementById('venta-paso2').style.display = '';
  document.getElementById('venta-cliente-nombre').textContent = nombre;
  renderBotonesProductos();
  renderDetalleVenta();
}

function cambiarCliente() {
  state.clienteVenta = null;
  state.detalleVenta = [];
  state.productoSel  = null;
  document.getElementById('venta-paso1').style.display = '';
  document.getElementById('venta-paso2').style.display = 'none';
}

const ICONOS_PROD = { 'Paletilla': '🦴', 'Hueso Rojo': '🩸', 'Pulpa': '🥩', 'Pecho': '🫀', 'Molida': '🔴' };

function renderBotonesProductos() {
  const el = document.getElementById('botonesProductos');
  el.innerHTML = state.productos.map(p => `
    <div class="btn-producto ${state.productoSel && state.productoSel.id === p.id ? 'selected' : ''}"
         onclick="seleccionarProducto(${p.id})">
      <div class="p-icon">${ICONOS_PROD[p.nombre] || '🥩'}</div>
      <div class="p-nombre">${p.nombre}</div>
      <div class="p-precio">${fmt(p.precio_kilo)}/kg</div>
    </div>
  `).join('');
}

function seleccionarProducto(id) {
  state.productoSel = state.productos.find(p => p.id === id);
  document.getElementById('inputKilos').value = '';
  document.getElementById('preview-subtotal').textContent = '';
  document.getElementById('form-producto-sel').style.display = '';
  renderBotonesProductos();
  document.getElementById('inputKilos').focus();
}

function calcSubtotal() {
  if (!state.productoSel) return;
  const kilos = parseFloat(document.getElementById('inputKilos').value);
  if (!kilos || kilos <= 0) { document.getElementById('preview-subtotal').textContent = ''; return; }
  const sub = kilos * state.productoSel.precio_kilo;
  document.getElementById('preview-subtotal').textContent =
    `${kilos} kg × ${fmt(state.productoSel.precio_kilo)} = ${fmt(sub)}`;
}

function agregarProductoVenta() {
  if (!state.productoSel) { toast('Selecciona un producto', 'rojo'); return; }
  const kilos = parseFloat(document.getElementById('inputKilos').value);
  if (!kilos || kilos <= 0) { toast('Ingresa los kilos', 'rojo'); return; }
  const subtotal = +(kilos * state.productoSel.precio_kilo).toFixed(2);
  state.detalleVenta.push({
    producto:   state.productoSel.nombre,
    kilos,
    precio_kilo: state.productoSel.precio_kilo,
    subtotal
  });
  state.productoSel = null;
  document.getElementById('form-producto-sel').style.display = 'none';
  renderBotonesProductos();
  renderDetalleVenta();
  toast('Producto agregado ✓', 'verde');
}

function quitarItemVenta(idx) {
  state.detalleVenta.splice(idx, 1);
  renderDetalleVenta();
}

function renderDetalleVenta() {
  const el    = document.getElementById('detalle-venta-tabla');
  const total = state.detalleVenta.reduce((s, i) => s + i.subtotal, 0);
  if (!state.detalleVenta.length) {
    el.innerHTML = '<div class="text-muted text-center" style="padding:16px">Agrega productos usando los botones de arriba</div>';
    document.getElementById('totalVentaDisplay').style.display = 'none';
    document.getElementById('btnGuardarVenta').style.display = 'none';
    return;
  }
  el.innerHTML = `
    <table class="detalle-table">
      <thead><tr><th>Producto</th><th>Kg</th><th>Precio</th><th>Sub</th><th></th></tr></thead>
      <tbody>
        ${state.detalleVenta.map((i,idx) => `
          <tr>
            <td>${ICONOS_PROD[i.producto]||'🥩'} ${i.producto}</td>
            <td>${i.kilos}</td>
            <td>${fmt(i.precio_kilo)}</td>
            <td>${fmt(i.subtotal)}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="quitarItemVenta(${idx})">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('totalVentaDisplay').style.display = '';
  document.getElementById('totalVentaMonto').textContent = fmt(total);
  document.getElementById('btnGuardarVenta').style.display = '';
}

async function guardarVenta() {
  if (!state.clienteVenta || !state.detalleVenta.length) return;
  const total = state.detalleVenta.reduce((s, i) => s + i.subtotal, 0);
  const now   = new Date();
  const fecha = now.toISOString().split('T')[0];
  const hora  = now.toTimeString().split(' ')[0];
  const body  = {
    cliente_id:  state.clienteVenta.id,
    fecha, hora,
    total: total.toFixed(2),
    observacion: document.getElementById('ventaObservacion').value.trim(),
    detalle: state.detalleVenta
  };
  const data = await API('/api/ventas', { method: 'POST', body: JSON.stringify(body) });
  if (data && data.ok) {
    toast('Venta guardada ✓', 'verde');
    state.detalleVenta = [];
    state.clienteVenta = null;
    document.getElementById('ventaObservacion').value = '';
    navTo('deudas');
  } else {
    toast('Error al guardar', 'rojo');
  }
}

// ── DEUDAS ───────────────────────────────────
async function cargarDeudas() {
  const q       = document.getElementById('buscarDeuda').value.trim();
  const estado  = document.getElementById('filtroEstado').value;
  let url = '/api/ventas?';
  if (estado) url += 'estado=' + estado + '&';
  const ventas = await API(url);
  if (!ventas) return;
  // Filtrar por nombre si hay búsqueda
  let lista = ventas;
  if (q) lista = ventas.filter(v => v.cliente_nombre.toLowerCase().includes(q.toLowerCase()));
  const el = document.getElementById('listaDeudas');
  if (!lista.length) {
    el.innerHTML = '<div class="empty-state"><div class="emoji">🎉</div><p>No hay deudas con esos filtros</p></div>';
    return;
  }
  el.innerHTML = lista.map(v => {
    const badge = `<span class="badge badge-${v.estado}">${v.estado}</span>`;
    return `
      <div class="deuda-card">
        <div class="deuda-card-head">
          <div>
            <div class="dc-nombre">👤 ${v.cliente_nombre}</div>
            <div class="dc-fecha">📅 ${fmtFecha(v.fecha)} ${v.hora ? '· ' + v.hora.substring(0,5) : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${badge}
            <div class="deuda-saldo">${fmt(v.total)}</div>
          </div>
        </div>
        <div class="deuda-card-body">
          <div class="deuda-acciones">
            <button class="btn btn-info btn-sm" onclick="verDeuda(${v.id})">🔍 Ver detalle</button>
            ${v.estado !== 'pagado' ? `<button class="btn btn-success btn-sm" onclick="abrirPago(${v.id},${v.total},'${v.cliente_nombre.replace(/'/g,"\\'")}')" >💵 Pago</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="copiarMensaje(${v.id})">📋 Copiar msg</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function verDeuda(id) {
  const data = await API('/api/ventas/' + id);
  if (!data) return;
  const pagosTxt = data.pagos.length ? `
    <hr class="divider">
    <div class="card-title" style="font-size:14px;margin-top:0">💳 Historial de pagos</div>
    ${data.pagos.map(p => `
      <div class="pago-item">
        <span>${new Date(p.fecha).toLocaleDateString('es-BO')} ${new Date(p.fecha).toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'})}</span>
        <span style="font-weight:700;color:var(--verde)">${fmt(p.monto)}</span>
      </div>
    `).join('')}
  ` : '';
  document.getElementById('modal-deuda-content').innerHTML = `
    <div style="margin-bottom:10px">
      <strong>👤 ${data.cliente_nombre}</strong>
      <span class="badge badge-${data.estado}" style="margin-left:8px">${data.estado}</span>
    </div>
    <div class="text-muted" style="margin-bottom:12px">📅 ${fmtFecha(data.fecha)} · ${data.hora ? data.hora.substring(0,5) : ''}</div>
    <table class="detalle-table" style="margin-bottom:12px">
      <thead><tr><th>Producto</th><th>Kg</th><th>Precio/kg</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${data.detalle.map(d => `
          <tr>
            <td>${ICONOS_PROD[d.producto]||'🥩'} ${d.producto}</td>
            <td>${d.kilos}</td>
            <td>${fmt(d.precio_kilo)}</td>
            <td>${fmt(d.subtotal)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3"><strong>TOTAL</strong></td>
          <td><strong>${fmt(data.total)}</strong></td>
        </tr>
        ${data.pagos.length ? `<tr><td colspan="3" style="color:var(--verde)">Pagado</td><td style="color:var(--verde)">${fmt(data.total_pagado)}</td></tr>
        <tr><td colspan="3" style="color:var(--rojo)"><strong>Saldo pendiente</strong></td><td style="color:var(--rojo)"><strong>${fmt(data.saldo)}</strong></td></tr>` : ''}
      </tbody>
    </table>
    ${data.observacion ? `<div class="text-muted" style="margin-bottom:10px">📝 ${data.observacion}</div>` : ''}
    ${pagosTxt}
    <div class="flex-row mt-8">
      ${data.estado !== 'pagado' ? `<button class="btn btn-success btn-sm" onclick="cerrarModal('modal-deuda');abrirPago(${data.id},${data.saldo||data.total},'${data.cliente_nombre.replace(/'/g,"\\'")}')" >💵 Pagar</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="copiarMensaje(${data.id})">📋 Copiar mensaje</button>
    </div>
  `;
  abrirModal('modal-deuda');
}

function abrirPago(ventaId, totalPendiente, nombre) {
  document.getElementById('pagoVentaId').value = ventaId;
  document.getElementById('pagoMonto').value = parseFloat(totalPendiente).toFixed(2);
  document.getElementById('pagoObservacion').value = '';
  document.getElementById('modal-pago-titulo').textContent = `Pago - ${nombre}`;
  abrirModal('modal-pago');
}

async function confirmarPago() {
  const ventaId = document.getElementById('pagoVentaId').value;
  const monto   = document.getElementById('pagoMonto').value;
  const obs     = document.getElementById('pagoObservacion').value;
  if (!monto || parseFloat(monto) <= 0) { toast('Ingresa un monto válido', 'rojo'); return; }
  const data = await API('/api/ventas/' + ventaId + '/pago', {
    method: 'POST',
    body: JSON.stringify({ monto, observacion: obs })
  });
  if (data && data.ok) {
    cerrarModal('modal-pago');
    toast('Pago registrado ✓', 'verde');
    cargarDeudas();
  } else {
    toast('Error al registrar pago', 'rojo');
  }
}

async function copiarMensaje(id) {
  const data = await API('/api/ventas/' + id);
  if (!data) return;
  const detalleTxt = data.detalle.map(d =>
    `- ${d.producto}: ${d.kilos} kg x Bs ${parseFloat(d.precio_kilo).toFixed(2)} = Bs ${parseFloat(d.subtotal).toFixed(2)}`
  ).join('\n');
  const saldo = data.saldo !== undefined ? data.saldo : data.total;
  const msg =
`Hola, ${data.cliente_nombre}.
Tu deuda pendiente es de Bs ${parseFloat(saldo).toFixed(2)}.
Fecha: ${fmtFecha(data.fecha)} a horas ${data.hora ? data.hora.substring(0,5) : ''}.

Detalle:
${detalleTxt}

Total pendiente: Bs ${parseFloat(saldo).toFixed(2)}.
Gracias.`;
  try {
    await navigator.clipboard.writeText(msg);
    toast('Mensaje copiado al portapapeles ✓', 'verde');
  } catch {
    prompt('Copia este mensaje:', msg);
  }
}

// ── PRECIOS ──────────────────────────────────
let productosPrecios = [];

async function cargarPrecios() {
  const data = await API('/api/productos?todos=1');
  if (!data) return;
  productosPrecios = data;
  const el = document.getElementById('listaPrecios');
  el.innerHTML = data.map(p => `
    <div class="precio-item">
      <div class="p-icono">${ICONOS_PROD[p.nombre]||'🥩'}</div>
      <div class="p-info">
        <div class="nombre">${p.nombre}</div>
        <div class="estado">${p.activo ? '✅ Activo' : '❌ Inactivo'}</div>
      </div>
      <input type="number" step="0.50" min="0" value="${parseFloat(p.precio_kilo).toFixed(2)}"
             id="precio-${p.id}" style="width:90px">
      <button class="toggle ${p.activo ? 'activo' : ''}" id="toggle-${p.id}"
              onclick="toggleProducto(${p.id})" title="${p.activo ? 'Desactivar' : 'Activar'}">
        ${p.activo ? '✅' : '❌'}
      </button>
    </div>
  `).join('');
}

function toggleProducto(id) {
  const p = productosPrecios.find(x => x.id === id);
  if (!p) return;
  p.activo = p.activo ? 0 : 1;
  const btn = document.getElementById('toggle-' + id);
  const inf = btn.previousElementSibling.querySelector('.estado');
  if (p.activo) {
    btn.textContent = '✅'; btn.classList.add('activo');
    if (inf) inf.textContent = '✅ Activo';
  } else {
    btn.textContent = '❌'; btn.classList.remove('activo');
    if (inf) inf.textContent = '❌ Inactivo';
  }
}

async function guardarPrecios() {
  const promesas = productosPrecios.map(p => {
    const inputEl = document.getElementById('precio-' + p.id);
    const precio  = inputEl ? parseFloat(inputEl.value) : p.precio_kilo;
    return API('/api/productos/' + p.id, {
      method: 'PUT',
      body: JSON.stringify({ nombre: p.nombre, precio_kilo: precio, activo: p.activo })
    });
  });
  await Promise.all(promesas);
  toast('Precios actualizados ✓', 'verde');
  cargarPrecios();
}

// ── BÚSQUEDA CLIENTES EN VENTA ────────────────
// (buscar también al cargar la página de venta)
async function buscarClienteVentaInit() {
  const prods = await API('/api/productos');
  if (prods) state.productos = prods;
}

// ── INICIO ───────────────────────────────────
(async () => {
  const data = await API('/api/auth/me');
  if (data && data.ok) {
    mostrarApp(data.nombre);
    cargarDashboard();
  } else {
    mostrarLogin();
  }
})();
