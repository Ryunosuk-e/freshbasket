const pool = require('../config/db');

const createReview = async ({ productId, customerId, rating, comment }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reviewResult = await client.query(
      `INSERT INTO reviews (product_id, customer_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, customerId, rating, comment || null]
    );
    const newReview = reviewResult.rows[0];

    // Find the vendor of this product to update vendor average rating
    const prodResult = await client.query('SELECT vendor_id FROM products WHERE product_id = $1', [productId]);
    if (prodResult.rows[0]) {
      const vendorId = prodResult.rows[0].vendor_id;
      const avgResult = await client.query(
        `SELECT ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM reviews r
         JOIN products p ON p.product_id = r.product_id
         WHERE p.vendor_id = $1`,
        [vendorId]
      );
      const newAvg = avgResult.rows[0]?.avg_rating || 0.0;
      await client.query('UPDATE vendors SET average_rating = $1 WHERE vendor_id = $2', [newAvg, vendorId]);
    }

    await client.query('COMMIT');
    return newReview;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getReviewsByProduct = async (productId) => {
  const reviewsResult = await pool.query(
    `SELECT r.review_id, r.product_id, r.customer_id, r.rating, r.comment, r.created_at,
            u.full_name AS customer_name
     FROM reviews r
     JOIN users u ON u.user_id = r.customer_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );

  const statsResult = await pool.query(
    `SELECT COUNT(*)::int AS total_reviews,
            ROUND(AVG(rating)::numeric, 1) AS average_rating
     FROM reviews
     WHERE product_id = $1`,
    [productId]
  );

  const stats = statsResult.rows[0] || { total_reviews: 0, average_rating: 0.0 };

  return {
    reviews: reviewsResult.rows,
    totalReviews: stats.total_reviews,
    averageRating: stats.average_rating ? Number(stats.average_rating) : 0,
  };
};

module.exports = { createReview, getReviewsByProduct };
