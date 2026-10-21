const pool = require('../config/db');

const createCustomerProfile = async ({ customerId, defaultDeliveryAddress }) => {
  const result = await pool.query(
    `INSERT INTO customers (customer_id, default_delivery_address)
     VALUES ($1, $2)
     RETURNING *`,
    [customerId, defaultDeliveryAddress]
  );
  return result.rows[0];
};

const findCustomerByUserId = async (customerId) => {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.profile_completed, u.created_at,
            c.default_delivery_address, c.preferred_payment_method
     FROM customers c
     JOIN users u ON u.user_id = c.customer_id
     WHERE c.customer_id = $1`,
    [customerId]
  );
  return result.rows[0];
};

// Saves the Complete Your Profile fields and marks the account complete in
// one transaction, so the two tables can't end up out of sync if the second
// query somehow failed on its own.
const completeCustomerProfile = async ({ customerId, defaultDeliveryAddress, preferredPaymentMethod }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE customers
       SET default_delivery_address = $2, preferred_payment_method = $3
       WHERE customer_id = $1
       RETURNING *`,
      [customerId, defaultDeliveryAddress, preferredPaymentMethod]
    );
    await client.query('UPDATE users SET profile_completed = TRUE WHERE user_id = $1', [customerId]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Backs the admin dashboard's "All Customers" view.
const listAllCustomers = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.profile_completed, u.created_at,
            c.default_delivery_address, c.preferred_payment_method
     FROM customers c
     JOIN users u ON u.user_id = c.customer_id
     ORDER BY u.created_at DESC`
  );
  return result.rows;
};

module.exports = { createCustomerProfile, findCustomerByUserId, completeCustomerProfile, listAllCustomers };

