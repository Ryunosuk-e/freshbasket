const pool = require('../config/db');
const { getCartWithItems } = require('./cartModel');

// Recomputed from the CURRENT cart server-side, always — a client-supplied
// total is never trusted, since that's exactly how someone could otherwise
// pay for less than what's actually in their cart.
const computeCartTotal = (items) => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

const DELIVERY_FEE = 500.0; // Local Nsukka delivery flat rate

const createOrderFromCart = async ({
  customerId,
  deliveryAddress,
  paymentMethod,
  paymentStatus,
  paymentReference,
}) => {
  const { cartId, items } = await getCartWithItems(customerId);
  const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');

  if (purchasable.length === 0) {
    throw new Error('Your cart has no items available to order.');
  }

  const itemsTotal = computeCartTotal(purchasable);
  const totalWithDelivery = itemsTotal + DELIVERY_FEE;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create order record
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, delivery_address, payment_method, payment_status, payment_reference, delivery_fee, requires_delivery, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING order_id, created_at`,
      [customerId, deliveryAddress, paymentMethod, paymentStatus, paymentReference, DELIVERY_FEE, true, totalWithDelivery]
    );
    const orderId = orderResult.rows[0].order_id;

    // 2. Insert items AND atomically deduct stock (NFR05 - ACID transaction consistency)
    const vendorIds = new Set();
    for (const item of purchasable) {
      const stockUpdate = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (stockUpdate.rowCount === 0) {
        throw new Error(`Insufficient stock for "${item.name}". Only a limited quantity is available.`);
      }

      vendorIds.add(item.vendor_id);

      await client.query(
        `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.vendor_id, item.name, item.price, item.quantity, Number(item.price) * item.quantity]
      );
    }

    // 3. Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    // 4. Delivery Agent Assignment (FR09 / UC11)
    // Find an available delivery agent
    const agentRes = await client.query(
      `SELECT agent_id FROM delivery_agents WHERE current_status = 'available' LIMIT 1`
    );
    const assignedAgentId = agentRes.rows[0]?.agent_id || null;

    await client.query(
      `INSERT INTO delivery_assignments (order_id, agent_id, delivery_address, status)
       VALUES ($1, $2, $3, $4)`,
      [orderId, assignedAgentId, deliveryAddress, assignedAgentId ? 'assigned' : 'assigned']
    );

    if (assignedAgentId) {
      await client.query(
        `UPDATE delivery_agents SET current_status = 'busy', assigned_order_id = $1 WHERE agent_id = $2`,
        [orderId, assignedAgentId]
      );
    }

    // 5. In-App Notifications (FR12)
    // Customer notification
    await client.query(
      `INSERT INTO notifications (recipient_id, channel, type, message)
       VALUES ($1, 'in_app', 'order_placed', $2)`,
      [customerId, `Order #${orderId} has been placed successfully. Total: ₦${totalWithDelivery.toLocaleString()}`]
    );

    // Vendor notification(s)
    for (const vId of vendorIds) {
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, type, message)
         VALUES ($1, 'in_app', 'new_order', $2)`,
        [vId, `New order #${orderId} received for your store items.`]
      );
    }

    await client.query('COMMIT');
    return { orderId, total: totalWithDelivery, itemsTotal, deliveryFee: DELIVERY_FEE };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findOrderById = async (orderId, customerId = null) => {
  const query = customerId
    ? `SELECT order_id, customer_id, delivery_address, payment_method, payment_status, order_status, delivery_fee, total_amount, created_at
       FROM orders WHERE order_id = $1 AND customer_id = $2`
    : `SELECT order_id, customer_id, delivery_address, payment_method, payment_status, order_status, delivery_fee, total_amount, created_at
       FROM orders WHERE order_id = $1`;
  const params = customerId ? [orderId, customerId] : [orderId];

  const orderResult = await pool.query(query, params);
  const order = orderResult.rows[0];
  if (!order) return null;

  // Joined items
  const itemsResult = await pool.query(
    `SELECT oi.product_id, oi.vendor_id, v.shop_name, oi.product_name, oi.unit_price, oi.quantity, oi.line_total,
            p.unit
     FROM order_items oi
     JOIN vendors v ON v.vendor_id = oi.vendor_id
     LEFT JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  // Delivery assignment & agent details (FR09)
  const deliveryResult = await pool.query(
    `SELECT da.assignment_id, da.status AS delivery_status, da.assigned_at, da.delivered_at,
            u.full_name AS agent_name, u.phone_number AS agent_phone,
            dag.vehicle_type
     FROM delivery_assignments da
     LEFT JOIN delivery_agents dag ON dag.agent_id = da.agent_id
     LEFT JOIN users u ON u.user_id = da.agent_id
     WHERE da.order_id = $1
     ORDER BY da.assignment_id DESC LIMIT 1`,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows,
    delivery: deliveryResult.rows[0] || null,
  };
};

const listOrdersByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT o.order_id, o.payment_method, o.payment_status, o.order_status, o.total_amount, o.delivery_fee, o.created_at,
            COUNT(oi.order_item_id)::int AS item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     WHERE o.customer_id = $1
     GROUP BY o.order_id
     ORDER BY o.created_at DESC`,
    [customerId]
  );
  return result.rows;
};

