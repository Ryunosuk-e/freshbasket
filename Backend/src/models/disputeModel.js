const pool = require('../config/db');

const createDispute = async ({ orderId, customerId, reason }) => {
  const result = await pool.query(
    `INSERT INTO order_disputes (order_id, customer_id, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderId, customerId, reason]
  );
  const dispute = result.rows[0];

  // Notify admins
  const adminUsers = await pool.query(`SELECT user_id FROM users WHERE role = 'admin'`);
  for (const admin of adminUsers.rows) {
    await pool.query(
      `INSERT INTO notifications (recipient_id, channel, type, message)
       VALUES ($1, 'in_app', 'new_dispute', $2)`,
      [admin.user_id, `A dispute has been submitted for Order #${orderId}. Reason: "${reason.substring(0, 50)}..."`]
    );
  }

  return dispute;
};

const listDisputesByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT d.*, o.order_code, o.total_amount, o.order_status
     FROM order_disputes d
     JOIN orders o ON o.order_id = d.order_id
     WHERE d.customer_id = $1
     ORDER BY d.created_at DESC`,
    [customerId]
  );
  return result.rows;
};

const listAllDisputes = async () => {
  const result = await pool.query(
    `SELECT d.*, o.order_code, o.total_amount, o.order_status,
            u.full_name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone
     FROM order_disputes d
     JOIN orders o ON o.order_id = d.order_id
     JOIN users u ON u.user_id = d.customer_id
     ORDER BY (d.status = 'open') DESC, d.created_at DESC`
  );
  return result.rows;
};

const resolveDispute = async (disputeId, status, resolution) => {
  const result = await pool.query(
    `UPDATE order_disputes
     SET status = $2, resolution = $3, updated_at = NOW()
     WHERE dispute_id = $1
     RETURNING *`,
    [disputeId, status, resolution]
  );
  const dispute = result.rows[0];
  if (!dispute) return null;

  // Notify customer
  await pool.query(
    `INSERT INTO notifications (recipient_id, channel, type, message)
     VALUES ($1, 'in_app', 'dispute_resolved', $2)`,
    [dispute.customer_id, `Your dispute for order #${dispute.order_id} has been ${status}. Resolution: "${resolution}"`]
  );

  return dispute;
};

module.exports = {
  createDispute,
  listDisputesByCustomer,
  listAllDisputes,
  resolveDispute,
};
