const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getCart, addItem, updateItem, removeItem } = require('../controllers/cartController');

const router = express.Router();

router.get('/', authenticate, authorize('customer'), getCart);
router.post('/items', authenticate, authorize('customer'), addItem);
router.patch('/items/:productId', authenticate, authorize('customer'), updateItem);
router.delete('/items/:productId', authenticate, authorize('customer'), removeItem);

module.exports = router;
