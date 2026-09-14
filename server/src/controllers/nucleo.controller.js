const Institucion = require('../models/Institucion');
const Usuario = require('../models/Usuario');
const Sede = require('../models/Sede');
const Grupo = require('../models/Grupo');
const Matricula = require('../models/Matricula');
const Pago = require('../models/Pagos');
const { ROLES } = require('../config/constants');
const { paginarQuery } = require('../utils/paginacion');

const aIds = (instituciones) =>
  instituciones.map(i => i._id);

const agruparConteo = async (Modelo, match) => {
  const rows = await Modelo.aggregate([
    { $match: match },
    { $group: { _id: '$institucionId', total: { $sum: 1 } } }
  ]);
  const mapa = {};
  rows.forEach(r => {
    if (r._id) mapa[r._id.toString()] = r.total;
  });
  return mapa;
};

// KPIs por institución: sedes, grupos, matrículas activas, pagos, usuarios
const obtenerKPIs = async (instituciones) => {
  const ids = aIds(instituciones);
  if (!ids.length) {
    return instituciones.map(i => ({
      ...(i.toObject ? i.toObject() : i),
      sedes: 0, grupos: 0, matriculasActivas: 0,
      pagosPendientes: 0, pagosPagados: 0, recaudado: 0,
      estudiantes: 0, docentes: 0
    }));
  }

  const [sedes, grupos, matriculas, pagos, usuarios] = await Promise.all([
    agruparConteo(Sede, { institucionId: { $in: ids } }),
    agruparConteo(Grupo, { institucionId: { $in: ids } }),
    agruparConteo(Matricula, { institucionId: { $in: ids }, estado: 'activa' }),
    (async () => {
      const rows = await Pago.aggregate([
        { $match: { institucionId: { $in: ids } } },
        {
          $group: {
            _id: '$institucionId',
            total: { $sum: 1 },
            pagado: { $sum: { $cond: [{ $eq: ['$estado', 'pagado'] }, 1, 0] } },
            recaudado: { $sum: { $cond: [{ $eq: ['$estado', 'pagado'] }, '$valorFinal', 0] } }
          }
        }
      ]);
      const mapa = {};
      rows.forEach(r => {
        if (r._id) mapa[r._id.toString()] = { total: r.total, pagado: r.pagado, recaudado: r.recaudado };
      });
      return mapa;
    })(),
    (async () => {
      const rows = await Usuario.aggregate([
        { $match: { institucionId: { $in: ids } } },
        {
          $group: {
            _id: '$institucionId',
            estudiantes: { $sum: { $cond: [{ $eq: ['$tipoPerfil', ROLES.ESTUDIANTE] }, 1, 0] } },
            docentes: { $sum: { $cond: [{ $eq: ['$tipoPerfil', ROLES.DOCENTE] }, 1, 0] } }
          }
        }
      ]);
      const mapa = {};
      rows.forEach(r => {
        if (r._id) mapa[r._id.toString()] = { estudiantes: r.estudiantes, docentes: r.docentes };
      });
      return mapa;
    })()
  ]);

  return instituciones.map(i => {
    const id = i._id.toString();
    const p = pagos[id] || { total: 0, pagado: 0, recaudado: 0 };
    const u = usuarios[id] || { estudiantes: 0, docentes: 0 };
    return {
      ...(i.toObject ? i.toObject() : i),
      sedes: sedes[id] || 0,
      grupos: grupos[id] || 0,
      matriculasActivas: matriculas[id] || 0,
      pagosPendientes: p.total - p.pagado,
      pagosPagados: p.pagado,
      recaudado: p.recaudado,
      estudiantes: u.estudiantes,
      docentes: u.docentes
    };
  });
};

const getInstituciones = async (req, res) => {
  try {
    const filter = { estado: { $ne: 'inactivo' } };
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.nucleoId) filter.nucleoId = req.query.nucleoId;
    if (req.query.tipo) filter.tipo = req.query.tipo;

    const pg = paginarQuery(req, 100, 500);
    let query = Institucion.find(filter)
      .populate('nucleoId', 'nombre municipio departamento')
      .sort({ nombre: 1 });

    let instituciones;
    let paginacion;
    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Institucion.countDocuments(filter)
      ]);
      instituciones = data;
      paginacion = { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) };
    } else {
      instituciones = await query;
    }

    const conKPIs = await obtenerKPIs(instituciones);
    res.json({
      ok: true,
      data: conKPIs,
      message: 'Colegios del núcleo obtenidos',
      ...(paginacion ? { paginacion } : {})
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar colegios', error: error.message });
  }
};

const crearInstitucion = async (req, res) => {
  try {
    const { nombre, nit, dane, icfes, tipo, direccion, telefono, email, nucleoId } = req.body;
    if (!nombre || !nit) {
      return res.status(400).json({ ok: false, message: 'Nombre y NIT son obligatorios' });
    }

    const existente = await Institucion.findOne({ nit });
    if (existente) {
      return res.status(400).json({ ok: false, message: 'Ya existe un colegio con ese NIT' });
    }

    const data = await Institucion.create({
      nombre,
      nit,
      dane: dane || undefined,
      icfes: icfes || undefined,
      tipo: tipo || 'privado',
      direccion: direccion || undefined,
      telefono: telefono || undefined,
      email: email || undefined,
      nucleoId: nucleoId || undefined,
      estado: 'activo'
    });

    res.status(201).json({ ok: true, data, message: 'Colegio creado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear el colegio', error: error.message });
  }
};

