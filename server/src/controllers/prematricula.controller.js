const Prematricula = require('../models/Prematricula');
const { conAlcance, sinCamposDeAlcance } = require('../utils/alcance');
const Matricula = require('../models/Matricula');
const Usuario = require('../models/Usuario');
const Grupo = require('../models/Grupo');
const AnioAcademico = require('../models/AnioAcademico');
const Institucion = require('../models/Institucion');

/**
 * Resuelve el colegio de una peticion publica.
 *
 * Estas tres rutas no tienen sesion, asi que no hay institucionId del actor de
 * donde sacarlo: lo dice el propio padre, en el enlace que publica el colegio.
 * Antes se hacia al reves, con una busqueda de "el anio con prematrícula
 * abierta" sin filtro de institucion, que devolvia el de cualquier colegio.
 */
const colegioPublico = async (req) => {
  const slug = String(req.query?.colegio || req.body?.colegio || '').trim().toLowerCase();
  if (!slug) return null;
  return Institucion.findOne({ slug, estado: 'activo' }).select('_id nombre slug');
};

/** Anio con prematrícula abierta, acotado a UN colegio. */
const anioConPrematriculaAbierta = (institucionId) =>
  AnioAcademico.findOne({
    institucionId,
    'cronograma.prematricula.estado': 'abierta'
  }).sort({ anio: -1 });

/** El cronograma decide si la ventana sigue vigente, no solo la bandera. */
const dentroDeVentana = (cron) => {
  const ahora = new Date();
  if (cron.inicio && ahora < new Date(cron.inicio)) return false;
  if (cron.fin && ahora > new Date(cron.fin)) return false;
  return true;
};

