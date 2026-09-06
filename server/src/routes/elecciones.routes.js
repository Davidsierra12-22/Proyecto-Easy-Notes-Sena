const router = require("express").Router();
const { getAll, getById, create, update, remove, votar, resultados, abrir, cerrar } = require("../controllers/elecciones.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");
const { registrarAccion } = require("../middleware/auditoria");
const { writeLimiter, deleteLimiter } = require("../middleware/security");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('crear_eleccion', 'Elecciones'), create);
router.put("/:id", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.INSTITUCIONAL), registrarAccion('editar_eleccion', 'Elecciones'), update);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_eleccion', 'Elecciones'), remove);
router.post("/:id/votar", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.ESTUDIANTE), registrarAccion('votar', 'Votos'), votar);
router.get("/:id/resultados", reglas.idMongo, validar, resultados);
router.put("/:id/abrir", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('abrir_eleccion', 'Elecciones'), abrir);
router.put("/:id/cerrar", reglas.idMongo, validar, writeLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('cerrar_eleccion', 'Elecciones'), cerrar);

module.exports = router;
