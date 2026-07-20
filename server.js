const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "uniqadmin";
const DATABASE_URL = process.env.DATABASE_URL || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || "INR";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "";
const ADMIN_EMAIL_WEBHOOK_URL = process.env.ADMIN_EMAIL_WEBHOOK_URL || "";
const ADMIN_WHATSAPP_WEBHOOK_URL = process.env.ADMIN_WHATSAPP_WEBHOOK_URL || "";
const sessions = new Set();
const clients = new Set();
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
let pgPool = null;
let storageReady = false;
let storageError = "";

const defaultDb = {
  hampers: [
    { id: "midnight-bloom", title: "Midnight Bloom", copy: "Velvet box, fragrance, candle, and truffles.", price: 5200, stock: 8, category: "Luxury", published: true, image: "" },
    { id: "apology-edit", title: "The Apology Edit", copy: "Soft florals, secret letter, tea, and calming bath ritual.", price: 3400, stock: 11, category: "Wellness", published: true, image: "" },
    { id: "executive-onboarding", title: "Executive Onboarding", copy: "Branded magnetic box with notebook, coffee, and desk objects.", price: 4800, stock: 20, category: "Corporate", published: true, image: "" },
    { id: "self-care-sunday", title: "Self-care Sunday", copy: "Skin care, bath ritual, tea, book, and mindfulness challenge.", price: 2900, stock: 6, category: "Wellness", published: true, image: "" }
  ],
  inventory: [
    { id: "diya-with-candle", name: "Diya with Candle", description: "Decorative festive diya with candle for gifting. Price to be updated before publishing.", category: "Candle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "blue-forest-boxes", name: "Blue forest boxes", description: "Premium blue gift box for hampers.", category: "Lifestyle", price: 210, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 210, stock: 1 }] },
    { id: "khulad-terracotta", name: "Khulad terracotta", description: "Traditional terracotta kulhad. Price to be updated before publishing.", category: "Lifestyle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "designer-khulad-ceramic", name: "Designer Khulad Ceramic", description: "Designer ceramic kulhad for tea/coffee.", category: "Tea", price: 100, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 100, stock: 1 }] },
    { id: "brass-glass", name: "Brass glass", description: "Traditional brass drinking glass.", category: "Lifestyle", price: 230, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 230, stock: 1 }] },
    { id: "1-l-steel-water-bottle", name: "1 L steel water bottle", description: "Stainless steel 1L reusable bottle.", category: "Lifestyle", price: 200, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 200, stock: 1 }] },
    { id: "laxmi-pair", name: "Laxmi Pair", description: "Decorative Laxmi pair festive decor. Price to be updated before publishing.", category: "Lifestyle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "marigold-mala", name: "Marigold Mala", description: "Artificial marigold garland decoration. Price to be updated before publishing.", category: "Lifestyle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "paper-bags", name: "Paper Bags", description: "Premium paper carry bag.", category: "Lifestyle", price: 200, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 200, stock: 1 }] },
    { id: "jute-bags-white-medium-with-lace-window", name: "Jute Bags (white, medium with lace & window)", description: "Reusable jute hamper bag with lace and display window.", category: "Lifestyle", price: 60, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 60, stock: 1 }] },
    { id: "lotus-shubh-labh", name: "Lotus Shubh Labh", description: "Lotus-themed Shubh Labh decor. Price to be updated before publishing.", category: "Lifestyle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "pichwai-shubh-labh", name: "Pichwai Shubh Labh", description: "Pichwai-inspired Shubh Labh decor.", category: "Lifestyle", price: 100, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 100, stock: 1 }] },
    { id: "paper-boat-chikki", name: "Paper Boat Chikki", description: "Crunchy chikki snack. Price to be updated before publishing.", category: "Chocolate", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "coffee-id", name: "Coffee ID", description: "Premium coffee sachet. Price to be updated before publishing.", category: "Tea", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "tea-bags", name: "Tea Bags", description: "Premium tea bags. Price to be updated before publishing.", category: "Tea", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "golden-lid-jars-medium", name: "Golden lid jars (medium)", description: "Medium storage jar with golden lid.", category: "Lifestyle", price: 16, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 16, stock: 1 }] },
    { id: "copper-bronze-gold-lid-big-jar", name: "Copper/Bronze/Gold lid big jar", description: "Large storage jar with metallic lid.", category: "Lifestyle", price: 15, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 15, stock: 1 }] },
    { id: "transparent-plastic-jars", name: "Transparent plastic jars", description: "Clear storage jar.", category: "Lifestyle", price: 15, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 15, stock: 1 }] },
    { id: "mini-glass-jars", name: "Mini glass jars", description: "Mini glass storage jar.", category: "Lifestyle", price: 10, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 10, stock: 1 }] },
    { id: "small-glass-candy-jars", name: "Small glass candy jars", description: "Small candy jar.", category: "Lifestyle", price: 50, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 50, stock: 1 }] },
    { id: "big-glass-candy-jars", name: "Big glass candy jars", description: "Large candy jar. Price to be updated before publishing.", category: "Lifestyle", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "eco-friendly-kulhad", name: "Eco friendly kulhad", description: "Eco-friendly disposable kulhad.", category: "Tea", price: 33, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 33, stock: 1 }] },
    { id: "green-sipper-bottle", name: "Green sipper bottle", description: "Green reusable sipper bottle.", category: "Lifestyle", price: 100, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 100, stock: 1 }] },
    { id: "brown-sipper-bottle", name: "Brown sipper bottle", description: "Brown reusable sipper bottle.", category: "Lifestyle", price: 60, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 60, stock: 1 }] },
    { id: "decorative-round-bowl-plate", name: "Decorative round bowl/plate", description: "Decorative serving bowl/plate.", category: "Lifestyle", price: 200, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 200, stock: 1 }] },
    { id: "copper-glass", name: "Copper glass", description: "Premium copper drinking glass.", category: "Lifestyle", price: 170, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 170, stock: 1 }] },
    { id: "eco-friendly-coffee-mug", name: "Eco friendly coffee mug", description: "Eco-friendly coffee mug. Price to be updated before publishing.", category: "Tea", price: 0, stock: 1, published: false, image: "", variants: [{ name: "Default", price: 0, stock: 1 }] },
    { id: "mini-potli", name: "Mini potli", description: "Mini decorative potli pouch.", category: "Lifestyle", price: 5, stock: 1, published: true, image: "", variants: [{ name: "Default", price: 5, stock: 1 }] }
  ],
  cart: [],
  offers: [
    "Free shipping above Rs 3,000",
    "Rare finds sourced from international shops worldwide",
    "Build your own hamper and save 10% on combo pricing"
  ],
  orders: [],
  bulkInquiries: []
};

