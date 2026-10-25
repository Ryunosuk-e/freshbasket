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

    // 1. Categories
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

    const upsertUser = async ({ fullName, email, phone, role, passwordHash }) => {
      const existing = await client.query('SELECT user_id FROM users WHERE email = $1 OR phone_number = $2', [email, phone]);
      if (existing.rows[0]) {
        const uId = existing.rows[0].user_id;
        await client.query(
          `UPDATE users SET full_name = $1, email = $2, phone_number = $3, role = $4, password_hash = $5, is_verified = TRUE, profile_completed = TRUE WHERE user_id = $6`,
          [fullName, email, phone, role, passwordHash, uId]
        );
        return uId;
      }
      const ins = await client.query(
        `INSERT INTO users (full_name, email, phone_number, password_hash, role, is_verified, profile_completed)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE) RETURNING user_id`,
        [fullName, email, phone, passwordHash, role]
      );
      return ins.rows[0].user_id;
    };

    // 2. Admin User
    await upsertUser({
      fullName: 'Platform Administrator',
      email: 'admin@freshbasket.unn.edu.ng',
      phone: '08000000000',
      role: 'admin',
      passwordHash: adminPasswordHash,
    });

    // 3. Delivery Agent
    const agentId = await upsertUser({
      fullName: 'Chibuike Express Courier',
      email: 'chibuike.agent@example.com',
      phone: '08035556677',
      role: 'agent',
      passwordHash: defaultPasswordHash,
    });

    await client.query(`
      INSERT INTO delivery_agents (agent_id, current_status, vehicle_type)
      VALUES ($1, 'available', 'Boxer 150 Motorcycle')
      ON CONFLICT (agent_id) DO UPDATE SET current_status = 'available';
    `, [agentId]);

    // 4. Vendors with Nsukka Market Zones
    const vendorsData = [
      {
        fullName: 'Ngozi Okafor',
        email: 'mama.ngozi@example.com',
        phone: '08031112233',
        shopName: 'Mama Ngozi Fresh Produce',
        address: 'Stall 14, Line 3, Ogige Modern Market, Nsukka',
        marketZone: 'Ogige Market',
        category: 'Fruits & Vegetables',
        bank: { bankName: 'First Bank of Nigeria', accountNumber: '3012345678', accountName: 'Ngozi Okafor' },
      },
      {
        fullName: 'Emeka Nwankwo',
        email: 'emeka.provisions@example.com',
        phone: '08032223344',
        shopName: 'Emeka Provisions & Grains',
        address: 'Shop 3, University Market Road, Behind Flat, UNN',
        marketZone: 'Behind Flat',
        category: 'Grains & Cereals',
        bank: { bankName: 'Access Bank', accountNumber: '0123456789', accountName: 'Emeka Nwankwo' },
      },
      {
        fullName: 'Onyeka Igwe',
        email: 'onyeka.meat@example.com',
        phone: '08033334455',
        shopName: 'Onyeka Meat & Seafood Hub',
        address: 'Hilltop Commercial Junction, Near Campus Gate, Nsukka',
        marketZone: 'Hilltop',
        category: 'Meat & Fish',
        bank: { bankName: 'GTBank', accountNumber: '0234567891', accountName: 'Onyeka Igwe' },
      },
    ];

    const vendorIds = [];
    for (const v of vendorsData) {
      const vId = await upsertUser({
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        role: 'vendor',
        passwordHash: defaultPasswordHash,
      });
      vendorIds.push(vId);

      await client.query(`
        INSERT INTO vendors (vendor_id, shop_name, business_address, market_zone, category, verification_status, average_rating, bank_details)
        VALUES ($1, $2, $3, $4, $5, 'verified', 4.8, $6)
        ON CONFLICT (vendor_id) DO UPDATE SET
          shop_name = EXCLUDED.shop_name,
          business_address = EXCLUDED.business_address,
          market_zone = EXCLUDED.market_zone,
          verification_status = 'verified',
          bank_details = EXCLUDED.bank_details;
      `, [vId, v.shopName, v.address, v.marketZone, v.category, JSON.stringify(v.bank)]);
    }

    // 5. Customer
    const custId1 = await upsertUser({
      fullName: 'Adaeze Okoro',
      email: 'adaeze@example.com',
      phone: '08012345678',
      role: 'customer',
      passwordHash: defaultPasswordHash,
    });

    await client.query(`
      INSERT INTO customers (customer_id, default_delivery_address, preferred_payment_method)
      VALUES ($1, 'Bello Hall, Room 214, University of Nigeria, Nsukka', 'card')
      ON CONFLICT (customer_id) DO UPDATE SET default_delivery_address = EXCLUDED.default_delivery_address;
    `, [custId1]);

    // 6. Products with High-Resolution Nigerian Food Photography & Packaging Tiers
    const productsData = [
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Nsukka Fresh Red Tomatoes',
        description: 'Fresh, firm basket tomatoes sourced directly from local Enugu farmers. Rich red color and long shelf life.',
        price: 1500,
        unit: 'kg',
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Fresh Scotch Bonnet Pepper (Atarodo)',
        description: 'Clean, hot red peppers sorted fresh daily at Ogige market. Strong aroma and very hot.',
        price: 1200,
        unit: 'kg',
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
      {
        vendorId: vendorIds[0],
        catSlug: 'fruits-vegetables',
        name: 'Ripe Sweet Plantain Bunch',
        description: 'Naturally ripened sweet plantains from Nsukka plantations. Perfect for dodo or plantain chips.',
        price: 2200,
        unit: 'pack',
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Indomie Instant Noodles (Onion Chicken)',
        description: 'Popular staple noodles for campus students. Available as single pack, half carton (20 pcs), or full carton (40 pcs). Select your desired packaging unit below.',
        price: 350,
        unit: 'single pack',
        stock: 120,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [
          { name: 'Single Pack', price: 350, unit_count: 1 },
          { name: 'Half Carton (20 pcs)', price: 6500, unit_count: 20 },
          { name: 'Full Carton (40 pcs)', price: 12500, unit_count: 40 },
        ],
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Large White Yam Tuber',
        description: 'Heavy, sweet yam tubers harvested from Benue/Nsukka agricultural belts. Ideal for pounding or boiling.',
        price: 3500,
        unit: 'piece',
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1596450514735-111a2fe0ac82?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'grains-cereals',
        name: 'Abakaliki Parboiled Rice (De-stoned)',
        description: 'Clean, stone-free local parboiled rice in standard measurement. Cooks fluffy and non-sticky.',
        price: 3200,
        unit: 'kg',
        stock: 60,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [
          { name: '1 Paint Bucket (4kg)', price: 3200, unit_count: 1 },
          { name: 'Half Bag (25kg)', price: 36000, unit_count: 6 },
          { name: 'Full Bag (50kg)', price: 71000, unit_count: 12 },
        ],
      },
      {
        vendorId: vendorIds[1],
        catSlug: 'dairy-eggs',
        name: 'Fresh Farm Crate of Eggs',
        description: '30 large brown eggs from local poultry farm in Ofulonu, Nsukka. Carefully packaged.',
        price: 4200,
        unit: 'pack',
        stock: 20,
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [
          { name: 'Half Crate (15 eggs)', price: 2200, unit_count: 1 },
          { name: 'Full Crate (30 eggs)', price: 4200, unit_count: 2 },
        ],
      },
      {
        vendorId: vendorIds[2],
        catSlug: 'meat-fish',
        name: 'Prime Cut Fresh Beef',
        description: 'Hygienically slaughtered and dressed beef portions, no bones. Cut fresh from Ogige abattoir.',
        price: 4500,
        unit: 'kg',
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
      {
        vendorId: vendorIds[2],
        catSlug: 'meat-fish',
        name: 'Live/Dressed Pond Catfish',
        description: 'Medium-to-large fresh catfish from local fish farm in Nsukka. Cleaned and dressed upon request.',
        price: 3800,
        unit: 'kg',
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
        packagingOptions: [],
      },
    ];

    const insertedProductIds = [];
    for (const p of productsData) {
      const cId = catMap[p.catSlug] || null;
      const pRes = await client.query(`
        INSERT INTO products (vendor_id, category_id, name, description, price, unit, stock_quantity, packaging_options, approval_status, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', TRUE)
        RETURNING product_id;
      `, [p.vendorId, cId, p.name, p.description, p.price, p.unit, p.stock, JSON.stringify(p.packagingOptions)]);
      const pId = pRes.rows[0].product_id;
      insertedProductIds.push(pId);

      // Seed product image into product_images table
      await client.query(`
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, TRUE);
      `, [pId, p.imageUrl]);
    }

    // 7. Seed Reviews
    if (insertedProductIds.length > 0) {
      await client.query(`
        INSERT INTO reviews (product_id, customer_id, rating, comment)
        VALUES
          ($1, $2, 5, 'Very fresh tomatoes, delivered to Bello Hall in less than 25 minutes!'),
          ($3, $2, 5, 'Super convenient! Bought half carton of Indomie and it was delivered intact.'),
          ($4, $2, 5, 'The yam was sweet and soft after cooking. Good vendor from Behind Flat!')
      `, [insertedProductIds[0], custId1, insertedProductIds[3], insertedProductIds[4]]);
    }

    // 8. Order 1: Preparing Order (FB-83921)
    const orderRes1 = await client.query(`
      INSERT INTO orders (
        order_code, customer_id, delivery_address, fulfillment_type,
        payment_method, payment_status, order_status, delivery_fee, requires_delivery, total_amount
      )
      VALUES ('FB-83921', $1, 'Bello Hall, Room 214, University of Nigeria, Nsukka', 'delivery', 'card', 'paid', 'preparing', 500.00, TRUE, 7000.00)
      RETURNING order_id;
    `, [custId1]);
    const orderId1 = orderRes1.rows[0].order_id;

    await client.query(`
      INSERT INTO order_items (order_id, product_id, vendor_id, product_name, packaging_unit, unit_price, quantity, line_total)
      VALUES
        ($1, $2, $3, 'Indomie Instant Noodles (Onion Chicken)', 'Half Carton (20 pcs)', 6500.00, 1, 6500.00);
    `, [orderId1, insertedProductIds[3], vendorIds[1]]);

    await client.query(`
      INSERT INTO delivery_assignments (order_id, agent_id, delivery_address, status)
      VALUES ($1, $2, 'Bello Hall, Room 214, University of Nigeria, Nsukka', 'assigned');
    `, [orderId1, agentId]);

    // 9. Order 2: Delivered Order (FB-49201) with Cash on Delivery marked PAID
    const orderRes2 = await client.query(`
      INSERT INTO orders (
        order_code, customer_id, delivery_address, fulfillment_type,
        payment_method, payment_status, order_status, delivery_fee, requires_delivery, total_amount
      )
      VALUES ('FB-49201', $1, 'Stall 14, Ogige Market (Self-Pickup)', 'pickup', 'cash_on_delivery', 'paid', 'delivered', 0.00, FALSE, 3000.00)
      RETURNING order_id;
    `, [custId1]);
    const orderId2 = orderRes2.rows[0].order_id;

    await client.query(`
      INSERT INTO order_items (order_id, product_id, vendor_id, product_name, packaging_unit, unit_price, quantity, line_total)
      VALUES
        ($1, $2, $3, 'Nsukka Fresh Red Tomatoes', 'Single Unit', 1500.00, 2, 3000.00);
    `, [orderId2, insertedProductIds[0], vendorIds[0]]);

    // 10. Notifications
    await client.query(`
      INSERT INTO notifications (recipient_id, channel, type, message)
      VALUES
        ($1, 'in_app', 'order_status_update', 'Your order FB-83921 is now being prepared by Emeka Provisions.'),
        ($2, 'in_app', 'new_order', 'New order FB-83921 received for Indomie Half Carton.'),
        ($1, 'in_app', 'payment_confirmed', 'Payment of ₦3,000 for delivered order FB-49201 has been confirmed.');
    `, [custId1, vendorIds[1]]);

    await client.query('COMMIT');
    console.log('Demo seed completed successfully with images, locations, and packaging options!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials for Presentation / Defence:');
    console.log('  Admin:     admin@freshbasket.unn.edu.ng / ChangeMe123!');
    console.log('  Vendor 1:  mama.ngozi@example.com / Password123! (Ogige Market)');
    console.log('  Vendor 2:  emeka.provisions@example.com / Password123! (Behind Flat)');
    console.log('  Vendor 3:  onyeka.meat@example.com / Password123! (Hilltop)');
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
