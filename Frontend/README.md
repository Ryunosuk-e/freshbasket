# Grocery Market Frontend

Landing page → Register → Sign In → Complete Your Profile (first login
only) → Dashboard, plus an Admin Dashboard — styled after the Figma/Behance
template you shared (split layout, rounded pill inputs, dark green primary
button, photo-illustration panels). Talks directly to the backend built
earlier.

## Stack

React 19 + Vite + Tailwind CSS v4 + React Router. Icons from `lucide-react`.

## 1. Setup

```bash
cd grocery-market-frontend
npm install

cp .env.example .env
# edit .env if your backend isn't running on http://localhost:5000
```

Start the backend first (see the backend project's README — remember to
run `npm run db:init` again there if you set it up before this update, to
pick up the new `profile_completed` column), then run this:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). It now opens
on the public landing page (`/`), with "Sign In" and "Get Started" in the
nav taking you into the rest of the flow.

## 2. The flow

```
   /  (public landing page)
   |
   |-- "Sign In" ----------> /sign-in --login--> role === 'admin'?
   |                                                |            |
   `-- "Get Started" --> /register --submit-->      yes          no
                              |                      |            |
                        (redirects to)             /admin   profile_completed?
                          /sign-in                              |         |
                                                                no        yes
                                                                 |         |
                                                       /complete-profile   /dashboard
                                                                 |
                                                          (submit) --> /dashboard
