# Grocery Market Backend — Auth, Vendor Registration & Profile Completion

Backend for the Online Grocery Market Platform: user accounts, login,
vendor registration with admin verification, and a one-time "Complete
Your Profile" step for each role. Matches FR01 (Vendor Registration &
Verification), FR03 (Customer Registration & Login), UC01, UC08, and
NFR02 (security) from the project report. Later sprints (product
catalogue, cart, orders, delivery, ratings) build on top of this without
changing these tables.

## Stack

Node.js, Express, PostgreSQL (via `pg`), bcrypt, JSON Web Tokens.

## 1. Prerequisites

- Node.js 18+ and npm
- A running PostgreSQL server (local install, or a free instance from
  something like Neon/Supabase/Railway if you'd rather not install
  Postgres locally)

## 2. Setup

```bash
cd grocery-market-backend
npm install

cp .env.example .env
# then edit .env: set DATABASE_URL to your Postgres connection string
# and set JWT_SECRET to a long random string
```

Create the database (skip if you already made one and pointed
`DATABASE_URL` at it):

```bash
createdb grocery_market
```

Apply the schema, then create the first admin account:

```bash
npm run db:init
npm run db:seed-admin
```

`db:seed-admin` prints the admin email/password it created (from the
`SEED_ADMIN_*` values in `.env`, or sensible defaults). There's no public
"register as admin" endpoint on purpose — anyone hitting an open API
shouldn't be able to grant themselves admin rights, so the first admin is
always created this way.

**Already had this database running before?** `schema.sql` now adds a
`profile_completed` column to `users`. Just run `npm run db:init` again —
every statement in that file uses `IF NOT EXISTS`, so it's safe to re-run
any time and won't touch the rows (or the customer/vendor) you already
created.

Run the server:

```bash
npm run dev      # nodemon, restarts on file changes
# or
npm start
```

You should see `Grocery Market API listening on port 5000`. Check
`GET http://localhost:5000/health` returns `{"status":"ok"}`.

## 3. API Reference

