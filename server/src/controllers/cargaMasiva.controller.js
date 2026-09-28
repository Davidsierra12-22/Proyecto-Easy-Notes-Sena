const path = require('path');
const XLSX = require('xlsx');
const Usuario = require('../models/Usuario');
const Area = require('../models/Area');
const Asignatura = require('../models/Asignatura');
const Grupo = require('../models/Grupo');
const { ROLES, TIPOS_DOCUMENTO } = require('../config/constants');

const normalizar = (t = '') => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const ROLES_VALIDOS = {
  admin: ROLES.ADMIN,
  administrador: ROLES.ADMIN,
  rector: ROLES.RECTOR,
  coordinador: ROLES.COORDINADOR,
  coordinadoracademico: ROLES.COORDINADOR,
  docente: ROLES.DOCENTE,
  profesor: ROLES.DOCENTE,
  estudiante: ROLES.ESTUDIANTE,
  acudiente: ROLES.ACUDIENTE,
  acudientecabeza: ROLES.ACUDIENTE,
  secretaria: ROLES.SECRETARIA,
  secretariado: ROLES.SECRETARIA
};

const TIPOS_DOC = TIPOS_DOCUMENTO.map(t => normalizar(t));

const JORNADAS = { manana: 'manana', tarde: 'tarde', noche: 'noche', continua: 'continua' };

const COLUMNAS = {
  usuarios: {
    tipoDocumento: ['tipo documento', 'tipo doc', 'tipo doc', 'tipodocumento', 'tipo'],
    documento: ['documento', 'numero documento', 'no documento', 'numerodocumento', 'n doc'],
    nombres: ['nombres', 'nombre'],
    apellidos: ['apellidos', 'apellido'],
    rol: ['rol', 'tipo perfil', 'perfil', 'rol principal', 'tipoperfil'],
    email: ['email', 'correo', 'correo electronico', 'correoelectronico'],
    celular: ['celular', 'movil', 'telefono', 'cel']
  },
  areas: {
    nombre: ['nombre', 'area'],
    abreviatura: ['abreviatura', 'sigla', 'abreviacion'],
    porcentaje: ['porcentaje', '%'],
    orden: ['orden']
  },
  asignaturas: {
    nombre: ['nombre', 'asignatura', 'materia'],
    abreviatura: ['abreviatura', 'sigla', 'abreviacion'],
    area: ['area', 'area nombre', 'areanombre', 'area academica'],
    intensidadHoraria: ['intensidad horaria', 'intensidad', 'intensidadhoraria', 'horas'],
    orden: ['orden']
  },
  grupos: {
    nombre: ['nombre', 'grupo'],
    grado: ['grado'],
    jornada: ['jornada'],
    capacidad: ['capacidad', 'cupo', 'cupos']
  }
};

const PLANTILLAS = {
  usuarios: {
    headers: ['Tipo Documento', 'Documento', 'Nombres', 'Apellidos', 'Rol', 'Email', 'Celular'],
    ejemplo: ['CC', '1000000001', 'Juan', 'Pérez', 'estudiante', 'juan@correo.com', '3000000000']
  },
  areas: {
    headers: ['Nombre', 'Abreviatura', 'Porcentaje', 'Orden'],
    ejemplo: ['Matemáticas', 'MAT', 20, 1]
  },
  asignaturas: {
    headers: ['Nombre', 'Abreviatura', 'Area', 'Intensidad Horaria', 'Orden'],
    ejemplo: ['Álgebra', 'ALG', 'Matemáticas', 4, 1]
  },
  grupos: {
    headers: ['Nombre', 'Grado', 'Jornada', 'Capacidad'],
    ejemplo: ['6-1', 6, 'manana', 35]
  }
};

const leerHoja = (file) => {
  const esCsv = path.extname(file.originalname).toLowerCase() === '.csv';
  const wb = esCsv
    ? XLSX.read(file.buffer.toString('utf-8'), { type: 'string' })
    : XLSX.read(file.buffer, { type: 'buffer' });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: false });
  if (!aoa.length) throw new Error('El archivo está vacío');
  return aoa;
};