const getAll = async (req, res) => {
  try {
    const filter = conAlcance(req.usuario);
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;

    const data = await Prematricula.find(filter).sort({ createdAt: -1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Prematricula.findOne(conAlcance(req.usuario, { _id: req.params.id }));
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    const data = await Prematricula.create(body);
    res.status(201).json({ ok: true, data, message: 'Prematricula creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const prem = await Prematricula.findOne(conAlcance(req.usuario, { _id: req.params.id }));
    if (!prem) return res.status(404).json({ ok: false, message: 'No encontrado' });
    if (prem.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: 'Solo se puede editar una prematricula pendiente' });
    }
    const data = await Prematricula.findOneAndUpdate(
      conAlcance(req.usuario, { _id: req.params.id }),
      sinCamposDeAlcance(req.body), { new: true, runValidators: true });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Prematricula.findOneAndDelete(conAlcance(req.usuario, { _id: req.params.id }));
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const aprobar = async (req, res) => {
  try {
    const prem = await Prematricula.findOne(conAlcance(req.usuario, { _id: req.params.id }));
    if (!prem) return res.status(404).json({ ok: false, message: 'Prematricula no encontrada' });
    if (prem.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: `La prematricula ya esta ${prem.estado}` });
    }

    // Tambien acotado: si la prematrícula llegara a apuntar a un año de otro
    // colegio, la matricula se daria de alta contra ese año.
    const anio = await AnioAcademico.findOne(
      conAlcance(req.usuario, { _id: prem.anioAcademicoId })
    );
    if (!anio) return res.status(400).json({ ok: false, message: 'Año academico no encontrado' });

    const documento = String(prem.estudiante.documento);
    const existente = await Usuario.findOne({ institucionId: prem.institucionId, documento });
    if (existente) {
      return res.status(400).json({ ok: false, message: 'Ya existe un usuario con ese documento' });
    }

    const passwordHash = await Usuario.hashPassword(documento);
    const estudiante = await Usuario.create({
      tipoDocumento: prem.estudiante.tipoDocumento,
      documento,
      nombres: prem.estudiante.nombres,
      apellidos: prem.estudiante.apellidos,
      fechaNacimiento: prem.estudiante.fechaNacimiento,
      genero: prem.estudiante.genero,
      direccion: prem.estudiante.direccion,
      telefono: prem.estudiante.telefono,
      institucionId: prem.institucionId,
      tipoPerfil: 'estudiante',
      credenciales: {
        usuario: documento,
        passwordHash,
        debeCambiarPassword: true
      },
      estado: 'activo'
    });

    let grupo = null;
    if (prem.grupoSolicitado) {
      grupo = await Grupo.findOne({
        institucionId: prem.institucionId,
        anioAcademicoId: prem.anioAcademicoId,
        nombre: prem.grupoSolicitado
      });
    }

    if (grupo) {
      await Matricula.create({
        institucionId: prem.institucionId,
        anioAcademicoId: prem.anioAcademicoId,
        estudianteId: estudiante._id,
        grupoId: grupo._id,
        tipoMatricula: 'nueva',
        estado: 'activa'
      });
    }

    prem.estado = 'matriculada';
    prem.observaciones = req.body.observaciones || prem.observaciones;
    await prem.save();

    res.json({
      ok: true,
      data: { prematricula: prem, estudiante, grupo: grupo ? grupo.nombre : null },
      message: grupo ? 'Prematricula aprobada y matricula creada' : 'Prematricula aprobada, no se encontro el grupo para matricular'
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al aprobar', error: error.message });
  }
};

const rechazar = async (req, res) => {
    try {
    const prem = await Prematricula.findOne(conAlcance(req.usuario, { _id: req.params.id }));
    if (!prem) return res.status(404).json({ ok: false, message: 'Prematricula no encontrada' });
    if (prem.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: `La prematricula ya esta ${prem.estado}` });
    }
    prem.estado = 'rechazada';
    prem.observaciones = req.body.observaciones || prem.observaciones;
    await prem.save();
    res.json({ ok: true, data: prem, message: 'Prematricula rechazada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al rechazar', error: error.message });
  }
};

// MT-003-2 / MT-003-3: Verificar si hay un período de prematrícula abierto según el cronograma
const periodoAbierto = async (req, res) => {
  try {
    const colegio = await colegioPublico(req);
    if (!colegio) {
      return res.status(400).json({
        ok: false,
        message: 'Falta el identificador del colegio (parametro "colegio"). Usa el enlace de prematrícula que publica tu institución.'
      });
    }

    const anio = await anioConPrematriculaAbierta(colegio._id);
    if (!anio) {
      return res.json({ ok: true, data: { abierta: false, mensaje: 'Prematrícula cerrada' } });
    }
    const cron = anio.cronograma.prematricula;
    const vigente = dentroDeVentana(cron);
    res.json({
      ok: true,
      data: {
        abierta: vigente,
        anio: anio.anio,
        anioAcademicoId: anio._id,
        institucionId: anio.institucionId,
        colegio: colegio.nombre,
        inicio: cron.inicio,
        fin: cron.fin,
        mensaje: vigente ? 'Prematrícula abierta' : 'Prematrícula cerrada'
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al consultar período', error: error.message });
  }
};

// MT-003-1: Registro online sin autenticación. El sistema guarda la solicitud con estado 'pendiente'
const solicitarPublico = async (req, res) => {
  try {
    const { estudiante, acudiente, gradoSolicitado, grupoSolicitado } = req.body;
    if (!estudiante?.nombres || !estudiante?.apellidos || !estudiante?.tipoDocumento || !estudiante?.documento) {
      return res.status(400).json({ ok: false, message: 'Datos del estudiante incompletos' });
    }
    if (!acudiente?.nombres || !acudiente?.apellidos) {
      return res.status(400).json({ ok: false, message: 'Datos del acudiente incompletos' });
    }
    if (!gradoSolicitado) {
      return res.status(400).json({ ok: false, message: 'Grado solicitado es requerido' });
    }

    const colegio = await colegioPublico(req);
    if (!colegio) {
      return res.status(400).json({
        ok: false,
        message: 'Falta el identificador del colegio (campo "colegio"). Usa el enlace de prematrícula que publica tu institución.'
      });
    }

    const anio = await anioConPrematriculaAbierta(colegio._id);
    if (!anio) {
      return res.status(400).json({ ok: false, message: 'Prematrícula cerrada' });
    }
    if (!dentroDeVentana(anio.cronograma.prematricula)) {
      return res.status(400).json({ ok: false, message: 'Prematrícula cerrada' });
    }

    const documento = String(estudiante.documento).trim();
    // El duplicado se busca DENTRO del colegio. Con el filtro global, un
    // niño que ya se postuló al Colegio A quedaba bloqueado para el Colegio
    // B, y ademas la respuesta confirmaba que ese documento ya existía.
    const duplicado = await Prematricula.findOne({
      institucionId: colegio._id,
      'estudiante.documento': documento,
      'estado': { $in: ['pendiente', 'aprobada', 'matriculada'] }
    });
    if (duplicado) {
      return res.status(400).json({ ok: false, message: 'Ya existe una solicitud de prematrícula para este documento' });
    }

    const prem = await Prematricula.create({
      institucionId: anio.institucionId,
      anioAcademicoId: anio._id,
      estudiante,
      acudiente,
      gradoSolicitado,
      grupoSolicitado,
      estado: 'pendiente'
    });

    res.status(201).json({
      ok: true,
      data: { _id: prem._id, fechaRegistro: prem.fechaRegistro },
      message: 'Solicitud de prematrícula registrada. Queda en estado pendiente.'
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al registrar prematrícula', error: error.message });
  }
};

// MT-003-4: El prematriculado consulta el estado con su número de documento (sin autenticación)
const consultarEstadoPublico = async (req, res) => {
  try {
    const documento = String(req.params.documento || '').trim();
    if (!documento) return res.status(400).json({ ok: false, message: 'Documento requerido' });

    const colegio = await colegioPublico(req);
    if (!colegio) {
      return res.status(400).json({
        ok: false,
        message: 'Falta el identificador del colegio (parametro "colegio"). Usa el enlace de prematrícula que publica tu institución.'
      });
    }

    // Acotado al colegio Y a una sola respuesta. Antes, sin filtro de
    // institucion, cualquier persona sin login metia el documento de un niño
    // y obtenia el estado de su solicitud en todos los colegios del sistema.
    const prem = await Prematricula.findOne({
      institucionId: colegio._id,
      'estudiante.documento': documento
    })
      .sort({ createdAt: -1 })
      .populate('anioAcademicoId', 'anio');

    if (!prem) {
      return res.status(404).json({ ok: false, message: 'No se encontró ninguna solicitud con ese documento' });
    }

    res.json({
      ok: true,
      data: {
        _id: prem._id,
        nombres: `${prem.estudiante.nombres} ${prem.estudiante.apellidos}`,
        documento: prem.estudiante.documento,
        anio: prem.anioAcademicoId?.anio,
        gradoSolicitado: prem.gradoSolicitado,
        grupoSolicitado: prem.grupoSolicitado,
        estado: prem.estado,
        observaciones: prem.observaciones,
        createdAt: prem.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al consultar estado', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, aprobar, rechazar, periodoAbierto, solicitarPublico, consultarEstadoPublico };
