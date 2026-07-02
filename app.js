const recommendations = [
  { title: "Gratitude Ritual", copy: "Tea, handwritten note, candle, and a memory QR.", price: "Rs 2,800" },
  { title: "Soft Launch Love", copy: "Rose quartz palette with chocolate, fragrance, and satin wrap.", price: "Rs 3,600" },
  { title: "Founder Welcome Kit", copy: "Premium notebook, desk candle, coffee, and branded card.", price: "Rs 4,200" }
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

const filters = ["Occasion", "Recipient", "Emotion", "Budget", "Luxury", "Corporate", "Eco", "Imported"];

const hampers = [
  { title: "Midnight Bloom", copy: "360 preview, velvet box, fragrance, candle, truffles.", price: "Rs 5,200" },
  { title: "The Apology Edit", copy: "Soft florals, secret letter, tea, and calming bath ritual.", price: "Rs 3,400" },
  { title: "Executive Onboarding", copy: "Branded magnetic box with notebook, coffee, and desk objects.", price: "Rs 4,800" },
  { title: "Self-care Sunday", copy: "Skin, bath, tea, book, and mindfulness challenge.", price: "Rs 2,900" }
];

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

let activeScreen = "home";
let moodIndex = 0;

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function render() {
  qs("#recommendations").innerHTML = recommendations.map(item => `
    <article class="product-card">
      <div class="product-art"></div>
      <h3>${item.title}</h3>
      <p>${item.copy}</p>
      <span class="price">${item.price}</span>
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

  qs("#emotionGrid").innerHTML = emotions.map(([name, copy]) => `
    <button class="emotion-card" data-nav="hampers">
      <strong>${name}</strong>
      <span>${copy}</span>
    </button>
  `).join("");

  qs("#hamperFilters").innerHTML = filters.map((filter, index) => `
    <button class="${index === 0 ? "active" : ""}">${filter}</button>
  `).join("");

  qs("#hamperList").innerHTML = hampers.map(item => `
    <article class="hamper-card">
      <div class="product-art"></div>
      <div>
        <h3>${item.title}</h3>
        <p>${item.copy}</p>
        <span class="price">${item.price}</span>
      </div>
    </article>
  `).join("");

  qs("#boxOptions").innerHTML = boxes.map((box, index) => `
    <button class="${index === 0 ? "active" : ""}">${box}</button>
  `).join("");

  qs("#productChips").innerHTML = products.map((product, index) => `
    <button class="${index < 4 ? "active" : ""}" data-product="${product}">${product}</button>
  `).join("");

  qs("#ratingList").innerHTML = ratings.map(([name, note, score]) => `
    <article class="rating-item">
      <div>
        <strong>${name}</strong>
        <p class="muted">${note}</p>
      </div>
      <span class="stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>
    </article>
  `).join("");

  qs("#vaultList").innerHTML = vault.map(person => `
    <article class="vault-card">
      <span class="avatar">${person.initials}</span>
      <div>
        <strong>${person.name}</strong>
        <p class="muted">${person.detail}</p>
      </div>
    </article>
  `).join("");

  renderMood();
  seedChat();
  wireEvents();
  lucide.createIcons();
}

function renderMood() {
  const palette = moods[moodIndex % moods.length];
  qs("#moodBoard").innerHTML = Array.from({ length: 3 }, (_, index) => `
    <div class="mood-tile" style="background: linear-gradient(135deg, ${palette[index % 2]}, ${palette[(index + 1) % 2]})"></div>
  `).join("");
}

function navigate(screen) {
  activeScreen = screen;
  qsa(".screen").forEach(item => item.classList.toggle("active", item.dataset.screen === screen));
  qsa(".tabbar button").forEach(item => item.classList.toggle("active", item.dataset.nav === screen));
  qs(`.screen[data-screen="${screen}"]`)?.scrollTo({ top: 0, behavior: "smooth" });
}

function seedChat() {
  qs("#chatLog").innerHTML = `
    <div class="bubble ai">Tell me the recipient, occasion, budget, personality, favorite colors, and delivery date. I’ll turn it into a complete hamper concept.</div>
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
  const budget = message.match(/(?:rs|₹|inr)?\s?([0-9]{3,5})/i)?.[1] || "3200";
  const theme = lower.includes("sorry") ? "Soft apology ritual" : lower.includes("birthday") ? "Birthday memory box" : "Thoughtful luxury edit";
  const log = qs("#chatLog");

  log.insertAdjacentHTML("beforeend", `<div class="bubble user">${escapeHtml(message)}</div>`);
  log.insertAdjacentHTML("beforeend", `
    <div class="bubble ai">I’d build a ${theme.toLowerCase()} for your ${relationship}, keeping the total near Rs ${Number(budget).toLocaleString("en-IN")}.</div>
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

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function wireEvents() {
  qsa("[data-nav]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  qsa("[data-action='profile']").forEach(button => button.addEventListener("click", () => navigate("profile")));
  qsa("[data-action='calendar']").forEach(button => button.addEventListener("click", () => {
    navigate("profile");
    setTimeout(() => alert("Calendar sync mock: Google and Apple reminders are ready for birthdays, festivals, and corporate events."), 100);
  }));

  qs("[data-action='shuffleMood']")?.addEventListener("click", () => {
    moodIndex += 1;
    renderMood();
  });

  qsa("#hamperFilters button").forEach(button => {
    button.addEventListener("click", () => {
      qsa("#hamperFilters button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  qsa("#boxOptions button").forEach(button => {
    button.addEventListener("click", () => {
      qsa("#boxOptions button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      qs("#previewBox").style.background = button.textContent === "Velvet" ? "#6b5363" : button.textContent === "Eco" ? "#d5e7de" : "#fffaf6";
    });
  });

  qsa("#productChips button").forEach(button => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const selected = qsa("#productChips button.active").length;
      qs("#harmonyScore").textContent = `${Math.min(98, 76 + selected * 4)}%`;
    });
  });

  qs("#budgetRange").addEventListener("input", event => {
    qs("#budgetValue").textContent = `Rs ${Number(event.target.value).toLocaleString("en-IN")}`;
  });

  qs("#conciergeForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = qs("#conciergeInput");
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    addConciergeReply(message);
  });
}

render();
