const router = require("express").Router();
const { getAll, getById, create, update, remove } = require("../controllers/conceptosContables.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.FINANCIERO), registrarAccion('crear_concepto_contable', 'ConceptosContables'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.FINANCIERO), registrarAccion('editar_concepto_contable', 'ConceptosContables'), update);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_concepto_contable', 'ConceptosContables'), remove);

module.exports = router;
