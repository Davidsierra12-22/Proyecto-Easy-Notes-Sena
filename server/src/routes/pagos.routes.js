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

const { protect, authorize } = require("../middleware/auth");
const { PERMISOS } = require("../config/constants");
const { reglas, validar } = require("../middleware/validar");
const { registrarAccion } = require("../middleware/auditoria");

router.use(protect);

router.get("/", authorize(...PERMISOS.FINANCIERO), getAll);
router.get("/:id", reglas.idMongo, validar, authorize(...PERMISOS.FINANCIERO), getById);
router.post("/", authorize(...PERMISOS.FINANCIERO), registrarAccion('crear_pago', 'Pagos'), create);
router.put("/:id", reglas.idMongo, validar, authorize(...PERMISOS.FINANCIERO), registrarAccion('editar_pago', 'Pagos'), update);
router.delete("/:id", reglas.idMongo, validar, authorize(...PERMISOS.DIRECCION), registrarAccion('eliminar_pago', 'Pagos'), remove);
router.put("/:id/registrar-pago", reglas.idMongo, validar, authorize(...PERMISOS.FINANCIERO), registrarAccion('registrar_pago', 'Pagos'), registrarPago);
router.get("/estudiante/:id", reglas.idMongo, validar, authorize(...PERMISOS.FINANCIERO), getByEstudiante);

module.exports = router;
