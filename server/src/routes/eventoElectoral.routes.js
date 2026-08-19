const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/eventoElectoral.controller");

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", authorize(...PERMISOS.INSTITUCIONAL), create);
router.put("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), update);
router.delete("/:id", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), remove);

module.exports = router;
