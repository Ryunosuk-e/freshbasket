const { getPlatformStats } = require('../models/adminModel');
const { listAllVendors } = require('../models/vendorModel');
const { listAllCustomers } = require('../models/customerModel');

const VALID_STATUSES = ['pending', 'verified', 'rejected'];

const getStats = async (req, res) => {
  try {
    const stats = await getPlatformStats();
    return res.status(200).json({ stats });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Could not fetch platform stats.' });
  }
};

const getVendors = async (req, res) => {
  try {
    const { status } = req.query;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }
    const vendors = await listAllVendors({ status });
    return res.status(200).json({ vendors });
  } catch (err) {
    console.error('getVendors error:', err);
    return res.status(500).json({ message: 'Could not fetch vendors.' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await listAllCustomers();
    return res.status(200).json({ customers });
  } catch (err) {
    console.error('getCustomers error:', err);
    return res.status(500).json({ message: 'Could not fetch customers.' });
  }
};

module.exports = { getStats, getVendors, getCustomers };
