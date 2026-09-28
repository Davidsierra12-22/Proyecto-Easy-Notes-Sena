const SolicitudRegistro = require('../models/SolicitudRegistro');
const Institucion = require('../models/Institucion');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.nucleoId) filter.nucleoId = req.query.nucleoId;
    if (req.query.estado) filter.estado = req.query.estado;

    const data = await SolicitudRegistro.find(filter)
      .populate('nucleoId', 'nombre municipio')
      .populate('procesadoPor', 'nombres apellidos documento')
      .sort({ createdAt: -1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await SolicitudRegistro.findById(req.params.id)
      .populate('nucleoId', 'nombre municipio')
      .populate('procesadoPor', 'nombres apellidos documento');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    // Endpoint publico: solo se acepta lo que viene del formulario de
    // solicitud. Aceptar el cuerpo tal cual permitia enviar estado
    // 'aprobada' y un procesadoPor falso, es decir, autoaprobar la
    // solicitud sin intervencion de la direccion de nucleo.
    const {
      nucleoId, nombre, nit, dane, municipio, direccion, telefono, email, contacto
    } = req.body || {};

    if (!nucleoId || !nombre || !nit || !contacto?.nombre || !contacto?.email) {
      return res.status(400).json({
        ok: false,
        message: 'Nucleo, nombre, NIT y datos de contacto son obligatorios'
      });
    }

    const data = await SolicitudRegistro.create({
      nucleoId,
      nombre,
      nit,
      dane: dane || undefined,
      municipio: municipio || undefined,
      direccion: direccion || undefined,
      telefono: telefono || undefined,
      contacto: {
        nombre: contacto.nombre,
        email: contacto.email,
        telefono: contacto.telefono || undefined
      },
      // Toda solicitud entra pendiente y sin responsable de processing.
      estado: 'pendiente'
    });
    res.status(201).json({ ok: true, data, message: 'Solicitud creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const solicitud = await SolicitudRegistro.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ ok: false, message: 'No encontrado' });
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: 'Solo se puede editar una solicitud pendiente' });
    }
    const data = await SolicitudRegistro.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await SolicitudRegistro.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const aprobar = async (req, res) => {
  try {
    const solicitud = await SolicitudRegistro.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: `La solicitud ya esta ${solicitud.estado}` });
    }

    const existente = await Institucion.findOne({ nit: solicitud.nit });
    if (existente) {
      return res.status(400).json({ ok: false, message: 'Ya existe una institucion con ese NIT' });
    }

    const institucion = await Institucion.create({
      nombre: solicitud.nombre,
      nit: solicitud.nit,
      direccion: solicitud.direccion,
      email: solicitud.contacto?.email,
      telefono: solicitud.contacto?.telefono,
      nucleoId: solicitud.nucleoId,
      tipo: 'privado',
      estado: 'activo'
    });

    solicitud.estado = 'aprobada';
    solicitud.procesadoPor = req.usuario._id;
    solicitud.observaciones = req.body.observaciones || solicitud.observaciones;
    await solicitud.save();

    res.json({
      ok: true,
      data: { solicitud, institucion },
      message: 'Solicitud aprobada e institucion creada'
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al aprobar', error: error.message });
  }
};

const rechazar = async (req, res) => {
  try {
    const solicitud = await SolicitudRegistro.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ ok: false, message: `La solicitud ya esta ${solicitud.estado}` });
    }
    solicitud.estado = 'rechazada';
    solicitud.procesadoPor = req.usuario._id;
    solicitud.observaciones = req.body.observaciones || solicitud.observaciones;
    await solicitud.save();
    res.json({ ok: true, data: solicitud, message: 'Solicitud rechazada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al rechazar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, aprobar, rechazar };
