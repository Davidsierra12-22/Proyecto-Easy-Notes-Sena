const router = require("express").Router();
const { getAll, getById, create, update, aprobar, rechazar } = require("../controllers/excusas.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");
const { registrarAccion } = require("../middleware/auditoria");
const { writeLimiter } = require("../middleware/security");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.AMPLIO), registrarAccion('crear_exculpa', 'Excusas'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('editar_exculpa', 'Excusas'), update);
router.put("/:id/aprobar", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('aprobar_exculpa', 'Excusas'), aprobar);
router.put("/:id/rechazar", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.GESTION), registrarAccion('rechazar_exculpa', 'Excusas'), rechazar);

module.exports = router;
