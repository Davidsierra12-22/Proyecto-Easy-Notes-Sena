const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  aprobar,
  rechazar,
} = require("../controllers/excusas.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(protect);

// CRUD
router.get("/", getAll);

router.get("/:id", getById);

router.post(
  "/",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador",
    "docente",
    "estudiante"
  ),
  create
);

router.put(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  update
);

// Endpoints especiales
router.put(
  "/:id/aprobar",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  aprobar
);

router.put(
  "/:id/rechazar",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  rechazar
);

module.exports = router;