function optionalPg() {
  try {
    return require("pg");
  } catch {
    return null;
  }
}

async function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (DATABASE_URL) {
    try {
      const pg = optionalPg();
      if (!pg) throw new Error("DATABASE_URL is set but the pg package is not installed. Run npm install.");
      if (!pgPool) {
        pgPool = new pg.Pool({
          connectionString: DATABASE_URL,
          ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 10000
        });
      }
      await pgPool.query(`
        create table if not exists app_state (
          id text primary key,
          state jsonb not null,
          updated_at timestamptz not null default now()
        )
      `);
      await pgPool.query(`
        create table if not exists orders (
          id text primary key,
          order_data jsonb not null,
          payment_data jsonb,
          created_at timestamptz not null default now()
        )
      `);
      await pgPool.query(
        "insert into app_state (id, state) values ($1, $2) on conflict (id) do nothing",
        ["main", defaultDb]
      );
      storageError = "";
      storageReady = true;
      return;
    } catch (error) {
      storageError = error.message;
      if (pgPool) await pgPool.end().catch(() => {});
      pgPool = null;
    }
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
  }
  storageReady = true;
}

async function readDb() {
  if (!storageReady) await ensureDb();
  if (pgPool) {
    const result = await pgPool.query("select state from app_state where id = $1", ["main"]);
    return result.rows[0]?.state || structuredClone(defaultDb);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

async function writeDb(db) {
  if (!storageReady) await ensureDb();
  if (pgPool) {
    try {
      await pgPool.query(
        "update app_state set state = $2, updated_at = now() where id = $1",
        ["main", db]
      );
      broadcast({ type: "state-updated", at: new Date().toISOString() });
      return;
    } catch (error) {
      storageError = error.message;
      if (pgPool) await pgPool.end().catch(() => {});
      pgPool = null;
    }
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  broadcast({ type: "state-updated", at: new Date().toISOString() });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function isAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return sessions.has(token);
}

function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  sendJson(res, 401, { error: "Admin login required" });
  return false;
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(client => client.write(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 12_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webmanifest": "application/manifest+json; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "uniq-world",
      storage: pgPool ? "postgres" : "json",
      storageError,
      payments: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      adminNotifications: Boolean(ADMIN_EMAIL_WEBHOOK_URL || ADMIN_WHATSAPP_WEBHOOK_URL),
      time: new Date().toISOString()
    });
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    return sendJson(res, 200, {
      storage: pgPool ? "postgres" : "json",
      storageError,
      payments: {
        provider: "razorpay",
        enabled: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
        keyId: RAZORPAY_KEY_ID,
        currency: PAYMENT_CURRENCY
      }
    });
  }

  if (req.method === "GET" && url.pathname === "/api/calendar/import") {
    const source = url.searchParams.get("url") || "";
    if (!/^https:\/\/.+/i.test(source)) return sendJson(res, 400, { error: "Use a valid https calendar URL" });
    try {
      const calendar = await fetchText(source);
      return sendJson(res, 200, { ok: true, calendar });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "Calendar could not be downloaded" });
    }
  }

  const db = await readDb();

  if (req.method === "GET" && url.pathname === "/api/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive"
    });
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    return sendJson(res, 200, db);
  }

  if (req.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const budget = Number(url.searchParams.get("budget") || 0);
    return sendJson(res, 200, smartSearch(db, query, budget));
  }

  if (req.method === "PUT" && url.pathname.startsWith("/api/state/")) {
    const key = url.pathname.split("/").pop();
    if (!["hampers", "inventory", "cart", "offers"].includes(key)) return sendJson(res, 400, { error: "Invalid state key" });
    if (["hampers", "inventory", "offers"].includes(key) && !requireAdmin(req, res)) return;
    const body = await readBody(req);
    db[key] = body.value;
    await writeDb(db);
    return sendJson(res, 200, { ok: true, [key]: db[key] });
  }

  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    const body = await readBody(req);
    const ok = body.password === ADMIN_PASSWORD;
    const token = ok ? crypto.randomBytes(24).toString("hex") : "";
    if (token) sessions.add(token);
    return sendJson(res, ok ? 200 : 401, { ok, token });
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    const body = await readBody(req);
    const order = { id: `order-${Date.now()}`, createdAt: new Date().toISOString(), total: calculateOrderTotal(db, body.items || []), ...body };
    applyOrderStock(db, body.items || []);
    db.orders.unshift(order);
    db.cart = [];
    await persistOrder(order);
    await writeDb(db);
    notifyAdmin("order_placed", order);
    return sendJson(res, 201, { ok: true, order, state: db });
  }

  if (req.method === "POST" && url.pathname === "/api/bulk-inquiries") {
    const body = await readBody(req);
    const inquiry = { id: body.id || `bulk-${Date.now()}`, createdAt: new Date().toISOString(), ...body };
    db.bulkInquiries ||= [];
    db.bulkInquiries.unshift(inquiry);
    db.bulkInquiries = db.bulkInquiries.slice(0, 100);
    await writeDb(db);
    notifyAdmin("bulk_inquiry", inquiry);
    return sendJson(res, 201, { ok: true, inquiry });
  }

  if (req.method === "POST" && url.pathname === "/api/payments/create-order") {
    const body = await readBody(req);
    const items = body.items || [];
    const total = calculateOrderTotal(db, items);
    if (!items.length || total < 1) return sendJson(res, 400, { error: "Cart is empty" });
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return sendJson(res, 503, { error: "Payment gateway is not configured", enabled: false });
    }
    const receipt = `uniq_${Date.now()}`.slice(0, 40);
    const razorpayOrder = await createRazorpayOrder({
      amount: total * 100,
      currency: PAYMENT_CURRENCY,
      receipt,
      notes: { app: "Uniq World", item_count: String(items.length) }
    });
    return sendJson(res, 201, {
      ok: true,
      keyId: RAZORPAY_KEY_ID,
      amount: total,
      currency: PAYMENT_CURRENCY,
      order: razorpayOrder
    });
  }

  if (req.method === "POST" && url.pathname === "/api/payments/verify") {
    const body = await readBody(req);
    const valid = verifyRazorpaySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    if (!valid) return sendJson(res, 400, { error: "Payment verification failed" });
    const items = body.items || [];
    const order = {
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "paid",
      paymentProvider: "razorpay",
      paymentId: body.razorpay_payment_id,
      paymentOrderId: body.razorpay_order_id,
      amount: calculateOrderTotal(db, items),
      customer: body.customer || {},
      delivery: body.delivery || {},
      items
    };
    applyOrderStock(db, items);
    db.orders.unshift(order);
    db.cart = [];
    await persistOrder(order, {
      provider: "razorpay",
      paymentId: body.razorpay_payment_id,
      orderId: body.razorpay_order_id
    });
    await writeDb(db);
    notifyAdmin("payment_received", order);
    return sendJson(res, 201, { ok: true, order, state: db });
  }

  return sendJson(res, 404, { error: "API route not found" });
}