const listOrdersByVendor = async (vendorId) => {
  const ordersResult = await pool.query(
    `SELECT DISTINCT o.order_id, o.delivery_address, o.payment_method, o.payment_status,
            o.order_status, o.total_amount, o.created_at,
            u.full_name AS customer_name, u.phone_number AS customer_phone, u.email AS customer_email
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.order_id
     JOIN users u ON u.user_id = o.customer_id
     WHERE oi.vendor_id = $1
     ORDER BY o.created_at DESC`,
    [vendorId]
  );

  const orders = ordersResult.rows;
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.order_id);
  const itemsResult = await pool.query(
    `SELECT oi.order_id, oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.line_total,
            p.unit
     FROM order_items oi
     LEFT JOIN products p ON p.product_id = oi.product_id
     WHERE oi.vendor_id = $1 AND oi.order_id = ANY($2::int[])`,
    [vendorId, orderIds]
  );

  const itemsByOrder = {};
  for (const item of itemsResult.rows) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  return orders.map((order) => {
    const items = itemsByOrder[order.order_id] || [];
    const vendorTotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
    return {
      ...order,
      items,
      vendor_total: vendorTotal,
    };
  });
};

const updateOrderStatus = async (orderId, newStatus, vendorId = null) => {
  const VALID_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (vendorId) {
    const check = await pool.query(
      `SELECT 1 FROM order_items WHERE order_id = $1 AND vendor_id = $2 LIMIT 1`,
      [orderId, vendorId]
    );
    if (check.rows.length === 0) {
      throw new Error('You do not have permission to update this order.');
    }
  }

  const result = await pool.query(
    `UPDATE orders SET order_status = $2, updated_at = NOW() WHERE order_id = $1 RETURNING *`,
    [orderId, newStatus]
  );
  const order = result.rows[0];

  // Dispatch notification to customer (FR12)
  if (order) {
    await pool.query(
      `INSERT INTO notifications (recipient_id, channel, type, message)
       VALUES ($1, 'in_app', 'order_status_update', $2)`,
      [order.customer_id, `Your order #${orderId} status has been updated to "${newStatus.replace('_', ' ')}".`]
    );
  }

  return order;
};

const listAllOrdersForAdmin = async () => {
  const result = await pool.query(
    `SELECT o.order_id, o.customer_id, o.delivery_address, o.payment_method, o.payment_status,
            o.order_status, o.total_amount, o.delivery_fee, o.created_at,
            u.full_name AS customer_name, u.phone_number AS customer_phone, u.email AS customer_email,
            COUNT(oi.order_item_id)::int AS item_count
     FROM orders o
     JOIN users u ON u.user_id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     GROUP BY o.order_id, u.user_id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
};

module.exports = {
  createOrderFromCart,
  findOrderById,
  listOrdersByCustomer,
  listOrdersByVendor,
  updateOrderStatus,
  listAllOrdersForAdmin,
  computeCartTotal,
  DELIVERY_FEE,
};
