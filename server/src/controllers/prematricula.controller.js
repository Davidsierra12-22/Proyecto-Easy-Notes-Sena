const Prematricula = require('../models/Prematricula');
const Matricula = require('../models/Matricula');
const Usuario = require('../models/Usuario');
const Grupo = require('../models/Grupo');
const AnioAcademico = require('../models/AnioAcademico');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
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
    const data = await Prematricula.findById(req.params.id);
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
    const prem = await Prematricula.findById(req.params.id);
    if (!prem) return res.status(404).json({ ok: false, message: 'No encontrado' });
    if (prem.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: 'Solo se puede editar una prematricula pendiente' });
    }
    const data = await Prematricula.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Prematricula.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const aprobar = async (req, res) => {
  try {
    const prem = await Prematricula.findById(req.params.id);
    if (!prem) return res.status(404).json({ ok: false, message: 'Prematricula no encontrada' });
    if (prem.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: `La prematricula ya esta ${prem.estado}` });
    }

    const anio = await AnioAcademico.findById(prem.anioAcademicoId);
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
    const prem = await Prematricula.findById(req.params.id);
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
    const anio = await AnioAcademico.findOne({ 'cronograma.prematricula.estado': 'abierta' }).sort({ anio: -1 });
    if (!anio) {
      return res.json({ ok: true, data: { abierta: false, mensaje: 'Prematrícula cerrada' } });
    }
    const cron = anio.cronograma.prematricula;
    const ahora = new Date();
    let vigente = true;
    if (cron.inicio && ahora < cron.inicio) vigente = false;
    if (cron.fin && ahora > cron.fin) vigente = false;
    res.json({
      ok: true,
      data: {
        abierta: vigente,
        anio: anio.anio,
        anioAcademicoId: anio._id,
        institucionId: anio.institucionId,
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

    const anio = await AnioAcademico.findOne({ 'cronograma.prematricula.estado': 'abierta' }).sort({ anio: -1 });
    if (!anio) {
      return res.status(400).json({ ok: false, message: 'Prematrícula cerrada' });
    }
    const cron = anio.cronograma.prematricula;
    const ahora = new Date();
    if (cron.inicio && ahora < cron.inicio) {
      return res.status(400).json({ ok: false, message: 'Prematrícula cerrada' });
    }
    if (cron.fin && ahora > cron.fin) {
      return res.status(400).json({ ok: false, message: 'Prematrícula cerrada' });
    }

    const documento = String(estudiante.documento).trim();
    const duplicado = await Prematricula.findOne({
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

    const prem = await Prematricula.findOne({ 'estudiante.documento': documento })
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
