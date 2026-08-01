const Usuario = require('../models/Usuario');
const { ROLES } = require('../config/constants');

const CAMPOS_OCULTOS = '-credenciales.passwordHash -credenciales.tokenRecuperacion -credenciales.tokenRecuperacionExpira';

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    if (req.query.tipoPerfil) filter.tipoPerfil = req.query.tipoPerfil;
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      filter.$or = [{ nombres: regex }, { apellidos: regex }, { documento: regex }];
    }

    const data = await Usuario.find(filter).select(CAMPOS_OCULTOS).sort({ apellidos: 1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Usuario.findById(req.params.id).select(CAMPOS_OCULTOS);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.usuario.institucionId) body.institucionId = req.usuario.institucionId;

    if (!body.credenciales?.usuario) {
      body.credenciales = {
        ...body.credenciales,
        usuario: String(body.documento)
      };
    }
    const passwordInicial = body.credenciales?.password || String(body.documento);
    body.credenciales = {
      ...body.credenciales,
      passwordHash: await Usuario.hashPassword(passwordInicial),
      debeCambiarPassword: true
    };
    delete body.credenciales.password;

    const data = await Usuario.create(body);
    data.credenciales.passwordHash = undefined;
    res.status(201).json({ ok: true, data, message: 'Usuario creado correctamente' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un usuario con ese documento o usuario', error: error.message });
    }
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.credenciales?.password) {
      body.credenciales = {
        ...body.credenciales,
        passwordHash: await Usuario.hashPassword(body.credenciales.password),
        debeCambiarPassword: true
      };
      delete body.credenciales.password;
    }

    const data = await Usuario.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
      .select(CAMPOS_OCULTOS);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Usuario.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const misEstudiantes = async (req, res) => {
  try {
    const data = await Usuario.findById(req.params.id).select('estudiantes');
    if (!data) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    res.json({ ok: true, data: data.estudiantes || [], message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar estudiantes', error: error.message });
  }
};

const misAcudientes = async (req, res) => {
  try {
    const data = await Usuario.findById(req.params.id).select('acudientes');
    if (!data) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    res.json({ ok: true, data: data.acudientes || [], message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar acudientes', error: error.message });
  }
};

const buscarPorDocumento = async (req, res) => {
  try {
    const filter = { documento: req.params.documento };
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;

    const data = await Usuario.findOne(filter).select(CAMPOS_OCULTOS);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al buscar', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, misEstudiantes, misAcudientes, buscarPorDocumento };