function smartSearch(db, query, budget = 0) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const catalog = [
    ...db.hampers.filter(item => item.published).map(item => ({ type: "hamper", title: item.title, description: item.copy, category: item.category, price: item.price, stock: item.stock, image: item.image })),
    ...db.inventory.filter(item => item.published).map(item => ({ type: "inventory", title: item.name, description: item.description, category: item.category, price: item.price, stock: item.stock, image: item.image }))
  ];
  const intentBoosts = {
    romantic: ["love", "girlfriend", "wife", "anniversary", "rose", "romantic"],
    wellness: ["wellness", "self", "care", "mom", "relax", "tea", "candle"],
    corporate: ["corporate", "employee", "client", "office", "welcome", "team"],
    apology: ["sorry", "apology", "forgive", "repair"]
  };
  const results = catalog.map(item => {
    const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    let score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 4 : 0), 0);
    Object.values(intentBoosts).forEach(group => {
      if (group.some(word => words.includes(word)) && group.some(word => haystack.includes(word))) score += 5;
    });
    if (budget && item.price <= budget) score += 3;
    if (item.stock > 0) score += 2;
    return { ...item, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.price - b.price);
  return {
    query,
    budget,
    summary: results.length
      ? `Found ${results.length} gift matches${budget ? ` under ${budget}` : ""}.`
      : "No exact match yet. Try recipient, occasion, mood, or budget.",
    results: results.slice(0, 8)
  };
}

