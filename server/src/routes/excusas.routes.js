const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  aprobar,
  rechazar,
} = require("../controllers/excusas.controller");

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");

router.use(protect);

router.get("/", getAll);
router.get("/:id", reglas.idMongo, validar, getById);
router.post("/", authorize(...PERMISOS.AMPLIO), create);
router.put("/:id", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), update);
router.put("/:id/aprobar", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), aprobar);
router.put("/:id/rechazar", reglas.idMongo, validar, authorize(...PERMISOS.INSTITUCIONAL), rechazar);

module.exports = router;
