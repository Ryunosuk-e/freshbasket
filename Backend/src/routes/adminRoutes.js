const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getVendors, getCustomers } = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/vendors', authenticate, authorize('admin'), getVendors);
router.get('/customers', authenticate, authorize('admin'), getCustomers);

module.exports = router;
