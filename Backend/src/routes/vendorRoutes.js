const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPendingVendors,
  verifyVendor,
  rejectVendor,
  getVendorProfile,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/vendorController');
const { submitKyc, getMyKyc } = require('../controllers/kycController');

const router = express.Router();

// Vendor KYC Submissions
router.get('/kyc', authenticate, authorize('vendor'), getMyKyc);
router.post('/kyc', authenticate, authorize('vendor'), submitKyc);

// IMPORTANT: /me is registered before /:vendorId
router.get('/me', authenticate, authorize('vendor'), getMyProfile);
router.patch('/me', authenticate, authorize('vendor'), updateMyProfile);

// Admin-only review queue (UC08)
router.get('/pending', authenticate, authorize('admin'), getPendingVendors);
router.patch('/:vendorId/verify', authenticate, authorize('admin'), verifyVendor);
router.patch('/:vendorId/reject', authenticate, authorize('admin'), rejectVendor);

// Any logged-in user can view a vendor's public profile
router.get('/:vendorId', authenticate, getVendorProfile);

module.exports = router;
