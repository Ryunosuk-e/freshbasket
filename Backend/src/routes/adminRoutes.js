const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getVendors, getCustomers, getOrders } = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/vendors', authenticate, authorize('admin'), getVendors);
router.get('/customers', authenticate, authorize('admin'), getCustomers);
router.get('/orders', authenticate, authorize('admin'), getOrders);

module.exports = router;
