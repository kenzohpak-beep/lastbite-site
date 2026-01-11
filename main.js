(() => {
  "use strict";

  /* -----------------------------
    Utilities
  ----------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clampInt = (n, min, max) => Math.max(min, Math.min(max, Math.floor(Number(n || 0))));
  const toMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "CAD" });

  const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        default: return ch;
      }
    });

  const normalizeTags = (x) => {
    if (!x) return [];
    if (Array.isArray(x)) return x.map((t) => String(t).trim()).filter(Boolean);
    return String(x)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  /* -----------------------------
    Storage (localStorage with fallback for file://)
  ----------------------------- */
  const NAME_PREFIX = "__lastbite_store__=";

  function storageAvailable(type) {
    try {
      const s = window[type];
      const testKey = "__t__";
      s.setItem(testKey, "1");
      s.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  const bestStorage =
    (storageAvailable("localStorage") && window.localStorage) ||
    (storageAvailable("sessionStorage") && window.sessionStorage) ||
    null;

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
    if (bestStorage) {
      try {
        const raw = bestStorage.getItem(key);
        if (raw != null) return JSON.parse(raw);
      } catch {
        // continue to window.name fallback
      }
    }
    const store = readWindowNameStore();
    return store[key] != null ? store[key] : fallback;
  }

  function writeJSON(key, value) {
    if (bestStorage) {
      try {
        bestStorage.setItem(key, JSON.stringify(value));
      } catch {
        // continue to window.name fallback
      }
    }
    const store = readWindowNameStore();
    store[key] = value;
    writeWindowNameStore(store);
  }

  /* -----------------------------
    Toasts
  ----------------------------- */
  const toastRoot = $("#toastRoot");
  const toast = (msg) => {
    if (!toastRoot) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = String(msg);
    toastRoot.appendChild(el);
    window.setTimeout(() => el.remove(), 2400);
  };

  /* -----------------------------
    Data (from data.js if present)
  ----------------------------- */
  const fallbackDeals = [
    // COBS Bread
    { id: "cobs-1", partner: "COBS Bread", title: "Surprise Bread Bag", category: "Bakery", price: 6.99, original: 14.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:30–9:15pm", location: "Near closing" },
    { id: "cobs-2", partner: "COBS Bread", title: "Sweet Treat Box", category: "Bakery", price: 7.49, original: 16.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:30–9:15pm", location: "Near closing" },
    // SanRemo
    { id: "sanremo-1", partner: "SanRemo Bakery", title: "Assorted Pastry Box", category: "Bakery", price: 8.99, original: 22.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:45–8:30pm", location: "Evening" },
    { id: "sanremo-2", partner: "SanRemo Bakery", title: "Cookie + Brownie Mix Box", category: "Bakery", price: 7.99, original: 19.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:45–8:30pm", location: "Evening" },
    // Dufflet
    { id: "dufflet-1", partner: "Dufflet Pastries", title: "Cake Slice Trio", category: "Dessert", price: 9.49, original: 21.00, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:30–8:15pm", location: "Evening" },
    { id: "dufflet-2", partner: "Dufflet Pastries", title: "Croissant + Danish Box", category: "Bakery", price: 8.49, original: 20.00, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:30–8:15pm", location: "Evening" },
    // Uncle Tetsu
    { id: "tetsu-1", partner: "Uncle Tetsu’s Cheesecake", title: "Cheesecake Slice Pack", category: "Dessert", price: 8.99, original: 18.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:00–8:45pm", location: "Evening" },
    { id: "tetsu-2", partner: "Uncle Tetsu’s Cheesecake", title: "Mini Cheesecake Box", category: "Dessert", price: 10.99, original: 24.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:00–8:45pm", location: "Evening" },
    // Dimpflmeier
    { id: "dimp-1", partner: "Dimpflmeier Bakery", title: "European Bread Bundle", category: "Bakery", price: 7.99, original: 19.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:45–8:30pm", location: "Evening" },
    { id: "dimp-2", partner: "Dimpflmeier Bakery", title: "Pretzel + Bun Mix Bag", category: "Bakery", price: 6.49, original: 15.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:45–8:30pm", location: "Evening" },
    // St Urbain
    { id: "urbain-1", partner: "St. Urbain Bagel Bakery", title: "Bagel Dozen", category: "Bakery", price: 6.99, original: 15.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:15–9:00pm", location: "Evening" },
    { id: "urbain-2", partner: "St. Urbain Bagel Bakery", title: "Bagel + Spread Bundle", category: "Bakery", price: 7.99, original: 18.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:15–9:00pm", location: "Evening" },
    // Athens Pastries
    { id: "athens-1", partner: "Athens Pastries", title: "Baklava Box", category: "Dessert", price: 8.99, original: 20.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:15–8:00pm", location: "Evening" },
    { id: "athens-2", partner: "Athens Pastries", title: "Greek Pastry Mix", category: "Dessert", price: 9.49, original: 22.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:15–8:00pm", location: "Evening" },
    // Nadege
    { id: "nadege-1", partner: "Nadege Patisserie", title: "Macaron Mix Box", category: "Dessert", price: 10.99, original: 26.00, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:30–8:15pm", location: "Evening" },
    { id: "nadege-2", partner: "Nadege Patisserie", title: "Pastry Surprise Box", category: "Dessert", price: 11.49, original: 28.00, tags: ["Vegetarian", "Pickup"], pickupWindow: "7:30–8:15pm", location: "Evening" },
    // Kettleman's
    { id: "kett-1", partner: "Kettleman’s Bagels", title: "Bagel Variety Box", category: "Bakery", price: 7.49, original: 17.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "9:00–9:45pm", location: "Late" },
    { id: "kett-2", partner: "Kettleman’s Bagels", title: "Bagel + Cream Cheese Set", category: "Bakery", price: 8.49, original: 19.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "9:00–9:45pm", location: "Late" },
    // Krispy Kreme
    { id: "kk-1", partner: "Krispy Kreme", title: "Assorted Doughnut Dozen", category: "Dessert", price: 9.99, original: 19.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:45–9:30pm", location: "Late" },
    { id: "kk-2", partner: "Krispy Kreme", title: "Glazed + Chocolate Box", category: "Dessert", price: 9.49, original: 18.99, tags: ["Vegetarian", "Pickup"], pickupWindow: "8:45–9:30pm", location: "Late" },
    // Revolver Pizza
    { id: "rev-1", partner: "Revolver Pizza Co.", title: "Slice Duo + Dip", category: "Pizza", price: 8.99, original: 18.99, tags: ["Pickup"], pickupWindow: "9:00–9:30pm", location: "Near closing" },
    { id: "rev-2", partner: "Revolver Pizza Co.", title: "End-of-day Pizza Box", category: "Pizza", price: 12.99, original: 28.99, tags: ["Pickup"], pickupWindow: "9:00–9:30pm", location: "Near closing" },
  ];

  function getDealsFromWindow() {
    // Support multiple possible globals from data.js
    const candidates = [
      window.LASTBITE_DATA?.deals,
      window.LastBiteData?.deals,
      window.LASTBITE_DEALS,
      window.LastBiteDeals,
      window.deals,
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c;
    }
    return fallbackDeals;
  }

  function normalizeDeal(d) {
    const tags = normalizeTags(d.tags);
    const price = Number(d.price || 0);
    const original = Number(d.original || 0);
    return {
      id: String(d.id ?? `${Date.now()}-${Math.random()}`),
      partner: String(d.partner || "Partner"),
      title: String(d.title || "Deal"),
      category: String(d.category || "Other"),
      price,
      original: original > 0 ? original : Math.max(price, price * 1.6),
      tags,
      pickupWindow: String(d.pickupWindow || "Near closing"),
      location: String(d.location || "Nearby"),
    };
  }

  const DEALS = getDealsFromWindow().map(normalizeDeal);

  /* -----------------------------
    Cart
  ----------------------------- */
  const CART_KEY = "lastbite_cart_v1";

  const readCart = () => {
    const cart = readJSON(CART_KEY, []);
    return Array.isArray(cart) ? cart : [];
  };

  const writeCart = (cart) => {
    writeJSON(CART_KEY, Array.isArray(cart) ? cart : []);
  };

  const getCartCount = () =>
    readCart().reduce((sum, it) => sum + Math.max(1, Number(it.qty || 1)), 0);

  const renderCartCount = () => {
    const pill = $("#cartCount");
    if (!pill) return;
    pill.textContent = String(getCartCount());
  };

  const addToCart = (dealId) => {
    const deal = DEALS.find((d) => String(d.id) === String(dealId));
    if (!deal) return;

    const cart = readCart();
    const idx = cart.findIndex((it) => String(it.id) === String(deal.id));
    if (idx >= 0) {
      cart[idx].qty = Math.max(1, Number(cart[idx].qty || 1) + 1);
    } else {
      cart.push({ ...deal, qty: 1 });
    }
    writeCart(cart);
    renderCartCount();

    const saved = Math.max(0, (deal.original || 0) - (deal.price || 0));
    toast(`Added to cart — you save about ${toMoney(saved)}.`);
  };

  const removeFromCart = (id) => {
    const cart = readCart().filter((it) => String(it.id) !== String(id));
    writeCart(cart);
    renderCartCount();
  };

  const setCartQty = (id, qty) => {
    const q = clampInt(qty, 1, 99);
    const cart = readCart().map((it) => (String(it.id) === String(id) ? { ...it, qty: q } : it));
    writeCart(cart);
    renderCartCount();
  };

  /* -----------------------------
    Impact tracking (simple estimates)
  ----------------------------- */
  const IMPACT_KEY = "lastbite_impact_v1";

  // Conservative, easy-to-understand estimates per rescued item
  const FOOD_KG_PER_ITEM = 0.75;
  const CO2_KG_PER_ITEM = 1.6;

  const readImpact = () => {
    const x = readJSON(IMPACT_KEY, null);
    if (!x || typeof x !== "object") {
      return { meals: 0, foodKg: 0, co2Kg: 0, savings: 0, spend: 0 };
    }
    return {
      meals: Number(x.meals || 0),
      foodKg: Number(x.foodKg || 0),
      co2Kg: Number(x.co2Kg || 0),
      savings: Number(x.savings || 0),
      spend: Number(x.spend || 0),
    };
  };

  const writeImpact = (obj) => writeJSON(IMPACT_KEY, obj);

  const addImpactFromCheckout = (cart) => {
    const impact = readImpact();
    const meals = cart.reduce((sum, it) => sum + Math.max(1, Number(it.qty || 1)), 0);
    const savings = cart.reduce((sum, it) => {
      const q = Math.max(1, Number(it.qty || 1));
      return sum + Math.max(0, (Number(it.original || 0) - Number(it.price || 0)) * q);
    }, 0);
    const spend = cart.reduce((sum, it) => {
      const q = Math.max(1, Number(it.qty || 1));
      return sum + Number(it.price || 0) * q;
    }, 0);

    impact.meals += meals;
    impact.foodKg += meals * FOOD_KG_PER_ITEM;
    impact.co2Kg += meals * CO2_KG_PER_ITEM;
    impact.savings += savings;
    impact.spend += spend;

    writeImpact(impact);
  };

  /* -----------------------------
    Page: Navigation + year
  ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Active tab styling
  const page = document.body?.dataset?.page || "";
  $$("[data-route]").forEach((a) => {
    if (a.dataset.route === page) {
      a.classList.add("isActive");
      a.setAttribute("aria-current", "page");
    }
  });

  // Mobile nav toggle
  const navToggle = $("#navToggle");
  const mobileNav = $("#mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = !mobileNav.hasAttribute("hidden");
      if (isOpen) {
        mobileNav.setAttribute("hidden", "");
        navToggle.setAttribute("aria-expanded", "false");
      } else {
        mobileNav.removeAttribute("hidden");
        navToggle.setAttribute("aria-expanded", "true");
      }
    });

    window.addEventListener("click", (e) => {
      if (mobileNav.hasAttribute("hidden")) return;
      const t = e.target;
      if (t === navToggle || navToggle.contains(t) || mobileNav.contains(t)) return;
      mobileNav.setAttribute("hidden", "");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  // Keep cart count correct across page navigation
  renderCartCount();
  window.addEventListener("pageshow", renderCartCount);
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) renderCartCount();
  });

  /* -----------------------------
    Page: Home
  ----------------------------- */
  function initHome() {
    const highlights = $("#homeHighlights");
    if (highlights) {
      const featured = DEALS.slice(0, 3);
      highlights.innerHTML = featured
        .map((d) => {
          const pct = Math.round((1 - d.price / d.original) * 100);
          return `
            <div class="card">
              <div class="card__pad">
                <div class="badge">${escapeHtml(d.partner)}</div>
                <div style="margin-top:10px; font-weight:980;">${escapeHtml(d.title)}</div>
                <div class="muted tiny" style="margin-top:6px;">
                  ${escapeHtml(d.category)} • ${escapeHtml(d.pickupWindow)}
                </div>
                <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:10px;">
                  <div>
                    <div style="font-weight:980;">${toMoney(d.price)}</div>
                    <div class="tiny muted" style="text-decoration:line-through;">${toMoney(d.original)}</div>
                  </div>
                  <div class="discount">${pct}% off</div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const impact = readImpact();

    const row1 = $("#homeImpactRow1");
    const row2 = $("#homeImpactRow2");

    const makeMetric = (label, value) => `
      <div class="card">
        <div class="card__pad">
          <div class="tiny muted">${escapeHtml(label)}</div>
          <div style="font-weight:980; font-size:18px; margin-top:6px;">${escapeHtml(value)}</div>
        </div>
      </div>
    `;

    if (row1) {
      row1.innerHTML =
        makeMetric("Meals rescued", `${Math.round(impact.meals)}`) +
        makeMetric("Food saved (est.)", `${impact.foodKg.toFixed(1)} kg`) +
        makeMetric("CO₂ avoided (est.)", `${impact.co2Kg.toFixed(1)} kg`);
    }
    if (row2) {
      row2.innerHTML =
        makeMetric("Savings", toMoney(impact.savings)) +
        makeMetric("Spent on rescued food", toMoney(impact.spend)) +
        makeMetric("Profit donation", "5% of profits");
    }

    // Updates form
    const form = $("#updatesForm");
    const msg = $("#updatesMsg");
    if (form && msg) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        msg.textContent = "Subscribed. Watch for new deal drops.";
        toast("Subscribed.");
        form.reset();
      });
    }
  }

  /* -----------------------------
    Page: Browse Deals
  ----------------------------- */
  function initDeals() {
    const grid = $("#dealsGrid");
    if (!grid) return;

    const chipsEl = $("#categoryChips");
    const qEl = $("#q");
    const partnerEl = $("#partner");
    const tagEl = $("#tag");
    const sortEl = $("#sort");
    const countEl = $("#resultsCount");
    const emptyEl = $("#emptyState");

    const categories = ["All", ...Array.from(new Set(DEALS.map((d) => d.category))).sort()];
    const partners = ["All partners", ...Array.from(new Set(DEALS.map((d) => d.partner))).sort()];
    const tags = ["All tags", ...Array.from(new Set(DEALS.flatMap((d) => d.tags))).sort()];

    const state = {
      category: "All",
      q: "",
      partner: "All partners",
      tag: "All tags",
      sort: "Best discount",
    };

    // Chips
    if (chipsEl) {
      chipsEl.innerHTML = categories
        .map(
          (c) =>
            `<button class="chip" type="button" aria-pressed="${c === "All"}" data-cat="${escapeHtml(
              c
            )}">${escapeHtml(c)}</button>`
        )
        .join("");

      chipsEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-cat]");
        if (!btn) return;
        state.category = btn.getAttribute("data-cat");
        $$(".chip", chipsEl).forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        render();
      });
    }

    // Selects
    const fillSelect = (el, options) => {
      if (!el) return;
      el.innerHTML = options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
    };
    fillSelect(partnerEl, partners);
    fillSelect(tagEl, tags);
    fillSelect(sortEl, ["Best discount", "Price: low to high", "Price: high to low", "Newest first"]);

    if (qEl) qEl.addEventListener("input", () => { state.q = qEl.value.trim().toLowerCase(); render(); });
    if (partnerEl) partnerEl.addEventListener("change", () => { state.partner = partnerEl.value; render(); });
    if (tagEl) tagEl.addEventListener("change", () => { state.tag = tagEl.value; render(); });
    if (sortEl) sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });

    const getDiscountPct = (d) => Math.round((1 - d.price / d.original) * 100);

    const applyFilters = () => {
      let list = DEALS.slice();

      if (state.category !== "All") {
        list = list.filter((d) => d.category === state.category);
      }
      if (state.partner !== "All partners") {
        list = list.filter((d) => d.partner === state.partner);
      }
      if (state.tag !== "All tags") {
        list = list.filter((d) => d.tags.includes(state.tag));
      }
      if (state.q) {
        list = list.filter((d) => {
          const hay = `${d.title} ${d.partner} ${d.category} ${d.tags.join(" ")}`.toLowerCase();
          return hay.includes(state.q);
        });
      }

      // Sort
      if (state.sort === "Best discount") {
        list.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
      } else if (state.sort === "Price: low to high") {
        list.sort((a, b) => a.price - b.price);
      } else if (state.sort === "Price: high to low") {
        list.sort((a, b) => b.price - a.price);
      } else if (state.sort === "Newest first") {
        // keep original order (fallback deals are already in a reasonable order)
      }

      return list;
    };

    const renderDealCard = (d) => {
      const pct = getDiscountPct(d);
      const tagsHtml = d.tags.slice(0, 4).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      return `
        <article class="dealCard" data-deal-id="${escapeHtml(d.id)}">
          <div class="dealTop">
            <div class="badge">${escapeHtml(d.partner)}</div>
            <div class="discount">${pct}% off</div>
          </div>
          <h3 class="dealTitle">${escapeHtml(d.title)}</h3>
          <div class="dealMeta">${escapeHtml(d.category)} • Pickup: ${escapeHtml(d.pickupWindow)}</div>
          <div class="tags">${tagsHtml}</div>
          <div class="dealBottom">
            <div class="priceRow">
              <div class="priceNow">${toMoney(d.price)}</div>
              <div class="priceWas">${toMoney(d.original)}</div>
            </div>
            <button class="btn btn--primary btn--small" type="button" data-add="${escapeHtml(d.id)}">Add to cart</button>
          </div>
        </article>
      `;
    };

    const render = () => {
      const list = applyFilters();

      if (countEl) countEl.textContent = `Showing ${list.length} deal${list.length === 1 ? "" : "s"}`;
      if (emptyEl) emptyEl.style.display = list.length ? "none" : "block";

      grid.innerHTML = list.map(renderDealCard).join("");
    };

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      const id = btn.getAttribute("data-add");
      addToCart(id);
      btn.textContent = "Added ✓";
      btn.disabled = true;
      window.setTimeout(() => {
        btn.textContent = "Add to cart";
        btn.disabled = false;
      }, 800);
    });

    render();
  }

  /* -----------------------------
    Page: Cart (shows items you added)
  ----------------------------- */
  function initCartPage() {
    const listEl = $("#cartItems");
    const emptyEl = $("#cartEmpty");
    const summaryEl = $("#cartSummary");
    if (!listEl || !emptyEl || !summaryEl) return;

    const render = () => {
      const cart = readCart();
      renderCartCount();

      if (!cart.length) {
        listEl.innerHTML = "";
        emptyEl.style.display = "block";
      } else {
        emptyEl.style.display = "none";
      }

      listEl.innerHTML = cart
        .map((it) => {
          const qty = Math.max(1, Number(it.qty || 1));
          const lineTotal = Number(it.price || 0) * qty;
          const lineSaved = Math.max(0, (Number(it.original || 0) - Number(it.price || 0)) * qty);
          const modeTag =
            normalizeTags(it.tags).some((t) => String(t).toLowerCase() === "delivery")
              ? "DELIVERY"
              : "PICKUP";

          return `
            <div class="cartItem" data-cart-id="${escapeHtml(it.id)}">
              <div class="cartItem__left">
                <p class="cartItem__title">${escapeHtml(it.title || "")}</p>
                <p class="cartItem__meta">${escapeHtml(it.partner || "")} • ${modeTag}</p>
                <p class="cartItem__meta">You save about ${toMoney(lineSaved)}</p>
              </div>

              <div class="cartItem__right">
                <div class="price">${toMoney(lineTotal)}</div>
                <div class="qty">
                  <label class="sr-only" for="qty_${escapeHtml(it.id)}">Quantity</label>
                  <input id="qty_${escapeHtml(it.id)}" type="number" min="1" step="1" value="${qty}" data-qty="1" />
                  <button class="btn btn--ghost btn--small" type="button" data-remove="1">Remove</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      const subtotal = cart.reduce((sum, it) => sum + Number(it.price || 0) * Math.max(1, Number(it.qty || 1)), 0);
      const savings = cart.reduce(
        (sum, it) => sum + Math.max(0, Number(it.original || 0) - Number(it.price || 0)) * Math.max(1, Number(it.qty || 1)),
        0
      );

      summaryEl.innerHTML = `
        <div class="summaryRow"><span>Subtotal</span><strong>${toMoney(subtotal)}</strong></div>
        <div class="summaryRow"><span>Estimated savings</span><strong>${toMoney(savings)}</strong></div>
        <div class="summaryRow"><span>Donation</span><strong>5% of profits</strong></div>
        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn--primary" type="button" id="checkoutBtn">Checkout</button>
          <button class="btn btn--ghost" type="button" id="clearCartBtn">Clear cart</button>
        </div>
      `;

      const clearBtn = $("#clearCartBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          writeCart([]);
          render();
          toast("Cart cleared.");
        });
      }

      const checkoutBtn = $("#checkoutBtn");
      if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
          const current = readCart();
          if (!current.length) {
            toast("Your cart is empty.");
            return;
          }
          // Update impact totals on successful checkout
          addImpactFromCheckout(current);
          writeCart([]);
          render();
          toast("Order placed. Thanks for saving food today.");
        });
      }
    };

    listEl.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove]");
      if (!rm) return;
      const row = rm.closest("[data-cart-id]");
      if (!row) return;
      removeFromCart(row.getAttribute("data-cart-id"));
      render();
    });

    listEl.addEventListener("input", (e) => {
      const qtyInput = e.target.closest("[data-qty]");
      if (!qtyInput) return;
      const row = qtyInput.closest("[data-cart-id]");
      if (!row) return;
      setCartQty(row.getAttribute("data-cart-id"), qtyInput.value);
      render();
    });

    window.addEventListener("pageshow", render);
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) render();
    });

    render();
  }

  /* -----------------------------
    Page: Impact Tracker
  ----------------------------- */
  function initImpactPage() {
    // This is intentionally ID-agnostic:
    // If your impact page has containers, use these IDs to auto-fill:
    // impactMeals, impactFood, impactCo2, impactSavings, impactSpend
    const impact = readImpact();

    const setText = (id, val) => {
      const el = $("#" + id);
      if (el) el.textContent = val;
    };

    setText("impactMeals", String(Math.round(impact.meals)));
    setText("impactFood", `${impact.foodKg.toFixed(1)} kg`);
    setText("impactCo2", `${impact.co2Kg.toFixed(1)} kg`);
    setText("impactSavings", toMoney(impact.savings));
    setText("impactSpend", toMoney(impact.spend));

    // If the page has a reset button
    const reset = $("#impactReset");
    if (reset) {
      reset.addEventListener("click", () => {
        writeImpact({ meals: 0, foodKg: 0, co2Kg: 0, savings: 0, spend: 0 });
        toast("Impact tracker reset.");
        initImpactPage();
      });
    }
  }

  /* -----------------------------
    Init by page
  ----------------------------- */
  if (page === "home") initHome();
  if (page === "deals") initDeals();
  if ($("#cartItems")) initCartPage();
  if (page === "impact") initImpactPage();
})();
