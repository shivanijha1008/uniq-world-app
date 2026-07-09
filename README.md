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

## Prototype admin access

Use this local prototype password to unlock catalog editing:

```text
uniqadmin
```