const construirMapaColumnas = (headers, entidad) => {
  const mapa = {};
  headers.forEach((header, idx) => {
    const clave = normalizar(header);
    for (const [campo, alias] of Object.entries(COLUMNAS[entidad])) {
      if (mapa[campo] !== undefined) continue;
      if (alias.some(a => normalizar(a) === clave)) {
        mapa[campo] = idx;
      }
    }
  });
  return mapa;
};

const valorCelda = (fila, mapa, campo) => {
  const idx = mapa[campo];
  if (idx === undefined || idx === null) return '';
  const v = fila[idx];
  return v === undefined || v === null ? '' : String(v).trim();
};

const finFilaVacia = (fila) => fila.every(v => String(v).trim() === '');

const resolverRol = (v) => ROLES_VALIDOS[normalizar(v)] || null;

const resolverTipoDoc = (v) => {
  const n = normalizar(v);
  if (TIPOS_DOC.includes(n)) return TIPOS_DOCUMENTO[TIPOS_DOC.indexOf(n)];
  return null;
};

const resolverJornada = (v) => {
  const n = normalizar(v);
  if (!n || n === 'manana') return 'manana';
  if (n === 'tarde') return 'tarde';
  if (n === 'noche') return 'noche';
  if (n === 'continua' || n === 'continuo') return 'continua';
  return null;
};

const numeroCelda = (fila, mapa, campo) => {
  const v = valorCelda(fila, mapa, campo);
  if (!v) return null;
  const n = Number(String(v).replace(',', '.').replace('%', ''));
  return isNaN(n) ? null : n;
};

const responder = (res, total, creados, omitidos, errores, mensaje) =>
  res.json({
    ok: true,
    message: mensaje || `Carga completada: ${creados.length} creados, ${omitidos.length} omitidos, ${errores.length} errores`,
    data: { total, creados, omitidos, errores }
  });

