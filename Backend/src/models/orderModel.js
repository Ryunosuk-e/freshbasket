const pool = require('../config/db');
const { getCartWithItems } = require('./cartModel');

// Recomputed from the CURRENT cart server-side, always — a client-supplied
// total is never trusted, since that's exactly how someone could otherwise
// pay for less than what's actually in their cart.
const computeCartTotal = (items) => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

const createOrderFromCart = async ({ customerId, deliveryAddress, paymentMethod, paymentStatus, paymentReference }) => {
  const { cartId, items } = await getCartWithItems(customerId);
  const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');

  if (purchasable.length === 0) {
    throw new Error('Your cart has no items available to order.');
  }

  const total = computeCartTotal(purchasable);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, delivery_address, payment_method, payment_status, payment_reference, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING order_id, created_at`,
      [customerId, deliveryAddress, paymentMethod, paymentStatus, paymentReference, total]
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of purchasable) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.vendor_id, item.name, item.price, item.quantity, Number(item.price) * item.quantity]
      );
    }

    // The cart's contents have become an order — empty it so the next
    // visit to /cart starts fresh.
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');
    return { orderId, total };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findOrderById = async (orderId, customerId) => {
  const orderResult = await pool.query(
    `SELECT order_id, delivery_address, payment_method, payment_status, order_status, total_amount, created_at
     FROM orders WHERE order_id = $1 AND customer_id = $2`,
    [orderId, customerId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;

  const itemsResult = await pool.query(
    `SELECT oi.product_id, oi.vendor_id, v.shop_name, oi.product_name, oi.unit_price, oi.quantity, oi.line_total
     FROM order_items oi
     JOIN vendors v ON v.vendor_id = oi.vendor_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return { ...order, items: itemsResult.rows };
};

const listOrdersByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT order_id, payment_method, payment_status, order_status, total_amount, created_at
     FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );
  return result.rows;
};

module.exports = { createOrderFromCart, findOrderById, listOrdersByCustomer, computeCartTotal };
