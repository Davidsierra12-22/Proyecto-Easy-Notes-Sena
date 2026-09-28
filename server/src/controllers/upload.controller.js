const Institucion = require('../models/Institucion');
const Usuario = require('../models/Usuario');
const { PERMISOS } = require('../config/constants');

const MAX_TAMANO_BASE64 = 2.5 * 1024 * 1024;

const puedeGestionarFoto = (req) =>
  PERMISOS.DIRECCION.includes(req.usuario?.tipoPerfil) ||
  (req.usuario && req.params.id && req.usuario._id.toString() === req.params.id);

/**
 * Busca el usuario destino acotandolo a la institucion de quien hace la
 * peticion. Sin este filtro, un admin de un colegio podria cambiar la foto
 * o la firma de un usuario de otro colegio.
 */
const buscarUsuarioObjetivo = (req) => {
  const filtro = { _id: req.params.id };
  if (req.usuario?.institucionId) filtro.institucionId = req.usuario.institucionId;
  return Usuario.findOne(filtro);
};

/**
 * Resuelve la institucion objetivo. El id de la URL nunca gana sobre el
 * actor: si un usuario con institucion pide el id de otra, la peticion se
 * rechaza (no se escribe sobre su propia institucion por accidente).
 * El super_admin no tiene institucion asignada y opera la del nucleo.
 */
const buscarInstitucionObjetivo = (req) => {
  const propia = req.usuario?.institucionId;
  const id = propia || req.params.id;
  if (!id) return null;
  if (propia && req.params.id && req.params.id.toString() !== propia.toString()) return null;
  return Institucion.findById(id);
};

const archivoADataUri = (file) => {
  const mime = file.mimetype || 'image/jpeg';
  return `data:${mime};base64,${file.buffer.toString('base64')}`;
};

const validarImagen = (file) => {
  const mime = file.mimetype || '';
  if (!mime.startsWith('image/')) {
    const err = new Error('El archivo debe ser una imagen');
    err.status = 400;
    throw err;
  }
  if (file.size > 2 * 1024 * 1024) {
    const err = new Error('La imagen supera el tamaño máximo permitido (2MB)');
    err.status = 400;
    throw err;
  }
  const dataUri = archivoADataUri(file);
  if (dataUri.length > MAX_TAMANO_BASE64) {
    const err = new Error('La imagen supera el tamaño máximo permitido (2MB)');
    err.status = 400;
    throw err;
  }
  return dataUri;
};

const subirFotoUsuario = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se envió ningún archivo' });
    }
    if (!puedeGestionarFoto(req)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta acción' });
    }

    const usuario = await buscarUsuarioObjetivo(req);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const foto = validarImagen(req.file);
    usuario.foto = foto;
    await usuario.save();

    res.json({ ok: true, data: { foto }, message: 'Foto actualizada correctamente' });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, message: error.message || 'Error al subir foto' });
  }
};

const quitarFotoUsuario = async (req, res) => {
  try {
    if (!puedeGestionarFoto(req)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta acción' });
    }

    const usuario = await buscarUsuarioObjetivo(req);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    usuario.foto = null;
    await usuario.save();

    res.json({ ok: true, message: 'Foto eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al quitar foto', error: error.message });
  }
};

const subirLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se envió ningún archivo' });
    }

    const institucion = await buscarInstitucionObjetivo(req);
    if (!institucion) {
      return res.status(404).json({ ok: false, message: 'Institución no encontrada' });
    }

    const logo = validarImagen(req.file);
    institucion.logo = logo;
    await institucion.save();

    res.json({
      ok: true,
      data: { logo },
      message: 'Logo subido correctamente'
    });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, message: error.message || 'Error al subir logo' });
  }
};

const subirFirmaRector = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se envió ningún archivo' });
    }

    const institucion = await buscarInstitucionObjetivo(req);
    if (!institucion) {
      return res.status(404).json({ ok: false, message: 'Institución no encontrada' });
    }

    const firma = validarImagen(req.file);
    institucion.certificadoEncabezado = firma;
    await institucion.save();

    res.json({
      ok: true,
      data: { certificadoEncabezado: firma },
      message: 'Firma del rector subida correctamente'
    });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, message: error.message || 'Error al subir firma' });
  }
};

const subirFirmaUsuario = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se envió ningún archivo' });
    }
    if (!puedeGestionarFoto(req)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta acción' });
    }

    const usuario = await buscarUsuarioObjetivo(req);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const firma = validarImagen(req.file);
    usuario.firma = firma;
    await usuario.save();

    res.json({ ok: true, data: { firma }, message: 'Firma actualizada correctamente' });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, message: error.message || 'Error al subir firma' });
  }
};

const quitarFirmaUsuario = async (req, res) => {
  try {
    if (!puedeGestionarFoto(req)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta acción' });
    }

    const usuario = await buscarUsuarioObjetivo(req);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    usuario.firma = null;
    await usuario.save();

    res.json({ ok: true, message: 'Firma eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al quitar firma', error: error.message });
  }
};

module.exports = { subirLogo, subirFirmaRector, subirFotoUsuario, quitarFotoUsuario, subirFirmaUsuario, quitarFirmaUsuario };