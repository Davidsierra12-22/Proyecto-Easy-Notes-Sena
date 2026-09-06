const router = require("express").Router();
const { getAll, getById, create, update, remove, agregarSeguimiento, getByEstudiante } = require("../controllers/observador.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), registrarAccion('crear_observador', 'Observador'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), registrarAccion('editar_observador', 'Observador'), update);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_observador', 'Observador'), remove);
router.post("/:id/seguimiento", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), registrarAccion('agregar_seguimiento_observador', 'Observador'), agregarSeguimiento);
router.get("/estudiante/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), getByEstudiante);

module.exports = router;
