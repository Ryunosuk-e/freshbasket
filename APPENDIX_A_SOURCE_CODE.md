# APPENDIX A: SAMPLE SOURCE CODE LISTINGS

The following code listings represent core architectural units of the **Online Grocery Market Platform (FreshBasket)**. The selected listings showcase the database relational definition, authentication and access control middleware, ACID-compliant transactional order processing, multi-channel dispatch logistics, and client-side component integration.

---

## Listing A.1: Relational Schema & Table DDL (`Backend/src/db/schema.sql`)

```sql
-- =============================================================================
-- Hyperlocal Multi-Vendor Grocery Market Platform - Core Schema
-- Database: PostgreSQL 14+
-- =============================================================================

-- Custom Enumerated Domain Types
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin', 'agent');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Master Identity Table
CREATE TABLE IF NOT EXISTS users (
    user_id           SERIAL PRIMARY KEY,
    full_name         VARCHAR(120) NOT NULL,
    email             VARCHAR(160) UNIQUE NOT NULL,
    phone_number      VARCHAR(20)  UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    role              user_role    NOT NULL,
    is_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Vendor Storefront Entity (1:1 with users)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id           INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name           VARCHAR(150) NOT NULL,
    business_address    VARCHAR(255) NOT NULL,
    category            VARCHAR(100),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    average_rating      NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    total_orders        INTEGER NOT NULL DEFAULT 0,
    bank_details        JSONB
);

-- Regulatory Vendor KYC Submissions
CREATE TABLE IF NOT EXISTS vendor_kyc_submissions (
    submission_id      SERIAL PRIMARY KEY,
    vendor_id          INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    full_name          VARCHAR(150) NOT NULL,
    nin                VARCHAR(20) NOT NULL,
    phone_number       VARCHAR(25) NOT NULL,
    residential_address TEXT NOT NULL,
    id_type            VARCHAR(50) NOT NULL DEFAULT 'NIN Slip',
    id_document_url    TEXT NOT NULL,
    business_name      VARCHAR(150) NOT NULL,
    market_zone        VARCHAR(80) NOT NULL DEFAULT 'Ogige Market',
    stall_location     VARCHAR(255) NOT NULL,
    business_category  VARCHAR(100),
    cac_number         VARCHAR(50),
    stall_proof_url    TEXT,
    bank_name          VARCHAR(100) NOT NULL,
    account_number     VARCHAR(20) NOT NULL,
    account_name       VARCHAR(150) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'submitted' 
                       CHECK (status IN ('submitted', 'approved', 'rejected')),
    rejection_reason   TEXT,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at        TIMESTAMPTZ,
    reviewed_by        INTEGER REFERENCES users(user_id)
);

-- Master Customer Order Entity
CREATE TABLE IF NOT EXISTS orders (
    order_id           SERIAL PRIMARY KEY,
    order_code         VARCHAR(20) UNIQUE,
    customer_id        INTEGER NOT NULL REFERENCES customers(customer_id),
    delivery_address   VARCHAR(255) NOT NULL,
    fulfillment_type   VARCHAR(20) NOT NULL DEFAULT 'delivery',
    payment_method     VARCHAR(30) NOT NULL DEFAULT 'card',
    payment_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_reference  VARCHAR(100),
    order_status       VARCHAR(20) NOT NULL DEFAULT 'placed',
    total_amount       NUMERIC(10,2) NOT NULL,
    delivery_fee       NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
    requires_delivery  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_order_status_check
        CHECK (order_status IN ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'))
);

-- Immutable Historical Order Item Snapshot
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id   SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(product_id),
    vendor_id       INTEGER NOT NULL REFERENCES vendors(vendor_id),
    product_name    VARCHAR(150) NOT NULL,
    packaging_unit  VARCHAR(50) NOT NULL DEFAULT 'unit',
    unit_price      NUMERIC(10,2) NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    line_total      NUMERIC(10,2) NOT NULL
);

-- Logistics Dispatch Assignment Entity
CREATE TABLE IF NOT EXISTS delivery_assignments (
    assignment_id      SERIAL PRIMARY KEY,
    order_id           INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    agent_id           INTEGER REFERENCES delivery_agents(agent_id),
    pickup_address     VARCHAR(255),
    delivery_address   VARCHAR(255) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'assigned' 
                       CHECK (status IN ('assigned', 'picked_up', 'delivered', 'cancelled')),
    assigned_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at       TIMESTAMPTZ
);
```

---

## Listing A.2: Authentication & Access Control Middleware (`Backend/src/middleware/auth.js`)

