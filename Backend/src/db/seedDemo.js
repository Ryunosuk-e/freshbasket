require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const seedDemo = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding demo data for FreshBasket (Nsukka Grocery Market)...');

    const defaultPasswordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);
    const adminPasswordHash = await bcrypt.hash('ChangeMe123!', SALT_ROUNDS);

    // 1. Seed Categories if not present
    await client.query(`
      INSERT INTO categories (name, slug) VALUES
        ('Fruits & Vegetables', 'fruits-vegetables'),
        ('Grains & Cereals', 'grains-cereals'),
        ('Dairy & Eggs', 'dairy-eggs'),
        ('Meat & Fish', 'meat-fish'),
        ('Beverages', 'beverages'),
        ('Household Essentials', 'household-essentials')
      ON CONFLICT (name) DO NOTHING;
    `);

    const catRows = (await client.query('SELECT category_id, slug FROM categories')).rows;
    const catMap = {};
    catRows.forEach((r) => { catMap[r.slug] = r.category_id; });

    // 2. Admin User
    await client.query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
      VALUES ('Platform Administrator', 'admin@grocerymarket.test', '08000000000', $1, 'admin', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = TRUE;
    `, [adminPasswordHash]);

    // 3. Delivery Agent
    const agentUserRes = await client.query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
      VALUES ('Chibuike Express Courier', 'chibuike.agent@example.com', '08035556677', $1, 'agent', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING user_id;
    `, [defaultPasswordHash]);
    const agentId = agentUserRes.rows[0].user_id;

    await client.query(`
      INSERT INTO delivery_agents (agent_id, current_status, vehicle_type)
      VALUES ($1, 'available', 'Boxer 150 Motorcycle')
      ON CONFLICT (agent_id) DO UPDATE SET current_status = 'available';
    `, [agentId]);

    // 4. Vendors
    const vendorsData = [
      {
        fullName: 'Ngozi Okafor',
        email: 'mama.ngozi@example.com',
        phone: '08031112233',
        shopName: 'Mama Ngozi Fresh Produce',
        address: 'Stall 14, Ogige Modern Market, Nsukka',
        category: 'Fruits & Vegetables',
        bank: { bankName: 'First Bank of Nigeria', accountNumber: '3012345678', accountName: 'Ngozi Okafor' },
      },
      {
        fullName: 'Emeka Nwankwo',
        email: 'emeka.provisions@example.com',
        phone: '08032223344',
        shopName: 'Emeka Provisions & Grains',
        address: 'Shop 3, University Market Road, UNN Flat, Nsukka',
        category: 'Grains & Cereals',
        bank: { bankName: 'Access Bank', accountNumber: '0123456789', accountName: 'Emeka Nwankwo' },
      },
      {
        fullName: 'Onyeka Igwe',
        email: 'onyeka.meat@example.com',
        phone: '08033334455',
        shopName: 'Onyeka Meat & Seafood Hub',
        address: 'Coldroom Line, Meat Section, Ogige Market, Nsukka',
        category: 'Meat & Fish',
        bank: { bankName: 'GTBank', accountNumber: '0234567891', accountName: 'Onyeka Igwe' },
      },
    ];

    const vendorIds = [];
    for (const v of vendorsData) {
      const uRes = await client.query(`
        INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
        VALUES ($1, $2, $3, $4, 'vendor', TRUE, TRUE)
        ON CONFLICT (email) DO UPDATE SET is_verified = TRUE, profile_completed = TRUE
        RETURNING user_id;
      `, [v.fullName, v.email, v.phone, defaultPasswordHash]);
      const vId = uRes.rows[0].user_id;
      vendorIds.push(vId);

      await client.query(`
        INSERT INTO vendors (vendor_id, shop_name, business_address, category, verification_status, average_rating, bank_details)
        VALUES ($1, $2, $3, $4, 'verified', 4.8, $5)
        ON CONFLICT (vendor_id) DO UPDATE SET
          shop_name = EXCLUDED.shop_name,
          verification_status = 'verified',
          bank_details = EXCLUDED.bank_details;
      `, [vId, v.shopName, v.address, v.category, JSON.stringify(v.bank)]);
    }

    // 5. Customers
    const custRes1 = await client.query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
      VALUES ('Adaeze Okoro', 'adaeze@example.com', '08012345678', $1, 'customer', TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET is_verified = TRUE, profile_completed = TRUE
      RETURNING user_id;
    `, [defaultPasswordHash]);
    const custId1 = custRes1.rows[0].user_id;

    await client.query(`
      INSERT INTO customers (customer_id, default_delivery_address, preferred_payment_method)
      VALUES ($1, '14 Ogige Road, Near UNN Main Gate, Nsukka', 'cash_on_delivery')
      ON CONFLICT (customer_id) DO UPDATE SET default_delivery_address = EXCLUDED.default_delivery_address;
    `, [custId1]);

    // 6. Products
    const productsData = [
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Nsukka Fresh Red Tomatoes',
        description: 'Fresh, firm basket tomatoes sourced directly from local Enugu farmers.',
        price: 1500,
        unit: 'kg',
        stock: 50,
      },
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Fresh Scotch Bonnet Pepper (Atarodo)',
        description: 'Clean, hot red peppers sorted fresh daily at Ogige market.',
        price: 1200,
        unit: 'kg',
        stock: 40,
      },
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Ripe Sweet Plantain Bunch',
        description: 'Naturally ripened sweet plantains from Nsukka plantations.',
        price: 2200,
        unit: 'pack',
        stock: 25,
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Large White Yam Tuber',
        description: 'Heavy, sweet yam tubers harvested from Benue/Nsukka agricultural belts.',
        price: 3500,
        unit: 'piece',
        stock: 30,
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Abakaliki Parboiled Rice (De-stoned)',
        description: 'Clean, stone-free local parboiled rice in standard measurement paint bucket.',
        price: 3200,
        unit: 'kg',
        stock: 60,
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Pure Nsukka Palm Oil',
        description: 'Unadulterated, rich red palm oil bottled in a clean 1-litre container.',
        price: 2500,
        unit: 'litre',
        stock: 35,
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'dairy-eggs',
        name: 'Fresh Farm Crate of Eggs',
        description: '30 large brown eggs from local poultry farm in Ofulonu, Nsukka.',
        price: 4200,
        unit: 'pack',
        stock: 20,
      },
      {
        vendorId: vendorIds[2],
        catSlug: 'meat-fish',
        name: 'Prime Cut Fresh Beef',
        description: 'Hygienically slaughtered and dressed beef portions, no bones.',
        price: 4500,
        unit: 'kg',
        stock: 25,
      },
      {
        vendorId: vendorIds[2],
        catSlug: 'meat-fish',
        name: 'Live/Dressed Pond Catfish',
        description: 'Medium-to-large fresh catfish from local fish farm in Nsukka.',
        price: 3800,
        unit: 'kg',
        stock: 18,
      },
    ];

    const insertedProductIds = [];
    for (const p of productsData) {
      const cId = catMap[p.catSlug] || null;
      const pRes = await client.query(`
        INSERT INTO products (vendor_id, category_id, name, description, price, unit, stock_quantity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING product_id;
      `, [p.vendorId, cId, p.name, p.description, p.price, p.unit, p.stock]);
      insertedProductIds.push(pRes.rows[0].product_id);
    }

    // 7. Seed Sample Reviews (FR10)
    if (insertedProductIds.length > 0) {
      await client.query(`
        INSERT INTO reviews (product_id, customer_id, rating, comment)
        VALUES
          ($1, $2, 5, 'Very fresh tomatoes, reached my gate in less than 30 minutes!'),
          ($3, $2, 5, 'The yam was very soft and sweet after cooking. Great vendor!'),
          ($4, $2, 4, 'Palm oil was clean and not bleached. Will definitely buy again.')
      `, [insertedProductIds[0], custId1, insertedProductIds[3], insertedProductIds[5]]);
    }

    // 8. Seed Sample Order & Delivery Assignment (FR06 / FR07 / FR08 / FR09)
    const orderRes = await client.query(`
      INSERT INTO orders (customer_id, delivery_address, payment_method, payment_status, order_status, delivery_fee, total_amount)
      VALUES ($1, '14 Ogige Road, Near UNN Main Gate, Nsukka', 'cash_on_delivery', 'pending', 'preparing', 500.00, 7200.00)
      RETURNING order_id;
    `, [custId1]);
    const sampleOrderId = orderRes.rows[0].order_id;

    await client.query(`
      INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, line_total)
      VALUES
        ($1, $2, $3, 'Nsukka Fresh Red Tomatoes', 1500.00, 2, 3000.00),
        ($1, $4, $5, 'Large White Yam Tuber', 3500.00, 1, 3500.00);
    `, [sampleOrderId, insertedProductIds[0], vendorIds[0], insertedProductIds[3], vendorIds[1]]);

    await client.query(`
      INSERT INTO delivery_assignments (order_id, agent_id, delivery_address, status)
      VALUES ($1, $2, '14 Ogige Road, Near UNN Main Gate, Nsukka', 'assigned');
    `, [sampleOrderId, agentId]);

    await client.query(`
      INSERT INTO notifications (recipient_id, channel, type, message)
      VALUES
        ($1, 'in_app', 'order_status_update', 'Your order #${sampleOrderId} is now being prepared by the vendor.'),
        ($2, 'in_app', 'new_order', 'New order #${sampleOrderId} received for your produce.');
    `, [custId1, vendorIds[0]]);

    await client.query('COMMIT');
    console.log('Demo seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials for Presentation / Defence:');
    console.log('  Admin:     admin@grocerymarket.test / ChangeMe123!');
    console.log('  Vendor 1:  mama.ngozi@example.com / Password123!');
    console.log('  Vendor 2:  emeka.provisions@example.com / Password123!');
    console.log('  Vendor 3:  onyeka.meat@example.com / Password123!');
    console.log('  Customer:  adaeze@example.com / Password123!');
    console.log('  Agent:     chibuike.agent@example.com / Password123!');
    console.log('----------------------------------------------------');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed demo error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemo();
