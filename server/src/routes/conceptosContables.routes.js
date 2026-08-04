const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/conceptosContables.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener todos los conceptos
router.get("/", getAll);

// Obtener un concepto por ID
router.get("/:id", getById);

// Crear concepto contable
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

// Actualizar concepto contable
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

// Eliminar concepto contable
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