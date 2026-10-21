const { findCustomerByUserId, updateCustomerProfile } = require('../models/customerModel');

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

const updateMyProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, deliveryAddress, preferredPaymentMethod } = req.body;

    if (preferredPaymentMethod && !PAYMENT_METHODS.includes(preferredPaymentMethod)) {
      return res.status(400).json({
        message: `preferredPaymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.`,
      });
    }

    const customer = await updateCustomerProfile({
      customerId: req.user.userId,
      fullName: fullName?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      defaultDeliveryAddress: deliveryAddress?.trim() !== undefined ? deliveryAddress.trim() : undefined,
      preferredPaymentMethod: preferredPaymentMethod || undefined,
    });

    return res.status(200).json({ message: 'Profile updated successfully.', customer });
  } catch (err) {
    console.error('updateMyProfile (customer) error:', err);
    return res.status(500).json({ message: err.message || 'Could not update your profile.' });
  }
};

module.exports = { getMyProfile, updateMyProfile };
