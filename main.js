(function () {
  let D = window.LastBiteData;

  const LS = {
    cart: "lastbite_cart_v2",
    orders: "lastbite_orders_v2",
    impact: "lastbite_user_impact_v2"
  };

  /* ---------------------------------
    Storage (localStorage + fallback)
  --------------------------------- */
  const NAME_PREFIX = "__lastbite_store__=";

  function safeLocalStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function readWindowNameStore() {
    try {
      const n = String(window.name || "");
      if (!n.startsWith(NAME_PREFIX)) return {};
      return JSON.parse(n.slice(NAME_PREFIX.length)) || {};
    } catch {
      return {};
    }
  }

  function writeWindowNameStore(obj) {
    try {
      window.name = NAME_PREFIX + JSON.stringify(obj || {});
    } catch {
      // ignore
    }
  }

  function readJSON(key, fallback) {
    try {
      const raw = safeLocalStorageGet(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // fall through
    }
    const store = readWindowNameStore();
    return store[key] != null ? store[key] : fallback;
  }

  function writeJSON(key, value) {
    const serialized = JSON.stringify(value);
    safeLocalStorageSet(key, serialized);
    // Always mirror to window.name (helps if running from file:// or storage is blocked)
    const store = readWindowNameStore();
    store[key] = value;
    writeWindowNameStore(store);
  }

  function money(n) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(n);
    } catch {
      return "$" + (Math.round(n * 100) / 100).toFixed(2);
    }
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const modalRoot = document.getElementById("modalRoot");
  const toastRoot = document.getElementById("toastRoot");

  function toast(msg) {
    if (!toastRoot) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function closeModal() {
    if (!modalRoot) return;
    if (modalRoot._cleanup) modalRoot._cleanup();
    modalRoot.classList.remove("isOpen");
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
    modalRoot._cleanup = null;
  }

  function openModal({ title, bodyHTML, footerHTML, onMount }) {
    if (!modalRoot) return;
    modalRoot.hidden = false;
    modalRoot.classList.add("isOpen");
    modalRoot.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
        <div class="modal__head">
          <strong>${escapeHTML(title)}</strong>
          <button class="btn btn--ghost" type="button" data-close="1" aria-label="Close">✕</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        <div class="modal__foot">${footerHTML || ""}</div>
      </div>
    `;

    const closeBtn = modalRoot.querySelector("[data-close]");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    function onKey(e) {
      if (e.key === "Escape") closeModal();
    }
    function onClickAway(e) {
      const modal = modalRoot.querySelector(".modal");
      if (modal && !modal.contains(e.target)) closeModal();
    }

    document.addEventListener("keydown", onKey);
    modalRoot.addEventListener("click", onClickAway);

    modalRoot._cleanup = function () {
      document.removeEventListener("keydown", onKey);
      modalRoot.removeEventListener("click", onClickAway);
    };

    if (typeof onMount === "function") onMount(modalRoot);
  }

  function setActiveNav() {
    const page = document.body.getAttribute("data-page");
    const routeMap = {
      home: "home",
      deals: "deals",
      how: "how",
      mission: "mission",
      impact: "impact",
      cart: "cart",
      contact: "contact"
    };
    const route = routeMap[page];

    document.querySelectorAll("a[data-route]").forEach((a) => {
      const is = a.getAttribute("data-route") === route;
      if (is) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
      }
    });
  }

  function initMobileMenu() {
    const navToggle = document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav");
    if (!navToggle || !mobileNav) return;

    function open() {
      mobileNav.hidden = false;
      navToggle.setAttribute("aria-expanded", "true");
    }
    function close() {
      mobileNav.hidden = true;
      navToggle.setAttribute("aria-expanded", "false");
    }
    function toggle() {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    }

    navToggle.addEventListener("click", toggle);

    mobileNav.addEventListener("click", (e) => {
      if (e.target.matches("a")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      if (!expanded) return;
      const header = document.querySelector(".header");
      if (header && !header.contains(e.target)) close();
    });
  }

  /* ---------------------------------
    Cart (stores snapshots so Cart works even if deals list changes)
  --------------------------------- */
  function getCart() {
    const c = readJSON(LS.cart, []);
    return Array.isArray(c) ? c : [];
  }
  function setCart(cart) {
    writeJSON(LS.cart, cart);
    renderCartCount();
  }
  function renderCartCount() {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const cart = getCart();
    const n = cart.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    el.textContent = String(n);
  }

  // Re-render cart count when coming back to a page (bfcache)
  window.addEventListener("pageshow", renderCartCount);
  window.addEventListener("storage", (e) => {
    if (e.key === LS.cart) renderCartCount();
  });

  function getUserImpact() {
    return readJSON(LS.impact, { meals: 0, kgFood: 0, kgCO2e: 0, donated: 0, savings: 0 });
  }
  function setUserImpact(v) {
    writeJSON(LS.impact, v);
  }

  function cartLines(cart) {
    // If deal exists in D.DEALS use it; otherwise fall back to the snapshot stored in cart.
    return cart
      .map((it) => {
        const deal = D?.DEALS ? D.DEALS.find((x) => x.id === it.id) : null;

        // Snapshot shape to mimic a deal object if D is missing / changed
        const snapDeal = {
          id: it.id,
          title: it.title || "Item",
          partner: it.partner || "Partner",
          category: it.category || "Food",
          price: Number(it.price) || 0,
          originalValue: Number(it.originalValue) || Math.max(Number(it.price) || 0, 0),
          window: it.window || "",
          windowEnd: it.windowEnd || "23:59",
          description: it.description || "",
          emoji: it.emoji || "🍽️",
          distanceKm: Number(it.distanceKm) || 0,
          deliveryAvailable: !!it.deliveryAvailable,
          tags: Array.isArray(it.tags) ? it.tags : [],
          dietary: Array.isArray(it.dietary) ? it.dietary : []
        };

        const pickedDeal = deal || snapDeal;
        return { ...it, deal: pickedDeal };
      })
      .filter((x) => x && x.deal && x.deal.id);
  }

  function cartTotals(cart) {
    const lines = cartLines(cart);
    const subtotal = lines.reduce((s, l) => s + (Number(l.deal.price) || 0) * (Number(l.qty) || 0), 0);
    const original = lines.reduce((s, l) => s + (Number(l.deal.originalValue) || 0) * (Number(l.qty) || 0), 0);
    const savings = Math.max(0, original - subtotal);
    return { lines, subtotal, original, savings };
  }

  function computeImpactForOrder(lines) {
    // If data missing, use safe defaults (keeps checkout usable)
    const kgFoodPerMeal = D?.IMPACT?.kgFoodPerMeal ?? 0.75;
    const kgCO2ePerMeal = D?.IMPACT?.kgCO2ePerMeal ?? 1.6;
    const grossProfitDelivery = D?.IMPACT?.grossProfitDelivery ?? 5.4;
    const grossProfitPickup = D?.IMPACT?.grossProfitPickup ?? 10.4;
    const donationRate = D?.IMPACT?.donationRate ?? 0.05;

    const meals = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
    const kgFood = meals * kgFoodPerMeal;
    const kgCO2e = meals * kgCO2ePerMeal;

    const grossProfit = lines.reduce((s, l) => {
      const per = l.mode === "delivery" ? grossProfitDelivery : grossProfitPickup;
      return s + per * (Number(l.qty) || 0);
    }, 0);

    const donated = grossProfit * donationRate;
    return { meals, kgFood, kgCO2e, donated, grossProfit };
  }

  function pctOff(deal) {
    return Math.round((1 - deal.price / deal.originalValue) * 100);
  }

  function parseEndTimeToday(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  }

  function endsLabel(windowEnd) {
    const end = parseEndTimeToday(windowEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { text: "Pickup closed", severity: "muted" };
    const mins = Math.round(diff / 60000);
    if (mins <= 120) return { text: "Ends in " + mins + "m", severity: "orange" };
    const time = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return { text: "Ends " + time, severity: "muted" };
  }

  function addToCart(dealId, mode, qty) {
    const deal = D?.DEALS ? D.DEALS.find((x) => x.id === dealId) : null;

    // If deal isn't available, do nothing (deals pages depend on D anyway)
    if (!deal) return;

    const q = Math.max(1, Math.min(99, Number(qty) || 1));

    const cart = getCart();
    const existing = cart.find((x) => x.id === dealId && x.mode === mode);

    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + q;
      // keep snapshot fields updated (in case price changes)
      existing.title = deal.title;
      existing.partner = deal.partner;
      existing.category = deal.category;
      existing.price = deal.price;
      existing.originalValue = deal.originalValue;
      existing.window = deal.window;
      existing.windowEnd = deal.windowEnd;
      existing.description = deal.description;
      existing.emoji = deal.emoji;
      existing.distanceKm = deal.distanceKm;
      existing.deliveryAvailable = deal.deliveryAvailable;
      existing.tags = deal.tags;
      existing.dietary = deal.dietary;
    } else {
      cart.push({
        id: dealId,
        mode,
        qty: q,
        // Snapshot fields so Cart can render reliably
        title: deal.title,
        partner: deal.partner,
        category: deal.category,
        price: deal.price,
        originalValue: deal.originalValue,
        window: deal.window,
        windowEnd: deal.windowEnd,
        description: deal.description,
        emoji: deal.emoji,
        distanceKm: deal.distanceKm,
        deliveryAvailable: deal.deliveryAvailable,
        tags: deal.tags,
        dietary: deal.dietary
      });
    }

    setCart(cart);
    toast("Added: " + deal.title);
  }

  function buildDealCard(deal) {
    const off = pctOff(deal);
    const tags = (deal.tags || []).concat(deal.dietary || []);
    const end = endsLabel(deal.windowEnd);

    const endBadge =
      end.severity === "orange"
        ? `<span class="badge badge--orange">⏳ ${escapeHTML(end.text)}</span>`
        : `<span class="badge">⏰ ${escapeHTML(end.text)}</span>`;

    const deliveryBadge = deal.deliveryAvailable
      ? `<span class="badge badge--lime">🚚 Delivery</span>`
      : `<span class="badge">🏃 Pickup</span>`;

    const canOrder = end.text !== "Pickup closed";

    return `
      <article class="card dealCard">
        <div class="dealCard__top">
          <div class="dealIcon" aria-hidden="true">${escapeHTML(deal.emoji || "🍽️")}</div>
          <div class="badgeRow">
            <span class="badge badge--orange">-${off}%</span>
            ${deliveryBadge}
            ${endBadge}
          </div>
        </div>

        <div class="dealCard__body">
          <p class="tiny muted" style="margin:0;">${escapeHTML(deal.partner)} • ${escapeHTML(deal.category)} • ${deal.distanceKm.toFixed(1)} km</p>
          <h3 class="dealTitle">${escapeHTML(deal.title)}</h3>
          <p class="dealMeta">${escapeHTML(deal.window)} • ${escapeHTML(deal.description)}</p>

          <div class="priceRow">
            <div class="priceNow">${money(deal.price)}</div>
            <div class="priceWas">${money(deal.originalValue)}</div>
          </div>

          <div class="tags">
            ${tags.map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
          </div>

          <div class="dealActions">
            <button class="btn btn--primary btn--block" type="button" data-reserve="${escapeHTML(deal.id)}" ${canOrder ? "" : "disabled"}>
              Choose pickup/delivery
            </button>
            <button class="btn btn--ghost btn--block" type="button" data-quickadd="${escapeHTML(deal.id)}" ${canOrder ? "" : "disabled"}>
              Quick add (Pickup)
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function openReserveModal(dealId) {
    const deal = D?.DEALS ? D.DEALS.find((x) => x.id === dealId) : null;
    if (!deal) return;

    const off = pctOff(deal);

    openModal({
      title: "Add to cart",
      bodyHTML: `
        <div class="grid" style="gap:12px;">
          <div>
            <div class="tiny muted">${escapeHTML(deal.partner)} • ${escapeHTML(deal.category)}</div>
            <div class="h3">${escapeHTML(deal.title)}</div>
            <div class="tiny muted">Pickup window: <strong>${escapeHTML(deal.window)}</strong></div>
          </div>

          <div class="card" style="border-radius:16px;">
            <div class="card__pad">
              <div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline;">
                <div>
                  <div class="tiny muted">Price</div>
                  <div style="font-weight:1200; font-size:22px; color: var(--primary);">${money(deal.price)}</div>
                  <div class="tiny muted">Was ${money(deal.originalValue)} • <strong>-${off}%</strong></div>
                </div>

                <div style="text-align:right;">
                  <div class="tiny muted">Distance</div>
                  <div style="font-weight:1100;">${deal.distanceKm.toFixed(1)} km</div>
                </div>
              </div>

              <hr class="hr"/>

              <div class="grid" style="gap:10px;">
                <div class="field">
                  <label for="modeSelect">Pickup / delivery</label>
                  <select id="modeSelect">
                    <option value="pickup">Pickup</option>
                    ${deal.deliveryAvailable ? `<option value="delivery">Delivery</option>` : ""}
                  </select>
                </div>

                <div class="field">
                  <label for="qtySelect">Quantity</label>
                  <select id="qtySelect">
                    ${[1,2,3,4,5].map((n) => `<option value="${n}">${n}</option>`).join("")}
                  </select>
                </div>

                <div class="tiny muted">
                  Estimated impact per meal: ${D?.IMPACT?.kgFoodPerMeal ?? 0.75} kg food saved • ${D?.IMPACT?.kgCO2ePerMeal ?? 1.6} kg CO₂e avoided.
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-close="1">Cancel</button>
        <button class="btn btn--primary" type="button" id="addToCartBtn">Add to cart</button>
      `,
      onMount: (root) => {
        const modeSelect = root.querySelector("#modeSelect");
        const qtySelect = root.querySelector("#qtySelect");

        if (!deal.deliveryAvailable) {
          modeSelect.value = "pickup";
          modeSelect.disabled = true;
        }

        root.querySelector("#addToCartBtn").addEventListener("click", () => {
          const mode = modeSelect.value;
          const qty = Number(qtySelect.value);
          addToCart(deal.id, mode, qty);
          closeModal();
        });
      }
    });
  }

  function initDealsPage() {
    if (!D) return;

    const chipsEl = document.getElementById("categoryChips");
    const partnerEl = document.getElementById("partner");
    const tagEl = document.getElementById("tag");
    const sortEl = document.getElementById("sort");
    const qEl = document.getElementById("q");
    const gridEl = document.getElementById("dealsGrid");
    const resultsEl = document.getElementById("resultsCount");
    const emptyEl = document.getElementById("emptyState");

    if (!chipsEl || !partnerEl || !tagEl || !sortEl || !qEl || !gridEl || !resultsEl || !emptyEl) return;

    const chips = ["All"].concat(D.CATEGORIES);
    chipsEl.innerHTML = chips
      .map((c, i) => `<button class="chip ${i === 0 ? "isOn" : ""}" type="button" data-chip="${escapeHTML(c)}">${escapeHTML(c)}</button>`)
      .join("");

    const partnerOptions = ["All partners"].concat(D.PARTNERS);
    partnerEl.innerHTML = partnerOptions
      .map((p, i) => `<option value="${i === 0 ? "all" : escapeHTML(p)}">${escapeHTML(p)}</option>`)
      .join("");

    const tagOptions = ["All", "Vegetarian", "Dairy-free", "Nut-free", "Gluten-free", "Limited", "Best value", "Delivery"];
    tagEl.innerHTML = tagOptions
      .map((t, i) => `<option value="${i === 0 ? "all" : escapeHTML(t)}">${escapeHTML(t)}</option>`)
      .join("");

    const sortOptions = [
      { v: "recommended", t: "Recommended" },
      { v: "bestValue", t: "Biggest discount" },
      { v: "endingSoon", t: "Ending soon" },
      { v: "nearest", t: "Nearest" },
      { v: "lowestPrice", t: "Lowest price" }
    ];
    sortEl.innerHTML = sortOptions.map((o) => `<option value="${o.v}">${o.t}</option>`).join("");

    const state = { category: "All", q: "", partner: "all", tag: "all", sort: "recommended" };
    function normalize(s) { return String(s).toLowerCase(); }

    function matches(deal) {
      const catOk = state.category === "All" ? true : deal.category === state.category;
      const pOk = state.partner === "all" ? true : normalize(deal.partner) === normalize(state.partner);

      const qOk = !state.q
        ? true
        : [deal.title, deal.partner, deal.description, deal.category]
            .some((x) => normalize(x).includes(normalize(state.q)));

      const tagOk = (function () {
        if (state.tag === "all") return true;
        const t = normalize(state.tag);
        if (t === "delivery") return !!deal.deliveryAvailable;
        const bucket = new Set([].concat(deal.tags || []).concat(deal.dietary || []).map(normalize));
        return bucket.has(t);
      })();

      return catOk && pOk && qOk && tagOk;
    }

    function sortDeals(arr) {
      const copy = arr.slice();
      if (state.sort === "bestValue") copy.sort((a, b) => pctOff(b) - pctOff(a));
      else if (state.sort === "endingSoon") copy.sort((a, b) => parseEndTimeToday(a.windowEnd) - parseEndTimeToday(b.windowEnd));
      else if (state.sort === "nearest") copy.sort((a, b) => a.distanceKm - b.distanceKm);
      else if (state.sort === "lowestPrice") copy.sort((a, b) => a.price - b.price);
      else copy.sort((a, b) => (pctOff(b) - pctOff(a)) || (a.distanceKm - b.distanceKm));
      return copy;
    }

    function render() {
      const filtered = D.DEALS.filter(matches);
      const sorted = sortDeals(filtered);

      gridEl.innerHTML = sorted.map(buildDealCard).join("");
      resultsEl.textContent = "Showing " + sorted.length + " deal" + (sorted.length === 1 ? "" : "s") + ".";
      emptyEl.style.display = sorted.length ? "none" : "block";

      gridEl.querySelectorAll("[data-reserve]").forEach((btn) => {
        btn.addEventListener("click", () => openReserveModal(btn.getAttribute("data-reserve")));
      });

      gridEl.querySelectorAll("[data-quickadd]").forEach((btn) => {
        btn.addEventListener("click", () => addToCart(btn.getAttribute("data-quickadd"), "pickup", 1));
      });
    }

    chipsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-chip]");
      if (!btn) return;
      const val = btn.getAttribute("data-chip");
      state.category = val;
      chipsEl.querySelectorAll("button[data-chip]").forEach((b) => {
        b.classList.toggle("isOn", b.getAttribute("data-chip") === val);
      });
      render();
    });

    qEl.addEventListener("input", () => { state.q = qEl.value.trim(); render(); });
    partnerEl.addEventListener("change", () => { state.partner = partnerEl.value; render(); });
    tagEl.addEventListener("change", () => { state.tag = tagEl.value; render(); });
    sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });

    render();
    setInterval(render, 60000);
  }

  function initHomePage() {
    if (!D) return;

    const highlights = document.getElementById("homeHighlights");
    if (highlights) {
      highlights.innerHTML = `
        <div class="badge badge--lime">Surplus-only listings</div>
        <div class="badge">Pickup windows near closing</div>
        <div class="badge badge--orange">5% profits donated</div>
      `;
    }

    const ui = getUserImpact();
    const row1 = document.getElementById("homeImpactRow1");
    const row2 = document.getElementById("homeImpactRow2");
    if (row1) {
      row1.innerHTML = `
        <div class="badge badge--lime">🍽️ ${ui.meals.toLocaleString()} meals</div>
        <div class="badge">🥕 ${Math.round(ui.kgFood).toLocaleString()} kg food</div>
        <div class="badge">🌿 ${Math.round(ui.kgCO2e).toLocaleString()} kg CO₂e</div>
      `;
    }
    if (row2) {
      row2.innerHTML = `
        <div class="badge badge--orange">🎗️ ${money(ui.donated)} donated</div>
        <div class="badge">💸 ${money(ui.savings)} saved</div>
        <div class="badge">🏷️ ${D.DEALS.length} deals tonight</div>
      `;
    }

    const updatesForm = document.getElementById("updatesForm");
    const updatesMsg = document.getElementById("updatesMsg");
    const email = document.getElementById("email");
    if (updatesForm && updatesMsg && email) {
      updatesForm.addEventListener("submit", (e) => {
        e.preventDefault();
        updatesMsg.textContent = "Subscribed: " + email.value.trim();
        toast("Subscribed");
        updatesForm.reset();
      });
    }
  }

  function openPartnerModal() {
    openModal({
      title: "Become a partner",
      bodyHTML: `
        <p class="muted">List surplus near closing and turn waste into revenue.</p>
        <form id="partnerForm" class="grid" style="gap:10px;">
          <div class="field">
            <label for="biz">Business name</label>
            <input id="biz" placeholder="Business name" required />
          </div>
          <div class="field">
            <label for="name">Contact name</label>
            <input id="name" placeholder="Your name" required />
          </div>
          <div class="field">
            <label for="pemail">Email</label>
            <input id="pemail" type="email" placeholder="you@company.com" required />
          </div>
          <div class="field">
            <label for="notes">Notes</label>
            <input id="notes" placeholder="Closing time, surplus types, location…" />
          </div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-close="1">Cancel</button>
        <button class="btn btn--primary" type="button" id="partnerSubmit">Submit</button>
      `,
      onMount: (root) => {
        root.querySelector("#partnerSubmit").addEventListener("click", () => {
          const form = root.querySelector("#partnerForm");
          if (!form.reportValidity()) return;
          closeModal();
          toast("Thanks — we’ll reach out soon.");
        });
      }
    });
  }

  function initMissionPage() {
    if (!D) return;

    const badges = document.getElementById("partnerBadges");
    if (badges) {
      badges.innerHTML = D.PARTNERS.map((p) => `<div class="badge">${escapeHTML(p)}</div>`).join("");
    }
    const cta = document.getElementById("partnerCta");
    if (cta) cta.addEventListener("click", openPartnerModal);
  }

  function initImpactPage() {
    if (!D) return;

    const ui = getUserImpact();
    const orders = readJSON(LS.orders, []);

    const y1 = document.getElementById("yourImpactRow1");
    const y2 = document.getElementById("yourImpactRow2");
    if (y1) {
      y1.innerHTML = `
        <div class="badge badge--lime">🍽️ ${ui.meals.toLocaleString()} meals</div>
        <div class="badge">🥕 ${Math.round(ui.kgFood).toLocaleString()} kg food</div>
        <div class="badge">🌿 ${Math.round(ui.kgCO2e).toLocaleString()} kg CO₂e</div>
      `;
    }
    if (y2) {
      y2.innerHTML = `
        <div class="badge badge--orange">🎗️ ${money(ui.donated)} donated</div>
        <div class="badge">💸 ${money(ui.savings)} saved</div>
        <div class="badge">🧾 Orders: ${orders.length}</div>
      `;
    }

    const factorLine = document.getElementById("factorLine");
    if (factorLine) {
      factorLine.textContent = `${D.IMPACT.kgFoodPerMeal} kg food/meal • ${D.IMPACT.kgCO2ePerMeal} kg CO₂e/meal`;
    }

    const recent = document.getElementById("recentOrders");
    if (recent) {
      const rows = orders.slice(0, 10).map((o) => {
        const d = new Date(o.ts);
        const when = d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

        const title = o.lines
          .map((l) => {
            const deal = D.DEALS.find((x) => x.id === l.id);
            return deal ? `${l.qty}× ${deal.title}` : `${l.qty}× Item`;
          })
          .join(" • ");

        return `
          <div class="card" style="border-radius:16px;">
            <div class="card__pad">
              <div class="tiny muted">${escapeHTML(when)}</div>
              <div style="font-weight:1100; letter-spacing:-0.02em;">${escapeHTML(title)}</div>
              <div class="grid grid--3" style="margin-top:10px; gap:10px;">
                <div class="badge">🍽️ ${o.impact.meals} meals</div>
                <div class="badge">🥕 ${round1(o.impact.kgFood)} kg</div>
                <div class="badge">🌿 ${round1(o.impact.kgCO2e)} kg CO₂e</div>
              </div>
              <div class="grid grid--3" style="margin-top:8px; gap:10px;">
                <div class="badge badge--orange">🎗️ ${money(o.impact.donated)} donated</div>
                <div class="badge">💸 ${money(o.savings)} saved</div>
                <div class="badge">🧾 ${money(o.subtotal)} total</div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      recent.innerHTML = rows || `<div class="card"><div class="card__pad"><p class="muted">No orders yet. Add deals and place an order from your cart.</p></div></div>`;
    }

    const reset = document.getElementById("resetImpact");
    if (reset) {
      reset.addEventListener("click", () => {
        try { localStorage.removeItem(LS.orders); } catch {}
        try { localStorage.removeItem(LS.impact); } catch {}
        try { localStorage.removeItem(LS.cart); } catch {}
        // also clear window.name mirror
        const store = readWindowNameStore();
        delete store[LS.orders];
        delete store[LS.impact];
        delete store[LS.cart];
        writeWindowNameStore(store);

        renderCartCount();
        toast("Impact reset.");
        initImpactPage();
      });
    }
  }

  function initCartPage() {
    const itemsEl = document.getElementById("cartItems");
    const emptyEl = document.getElementById("cartEmpty");
    const summaryEl = document.getElementById("cartSummary");
    const form = document.getElementById("checkoutForm");
    const msg = document.getElementById("orderMsg");
    const placeBtn = document.getElementById("placeOrderBtn");

    if (!itemsEl || !emptyEl || !summaryEl || !form || !msg || !placeBtn) return;

    function render() {
      const cart = getCart();
      const { lines, subtotal, original, savings } = cartTotals(cart);

      emptyEl.style.display = lines.length ? "none" : "block";

      itemsEl.innerHTML = lines.map((l) => {
        const deliveryOption = l.deal.deliveryAvailable
          ? `<option value="delivery" ${l.mode === "delivery" ? "selected" : ""}>Delivery</option>`
          : "";

        return `
          <div class="card" style="border-radius:16px;">
            <div class="card__pad" style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start;">
              <div style="min-width:0;">
                <div class="tiny muted">${escapeHTML(l.deal.partner)} • ${escapeHTML(l.deal.category)}</div>
                <div style="font-weight:1100; letter-spacing:-0.02em;">${escapeHTML(l.deal.title)}</div>
                <div class="tiny muted" style="margin-top:6px;">
                  <strong>${money(l.deal.price)}</strong>
                  <span style="text-decoration:line-through; color:rgba(11,15,13,0.55); font-weight:900;">${money(l.deal.originalValue)}</span>
                </div>
                <div class="tiny muted" style="margin-top:6px;">Pickup window: <strong>${escapeHTML(l.deal.window || "")}</strong></div>

                <div class="field" style="margin-top:10px;">
                  <label for="mode_${escapeHTML(l.deal.id)}">Pickup / delivery</label>
                  <select id="mode_${escapeHTML(l.deal.id)}" data-mode="${escapeHTML(l.deal.id)}">
                    <option value="pickup" ${l.mode === "pickup" ? "selected" : ""}>Pickup</option>
                    ${deliveryOption}
                  </select>
                </div>
              </div>

              <div style="display:grid; gap:10px; justify-items:end;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="btn btn--ghost" type="button" data-qtyminus="${escapeHTML(l.deal.id)}" data-modekey="${escapeHTML(l.mode)}">−</button>
                  <strong>${l.qty}</strong>
                  <button class="btn btn--ghost" type="button" data-qtyplus="${escapeHTML(l.deal.id)}" data-modekey="${escapeHTML(l.mode)}">+</button>
                </div>
                <button class="btn btn--ghost" type="button" data-remove="${escapeHTML(l.deal.id)}" data-modekey="${escapeHTML(l.mode)}">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      summaryEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span class="muted">Subtotal</span><strong>${money(subtotal)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span class="muted">Original value</span><span class="muted">${money(original)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span class="muted">You save</span><strong>${money(savings)}</strong>
        </div>
      `;

      placeBtn.disabled = lines.length === 0;
      renderCartCount();
    }

    function updateQty(id, mode, delta) {
      const cart = getCart();
      const idx = cart.findIndex((x) => x.id === id && x.mode === mode);
      if (idx < 0) return;

      cart[idx].qty = Math.max(0, (Number(cart[idx].qty) || 0) + delta);
      if (cart[idx].qty === 0) cart.splice(idx, 1);

      setCart(cart);
      render();
    }

    function removeLine(id, mode) {
      const cart = getCart().filter((x) => !(x.id === id && x.mode === mode));
      setCart(cart);
      render();
    }

    itemsEl.addEventListener("click", (e) => {
      const minus = e.target.closest("[data-qtyminus]");
      const plus = e.target.closest("[data-qtyplus]");
      const rem = e.target.closest("[data-remove]");

      if (minus) {
        updateQty(minus.getAttribute("data-qtyminus"), minus.getAttribute("data-modekey"), -1);
      } else if (plus) {
        updateQty(plus.getAttribute("data-qtyplus"), plus.getAttribute("data-modekey"), +1);
      } else if (rem) {
        removeLine(rem.getAttribute("data-remove"), rem.getAttribute("data-modekey"));
      }
    });

    itemsEl.addEventListener("change", (e) => {
      const sel = e.target.closest("select[data-mode]");
      if (!sel) return;

      const id = sel.getAttribute("data-mode");
      const newMode = sel.value;

      const cart = getCart();
      const lines = cartLines(cart);
      const line = lines.find((l) => l.deal.id === id);
      if (!line) return;

      const oldMode = line.mode;
      if (oldMode === newMode) return;

      const qty = line.qty;

      // remove old line
      let next = cart.filter((x) => !(x.id === id && x.mode === oldMode));

      // add/merge new line
      const existing = next.find((x) => x.id === id && x.mode === newMode);
      if (existing) {
        existing.qty = (Number(existing.qty) || 0) + qty;
      } else {
        // carry snapshot fields forward
        const snapshot = cart.find((x) => x.id === id && x.mode === oldMode) || {};
        next.push({ ...snapshot, id, mode: newMode, qty });
      }

      setCart(next);
      render();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const cart = getCart();
      const { lines, subtotal, original, savings } = cartTotals(cart);
      if (!lines.length) {
        msg.textContent = "Your cart is empty.";
        return;
      }

      const impact = computeImpactForOrder(lines.map((l) => ({ qty: l.qty, mode: l.mode })));

      const order = {
        id: "ord_" + Date.now(),
        ts: Date.now(),
        lines: lines.map((l) => ({ id: l.deal.id, qty: l.qty, mode: l.mode })),
        subtotal,
        original,
        savings,
        impact
      };

      const orders = readJSON(LS.orders, []);
      orders.unshift(order);
      writeJSON(LS.orders, orders.slice(0, 30));

      const ui = getUserImpact();
      const next = {
        meals: ui.meals + impact.meals,
        kgFood: ui.kgFood + impact.kgFood,
        kgCO2e: ui.kgCO2e + impact.kgCO2e,
        donated: ui.donated + impact.donated,
        savings: ui.savings + savings
      };
      setUserImpact(next);

      setCart([]);
      render();

      openModal({
        title: "Order confirmed",
        bodyHTML: `
          <p><strong>Thanks — your order is confirmed.</strong></p>
          <p class="muted">You rescued <strong>${impact.meals}</strong> meal(s), saved about <strong>${round1(impact.kgFood)}</strong> kg of food, and avoided about <strong>${round1(impact.kgCO2e)}</strong> kg CO₂e.</p>
          <p class="muted">Estimated donation from this order: <strong>${money(impact.donated)}</strong>.</p>
          <hr class="hr" />
          <p class="tiny muted">Pickup windows are shown per item. Please arrive within the listed time.</p>
        `,
        footerHTML: `
          <a class="btn btn--ghost" href="./impact-tracker.html">View Impact Tracker</a>
          <button class="btn btn--primary" type="button" data-close="1">Done</button>
        `
      });

      msg.textContent = "Order placed.";
      toast("Order confirmed");
      form.reset();
    });

    // Re-render when navigating back to Cart page
    window.addEventListener("pageshow", render);
    window.addEventListener("storage", (e) => {
      if (e.key === LS.cart) render();
    });

    render();
  }

  function initContactPage() {
    const form = document.getElementById("contactForm");
    const msg = document.getElementById("contactMsg");
    if (!form || !msg) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      msg.textContent = "Message sent — we’ll reply by email.";
      toast("Message sent");
      form.reset();
    });
  }

  function initCommon() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    setActiveNav();
    initMobileMenu();
    renderCartCount();
  }

  function initPage() {
    const page = document.body.getAttribute("data-page");
    if (page === "home") initHomePage();
    if (page === "deals") initDealsPage();
    if (page === "mission") initMissionPage();
    if (page === "impact") initImpactPage();
    if (page === "cart") initCartPage();
    if (page === "contact") initContactPage();
  }

  function boot() {
    initCommon();
    initPage();
  }

  document.addEventListener("DOMContentLoaded", function () {
    // If data.js loads after main.js, wait briefly
    const start = Date.now();
    (function waitForData() {
      D = window.LastBiteData || D;
      if (D || Date.now() - start > 2000) {
        boot();
        return;
      }
      setTimeout(waitForData, 25);
    })();
  });
})();
