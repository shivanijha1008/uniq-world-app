const ADMIN_PASSWORD = "uniqadmin";
const API_BASE = "";

const defaultRecommendations = [
  { title: "Gratitude Ritual", copy: "Tea, handwritten note, candle, and a memory QR.", price: 2800 },
  { title: "Soft Launch Love", copy: "Rose quartz palette with chocolate, fragrance, and satin wrap.", price: 3600 },
  { title: "Founder Welcome Kit", copy: "Premium notebook, desk candle, coffee, and branded card.", price: 4200 }
];

const occasions = [
  { date: "08", title: "Riya's birthday", detail: "Favorite color: sage. Suggested budget Rs 3,000." },
  { date: "16", title: "Parents' anniversary", detail: "Repeat the tea hamper, add photo slideshow." },
  { date: "22", title: "Diwali corporate list", detail: "84 employees need approval workflow." }
];

const emotions = [
  ["Love", "Romantic keepsakes"],
  ["Gratitude", "Thank-you rituals"],
  ["Missing You", "Memory-led gifts"],
  ["Sorry", "Soft repair notes"],
  ["Motivation", "Desk and wellness"],
  ["Self Love", "Quarterly care"],
  ["New Beginning", "Home and hope"],
  ["Congratulations", "Luxury celebration"]
];

const filters = ["All", "Luxury", "Corporate", "Wellness", "Eco", "Published"];
const ratings = [
  ["Chamomile tea", "Keep sending", 5],
  ["Citrus body wash", "Try warmer fragrance", 3],
  ["Linen journal", "Loved", 5]
];

let vault = loadState("uniqVault", [
  { initials: "RS", name: "Riya Sharma", detail: "Birthday Aug 8. Sage, dark chocolate, jasmine, acts of service." },
  { initials: "AM", name: "Aarav Mehta", detail: "Fitness, coffee, tech accessories. Avoid nuts." },
  { initials: "TM", name: "Team Marketing", detail: "22 members. Diwali budget Rs 2,200 each. Needs GST invoice." }
]);

const moods = [
  { name: "Romantic Luxe", colors: ["#ff4d8d", "#ffd166"], note: "Use for love, birthdays, anniversaries, and warm celebration boxes." },
  { name: "Calm Wellness", colors: ["#00c2a8", "#7c5cff"], note: "Use for self-care, apology, recovery, spa, and tea-led hampers." },
  { name: "Founder Glow", colors: ["#ff8a00", "#3ddc97"], note: "Use for corporate, onboarding, thank-you, and premium client gifting." }
];

const defaultHampers = [
  { id: "midnight-bloom", title: "Midnight Bloom", copy: "Velvet box, fragrance, candle, and truffles.", price: 5200, stock: 8, category: "Luxury", published: true, image: "" },
  { id: "apology-edit", title: "The Apology Edit", copy: "Soft florals, secret letter, tea, and calming bath ritual.", price: 3400, stock: 11, category: "Wellness", published: true, image: "" },
  { id: "executive-onboarding", title: "Executive Onboarding", copy: "Branded magnetic box with notebook, coffee, and desk objects.", price: 4800, stock: 20, category: "Corporate", published: true, image: "" },
  { id: "self-care-sunday", title: "Self-care Sunday", copy: "Skin care, bath ritual, tea, book, and mindfulness challenge.", price: 2900, stock: 6, category: "Wellness", published: true, image: "" }
];

const defaultInventory = [
  { id: "belgian-chocolate", name: "Belgian Chocolate Box", description: "Assorted premium chocolates for celebration hampers.", category: "Chocolate", price: 650, stock: 24, published: true, image: "" },
  { id: "jasmine-candle", name: "Jasmine Soy Candle", description: "Warm floral candle with reusable glass jar.", category: "Candle", price: 850, stock: 18, published: true, image: "" },
  { id: "green-tea-tin", name: "Green Tea Tin", description: "Calming loose-leaf tea in a keepsake tin.", category: "Tea", price: 520, stock: 30, published: true, image: "" },
  { id: "silk-scrunchie", name: "Silk Scrunchie Set", description: "Soft pastel accessory set for self-care gifts.", category: "Lifestyle", price: 480, stock: 16, published: true, image: "" },
  { id: "gratitude-journal", name: "Gratitude Journal", description: "Guided journal with premium paper and gold details.", category: "Stationery", price: 720, stock: 14, published: true, image: "" },
  { id: "rose-face-mist", name: "Rose Face Mist", description: "Refreshing beauty add-on for wellness hampers.", category: "Beauty", price: 690, stock: 12, published: true, image: "" }
];

let activeFilter = "All";
let moodIndex = 0;
let adminUnlocked = sessionStorage.getItem("uniqAdminUnlocked") === "true";
let adminToken = sessionStorage.getItem("uniqAdminToken") || "";
let hampers = loadState("uniqHampers", defaultHampers).map(item => ({ image: "", ...item }));
let inventory = loadState("uniqInventory", defaultInventory).map(item => {
  const normalized = { image: "", published: true, ...item };
  syncItemStock(normalized);
  return normalized;
});
let cart = normalizeCart(loadState("uniqCart", []));
let draftImage = "";
let inventoryDraftImage = "";
let selectedInventoryIds = loadState("uniqBuilderSelection", []);
let appConfig = { checked: false, payments: { enabled: false, keyId: "", currency: "INR" }, storage: "json" };
let challengeJoined = localStorage.getItem("uniqChallengeJoined") === "true";

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function loadState(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (["uniqHampers", "uniqInventory", "uniqCart"].includes(key)) {
    const apiKey = { uniqHampers: "hampers", uniqInventory: "inventory", uniqCart: "cart" }[key];
    apiSave(apiKey, value);
  }
}

