const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "uniqadmin";
const sessions = new Set();
const clients = new Set();
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const defaultDb = {
  hampers: [
    { id: "midnight-bloom", title: "Midnight Bloom", copy: "Velvet box, fragrance, candle, and truffles.", price: 5200, stock: 8, category: "Luxury", published: true, image: "" },
    { id: "apology-edit", title: "The Apology Edit", copy: "Soft florals, secret letter, tea, and calming bath ritual.", price: 3400, stock: 11, category: "Wellness", published: true, image: "" },
    { id: "executive-onboarding", title: "Executive Onboarding", copy: "Branded magnetic box with notebook, coffee, and desk objects.", price: 4800, stock: 20, category: "Corporate", published: true, image: "" },
    { id: "self-care-sunday", title: "Self-care Sunday", copy: "Skin care, bath ritual, tea, book, and mindfulness challenge.", price: 2900, stock: 6, category: "Wellness", published: true, image: "" }
  ],
  inventory: [
    { id: "belgian-chocolate", name: "Belgian Chocolate Box", description: "Assorted premium chocolates for celebration hampers.", category: "Chocolate", price: 650, stock: 24, published: true, image: "", variants: [{ name: "Classic", price: 650, stock: 12 }, { name: "Premium", price: 850, stock: 12 }] },
    { id: "jasmine-candle", name: "Jasmine Soy Candle", description: "Warm floral candle with reusable glass jar.", category: "Candle", price: 850, stock: 18, published: true, image: "", variants: [{ name: "Mini", price: 450, stock: 8 }, { name: "Large", price: 850, stock: 10 }] },
    { id: "green-tea-tin", name: "Green Tea Tin", description: "Calming loose-leaf tea in a keepsake tin.", category: "Tea", price: 520, stock: 30, published: true, image: "", variants: [{ name: "100g", price: 520, stock: 18 }, { name: "200g", price: 920, stock: 12 }] }
  ],
  cart: [],
  orders: []
};

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
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
  const db = readDb();

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "uniq-world", time: new Date().toISOString() });
  }

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

  if (req.method === "PUT" && url.pathname.startsWith("/api/state/")) {
    const key = url.pathname.split("/").pop();
    if (!["hampers", "inventory", "cart"].includes(key)) return sendJson(res, 400, { error: "Invalid state key" });
    if (["hampers", "inventory"].includes(key) && !requireAdmin(req, res)) return;
    const body = await readBody(req);
    db[key] = body.value;
    writeDb(db);
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
    const order = { id: `order-${Date.now()}`, createdAt: new Date().toISOString(), ...body };
    applyOrderStock(db, body.items || []);
    db.orders.unshift(order);
    db.cart = [];
    writeDb(db);
    return sendJson(res, 201, { ok: true, order, state: db });
  }

  return sendJson(res, 404, { error: "API route not found" });
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
