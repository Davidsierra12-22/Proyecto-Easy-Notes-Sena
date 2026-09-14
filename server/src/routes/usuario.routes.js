const { Router } = require('express');
const router = Router();
const controller = require('../controllers/usuario.controller');
const { subirFotoUsuario, quitarFotoUsuario } = require('../controllers/upload.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');
const { uploadFotoUsuario } = require('../middleware/upload');

router.get('/', protect, authorize(...PERMISOS.DIRECCION), controller.getAll);
router.get('/buscar/:documento', protect, reglas.documentoParam, validar, authorize(...PERMISOS.DIRECCION), controller.buscarPorDocumento);
router.get('/:id/estudiantes', protect, reglas.idMongo, validar, controller.misEstudiantes);
router.get('/:id/acudientes', protect, reglas.idMongo, validar, controller.misAcudientes);
router.get('/:id', protect, reglas.idMongo, validar, controller.getById);
router.post('/', protect, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('crear_usuario', 'Usuarios'), controller.create);
router.put('/:id', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_usuario', 'Usuarios'), controller.update);
router.delete('/:id', protect, reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_usuario', 'Usuarios'), controller.remove);

const multerFotoUsuario = (req, res, next) =>
  uploadFotoUsuario.single('archivo')(req, res, (err) => {
    if (!err) return next();
    const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La foto supera el máximo de 2MB' : err.message;
    return res.status(400).json({ ok: false, message: mensaje });
  });

router.post('/:id/foto', protect, reglas.idMongo, validar, writeLimiter, multerFotoUsuario, registrarAccion('subir_foto_perfil', 'Usuarios'), subirFotoUsuario);
router.delete('/:id/foto', protect, reglas.idMongo, validar, deleteLimiter, registrarAccion('quitar_foto_perfil', 'Usuarios'), quitarFotoUsuario);
router.post('/:id/notificar-credenciales', protect, reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('notificar_credenciales', 'Usuarios'), controller.enviarCredenciales);

module.exports = router;
