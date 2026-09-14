const Usuario = require('../models/Usuario');
const { ROLES } = require('../config/constants');
const crypto = require('crypto');
const mailService = require('../services/mailService');
const { paginarQuery } = require('../utils/paginacion');

const CAMPOS_OCULTOS = '-credenciales.passwordHash -credenciales.tokenRecuperacion -credenciales.tokenRecuperacionExpira';

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.usuario.institucionId) filter.institucionId = req.usuario.institucionId;
    else if (req.query.institucionId) filter.institucionId = req.query.institucionId;
    if (req.query.tipoPerfil) filter.tipoPerfil = req.query.tipoPerfil;
    if (req.query.sedeId) filter.sedeId = req.query.sedeId;
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      filter.$or = [{ nombres: regex }, { apellidos: regex }, { documento: regex }];
    }

    const pg = paginarQuery(req);
    const query = Usuario.find(filter)
      .select(CAMPOS_OCULTOS)
      .populate('institucionId', 'nombre')
      .sort({ institucionId: 1, apellidos: 1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Usuario.countDocuments(filter)
      ]);
      return res.json({
        ok: true,
        data,
        paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) },
        message: 'Listado obtenido'
      });
    }

    const data = await query;
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

    body.roles = Array.isArray(body.roles) && body.roles.length
      ? [...new Set([...body.roles, body.tipoPerfil])]
      : [body.tipoPerfil];

    if (body.roles.length > 2) {
      return res.status(400).json({ ok: false, message: 'Un usuario puede tener máximo 2 perfiles' });
    }

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
    const objetivo = await Usuario.findById(req.params.id);
    if (!objetivo) return res.status(404).json({ ok: false, message: 'No encontrado' });
    if (objetivo.tipoPerfil === ROLES.SUPER_ADMIN && req.usuario.tipoPerfil !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({ ok: false, message: 'No puedes gestionar un Super Admin' });
    }
    const body = { ...req.body };
    if (objetivo._id.toString() === req.usuario._id.toString()) {
      const cambiaRol = body?.tipoPerfil && body.tipoPerfil !== objetivo.tipoPerfil;
      const cambiaEstado = body?.estado && body.estado !== objetivo.estado;
      if (cambiaRol || cambiaEstado) {
        return res.status(403).json({ ok: false, message: 'No puedes cambiar tu propio rol o estado' });
      }
    }

    if (body.credenciales?.password) {
      body.credenciales = {
        usuario: objetivo.credenciales.usuario,
        passwordHash: await Usuario.hashPassword(body.credenciales.password),
        debeCambiarPassword: true
      };
    }

    const principal = body.tipoPerfil || objetivo.tipoPerfil;
    if (Array.isArray(body.roles)) {
      body.roles = [...new Set([...body.roles, principal])];
    } else {
      const existentes = objetivo.roles && objetivo.roles.length ? objetivo.roles : [objetivo.tipoPerfil];
      body.roles = [...new Set([...existentes, principal])];
    }

    if (body.roles.length > 2) {
      return res.status(400).json({ ok: false, message: 'Un usuario puede tener máximo 2 perfiles' });
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
    const objetivo = await Usuario.findById(req.params.id);
    if (!objetivo) return res.status(404).json({ ok: false, message: 'No encontrado' });
    if (objetivo.tipoPerfil === ROLES.SUPER_ADMIN && req.usuario.tipoPerfil !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({ ok: false, message: 'No puedes gestionar un Super Admin' });
    }
    if (objetivo._id.toString() === req.usuario._id.toString()) {
      return res.status(403).json({ ok: false, message: 'No puedes eliminar tu propio usuario' });
    }
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

const generarPasswordTemporal = (longitud = 8) => {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(longitud))
    .map((b) => caracteres[b % caracteres.length])
    .join('');
};

const enviarCredenciales = async (req, res) => {
  try {
    const objetivo = await Usuario.findById(req.params.id);
    if (!objetivo) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    if (!objetivo.email) return res.status(400).json({ ok: false, message: 'El usuario no tiene email registrado' });

    let password = req.body?.password;
    if (password != null) {
      if (String(password).length < 6) {
        return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }
    } else {
      password = generarPasswordTemporal();
    }

    objetivo.credenciales.passwordHash = await Usuario.hashPassword(String(password));
    objetivo.credenciales.debeCambiarPassword = true;
    await objetivo.save();

    let enviado = true;
    if (mailService.configurado) {
      try {
        await mailService.enviarCredenciales({
          to: objetivo.email,
          nombre: objetivo.nombreCompleto,
          usuario: objetivo.credenciales.usuario,
          password: String(password)
        });
      } catch (e) {
        enviado = false;
      }
    } else {
      enviado = false;
    }

    res.json({
      ok: true,
      data: { usuario: objetivo.credenciales.usuario, password: String(password), email: objetivo.email, enviado },
      message: enviado
        ? 'Credenciales enviadas al correo del usuario'
        : 'No se pudo enviar el correo. Entrega las credenciales manualmente'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al enviar credenciales', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, misEstudiantes, misAcudientes, buscarPorDocumento, enviarCredenciales };
