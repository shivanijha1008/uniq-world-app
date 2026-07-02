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
const boxes = ["Magnetic", "Wooden", "Velvet", "Eco", "Basket"];
const products = ["Tea", "Candle", "Chocolate", "Notebook", "Fragrance", "Plant", "Skin care", "Photo card"];

const ratings = [
  ["Chamomile tea", "Keep sending", 5],
  ["Citrus body wash", "Try warmer fragrance", 3],
  ["Linen journal", "Loved", 5]
];

const vault = [
  { initials: "RS", name: "Riya Sharma", detail: "Birthday Aug 8. Sage, dark chocolate, jasmine, acts of service." },
  { initials: "AM", name: "Aarav Mehta", detail: "Fitness, coffee, tech accessories. Avoid nuts." },
  { initials: "TM", name: "Team Marketing", detail: "22 members. Diwali budget Rs 2,200 each. Needs GST invoice." }
];

const moods = [
  ["#6b5363", "#b7d7ca"],
  ["#e9b8b4", "#a9bdd1"],
  ["#c19a5b", "#f8efe7"]
];

const defaultHampers = [
  { id: "midnight-bloom", title: "Midnight Bloom", copy: "360 preview, velvet box, fragrance, candle, truffles.", price: 5200, stock: 8, category: "Luxury", published: true },
  { id: "apology-edit", title: "The Apology Edit", copy: "Soft florals, secret letter, tea, and calming bath ritual.", price: 3400, stock: 11, category: "Wellness", published: true },
  { id: "executive-onboarding", title: "Executive Onboarding", copy: "Branded magnetic box with notebook, coffee, and desk objects.", price: 4800, stock: 20, category: "Corporate", published: true },
  { id: "self-care-sunday", title: "Self-care Sunday", copy: "Skin, bath, tea, book, and mindfulness challenge.", price: 2900, stock: 6, category: "Wellness", published: true }
];

let activeScreen = "home";
let activeFilter = "All";
let moodIndex = 0;
let ownerMode = false;
let hampers = loadState("uniqHampers", defaultHampers);
let cart = loadState("uniqCart", []);

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
}

