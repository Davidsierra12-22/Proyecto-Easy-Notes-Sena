const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  remove,
  getByEvento,
  getByCandidato,
} = require("../controllers/voto.controller");

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");

router.use(protect);

router.get("/", authorize(...PERMISOS.INSTITUCIONAL), getAll);
router.get("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), getById);
router.post("/", authorize(...PERMISOS.ESTUDIANTE), create);
router.delete("/:id", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), remove);
router.get("/evento/:eventoId", authorize(...PERMISOS.INSTITUCIONAL), getByEvento);
router.get("/candidato/:candidatoId", authorize(...PERMISOS.INSTITUCIONAL), getByCandidato);

module.exports = router;
