const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  submitDispute,
  getCustomerDisputes,
  getAllDisputes,
  updateDispute,
} = require('../controllers/disputeController');

const router = express.Router();

router.get('/mine', authenticate, authorize('customer'), getCustomerDisputes);
router.post('/order/:orderId', authenticate, authorize('customer'), submitDispute);

// Admin oversight
router.get('/', authenticate, authorize('admin'), getAllDisputes);
router.patch('/:disputeId/resolve', authenticate, authorize('admin'), updateDispute);

module.exports = router;