```

- **`/` is public** — the landing page anyone sees first, logged in or
  not. It's the page you just asked for: hero, categories, how-it-works,
  FAQ, and the "Sign In" / "Get Started" choice.
- **Register** creates the account but does not log you in — you're sent
  to Sign In with a success message, so "create an account" and "be
  logged in" stay two separate, explicit steps. The landing page's two
  hero buttons ("Shop as a Customer" / "Sell on FreshBasket") both go to
  `/register`, just pre-selecting the matching tab.
- **Sign In** is a single form for every role, admin included — there's
  no role toggle here, because login only needs credentials; the backend
  already knows the account's role and returns it.
- Right after login, `getPostLoginPath` (`src/utils/routing.js`) decides
  where to send the person: admins go straight to `/admin`, customers and
  vendors go to `/complete-profile` on their first login or `/dashboard`
  afterward. `ProtectedRoute` enforces the same logic for anyone who
  reaches a URL directly.
- **Complete Your Profile** asks different questions depending on role:
  delivery address + payment preference for a customer, payout bank
  details for a vendor. Admins skip this step entirely.
- **Dashboard** (`/dashboard`) is the minimal post-login landing point. For
  vendors, it links to **My Products** (`/vendor/products`) — add, edit,
  and show/hide products, with photo upload via `multipart/form-data`
  (the browser's native `FormData`, not JSON, since it includes files).
  For customers, it links to **Shop**.
- **Shop** (`/shop`, public — no login needed) and **Product Detail**
  (`/shop/:productId`) round out Sprint 2: search, category filters (the
  landing page's category cards link straight in), and a product page
  with an image gallery.
- **Cart** (`/cart`, customer-only) and the cart icon in the header (any
  page using `PublicHeader`) feed into **Checkout** (`/checkout`) and
  **Order confirmation** (`/orders/:orderId`) — Sprint 3 is now complete.
  Cash on delivery places the order immediately; card payment opens
  Paystack's Inline popup (loaded on demand from `utils/paystack.js`),
  and the backend independently re-verifies the payment and the total
  before ever creating the order — the amount shown in the popup is
  never trusted on its own.
- **Admin Dashboard** (`/admin`) is the platform-monitoring page: stats,
  the pending-vendor review queue with approve/reject, plus tabs for
  every vendor and every customer.

Auth state (the JWT + user object) lives in `src/context/AuthContext.jsx`
and is saved to `localStorage` if "Remember me" was checked at sign-in, or
`sessionStorage` (cleared when the browser closes) if not.

## 3. Why the landing page skips some of the template's sections

Flash Sale countdowns, "Deals of the Day," a blog feed, and an Instagram
grid all assume real inventory, real posts, or a real social account —
building those now would mean either faking data or shipping something
that looks broken. Categories, "How It Works," and the FAQ don't have
that problem, so those are built out close to the template's spirit.
Testimonials are deliberately not included for the same reason the
auth-panel caption never used a fake name: there are no real users yet to
quote. Once product listings exist (Sprint 2), the collections/deals
sections have real data to show and are worth adding then.

## 4. Why the Complete Profile fields differ from the template

The template's version of this screen (Photo, Phone, Gender) is generic
for a furniture shopper with one account type. Two things don't carry
over directly for this app:
- **Phone** is already collected at registration for both roles — asking
  again would be redundant.
- **Gender** isn't part of either role's data model in the project report.

What replaced them is real, previously-unused data your schema already
has room for: a customer's delivery address (optional at registration,
required here) and payment preference, or a vendor's payout bank details
(the `bank_details` column that's existed since the first backend version
but was never actually collected anywhere until now). The *visual*
pattern — photo/logo upload widget, same pill inputs, same dropdown style
— is kept exactly as shown.

## 5. Adding another page from the same template

Since more screens are coming from the same source, here's the pattern
so each one is a small, consistent addition:

1. **Create the file** in `src/pages/`, e.g. `src/pages/ShopPage.jsx`.
2. **If it's a split-screen auth-style page** (like Register/Sign
   In/Complete Profile), wrap its content in `<AuthLayout highlights={...}>`
   — you get the logo, the illustrated side panel, and the rotating
   caption for free, and only need to write what goes inside the form
   panel. If it's a page for logged-in users with the plain top-bar
   layout (like Dashboard or Admin), use `<AppHeader />` the same way. If
   it's a public marketing-style page, build its own layout the way
   `LandingPage.jsx` does.
3. **Add a route** in `src/App.jsx`:
   ```jsx
   <Route path="/shop" element={<ProtectedRoute allowedRoles={['customer']}><ShopPage /></ProtectedRoute>} />
   ```
   Drop `<ProtectedRoute>` entirely for a page anyone can see without
   logging in. Pass `allowedRoles` (an array of `'customer'`, `'vendor'`,
   `'admin'`) to restrict a page to specific roles — omit it for a page
   any logged-in role can see.
4. **Reuse what's already built**: `FormField` for text/email/password/tel
   inputs (it already handles the show/hide password toggle), the inline
   `SelectField` pattern in `CompleteProfilePage.jsx` for dropdowns, and
   `src/api/client.js`'s `parseResponse`/`authHeaders` for any new API
   calls — new endpoints just need a small file in `src/api/` following
   the shape of `profile.js`.

Send me a screenshot of whichever screen is next from the template and
I'll build it the same way.

## 6. What's deliberately left for later

- **"Sign up/in with Google"** is visually present (matching the
  template) on both Register and Sign In, but not wired up — clicking it
  shows a small notice. The backend doesn't implement Google OAuth yet
  either.
- **"Forgot Password?"** is a link with no page behind it yet.
- **Profile photo / shop logo upload** previews the chosen file locally
  but doesn't upload it anywhere — there's no Cloudinary wiring on the
  backend yet to receive it.
- **PWA setup** (manifest, service worker) — worth adding with
  `vite-plugin-pwa` once there are enough screens to make installable.

## 7. Project structure

```
src/
  main.jsx                         entry point (BrowserRouter + AuthProvider)
  App.jsx                          route definitions
  index.css                        Tailwind import
  context/
    AuthContext.jsx                  logged-in user/token, remember-me storage
    CartContext.jsx                  live cart item count for the header badge
  utils/routing.js                 where a logged-in user belongs (getPostLoginPath)
  utils/paystack.js                loads Paystack's Inline popup script on demand
  api/
    client.js                       shared base URL + response/error parsing
    auth.js                         register (both roles) + login
    profile.js                      get/complete a customer's or vendor's own profile
    admin.js                        platform stats, all vendors/customers, vendor decisions
    products.js                     categories + vendor product CRUD (multipart for images) + public browse
    cart.js                         get/add/update/remove cart items
    orders.js                       checkout summary, place order, view past orders
  components/
    AuthLayout.jsx                   shared split-panel shell for auth-style pages
    AppHeader.jsx                    shared logo + sign-out header for logged-in pages
    PublicHeader.jsx                 shared header for public pages (Landing, Shop) — auth-aware
    FormField.jsx                    labeled input, handles the password show/hide toggle
    GoogleIcon.jsx                   Google "G" icon for the social buttons
    GroceryIllustration.jsx          side-panel artwork (auth pages)
    HeroIllustration.jsx             larger hero artwork (landing page)
    ProtectedRoute.jsx               login + role + profile-completion route guard
  pages/
    LandingPage.jsx                  public homepage — hero, categories, FAQ, CTAs
    ShopPage.jsx                     public product browsing — search + category filter
    ProductDetailPage.jsx            public single-product view
    RegisterPage.jsx                 create account (customer or vendor)
    SignInPage.jsx                   single login for every role
    CompleteProfilePage.jsx          first-login-only, role-specific fields
    DashboardPage.jsx                minimal role-aware post-login page
    AdminDashboardPage.jsx           stats + pending/all-vendors/all-customers tabs
    VendorProductsPage.jsx           vendor's own product list + add/edit form
    CartPage.jsx                     view/adjust cart items, subtotal
    CheckoutPage.jsx                 delivery address, payment method, Paystack popup
    OrderDetailPage.jsx              order confirmation + reusable order detail view
```
