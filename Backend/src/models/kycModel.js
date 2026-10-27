const pool = require('../config/db');

// Upserts or creates a vendor KYC application
const submitKycApplication = async ({
  vendorId,
  fullName,
  nin,
  phoneNumber,
  residentialAddress,
  idType = 'NIN Slip',
  idDocumentUrl,
  passportPhotoUrl,
  businessName,
  marketZone = 'Ogige Market',
  stallLocation,
  businessCategory,
  cacNumber,
  stallProofUrl,
  bankName,
  accountNumber,
  accountName,
}) => {
  // Check if an existing submission exists for this vendor
  const existing = await pool.query(
    'SELECT submission_id FROM vendor_kyc_submissions WHERE vendor_id = $1 ORDER BY submitted_at DESC LIMIT 1',
    [vendorId]
  );

  if (existing.rows.length > 0) {
    const subId = existing.rows[0].submission_id;
    const res = await pool.query(
      `UPDATE vendor_kyc_submissions
       SET full_name = $1, nin = $2, phone_number = $3, residential_address = $4,
           id_type = $5, id_document_url = $6, passport_photo_url = $7,
           business_name = $8, market_zone = $9, stall_location = $10,
           business_category = $11, cac_number = $12, stall_proof_url = $13,
           bank_name = $14, account_number = $15, account_name = $16,
           status = 'submitted', rejection_reason = NULL, submitted_at = NOW()
       WHERE submission_id = $17
       RETURNING *`,
      [
        fullName,
        nin,
        phoneNumber,
        residentialAddress,
        idType,
        idDocumentUrl,
        passportPhotoUrl || null,
        businessName,
        marketZone,
        stallLocation,
        businessCategory || null,
        cacNumber || null,
        stallProofUrl || null,
        bankName,
        accountNumber,
        accountName,
        subId,
      ]
    );
    return res.rows[0];
  }

  const res = await pool.query(
    `INSERT INTO vendor_kyc_submissions (
       vendor_id, full_name, nin, phone_number, residential_address,
       id_type, id_document_url, passport_photo_url,
       business_name, market_zone, stall_location,
       business_category, cac_number, stall_proof_url,
       bank_name, account_number, account_name, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'submitted')
     RETURNING *`,
    [
      vendorId,
      fullName,
      nin,
      phoneNumber,
      residentialAddress,
      idType,
      idDocumentUrl,
      passportPhotoUrl || null,
      businessName,
      marketZone,
      stallLocation,
      businessCategory || null,
      cacNumber || null,
      stallProofUrl || null,
      bankName,
      accountNumber,
      accountName,
    ]
  );
  return res.rows[0];
};

const getKycByVendorId = async (vendorId) => {
  const res = await pool.query(
    `SELECT k.*, u.email, v.shop_name, v.verification_status
     FROM vendor_kyc_submissions k
     JOIN vendors v ON v.vendor_id = k.vendor_id
     JOIN users u ON u.user_id = k.vendor_id
     WHERE k.vendor_id = $1
     ORDER BY k.submitted_at DESC
     LIMIT 1`,
    [vendorId]
  );
  return res.rows[0] || null;
};

const listAllKycSubmissions = async ({ status } = {}) => {
  let query = `
    SELECT k.*, u.email, u.created_at AS user_registered_at,
           v.shop_name, v.verification_status, v.business_address
    FROM vendor_kyc_submissions k
    JOIN vendors v ON v.vendor_id = k.vendor_id
    JOIN users u ON u.user_id = k.vendor_id
  `;
  const params = [];
  if (status && ['submitted', 'approved', 'rejected'].includes(status)) {
    query += ' WHERE k.status = $1';
    params.push(status);
  }
  query += ' ORDER BY k.submitted_at DESC';

  const res = await pool.query(query, params);
  return res.rows;
};

const reviewKycSubmission = async ({ submissionId, adminId, decision, rejectionReason }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      'SELECT * FROM vendor_kyc_submissions WHERE submission_id = $1',
      [submissionId]
    );
    const sub = subRes.rows[0];
    if (!sub) {
      await client.query('ROLLBACK');
      return null;
    }

    const nextStatus = decision === 'approve' ? 'approved' : 'rejected';
    const updatedKyc = await client.query(
      `UPDATE vendor_kyc_submissions
       SET status = $1, rejection_reason = $2, reviewed_at = NOW(), reviewed_by = $3
       WHERE submission_id = $4
       RETURNING *`,
      [nextStatus, decision === 'reject' ? (rejectionReason || 'Documents or NIN did not pass verification.') : null, adminId, submissionId]
    );

    const vendorId = sub.vendor_id;

    if (decision === 'approve') {
      // 1. Mark vendor as verified
      await client.query(
        `UPDATE vendors
         SET verification_status = 'verified',
             shop_name = $1,
             business_address = $2,
             market_zone = $3,
             bank_details = $4
         WHERE vendor_id = $5`,
        [
          sub.business_name,
          sub.stall_location,
          sub.market_zone,
          JSON.stringify({
            bankName: sub.bank_name,
            accountNumber: sub.account_number,
            accountName: sub.account_name,
          }),
          vendorId,
        ]
      );
      // 2. Mark user as verified
      await client.query('UPDATE users SET is_verified = TRUE, profile_completed = TRUE WHERE user_id = $1', [vendorId]);

      // 3. Send approval notification to vendor
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, type, title, message)
         VALUES ($1, 'in_app', 'kyc_approved', 'KYC Verified: Storefront Activated!',
                 'Congratulations! Your Vendor KYC verification and documents have been approved by the FreshBasket Administrator. You can now add products and fulfill orders.')`,
        [vendorId]
      );
    } else {
      // Rejection
      await client.query(
        `UPDATE vendors SET verification_status = 'rejected' WHERE vendor_id = $1`,
        [vendorId]
      );
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, type, title, message)
         VALUES ($1, 'in_app', 'kyc_rejected', 'KYC Verification Update: Review Required',
                 $2)`,
        [vendorId, `Your Vendor KYC application was not approved. Reason: ${rejectionReason || 'Please review your uploaded documents and details, then resubmit.'}`]
      );
    }

    await client.query('COMMIT');
    return updatedKyc.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  submitKycApplication,
  getKycByVendorId,
  listAllKycSubmissions,
  reviewKycSubmission,
};
