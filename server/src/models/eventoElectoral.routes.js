const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/eventoElectoral.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener todos los eventos
router.get("/", getAll);

// Obtener un evento por ID
router.get("/:id", getById);

// Crear evento
router.post(
  "/",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  create
);

// Actualizar evento
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

// Eliminar evento
router.delete(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector"
  ),
  remove
);

module.exports = router;