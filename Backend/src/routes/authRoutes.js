const express = require('express');
const { registerCustomer, registerVendor, login, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register/customer', registerCustomer);
router.post('/register/vendor', registerVendor);
router.post('/login', login);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