const importarUsuarios = async (req, res) => {
  try {
    const aoa = leerHoja(req.file);
    const headers = aoa[0];
    const mapa = construirMapaColumnas(headers, 'usuarios');
    if (mapa.documento === undefined || mapa.nombres === undefined || mapa.apellidos === undefined) {
      return res.status(400).json({ ok: false, message: 'El archivo debe incluir las columnas: documento, nombres, apellidos (y opcional: tipoDocumento, rol, email, celular)' });
    }

    const creados = [];
    const omitidos = [];
    const errores = [];
    let total = 0;
    const institucionId = req.usuario.institucionId;

    for (let i = 1; i < aoa.length; i++) {
      const fila = aoa[i];
      const nroFila = i + 1;
      if (finFilaVacia(fila)) continue;
      total++;

      const doc = valorCelda(fila, mapa, 'documento');
      const nombres = valorCelda(fila, mapa, 'nombres');
      const apellidos = valorCelda(fila, mapa, 'apellidos');

      if (!/^\d{6,12}$/.test(doc)) {
        errores.push({ fila: nroFila, motivo: 'Documento inválido (debe ser numérico de 6 a 12 dígitos)' });
        continue;
      }

      const existe = await Usuario.findOne({ institucionId, documento: doc });
      if (existe) {
        omitidos.push({ fila: nroFila, documento: doc, motivo: 'Ya existe un usuario con este documento' });
        continue;
      }

      let tipoDocumento = resolverTipoDoc(valorCelda(fila, mapa, 'tipoDocumento'));
      if (!tipoDocumento) tipoDocumento = 'CC';

      let rol = resolverRol(valorCelda(fila, mapa, 'rol'));
      if (!rol) {
        errores.push({ fila: nroFila, documento: doc, motivo: 'Rol inválido. Usa: admin, rector, coordinador, docente, estudiante, acudiente o secretaria' });
        continue;
      }

      const email = valorCelda(fila, mapa, 'email') || undefined;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errores.push({ fila: nroFila, documento: doc, motivo: 'Email inválido' });
        continue;
      }

      const celular = valorCelda(fila, mapa, 'celular') || undefined;
      const creado = {
        tipoDocumento,
        documento: doc,
        nombres,
        apellidos,
        tipoPerfil: rol,
        roles: [rol],
        email,
        celular,
        institucionId,
        credenciales: {
          usuario: doc,
          passwordHash: await Usuario.hashPassword(doc),
          debeCambiarPassword: true
        }
      };
      if (req.body.sedeId) creado.sedeId = req.body.sedeId;

      try {
        const nuevo = await Usuario.create(creado);
        creados.push({
          fila: nroFila,
          documento: doc,
          nombre: `${nombres} ${apellidos}`,
          rol,
          usuario: doc,
          password: doc
        });
      } catch (e) {
        if (e.code === 11000) {
          omitidos.push({ fila: nroFila, documento: doc, motivo: 'Documento o usuario ya registrado' });
        } else {
          errores.push({ fila: nroFila, documento: doc, motivo: e.message });
        }
      }
    }

    responder(res, total, creados, omitidos, errores);
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

const importarAreas = async (req, res) => {
  try {
    const aoa = leerHoja(req.file);
    const headers = aoa[0];
    const mapa = construirMapaColumnas(headers, 'areas');
    if (mapa.nombre === undefined) {
      return res.status(400).json({ ok: false, message: 'El archivo debe incluir la columna: nombre' });
    }

    const creados = [];
    const omitidos = [];
    const errores = [];
    let total = 0;
    const institucionId = req.usuario.institucionId;

    for (let i = 1; i < aoa.length; i++) {
      const fila = aoa[i];
      const nroFila = i + 1;
      if (finFilaVacia(fila)) continue;
      total++;

      const nombre = valorCelda(fila, mapa, 'nombre');
      if (!nombre) {
        errores.push({ fila: nroFila, motivo: 'El nombre es obligatorio' });
        continue;
      }

      const existe = await Area.findOne({ institucionId, nombre });
      if (existe) {
        omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe un área con este nombre' });
        continue;
      }

      const porcentaje = numeroCelda(fila, mapa, 'porcentaje');
      if (porcentaje !== null && (porcentaje < 0 || porcentaje > 100)) {
        errores.push({ fila: nroFila, nombre, motivo: 'El porcentaje debe estar entre 0 y 100' });
        continue;
      }

      try {
        const nuevo = await Area.create({
          institucionId,
          nombre,
          abreviatura: valorCelda(fila, mapa, 'abreviatura') || undefined,
          porcentaje: porcentaje === null ? 0 : porcentaje,
          orden: numeroCelda(fila, mapa, 'orden') === null ? 0 : numeroCelda(fila, mapa, 'orden')
        });
        creados.push({ fila: nroFila, nombre: nuevo.nombre });
      } catch (e) {
        if (e.code === 11000) {
          omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe un área con este nombre' });
        } else {
          errores.push({ fila: nroFila, nombre, motivo: e.message });
        }
      }
    }

    responder(res, total, creados, omitidos, errores);
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

const importarAsignaturas = async (req, res) => {
  try {
    const aoa = leerHoja(req.file);
    const headers = aoa[0];
    const mapa = construirMapaColumnas(headers, 'asignaturas');
    if (mapa.nombre === undefined || mapa.area === undefined) {
      return res.status(400).json({ ok: false, message: 'El archivo debe incluir las columnas: nombre y area' });
    }

    const creados = [];
    const omitidos = [];
    const errores = [];
    let total = 0;
    const institucionId = req.usuario.institucionId;
    const areas = await Area.find({ institucionId });

    for (let i = 1; i < aoa.length; i++) {
      const fila = aoa[i];
      const nroFila = i + 1;
      if (finFilaVacia(fila)) continue;
      total++;

      const nombre = valorCelda(fila, mapa, 'nombre');
      if (!nombre) {
        errores.push({ fila: nroFila, motivo: 'El nombre es obligatorio' });
        continue;
      }

      const nombreArea = valorCelda(fila, mapa, 'area');
      const area = areas.find(a => normalizar(a.nombre) === normalizar(nombreArea));
      if (!area) {
        errores.push({ fila: nroFila, nombre, motivo: `Área no encontrada: ${nombreArea}` });
        continue;
      }

      const existe = await Asignatura.findOne({ institucionId, areaId: area._id, nombre });
      if (existe) {
        omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe una asignatura con este nombre en el área' });
        continue;
      }

      try {
        const nuevo = await Asignatura.create({
          institucionId,
          areaId: area._id,
          nombre,
          abreviatura: valorCelda(fila, mapa, 'abreviatura') || undefined,
          intensidadHoraria: numeroCelda(fila, mapa, 'intensidadHoraria') ?? 4,
          orden: numeroCelda(fila, mapa, 'orden') ?? 0
        });
        creados.push({ fila: nroFila, nombre: nuevo.nombre, area: area.nombre });
      } catch (e) {
        if (e.code === 11000) {
          omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe una asignatura con este nombre en el área' });
        } else {
          errores.push({ fila: nroFila, nombre, motivo: e.message });
        }
      }
    }

    responder(res, total, creados, omitidos, errores);
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

const importarGrupos = async (req, res) => {
  try {
    const aoa = leerHoja(req.file);
    const headers = aoa[0];
    const mapa = construirMapaColumnas(headers, 'grupos');
    if (mapa.nombre === undefined || mapa.grado === undefined) {
      return res.status(400).json({ ok: false, message: 'El archivo debe incluir las columnas: nombre y grado' });
    }

    const { anioAcademicoId } = req.body;
    if (!anioAcademicoId) {
      return res.status(400).json({ ok: false, message: 'Debes seleccionar el año académico' });
    }

    const creados = [];
    const omitidos = [];
    const errores = [];
    let total = 0;
    const institucionId = req.usuario.institucionId;

    for (let i = 1; i < aoa.length; i++) {
      const fila = aoa[i];
      const nroFila = i + 1;
      if (finFilaVacia(fila)) continue;
      total++;

      const nombre = valorCelda(fila, mapa, 'nombre');
      if (!nombre) {
        errores.push({ fila: nroFila, motivo: 'El nombre es obligatorio' });
        continue;
      }

      const grado = numeroCelda(fila, mapa, 'grado');
      if (grado === null || grado < 0 || grado > 11) {
        errores.push({ fila: nroFila, nombre, motivo: 'El grado debe ser un número entre 0 y 11' });
        continue;
      }

      const jornada = resolverJornada(valorCelda(fila, mapa, 'jornada'));
      if (!jornada) {
        errores.push({ fila: nroFila, nombre, motivo: 'Jornada inválida. Usa: manana, tarde, noche o continua' });
        continue;
      }

      const capacidad = numeroCelda(fila, mapa, 'capacidad');
      if (capacidad !== null && capacidad < 1) {
        errores.push({ fila: nroFila, nombre, motivo: 'La capacidad debe ser un número mayor a 0' });
        continue;
      }

      const existe = await Grupo.findOne({ institucionId, anioAcademicoId, nombre });
      if (existe) {
        omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe un grupo con este nombre en el año académico' });
        continue;
      }

      try {
        const nuevo = await Grupo.create({
          institucionId,
          anioAcademicoId,
          sedeId: req.body.sedeId || null,
          nombre,
          grado,
          jornada,
          capacidad: capacidad || 35
        });
        creados.push({ fila: nroFila, nombre: nuevo.nombre, grado: nuevo.grado });
      } catch (e) {
        if (e.code === 11000) {
          omitidos.push({ fila: nroFila, nombre, motivo: 'Ya existe un grupo con este nombre en el año académico' });
        } else {
          errores.push({ fila: nroFila, nombre, motivo: e.message });
        }
      }
    }

    responder(res, total, creados, omitidos, errores);
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

const descargarPlantilla = async (req, res) => {
  try {
    const { entidad } = req.params;
    const plantilla = PLANTILLAS[entidad];
    if (!plantilla) {
      return res.status(404).json({ ok: false, message: 'Plantilla no encontrada' });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([plantilla.headers, plantilla.ejemplo]);
    ws['!cols'] = plantilla.headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_${entidad}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar la plantilla', error: error.message });
  }
};

module.exports = { importarUsuarios, importarAreas, importarAsignaturas, importarGrupos, descargarPlantilla };