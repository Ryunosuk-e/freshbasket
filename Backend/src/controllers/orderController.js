const {
  createOrderFromCart,
  findOrderById,
  listOrdersByCustomer,
  listOrdersByVendor,
  updateOrderStatus,
  listAllOrdersForAdmin,
  computeCartTotal,
} = require('../models/orderModel');
const { getCartWithItems } = require('../models/cartModel');
const { isPaystackConfigured, verifyPaystackTransaction } = require('../utils/paystack');

const PAYMENT_METHODS = ['card', 'cash_on_delivery'];

// Called right before the frontend opens the Paystack popup, so the amount
// charged always matches what's actually in the cart on the server right
// now, not a number the frontend has been holding onto.
const getCheckoutSummary = async (req, res) => {
  try {
    const { items } = await getCartWithItems(req.user.userId);
    const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');
    const total = computeCartTotal(purchasable);
    return res.status(200).json({
      total,
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
    const { deliveryAddress, paymentMethod, paystackReference } = req.body;

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.` });
    }

    let paymentStatus = 'pending'; // cash_on_delivery stays "pending" until paid on delivery

    if (paymentMethod === 'card') {
      if (!paystackReference) {
        return res.status(400).json({ message: 'paystackReference is required for card payments.' });
      }
      if (!isPaystackConfigured()) {
        return res.status(503).json({ message: 'Card payments are not configured on this server yet.' });
      }

      // Independently verify with Paystack — a "success" callback in the
      // browser is never enough on its own to mark something paid.
      const verified = await verifyPaystackTransaction(paystackReference);
      if (verified.status !== 'success') {
        return res.status(402).json({ message: 'Payment was not successful.' });
      }

      const { items } = await getCartWithItems(req.user.userId);
      const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');
      const expectedTotal = computeCartTotal(purchasable);
      const amountPaid = verified.amount / 100; // Paystack reports kobo
      if (Math.abs(amountPaid - expectedTotal) > 0.01) {
        return res.status(402).json({ message: 'Paid amount does not match your cart total.' });
      }

      paymentStatus = 'paid';
    }

    const { orderId, total } = await createOrderFromCart({
      customerId: req.user.userId,
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      paymentReference: paymentMethod === 'card' ? paystackReference : null,
    });

    return res.status(201).json({ message: 'Order placed.', orderId, total, paymentStatus });
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
  getAdminOrders,
  getOrderDetail,
};