function calculateOrderTotal(db, lines) {
  const total = lines.reduce((sum, line) => {
    const qty = Math.max(1, Number(line.qty) || 1);
    if (line.type === "reward") return Math.max(0, sum + (Number(line.price) || 0) * qty);
    if (line.type === "hamper") {
      const hamper = db.hampers.find(item => item.id === line.id);
      return sum + (hamper ? hamper.price * qty : 0);
    }
    const individual = (line.selections || []).reduce((lineSum, selection) => {
      const item = db.inventory.find(entry => entry.id === selection.itemId);
      if (!item) return lineSum;
      const variant = itemVariants(item).find(entry => entry.name === selection.variantName) || itemVariants(item)[0];
      return lineSum + (variant?.price || 0) * (Math.max(1, Number(selection.qty) || 1));
    }, 0);
    return sum + Math.round(individual * 0.9) * qty;
  }, 0);
  return Math.max(0, total);
}

function createRazorpayOrder(payload) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.razorpay.com",
      path: "/v1/orders",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      }
    }, response => {
      let body = "";
      response.on("data", chunk => { body += chunk; });
      response.on("end", () => {
        let json = {};
        try {
          json = body ? JSON.parse(body) : {};
        } catch {
          json = { error: { description: body || "Invalid Razorpay response" } };
        }
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(json);
        else reject(new Error(json.error?.description || "Razorpay order creation failed"));
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Razorpay request timed out")));
    req.end(JSON.stringify(payload));
  });
}

