const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { postReview, getProductReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, authorize('customer'), postReview);

module.exports = router;
