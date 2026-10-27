const pool = require('../config/db');

/**
 * Dispatches multi-channel driver assignment notification via SMS, WhatsApp, Email, and In-App Mail.
 */
async function notifyDriverAssignment({ agentId, orderCode, pickupAddress, deliveryAddress, customerName, totalAmount }) {
  try {
    const agentRes = await pool.query(
      `SELECT u.user_id, u.full_name, u.phone_number, u.email, da.vehicle_type
       FROM users u
       JOIN delivery_agents da ON da.agent_id = u.user_id
       WHERE u.user_id = $1`,
      [agentId]
    );

    const agent = agentRes.rows[0];
    if (!agent) {
      console.log(`[Dispatch Alert] Agent ${agentId} not found for assignment notification.`);
      return;
    }

    const cleanPhone = (agent.phone_number || '').replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;

    const messageText = `FreshBasket Dispatch: Order #${orderCode} assigned to you. Pickup: ${pickupAddress || 'Ogige Market Vendors'}. Delivery: ${deliveryAddress}. Recipient: ${customerName || 'Customer'}. Open app to view routes.`;

    // 1. In-App Mail / Notification
    await pool.query(
      `INSERT INTO notifications (recipient_id, channel, type, title, message, metadata)
       VALUES ($1, 'in_app', 'delivery_assignment', $2, $3, $4)`,
      [
        agent.user_id,
        `New Delivery Assignment: #${orderCode}`,
        messageText,
        JSON.stringify({
          orderCode,
          pickupAddress,
          deliveryAddress,
          customerName,
          totalAmount,
        }),
      ]
    );

    // 2. SMS Dispatch (Console log & Termii/Twilio ready payload)
    console.log(`[SMS DISPATCH -> ${agent.phone_number} (${intlPhone})]:`);
    console.log(`  Sender: FreshBasket`);
    console.log(`  Message: ${messageText}`);

    // 3. WhatsApp Dispatch (Formatted wa.me direct alert link & API log)
    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
      `📦 *FreshBasket New Delivery Assignment*\n\n*Order:* #${orderCode}\n*Pickup:* ${pickupAddress || 'Ogige Market Hub'}\n*Delivery:* ${deliveryAddress}\n*Customer:* ${customerName || 'Customer'}\n\nPlease proceed to pickup location promptly.`
    )}`;
    console.log(`[WHATSAPP DISPATCH -> ${intlPhone}]:`);
    console.log(`  Direct Link: ${waUrl}`);

    // 4. Email Dispatch (HTML Mailer simulation & logger)
    console.log(`[EMAIL DISPATCH -> ${agent.email}]:`);
    console.log(`  Subject: New Delivery Assignment: #${orderCode}`);
    console.log(`  Body: Hello ${agent.full_name}, You have a new delivery run assigned in Nsukka. Destination: ${deliveryAddress}.`);

    return { success: true, agentName: agent.full_name, phone: agent.phone_number };
  } catch (err) {
    console.error('Error dispatching driver assignment notification:', err);
  }
}

module.exports = { notifyDriverAssignment };
