const express = require('express');
const { authenticate, authorize, requireVerifiedVendor } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getMyProducts,
  addProduct,
  editProduct,
  getProducts,
  getProductDetail,
  getProductRecommendations,
  getAdminProducts,
  approveProductListing,
  rejectProductListing,
} = require('../controllers/productController');

const router = express.Router();

// Public browsing — no auth.
router.get('/', getProducts);

// Admin product moderation routes
router.get('/admin/all', authenticate, authorize('admin'), getAdminProducts);
router.patch('/admin/:productId/approve', authenticate, authorize('admin'), approveProductListing);
router.patch('/admin/:productId/reject', authenticate, authorize('admin'), rejectProductListing);

// Vendor product management — requires KYC verification
router.get('/mine', authenticate, authorize('vendor'), getMyProducts);
router.post('/', authenticate, authorize('vendor'), requireVerifiedVendor, upload.array('images', 4), addProduct);
router.patch('/:productId', authenticate, authorize('vendor'), requireVerifiedVendor, upload.array('images', 4), editProduct);

// Product Detail & Recommendations
router.get('/:productId/recommendations', getProductRecommendations);
router.get('/:productId', getProductDetail);

module.exports = router;
