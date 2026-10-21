const pool = require('../config/db');

const createVendorProfile = async ({ vendorId, shopName, businessAddress, category }) => {
  const result = await pool.query(
    `INSERT INTO vendors (vendor_id, shop_name, business_address, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [vendorId, shopName, businessAddress, category]
  );
  return result.rows[0];
};

const findVendorById = async (vendorId) => {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.is_verified, u.profile_completed, u.created_at,
            v.shop_name, v.business_address, v.category, v.verification_status,
            v.average_rating, v.total_orders, v.bank_details
     FROM vendors v
     JOIN users u ON u.user_id = v.vendor_id
     WHERE v.vendor_id = $1`,
    [vendorId]
  );
  return result.rows[0];
};

// Backs UC08 (Admin: Verify Vendor Applications) — the review queue.
const listPendingVendors = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.created_at,
            v.shop_name, v.business_address, v.category
     FROM vendors v
     JOIN users u ON u.user_id = v.vendor_id
     WHERE v.verification_status = 'pending'
     ORDER BY u.created_at ASC`
  );
  return result.rows;
};

// Setting status to 'verified' also flips users.is_verified
const setVendorVerificationStatus = async (vendorId, status) => {
  const result = await pool.query(
    `UPDATE vendors SET verification_status = $2 WHERE vendor_id = $1 RETURNING *`,
    [vendorId, status]
  );
  const vendor = result.rows[0];
  if (vendor && status === 'verified') {
    await pool.query('UPDATE users SET is_verified = TRUE WHERE user_id = $1', [vendorId]);
  }
  return vendor;
};

// Saves payout bank details and marks the account's profile as completed
const completeVendorProfile = async ({ vendorId, bankDetails }) => {
  return updateVendorProfile({ vendorId, bankDetails });
};

// Allows full profile update: owner name, phone, shop name, address, category, bank details
const updateVendorProfile = async ({
  vendorId,
  fullName,
  phoneNumber,
  shopName,
  businessAddress,
  category,
  bankDetails,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (fullName || phoneNumber) {
      await client.query(
        `UPDATE users
         SET full_name = COALESCE($2, full_name),
             phone_number = COALESCE($3, phone_number),
             profile_completed = TRUE
         WHERE user_id = $1`,
        [vendorId, fullName || null, phoneNumber || null]
      );
    } else {
      await client.query('UPDATE users SET profile_completed = TRUE WHERE user_id = $1', [vendorId]);
    }

    if (
      shopName !== undefined ||
      businessAddress !== undefined ||
      category !== undefined ||
      bankDetails !== undefined
    ) {
      await client.query(
        `UPDATE vendors
         SET shop_name = COALESCE($2, shop_name),
             business_address = COALESCE($3, business_address),
             category = COALESCE($4, category),
             bank_details = COALESCE($5, bank_details)
         WHERE vendor_id = $1`,
        [
          vendorId,
          shopName || null,
          businessAddress || null,
          category || null,
          bankDetails ? JSON.stringify(bankDetails) : null,
        ]
      );
    }

    await client.query('COMMIT');
    return findVendorById(vendorId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Backs the admin dashboard's "All Vendors" view
const listAllVendors = async ({ status } = {}) => {
  const params = [];
  let whereClause = '';
  if (status) {
    params.push(status);
    whereClause = 'WHERE v.verification_status = $1';
  }

  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.is_verified, u.profile_completed, u.created_at,
            v.shop_name, v.business_address, v.category, v.verification_status,
            v.average_rating, v.total_orders
     FROM vendors v
     JOIN users u ON u.user_id = v.vendor_id
     ${whereClause}
     ORDER BY u.created_at DESC`,
    params
  );
  return result.rows;
};

module.exports = {
  createVendorProfile,
  findVendorById,
  listPendingVendors,
  listAllVendors,
  setVendorVerificationStatus,
  completeVendorProfile,
  updateVendorProfile,
};