async function apiSave(key, value) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    await fetch(`${API_BASE}/api/state/${key}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ value })
    });
  } catch {
    // Static hosting fallback: localStorage remains available.
  }
}

function applyState(state) {
  hampers = (state.hampers || hampers).map(item => ({ image: "", ...item }));
  inventory = (state.inventory || inventory).map(item => {
    const normalized = { image: "", published: true, ...item };
    syncItemStock(normalized);
    return normalized;
  });
  cart = normalizeCart(state.cart || cart);
  localStorage.setItem("uniqHampers", JSON.stringify(hampers));
  localStorage.setItem("uniqInventory", JSON.stringify(inventory));
  localStorage.setItem("uniqCart", JSON.stringify(cart));
}

async function hydrateFromApi() {
  try {
    const response = await fetch(`${API_BASE}/api/state`, { cache: "no-store" });
    if (!response.ok) return;
    applyState(await response.json());
    renderHome();
    renderHampers();
    renderBuilder();
    renderAdmin();
    renderCart();
    lucide.createIcons();
  } catch {
    // Static hosting fallback.
  }
}

async function hydrateConfig() {
  try {
    const response = await fetch(`${API_BASE}/api/config`, { cache: "no-store" });
    if (response.ok) appConfig = { checked: true, ...(await response.json()) };
    renderCart();
    lucide.createIcons();
  } catch {
    // Static hosting fallback.
  }
}

function connectRealtime() {
  if (!("EventSource" in window)) return;
  try {
    const events = new EventSource(`${API_BASE}/api/events`);
    events.onmessage = event => {
      const payload = JSON.parse(event.data || "{}");
      if (payload.type === "state-updated") hydrateFromApi();
    };
  } catch {
    // Static hosting fallback.
  }
}

function money(value) {
  return `Rs ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function productArt(image = "", label = "Gift image") {
  const safeLabel = escapeHtml(label);
  if (!image) return `<div class="product-art celebration-art" aria-label="${safeLabel}"></div>`;
  return `<div class="product-art has-image" aria-label="${safeLabel}" style="background-image: url('${image}')"></div>`;
}

function itemVariants(item) {
  const variants = Array.isArray(item.variants) && item.variants.length
    ? item.variants
    : [{ name: "Default", price: item.price, stock: item.stock }];
  return variants.map((variant, index) => ({
    name: variant.name || `Variant ${index + 1}`,
    price: Number(variant.price) || Number(item.price) || 0,
    stock: Number(variant.stock) || 0
  }));
}

function variantKey(itemId, variantIndex) {
  return `${itemId}::${variantIndex}`;
}

function parseVariantKey(key) {
  const [itemId, variantIndex = "0"] = String(key).split("::");
  return { itemId, variantIndex: Number(variantIndex) || 0 };
}

function getVariantChoice(key) {
  const { itemId, variantIndex } = parseVariantKey(key);
  const item = inventory.find(entry => entry.id === itemId);
  if (!item) return null;
  const variant = itemVariants(item)[variantIndex];
  if (!variant) return null;
  return { item, variant, key, variantIndex };
}

function selectedEntry(key) {
  const existing = selectedInventoryIds.find(entry => typeof entry === "object" && entry.key === key);
  if (existing) return existing;
  if (selectedInventoryIds.includes(key)) return { key, qty: 1 };
  return null;
}

function normalizeSelection() {
  selectedInventoryIds = selectedInventoryIds.map(entry => {
    if (typeof entry === "object" && entry.key) return { key: entry.key, qty: Math.max(1, Number(entry.qty) || 1) };
    return { key: String(entry).includes("::") ? String(entry) : variantKey(entry, 0), qty: 1 };
  }).filter(entry => getVariantChoice(entry.key));
}

function syncItemStock(item) {
  const variants = itemVariants(item);
  item.variants = variants;
  item.price = variants[0]?.price || item.price || 0;
  item.stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
}

function parseVariants(text, fallbackPrice, fallbackStock) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const variants = lines.map((line, index) => {
    const parts = line.split("|").map(part => part.trim());
    return {
      name: parts[0] || `Variant ${index + 1}`,
      price: Number(parts[1]) || Number(fallbackPrice) || 0,
      stock: Number(parts[2]) || 0
    };
  }).filter(variant => variant.price > 0);
  if (variants.length) return variants;
  return [{ name: "Default", price: Number(fallbackPrice) || 0, stock: Number(fallbackStock) || 0 }];
}

function variantsToText(item) {
  return itemVariants(item).map(variant => `${variant.name} | ${variant.price} | ${variant.stock}`).join("\n");
}

function comboTotals(ids = selectedInventoryIds) {
  const items = ids.map(entry => {
    const key = typeof entry === "object" ? entry.key : entry;
    const qty = typeof entry === "object" ? Math.max(1, Number(entry.qty) || 1) : 1;
    const choice = getVariantChoice(key);
    return choice ? { ...choice, qty } : null;
  }).filter(Boolean);
  const individual = items.reduce((sum, choice) => sum + choice.variant.price * choice.qty, 0);
  const combo = Math.round(individual * 0.9);
  return { items, individual, combo, saving: individual - combo };
}

function selectedUniqueItemCount(items = comboTotals().items) {
  return new Set(items.map(choice => choice.item.id)).size;
}

function normalizeCart(lines) {
  return lines.map(line => {
    if (line.cartId && line.type && typeof line.price === "number") return line;
    const hamper = hampers.find(item => item.id === line.id);
    if (!hamper) return null;
    return {
      cartId: `hamper:${hamper.id}`,
      type: "hamper",
      id: hamper.id,
      title: hamper.title,
      price: hamper.price,
      qty: line.qty || 1
    };
  }).filter(Boolean);
}

function availableInventory() {
  const maxBudget = Number(qs("#budgetRange")?.value || 5000);
  return inventory.filter(item => item.published && itemVariants(item).some(variant => variant.stock > 0 && variant.price <= maxBudget));
}

function render() {
  renderHome();
  renderDiscover();
  renderHampers();
  renderBuilder();
  renderAdmin();
  renderSubscription();
  renderProfile();
  renderCart();
  renderMood();
  seedChat();
  wireEvents();
  lucide.createIcons();
}

function renderHome() {
  qs("#recommendations").innerHTML = defaultRecommendations.map(item => `
    <article class="product-card">
      ${productArt("", item.title)}
      <h3>${item.title}</h3>
      <p>${item.copy}</p>
      <span class="price">${money(item.price)}</span>
    </article>
  `).join("");

  qs("#occasionList").innerHTML = occasions.map(item => `
    <article class="occasion">
      <span class="date-pill">${item.date}</span>
      <div>
        <strong>${item.title}</strong>
        <p class="muted">${item.detail}</p>
      </div>
      <button class="icon-button" aria-label="Create gift for ${item.title}" data-nav="concierge">
        <i data-lucide="sparkles"></i>
      </button>
    </article>
  `).join("");
}

function renderDiscover() {
  qs("#emotionGrid").innerHTML = emotions.map(([name, copy]) => `
    <button class="emotion-card" data-nav="hampers">
      <strong>${name}</strong>
      <span>${copy}</span>
    </button>
  `).join("");
}

