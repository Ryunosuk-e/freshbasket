const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getCheckoutSummary, placeOrder, getMyOrders, getOrderDetail } = require('../controllers/orderController');

const router = express.Router();

router.get('/checkout-summary', authenticate, authorize('customer'), getCheckoutSummary);
router.post('/', authenticate, authorize('customer'), placeOrder);
router.get('/', authenticate, authorize('customer'), getMyOrders);
router.get('/:orderId', authenticate, authorize('customer'), getOrderDetail);

module.exports = router;
