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
    "docente"
  ),
  create
);

router.put(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador",
    "docente"
  ),
  update
);

router.delete(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector"
  ),
  remove
);

// Endpoints especiales
router.post(
  "/:id/seguimiento",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador",
    "docente"
  ),
  agregarSeguimiento
);

router.get(
  "/estudiante/:id",
  getByEstudiante
);

module.exports = router;