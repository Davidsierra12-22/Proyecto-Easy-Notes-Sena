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
    "coordinador"
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
  "/:id/votar",
  authorize("estudiante"),
  votar
);

router.get(
  "/:id/resultados",
  resultados
);

router.put(
  "/:id/abrir",
  authorize(
    "super_admin",
    "admin",
    "rector"
  ),
  abrir
);

router.put(
  "/:id/cerrar",
  authorize(
    "super_admin",
    "admin",
    "rector"
  ),
  cerrar
);

module.exports = router;