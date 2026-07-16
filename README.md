# Uniq World

Premium mobile-first prototype for Uniq World, an AI-powered personalized gifting and lifestyle platform.

## Run locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

The app also still opens as a static prototype, but full-stack persistence requires `npm start`.

Optional:

```bash
set PORT=4180 && npm start
```

## Production deployment

Use a Node host such as Render, Railway, Fly.io, or a VPS.

Required environment variable:

```text
ADMIN_PASSWORD=your-secure-admin-password
```

Recommended production variables:

```text
DATABASE_URL=your-supabase-or-render-postgres-connection-string
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
PAYMENT_CURRENCY=INR
```

Render quick deploy:

1. Connect this GitHub repository.
2. Use `npm install` as the build command.
3. Use `node server.js` as the start command.
4. Add `ADMIN_PASSWORD`, `DATABASE_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in environment variables.
5. Open `/api/health` after deployment to verify the backend is live.

Free database option:

1. Create a free Supabase project.
2. Copy the PostgreSQL connection string from Supabase project settings.
3. Paste it into Render as `DATABASE_URL`.
4. Keep `PGSSLMODE` unset unless your provider asks otherwise.

Payment gateway setup:

1. Create a Razorpay account.
2. Generate test keys first, then live keys after KYC/go-live approval.
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the host environment.
4. The frontend creates a Razorpay order, opens Checkout, and the backend verifies the payment signature before reducing stock.

Health check:

```text
/api/health
```

GitHub Pages can host the static frontend only. For real inventory, orders, admin login, stock updates, and live sync, use the Node backend.

## Features

- AI Gift Concierge mock chat
- Relationship Vault
- Shop by Emotion
- Ready Hampers
- Owner hamper editor with publish, stock, price, and delete controls
- Admin password gate for catalog editing
- Hamper picture upload with local preview/storage
- Separate admin section with inventory management
- Inventory variants with per-variant price and quantity
- Build-your-own hamper from live inventory
- Builder quantity controls for selected inventory variants
- Combo pricing at 10% less than individual item total
- Customer cart with quantities, total, and checkout-style order flow
- Build Your Own Hamper
- Wellness Subscription
- Corporate portal and rewards sections
- Static PWA manifest
- Node.js backend with JSON persistence
- PostgreSQL storage through `DATABASE_URL` with JSON fallback for local development
- API routes for app state, admin login, and orders
- AI catalog search endpoint for concierge recommendations
- Razorpay payment order creation and payment signature verification
- Protected admin writes with backend token
- Server-side order creation and stock deduction
- Realtime client refresh via server-sent events

## Prototype admin access

Use this local prototype password to unlock catalog editing:

```text
uniqadmin
```
