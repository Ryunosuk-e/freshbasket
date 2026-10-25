const { getAgentDeliveries, updateAssignmentStatus } = require('../models/deliveryModel');

const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await getAgentDeliveries(req.user.userId);
    return res.status(200).json({ deliveries });
  } catch (err) {
    console.error('getMyDeliveries error:', err);
    return res.status(500).json({ message: 'Could not fetch delivery assignments.' });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required.' });
    }

    const assignment = await updateAssignmentStatus(req.params.assignmentId, req.user.userId, status);
    return res.status(200).json({ message: 'Delivery status updated.', assignment });
  } catch (err) {
    console.error('updateDeliveryStatus error:', err);
    return res.status(400).json({ message: err.message || 'Could not update delivery status.' });
  }
};

module.exports = { getMyDeliveries, updateDeliveryStatus };
