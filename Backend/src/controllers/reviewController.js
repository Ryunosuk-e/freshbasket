const { createReview, getReviewsByProduct } = require('../models/reviewModel');

const postReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required.' });
    }
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5.' });
    }

    const review = await createReview({
      productId: Number(productId),
      customerId: req.user.userId,
      rating: numRating,
      comment: comment?.trim() || null,
    });

    return res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error('postReview error:', err);
    return res.status(500).json({ message: 'Could not submit review.' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const data = await getReviewsByProduct(req.params.productId);
    return res.status(200).json(data);
  } catch (err) {
    console.error('getProductReviews error:', err);
    return res.status(500).json({ message: 'Could not fetch reviews.' });
  }
};

module.exports = { postReview, getProductReviews };
