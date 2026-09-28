const Institucion = require('../models/Institucion');
const Usuario = require('../models/Usuario');
const { PERMISOS } = require('../config/constants');

const MAX_TAMANO_BASE64 = 2.5 * 1024 * 1024;

const puedeGestionarFoto = (req) =>
  PERMISOS.DIRECCION.includes(req.usuario?.tipoPerfil) ||
  (req.usuario && req.params.id && req.usuario._id.toString() === req.params.id);

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

    const usuario = await Usuario.findById(req.params.id);
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

    const usuario = await Usuario.findById(req.params.id);
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

    const institucionId = req.params.id || req.usuario?.institucionId;
    if (!institucionId) {
      return res.status(400).json({ ok: false, message: 'institucionId requerido' });
    }

    const institucion = await Institucion.findById(institucionId);
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

    const institucionId = req.params.id || req.usuario?.institucionId;
    if (!institucionId) {
      return res.status(400).json({ ok: false, message: 'institucionId requerido' });
    }

    const institucion = await Institucion.findById(institucionId);
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

    const usuario = await Usuario.findById(req.params.id);
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

    const usuario = await Usuario.findById(req.params.id);
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