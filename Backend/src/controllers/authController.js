const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { createUser, findUserByEmail } = require('../models/userModel');
const { createVendorProfile } = require('../models/vendorModel');
const { createCustomerProfile } = require('../models/customerModel');
const { generateToken } = require('../utils/token');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12; // NFR02

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// FR03 — Customer Registration & Login
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, deliveryAddress } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: 'fullName, email, phoneNumber and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ fullName, email, phoneNumber, passwordHash, role: 'customer' });
    await createCustomerProfile({
      customerId: user.user_id,
      defaultDeliveryAddress: deliveryAddress || null,
    });

    const token = generateToken({ userId: user.user_id, role: user.role });
    return res.status(201).json({ message: 'Customer account created.', token, user });
  } catch (err) {
    console.error('registerCustomer error:', err);
    return res.status(500).json({ message: 'Something went wrong while creating the account.' });
  }
};

// FR01 — Vendor Registration. Vendors can register and log in immediately,
// but cannot perform vendor operations until KYC is verified by Admin.
const registerVendor = async (req, res) => {
  try {
    const { ownerName, email, phoneNumber, password, shopName, businessAddress, category } = req.body;

    if (!ownerName || !email || !phoneNumber || !password || !shopName || !businessAddress) {
      return res.status(400).json({
        message: 'ownerName, email, phoneNumber, password, shopName and businessAddress are required.',
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ fullName: ownerName, email, phoneNumber, passwordHash, role: 'vendor' });
    const vendor = await createVendorProfile({ vendorId: user.user_id, shopName, businessAddress, category });

    // Send initial in-app Mail prompting for KYC
    try {
      await pool.query(
        `INSERT INTO notifications (recipient_id, channel, type, title, message)
         VALUES ($1, 'in_app', 'kyc_reminder', 'Complete Your Vendor KYC Verification', 'Welcome to FreshBasket! To begin listing your agricultural products and fulfilling orders, please complete your Vendor KYC verification form in your dashboard.')`,
        [user.user_id]
      );
    } catch (_) {}

    const token = generateToken({ userId: user.user_id, role: user.role });
    return res.status(201).json({
      message: 'Vendor account created. Please complete your KYC verification to begin listing products.',
      token,
      vendor: { ...user, ...vendor },
      user: { ...user, ...vendor },
    });
  } catch (err) {
    console.error('registerVendor error:', err);
    return res.status(500).json({ message: 'Something went wrong while submitting the vendor application.' });
  }
};

// Login shared by all roles. Unverified vendors can log in to submit/check KYC.
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken({ userId: user.user_id, role: user.role });
    const { password_hash, ...safeUser } = user;
    return res.status(200).json({ message: 'Login successful.', token, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.user.userId]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $2 WHERE user_id = $1', [req.user.userId, newHash]);

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Could not update password.' });
  }
};

module.exports = { registerCustomer, registerVendor, login, changePassword };
