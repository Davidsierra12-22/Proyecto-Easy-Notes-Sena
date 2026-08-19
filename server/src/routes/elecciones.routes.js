const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  votar,
  resultados,
  abrir,
  cerrar,
} = require("../controllers/elecciones.controller");

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", authorize(...PERMISOS.INSTITUCIONAL), create);
router.put("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), update);
router.delete("/:id", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), remove);
router.post("/:id/votar", reglas.idMongo, validar, authorize(...PERMISOS.ESTUDIANTE), votar);
router.get("/:id/resultados", reglas.idMongo, validar, resultados);
router.put("/:id/abrir", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), abrir);
router.put("/:id/cerrar", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), cerrar);

module.exports = router;