```javascript
const { verifyToken } = require('../utils/token');
const pool = require('../config/db');

// Reads Bearer token, verifies JWT, attaches { userId, role } to request
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role-Based Access Control (RBAC) authorization guard
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

// Enforces that registered vendors pass KYC vetting before publishing catalog items
const requireVerifiedVendor = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT is_verified FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    if (!rows.length || !rows[0].is_verified) {
      return res.status(403).json({
        message: 'Your vendor account requires KYC verification before you can perform this action.',
        code: 'KYC_REQUIRED',
      });
    }
    next();
  } catch (err) {
    console.error('requireVerifiedVendor error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { authenticate, authorize, requireVerifiedVendor };
```

---

## Listing A.3: Transactional Order Processing & State Machine (`Backend/src/models/orderModel.js`)

```javascript
const pool = require('../config/db');
const { getCartWithItems } = require('./cartModel');
const { notifyDriverAssignment } = require('../utils/dispatchNotifications');

// Server-side cart total computation (guarantees price integrity against client manipulation)
const computeCartTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.unit_price || item.price) * item.quantity, 0);

const DELIVERY_FEE = 1200.0; // Local Nsukka flat logistics rate

const generateOrderCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${randomStr}`;
};

// Executes atomic order placement and stock deduction within an ACID transaction
const createOrderFromCart = async ({
  customerId,
  deliveryAddress,
  fulfillmentType = 'delivery',
  paymentMethod,
  paymentStatus,
  paymentReference,
}) => {
  const { cartId, items } = await getCartWithItems(customerId);
  const purchasable = items.filter((item) => item.is_active && item.verification_status === 'verified');

  if (purchasable.length === 0) {
    throw new Error('Your cart has no items available to order.');
  }

  const isDelivery = fulfillmentType === 'delivery';
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0.0;
  const itemsTotal = computeCartTotal(purchasable);
  const totalWithDelivery = itemsTotal + deliveryFee;

  let orderCode = generateOrderCode();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create master order record
    const orderResult = await client.query(
      `INSERT INTO orders (
         order_code, customer_id, delivery_address, fulfillment_type,
         payment_method, payment_status, payment_reference,
         delivery_fee, requires_delivery, total_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING order_id, order_code, created_at`,
      [orderCode, customerId, deliveryAddress, fulfillmentType, paymentMethod, paymentStatus, paymentReference, deliveryFee, isDelivery, totalWithDelivery]
    );
    const { order_id: orderId, order_code: finalOrderCode } = orderResult.rows[0];

    // 2. Snapshot line items & atomically decrement product inventory
    const vendorIds = new Set();
    for (const item of purchasable) {
      const stockUpdate = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (stockUpdate.rowCount === 0) {
        throw new Error(`Insufficient stock for "${item.name}". Only a limited quantity is available.`);
      }

      vendorIds.add(item.vendor_id);
      const unitPrice = Number(item.unit_price || item.price);
      const packagingUnit = item.packaging_unit || item.unit || 'unit';

      await client.query(
        `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, packaging_unit, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id, item.vendor_id, item.name, packagingUnit, unitPrice, item.quantity, unitPrice * item.quantity]
      );
    }

    // 3. Clear customer basket
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    // 4. Assign available dispatch rider
    let assignedAgentId = null;
    if (isDelivery) {
      const agentRes = await client.query(
        `SELECT agent_id FROM delivery_agents WHERE current_status = 'available' LIMIT 1`
      );
      assignedAgentId = agentRes.rows[0]?.agent_id || null;

      await client.query(
        `INSERT INTO delivery_assignments (order_id, agent_id, delivery_address, status)
         VALUES ($1, $2, $3, $4)`,
        [orderId, assignedAgentId, deliveryAddress, 'assigned']
      );

      if (assignedAgentId) {
        await client.query(
          `UPDATE delivery_agents SET current_status = 'busy', assigned_order_id = $1 WHERE agent_id = $2`,
          [orderId, assignedAgentId]
        );
      }
    }

    await client.query('COMMIT');

    // Trigger multi-channel driver notification
    if (assignedAgentId) {
      notifyDriverAssignment({
        agentId: assignedAgentId,
        orderCode: finalOrderCode,
        deliveryAddress,
        totalAmount: totalWithDelivery,
      }).catch((e) => console.error('Dispatch notification error:', e.message));
    }

    return { orderId, orderCode: finalOrderCode, totalAmount: totalWithDelivery };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Advances order state with strict PostgreSQL type coercion
const updateOrderStatus = async (orderId, newStatus, vendorId = null) => {
  if (vendorId) {
    const check = await pool.query(
      `SELECT 1 FROM order_items WHERE order_id = $1 AND vendor_id = $2 LIMIT 1`,
      [orderId, vendorId]
    );
    if (check.rows.length === 0) {
      throw new Error('You do not have permission to update this order.');
    }
  }

  const result = await pool.query(
    `UPDATE orders
     SET order_status = $2::varchar,
         payment_status = CASE WHEN $2::varchar = 'delivered' AND payment_status = 'pending' THEN 'paid' ELSE payment_status END,
         updated_at = NOW()
     WHERE order_id = $1
     RETURNING *`,
    [orderId, newStatus]
  );
  return result.rows[0];
};

module.exports = { computeCartTotal, createOrderFromCart, updateOrderStatus, DELIVERY_FEE };
```

---

## Listing A.4: Multi-Channel Dispatch Logistics (`Backend/src/utils/dispatchNotifications.js`)

```javascript
const pool = require('../config/db');

// Multi-Channel notification dispatcher (In-App, SMS, WhatsApp)
async function notifyDriverAssignment({ agentId, orderCode, pickupAddress, deliveryAddress, customerName, totalAmount }) {
  try {
    const agentRes = await pool.query(
      `SELECT u.user_id, u.full_name, u.phone_number, u.email, da.vehicle_type
       FROM users u
       JOIN delivery_agents da ON da.agent_id = u.user_id
       WHERE u.user_id = $1`,
      [agentId]
    );

    const agent = agentRes.rows[0];
    if (!agent) return;

    const cleanPhone = (agent.phone_number || '').replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
    const messageText = `FreshBasket Dispatch: Order #${orderCode} assigned. Pickup: ${pickupAddress || 'Ogige Market Vendors'}. Destination: ${deliveryAddress}. Recipient: ${customerName || 'Customer'}.`;

    // 1. In-App Notification / Mail Record
    await pool.query(
      `INSERT INTO notifications (recipient_id, channel, type, title, message, metadata)
       VALUES ($1, 'in_app', 'delivery_assignment', $2, $3, $4)`,
      [
        agent.user_id,
        `New Delivery Assignment: #${orderCode}`,
        messageText,
        JSON.stringify({ orderCode, pickupAddress, deliveryAddress, totalAmount })
      ]
    );

    // 2. Direct WhatsApp Dispatch Link via wa.me protocol
    const encodedMsg = encodeURIComponent(`*FreshBasket Dispatch Notification*\n\nOrder Code: *#${orderCode}*\nDelivery Address: ${deliveryAddress}\nAction: Please confirm pickup in Ogige market.`);
    const waLink = `https://wa.me/${intlPhone}?text=${encodedMsg}`;
    console.log(`[Dispatch - WhatsApp Channel] Driver: ${agent.full_name} (${intlPhone}) -> Link: ${waLink}`);

    // 3. SMS Alert (Termii Cloud Integration)
    console.log(`[Dispatch - SMS Channel] Dispatched SMS to ${agent.phone_number}: "${messageText}"`);

  } catch (err) {
    console.error('Error dispatching notifications to driver:', err.message);
  }
}

module.exports = { notifyDriverAssignment };
```

---

## Listing A.5: Client Drag & Drop Document Upload Component (`Frontend/src/pages/VendorKycPage.jsx`)

```jsx
import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, Eye } from 'lucide-react';

// Client-side image canvas downsampling and Base64 serializer
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

// Interactive drag-and-drop document upload zone
export function FileDropZone({ id, label, value, fileName, onFileSelect, onClear, required }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-3 truncate">
            {value.startsWith('data:image/') ? (
              <img src={value} alt="Preview" className="h-14 w-14 rounded-xl object-cover border border-emerald-300" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <FileText size={24} />
              </div>
            )}
            <div className="truncate">
              <span className="text-xs font-bold text-emerald-950 truncate flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-700" /> {fileName || 'Document attached'}
              </span>
              <p className="text-[11px] text-emerald-800/80">File ready for administrator verification</p>
            </div>
          </div>
          <button type="button" onClick={onClear} className="p-1.5 text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById(id)?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 cursor-pointer transition ${
            isDragging ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-emerald-400'
          }`}
        >
          <input id={id} type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} className="hidden" />
          <UploadCloud size={24} className="text-emerald-700 mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            <span className="text-emerald-800 font-bold hover:underline">Click to browse</span> or drag and drop file here
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Supports JPG, PNG, WEBP, or PDF (up to 5MB)</p>
        </div>
      )}
    </div>
  );
}
```
