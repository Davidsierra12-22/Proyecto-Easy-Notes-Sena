const router = require("express").Router();

const {
  getAll,
  getById,
  create,
  remove,
  getByEvento,
  getByCandidato,
} = require("../controllers/voto.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener todos los votos
router.get(
  "/",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  getAll
);

// Obtener voto por ID
router.get(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  getById
);

// Registrar voto
router.post(
  "/",
  authorize("estudiante"),
  create
);

// Eliminar voto
router.delete(
  "/:id",
  authorize(
    "super_admin",
    "admin",
    "rector"
  ),
  remove
);

// Obtener votos por evento
router.get(
  "/evento/:eventoId",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  getByEvento
);

// Obtener votos por candidato
router.get(
  "/candidato/:candidatoId",
  authorize(
    "super_admin",
    "admin",
    "rector",
    "coordinador"
  ),
  getByCandidato
);

module.exports = router;