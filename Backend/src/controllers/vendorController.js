const {
  listPendingVendors,
  setVendorVerificationStatus,
  findVendorById,
  updateVendorProfile,
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

const updateMyProfile = async (req, res) => {
  try {
    const {
      ownerName,
      phoneNumber,
      shopName,
      businessAddress,
      category,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

    let bankDetails = undefined;
    if (bankName || accountNumber || accountName) {
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({
          message: 'bankName, accountNumber, and accountName are all required when updating bank details.',
        });
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        return res.status(400).json({ message: 'accountNumber must be exactly 10 digits.' });
      }
      bankDetails = { bankName, accountNumber, accountName };
    }

    const vendor = await updateVendorProfile({
      vendorId: req.user.userId,
      fullName: ownerName?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      shopName: shopName?.trim() || undefined,
      businessAddress: businessAddress?.trim() || undefined,
      category: category?.trim() || undefined,
      bankDetails,
    });

    return res.status(200).json({ message: 'Profile updated successfully.', vendor });
  } catch (err) {
    console.error('updateMyProfile (vendor) error:', err);
    return res.status(500).json({ message: err.message || 'Could not update your profile.' });
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
