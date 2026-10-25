const pool = require('../config/db');

// Aggregates real-time platform statistics for the Admin Console
const getPlatformStats = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS total_customers,
      (SELECT COUNT(*)::int FROM vendors) AS total_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'pending') AS pending_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'verified') AS verified_vendors,
      (SELECT COUNT(*)::int FROM vendors WHERE verification_status = 'rejected') AS rejected_vendors,
      (SELECT COUNT(*)::int FROM orders) AS total_orders,
      (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE) AS total_products,
      (SELECT COUNT(*)::int FROM order_disputes WHERE status = 'open') AS open_disputes
  `);
  
  const row = result.rows[0];
  return {
    ...row,
    // Provide explicit camelCase aliases matching the frontend props
    customersCount: row.total_customers,
    totalVendorsCount: row.total_vendors,
    pendingVendorsCount: row.pending_vendors,
    verifiedVendorsCount: row.verified_vendors,
    rejectedVendorsCount: row.rejected_vendors,
    totalOrdersCount: row.total_orders,
    productsCount: row.total_products,
    openDisputesCount: row.open_disputes,
  };
};

module.exports = { getPlatformStats };
