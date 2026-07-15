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

Render quick deploy:

1. Connect this GitHub repository.
2. Use `node server.js` as the start command.
3. Add `ADMIN_PASSWORD` in environment variables.
4. Open `/api/health` after deployment to verify the backend is live.

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
- API routes for app state, admin login, and orders
- Protected admin writes with backend token
- Server-side order creation and stock deduction
- Realtime client refresh via server-sent events

## Prototype admin access

Use this local prototype password to unlock catalog editing:

```text
uniqadmin
```