function renderHampers() {
  qs("#hamperFilters").innerHTML = filters.map(filter => `
    <button class="${filter === activeFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>
  `).join("");

  const visibleHampers = hampers.filter(hamper => {
    if (!hamper.published || hamper.stock < 1) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Published") return hamper.published;
    return hamper.category === activeFilter;
  });

  qs("#hamperList").innerHTML = visibleHampers.map(hamper => {
    const inCart = cart.find(item => item.type === "hamper" && item.id === hamper.id)?.qty || 0;
    return `
      <article class="hamper-card">
        ${productArt(hamper.image, hamper.title)}
        <div>
          <div class="hamper-heading">
            <h3>${escapeHtml(hamper.title)}</h3>
            <span>${escapeHtml(hamper.category)}</span>
          </div>
          <p>${escapeHtml(hamper.copy)}</p>
          <div class="meta-row">
            <span class="price">${money(hamper.price)}</span>
            <span>${hamper.stock} in stock</span>
          </div>
          <div class="card-actions">
            <button class="primary-mini" data-action="addCart" data-id="${hamper.id}">
              <i data-lucide="shopping-bag"></i>${inCart ? `Added (${inCart})` : "Add to cart"}
            </button>
            <button class="ghost-mini" data-action="shareHamper" data-id="${hamper.id}">
              <i data-lucide="share-2"></i>Share
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("") || `<section class="empty-state">No published hampers match this view.</section>`;
  lucide.createIcons();
}

function renderBuilder() {
  const maxBudget = Number(qs("#budgetRange")?.value || 5000);
  const choices = availableInventory();
  normalizeSelection();
  selectedInventoryIds = selectedInventoryIds.filter(entry => {
    const choice = getVariantChoice(entry.key);
    return choice && choices.some(item => item.id === choice.item.id) && choice.variant.stock > 0 && choice.variant.price <= maxBudget;
  }).map(entry => {
    const choice = getVariantChoice(entry.key);
    return { key: entry.key, qty: Math.min(entry.qty, choice?.variant.stock || entry.qty) };
  });
  saveState("uniqBuilderSelection", selectedInventoryIds);
  const totals = comboTotals();
  const overBudget = totals.combo > maxBudget;

  qs("#budgetValue").textContent = money(maxBudget);
  qs("#builderRangeText").textContent = `Rs 50 - ${money(maxBudget)}`;
  qs("#individualPrice").textContent = money(totals.individual);
  qs("#comboPrice").textContent = money(totals.combo);
  qs("#comboSaving").textContent = money(totals.saving);
  const uniqueCount = selectedUniqueItemCount(totals.items);
  qs("#shippingBanner").textContent = uniqueCount < 3
    ? `Add at least ${3 - uniqueCount} more item${3 - uniqueCount === 1 ? "" : "s"} to build your own hamper.`
    : totals.combo >= 3000
      ? "Free shipping unlocked over Rs 3,000."
      : `${money(3000 - totals.combo)} more to unlock free shipping.`;
  qs("#shippingBanner").classList.toggle("success", uniqueCount >= 3 && totals.combo >= 3000);

  const variantChoices = choices.flatMap(item => itemVariants(item).map((variant, index) => ({ item, variant, key: variantKey(item.id, index) })))
    .filter(choice => choice.variant.stock > 0 && choice.variant.price <= maxBudget);

  const groupedChoices = variantChoices.reduce((groups, choice) => {
    groups[choice.item.category] ||= [];
    groups[choice.item.category].push(choice);
    return groups;
  }, {});

  qs("#inventoryPicker").innerHTML = Object.entries(groupedChoices).map(([category, categoryChoices]) => `
    <section class="inventory-category">
      <h3>${escapeHtml(category)}</h3>
      <div class="inventory-category-list">
        ${categoryChoices.map(choice => {
          const selected = selectedEntry(choice.key);
          return `
            <article class="inventory-pick ${selected ? "active" : ""}">
              <button class="inventory-choice" data-action="toggleInventoryPick" data-id="${choice.key}" type="button">
                ${productArt(choice.item.image, choice.item.name)}
                <span>
                  <strong>${escapeHtml(choice.item.name)} - ${escapeHtml(choice.variant.name)}</strong>
                  <small>${money(choice.variant.price)} each | ${choice.variant.stock} available</small>
                </span>
              </button>
              ${selected ? `
                <div class="variant-qty">
                  <button data-action="builderQtyDown" data-id="${choice.key}" type="button">-</button>
                  <span>${selected.qty}</span>
                  <button data-action="builderQtyUp" data-id="${choice.key}" type="button">+</button>
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `).join("") || `<section class="empty-state">No inventory variants are available in this price range.</section>`;

  const comboButton = qs("[data-action='addCombo']");
  comboButton.disabled = selectedInventoryIds.length === 0 || overBudget || uniqueCount < 3;
  comboButton.innerHTML = overBudget
    ? `<i data-lucide="circle-alert"></i>Combo exceeds budget`
    : uniqueCount < 3
      ? `<i data-lucide="circle-alert"></i>Select at least 3 items`
    : `<i data-lucide="package-plus"></i>Add combo to cart`;
  lucide.createIcons();
}

function renderAdmin() {
  qs("#adminLogin").hidden = adminUnlocked;
  qs("#adminWorkspace").hidden = !adminUnlocked;
  qs("#adminLogout").hidden = !adminUnlocked;
  qs("#adminStatus").textContent = adminUnlocked
    ? "Admin unlocked. Manage inventory and ready hamper catalog."
    : "Login to manage inventory, hamper pictures, descriptions, and pricing.";
  renderInventoryAdminList();
  renderImagePreview();
  renderInventoryImagePreview();
}

function renderInventoryAdminList() {
  const target = qs("#inventoryAdminList");
  if (!target) return;
  target.innerHTML = inventory.map(item => `
    <article class="inventory-admin-card ${!item.published ? "draft" : ""}">
      ${productArt(item.image, item.name)}
      <div>
        <div class="hamper-heading">
          <h3>${escapeHtml(item.name)}</h3>
          <span>${item.published ? "Live" : "Hidden"}</span>
        </div>
        <p>${escapeHtml(item.description)}</p>
        <p class="combo-detail">${itemVariants(item).map(variant => `${escapeHtml(variant.name)}: ${money(variant.price)} / ${variant.stock}`).join(", ")}</p>
        <div class="meta-row">
          <span class="price">From ${money(Math.min(...itemVariants(item).map(variant => variant.price)))}</span>
          <span>${item.stock} total qty</span>
        </div>
        <div class="card-actions">
          <button class="ghost-mini" data-action="editInventory" data-id="${item.id}"><i data-lucide="pencil"></i>Edit</button>
          <button class="danger-mini" data-action="deleteInventory" data-id="${item.id}"><i data-lucide="trash-2"></i>Delete</button>
        </div>
      </div>
    </article>
  `).join("") || `<section class="empty-state">Add your first inventory item.</section>`;
  lucide.createIcons();
}

function renderSubscription() {
  qs("#ratingList").innerHTML = ratings.map(([name, note, score]) => `
    <article class="rating-item">
      <div>
        <strong>${name}</strong>
        <p class="muted">${note}</p>
      </div>
      <span class="stars">${"*".repeat(score)}${"-".repeat(5 - score)}</span>
    </article>
  `).join("");
  qsa(".challenge-row span").forEach(item => item.classList.toggle("active", challengeJoined));
}

function renderProfile() {
  qs("#vaultList").innerHTML = vault.map(person => `
    <article class="vault-card">
      <span class="avatar">${person.initials}</span>
      <div>
        <strong>${person.name}</strong>
        <p class="muted">${person.detail}</p>
      </div>
    </article>
  `).join("");
}

function renderMood() {
  const mood = moods[moodIndex % moods.length];
  qs("#moodBoard").innerHTML = `
    <div class="mood-copy">
      <strong>${escapeHtml(mood.name)}</strong>
      <p>${escapeHtml(mood.note)}</p>
    </div>
    ${Array.from({ length: 3 }, (_, index) => `
      <div class="mood-tile" style="background: linear-gradient(135deg, ${mood.colors[index % 2]}, ${mood.colors[(index + 1) % 2]})">
        <span>${["Wrap", "Card", "Accent"][index]}</span>
      </div>
    `).join("")}
  `;
}

function renderCart() {
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const paymentLabel = appConfig.payments?.enabled ? "Pay securely" : "Place order";
  qs("#cartCount").textContent = cartCount;
  qs("#cartTotal").textContent = money(cartTotal);
  qs("#cartItems").innerHTML = cart.length ? cart.map(item => `
    <article class="cart-line ${item.type === "reward" ? "reward-line" : ""}">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p class="muted">${item.type === "combo" ? `Combo ${money(item.price)} vs ${money(item.individualTotal)} individual` : item.type === "reward" ? "Uniq Rewards applied" : `${money(item.price)} each`}</p>
        ${item.type === "combo" ? `<p class="combo-detail">${(item.selections || []).map(selection => `${escapeHtml(selection.itemName)} ${escapeHtml(selection.variantName)} x${selection.qty}`).join(", ")}</p>` : ""}
      </div>
      ${item.type === "reward" ? `<button class="ghost-mini" data-action="removeReward" type="button">Remove</button>` : `<div class="qty-control">
        <button data-action="decCart" data-cart-id="${item.cartId}" aria-label="Decrease ${escapeHtml(item.title)}">-</button>
        <span>${item.qty}</span>
        <button data-action="incCart" data-cart-id="${item.cartId}" aria-label="Increase ${escapeHtml(item.title)}">+</button>
      </div>`}
    </article>
  `).join("") : `<section class="empty-state">Your cart is waiting for a celebration.</section>`;
  const checkoutButton = qs("[data-action='checkout']");
  if (checkoutButton) {
    checkoutButton.innerHTML = `<i data-lucide="credit-card"></i>${paymentLabel}`;
    checkoutButton.disabled = !cart.length;
  }
}

function navigate(screen) {
  qsa(".screen").forEach(item => item.classList.toggle("active", item.dataset.screen === screen));
  qsa(".tabbar button").forEach(item => item.classList.toggle("active", item.dataset.nav === screen));
  qs(`.screen[data-screen="${screen}"]`)?.scrollTo({ top: 0, behavior: "smooth" });
}

function seedChat() {
  qs("#chatLog").innerHTML = `
    <div class="bubble ai">Fill the brief above and I will suggest a hamper from live inventory with exact item pricing and combo savings.</div>
    <div class="gift-plan">
      <h3>What I check</h3>
      <div class="plan-grid">
        <span>Recipient and occasion</span>
        <span>Budget fit</span>
        <span>Current stock</span>
        <span>10% combo price</span>
      </div>
    </div>
  `;
}

function buildAiBriefText() {
  return [
    qs("#aiRecipient")?.value,
    qs("#aiOccasion")?.value,
    qs("#aiMood")?.value,
    qs("#aiRequirements")?.value,
    qs("#aiBudget")?.value
  ].filter(Boolean).join(" ");
}

function inventoryMatches(text, budget) {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return inventory.flatMap(item => itemVariants(item).map((variant, index) => ({ item, variant, key: variantKey(item.id, index) })))
    .filter(choice => choice.item.published && choice.variant.stock > 0 && choice.variant.price <= budget)
    .map(choice => {
      const haystack = `${choice.item.name} ${choice.item.description} ${choice.item.category} ${choice.variant.name}`.toLowerCase();
      const score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 4 : 0), 0)
        + (choice.item.category.toLowerCase().includes(qs("#aiMood")?.value.toLowerCase() || "") ? 5 : 0)
        + Math.max(0, 4 - Math.floor(choice.variant.price / 1000));
      return { ...choice, score };
    })
    .sort((a, b) => b.score - a.score || a.variant.price - b.variant.price);
}

function suggestInventoryHamper(event) {
  event.preventDefault();
  const budget = Number(qs("#aiBudget").value) || 3000;
  const brief = buildAiBriefText();
  const picks = [];
  let total = 0;
  inventoryMatches(brief, budget).forEach(choice => {
    if (picks.some(pick => pick.item.id === choice.item.id)) return;
    if (picks.length >= 5) return;
    if (total + choice.variant.price <= budget || picks.length < 3) {
      picks.push(choice);
      total += choice.variant.price;
    }
  });
  const combo = Math.round(total * 0.9);
  const underBudget = combo <= budget;
  const title = `${qs("#aiMood").value} ${qs("#aiOccasion").value || "Gift"} Hamper`;
  qs("#chatLog").insertAdjacentHTML("afterbegin", `
    <div class="gift-plan ai-plan">
      <h3>${escapeHtml(title)}</h3>
      <p class="muted">For ${escapeHtml(qs("#aiRecipient").value || "recipient")} | Budget ${money(budget)} | ${underBudget ? "Fits budget" : "Slightly above budget"}</p>
      <div class="ai-price-strip">
        <span>Individual: <strong>${money(total)}</strong></span>
        <span>Combo: <strong>${money(combo)}</strong></span>
        <span>Saving: <strong>${money(total - combo)}</strong></span>
      </div>
      <div class="search-results">
        ${picks.map(choice => `
          <article class="search-result">
            ${productArt(choice.item.image, choice.item.name)}
            <div>
              <strong>${escapeHtml(choice.item.name)} - ${escapeHtml(choice.variant.name)}</strong>
              <span>${escapeHtml(choice.item.category)} | ${money(choice.variant.price)} | ${choice.variant.stock} available</span>
              <p>${escapeHtml(choice.item.description)}</p>
            </div>
          </article>
        `).join("") || `<section class="empty-state">No live inventory fits this brief yet. Add more inventory or increase budget.</section>`}
      </div>
      <div class="card-actions">
        <button class="primary-mini" data-action="useAiPicks" data-keys="${picks.map(pick => pick.key).join(",")}"><i data-lucide="package-plus"></i>Use in builder</button>
      </div>
    </div>
  `);
  lucide.createIcons();
}

async function addConciergeReply(message) {
  const lower = message.toLowerCase();
  const relationship = lower.includes("girlfriend") ? "girlfriend" : lower.includes("mom") ? "mother" : "recipient";
  const budget = message.match(/(?:rs|inr)?\s?([0-9]{3,5})/i)?.[1] || "3200";
  const theme = lower.includes("sorry") ? "Soft apology ritual" : lower.includes("birthday") ? "Birthday memory box" : "Celebration edit";
  qs("#chatLog").insertAdjacentHTML("beforeend", `
    <div class="bubble user">${escapeHtml(message)}</div>
    <div class="bubble ai">I'd build a ${theme.toLowerCase()} for your ${relationship}, keeping the total near ${money(budget)}.</div>
  `);
  try {
    const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(message)}&budget=${encodeURIComponent(budget)}`, { cache: "no-store" });
    if (!response.ok) return;
    const search = await response.json();
    const cards = search.results.map(item => `
      <article class="search-result">
        ${productArt(item.image, item.title)}
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.category)} | ${money(item.price)}</span>
          <p>${escapeHtml(item.description)}</p>
        </div>
      </article>
    `).join("");
    qs("#chatLog").insertAdjacentHTML("beforeend", `
      <div class="gift-plan">
        <h3>AI search matches</h3>
        <p class="muted">${escapeHtml(search.summary)}</p>
        <div class="search-results">${cards || `<section class="empty-state">Try a clearer occasion, recipient, or budget.</section>`}</div>
      </div>
    `);
    lucide.createIcons();
  } catch {
    // Keep the local concierge response available offline.
  }
}

function addHamperToCart(id) {
  const hamper = hampers.find(item => item.id === id);
  if (!hamper || !hamper.published || hamper.stock < 1) return;
  const cartId = `hamper:${id}`;
  const line = cart.find(item => item.cartId === cartId);
  if (line) {
    line.qty = Math.min(line.qty + 1, hamper.stock);
  } else {
    cart.push({ cartId, type: "hamper", id, title: hamper.title, price: hamper.price, qty: 1 });
  }
  persistCart();
}

function addComboToCart() {
  const totals = comboTotals();
  const maxBudget = Number(qs("#budgetRange").value);
  if (!totals.items.length) return showToast("Select inventory products first.");
  if (selectedUniqueItemCount(totals.items) < 3) return showToast("Add at least 3 different items to build your own hamper.");
  if (totals.combo > maxBudget) return showToast("Combo is above the selected budget.");
  const minStock = Math.min(...totals.items.map(choice => Math.floor(choice.variant.stock / choice.qty)));
  if (minStock < 1) return showToast("One selected item is out of stock.");
  cart.push({
    cartId: `combo:${Date.now()}`,
    type: "combo",
    selections: totals.items.map(choice => ({
      itemId: choice.item.id,
      itemName: choice.item.name,
      variantName: choice.variant.name,
      unitPrice: choice.variant.price,
      qty: choice.qty
    })),
    itemIds: totals.items.map(choice => choice.item.id),
    title: `Custom combo (${totals.items.reduce((sum, choice) => sum + choice.qty, 0)} items)`,
    price: totals.combo,
    individualTotal: totals.individual,
    qty: 1
  });
  persistCart();
  showToast(`Combo added. You saved ${money(totals.saving)}.`);
}

function maxQtyForCartLine(line) {
  if (line.type === "hamper") {
    return hampers.find(item => item.id === line.id)?.stock || 0;
  }
  const selections = line.selections || line.itemIds?.map(id => ({ itemId: id, variantName: "Default", qty: 1 })) || [];
  return Math.min(...selections.map(selection => {
    const item = inventory.find(entry => entry.id === selection.itemId);
    if (!item) return 0;
    const variant = itemVariants(item).find(entry => entry.name === selection.variantName) || itemVariants(item)[0];
    return Math.floor((variant?.stock || 0) / (selection.qty || 1));
  }));
}

function changeCart(cartId, delta) {
  const line = cart.find(item => item.cartId === cartId);
  if (!line) return;
  line.qty += delta;
  if (line.qty < 1) cart = cart.filter(item => item.cartId !== cartId);
  else line.qty = Math.min(line.qty, maxQtyForCartLine(line));
  persistCart();
}

function persistCart() {
  saveState("uniqCart", cart);
  renderCart();
  renderHampers();
}

async function checkout() {
  const message = qs("#checkoutMessage");
  if (!cart.length) {
    message.textContent = "Add at least one item before placing an order.";
    return;
  }
  if (!appConfig.checked) await hydrateConfig();
  const orderItems = structuredClone(cart);
  if (appConfig.payments?.enabled) {
    try {
      message.textContent = "Opening secure payment...";
      const response = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment could not be started.");
      await openRazorpayCheckout(result, orderItems);
      return;
    } catch (error) {
      message.textContent = error.message || "Payment could not be completed.";
      return;
    }
  }
  if (appConfig.checked && !appConfig.payments?.enabled) {
    message.textContent = "Payment gateway is not configured on the server. Add Razorpay keys in Render environment variables.";
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: orderItems, status: "placed" })
    });
    if (response.ok) {
      const result = await response.json();
      if (result.state) applyState(result.state);
      selectedInventoryIds = [];
      saveState("uniqBuilderSelection", selectedInventoryIds);
      message.textContent = "Order placed. Inventory and hamper stock updated.";
      renderHampers();
      renderBuilder();
      renderAdmin();
      renderCart();
      return;
    }
  } catch {
    // Static hosting fallback below.
  }
  cart.forEach(line => {
    if (line.type === "hamper") {
      const hamper = hampers.find(item => item.id === line.id);
      if (hamper) hamper.stock = Math.max(0, hamper.stock - line.qty);
    } else {
      (line.selections || []).forEach(selection => {
        const item = inventory.find(entry => entry.id === selection.itemId);
        if (!item) return;
        const variants = itemVariants(item);
        const variant = variants.find(entry => entry.name === selection.variantName) || variants[0];
        if (variant) variant.stock = Math.max(0, variant.stock - (selection.qty || 1) * line.qty);
        item.variants = variants;
        syncItemStock(item);
      });
    }
  });
  cart = [];
  saveState("uniqHampers", hampers);
  saveState("uniqInventory", inventory);
  saveState("uniqCart", cart);
  selectedInventoryIds = [];
  saveState("uniqBuilderSelection", selectedInventoryIds);
  message.textContent = "Order placed. Inventory and hamper stock updated.";
  renderHampers();
  renderBuilder();
  renderAdmin();
  renderCart();
}

