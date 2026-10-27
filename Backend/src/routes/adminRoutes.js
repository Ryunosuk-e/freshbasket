const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getVendors, getCustomers, getOrders } = require('../controllers/adminController');
const { getAllKyc, reviewKyc } = require('../controllers/kycController');

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/vendors', authenticate, authorize('admin'), getVendors);
router.get('/customers', authenticate, authorize('admin'), getCustomers);
router.get('/orders', authenticate, authorize('admin'), getOrders);

// Vendor KYC Moderation
router.get('/kyc', authenticate, authorize('admin'), getAllKyc);
router.patch('/kyc/:submissionId/review', authenticate, authorize('admin'), reviewKyc);

module.exports = router;
