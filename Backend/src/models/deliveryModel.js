const pool = require('../config/db');

const getAgentDeliveries = async (agentId) => {
  const result = await pool.query(
    `SELECT da.assignment_id, da.order_id, da.pickup_address, da.delivery_address,
            da.status AS assignment_status, da.assigned_at, da.delivered_at,
            o.total_amount, o.payment_method, o.payment_status, o.order_status,
            u.full_name AS customer_name, u.phone_number AS customer_phone
     FROM delivery_assignments da
     JOIN orders o ON o.order_id = da.order_id
     JOIN users u ON u.user_id = o.customer_id
     WHERE da.agent_id = $1
     ORDER BY da.assigned_at DESC`,
    [agentId]
  );

  const deliveries = result.rows;
  if (deliveries.length === 0) return [];

  const orderIds = deliveries.map((d) => d.order_id);
  const itemsResult = await pool.query(
    `SELECT oi.order_id, oi.product_name, oi.quantity, oi.unit_price, v.shop_name, v.business_address
     FROM order_items oi
     JOIN vendors v ON v.vendor_id = oi.vendor_id
     WHERE oi.order_id = ANY($1::int[])`,
    [orderIds]
  );

  const itemsByOrder = {};
  for (const item of itemsResult.rows) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  return deliveries.map((d) => ({
    ...d,
    items: itemsByOrder[d.order_id] || [],
  }));
};

const updateAssignmentStatus = async (assignmentId, agentId, status) => {
  const VALID_STATUSES = ['assigned', 'picked_up', 'delivered', 'failed'];
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid delivery status: ${status}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignResult = await client.query(
      `SELECT da.order_id, o.customer_id
       FROM delivery_assignments da
       JOIN orders o ON o.order_id = da.order_id
       WHERE da.assignment_id = $1 AND da.agent_id = $2`,
      [assignmentId, agentId]
    );

    if (assignResult.rows.length === 0) {
      throw new Error('Delivery assignment not found or does not belong to you.');
    }

    const { order_id: orderId, customer_id: customerId } = assignResult.rows[0];

    const deliveredAt = status === 'delivered' ? 'NOW()' : 'NULL';
    const updatedAssign = await client.query(
      `UPDATE delivery_assignments
       SET status = $1, delivered_at = ${status === 'delivered' ? 'NOW()' : 'delivered_at'}
       WHERE assignment_id = $2
       RETURNING *`,
      [status, assignmentId]
    );

    // Sync with main order status
    let newOrderStatus = null;
    if (status === 'picked_up') {
      newOrderStatus = 'out_for_delivery';
    } else if (status === 'delivered') {
      newOrderStatus = 'delivered';
      // Free up the agent
      await client.query(
        `UPDATE delivery_agents SET current_status = 'available', assigned_order_id = NULL WHERE agent_id = $1`,
        [agentId]
      );
    }

    if (newOrderStatus) {
      await client.query(
        `UPDATE orders SET order_status = $1, updated_at = NOW() WHERE order_id = $2`,
        [newOrderStatus, orderId]
      );

      // Notification to customer
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, type, message)
         VALUES ($1, 'in_app', 'delivery_update', $2)`,
        [customerId, `Your order #${orderId} is now ${newOrderStatus.replace(/_/g, ' ')}!`]
      );
    }

    await client.query('COMMIT');
    return updatedAssign.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAgentDeliveries, updateAssignmentStatus };
