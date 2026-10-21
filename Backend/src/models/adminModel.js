const pool = require('../config/db');

// One query, five subquery counts — cheap enough at this scale, and keeps
// the "how many of X" logic in one place instead of scattered across
// customer/vendor models.
const getPlatformStats = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM customers) AS total_customers,
      (SELECT COUNT(*)::int FROM vendors) AS total_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'pending') AS pending_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'verified') AS verified_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'rejected') AS rejected_vendors
  `);
  return result.rows[0];
};

module.exports = { getPlatformStats };
