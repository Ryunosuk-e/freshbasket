const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getMyProducts, addProduct, editProduct, getProducts, getProductDetail } = require('../controllers/productController');

const router = express.Router();

// Public browsing — no auth. Registered above /:productId isn't strictly
// necessary here since "/" only matches an empty path, but /mine below
// MUST stay above /:productId, or a GET to /mine would be read as
// :productId = "mine" and never reach getMyProducts.
router.get('/', getProducts);

router.get('/mine', authenticate, authorize('vendor'), getMyProducts);
router.post('/', authenticate, authorize('vendor'), upload.array('images', 4), addProduct);
router.patch('/:productId', authenticate, authorize('vendor'), upload.array('images', 4), editProduct);

router.get('/:productId', getProductDetail);

module.exports = router;
