const pool = require('../config/db');
const {
  createOrderFromCart,
  findOrderById,
  listOrdersByCustomer,
  listOrdersByVendor,
  updateOrderStatus,
  confirmPaymentReceived,
  listAllOrdersForAdmin,
  computeCartTotal,
  DELIVERY_FEE,
} = require('../models/orderModel');
const { getCartWithItems } = require('../models/cartModel');
const { isPaystackConfigured, verifyPaystackTransaction } = require('../utils/paystack');

const PAYMENT_METHODS = ['card', 'bank_transfer', 'cash_on_delivery'];

// Called right before opening payment / checkout, dynamically calculating
// delivery fee according to fulfillment type (Home Delivery vs Self-Pickup).
const getCheckoutSummary = async (req, res) => {
  try {
    const fulfillmentType = req.query.fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
    const { items } = await getCartWithItems(req.user.userId);
    const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');
    const itemsTotal = computeCartTotal(purchasable);
    const fee = fulfillmentType === 'pickup' ? 0.0 : DELIVERY_FEE;
    const finalTotal = itemsTotal > 0 ? itemsTotal + fee : 0;

    return res.status(200).json({
      itemsTotal,
      deliveryFee: fee,
      total: finalTotal,
      fulfillmentType,
      itemCount: purchasable.reduce((sum, item) => sum + item.quantity, 0),
      paystackConfigured: isPaystackConfigured(),
    });
  } catch (err) {
    console.error('getCheckoutSummary error:', err);
    return res.status(500).json({ message: 'Could not prepare checkout.' });
  }
};

const placeOrder = async (req, res) => {
  try {
    const {
      deliveryAddress,
      fulfillmentType = 'delivery',
      paymentMethod,
      paystackReference,
      transferReference,
    } = req.body;

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ message: 'Delivery or Pickup address is required.' });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.` });
    }

    // ENFORCED BUSINESS RULE:
    // Home delivery requires upfront payment (Card or Bank Transfer).
    // Cash is only allowed for Self-Pickup at the vendor stall.
    if (fulfillmentType === 'delivery' && paymentMethod === 'cash_on_delivery') {
      return res.status(400).json({
        message: 'Prepayment via Debit Card or Bank Transfer is required for Home Delivery. If you wish to pay cash, please select Self-Pickup.',
      });
    }

    let paymentStatus = 'pending';
    let reference = null;

    if (paymentMethod === 'card') {
      if (!paystackReference) {
        return res.status(400).json({ message: 'paystackReference is required for card payments.' });
      }

      // Prevent Paystack reference reuse vulnerability
      const existingRef = await pool.query('SELECT order_id FROM orders WHERE payment_reference = $1', [paystackReference]);
      if (existingRef.rows.length > 0) {
        return res.status(409).json({ message: 'This payment transaction reference has already been used.' });
      }

      if (!isPaystackConfigured()) {
        return res.status(503).json({ message: 'Card payments are not configured on this server yet.' });
      }

      const verified = await verifyPaystackTransaction(paystackReference);
      if (verified.status !== 'success') {
        return res.status(402).json({ message: 'Payment was not successful.' });
      }

      paymentStatus = 'paid';
      reference = paystackReference;
    } else if (paymentMethod === 'bank_transfer') {
      // Bank Transfer verification
      reference = transferReference || `TRF-${Date.now()}`;
      paymentStatus = 'paid'; // Bank transfer marked paid upon submission of transaction proof
    }

    const { orderId, orderCode, total, itemsTotal, deliveryFee } = await createOrderFromCart({
      customerId: req.user.userId,
      deliveryAddress,
      fulfillmentType,
      paymentMethod,
      paymentStatus,
      paymentReference: reference,
    });

    return res.status(201).json({
      message: 'Order placed successfully.',
      orderId,
      orderCode,
      total,
      itemsTotal,
      deliveryFee,
      paymentStatus,
      fulfillmentType,
    });
  } catch (err) {
    console.error('placeOrder error:', err);
    return res.status(500).json({ message: err.message || 'Could not place your order.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await listOrdersByCustomer(req.user.userId);
    return res.status(200).json({ orders });
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ message: 'Could not fetch your orders.' });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const orders = await listOrdersByVendor(req.user.userId);
    return res.status(200).json({ orders });
  } catch (err) {
    console.error('getVendorOrders error:', err);
    return res.status(500).json({ message: 'Could not fetch shop orders.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required.' });
    }
    const vendorId = req.user.role === 'vendor' ? req.user.userId : null;
    const order = await updateOrderStatus(req.params.orderId, status, vendorId);
    return res.status(200).json({ message: 'Order status updated.', order });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(400).json({ message: err.message || 'Could not update order status.' });
  }
};

// Confirm payment received (vendor, agent, admin)
const confirmPayment = async (req, res) => {
  try {
    const order = await confirmPaymentReceived(req.params.orderId, req.user.userId);
    return res.status(200).json({ message: 'Payment confirmed as received.', order });
  } catch (err) {
    console.error('confirmPayment error:', err);
    return res.status(400).json({ message: err.message || 'Could not confirm payment.' });
  }
};

// Paystack Webhook Handler (background fulfillment confirmation)
const handlePaystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (event && event.event === 'charge.success') {
      const reference = event.data?.reference;
      if (reference) {
        await pool.query(
          `UPDATE orders
           SET payment_status = 'paid', order_status = 'confirmed', updated_at = NOW()
           WHERE payment_reference = $1`,
          [reference]
        );
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const orders = await listAllOrdersForAdmin();
    return res.status(200).json({ orders });
  } catch (err) {
    console.error('getAdminOrders error:', err);
    return res.status(500).json({ message: 'Could not fetch platform orders.' });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const customerId = req.user.role === 'customer' ? req.user.userId : null;
    const order = await findOrderById(req.params.orderId, customerId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (req.user.role === 'vendor') {
      const hasItem = order.items.some((item) => item.vendor_id === req.user.userId);
      if (!hasItem) {
        return res.status(403).json({ message: 'You do not have items in this order.' });
      }
    }
    return res.status(200).json({ order });
  } catch (err) {
    console.error('getOrderDetail error:', err);
    return res.status(500).json({ message: 'Could not fetch this order.' });
  }
};

module.exports = {
  getCheckoutSummary,
  placeOrder,
  getMyOrders,
  getVendorOrders,
  updateStatus,
  confirmPayment,
  handlePaystackWebhook,
  getAdminOrders,
  getOrderDetail,
};
