const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const disputeRoutes = require('./routes/disputeRoutes');

const app = express();

// Logs every request to the terminal, e.g. "POST /api/auth/register/customer
// 201 42.318 ms" — this is what lets you watch requests arrive in real time.
app.use(morgan('dev'));
app.use(cors({
  // origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  origin: '*',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Centralized error handler — any route that calls next(err), or throws
// inside an async handler wrapped to forward its error, ends up here
// instead of crashing the process. Multer (image upload) errors are
// caught here too, since multer reports them via next(err) — flagged as
// 400s instead of the generic 500, since they're the client's mistake
// (file too big, wrong type, too many files), not the server's.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /^Only image files/.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Unexpected server error.' });
});

module.exports = app;
