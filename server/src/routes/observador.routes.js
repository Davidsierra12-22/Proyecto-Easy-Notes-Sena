const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  agregarSeguimiento,
  getByEstudiante,
} = require("../controllers/observador.controller");

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), create);
router.put("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), update);
router.delete("/:id", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), remove);
router.post("/:id/seguimiento", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL, ...PERMISOS.DOCENTE), agregarSeguimiento);
router.get("/estudiante/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), getByEstudiante);

module.exports = router;
