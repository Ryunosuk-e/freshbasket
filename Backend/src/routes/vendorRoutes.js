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

const router = express.Router();

// IMPORTANT: /me is registered before /:vendorId — otherwise Express would
// match "me" as a :vendorId value and these two routes would never run.
router.get('/me', authenticate, authorize('vendor'), getMyProfile);
router.patch('/me', authenticate, authorize('vendor'), updateMyProfile);

// Admin-only review queue (UC08)
router.get('/pending', authenticate, authorize('admin'), getPendingVendors);
router.patch('/:vendorId/verify', authenticate, authorize('admin'), verifyVendor);
router.patch('/:vendorId/reject', authenticate, authorize('admin'), rejectVendor);

// Any logged-in user can view a vendor's public profile
router.get('/:vendorId', authenticate, getVendorProfile);

module.exports = router;
