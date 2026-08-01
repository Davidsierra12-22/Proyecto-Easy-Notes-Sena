const { Router } = require('express');
const router = Router();
const controller = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/login', controller.login);
router.get('/me', protect, controller.me);
router.put('/password', protect, controller.cambiarPassword);

module.exports = router;
