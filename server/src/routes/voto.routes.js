const router = require("express").Router();
const { getAll, getById, create, remove, getByEvento, getByCandidato } = require("../controllers/voto.controller");
const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");
const { registrarAccion } = require("../middleware/auditoria");
const { writeLimiter, deleteLimiter } = require("../middleware/security");

router.use(protect);

router.get("/", authorize(...PERMISOS.INSTITUCIONAL), getAll);
router.get("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), getById);
router.post("/", writeLimiter, authorize(...PERMISOS.ESTUDIANTE), registrarAccion('crear_voto', 'Votos'), create);
router.delete("/:id", reglas.idMongo, validar, deleteLimiter, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_voto', 'Votos'), remove);
router.get("/evento/:eventoId", authorize(...PERMISOS.INSTITUCIONAL), getByEvento);
router.get("/candidato/:candidatoId", authorize(...PERMISOS.INSTITUCIONAL), getByCandidato);

module.exports = router;