function openRazorpayCheckout(paymentOrder, orderItems) {
  return new Promise((resolve, reject) => {
    loadRazorpayScript().then(() => {
    const options = {
      key: paymentOrder.keyId,
      amount: paymentOrder.order.amount,
      currency: paymentOrder.currency,
      name: "Uniq World",
      description: "Celebration hamper order",
      order_id: paymentOrder.order.id,
      theme: { color: "#ff4d8d" },
      handler: async response => {
        try {
          const verifyResponse = await fetch(`${API_BASE}/api/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, items: orderItems })
          });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
          if (result.state) applyState(result.state);
          selectedInventoryIds = [];
          saveState("uniqBuilderSelection", selectedInventoryIds);
          qs("#checkoutMessage").textContent = "Payment successful. Order placed and stock updated.";
          renderHampers();
          renderBuilder();
          renderAdmin();
          renderCart();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled."))
      }
    };
    new window.Razorpay(options).open();
    }).catch(() => reject(new Error("Razorpay checkout did not load. Check your internet connection.")));
  });
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-razorpay]");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function editHamper(id) {
  if (!adminUnlocked) return;
  const hamper = hampers.find(item => item.id === id);
  if (!hamper) return;
  qs("#hamperId").value = hamper.id;
  qs("#hamperTitle").value = hamper.title;
  qs("#hamperCopy").value = hamper.copy;
  qs("#hamperCategory").value = hamper.category || "Luxury";
  qs("#hamperPrice").value = hamper.price;
  qs("#hamperStock").value = hamper.stock;
  qs("#hamperPublished").checked = hamper.published;
  draftImage = hamper.image || "";
  renderImagePreview();
  navigate("admin");
  qs("#hamperTitle").focus();
}

function clearHamperForm() {
  qs("#hamperEditor").reset();
  qs("#hamperId").value = "";
  qs("#hamperCategory").value = "Luxury";
  qs("#hamperPublished").checked = true;
  qs("#hamperImage").value = "";
  draftImage = "";
  renderImagePreview();
  qs("#hamperTitle").focus();
}

function saveHamper(event) {
  event.preventDefault();
  if (!adminUnlocked) return;
  const id = qs("#hamperId").value || `hamper-${Date.now()}`;
  const existing = hampers.find(item => item.id === id);
  const payload = {
    id,
    title: qs("#hamperTitle").value.trim(),
    copy: qs("#hamperCopy").value.trim(),
    price: Number(qs("#hamperPrice").value),
    stock: Number(qs("#hamperStock").value),
    category: qs("#hamperCategory").value,
    published: qs("#hamperPublished").checked,
    image: draftImage || ""
  };
  if (existing) Object.assign(existing, payload);
  else hampers.unshift(payload);
  saveState("uniqHampers", hampers);
  clearHamperForm();
  renderHampers();
  showToast("Ready hamper saved.");
}

function deleteHamper(id) {
  if (!adminUnlocked) return;
  const hamper = hampers.find(item => item.id === id);
  if (!hamper || !confirm(`Delete ${hamper.title}?`)) return;
  hampers = hampers.filter(item => item.id !== id);
  cart = cart.filter(item => item.id !== id);
  saveState("uniqHampers", hampers);
  persistCart();
}

function editInventory(id) {
  if (!adminUnlocked) return;
  const item = inventory.find(entry => entry.id === id);
  if (!item) return;
  qs("#inventoryId").value = item.id;
  qs("#inventoryName").value = item.name;
  qs("#inventoryDescription").value = item.description;
  qs("#inventoryCategory").value = item.category;
  qs("#inventoryPrice").value = item.price;
  qs("#inventoryStock").value = item.stock;
  qs("#inventoryVariants").value = variantsToText(item);
  qs("#inventoryPublished").checked = item.published;
  inventoryDraftImage = item.image || "";
  renderInventoryImagePreview();
  navigate("admin");
  qs("#inventoryName").focus();
}

function clearInventoryForm() {
  qs("#inventoryEditor").reset();
  qs("#inventoryId").value = "";
  qs("#inventoryCategory").value = "Chocolate";
  qs("#inventoryPublished").checked = true;
  qs("#inventoryVariants").value = "";
  qs("#inventoryImage").value = "";
  inventoryDraftImage = "";
  renderInventoryImagePreview();
  qs("#inventoryName").focus();
}

function saveInventory(event) {
  event.preventDefault();
  if (!adminUnlocked) return;
  const id = qs("#inventoryId").value || `inventory-${Date.now()}`;
  const existing = inventory.find(item => item.id === id);
  const payload = {
    id,
    name: qs("#inventoryName").value.trim(),
    description: qs("#inventoryDescription").value.trim(),
    category: qs("#inventoryCategory").value,
    price: Number(qs("#inventoryPrice").value),
    stock: Number(qs("#inventoryStock").value),
    published: qs("#inventoryPublished").checked,
    image: inventoryDraftImage || ""
  };
  payload.variants = parseVariants(qs("#inventoryVariants").value, payload.price, payload.stock);
  syncItemStock(payload);
  if (existing) Object.assign(existing, payload);
  else inventory.unshift(payload);
  saveState("uniqInventory", inventory);
  clearInventoryForm();
  renderAdmin();
  renderBuilder();
  showToast("Inventory item saved.");
}

function deleteInventory(id) {
  if (!adminUnlocked) return;
  const item = inventory.find(entry => entry.id === id);
  if (!item || !confirm(`Delete ${item.name}?`)) return;
  inventory = inventory.filter(entry => entry.id !== id);
  selectedInventoryIds = selectedInventoryIds.filter(entryId => entryId !== id);
  cart = cart.filter(line => line.type !== "combo" || !line.itemIds.includes(id));
  saveState("uniqInventory", inventory);
  saveState("uniqBuilderSelection", selectedInventoryIds);
  persistCart();
  renderAdmin();
  renderBuilder();
}

function renderImagePreview() {
  renderPreview("#imagePreview", draftImage);
}

function renderInventoryImagePreview() {
  renderPreview("#inventoryImagePreview", inventoryDraftImage);
}

function renderPreview(selector, image) {
  const preview = qs(selector);
  if (!preview) return;
  if (!image) {
    preview.classList.remove("has-image");
    preview.removeAttribute("style");
    preview.textContent = "No picture selected";
    return;
  }
  preview.classList.add("has-image");
  preview.style.backgroundImage = `url('${image}')`;
  preview.textContent = "";
}

async function unlockAdmin(event) {
  event.preventDefault();
  const input = qs("#adminPassword");
  const message = qs("#adminMessage");
  let apiOk = false;
  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input.value })
    });
    apiOk = response.ok;
    if (apiOk) {
      const result = await response.json();
      adminToken = result.token || "";
      sessionStorage.setItem("uniqAdminToken", adminToken);
    }
  } catch {
    apiOk = false;
  }
  if (input.value === ADMIN_PASSWORD || apiOk) {
    adminUnlocked = true;
    sessionStorage.setItem("uniqAdminUnlocked", "true");
    if (!adminToken && input.value === ADMIN_PASSWORD) sessionStorage.setItem("uniqAdminToken", "");
    input.value = "";
    message.textContent = "";
    renderAdmin();
    showToast("Admin unlocked.");
    return;
  }
  message.textContent = "Wrong password. Try again.";
  input.select();
}

function lockAdmin() {
  adminUnlocked = false;
  adminToken = "";
  sessionStorage.removeItem("uniqAdminUnlocked");
  sessionStorage.removeItem("uniqAdminToken");
  draftImage = "";
  inventoryDraftImage = "";
  renderAdmin();
  showToast("Admin locked.");
}

function handleImageUpload(event, target) {
  if (!adminUnlocked) return;
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please upload an image file.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (target === "inventory") {
      inventoryDraftImage = String(reader.result || "");
      renderInventoryImagePreview();
    } else {
      draftImage = String(reader.result || "");
      renderImagePreview();
    }
  });
  reader.readAsDataURL(file);
}

function openCart() {
  qs("#cartDrawer").classList.add("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  qs("#cartDrawer").classList.remove("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "true");
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function calendarDate(day) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}${month}${String(day).padStart(2, "0")}`;
}

function syncCalendar() {
  const events = occasions.map(item => [
    "BEGIN:VEVENT",
    `UID:uniq-world-${item.date}-${Date.now()}@uniqworld`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${calendarDate(item.date)}`,
    `SUMMARY:${item.title}`,
    `DESCRIPTION:${item.detail}`,
    "END:VEVENT"
  ].join("\r\n")).join("\r\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Uniq World//Gift Calendar//EN", events, "END:VCALENDAR"].join("\r\n");
  downloadFile("uniq-world-gift-calendar.ics", ics, "text/calendar");
  showToast("Calendar file downloaded. Open it to add reminders.");
}

function openGoogleCalendar() {
  const item = occasions[0];
  const date = calendarDate(item.date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: `${date}/${date}`,
    details: `${item.detail}\n\nCreated from Uniq World gifting reminders.`
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
  showToast("Google Calendar opened. Save the reminder there.");
}

function parseInventoryRow(row, index) {
  const name = row.name || row.Name || row.product || row.Product || row.title || row.Title || "";
  if (!name) return null;
  const price = Number(row.price || row.Price || row["Individual price"] || row.individualPrice || 0);
  const stock = Number(row.stock || row.Stock || row.quantity || row.Quantity || 0);
  const variantsText = row.variants || row.Variants || "";
  const payload = {
    id: String(row.id || row.ID || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `inventory-${Date.now()}-${index}`,
    name: String(name).trim(),
    description: String(row.description || row.Description || "Imported inventory item").trim(),
    category: String(row.category || row.Category || "Lifestyle").trim(),
    price,
    stock,
    published: String(row.published || row.Published || "true").toLowerCase() !== "false",
    image: ""
  };
  payload.variants = variantsText
    ? parseVariants(String(variantsText), price, stock)
    : [{ name: String(row.variant || row.Variant || "Default"), price, stock }];
  syncItemStock(payload);
  return payload;
}

async function importInventoryFile(event) {
  if (!adminUnlocked) return showToast("Unlock admin before importing inventory.");
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const rows = await readSpreadsheetRows(file);
    const imported = rows.map(parseInventoryRow).filter(Boolean);
    if (!imported.length) return showToast("No valid inventory rows found.");
    const byId = new Map(inventory.map(item => [item.id, item]));
    imported.forEach(item => byId.set(item.id, item));
    inventory = [...byId.values()];
    saveState("uniqInventory", inventory);
    renderBuilder();
    renderAdmin();
    showToast(`${imported.length} inventory item${imported.length === 1 ? "" : "s"} imported.`);
  } catch (error) {
    showToast(error.message || "Inventory import failed.");
  }
}

function readSpreadsheetRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      try {
        if (file.name.toLowerCase().endsWith(".csv")) {
          const [headerLine = "", ...lines] = String(reader.result || "").split(/\r?\n/).filter(Boolean);
          const headers = headerLine.split(",").map(cell => cell.trim());
          resolve(lines.map(line => Object.fromEntries(line.split(",").map((cell, index) => [headers[index], cell.trim()]))));
          return;
        }
        if (!window.XLSX) throw new Error("Excel parser is still loading. Try again in a few seconds.");
        const workbook = window.XLSX.read(reader.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(window.XLSX.utils.sheet_to_json(sheet, { defval: "" }));
      } catch (error) {
        reject(error);
      }
    };
    if (file.name.toLowerCase().endsWith(".csv")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

function initialsFor(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "UW";
}

function uploadCorporateCsv() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,text/csv";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const rows = String(reader.result || "").split(/\r?\n/).map(row => row.trim()).filter(Boolean);
      const imported = rows.slice(1).map(row => {
        const [name = "", detail = "", initials = ""] = row.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""));
        if (!name) return null;
        return { name, detail: detail || "Corporate gifting contact", initials: initials || initialsFor(name) };
      }).filter(Boolean);
      if (!imported.length) {
        downloadFile("uniq-world-corporate-template.csv", "name,detail,initials\nRiya Sharma,Birthday Aug 8. Sage and dark chocolate,RS\n", "text/csv");
        showToast("No rows found. CSV template downloaded.");
        return;
      }
      vault = [...imported, ...vault];
      localStorage.setItem("uniqVault", JSON.stringify(vault));
      renderProfile();
      showToast(`${imported.length} corporate contact${imported.length === 1 ? "" : "s"} imported.`);
    });
    reader.readAsText(file);
  });
  input.click();
}

function joinChallenge() {
  challengeJoined = true;
  localStorage.setItem("uniqChallengeJoined", "true");
  qsa(".challenge-row span").forEach(item => item.classList.add("active"));
  showToast("Challenge joined. Rewards progress saved on this device.");
}

function redeemRewards() {
  if (!cart.length) {
    showToast("Add an item to cart before redeeming rewards.");
    openCart();
    return;
  }
  if (cart.some(item => item.type === "reward")) {
    showToast("Rewards are already applied.");
    openCart();
    return;
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.min(500, Math.round(subtotal * 0.1));
  cart.push({ cartId: "reward:uniq-points", type: "reward", title: "Uniq Rewards Discount", price: -discount, qty: 1 });
  persistCart();
  openCart();
  showToast(`${money(discount)} reward discount applied.`);
}

function removeReward() {
  cart = cart.filter(item => item.type !== "reward");
  persistCart();
  showToast("Reward discount removed.");
}

async function shareHamper(id) {
  const hamper = hampers.find(item => item.id === id);
  if (!hamper) return;
  const url = `${location.origin}${location.pathname}#hamper-${hamper.id}`;
  const text = `${hamper.title} from Uniq World - ${money(hamper.price)}. ${hamper.copy}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: hamper.title, text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    showToast("Hamper link copied. Share it anywhere.");
  } catch {
    showToast("Share cancelled.");
  }
}

function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function wireEvents() {
  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-nav]");
    if (nav) navigate(nav.dataset.nav);

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      renderHampers();
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === "profile") navigate("profile");
    if (action.dataset.action === "cart") openCart();
    if (action.dataset.action === "closeCart") closeCart();
    if (action.dataset.action === "addCart") addHamperToCart(id);
    if (action.dataset.action === "shareHamper") shareHamper(id);
    if (action.dataset.action === "incCart") changeCart(action.dataset.cartId, 1);
    if (action.dataset.action === "decCart") changeCart(action.dataset.cartId, -1);
    if (action.dataset.action === "checkout") checkout();
    if (action.dataset.action === "toggleInventoryPick") {
      normalizeSelection();
      selectedInventoryIds = selectedEntry(id)
        ? selectedInventoryIds.filter(entry => entry.key !== id)
        : [...selectedInventoryIds, { key: id, qty: 1 }];
      saveState("uniqBuilderSelection", selectedInventoryIds);
      renderBuilder();
    }
    if (action.dataset.action === "builderQtyUp" || action.dataset.action === "builderQtyDown") {
      normalizeSelection();
      const entry = selectedInventoryIds.find(item => item.key === id);
      const choice = getVariantChoice(id);
      if (entry && choice) {
        entry.qty += action.dataset.action === "builderQtyUp" ? 1 : -1;
        entry.qty = Math.max(1, Math.min(entry.qty, choice.variant.stock));
        saveState("uniqBuilderSelection", selectedInventoryIds);
        renderBuilder();
      }
    }
    if (action.dataset.action === "addCombo") addComboToCart();
    if (action.dataset.action === "useAiPicks") {
      selectedInventoryIds = String(action.dataset.keys || "").split(",").filter(Boolean).map(key => ({ key, qty: 1 }));
      saveState("uniqBuilderSelection", selectedInventoryIds);
      navigate("builder");
      renderBuilder();
      showToast("AI picks moved into the hamper builder.");
    }
    if (action.dataset.action === "editHamper") editHamper(id);
    if (action.dataset.action === "deleteHamper") deleteHamper(id);
    if (action.dataset.action === "newHamper") clearHamperForm();
    if (action.dataset.action === "removeImage") {
      draftImage = "";
      qs("#hamperImage").value = "";
      renderImagePreview();
    }
    if (action.dataset.action === "editInventory") editInventory(id);
    if (action.dataset.action === "deleteInventory") deleteInventory(id);
    if (action.dataset.action === "newInventory") clearInventoryForm();
    if (action.dataset.action === "importInventory") qs("#inventoryImport").click();
    if (action.dataset.action === "removeInventoryImage") {
      inventoryDraftImage = "";
      qs("#inventoryImage").value = "";
      renderInventoryImagePreview();
    }
    if (action.dataset.action === "adminLogout") lockAdmin();
    if (action.dataset.action === "calendar" || action.dataset.action === "calendarIcs") syncCalendar();
    if (action.dataset.action === "calendarGoogle") openGoogleCalendar();
    if (action.dataset.action === "joinChallenge") joinChallenge();
    if (action.dataset.action === "corporateUpload") uploadCorporateCsv();
    if (action.dataset.action === "redeemRewards") redeemRewards();
    if (action.dataset.action === "removeReward") removeReward();
    if (action.dataset.action === "shuffleMood") {
      moodIndex += 1;
      renderMood();
    }
  });

  qs("#adminLogin").addEventListener("submit", unlockAdmin);
  qs("#hamperEditor").addEventListener("submit", saveHamper);
  qs("#inventoryEditor").addEventListener("submit", saveInventory);
  qs("#hamperImage").addEventListener("change", event => handleImageUpload(event, "hamper"));
  qs("#inventoryImage").addEventListener("change", event => handleImageUpload(event, "inventory"));
  qs("#inventoryImport").addEventListener("change", importInventoryFile);
  qs("#budgetRange").addEventListener("input", renderBuilder);
  qs("#aiBriefForm").addEventListener("submit", suggestInventoryHamper);
  qs("#conciergeForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = qs("#conciergeInput");
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    await addConciergeReply(message);
  });
}

render();
hydrateConfig();
hydrateFromApi();
connectRealtime();
