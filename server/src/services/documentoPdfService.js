const fs = require('fs');
const path = require('path');

const ESCALA = {
  S: 'Siempre lo demuestra',
  C: 'Casi siempre lo demuestra',
  A: 'A veces lo demuestra',
  N: 'Nunca lo demuestra'
};

const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const logoBase64 = (logo) => {
  if (!logo) return '';
  try {
    const ruta = logo.startsWith('/')
      ? path.join(__dirname, '..', '..', logo)
      : logo;
    if (!fs.existsSync(ruta)) return '';
    const ext = path.extname(ruta).replace('.', '') || 'png';
    return `data:image/${ext};base64,${fs.readFileSync(ruta).toString('base64')}`;
  } catch {
    return '';
  }
};

const encabezadoOficial = (institucion) => {
  const logo = logoBase64(institucion?.logo);
  const codigos = [institucion?.dane && `DANE: ${institucion.dane}`, institucion?.icfes && `ICFES: ${institucion.icfes}`]
    .filter(Boolean)
    .join(' · ');
  return `
    <table class="encabezado">
      <tr>
        <td class="logo">${logo ? `<img src="${logo}" alt="Escudo" />` : ''}</td>
        <td>
          <div class="nombre">${escapar(institucion?.nombre || 'Institución Educativa')}</div>
          <div class="sub">${escapar(institucion?.direccion || '')}</div>
          <div class="sub">${escapar(codigos)}</div>
        </td>
      </tr>
    </table>
    <hr class="linea" />`;
};

const datosEstudiante = (estudiante, anio, grado) => `
  <table class="datos">
    <tr><td><span>Estudiante:</span> ${escapar(estudiante?.nombres || '')} ${escapar(estudiante?.apellidos || '')}</td>
        <td><span>Documento:</span> ${escapar(estudiante?.documento || '—')}</td></tr>
    <tr><td><span>Año académico:</span> ${escapar(anio?.anio || anio)}</td>
        <td><span>Grupo:</span> ${escapar(grado || '—')}</td></tr>
  </table>`;

const logroTexto = (logro) => logro || '';

const filasPeriodos = (asignaturas, numPeriodos = 5) => {
  return asignaturas.map((m) => {
    const celdas = Array.from({ length: numPeriodos }, (_, j) => j + 1).map((p) => {
      const per = (m.periodos || []).find((x) => x.periodo === p);
      const val = per ? per.notaVigente : null;
      return `<td class="c">${val != null ? `${val}${per?.recuperada ? '*' : ''}` : '—'}</td>`;
    }).join('');
    return `<tr>
      <td>${escapar(m.asignatura?.nombre || m.nombre || 'Asignatura')}</td>
      ${celdas}
      <td class="c negrita">${m.promedioAnual ?? m.notaDefinitiva ?? '—'}</td>
      <td>${logroTexto(m.logroFinal || m.logro)}</td>
    </tr>`;
  }).join('');
};

const cabecerasPeriodos = (numPeriodos = 5) =>
  Array.from({ length: numPeriodos }, (_, j) => j + 1).map((p) => `<th class="c">P${p}</th>`).join('');

const tablaBoletin = (boletin) => {
  const tipo = boletin.tipo;
  if (tipo === 'corto' || tipo === 'descriptivo') {
    const filas = (boletin.asignaturas || []).map((m) => {
      const indicadores = tipo === 'descriptivo' && m.indicadores?.length
        ? m.indicadores.map((ind) => `${escapar(ind.indicador?.descripcion || ind.indicador?.codigo || 'Indicador')}: <b>${ind.nota ?? '—'}</b>`).join('<br/>')
        : '—';
      return `<tr>
        <td>${escapar(m.asignatura?.nombre || 'Asignatura')}</td>
        <td class="c">${m.notaVigente != null ? `${m.notaVigente}${m.recuperada ? '*' : ''}` : '—'}</td>
        <td>${logroTexto(m.logro)}</td>
        ${tipo === 'descriptivo' ? `<td>${indicadores}</td>` : ''}
        <td>${escapar(m.observacion || '')}</td>
      </tr>`;
    }).join('');
    return `<table class="tabla">
      <thead><tr><th>Asignatura</th><th class="c">Nota</th><th>Logro</th>
        ${tipo === 'descriptivo' ? '<th>Indicadores</th>' : ''}<th>Observación</th></tr></thead>
      <tbody>${filas}</tbody></table>`;
  }

  if (tipo === 'preescolar') {
    const filas = (boletin.asignaturas || []).map((m) => `<tr>
      <td>${escapar(m.asignatura?.nombre || 'Asignatura')}</td>
      <td class="c negrita">${escapar(m.nivelCualitativo)}</td>
      <td>${escapar(boletin.escalaCualitativa?.[m.nivelCualitativo] || m.descripcion || ESCALA[m.nivelCualitativo] || '')}</td>
      <td>${escapar(m.observacion || '')}</td>
    </tr>`).join('');
    const escala = Object.entries(boletin.escalaCualitativa || ESCALA)
      .map(([k, v]) => `<b>${k}</b>: ${escapar(v)}`).join(' &nbsp; ');
    return `<table class="tabla">
      <thead><tr><th>Asignatura</th><th class="c">Nivel</th><th>Descripción</th><th>Observación</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <div class="escala">${escala}</div>`;
  }

  // acumulativo y final
  const filas = filasPeriodos((boletin.asignaturas || []));
  return `<table class="tabla">
    <thead><tr><th>Asignatura</th>${cabecerasPeriodos()}<th class="c">Definitiva</th><th>Logro</th></tr></thead>
    <tbody>${filas}</tbody></table>`;
};

const firmaRector = () => `
  <div class="firma">
    <div class="linea-firma"></div>
    <div>Rector(a)</div>
  </div>`;

