const router = require("express").Router();
const { getAll, getById, create, update, remove, marcarLeido } = require("../controllers/comunicados.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");
const { registrarAccion } = require("../middleware/auditoria");
const { writeLimiter, deleteLimiter } = require("../middleware/security");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), registrarAccion('crear_comunicado', 'Comunicados'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), registrarAccion('editar_comunicado', 'Comunicados'), update);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_comunicado', 'Comunicados'), remove);
router.put("/:id/leer", reglas.idMongo, validar, registrarAccion('marcar_leido_comunicado', 'Comunicados'), marcarLeido);

module.exports = router;
