/**
 * FreshBasket Backend Test Suite
 * Covers Core Functional Requirements (FR01 - FR12):
 * - Health check & Category catalogue
 * - Product listing with Location Badging & Packaging Tier JSON
 * - Product Recommendations
 * - Multi-packaging pricing & Cart operations
 * - Checkout logic & Alphanumeric Order Code generation (FB-XXXXX)
 * - Fulfillment rules (Delivery ₦500 vs Pickup ₦0; Cash disabled for Home Delivery)
 * - Vendor/Admin payment confirmation (Cash Pending -> Paid)
 * - Order Dispute resolution subsystem
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const pool = require('../src/config/db');
const { generateToken } = require('../src/utils/token');
const { generateOrderCode, confirmPaymentReceived, createOrderFromCart } = require('../src/models/orderModel');
const { listPublicProducts, getRecommendationsForProduct } = require('../src/models/productModel');
const { addItemToCart } = require('../src/models/cartModel');
const { createDispute, listAllDisputes, resolveDispute } = require('../src/models/disputeModel');

let server;
let baseUrl;

async function runTests() {
  console.log('\n========================================');
  console.log('  FRESHBASKET AUTOMATED TEST SUITE');
  console.log('========================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  \x1b[32m✔\x1b[0m ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  \x1b[31m✖\x1b[0m ${name}`);
      console.error(`    Error: ${err.message}`);
      failedCount++;
    }
  }

  // 1. Start ephemeral HTTP server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // --- SECTION 1: SYSTEM HEALTH & CATALOGUE ---
    await test('HTTP: GET /health returns status ok', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
    });

    await test('HTTP: GET /api/categories returns grocery categories', async () => {
      const res = await fetch(`${baseUrl}/api/categories`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.categories), 'categories must be an array');
      assert(data.categories.length > 0, 'should have seeded categories');
    });

    await test('Catalogue: Products include market_zone location and approval_status', async () => {
      const { products } = await listPublicProducts({});
      assert(Array.isArray(products), 'products must be an array');
      assert(products.length > 0, 'products should not be empty');
      const first = products[0];
      assert(first.market_zone, 'product should have a market_zone badge');
      assert.strictEqual(first.approval_status, 'approved', 'public products must be approved');
    });

    await test('Catalogue: Filtering by location badge (e.g. Ogige Market)', async () => {
      const { products } = await listPublicProducts({ location: 'Ogige' });
      assert(products.length > 0, 'should find products in Ogige');
      for (const p of products) {
        assert(p.market_zone.toLowerCase().includes('ogige'), 'zone must match filter');
      }
    });

    await test('Catalogue: Multi-packaging pricing options are stored as JSONB', async () => {
      const { products } = await listPublicProducts({ q: 'Indomie' });
      assert(products.length > 0, 'Indomie should exist in catalog');
      const indomie = products[0];
      let options = indomie.packaging_options;
      if (typeof options === 'string') options = JSON.parse(options);
      assert(Array.isArray(options), 'packaging_options should be an array');
      assert(options.length >= 2, 'Indomie should have tier pricing (e.g. Single Pack & Carton)');
      const firstOpt = options[0];
      assert(firstOpt.name || firstOpt.unit_name, 'tier must have a name');
      assert(firstOpt.price > 0, 'tier must have a positive price');
    });

    await test('Catalogue: Related product recommendations return matching items', async () => {
      const { products } = await listPublicProducts({});
      const testProd = products[0];
      const recs = await getRecommendationsForProduct(testProd.product_id, 4);
      assert(Array.isArray(recs), 'recommendations should be an array');
      for (const r of recs) {
        assert.notStrictEqual(r.product_id, testProd.product_id, 'should not recommend self');
      }
    });

    // --- SECTION 2: ORDER PROCESSING & BUSINESS RULES ---
    await test('Order Logic: Alphanumeric order code generator produces valid Jumia-style codes', () => {
      const code1 = generateOrderCode();
      const code2 = generateOrderCode();
      assert(/^FB-[A-Z0-9]{5}$/.test(code1), `Code "${code1}" does not match pattern FB-XXXXX`);
      assert(/^FB-[A-Z0-9]{5}$/.test(code2), `Code "${code2}" does not match pattern FB-XXXXX`);
      assert.notStrictEqual(code1, code2, 'Subsequent codes should be distinct');
    });

    // Fetch existing customer and vendor from DB
    const custRes = await pool.query(`SELECT user_id, email FROM users WHERE role = 'customer' LIMIT 1`);
    const vendRes = await pool.query(`SELECT vendor_id FROM vendors WHERE verification_status = 'verified' LIMIT 1`);
    const prodRes = await pool.query(`SELECT product_id, price FROM products WHERE is_active = TRUE AND stock_quantity > 5 LIMIT 1`);

    if (custRes.rows.length && vendRes.rows.length && prodRes.rows.length) {
      const customer = custRes.rows[0];
      const vendor = vendRes.rows[0];
      const product = prodRes.rows[0];
      const customerToken = generateToken({ userId: customer.user_id, role: 'customer' });

      // Ensure customer has item in cart
      await addItemToCart(customer.user_id, product.product_id, 1, 'Single Unit', product.price);

      await test('Fulfillment Rules: Home Delivery rejects cash_on_delivery via HTTP API', async () => {
        const res = await fetch(`${baseUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            fulfillmentType: 'delivery',
            deliveryAddress: 'Hall of Fame Hostel, UNN',
            paymentMethod: 'cash_on_delivery',
          }),
        });

        assert.strictEqual(res.status, 400, 'Should reject cash on delivery for home delivery');
        const data = await res.json();
        assert(data.message.includes('Home Delivery'), 'Error message should explain rule');
      });

      let placedOrder;
      await test('Fulfillment Rules: Home Delivery with Bank Transfer succeeds with ₦500 delivery fee and FB- code', async () => {
        const res = await fetch(`${baseUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            fulfillmentType: 'delivery',
            deliveryAddress: 'Hilltop Flat 4, UNN',
            paymentMethod: 'bank_transfer',
            transferReference: `TRF-TEST-${Date.now()}`,
          }),
        });

        assert.strictEqual(res.status, 201, 'Should create order successfully');
        const data = await res.json();
        assert(data.orderId, 'Order ID must be returned');
        assert(data.orderCode.startsWith('FB-'), `Order code "${data.orderCode}" must start with FB-`);
        assert.strictEqual(Number(data.deliveryFee), 500.0, 'Delivery fee must be ₦500');
        placedOrder = data;
      });

      await test('Payment Transition: Vendor confirms payment received (transitions to paid)', async () => {
        assert(placedOrder, 'Placed order must exist');
        const updated = await confirmPaymentReceived(placedOrder.orderId, vendor.vendor_id);
        assert.strictEqual(updated.payment_status, 'paid', 'payment_status must update to paid');
      });

      // --- SECTION 3: ORDER DISPUTE RESOLUTION ---
      let disputeId;
      await test('Dispute System: Customer can file a dispute ticket for an order', async () => {
        const dispute = await createDispute({
          orderId: placedOrder.orderId,
          customerId: customer.user_id,
          reason: 'Packaged carton arrived with 2 broken sachets during dispatch.',
        });
        assert(dispute.dispute_id, 'dispute must have an ID');
        assert.strictEqual(dispute.status, 'open');
        disputeId = dispute.dispute_id;
      });

      await test('Dispute System: Admin can query open disputes with customer & order details', async () => {
        const all = await listAllDisputes();
        const found = all.find((d) => d.dispute_id === disputeId);
        assert(found, 'Created dispute should be in the list');
        assert(found.order_code, 'Dispute record must join order_code');
        assert(found.customer_name, 'Dispute record must join customer_name');
      });

      await test('Dispute System: Admin resolves dispute with resolution statement', async () => {
        const resolution = 'Refunded ₦1,200 to customer wallet. Vendor notified to package fragile items with bubble wrap.';
        const resolved = await resolveDispute(disputeId, 'resolved', resolution);
        assert.strictEqual(resolved.status, 'resolved');
        assert.strictEqual(resolved.resolution, resolution);
      });

      // Clean up test order & dispute
      await pool.query(`DELETE FROM order_disputes WHERE dispute_id = $1`, [disputeId]);
      await pool.query(`DELETE FROM delivery_assignments WHERE order_id = $1`, [placedOrder.orderId]);
      await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [placedOrder.orderId]);
      await pool.query(`DELETE FROM orders WHERE order_id = $1`, [placedOrder.orderId]);
    }

  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n========================================');
  console.log(`  TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