function fetchText(source) {
  return new Promise((resolve, reject) => {
    const req = https.get(source, response => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`Calendar download failed with status ${response.statusCode}`));
        response.resume();
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
        if (body.length > 2_000_000) req.destroy(new Error("Calendar file is too large"));
      });
      response.on("end", () => resolve(body));
    });
    req.setTimeout(15000, () => req.destroy(new Error("Calendar download timed out")));
    req.on("error", reject);
  });
}

function notifyAdmin(type, payload) {
  const message = adminNotificationMessage(type, payload);
  const basePayload = {
    app: "Uniq World",
    type,
    message,
    adminEmail: ADMIN_EMAIL,
    adminWhatsapp: ADMIN_WHATSAPP_NUMBER,
    payload
  };
  if (ADMIN_EMAIL_WEBHOOK_URL) postWebhook(ADMIN_EMAIL_WEBHOOK_URL, { channel: "email", ...basePayload });
  if (ADMIN_WHATSAPP_WEBHOOK_URL) postWebhook(ADMIN_WHATSAPP_WEBHOOK_URL, { channel: "whatsapp", ...basePayload });
}

function adminNotificationMessage(type, payload) {
  if (type === "bulk_inquiry") {
    return `New bulk gifting inquiry from ${payload.company || "customer"} for ${payload.quantity || 0} hampers at Rs ${payload.budget || 0} each. Contact: ${payload.contact || "not provided"}.`;
  }
  const total = payload.total || payload.amount || calculateOrderTotal({ hampers: [], inventory: [] }, payload.items || []);
  return `New Uniq World ${type === "payment_received" ? "paid order" : "order"} ${payload.id || ""} for Rs ${total}. Customer: ${payload.customer?.name || "Customer"}. Phone: ${payload.delivery?.phone || payload.customer?.contact || "not provided"}.`;
}

function postWebhook(targetUrl, payload) {
  try {
    const parsed = new URL(targetUrl);
    const transport = parsed.protocol === "http:" ? http : https;
    const body = JSON.stringify(payload);
    const req = transport.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "http:" ? 80 : 443),
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, response => response.resume());
    req.setTimeout(8000, () => req.destroy());
    req.on("error", error => console.warn(`Admin notification failed: ${error.message}`));
    req.end(body);
  } catch (error) {
    console.warn(`Invalid admin notification webhook: ${error.message}`);
  }
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!RAZORPAY_KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (expected.length !== String(signature).length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function persistOrder(order, payment = null) {
  if (!pgPool) return;
  await pgPool.query(
    "insert into orders (id, order_data, payment_data) values ($1, $2, $3) on conflict (id) do update set order_data = excluded.order_data, payment_data = excluded.payment_data",
    [order.id, order, payment]
  );
}

function itemVariants(item) {
  return Array.isArray(item.variants) && item.variants.length
    ? item.variants
    : [{ name: "Default", price: item.price, stock: item.stock }];
}

function syncItemStock(item) {
  const variants = itemVariants(item);
  item.variants = variants;
  item.price = variants[0]?.price || item.price || 0;
  item.stock = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
}

function applyOrderStock(db, lines) {
  lines.forEach(line => {
    if (line.type === "reward") return;
    if (line.type === "hamper") {
      const hamper = db.hampers.find(item => item.id === line.id);
      if (hamper) hamper.stock = Math.max(0, hamper.stock - (line.qty || 1));
      return;
    }

    (line.selections || []).forEach(selection => {
      const item = db.inventory.find(entry => entry.id === selection.itemId);
      if (!item) return;
      const variants = itemVariants(item);
      const variant = variants.find(entry => entry.name === selection.variantName) || variants[0];
      if (variant) variant.stock = Math.max(0, variant.stock - (selection.qty || 1) * (line.qty || 1));
      item.variants = variants;
      syncItemStock(item);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(error => sendJson(res, 500, { error: error.message }));
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Uniq World full-stack app running at http://127.0.0.1:${PORT}`);
});
