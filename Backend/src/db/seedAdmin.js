require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// There is deliberately no POST /api/auth/register/admin endpoint — letting
// anyone self-register as an admin over the public API would defeat the
// point of having a verification role at all. The first admin is created
// with this script instead; from the app, admins can be managed by hand.
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const run = async () => {
  const fullName = process.env.SEED_ADMIN_NAME || 'Platform Admin';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@grocerymarket.test';
  const phoneNumber = process.env.SEED_ADMIN_PHONE || '08000000000';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
       VALUES ($1, $2, $3, $4, 'admin', TRUE, TRUE)
       ON CONFLICT (email) DO NOTHING
       RETURNING user_id`,
      [fullName, email, phoneNumber, passwordHash]
    );

    if (result.rowCount === 0) {
      console.log(`An account with email ${email} already exists — nothing to do.`);
    } else {
      console.log(`Admin account ready.\n  email:    ${email}\n  password: ${password}`);
      console.log('Log in once, then change this password — it is only meant as a bootstrap credential.');
    }
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
