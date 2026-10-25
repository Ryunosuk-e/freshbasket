const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getMyDeliveries, updateDeliveryStatus } = require('../controllers/deliveryController');

const router = express.Router();

router.get('/mine', authenticate, authorize('agent'), getMyDeliveries);
router.patch('/:assignmentId/status', authenticate, authorize('agent'), updateDeliveryStatus);

module.exports = router;
