const { Router } = require('express');
const router = Router();
const controller = require('../controllers/cargaMasiva.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISOS } = require('../config/constants');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter } = require('../middleware/security');
const { uploadCargaMasiva } = require('../middleware/upload');

const multerCarga = (req, res, next) =>
  uploadCargaMasiva.single('archivo')(req, res, (err) => {
    if (!err) return next();
    return res.status(400).json({ ok: false, message: err.message });
  });

router.use(protect);

router.get('/plantilla/:entidad', authorize(...PERMISOS.GESTION), controller.descargarPlantilla);
router.post('/usuarios', writeLimiter, multerCarga, authorize(...PERMISOS.GESTION), registrarAccion('carga_masiva_usuarios', 'Usuarios'), controller.importarUsuarios);
router.post('/areas', writeLimiter, multerCarga, authorize(...PERMISOS.GESTION), registrarAccion('carga_masiva_areas', 'Areas'), controller.importarAreas);
router.post('/asignaturas', writeLimiter, multerCarga, authorize(...PERMISOS.GESTION), registrarAccion('carga_masiva_asignaturas', 'Asignaturas'), controller.importarAsignaturas);
router.post('/grupos', writeLimiter, multerCarga, authorize(...PERMISOS.GESTION), registrarAccion('carga_masiva_grupos', 'Grupos'), controller.importarGrupos);

module.exports = router;