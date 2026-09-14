const Institucion = require('../models/Institucion');
const Usuario = require('../models/Usuario');
const path = require('path');
const fs = require('fs');
const { PERMISOS } = require('../config/constants');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'logos');
const FOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'fotos');

const puedeGestionarFoto = (req) =>
  PERMISOS.DIRECCION.includes(req.usuario?.tipoPerfil) ||
  (req.usuario && req.params.id && req.usuario._id.toString() === req.params.id);

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

    if (usuario.foto?.startsWith('/uploads/fotos/')) {
      const anterior = path.join(FOTO_DIR, path.basename(usuario.foto));
      if (fs.existsSync(anterior)) {
        fs.unlinkSync(anterior);
      }
    }

    const rutaRelativa = `/uploads/fotos/${req.file.filename}`;
    usuario.foto = rutaRelativa;
    await usuario.save();

    res.json({ ok: true, data: { foto: rutaRelativa }, message: 'Foto actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al subir foto', error: error.message });
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

    if (usuario.foto?.startsWith('/uploads/fotos/')) {
      const anterior = path.join(FOTO_DIR, path.basename(usuario.foto));
      if (fs.existsSync(anterior)) {
        fs.unlinkSync(anterior);
      }
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

    // Eliminar logo anterior si existe
    if (institucion.logo) {
      const logoAnterior = path.join(UPLOAD_DIR, path.basename(institucion.logo));
      if (fs.existsSync(logoAnterior)) {
        fs.unlinkSync(logoAnterior);
      }
    }

    const rutaRelativa = `/uploads/logos/${req.file.filename}`;
    institucion.logo = rutaRelativa;
    await institucion.save();

    res.json({
      ok: true,
      data: { logo: rutaRelativa },
      message: 'Logo subido correctamente'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al subir logo', error: error.message });
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

    // Eliminar firma anterior si existe
    if (institucion.certificadoEncabezado) {
      const firmaAnterior = path.join(UPLOAD_DIR, path.basename(institucion.certificadoEncabezado));
      if (fs.existsSync(firmaAnterior)) {
        fs.unlinkSync(firmaAnterior);
      }
    }

    const rutaRelativa = `/uploads/logos/${req.file.filename}`;
    institucion.certificadoEncabezado = rutaRelativa;
    await institucion.save();

    res.json({
      ok: true,
      data: { certificadoEncabezado: rutaRelativa },
      message: 'Firma del rector subida correctamente'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al subir firma', error: error.message });
  }
};

module.exports = { subirLogo, subirFirmaRector, subirFotoUsuario, quitarFotoUsuario };
