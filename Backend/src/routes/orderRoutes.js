const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCheckoutSummary,
  placeOrder,
  getMyOrders,
  getVendorOrders,
  updateStatus,
  confirmPayment,
  handlePaystackWebhook,
  getAdminOrders,
  getOrderDetail,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/paystack-webhook', handlePaystackWebhook);

router.get('/checkout-summary', authenticate, authorize('customer'), getCheckoutSummary);
router.post('/', authenticate, authorize('customer'), placeOrder);
router.get('/', authenticate, authorize('customer'), getMyOrders);

// Specific routes before parameterized :orderId
router.get('/vendor', authenticate, authorize('vendor'), getVendorOrders);
router.get('/admin', authenticate, authorize('admin'), getAdminOrders);

router.patch('/:orderId/status', authenticate, authorize('vendor', 'admin'), updateStatus);
router.patch('/:orderId/confirm-payment', authenticate, authorize('vendor', 'agent', 'admin'), confirmPayment);
router.get('/:orderId', authenticate, authorize('customer', 'vendor', 'admin', 'agent'), getOrderDetail);

module.exports = router;
