const {
  createDispute,
  listDisputesByCustomer,
  listAllDisputes,
  resolveDispute,
} = require('../models/disputeModel');

const submitDispute = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Please describe the issue with this order.' });
    }

    const dispute = await createDispute({
      orderId: Number(orderId),
      customerId: req.user.userId,
      reason: reason.trim(),
    });

    return res.status(201).json({ message: 'Dispute submitted successfully. Admin review is pending.', dispute });
  } catch (err) {
    console.error('submitDispute error:', err);
    return res.status(500).json({ message: 'Could not submit dispute.' });
  }
};

const getCustomerDisputes = async (req, res) => {
  try {
    const disputes = await listDisputesByCustomer(req.user.userId);
    return res.status(200).json({ disputes });
  } catch (err) {
    console.error('getCustomerDisputes error:', err);
    return res.status(500).json({ message: 'Could not fetch disputes.' });
  }
};

const getAllDisputes = async (req, res) => {
  try {
    const disputes = await listAllDisputes();
    return res.status(200).json({ disputes });
  } catch (err) {
    console.error('getAllDisputes error:', err);
    return res.status(500).json({ message: 'Could not fetch disputes.' });
  }
};

const updateDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { status, resolution } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be resolved or dismissed.' });
    }
    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ message: 'Resolution statement is required.' });
    }

    const dispute = await resolveDispute(disputeId, status, resolution.trim());
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found.' });
    }

    return res.status(200).json({ message: `Dispute marked as ${status}.`, dispute });
  } catch (err) {
    console.error('updateDispute error:', err);
    return res.status(500).json({ message: 'Could not update dispute.' });
  }
};

module.exports = {
  submitDispute,
  getCustomerDisputes,
  getAllDisputes,
  updateDispute,
};
