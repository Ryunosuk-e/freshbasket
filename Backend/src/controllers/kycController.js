const {
  submitKycApplication,
  getKycByVendorId,
  listAllKycSubmissions,
  reviewKycSubmission,
} = require('../models/kycModel');

// Vendor submits their KYC verification
const submitKyc = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const {
      fullName,
      nin,
      phoneNumber,
      residentialAddress,
      idType,
      idDocumentUrl,
      passportPhotoUrl,
      businessName,
      marketZone,
      stallLocation,
      businessCategory,
      cacNumber,
      stallProofUrl,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

    if (
      !fullName ||
      !nin ||
      !phoneNumber ||
      !residentialAddress ||
      !idDocumentUrl ||
      !businessName ||
      !stallLocation
    ) {
      return res.status(400).json({
        message: 'Please provide all required personal, business, and document details.',
      });
    }

    if (nin.trim().length < 11) {
      return res.status(400).json({ message: 'National Identification Number (NIN) must be at least 11 digits.' });
    }

    const submission = await submitKycApplication({
      vendorId,
      fullName,
      nin,
      phoneNumber,
      residentialAddress,
      idType: idType || 'NIN Slip',
      idDocumentUrl,
      passportPhotoUrl,
      businessName,
      marketZone: marketZone || 'Ogige Market',
      stallLocation,
      businessCategory,
      cacNumber,
      stallProofUrl,
      bankName,
      accountNumber,
      accountName,
    });

    return res.status(200).json({
      message: 'KYC application submitted successfully. Platform administrators will review your documents.',
      submission,
    });
  } catch (err) {
    console.error('submitKyc error:', err);
    return res.status(500).json({ message: 'Could not submit KYC application.' });
  }
};

// Vendor checks their own KYC status
const getMyKyc = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const submission = await getKycByVendorId(vendorId);
    return res.status(200).json({ submission });
  } catch (err) {
    console.error('getMyKyc error:', err);
    return res.status(500).json({ message: 'Could not fetch your KYC status.' });
  }
};

// Admin lists all submissions
const getAllKyc = async (req, res) => {
  try {
    const { status } = req.query;
    const submissions = await listAllKycSubmissions({ status });
    return res.status(200).json({ submissions });
  } catch (err) {
    console.error('getAllKyc error:', err);
    return res.status(500).json({ message: 'Could not fetch KYC submissions.' });
  }
};

// Admin approves or rejects a submission
const reviewKyc = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be either "approve" or "reject".' });
    }

    const reviewed = await reviewKycSubmission({
      submissionId: Number(submissionId),
      adminId: req.user.userId,
      decision,
      rejectionReason,
    });

    if (!reviewed) {
      return res.status(404).json({ message: 'KYC submission not found.' });
    }

    return res.status(200).json({
      message: decision === 'approve' ? 'Vendor KYC approved and storefront activated.' : 'Vendor KYC rejected.',
      submission: reviewed,
    });
  } catch (err) {
    console.error('reviewKyc error:', err);
    return res.status(500).json({ message: 'Could not review KYC submission.' });
  }
};

module.exports = {
  submitKyc,
  getMyKyc,
  getAllKyc,
  reviewKyc,
};
