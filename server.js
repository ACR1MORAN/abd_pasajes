const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));

// Usar DATABASE_URL si existe (para Render.com), sino usar variables individuales
const dbConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necesario para Render.com
  }
  : {
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "12345",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "pasajes_db"
  };

const pool = new Pool(dbConfig);

async function withConn(fn) {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    const result = await fn(conn);
    await conn.query("COMMIT");
    return result;
  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    conn.release();
  }
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function layout({ title, body, alert }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      background-color: #f8f9fa;
      font-family: 'Roboto', sans-serif;
    }
    .navbar {
      background-color: #007bff;
      color: #fff;
      padding: 10px 20px;
    }
    .navbar .navbar-brand {
      font-weight: bold;
      color: #fff;
    }
    .navbar .btn {
      color: #fff;
      background-color: #0056b3;
      border-color: #0056b3;
      margin-left: 10px;
    }
    .navbar .btn:hover {
      background-color: #004494;
      border-color: #004494;
    }
    .glass {
      background-color: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .glass h1, .glass h2, .glass h3, .glass h4, .glass h5, .glass h6 {
      color: #212529 !important;
      font-weight: bold;
    }
    .glass .muted, .glass .text-muted {
      color: #6c757d !important;
    }
    .glass label {
      color: #495057 !important;
      font-weight: 500;
    }
    .table {
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
    }
    .table th {
      background-color: #007bff;
      color: #fff;
      border-color: #dee2e6;
    }
    .table td {
      border-color: #dee2e6;
      background-color: #fff;
      color: #212529;
    }
    .table .empty-row {
      background-color: #f8f9fa;
      color: #6c757d;
      text-align: center;
    }
    .badge-soft {
      background-color: #e7f3ff;
      color: #0056b3;
      border: 1px solid #b3d7ff;
      padding: 0.35em 0.65em;
      border-radius: 0.25rem;
      font-weight: 500;
    }
    .btn-primary {
      background-color: #007bff;
      border-color: #007bff;
    }
    .btn-primary:hover {
      background-color: #0056b3;
      border-color: #0056b3;
    }
    .btn-danger {
      background-color: #dc3545;
      border-color: #dc3545;
    }
    .btn-danger:hover {
      background-color: #c82333;
      border-color: #c82333;
    }
    .btn-outline-light {
      border-color: #fff;
      color: #fff;
    }
    .btn-outline-light:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: #fff;
      color: #fff;
    }
    .btn-outline-secondary {
      border-color: #6c757d;
      color: #6c757d;
    }
    .btn-outline-secondary:hover {
      background-color: #6c757d;
      border-color: #6c757d;
      color: #fff;
    }
    .alert {
      border-radius: 8px;
      padding: 10px 15px;
      margin-bottom: 20px;
    }
    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }
    .form-control, .form-select {
      border-radius: 4px;
      border: 1px solid #ced4da;
      padding: 10px;
      background-color: #fff;
      color: #495057;
    }
    .form-control:focus, .form-select:focus {
      border-color: #80bdff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    .form-text {
      color: #6c757d !important;
      font-size: 0.875rem;
    }
    .note-footer {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
      color: #856404;
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <a class="navbar-brand fw-bold" href="/pasajes">🚌 Pasajes Ibarra</a>
      <div class="d-flex gap-2">
        <a class="btn btn-outline-light btn-sm" href="/pasajes">Listado</a>
        <a class="btn btn-outline-light btn-sm" href="/pasajes/historial">📊 Historial</a>
        <a class="btn btn-primary btn-sm" href="/pasajes/new">+ Nuevo pasaje</a>
      </div>
    </div>
  </nav>

  <main class="container my-4">
    ${alert ? `<div class="alert alert-${esc(alert.type)}">${esc(alert.msg)}</div>` : ""}
    <div class="glass rounded-4 p-4 shadow-sm">
      ${body}
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function nowDefaults() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${mi}:${ss}` };
}

app.get("/", (req, res) => res.redirect("/pasajes"));

// ========================
// LISTAR + FILTRO
// ========================
app.get("/pasajes", async (req, res) => {
  const rutaFiltro = (req.query.ruta || "").trim();
  const msg = req.query.msg ? String(req.query.msg) : "";

  try {
    const { rutas, pasajes } = await withConn(async (conn) => {
      const rutasR = await conn.query(
        `SELECT id_ruta, nombre FROM rutas ORDER BY nombre`
      );

      let pasajesR;
      if (rutaFiltro) {
        pasajesR = await conn.query(
          `SELECT p.id_pasaje,
                   r.nombre AS ruta,
                   u.placa AS unidad,
                   t.nombre AS tipo_pasaje,
                   p.valor,
                   TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD') AS fecha,
                   TO_CHAR(p.fecha_viaje, 'HH24:MI:SS') AS hora
            FROM pasajes p
            JOIN rutas r ON p.id_ruta = r.id_ruta
            JOIN unidades u ON p.id_unidad = u.id_unidad
            JOIN tipos_pasaje t ON p.id_tipo = t.id_tipo
            WHERE r.nombre = $1
            ORDER BY p.fecha_viaje DESC`,
          [rutaFiltro]
        );
      } else {
        pasajesR = await conn.query(
          `SELECT p.id_pasaje,
                   r.nombre AS ruta,
                   u.placa AS unidad,
                   t.nombre AS tipo_pasaje,
                   p.valor,
                   TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD') AS fecha,
                   TO_CHAR(p.fecha_viaje, 'HH24:MI:SS') AS hora
            FROM pasajes p
            JOIN rutas r ON p.id_ruta = r.id_ruta
            JOIN unidades u ON p.id_unidad = u.id_unidad
            JOIN tipos_pasaje t ON p.id_tipo = t.id_tipo
            ORDER BY p.fecha_viaje DESC`
        );
      }

      return { rutas: rutasR.rows, pasajes: pasajesR.rows };
    });

    const body = `
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h4 mb-1">Listado de pasajes</h1>
          <div class="muted">Steven Moran</div>
        </div>
        <div class="d-flex gap-2">
          <form method="POST" action="/exportar">
            <button class="btn btn-success">📤 Exportar CSV</button>
          </form>
          <a class="btn btn-primary" href="/pasajes/new">+ Nuevo pasaje</a>
        </div>
      </div>

      <hr class="my-4">

      <h5 class="mb-3">🔍 Filtrar resultados</h5>
      <form class="row g-2 align-items-end mb-4" method="GET" action="/pasajes">
        <div class="col-12 col-md-8">
          <label class="form-label">Filtrar por Ruta</label>
          <select class="form-select" name="ruta">
            <option value="">Todas las rutas</option>
            ${rutas
        .map(
          (r) =>
            `<option value="${esc(r.nombre)}" ${rutaFiltro === r.nombre ? "selected" : ""
            }>${esc(r.nombre)}</option>`
        )
        .join("")}
          </select>
        </div>
        <div class="col-12 col-md-4 d-flex gap-2">
          <button class="btn btn-primary flex-fill">Aplicar Filtro</button>
          <a class="btn btn-outline-secondary" href="/pasajes">Limpiar</a>
        </div>
      </form>

      <hr class="my-4">

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">📋 Registros encontrados</h5>
        <span class="badge bg-primary">${pasajes.length} pasaje${pasajes.length !== 1 ? 's' : ''}</span>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ruta</th>
              <th>Unidad (Placa)</th>
              <th>Tipo</th>
              <th class="text-end">Valor</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${pasajes.length
        ? pasajes
          .map(
            (p) => `
              <tr>
                <td><span class="badge-soft">#${esc(p.id_pasaje)}</span></td>
                <td><strong>${esc(p.ruta)}</strong></td>
                <td>${esc(p.unidad)}</td>
                <td>${esc(p.tipo_pasaje)}</td>
                <td class="text-end"><strong>$${parseFloat(p.valor).toFixed(2)}</strong></td>
                <td>${esc(p.fecha)}</td>
                <td>${esc(p.hora)}</td>
                <td class="text-end">
                  <a class="btn btn-sm btn-outline-primary" href="/pasajes/${esc(
              p.id_pasaje
            )}/edit">✏️ Editar</a>
                  <form class="d-inline" method="POST" action="/pasajes/${esc(
              p.id_pasaje
            )}/delete"
                        onsubmit="return confirm('¿Eliminar el pasaje #${esc(
              p.id_pasaje
            )}?');">
                    <button class="btn btn-sm btn-outline-danger">🗑️ Eliminar</button>
                  </form>
                </td>
              </tr>
              `
          )
          .join("")
        : `<tr><td colspan="8" class="text-center py-5 empty-row">
                    <div class="py-3">
                      <h5>📭 No hay pasajes registrados</h5>
                      <p class="text-muted mb-3">
                        ${rutaFiltro
          ? `No se encontraron pasajes para la ruta "${esc(rutaFiltro)}"`
          : 'Comienza agregando tu primer pasaje'}
                      </p>
                      <a class="btn btn-primary" href="/pasajes/new">+ Crear primer pasaje</a>
                    </div>
                  </td></tr>`
      }
          </tbody>
        </table>
      </div>
    `;

    res.send(
      layout({
        title: "Pasajes",
        body,
        alert: msg ? { type: "success", msg } : null,
      })
    );
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error del sistema</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// HISTORIAL COMPLETO
// ========================
app.get("/pasajes/historial", async (req, res) => {
  try {
    const historial = await withConn(async (conn) => {
      const result = await conn.query(
        `SELECT r.nombre AS ruta,
                COUNT(p.id_pasaje) AS total_pasajes,
                SUM(p.valor) AS ingresos_totales,
                AVG(p.valor) AS promedio_valor,
                MIN(TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD HH24:MI:SS')) AS primer_pasaje,
                MAX(TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD HH24:MI:SS')) AS ultimo_pasaje
         FROM rutas r
         LEFT JOIN pasajes p ON r.id_ruta = p.id_ruta
         GROUP BY r.id_ruta, r.nombre
         ORDER BY COUNT(p.id_pasaje) DESC, r.nombre ASC`
      );

      const detalle = await conn.query(
        `SELECT p.id_pasaje,
                r.nombre AS ruta,
                u.placa AS unidad,
                t.nombre AS tipo_pasaje,
                p.valor,
                TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(p.fecha_viaje, 'HH24:MI:SS') AS hora
         FROM pasajes p
         JOIN rutas r ON p.id_ruta = r.id_ruta
         JOIN unidades u ON p.id_unidad = u.id_unidad
         JOIN tipos_pasaje t ON p.id_tipo = t.id_tipo
         ORDER BY p.fecha_viaje DESC`
      );

      return { resumen: result.rows, detalles: detalle.rows };
    });

    const totalPasajes = historial.detalles.length;
    const totalIngresos = historial.detalles.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
    const promedioGlobal = totalPasajes > 0 ? (totalIngresos / totalPasajes) : 0;

    const body = `
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">📊 Registro Histórico de Pasajes</h1>
          <div class="muted">Estadísticas completas por ruta y detalle de todos los pasajes registrados</div>
        </div>
        <div class="d-flex gap-2">
          <a class="btn btn-outline-secondary" href="/pasajes">← Volver al listado</a>
          <a class="btn btn-primary" href="/pasajes/new">+ Nuevo pasaje</a>
        </div>
      </div>

      <hr class="my-4">

      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="glass bg-light p-3 rounded">
            <div class="text-muted small">Total de Pasajes</div>
            <div class="h3 mb-0" style="color: #007bff;"><strong>${totalPasajes}</strong></div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="glass bg-light p-3 rounded">
            <div class="text-muted small">Ingresos Totales</div>
            <div class="h3 mb-0" style="color: #28a745;"><strong>$${totalIngresos.toFixed(2)}</strong></div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="glass bg-light p-3 rounded">
            <div class="text-muted small">Promedio por Pasaje</div>
            <div class="h3 mb-0" style="color: #17a2b8;"><strong>$${promedioGlobal.toFixed(2)}</strong></div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="glass bg-light p-3 rounded">
            <div class="text-muted small">Rutas Activas</div>
            <div class="h3 mb-0" style="color: #ffc107;"><strong>${historial.resumen.filter(r => r.total_pasajes > 0).length}</strong></div>
          </div>
        </div>
      </div>

      <hr class="my-4">

      <h5 class="mb-3">📍 Estadísticas por Ruta</h5>
      <div class="table-responsive mb-4">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Ruta</th>
              <th class="text-center">Pasajes</th>
              <th class="text-end">Ingresos</th>
              <th class="text-end">Promedio</th>
              <th>Primer Pasaje</th>
              <th>Último Pasaje</th>
            </tr>
          </thead>
          <tbody>
            ${historial.resumen.map(r => `
              <tr>
                <td><strong>${esc(r.ruta)}</strong></td>
                <td class="text-center">
                  <span class="badge bg-primary">${r.total_pasajes || 0}</span>
                </td>
                <td class="text-end">
                  <span style="color: #28a745;"><strong>$${(r.ingresos_totales ? parseFloat(r.ingresos_totales).toFixed(2) : '0.00')}</strong></span>
                </td>
                <td class="text-end">
                  <span style="color: #17a2b8;">$${(r.promedio_valor ? parseFloat(r.promedio_valor).toFixed(2) : '0.00')}</span>
                </td>
                <td><small class="text-muted">${r.primer_pasaje ? r.primer_pasaje.substring(0, 16) : '—'}</small></td>
                <td><small class="text-muted">${r.ultimo_pasaje ? r.ultimo_pasaje.substring(0, 16) : '—'}</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <hr class="my-4">

      <h5 class="mb-3">📋 Detalle Completo de Pasajes (${totalPasajes} registros)</h5>
      <div class="table-responsive">
        <table class="table table-hover align-middle table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ruta</th>
              <th>Unidad</th>
              <th>Tipo</th>
              <th class="text-end">Valor</th>
              <th>Fecha y Hora</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${historial.detalles.length
        ? historial.detalles.map(p => `
              <tr>
                <td><span class="badge-soft">#${esc(p.id_pasaje)}</span></td>
                <td><strong>${esc(p.ruta)}</strong></td>
                <td>${esc(p.unidad)}</td>
                <td>${esc(p.tipo_pasaje)}</td>
                <td class="text-end"><strong>$${parseFloat(p.valor).toFixed(2)}</strong></td>
                <td><small>${esc(p.fecha)} ${esc(p.hora)}</small></td>
                <td class="text-end">
                  <a class="btn btn-sm btn-outline-primary" href="/pasajes/${esc(p.id_pasaje)}/edit">✏️ Editar</a>
                  <form class="d-inline" method="POST" action="/pasajes/${esc(p.id_pasaje)}/delete"
                        onsubmit="return confirm('¿Eliminar el pasaje #${esc(p.id_pasaje)}?');">
                    <button class="btn btn-sm btn-outline-danger">🗑️ Eliminar</button>
                  </form>
                </td>
              </tr>
              `).join('')
        : `<tr><td colspan="7" class="text-center py-5 empty-row">
                    <div class="py-3">
                      <h5>📭 No hay pasajes registrados</h5>
                      <p class="text-muted mb-3">Comienza agregando tu primer pasaje</p>
                      <a class="btn btn-primary" href="/pasajes/new">+ Crear primer pasaje</a>
                    </div>
                  </td></tr>`
      }
          </tbody>
        </table>
      </div>

      <div class="mt-4">
        <a class="btn btn-outline-secondary" href="/pasajes">← Volver al listado</a>
      </div>
    `;

    res.send(layout({ title: "Historial de Pasajes", body }));
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error al cargar el historial</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// NUEVO PASAJE (FORM)
// ========================
app.get("/pasajes/new", (req, res) => {
  const { fecha, hora } = nowDefaults();

  const body = `
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
      <div>
        <h1 class="h4 mb-1">Crear nuevo pasaje</h1>
        <div class="muted">Escribe los datos. Si no existen en catálogos, se crean automáticamente.</div>
      </div>
      <a class="btn btn-outline-secondary" href="/pasajes">← Volver</a>
    </div>

    <hr class="my-4">

    <form class="row g-3" method="POST" action="/pasajes">
      <div class="col-12">
        <h5>📝 Información del viaje</h5>
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Ruta (nombre)</label>
        <input class="form-control" name="ruta_nombre" placeholder="Ruta Norte" required />
        <div class="form-text">Ej: Ruta Norte, Ruta Sur, Ruta Centro...</div>
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Unidad (placa)</label>
        <input class="form-control" name="unidad_placa" placeholder="ABC-123" required style="text-transform: uppercase;" />
        <div class="form-text">Ej: ABC-123, XYZ-789...</div>
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Tipo de pasaje</label>
        <input class="form-control" name="tipo_nombre" placeholder="Normal" required />
        <div class="form-text">Ej: Normal, Estudiantil, Tercera Edad...</div>
      </div>

      <div class="col-12">
        <h5 class="mt-3">💰 Detalles del cobro</h5>
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Valor</label>
        <div class="input-group">
          <span class="input-group-text">$</span>
          <input class="form-control" type="number" step="0.01" min="0.01" name="valor" placeholder="0.75" required />
        </div>
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Fecha</label>
        <input class="form-control" type="date" name="fecha" value="${esc(fecha)}" required />
      </div>

      <div class="col-12 col-md-4">
        <label class="form-label">Hora</label>
        <input class="form-control" type="time" step="1" name="hora" value="${esc(hora)}" required />
      </div>

      <div class="col-12">
        <hr class="my-3">
        <div class="d-flex gap-2 justify-content-end">
          <a class="btn btn-outline-secondary" href="/pasajes">Cancelar</a>
          <button class="btn btn-primary">💾 Guardar pasaje</button>
        </div>
      </div>
    </form>
  `;

  res.send(layout({ title: "Nuevo pasaje", body }));
});

// ========================
// CREATE (INSERT)
// ========================
app.post("/pasajes", async (req, res) => {
  const ruta_nombre = (req.body.ruta_nombre || "").trim();
  const unidad_placa = (req.body.unidad_placa || "").trim().toUpperCase();
  const tipo_nombre = (req.body.tipo_nombre || "").trim();
  const valor = parseFloat(req.body.valor);
  const fecha = (req.body.fecha || "").trim();
  const hora = (req.body.hora || "").trim();

  if (!ruta_nombre || !unidad_placa || !tipo_nombre || !Number.isFinite(valor) || valor <= 0 || !fecha || !hora) {
    return res.status(400).send(layout({
      title: "Error",
      body: `<div class="alert alert-danger">
        <h4>❌ Datos inválidos</h4>
        <p>Por favor verifica que todos los campos estén completos y el valor sea mayor a 0.</p>
        <a class="btn btn-outline-danger" href="/pasajes/new">← Volver al formulario</a>
      </div>`
    }));
  }

  try {
    await withConn(async (conn) => {
      // RUTA: buscar o crear
      let r = await conn.query(
        `SELECT id_ruta FROM rutas WHERE nombre = $1`,
        [ruta_nombre]
      );
      if (r.rows.length === 0) {
        await conn.query(`INSERT INTO rutas (nombre) VALUES ($1)`, [ruta_nombre]);
        r = await conn.query(`SELECT id_ruta FROM rutas WHERE nombre = $1`, [ruta_nombre]);
      }
      const id_ruta = r.rows[0].id_ruta;

      // UNIDAD: buscar o crear
      let u = await conn.query(
        `SELECT id_unidad FROM unidades WHERE placa = $1`,
        [unidad_placa]
      );
      if (u.rows.length === 0) {
        await conn.query(`INSERT INTO unidades (placa) VALUES ($1)`, [unidad_placa]);
        u = await conn.query(`SELECT id_unidad FROM unidades WHERE placa = $1`, [unidad_placa]);
      }
      const id_unidad = u.rows[0].id_unidad;

      // TIPO: buscar o crear
      let t = await conn.query(
        `SELECT id_tipo FROM tipos_pasaje WHERE nombre = $1`,
        [tipo_nombre]
      );
      if (t.rows.length === 0) {
        await conn.query(`INSERT INTO tipos_pasaje (nombre) VALUES ($1)`, [tipo_nombre]);
        t = await conn.query(`SELECT id_tipo FROM tipos_pasaje WHERE nombre = $1`, [tipo_nombre]);
      }
      const id_tipo = t.rows[0].id_tipo;

      // INSERT PASAJE
      await conn.query(
        `INSERT INTO pasajes (id_ruta, id_unidad, id_tipo, valor, fecha_viaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_ruta, id_unidad, id_tipo, valor, `${fecha} ${hora}`]
      );
    });

    res.redirect("/pasajes?msg=" + encodeURIComponent("✅ Pasaje creado correctamente"));
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error al guardar</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// EDITAR (FORM)
// ========================
app.get("/pasajes/:id/edit", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).send("ID inválido.");

  try {
    const { pasaje, rutas, unidades, tipos } = await withConn(async (conn) => {
      const pR = await conn.query(
        `SELECT p.id_pasaje, p.id_ruta, p.id_unidad, p.id_tipo, p.valor,
                TO_CHAR(p.fecha_viaje, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(p.fecha_viaje, 'HH24:MI:SS') AS hora
         FROM pasajes p
         WHERE p.id_pasaje = $1`,
        [id]
      );

      const rutasR = await conn.query(
        `SELECT id_ruta, nombre FROM rutas ORDER BY nombre`
      );
      const unidadesR = await conn.query(
        `SELECT id_unidad, placa FROM unidades ORDER BY placa`
      );
      const tiposR = await conn.query(
        `SELECT id_tipo, nombre FROM tipos_pasaje ORDER BY nombre`
      );

      return {
        pasaje: pR.rows[0],
        rutas: rutasR.rows,
        unidades: unidadesR.rows,
        tipos: tiposR.rows,
      };
    });

    if (!pasaje) return res.status(404).send(layout({
      title: "No encontrado",
      body: `<div class="alert alert-warning">
        <h4>⚠️ Pasaje no encontrado</h4>
        <p>El pasaje con ID ${id} no existe en la base de datos.</p>
        <a class="btn btn-outline-warning" href="/pasajes">← Volver al listado</a>
      </div>`
    }));

    const body = `
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar pasaje #${esc(pasaje.id_pasaje)}</h1>
          <div class="muted">Modifica los datos del registro seleccionado</div>
        </div>
        <a class="btn btn-outline-secondary" href="/pasajes">← Volver</a>
      </div>

      <hr class="my-4">

      <form class="row g-3" method="POST" action="/pasajes/${esc(pasaje.id_pasaje)}">
        <div class="col-12">
          <h5>📝 Información del viaje</h5>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Ruta</label>
          <select class="form-select" name="id_ruta" required>
            ${rutas
        .map(
          (r) => `<option value="${r.id_ruta}" ${r.id_ruta === pasaje.id_ruta ? "selected" : ""
            }>${esc(r.nombre)}</option>`
        )
        .join("")}
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Unidad</label>
          <select class="form-select" name="id_unidad" required>
            ${unidades
        .map(
          (u) => `<option value="${u.id_unidad}" ${u.id_unidad === pasaje.id_unidad ? "selected" : ""
            }>${esc(u.placa)}</option>`
        )
        .join("")}
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Tipo</label>
          <select class="form-select" name="id_tipo" required>
            ${tipos
        .map(
          (t) => `<option value="${t.id_tipo}" ${t.id_tipo === pasaje.id_tipo ? "selected" : ""
            }>${esc(t.nombre)}</option>`
        )
        .join("")}
          </select>
        </div>

        <div class="col-12">
          <h5 class="mt-3">💰 Detalles del cobro</h5>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Valor</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input class="form-control" type="number" step="0.01" min="0.01" name="valor" value="${esc(pasaje.valor)}" required />
          </div>
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" name="fecha" value="${esc(pasaje.fecha)}" required />
        </div>

        <div class="col-12 col-md-4">
          <label class="form-label">Hora</label>
          <input class="form-control" type="time" step="1" name="hora" value="${esc(pasaje.hora)}" required />
        </div>

        <div class="col-12">
          <hr class="my-3">
          <div class="d-flex gap-2 justify-content-end">
            <a class="btn btn-outline-secondary" href="/pasajes">Cancelar</a>
            <button class="btn btn-primary">💾 Guardar cambios</button>
          </div>
        </div>
      </form>
    `;

    res.send(layout({ title: "Editar pasaje", body }));
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error al cargar</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// UPDATE
// ========================
app.post("/pasajes/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const id_ruta = parseInt(req.body.id_ruta, 10);
  const id_unidad = parseInt(req.body.id_unidad, 10);
  const id_tipo = parseInt(req.body.id_tipo, 10);
  const valor = parseFloat(req.body.valor);
  const fecha = (req.body.fecha || "").trim();
  const hora = (req.body.hora || "").trim();

  if (
    !Number.isInteger(id) ||
    !Number.isInteger(id_ruta) ||
    !Number.isInteger(id_unidad) ||
    !Number.isInteger(id_tipo) ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    !fecha ||
    !hora
  ) {
    return res.status(400).send(layout({
      title: "Error",
      body: `<div class="alert alert-danger">
        <h4>❌ Datos inválidos</h4>
        <p>Por favor verifica que todos los campos estén completos y el valor sea mayor a 0.</p>
        <a class="btn btn-outline-danger" href="/pasajes/${id}/edit">← Volver al formulario</a>
      </div>`
    }));
  }

  try {
    await withConn(async (conn) => {
      await conn.query(
        `UPDATE pasajes
         SET id_ruta = $1,
             id_unidad = $2,
             id_tipo = $3,
             valor = $4,
             fecha_viaje = $5
         WHERE id_pasaje = $6`,
        [id_ruta, id_unidad, id_tipo, valor, `${fecha} ${hora}`, id]
      );
    });

    res.redirect("/pasajes?msg=" + encodeURIComponent("✅ Pasaje actualizado correctamente"));
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error al actualizar</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// DELETE
// ========================
app.post("/pasajes/:id/delete", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).send("ID inválido.");

  try {
    await withConn(async (conn) => {
      await conn.query(`DELETE FROM pasajes WHERE id_pasaje = $1`, [id]);
    });

    res.redirect("/pasajes?msg=" + encodeURIComponent("✅ Pasaje eliminado correctamente"));
  } catch (err) {
    res.status(500).send(
      layout({
        title: "Error",
        body: `<div class="alert alert-danger">
          <h4>❌ Error al eliminar</h4>
          <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
        </div>`,
      })
    );
  }
});

// ========================
// EXPORTAR CSV (Descarga directa)
// ========================
app.post("/exportar", async (req, res) => {
  try {
    const pasajes = await withConn(async (conn) => {
      const result = await conn.query(
        `SELECT r.nombre AS ruta,
                u.placa AS unidad,
                t.nombre AS tipo,
                p.valor,
                TO_CHAR(p.fecha_viaje, 'DD/MM/YYYY') AS fecha,
                TO_CHAR(p.fecha_viaje, 'HH24:MI:SS') AS hora
         FROM pasajes p
         JOIN rutas r ON p.id_ruta = r.id_ruta
         JOIN unidades u ON p.id_unidad = u.id_unidad
         JOIN tipos_pasaje t ON p.id_tipo = t.id_tipo
         ORDER BY p.fecha_viaje DESC`
      );
      return result.rows;
    });

    // Verificar si hay datos
    console.log("📊 Total de pasajes a exportar:", pasajes.length);

    if (pasajes.length === 0) {
      return res.send(
        layout({
          title: "Sin datos",
          body: `
            <div class="alert alert-warning">
              <h4>⚠️ No hay datos para exportar</h4>
              <p>No se encontraron pasajes en la base de datos.</p>
              <a class="btn btn-primary" href="/pasajes/new">+ Crear pasaje</a>
              <a class="btn btn-outline-secondary" href="/pasajes">← Volver</a>
            </div>
          `,
        })
      );
    }

    // Generar CSV con encabezados correctos
    const csv = [
      "Ruta,Unidad,Tipo Pasaje,Valor,Fecha,Hora",
      ...pasajes.map(p =>
        `"${p.ruta}","${p.unidad}","${p.tipo}",${p.valor},"${p.fecha}","${p.hora}"`
      )
    ].join("\n");

    console.log("✅ CSV generado con", pasajes.length, "registros");

    // Nombre del archivo con fecha actual
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `pasajes_${timestamp}.csv`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Agregar BOM para que Excel reconozca UTF-8 correctamente
    res.write('\ufeff');

    // Enviar CSV
    res.send(csv);

  } catch (err) {
    console.error("❌ Error al exportar:", err);
    res.status(500).send(
      layout({
        title: "Error",
        body: `
          <div class="alert alert-danger">
            <h4>❌ Error al exportar CSV</h4>
            <pre class="mb-0">${esc(err && err.message ? err.message : String(err))}</pre>
          </div>
          <a class="btn btn-outline-danger mt-3" href="/pasajes">← Volver al listado</a>
        `,
      })
    );
  }
});
// Iniciar servidor
app.listen(process.env.PORT || 3000, async () => {
  console.log("════════════════════════════════════════════════════");
  console.log("  🚌  SISTEMA DE GESTIÓN DE PASAJES");
  console.log("  Cooperativa de Transporte Público");
  console.log("  Administración de Bases de Datos - PostgreSQL");
  console.log("════════════════════════════════════════════════════");
  console.log("");
  console.log(`✅ Servidor activo: http://localhost:${process.env.PORT || 3000}/pasajes`);
  console.log("📊 Base de datos: PostgreSQL");
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log("");

  // Test de conexión a la BD
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conexión a PostgreSQL: OK");
    console.log(`📅 Hora del servidor: ${result.rows[0].now}`);
  } catch (err) {
    console.error("❌ Error de conexión a PostgreSQL:");
    console.error(err.message);
  }

  console.log("");
  console.log("Presiona Ctrl+C para detener");
  console.log("");
});