| Method | Endpoint                          | Auth           | Description |
|--------|------------------------------------|----------------|--------------|
| POST   | `/api/auth/register/customer`      | none           | Create a customer account, returns a token immediately |
| POST   | `/api/auth/register/vendor`        | none           | Submit a vendor application (no token — pending admin verification) |
| POST   | `/api/auth/login`                  | none           | Login for any role (still 403 if a vendor isn't verified yet); response includes `profile_completed` |
| GET    | `/api/customers/me`                | customer       | View your own customer profile |
| PATCH  | `/api/customers/me`                | customer       | Complete Your Profile: save delivery address + payment preference, marks profile complete |
| GET    | `/api/vendors/me`                  | vendor         | View your own vendor profile |
| PATCH  | `/api/vendors/me`                  | vendor         | Complete Your Profile: save payout bank details, marks profile complete |
| GET    | `/api/vendors/pending`             | admin          | List vendor applications awaiting review |
| PATCH  | `/api/vendors/:vendorId/verify`    | admin          | Approve a vendor, activates their storefront |
| PATCH  | `/api/vendors/:vendorId/reject`    | admin          | Reject a vendor application |
| GET    | `/api/vendors/:vendorId`           | any logged-in  | View a vendor's public profile |
| GET    | `/api/admin/stats`                 | admin          | Platform counts: customers, vendors by verification status |
| GET    | `/api/admin/vendors`               | admin          | Every vendor regardless of status; add `?status=pending\|verified\|rejected` to filter |
| GET    | `/api/admin/customers`             | admin          | Every customer |
| GET    | `/api/categories`                  | none           | List product categories (seeded: Fruits & Vegetables, Grains & Cereals, Dairy & Eggs, Meat & Fish, Beverages, Household Essentials) |
| GET    | `/api/products/mine`               | vendor         | List your own products (active and inactive) |
| POST   | `/api/products`                    | vendor         | Add a product; `multipart/form-data` with fields below, optional `images` files (up to 4) |
| PATCH  | `/api/products/:productId`         | vendor         | Update a product you own (ownership enforced in the SQL, not just checked in code); same fields, can also add more images |
| GET    | `/api/products`                    | none           | Browse/search products — only shows active products from verified vendors. Query params: `q` (keyword), `category` (slug), `vendor` (id), `page`, `limit` |
| GET    | `/api/products/:productId`         | none           | A single product's public detail; 404 if inactive or its vendor isn't verified |
| GET    | `/api/cart`                        | customer       | Your cart, with product details joined in (name, price, image, shop) |
| POST   | `/api/cart/items`                  | customer       | Add a product to your cart — `{ productId, quantity }`; adding the same product again increases its quantity instead of duplicating the row |
| PATCH  | `/api/cart/items/:productId`       | customer       | Set an item's quantity — `{ quantity }`; `0` removes it |
| DELETE | `/api/cart/items/:productId`       | customer       | Remove an item from your cart |
| GET    | `/api/orders/checkout-summary`     | customer       | Current cart total + whether card payments are configured, fetched fresh right before opening the Paystack popup |
| POST   | `/api/orders`                      | customer       | Place an order from your cart — `{ deliveryAddress, paymentMethod, paystackReference? }`. For `card`, the reference is verified with Paystack (status + amount) before the order is created |
| GET    | `/api/orders`                      | customer       | List your past orders |
| GET    | `/api/orders/:orderId`             | customer       | One order's detail, with its line items |

Authenticated requests send `Authorization: Bearer <token>`.

**Product fields** (`POST`/`PATCH`, sent as form fields alongside any image files): `name`, `price` (positive number), `unit` (one of `kg`, `g`, `litre`, `ml`, `piece`, `dozen`, `pack`), `stockQuantity` (whole number ≥ 0), `categoryId` (from `GET /api/categories`), `description` (optional), and on `PATCH` only, `isActive` (`true`/`false`) to show or hide the listing without deleting it.

## 4. Trying it end-to-end

```bash
# 1. Register a customer
curl -X POST http://localhost:5000/api/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Adaeze Okoro","email":"adaeze@example.com","phoneNumber":"08012345678","password":"password123","deliveryAddress":"12 Ogige Road, Nsukka"}'

# 2. Submit a vendor application
curl -X POST http://localhost:5000/api/auth/register/vendor \
  -H "Content-Type: application/json" \
  -d '{"ownerName":"Chika Eze","email":"chika@example.com","phoneNumber":"08087654321","password":"password123","shopName":"Chika Fresh Produce","businessAddress":"Stall 14, Ogige Market","category":"Fresh Produce"}'

# 3. Log in as the vendor -> 403, still pending
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chika@example.com","password":"password123"}'

# 4. Log in as admin (use the credentials npm run db:seed-admin printed)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grocerymarket.test","password":"ChangeMe123!"}'
# copy the "token" from the response

# 5. List pending vendors (paste the admin token)
curl http://localhost:5000/api/vendors/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 6. Verify the vendor (vendor_id is the user_id returned in step 2)
curl -X PATCH http://localhost:5000/api/vendors/<VENDOR_ID>/verify \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 7. Log in as the vendor again -> succeeds now
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chika@example.com","password":"password123"}'
# copy this token for step 8

# 8. Add a product as that vendor (multipart, not JSON — note -F not -d)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <VENDOR_TOKEN>" \
  -F "name=Fresh Tomatoes" \
  -F "price=1500" \
  -F "unit=kg" \
  -F "stockQuantity=40" \
  -F "categoryId=1" \
  -F "images=@/path/to/a/photo.jpg"
```

## 5. Product Catalogue & photo uploads (Sprint 2)

Categories are seeded automatically by `schema.sql` — run `npm run
db:init` again if your database predates this update, same as any other
schema change in this project; it won't touch products you've already
added.

Product photos go to Cloudinary, matching the report's tech stack. **This
is optional** — without it configured, `POST`/`PATCH /api/products` still
work, they just skip the images:

1. Create a free account at [cloudinary.com](https://cloudinary.com) (no
   card required for the free tier).
2. On your dashboard home page, copy the **Cloud name**, **API Key**, and
   **API Secret**.
3. Paste them into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET` in `.env`.
4. Restart `npm run dev`. Any product created or edited with `images`
   files from then on uploads for real, into a `grocery-market/products`
   folder in your Cloudinary account.

If those three variables are blank, the server logs `Cloudinary is not
configured — skipping image upload.` instead of erroring — worth knowing
so a missing photo doesn't look like a bug while you're testing.

## 6. Checkout & Payment (Sprint 3)

Cash on Delivery needs no setup — it's the default and always available.
Card payments go through [Paystack](https://paystack.com), and are
**optional**: without a secret key configured, `paymentMethod: 'card'`
returns a clear 503 instead of the request half-working, and Cash on
Delivery is unaffected.

1. Create a free account at [dashboard.paystack.com](https://dashboard.paystack.com)
   — test mode needs no business verification or bank details.
2. Go to **Settings → API Keys & Webhooks**. You'll see a **Secret Key**
   (`sk_test_...`) and a **Public Key** (`pk_test_...`).
3. Put the secret key in this backend's `.env` as `PAYSTACK_SECRET_KEY`.
4. The **public key** goes in the *frontend's* `.env` instead (as
   `VITE_PAYSTACK_PUBLIC_KEY`) — it's meant to be visible in client-side
   code, unlike the secret key, which must never leave the backend.
5. Restart `npm run dev`.

**Why verification happens here, not in the browser:** the frontend opens
Paystack's popup and gets back a payment reference on success, but that
callback alone is never enough to mark an order paid — anyone can fake a
JavaScript callback. `POST /api/orders` independently calls Paystack's
`/transaction/verify` endpoint with the secret key, and separately
recomputes the expected total from the cart currently on the server. The
order is only created as `paid` if Paystack confirms the payment
succeeded **and** the amount matches — never on the frontend's say-so.

Paystack test mode has published test card numbers for exactly this
purpose — search "Paystack test cards" for the current list rather than
using a real one.

## 7. Watching what's happening

- **Request logs** — every request now prints in the terminal running
  `npm run dev` (via `morgan`), e.g.
  `POST /api/auth/register/customer 201 42.318 ms`. That line alone tells
  you whether a request from the frontend arrived at all, and what status
  code came back.
- **Error details** — anything that throws inside a controller is caught
  and logged with `console.error`, stack trace included, in that same
  terminal. The response sent back to the browser stays generic
  ("Unexpected server error.") on purpose — full details belong in your
  terminal, not in what a stranger's browser can see.
- **The database itself** — to check whether a row was actually created,
  connect with `psql` or a GUI (pgAdmin, TablePlus, and DBeaver all work
  fine) and run e.g. `SELECT * FROM users;` or
  `SELECT * FROM vendors WHERE verification_status = 'pending';`.
- **Testing the API on its own** — the `curl` commands above (or a GUI
  client like Postman or the Thunder Client VS Code extension) hit an
  endpoint directly, without the frontend involved at all. If `curl` works
  but the frontend doesn't, the issue is on the frontend side (or CORS);
  if `curl` also fails, it's the backend or the database.
- **Health check** — `GET /health` should always return `{"status":"ok"}`
  as long as the server process is running, regardless of the database.

## 8. What's deliberately left for later

- **Google OAuth for customers** (mentioned in FR03) — the email/password
  path is complete; OAuth is a separate strategy that can be added
  alongside it without touching the `users` table.
- **Password reset / forgot-password flow.**
- **Rate limiting on `/login`** to slow down brute-force guessing —
  worth adding before this goes anywhere public.
- **Stronger validation** — current checks are hand-rolled (required
  fields, email shape, password length). A library like `express-validator`
  or `zod` would scale better once more endpoints are added in later sprints.
- **Cart, Order, Review, DeliveryAgent tables** — Cart, Order and
  OrderItem now exist; Review and DeliveryAgent are Sprint 4 onward
  ("order management, real-time status updates" per the report), along
  with updating order/delivery status after checkout — this sprint only
  covers placing the order.
- **Paystack webhooks** — payment is verified synchronously when the
  order is placed, which covers the normal flow; a webhook endpoint would
  add resilience for the edge case of a payment succeeding after the
  customer's browser closes before the callback fires.

## 9. Project structure

```
src/
  server.js            entry point
  app.js               Express app, middleware, route mounting
  config/
    db.js                 PostgreSQL connection pool
    cloudinary.js          Cloudinary SDK config from env vars
  db/schema.sql         table definitions
  db/init.js            applies schema.sql
  db/seedAdmin.js        creates the first admin account
  middleware/
    auth.js                JWT auth + role-based guard
    upload.js               multer (in-memory image uploads, 5MB/4 files)
  models/                one file per table, raw parameterized SQL
  controllers/            request handling + validation
    authController.js      register (both roles) + login
    customerController.js   a customer's own profile
    vendorController.js     a vendor's own profile + admin verification
    adminController.js      platform-wide monitoring (stats, all vendors/customers)
    categoryController.js   list categories
    productController.js    vendor product CRUD + image upload
    cartController.js       a customer's own cart
    orderController.js      checkout summary, placing/viewing orders
  routes/                 endpoint -> controller wiring
  utils/
    token.js               JWT sign/verify helpers
    cloudinaryUpload.js      buffer -> Cloudinary, degrades gracefully if unconfigured
    paystack.js              server-side payment verification
```
