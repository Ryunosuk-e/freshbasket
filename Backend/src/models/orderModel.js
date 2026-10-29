const pool = require('../config/db');
const { getCartWithItems } = require('./cartModel');
const { notifyDriverAssignment } = require('../utils/dispatchNotifications');

// Recomputed from the CURRENT cart server-side, always — a client-supplied
// total is never trusted.
const computeCartTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.unit_price || item.price) * item.quantity, 0);

const DELIVERY_FEE = 1200.0; // Local Nsukka flat delivery rate

const generateOrderCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${randomStr}`;
};

const createOrderFromCart = async ({
  customerId,
  deliveryAddress,
  fulfillmentType = 'delivery',
  paymentMethod,
  paymentStatus,
  paymentReference,
}) => {
  const { cartId, items } = await getCartWithItems(customerId);
  const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');

  if (purchasable.length === 0) {
    throw new Error('Your cart has no items available to order.');
  }

  const isDelivery = fulfillmentType === 'delivery';
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0.0;
  const itemsTotal = computeCartTotal(purchasable);
  const totalWithDelivery = itemsTotal + deliveryFee;

  let orderCode = generateOrderCode();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create order record with alphanumeric code
    const orderResult = await client.query(
      `INSERT INTO orders (
         order_code, customer_id, delivery_address, fulfillment_type,
         payment_method, payment_status, payment_reference,
         delivery_fee, requires_delivery, total_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING order_id, order_code, created_at`,
      [
        orderCode,
        customerId,
        deliveryAddress,
        fulfillmentType,
        paymentMethod,
        paymentStatus,
        paymentReference,
        deliveryFee,
        isDelivery,
        totalWithDelivery,
      ]
    );
    const { order_id: orderId, order_code: finalOrderCode } = orderResult.rows[0];

    // 2. Insert items AND atomically deduct stock (NFR02 ACID transaction)
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

      const unitPrice = Number(item.unit_price || item.price);
      const packagingUnit = item.packaging_unit || item.unit || 'unit';

      await client.query(
        `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, packaging_unit, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id, item.vendor_id, item.name, packagingUnit, unitPrice, item.quantity, unitPrice * item.quantity]
      );
    }

    // 3. Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    // 4. Delivery Agent Assignment (Only if home delivery requested)
    let assignedAgentId = null;
    if (isDelivery) {
      const agentRes = await client.query(
        `SELECT agent_id FROM delivery_agents WHERE current_status = 'available' LIMIT 1`
      );
      assignedAgentId = agentRes.rows[0]?.agent_id || null;

      await client.query(
        `INSERT INTO delivery_assignments (order_id, agent_id, delivery_address, status)
         VALUES ($1, $2, $3, $4)`,
        [orderId, assignedAgentId, deliveryAddress, 'assigned']
      );

      if (assignedAgentId) {
        await client.query(
          `UPDATE delivery_agents SET current_status = 'busy', assigned_order_id = $1 WHERE agent_id = $2`,
          [orderId, assignedAgentId]
        );
      }
    }

    // 5. In-App Notifications (FR12)
    await client.query(
      `INSERT INTO notifications (recipient_id, channel, type, title, message)
       VALUES ($1, 'in_app', 'order_placed', 'Order Placed Successfully', $2)`,
      [customerId, `Order ${finalOrderCode} placed successfully. Total: ₦${totalWithDelivery.toLocaleString()}`]
    );

    for (const vId of vendorIds) {
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, type, title, message)
         VALUES ($1, 'in_app', 'new_order', 'New Customer Order Received', $2)`,
        [vId, `New order ${finalOrderCode} received for your store items.`]
      );
    }

    // 6. Notify Driver via Multi-Channel (SMS, WhatsApp, Email, In-App)
    if (assignedAgentId) {
      notifyDriverAssignment({
        agentId: assignedAgentId,
        orderCode: finalOrderCode,
        pickupAddress: 'Ogige Market Vendor Stalls',
        deliveryAddress,
        customerName: 'Customer',
        totalAmount: totalWithDelivery,
      }).catch((err) => console.error('Driver assignment dispatch error:', err));
    }

    await client.query('COMMIT');
    return { orderId, orderCode: finalOrderCode, total: totalWithDelivery, itemsTotal, deliveryFee };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findOrderById = async (orderId, customerId = null) => {
  const query = customerId
    ? `SELECT order_id, order_code, customer_id, delivery_address, fulfillment_type, payment_method,
              payment_status, order_status, delivery_fee, requires_delivery, total_amount, created_at
       FROM orders WHERE (order_id = $1::int OR order_code = $1::text) AND customer_id = $2`
    : `SELECT order_id, order_code, customer_id, delivery_address, fulfillment_type, payment_method,
              payment_status, order_status, delivery_fee, requires_delivery, total_amount, created_at
       FROM orders WHERE order_id = $1::int OR order_code = $1::text`;
  const params = customerId ? [orderId, customerId] : [orderId];

  const orderResult = await pool.query(query, params);
  const order = orderResult.rows[0];
  if (!order) return null;

  // Joined items with packaging unit
  const itemsResult = await pool.query(
    `SELECT oi.product_id, oi.vendor_id, v.shop_name, COALESCE(v.market_zone, 'Ogige Market') AS market_zone,
            oi.product_name, oi.packaging_unit, oi.unit_price, oi.quantity, oi.line_total,
            p.unit
     FROM order_items oi
     JOIN vendors v ON v.vendor_id = oi.vendor_id
     LEFT JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [order.order_id]
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
    [order.order_id]
  );

  return {
    ...order,
    items: itemsResult.rows,
    delivery: deliveryResult.rows[0] || null,
  };
};

const listOrdersByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT o.order_id, o.order_code, o.fulfillment_type, o.payment_method, o.payment_status,
            o.order_status, o.total_amount, o.delivery_fee, o.created_at,
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
    `SELECT DISTINCT o.order_id, o.order_code, o.delivery_address, o.fulfillment_type,
            o.payment_method, o.payment_status, o.order_status, o.total_amount, o.delivery_fee, o.created_at,
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
    `SELECT oi.order_id, oi.product_id, oi.product_name, oi.packaging_unit, oi.unit_price, oi.quantity, oi.line_total,
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
    `UPDATE orders
     SET order_status = $2::varchar,
         payment_status = CASE WHEN $2::varchar = 'delivered' AND payment_status = 'pending' THEN 'paid' ELSE payment_status END,
         updated_at = NOW()
     WHERE order_id = $1
     RETURNING *`,
    [orderId, newStatus]
  );
  const order = result.rows[0];

  if (order) {
    const displayCode = order.order_code || `#${orderId}`;
    await pool.query(
      `INSERT INTO notifications (recipient_id, channel, type, title, message)
       VALUES ($1, 'in_app', 'order_status_update', 'Order Status Update', $2)`,
      [order.customer_id, `Your order ${displayCode} status has been updated to "${newStatus.replace('_', ' ')}".`]
    );
  }

  return order;
};

const confirmPaymentReceived = async (orderId, actorId = null) => {
  const result = await pool.query(
    `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE order_id = $1 RETURNING *`,
    [orderId]
  );
  const order = result.rows[0];
  if (!order) throw new Error('Order not found.');

  const displayCode = order.order_code || `#${orderId}`;
  await pool.query(
    `INSERT INTO notifications (recipient_id, channel, type, title, message)
     VALUES ($1, 'in_app', 'payment_confirmed', 'Payment Confirmed', $2)`,
    [order.customer_id, `Payment for order ${displayCode} has been confirmed received.`]
  );

  return order;
};

const listAllOrdersForAdmin = async () => {
  const result = await pool.query(
    `SELECT o.order_id, o.order_code, o.customer_id, o.delivery_address, o.fulfillment_type,
            o.payment_method, o.payment_status, o.order_status, o.total_amount, o.delivery_fee, o.created_at,
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
  generateOrderCode,
  createOrderFromCart,
  findOrderById,
  listOrdersByCustomer,
  listOrdersByVendor,
  updateOrderStatus,
  confirmPaymentReceived,
  listAllOrdersForAdmin,
  computeCartTotal,
  DELIVERY_FEE,
};
