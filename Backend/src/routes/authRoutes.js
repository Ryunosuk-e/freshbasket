const express = require('express');
const { registerCustomer, registerVendor, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register/customer', registerCustomer);
router.post('/register/vendor', registerVendor);
router.post('/login', login);

module.exports = router;