/**
 * HTML del boletín para PDF.
 */
const htmlBoletin = ({ boletin, estudiante, anio, institucion, grado }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #111; }
        .encabezado { width: 100%; border-collapse: collapse; }
        .encabezado .logo { width: 90px; }
        .encabezado img { max-height: 78px; max-width: 90px; }
        .encabezado .nombre { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .encabezado .sub { font-size: 11px; color: #444; }
        .linea { border: 0; border-top: 2px solid #333; margin: 8px 0 14px; }
        h1 { text-align: center; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 10px; }
        .datos { width: 100%; margin: 10px 0 14px; font-size: 12px; }
        .datos td { padding: 2px 0; }
        .datos span { color: #555; }
        table.tabla { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .tabla th, .tabla td { border: 1px solid #999; padding: 5px 6px; font-size: 11px; text-align: left; }
        .tabla th { background: #ecf0f1; }
        .c { text-align: center; }
        .negrita { font-weight: 700; }
        .escala { margin-top: 10px; font-size: 11px; color: #333; }
        .resumen { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .resumen td, .resumen th { border: 1px solid #999; padding: 5px 8px; text-align: center; font-size: 11px; }
        .resumen th { background: #ecf0f1; }
        .promedio { text-align: right; margin-top: 12px; font-size: 12px; }
        .nota * { vertical-align: top; font-size: 10px; color: #555; margin-top: 6px; }
        .firma { width: 220px; margin: 44px auto 0; text-align: center; font-size: 11px; }
        .linea-firma { border-top: 1px solid #333; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      ${encabezadoOficial(institucion)}
      <h1>Boletín ${boletin.tipo === 'final' ? 'Final de Año' : boletin.tipo}</h1>
      ${datosEstudiante(estudiante, anio, grado)}
      ${boletin.tipo === 'final' && boletin.resumen ? `
        <table class="resumen">
          <tr>
            <th>Promedio General</th><th>Asignaturas</th><th>Áreas perdidas</th><th>Veredicto</th>
          </tr>
          <tr>
            <td class="c">${boletin.resumen.promedioGeneral ?? '—'}</td>
            <td class="c">${boletin.resumen.totalAsignaturas ?? '—'}</td>
            <td class="c">${boletin.resumen.areasPerdidas ?? '—'}</td>
            <td class="c">${boletin.resumen.promovido == null ? '—' : boletin.resumen.promovido ? 'Promovido' : 'No promovido'}</td>
          </tr>
        </table>` : ''}
      ${tablaBoletin(boletin)}
      ${['acumulativo', 'final'].includes(boletin.tipo) && boletin.asignaturas?.length ? `
        <div class="promedio"><b>Promedio general:</b>
          ${boletin.resumen?.promedioGeneral ?? (
            (Math.round(((boletin.asignaturas || [])
              .map((a) => a.promedioAnual ?? a.notaDefinitiva)
              .filter((n) => n != null)
              .reduce((a, b) => a + b, 0) / Math.max(1, (boletin.asignaturas || []).length)) * 10) / 10) || '—'
          )}
        </div>` : ''}
      <div class="nota">* Nota recuperada o habilitada</div>
      ${firmaRector()}
    </body>
  </html>`;

/**
 * HTML del certificado de estudio para PDF.
 */
const htmlCertificado = ({ certificado, institucion }) => {
  const c = certificado;
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #111; }
        .encabezado { width: 100%; border-collapse: collapse; }
        .encabezado .logo { width: 90px; }
        .encabezado img { max-height: 80px; max-width: 90px; }
        .encabezado .nombre { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .encabezado .sub { font-size: 11px; color: #444; }
        .linea { border: 0; border-top: 3px double #333; margin: 8px 0 20px; }
        h1 { text-align: center; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin: 18px 0 8px; }
        .cuerpo { line-height: 1.8; text-align: justify; margin-top: 14px; }
        .resumen { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .resumen td, .resumen th { border: 1px solid #999; padding: 5px 8px; text-align: center; font-size: 12px; }
        .resumen th { background: #ecf0f1; }
        .firma { width: 220px; margin: 60px auto 0; text-align: center; font-size: 12px; }
        .linea-firma { border-top: 1px solid #333; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      ${encabezadoOficial(institucion)}
      <h1>Certificado de Estudio</h1>
      <div class="cuerpo">
        La institución educativa <b>${escapar(institucion?.nombre || '')}</b>, representada por el rector(a), certifica que el(a)
        estudiante <b>${escapar(c.estudiante?.nombres || '')} ${escapar(c.estudiante?.apellidos || '')}</b>,
        identificado(a) con documento <b>${escapar(c.estudiante?.documento || '')}</b>,
        cursó y aprobó el año académico <b>${escapar(c.anio || '')}</b> en el grupo <b>${escapar(c.grado || '')}</b>,
        con un promedio general de <b>${c.promedioGeneral ?? '—'}</b>,
        dejando constancia de que ${c.promovido ? 'fue <b>PROMOVIDO(A)</b>' : 'no fue promovido(a)'}.
      </div>
      <table class="resumen">
        <tr><th>Asignaturas cursadas</th><th>Áreas perdidas</th><th>Promedio</th><th>Veredicto</th></tr>
        <tr>
          <td>${c.asignaturas ?? '—'}</td>
          <td>${c.areasPerdidas ?? '—'}</td>
          <td>${c.promedioGeneral ?? '—'}</td>
          <td>${c.promovido == null ? '—' : c.promovido ? 'Promovido' : 'No promovido'}</td>
        </tr>
      </table>
      ${firmaRector()}
    </body>
  </html>`;
};

module.exports = { htmlBoletin, htmlCertificado, escapar };