const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  registrarPago,
  getByEstudiante,
} = require("../controllers/pagos.controller");

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
    "secretaria"
  ),
  create
);

router.put(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "secretaria"
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
router.put(
  "/:id/registrar-pago",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "secretaria"
  ),
  registrarPago
);

router.get(
  "/estudiante/:id",
  getByEstudiante
);

module.exports = router;