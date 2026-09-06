const router = require("express").Router();
const { getAll, getById, create, update, remove } = require("../controllers/eventoElectoral.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require('../config/constants');
const { reglas, validar } = require('../middleware/validar');
const { registrarAccion } = require('../middleware/auditoria');
const { writeLimiter, deleteLimiter } = require('../middleware/security');

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('crear_evento_electoral', 'EventosElectorales'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('editar_evento_electoral', 'EventosElectorales'), update);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_evento_electoral', 'EventosElectorales'), remove);

module.exports = router;