const crearAdminInicial = async (req, res) => {
  try {
    const institucion = await Institucion.findById(req.params.id);
    if (!institucion) return res.status(404).json({ ok: false, message: 'Colegio no encontrado' });

    const { tipoDocumento, documento, nombres, apellidos, email, telefono, usuario, password } = req.body;
    if (!documento || !nombres || !apellidos) {
      return res.status(400).json({ ok: false, message: 'Documento, nombres y apellidos son obligatorios' });
    }

    const usuariologin = usuario ? String(usuario).trim() : String(documento).trim();
    const passwordInicial = password != null && password !== '' ? String(password) : String(documento).trim();

    const existente = await Usuario.findOne({
      $or: [
        { institucionId: institucion._id, documento },
        { 'credenciales.usuario': usuariologin }
      ]
    });
    if (existente) {
      return res.status(400).json({ ok: false, message: 'Ya existe un usuario con ese documento o usuario' });
    }

    if (String(passwordInicial).length < 6) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const data = await Usuario.create({
      tipoDocumento: tipoDocumento || 'CC',
      documento,
      nombres,
      apellidos,
      email: email || undefined,
      telefono: telefono || undefined,
      institucionId: institucion._id,
      tipoPerfil: ROLES.ADMIN,
      roles: [ROLES.ADMIN],
      estado: 'activo',
      credenciales: {
        usuario: usuariologin,
        passwordHash: await Usuario.hashPassword(passwordInicial),
        debeCambiarPassword: true
      }
    });

    res.status(201).json({
      ok: true,
      data: {
        _id: data._id,
        nombres: data.nombres,
        apellidos: data.apellidos,
        documento: data.documento,
        email: data.email,
        tipoPerfil: data.tipoPerfil,
        institucionId: data.institucionId,
        credenciales: {
          usuario: usuariologin,
          password: passwordInicial,
          debeCambiarPassword: true
        }
      },
      message: 'Admin inicial del colegio creado correctamente'
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear el admin inicial', error: error.message });
  }
};

const estadisticas = async (req, res) => {
  try {
    const filter = { estado: { $ne: 'inactivo' } };
    if (req.query.nucleoId) filter.nucleoId = req.query.nucleoId;

    const instituciones = await Institucion.find(filter);
    const conKPIs = await obtenerKPIs(instituciones);

    const resumen = conKPIs.reduce((acc, i) => {
      acc.colegios += 1;
      acc.sedes += i.sedes;
      acc.grupos += i.grupos;
      acc.estudiantes += i.estudiantes;
      acc.docentes += i.docentes;
      acc.matriculasActivas += i.matriculasActivas;
      acc.pagosPendientes += i.pagosPendientes;
      acc.pagosPagados += i.pagosPagados;
      acc.recaudado += i.recaudado;
      return acc;
    }, {
      colegios: 0, sedes: 0, grupos: 0, estudiantes: 0, docentes: 0,
      matriculasActivas: 0, pagosPendientes: 0, pagosPagados: 0, recaudado: 0
    });

    res.json({ ok: true, data: resumen, message: 'Estadísticas agregadas del núcleo' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al calcular estadísticas', error: error.message });
  }
};

const estadisticasInstitucion = async (req, res) => {
  try {
    const institucion = await Institucion.findById(req.params.id)
      .populate('nucleoId', 'nombre municipio departamento');
    if (!institucion) return res.status(404).json({ ok: false, message: 'Colegio no encontrado' });

    const [conKPIs] = await obtenerKPIs([institucion]);

    const anios = await require('../models/AnioAcademico').find(
      { institucionId: institucion._id },
      'anio estado'
    ).sort({ anio: -1 }).limit(6);

    res.json({
      ok: true,
      data: { ...conKPIs, anios },
      message: 'Estadísticas del colegio'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al calcular estadísticas', error: error.message });
  }
};

const comparativo = async (req, res) => {
  try {
    const filter = { estado: { $ne: 'inactivo' } };
    if (req.query.nucleoId) filter.nucleoId = req.query.nucleoId;

    const instituciones = await Institucion.find(filter).sort({ nombre: 1 });
    const conKPIs = await obtenerKPIs(instituciones);

    const filas = conKPIs.map(i => ({
      _id: i._id,
      nombre: i.nombre,
      nit: i.nit,
      nucleo: i.nucleoId?.nombre || null,
      sedes: i.sedes,
      grupos: i.grupos,
      estudiantes: i.estudiantes,
      docentes: i.docentes,
      matriculasActivas: i.matriculasActivas,
      pagosPendientes: i.pagosPendientes,
      pagosPagados: i.pagosPagados,
      recaudado: i.recaudado
    }));

    res.json({ ok: true, data: filas, message: 'Comparativo entre colegios del núcleo' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar comparativo', error: error.message });
  }
};

const reportes = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (tipo === 'instituciones') {
      const filter = { estado: { $ne: 'inactivo' } };
      if (req.query.nucleoId) filter.nucleoId = req.query.nucleoId;
      const instituciones = await Institucion.find(filter).sort({ nombre: 1 });
      const conKPIs = await obtenerKPIs(instituciones);
      return res.json({
        ok: true,
        data: { tipo, generado: new Date().toISOString(), registros: conKPIs },
        message: 'Reporte consolidado de colegios'
      });
    }

    res.status(400).json({
      ok: false,
      message: 'Tipo de reporte no soportado. Usa: instituciones'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte', error: error.message });
  }
};

module.exports = {
  getInstituciones,
  crearInstitucion,
  crearAdminInicial,
  estadisticas,
  estadisticasInstitucion,
  comparativo,
  reportes
};