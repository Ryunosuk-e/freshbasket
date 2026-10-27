-- Schema for the Auth & Vendor Registration module.
-- Mirrors the User / Vendor / Customer entities from the project's ER design
-- (Section 3.5.1 of the report). Category, Product, Order, etc. are left for
-- later sprints and are not created here.

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin', 'agent');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(160) UNIQUE NOT NULL,
    phone_number    VARCHAR(20)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL,
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN    NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Safe to re-run against a database that already has the users table from
-- before this column existed (uses IF NOT EXISTS, same as everything else
-- in this file) — it will not touch your existing customer row.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- One row per vendor, keyed by the same id as its users row (matches the
-- report's "VendorID (PK, FK -> User)" design instead of a separate id).
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id             INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name             VARCHAR(150) NOT NULL,
    business_address      VARCHAR(255) NOT NULL,
    category              VARCHAR(100),
    verification_status   verification_status NOT NULL DEFAULT 'pending',
    average_rating        NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    total_orders          INTEGER NOT NULL DEFAULT 0,
    bank_details          JSONB
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id                INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    default_delivery_address  VARCHAR(255),
    preferred_payment_method  VARCHAR(30)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vendors_verification_status ON vendors(verification_status);

-- ---------------------------------------------------------------------
-- Sprint 2: Product Catalogue (vendor product management half)
-- ---------------------------------------------------------------------

-- Platform-wide categories, not vendor-created — keeps browsing/filtering
-- consistent instead of every vendor inventing their own category names.
CREATE TABLE IF NOT EXISTS categories (
    category_id   SERIAL PRIMARY KEY,
    name          VARCHAR(80) UNIQUE NOT NULL,
    slug          VARCHAR(80) UNIQUE NOT NULL
);

-- Matches the six categories already shown on the landing page, so a
-- vendor's dropdown and the public site never drift apart.
INSERT INTO categories (name, slug) VALUES
    ('Fruits & Vegetables', 'fruits-vegetables'),
    ('Grains & Cereals', 'grains-cereals'),
    ('Dairy & Eggs', 'dairy-eggs'),
    ('Meat & Fish', 'meat-fish'),
    ('Beverages', 'beverages'),
    ('Household Essentials', 'household-essentials')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
    product_id      SERIAL PRIMARY KEY,
    vendor_id       INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES categories(category_id),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(30) NOT NULL DEFAULT 'unit',
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One-to-many, matching the report's separate ProductImage entity —
-- lets a product carry more than one photo instead of a single URL column.
CREATE TABLE IF NOT EXISTS product_images (
    image_id     SERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url    VARCHAR(500) NOT NULL,
    is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ---------------------------------------------------------------------
-- Sprint 3: Shopping Cart, Checkout & Paystack
-- ---------------------------------------------------------------------

-- One persistent cart per customer, created lazily on first use rather
-- than at registration.
CREATE TABLE IF NOT EXISTS carts (
    cart_id      SERIAL PRIMARY KEY,
    customer_id  INTEGER UNIQUE NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE(cart_id, product_id) is what makes "add to cart" an upsert —
-- adding a product already in the cart increments its quantity instead
-- of creating a second row for it.
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id  SERIAL PRIMARY KEY,
    cart_id       INTEGER NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id    INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Orders are the output of checkout. order_items snapshots product_name
-- and unit_price at purchase time rather than joining live to products —
-- if a vendor changes a price later, past orders must still show what was
-- actually charged, not the current price.
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
    delivery_fee       NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    requires_delivery  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
        CHECK (order_status IN ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
        CHECK (payment_method IN ('card', 'bank_transfer', 'cash_on_delivery', 'cash'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 500.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_delivery BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code) WHERE order_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference) WHERE payment_reference IS NOT NULL;

-- Product approval & packaging tier extensions
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS market_zone VARCHAR(80) DEFAULT 'Ogige Market';

-- Order item packaging unit
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS packaging_unit VARCHAR(80) DEFAULT 'Single Unit';
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS packaging_unit VARCHAR(80) DEFAULT 'Single Unit';
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key;

-- Dispute Resolution System (Academic & NDPA Compliance)
CREATE TABLE IF NOT EXISTS order_disputes (
    dispute_id     SERIAL PRIMARY KEY,
    order_id       INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id    INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    reason         TEXT NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolution     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON order_disputes(status);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id  SERIAL PRIMARY KEY,
    order_id       INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id     INTEGER NOT NULL REFERENCES products(product_id),
    vendor_id      INTEGER NOT NULL REFERENCES vendors(vendor_id),
    product_name   VARCHAR(150) NOT NULL,
    unit_price     NUMERIC(10,2) NOT NULL,
    quantity       INTEGER NOT NULL,
    line_total     NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);

-- ---------------------------------------------------------------------
-- Sprint 4: Ratings & Reviews System (FR08 / UC07)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
    review_id    SERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    customer_id  INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);


-- ---------------------------------------------------------------------
-- Sprint 5: Delivery Coordination & Agents (FR09 / UC11)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS delivery_agents (
    agent_id          INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    current_status    VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (current_status IN ('available', 'busy', 'offline')),
    vehicle_type      VARCHAR(50) NOT NULL DEFAULT 'Motorcycle',
    assigned_order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
    assignment_id     SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    agent_id          INTEGER REFERENCES delivery_agents(agent_id) ON DELETE SET NULL,
    pickup_address    VARCHAR(255),
    delivery_address  VARCHAR(255) NOT NULL,
    status            VARCHAR(30) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'delivered', 'failed')),
    assigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_agent_id ON delivery_assignments(agent_id);

-- ---------------------------------------------------------------------
-- Notifications Subsystem (FR12)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    notification_id   SERIAL PRIMARY KEY,
    recipient_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    channel           VARCHAR(20) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('push', 'sms', 'in_app')),
    type              VARCHAR(50) NOT NULL,
    message           TEXT NOT NULL,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);


-- ---------------------------------------------------------------------
-- Notifications & Mail Subsystem (FR12) Updates
-- ---------------------------------------------------------------------

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DO $$ BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_channel_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_channel_check
        CHECK (channel IN ('push', 'sms', 'in_app', 'email', 'whatsapp'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- Sprint 6: Vendor KYC Submissions (Multi-tier Verification & Moderation)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendor_kyc_submissions (
    submission_id      SERIAL PRIMARY KEY,
    vendor_id          INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    full_name          VARCHAR(150) NOT NULL,
    nin                VARCHAR(20) NOT NULL,
    phone_number       VARCHAR(25) NOT NULL,
    residential_address TEXT NOT NULL,
    id_type            VARCHAR(50) NOT NULL DEFAULT 'NIN Slip',
    id_document_url    TEXT NOT NULL,
    passport_photo_url TEXT,
    business_name      VARCHAR(150) NOT NULL,
    market_zone        VARCHAR(80) NOT NULL DEFAULT 'Ogige Market',
    stall_location     VARCHAR(255) NOT NULL,
    business_category  VARCHAR(100),
    cac_number         VARCHAR(50),
    stall_proof_url    TEXT,
    bank_name          VARCHAR(100) NOT NULL,
    account_number     VARCHAR(20) NOT NULL,
    account_name       VARCHAR(150) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    rejection_reason   TEXT,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at        TIMESTAMPTZ,
    reviewed_by        INTEGER REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_kyc_vendor_id ON vendor_kyc_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON vendor_kyc_submissions(status);
