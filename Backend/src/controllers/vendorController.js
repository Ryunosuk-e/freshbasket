const {
  listPendingVendors,
  setVendorVerificationStatus,
  findVendorById,
  completeVendorProfile,
} = require('../models/vendorModel');

// UC08 — Admin: Verify Vendor Applications (the review queue).
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await listPendingVendors();
    return res.status(200).json({ vendors });
  } catch (err) {
    console.error('getPendingVendors error:', err);
    return res.status(500).json({ message: 'Could not fetch pending vendors.' });
  }
};

const verifyVendor = async (req, res) => {
  try {
    const vendor = await setVendorVerificationStatus(req.params.vendorId, 'verified');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    return res.status(200).json({ message: 'Vendor verified and storefront activated.', vendor });
  } catch (err) {
    console.error('verifyVendor error:', err);
    return res.status(500).json({ message: 'Could not verify vendor.' });
  }
};

const rejectVendor = async (req, res) => {
  try {
    const vendor = await setVendorVerificationStatus(req.params.vendorId, 'rejected');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    return res.status(200).json({ message: 'Vendor application rejected.', vendor });
  } catch (err) {
    console.error('rejectVendor error:', err);
    return res.status(500).json({ message: 'Could not reject vendor.' });
  }
};

const getVendorProfile = async (req, res) => {
  try {
    const vendor = await findVendorById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    return res.status(200).json({ vendor });
  } catch (err) {
    console.error('getVendorProfile error:', err);
    return res.status(500).json({ message: 'Could not fetch vendor profile.' });
  }
};

// A vendor viewing/completing their OWN profile — identity comes from the
// JWT (req.user.userId), never from a URL param, so a vendor can't
// accidentally (or deliberately) look up someone else's account this way.
const getMyProfile = async (req, res) => {
  try {
    const vendor = await findVendorById(req.user.userId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found.' });
    }
    return res.status(200).json({ vendor });
  } catch (err) {
    console.error('getMyProfile (vendor) error:', err);
    return res.status(500).json({ message: 'Could not fetch your profile.' });
  }
};

// Backs the Complete Your Profile step for vendors — payout bank details,
// which registration deliberately never asks for.
const updateMyProfile = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'bankName, accountNumber and accountName are all required.' });
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({ message: 'accountNumber must be exactly 10 digits.' });
    }

    const vendor = await completeVendorProfile({
      vendorId: req.user.userId,
      bankDetails: { bankName, accountNumber, accountName },
    });

    return res.status(200).json({ message: 'Profile completed.', vendor });
  } catch (err) {
    console.error('updateMyProfile (vendor) error:', err);
    return res.status(500).json({ message: 'Could not update your profile.' });
  }
};

module.exports = {
  getPendingVendors,
  verifyVendor,
  rejectVendor,
  getVendorProfile,
  getMyProfile,
  updateMyProfile,
};
