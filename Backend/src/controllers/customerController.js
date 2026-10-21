const { findCustomerByUserId, completeCustomerProfile } = require('../models/customerModel');

const PAYMENT_METHODS = ['card', 'cash_on_delivery'];

const getMyProfile = async (req, res) => {
  try {
    const customer = await findCustomerByUserId(req.user.userId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found.' });
    }
    return res.status(200).json({ customer });
  } catch (err) {
    console.error('getMyProfile (customer) error:', err);
    return res.status(500).json({ message: 'Could not fetch your profile.' });
  }
};

// Backs the Complete Your Profile step for customers — delivery address
// becomes required here even though it was optional at registration.
const updateMyProfile = async (req, res) => {
  try {
    const { deliveryAddress, preferredPaymentMethod } = req.body;

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }
    if (preferredPaymentMethod && !PAYMENT_METHODS.includes(preferredPaymentMethod)) {
      return res.status(400).json({
        message: `preferredPaymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.`,
      });
    }

    const customer = await completeCustomerProfile({
      customerId: req.user.userId,
      defaultDeliveryAddress: deliveryAddress,
      preferredPaymentMethod: preferredPaymentMethod || null,
    });

    return res.status(200).json({ message: 'Profile completed.', customer });
  } catch (err) {
    console.error('updateMyProfile (customer) error:', err);
    return res.status(500).json({ message: 'Could not update your profile.' });
  }
};

module.exports = { getMyProfile, updateMyProfile };