function money(value) {
  return `Rs ${Number(value).toLocaleString("en-IN")}`;
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

function render() {
  renderHome();
  renderDiscover();
  renderHampers();
  renderBuilder();
  renderSubscription();
  renderProfile();
  renderCart();
  renderMood();
  seedChat();
  wireStaticEvents();
  lucide.createIcons();
}

function renderHome() {
  qs("#recommendations").innerHTML = defaultRecommendations.map(item => `
    <article class="product-card">
      <div class="product-art"></div>
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
  qs("#ownerMode").checked = ownerMode;
  qs("#hamperEditor").hidden = !ownerMode;
  qs("#hamperFilters").innerHTML = filters.map(filter => `
    <button class="${filter === activeFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>
  `).join("");

  const visibleHampers = hampers.filter(hamper => {
    if (!ownerMode && (!hamper.published || hamper.stock < 1)) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Published") return hamper.published;
    return hamper.category === activeFilter;
  });

  qs("#hamperList").innerHTML = visibleHampers.map(hamper => {
    const inCart = cart.find(item => item.id === hamper.id)?.qty || 0;
    const status = hamper.published ? "Published" : "Draft";
    return `
      <article class="hamper-card ${!hamper.published ? "draft" : ""}">
        <div class="product-art"></div>
        <div>
          <div class="hamper-heading">
            <h3>${escapeHtml(hamper.title)}</h3>
            <span>${status}</span>
          </div>
          <p>${escapeHtml(hamper.copy)}</p>
          <div class="meta-row">
            <span class="price">${money(hamper.price)}</span>
            <span>${hamper.stock} in stock</span>
          </div>
          <div class="card-actions">
            <button class="primary-mini" data-action="addCart" data-id="${hamper.id}" ${hamper.stock < 1 || !hamper.published ? "disabled" : ""}>
              <i data-lucide="shopping-bag"></i>${inCart ? `Added (${inCart})` : "Add to cart"}
            </button>
            ${ownerMode ? `
              <button class="ghost-mini" data-action="editHamper" data-id="${hamper.id}"><i data-lucide="pencil"></i>Edit</button>
              <button class="danger-mini" data-action="deleteHamper" data-id="${hamper.id}"><i data-lucide="trash-2"></i>Delete</button>
            ` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("") || `<section class="empty-state">No hampers match this view.</section>`;

  lucide.createIcons();
}

function renderBuilder() {
  qs("#boxOptions").innerHTML = boxes.map((box, index) => `
    <button class="${index === 0 ? "active" : ""}">${box}</button>
  `).join("");

  qs("#productChips").innerHTML = products.map((product, index) => `
    <button class="${index < 4 ? "active" : ""}" data-product="${product}">${product}</button>
  `).join("");
}

function renderSubscription() {
  qs("#ratingList").innerHTML = ratings.map(([name, note, score]) => `
    <article class="rating-item">
      <div>
        <strong>${name}</strong>
        <p class="muted">${note}</p>
      </div>
      <span class="stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>
    </article>
  `).join("");
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
  const palette = moods[moodIndex % moods.length];
  qs("#moodBoard").innerHTML = Array.from({ length: 3 }, (_, index) => `
    <div class="mood-tile" style="background: linear-gradient(135deg, ${palette[index % 2]}, ${palette[(index + 1) % 2]})"></div>
  `).join("");
}

function renderCart() {
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const hamper = hampers.find(entry => entry.id === item.id);
    return sum + (hamper ? hamper.price * item.qty : 0);
  }, 0);

  qs("#cartCount").textContent = cartCount;
  qs("#cartTotal").textContent = money(cartTotal);
  qs("#cartItems").innerHTML = cart.length ? cart.map(item => {
    const hamper = hampers.find(entry => entry.id === item.id);
    if (!hamper) return "";
    return `
      <article class="cart-line">
        <div>
          <strong>${escapeHtml(hamper.title)}</strong>
          <p class="muted">${money(hamper.price)} each</p>
        </div>
        <div class="qty-control">
          <button data-action="decCart" data-id="${hamper.id}" aria-label="Decrease ${hamper.title}">-</button>
          <span>${item.qty}</span>
          <button data-action="incCart" data-id="${hamper.id}" aria-label="Increase ${hamper.title}">+</button>
        </div>
      </article>
    `;
  }).join("") : `<section class="empty-state">Your cart is waiting for a thoughtful hamper.</section>`;
}

function navigate(screen) {
  activeScreen = screen;
  qsa(".screen").forEach(item => item.classList.toggle("active", item.dataset.screen === screen));
  qsa(".tabbar button").forEach(item => item.classList.toggle("active", item.dataset.nav === screen));
  qs(`.screen[data-screen="${screen}"]`)?.scrollTo({ top: 0, behavior: "smooth" });
}

function seedChat() {
  qs("#chatLog").innerHTML = `
    <div class="bubble ai">Tell me the recipient, occasion, budget, personality, favorite colors, and delivery date. I'll turn it into a complete hamper concept.</div>
    <div class="gift-plan">
      <h3>Example plan</h3>
      <div class="plan-grid">
        <span>Theme: Sage memory ritual</span>
        <span>Budget: Rs 3,000</span>
        <span>Box: Magnetic cream</span>
        <span>QR: Video and playlist</span>
      </div>
    </div>
  `;
}

function addConciergeReply(message) {
  const lower = message.toLowerCase();
  const relationship = lower.includes("girlfriend") ? "girlfriend" : lower.includes("mom") ? "mother" : "recipient";
  const budget = message.match(/(?:rs|inr)?\s?([0-9]{3,5})/i)?.[1] || "3200";
  const theme = lower.includes("sorry") ? "Soft apology ritual" : lower.includes("birthday") ? "Birthday memory box" : "Thoughtful luxury edit";
  const log = qs("#chatLog");

  log.insertAdjacentHTML("beforeend", `<div class="bubble user">${escapeHtml(message)}</div>`);
  log.insertAdjacentHTML("beforeend", `
    <div class="bubble ai">I'd build a ${theme.toLowerCase()} for your ${relationship}, keeping the total near ${money(budget)}.</div>
    <div class="gift-plan">
      <h3>${theme}</h3>
      <div class="plan-grid">
        <span>Palette: blush, sage, ivory</span>
        <span>Products: candle, truffles, note, fragrance</span>
        <span>Wrap: satin ribbon with wax seal</span>
        <span>Message: warm, specific, not generic</span>
      </div>
    </div>
  `);
  log.scrollIntoView({ block: "end", behavior: "smooth" });
}

function addToCart(id) {
  const hamper = hampers.find(item => item.id === id);
  if (!hamper || !hamper.published || hamper.stock < 1) return;
  const line = cart.find(item => item.id === id);
  if (line) {
    line.qty = Math.min(line.qty + 1, hamper.stock);
  } else {
    cart.push({ id, qty: 1 });
  }
  saveState("uniqCart", cart);
  renderCart();
  renderHampers();
}

function changeCart(id, delta) {
  const hamper = hampers.find(item => item.id === id);
  const line = cart.find(item => item.id === id);
  if (!hamper || !line) return;
  line.qty += delta;
  if (line.qty < 1) cart = cart.filter(item => item.id !== id);
  if (line.qty > hamper.stock) line.qty = hamper.stock;
  saveState("uniqCart", cart);
  renderCart();
  renderHampers();
}

function editHamper(id) {
  const hamper = hampers.find(item => item.id === id);
  if (!hamper) return;
  qs("#hamperId").value = hamper.id;
  qs("#hamperTitle").value = hamper.title;
  qs("#hamperCopy").value = hamper.copy;
  qs("#hamperPrice").value = hamper.price;
  qs("#hamperStock").value = hamper.stock;
  qs("#hamperPublished").checked = hamper.published;
  qs("#hamperTitle").focus();
}

function clearHamperForm() {
  qs("#hamperEditor").reset();
  qs("#hamperId").value = "";
  qs("#hamperPublished").checked = true;
  qs("#hamperTitle").focus();
}

function saveHamper(event) {
  event.preventDefault();
  const id = qs("#hamperId").value || `hamper-${Date.now()}`;
  const existing = hampers.find(item => item.id === id);
  const payload = {
    id,
    title: qs("#hamperTitle").value.trim(),
    copy: qs("#hamperCopy").value.trim(),
    price: Number(qs("#hamperPrice").value),
    stock: Number(qs("#hamperStock").value),
    category: existing?.category || "Luxury",
    published: qs("#hamperPublished").checked
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    hampers.unshift(payload);
  }

  cart = cart.filter(line => {
    const hamper = hampers.find(item => item.id === line.id);
    if (!hamper || !hamper.published || hamper.stock < 1) return false;
    line.qty = Math.min(line.qty, hamper.stock);
    return line.qty > 0;
  });

  saveState("uniqHampers", hampers);
  saveState("uniqCart", cart);
  clearHamperForm();
  renderHampers();
  renderCart();
}

function deleteHamper(id) {
  const hamper = hampers.find(item => item.id === id);
  if (!hamper) return;
  if (!confirm(`Delete ${hamper.title}?`)) return;
  hampers = hampers.filter(item => item.id !== id);
  cart = cart.filter(item => item.id !== id);
  saveState("uniqHampers", hampers);
  saveState("uniqCart", cart);
  renderHampers();
  renderCart();
}

function checkout() {
  const message = qs("#checkoutMessage");
  if (!cart.length) {
    message.textContent = "Add at least one hamper before placing an order.";
    return;
  }

  cart.forEach(line => {
    const hamper = hampers.find(item => item.id === line.id);
    if (hamper) hamper.stock = Math.max(0, hamper.stock - line.qty);
  });
  cart = [];
  saveState("uniqHampers", hampers);
  saveState("uniqCart", cart);
  message.textContent = "Order placed. The customer will receive checkout and delivery updates next.";
  renderCart();
  renderHampers();
}

function openCart() {
  qs("#cartDrawer").classList.add("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  qs("#cartDrawer").classList.remove("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "true");
}

function wireStaticEvents() {
  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-nav]");
    if (nav) navigate(nav.dataset.nav);

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === "profile") navigate("profile");
    if (action.dataset.action === "calendar") {
      navigate("profile");
      setTimeout(() => alert("Calendar sync mock: Google and Apple reminders are ready for birthdays, festivals, and corporate events."), 100);
    }
    if (action.dataset.action === "cart") openCart();
    if (action.dataset.action === "closeCart") closeCart();
    if (action.dataset.action === "addCart") addToCart(id);
    if (action.dataset.action === "incCart") changeCart(id, 1);
    if (action.dataset.action === "decCart") changeCart(id, -1);
    if (action.dataset.action === "editHamper") editHamper(id);
    if (action.dataset.action === "deleteHamper") deleteHamper(id);
    if (action.dataset.action === "newHamper") clearHamperForm();
    if (action.dataset.action === "checkout") checkout();
    if (action.dataset.action === "shuffleMood") {
      moodIndex += 1;
      renderMood();
    }
  });

  qs("#ownerMode").addEventListener("change", event => {
    ownerMode = event.target.checked;
    renderHampers();
  });

  qs("#hamperEditor").addEventListener("submit", saveHamper);

  qs("#budgetRange").addEventListener("input", event => {
    qs("#budgetValue").textContent = money(event.target.value);
  });

  qs("#conciergeForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = qs("#conciergeInput");
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    addConciergeReply(message);
  });

  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      renderHampers();
    }

    if (event.target.closest("#boxOptions button")) {
      const button = event.target.closest("#boxOptions button");
      qsa("#boxOptions button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      qs("#previewBox").style.background = button.textContent === "Velvet" ? "#6b5363" : button.textContent === "Eco" ? "#d5e7de" : "#fffaf6";
    }

    if (event.target.closest("#productChips button")) {
      const button = event.target.closest("#productChips button");
      button.classList.toggle("active");
      const selected = qsa("#productChips button.active").length;
      qs("#harmonyScore").textContent = `${Math.min(98, 76 + selected * 4)}%`;
    }
  });
}

render();
