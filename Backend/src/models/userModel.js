const pool = require('../config/db');

const createUser = async ({ fullName, email, phoneNumber, passwordHash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, phone_number, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, full_name, email, phone_number, role, is_verified, created_at`,
    [fullName, email, phoneNumber, passwordHash, role]
  );
  return result.rows[0];
};

// Includes password_hash - only call this from login/registration code paths
// that need to check it, and never send the result straight back in a
// response.
const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findUserById = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, full_name, email, phone_number, role, is_verified, created_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

module.exports = { createUser, findUserByEmail, findUserById };
