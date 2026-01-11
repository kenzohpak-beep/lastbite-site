(function () {
  const D = window.LastBiteData;
  if (!D) return;

  const LS = {
    cart: "lastbite_cart_v1",
    orders: "lastbite_orders_v1",
    profile: "lastbite_profile_v1",
    impact: "lastbite_user_impact_v1"
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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
    setTimeout(() => el.remove(), 3000);
  }

  function closeModal() {
    if (!modalRoot) return;
    if (modalRoot._cleanup) modalRoot._cleanup();
    modalRoot.classList.remove("isOpen");   // IMPORTANT
    modalRoot.hidden = true;                // extra safety
    modalRoot.innerHTML = "";
    modalRoot._cleanup = null;
  }

  function openModal({ title, bodyHTML, footerHTML, onMount }) {
    if (!modalRoot) return;
    modalRoot.hidden = false;
    modalRoot.classList.add("isOpen");      // IMPORTANT
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
    const routeMap = { home: "home", deals: "deals", how: "how", mission: "mission", impact: "impact" };
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

  function getCart() {
    return readJSON(LS.cart, []);
  }
  function setCart(cart) {
    writeJSON(LS.cart, cart);
    renderCartCount();
  }
  function renderCartCount() {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const cart = getCart();
    const n = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
    el.textContent = String(n);
  }

  function getUserImpact() {
    return readJSON(LS.impact, { meals: 0, kgFood: 0, kgCO2e: 0, donated: 0, savings: 0 });
  }
  function setUserImpact(v) {
    writeJSON(LS.impact, v);
  }

  function cartLines(cart) {
    return cart
      .map((it) => {
        const deal = D.DEALS.find((x) => x.id === it.id);
        return deal ? { ...it, deal } : null;
      })
      .filter(Boolean);
  }

  function cartTotals(cart) {
    const lines = cartLines(cart);
    const subtotal = lines.reduce((s, l) => s + l.deal.price * l.qty, 0);
    const original = lines.reduce((s, l) => s + l.deal.originalValue * l.qty, 0);
    const savings = Math.max(0, original - subtotal);
    return { lines, subtotal, original, savings };
  }

  function computeImpactForCheckout(lines) {
    const meals = lines.reduce((s, l) => s + l.qty, 0);
    const kgFood = meals * D.IMPACT.kgFoodPerMeal;
    const kgCO2e = meals * D.IMPACT.kgCO2ePerMeal;

    const grossProfit = lines.reduce((s, l) => {
      const per = l.mode === "delivery" ? D.IMPACT.grossProfitDelivery : D.IMPACT.grossProfitPickup;
      return s + per * l.qty;
    }, 0);

    const donated = grossProfit * D.IMPACT.donationRate;
    return { meals, kgFood, kgCO2e, donated, grossProfit };
  }

  function openCartModal() {
    const cart = getCart();
    const { lines, subtotal, original, savings } = cartTotals(cart);
    const impact = computeImpactForCheckout(lines.map((l) => ({ qty: l.qty, mode: l.mode })));

    const bodyHTML = lines.length
      ? `
        <div class="grid" style="gap:12px;">
          ${lines
            .map(
              (l) => `
                <div class="card" style="border-radius:16px;">
                  <div class="card__pad" style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start;">
                    <div style="min-width:0;">
                      <div class="tiny muted">${escapeHTML(l.deal.partner)} • ${escapeHTML(l.deal.category)}</div>
                      <div style="font-weight:1100; letter-spacing:-0.02em;">${escapeHTML(l.deal.title)}</div>
                      <div class="tiny muted" style="margin-top:4px;">Mode: <strong>${l.mode === "delivery" ? "Delivery" : "Pickup"}</strong></div>
                      <div class="tiny muted">Price: <strong>${money(l.deal.price)}</strong> (was ${money(l.deal.originalValue)})</div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px;">
                      <button class="btn btn--ghost" type="button" data-qtyminus="${escapeHTML(l.deal.id)}">−</button>
                      <strong>${l.qty}</strong>
                      <button class="btn btn--ghost" type="button" data-qtyplus="${escapeHTML(l.deal.id)}">+</button>
                    </div>
                  </div>
                </div>
              `
            )
            .join("")}

          <div class="card">
            <div class="card__pad">
              <div style="display:flex; justify-content:space-between; gap:12px;">
                <span class="muted">Subtotal</span><strong>${money(subtotal)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; gap:12px; margin-top:6px;">
                <span class="muted">Estimated value</span><span class="muted">${money(original)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; gap:12px; margin-top:6px;">
                <span class="muted">Estimated savings</span><strong>${money(savings)}</strong>
              </div>

              <hr class="hr" />

              <div class="grid" style="gap:10px;">
                <div class="tiny muted"><strong>Your estimated impact (this checkout)</strong></div>
                <div class="grid grid--4" style="gap:10px;">
                  <div class="badge badge--lime">🍽️ ${impact.meals} meals</div>
                  <div class="badge">🥕 ${round1(impact.kgFood)} kg food</div>
                  <div class="badge">🌿 ${round1(impact.kgCO2e)} kg CO₂e</div>
                  <div class="badge badge--orange">🎗️ ${money(impact.donated)} donation</div>
                </div>
                <div class="tiny muted">Donation estimate = 5% of assumed gross profit (demo).</div>
              </div>
            </div>
          </div>
        </div>
      `
      : `<p class="muted">Your cart is empty. Add a deal from <a href="./browse-deals.html">Browse Deals</a>.</p>`;

    openModal({
      title: "Cart (demo checkout)",
      bodyHTML,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-close="1">Close</button>
        <button class="btn btn--primary" type="button" id="checkoutBtn" ${lines.length ? "" : "disabled"}>Checkout (demo)</button>
      `,
      onMount: (root) => {
        root.querySelectorAll("[data-qtyminus]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-qtyminus");
            const cart = getCart();
            const idx = cart.findIndex((x) => x.id === id);
            if (idx >= 0) {
              cart[idx].qty = Math.max(0, cart[idx].qty - 1);
              if (cart[idx].qty === 0) cart.splice(idx, 1);
              setCart(cart);
              closeModal();
              openCartModal();
            }
          });
        });

        root.querySelectorAll("[data-qtyplus]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-qtyplus");
            const cart = getCart();
            const idx = cart.findIndex((x) => x.id === id);
            if (idx >= 0) {
              cart[idx].qty += 1;
              setCart(cart);
              closeModal();
              openCartModal();
            }
          });
        });

        const checkoutBtn = root.querySelector("#checkoutBtn");
        if (checkoutBtn) {
          checkoutBtn.addEventListener("click", () => {
            const linesNow = cartLines(getCart());
            if (!linesNow.length) return;

            const totalsNow = cartTotals(getCart());
            const impactNow = computeImpactForCheckout(linesNow.map((l) => ({ qty: l.qty, mode: l.mode })));

            const order = {
              id: "ord_" + Date.now(),
              ts: Date.now(),
              lines: linesNow.map((l) => ({ id: l.deal.id, qty: l.qty, mode: l.mode })),
              subtotal: totalsNow.subtotal,
              original: totalsNow.original,
              savings: totalsNow.savings,
              impact: impactNow
            };

            const orders = readJSON(LS.orders, []);
            orders.unshift(order);
            writeJSON(LS.orders, orders.slice(0, 30));

            const ui = getUserImpact();
            const next = {
              meals: ui.meals + impactNow.meals,
              kgFood: ui.kgFood + impactNow.kgFood,
              kgCO2e: ui.kgCO2e + impactNow.kgCO2e,
              donated: ui.donated + impactNow.donated,
              savings: ui.savings + totalsNow.savings
            };
            setUserImpact(next);

            setCart([]);
            closeModal();
            toast("Checkout complete (demo): +" + impactNow.meals + " meals rescued");

            if (document.body.getAttribute("data-page") === "impact") initImpactPage();
            if (document.body.getAttribute("data-page") === "home") initHomePage();
          });
        }
      }
    });
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
    if (diff <= 0) return { text: "Ended", severity: "muted" };
    const mins = Math.round(diff / 60000);
    if (mins <= 120) return { text: "Ends in " + mins + "m", severity: "orange" };
    const time = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return { text: "Ends " + time, severity: "muted" };
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
      : `<span class="badge">🏃 Pickup only</span>`;

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
            <button class="btn btn--primary btn--block" type="button" data-reserve="${escapeHTML(deal.id)}">
              Reserve (demo)
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function openReserveModal(dealId) {
    const deal = D.DEALS.find((x) => x.id === dealId);
    if (!deal) return;

    const off = pctOff(deal);

    openModal({
      title: "Reserve (demo)",
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
                  Impact estimate per meal: ${D.IMPACT.kgFoodPerMeal} kg food saved • ${D.IMPACT.kgCO2ePerMeal} kg CO₂e avoided (demo).
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

          const cart = getCart();
          const existing = cart.find((x) => x.id === deal.id && x.mode === mode);
          if (existing) existing.qty += qty;
          else cart.push({ id: deal.id, mode, qty });

          setCart(cart);
          closeModal();
          toast("Added to cart: " + deal.title);
        });
      }
    });
  }

  function initDealsPage() {
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

    const tagOptions = ["All tags", "Pickup", "Delivery", "Vegetarian", "Nut-free", "Limited", "Best value"];
    tagEl.innerHTML = tagOptions
      .map((t, i) => `<option value="${i === 0 ? "all" : escapeHTML(t)}">${escapeHTML(t)}</option>`)
      .join("");

    const sortOptions = [
      { v: "recommended", t: "Recommended" },
      { v: "bestValue", t: "Best value" },
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
        if (t === "delivery") return deal.deliveryAvailable;
        if (t === "pickup") return true;
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
    const form = document.getElementById("areaForm");
    const postal = document.getElementById("postal");
    const clear = document.getElementById("clearPostal");
    const hint = document.getElementById("pilotHint");

    const profile = readJSON(LS.profile, { postal: "" });
    if (postal && profile.postal) postal.value = profile.postal;

    if (hint) hint.textContent = "Prototype pilot logic: treats prefixes " + D.PILOT_PREFIXES.join(", ") + " as “in pilot”.";

    const ui = getUserImpact();
    const c = D.IMPACT.communityBase;
    const combined = {
      meals: c.meals + ui.meals,
      kgFood: c.kgFood + ui.kgFood,
      kgCO2e: c.kgCO2e + ui.kgCO2e,
      donated: c.donated + ui.donated,
      savings: c.savings + ui.savings
    };

    const row1 = document.getElementById("homeImpactRow1");
    const row2 = document.getElementById("homeImpactRow2");
    if (row1) {
      row1.innerHTML = `
        <div class="badge badge--lime">🍽️ ${combined.meals.toLocaleString()} meals</div>
        <div class="badge">🥕 ${Math.round(combined.kgFood).toLocaleString()} kg food</div>
        <div class="badge">🌿 ${Math.round(combined.kgCO2e).toLocaleString()} kg CO₂e</div>
      `;
    }
    if (row2) {
      row2.innerHTML = `
        <div class="badge badge--orange">🎗️ ${money(combined.donated)} donated</div>
        <div class="badge">💸 ${money(combined.savings)} saved</div>
        <div class="badge">📍 Pilot: ${profile.postal ? escapeHTML(profile.postal.toUpperCase()) : "not set"}</div>
      `;
    }

    if (form && postal) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = (postal.value || "").trim().toUpperCase();
        writeJSON(LS.profile, { postal: val });

        const prefix = val.replace(/\s+/g, "").slice(0, 2);
        const ok = D.PILOT_PREFIXES.includes(prefix);

        toast(ok ? "You're in our pilot zone (demo): " + val : "Not in pilot yet (demo): " + val + " — join the beta list.");
        initHomePage();
      });
    }

    if (clear) {
      clear.addEventListener("click", () => {
        writeJSON(LS.profile, { postal: "" });
        if (postal) postal.value = "";
        toast("Pilot location cleared.");
        initHomePage();
      });
    }

    const waitlistForm = document.getElementById("waitlistForm");
    const waitlistMsg = document.getElementById("waitlistMsg");
    const email = document.getElementById("email");
    if (waitlistForm && waitlistMsg && email) {
      waitlistForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const em = email.value.trim();
        waitlistMsg.textContent = em ? "Thanks — added (demo): " + em : "Please enter an email.";
        toast("Joined beta list (demo).");
        waitlistForm.reset();
      });
    }
  }

  function openPartnerModal() {
    openModal({
      title: "Become a partner",
      bodyHTML: `
        <p class="muted">Partnership interest form (prototype).</p>
        <form id="partnerForm" class="grid" style="gap:10px;">
          <div class="field">
            <label for="biz">Business name</label>
            <input id="biz" placeholder="e.g., SanRemo Bakery" required />
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
            <input id="notes" placeholder="Surplus types, closing time, location…" />
          </div>
          <div class="tiny muted">Demo only. Wire to a backend or Google Form when launching.</div>
        </form>
      `,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-close="1">Cancel</button>
        <button class="btn btn--primary" type="button" id="partnerSubmit">Submit (demo)</button>
      `,
      onMount: (root) => {
        root.querySelector("#partnerSubmit").addEventListener("click", () => {
          const form = root.querySelector("#partnerForm");
          if (!form.reportValidity()) return;
          closeModal();
          toast("Submitted (demo).");
        });
      }
    });
  }

  function initMissionPage() {
    const badges = document.getElementById("partnerBadges");
    if (badges) {
      badges.innerHTML = D.PARTNERS.map((p) => `<div class="badge">${escapeHTML(p)}</div>`).join("");
    }
    const cta = document.getElementById("partnerCta");
    if (cta) cta.addEventListener("click", openPartnerModal);
  }

  function initImpactPage() {
    const ui = getUserImpact();
    const c = D.IMPACT.communityBase;

    const combined = {
      meals: c.meals + ui.meals,
      kgFood: c.kgFood + ui.kgFood,
      kgCO2e: c.kgCO2e + ui.kgCO2e,
      donated: c.donated + ui.donated,
      savings: c.savings + ui.savings
    };

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

    const c1 = document.getElementById("communityRow1");
    const c2 = document.getElementById("communityRow2");
    if (c1) {
      c1.innerHTML = `
        <div class="badge badge--lime">🍽️ ${combined.meals.toLocaleString()} meals</div>
        <div class="badge">🥕 ${Math.round(combined.kgFood).toLocaleString()} kg</div>
        <div class="badge">🌿 ${Math.round(combined.kgCO2e).toLocaleString()} kg CO₂e</div>
      `;
    }
    if (c2) {
      c2.innerHTML = `
        <div class="badge badge--orange">🎗️ ${money(combined.donated)} donated</div>
        <div class="badge">💸 ${money(combined.savings)} saved</div>
        <div class="badge">🏷️ Deals: ${D.DEALS.length}</div>
      `;
    }

    const recent = document.getElementById("recentOrders");
    if (recent) {
      const rows = orders.slice(0, 10).map((o) => {
        const d = new Date(o.ts);
        const when = d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

        const title = o.lines
          .map((l) => {
            const deal = D.DEALS.find((x) => x.id === l.id);
            return deal ? `${l.qty}× ${deal.title}` : `${l.qty}× (unknown)`;
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
                <div class="badge">🧾 ${money(o.subtotal)} paid</div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      recent.innerHTML = rows || `<div class="card"><div class="card__pad"><p class="muted">No checkouts yet. Add deals to cart and run a demo checkout.</p></div></div>`;
    }

    const reset = document.getElementById("resetImpact");
    if (reset) {
      reset.addEventListener("click", () => {
        localStorage.removeItem(LS.orders);
        localStorage.removeItem(LS.impact);
        localStorage.removeItem(LS.cart);
        renderCartCount();
        toast("Reset complete.");
        initImpactPage();
      });
    }
  }

  function initFooterLinks() {
    const contact = document.getElementById("contactLink");
    if (contact) {
      contact.addEventListener("click", (e) => {
        e.preventDefault();
        openModal({
          title: "Contact",
          bodyHTML: `
            <p class="muted">Prototype contact (demo).</p>
            <p><strong>Email:</strong> hello@lastbite.example</p>
            <p class="tiny muted">Replace with a real inbox when launching.</p>
          `,
          footerHTML: `<button class="btn btn--primary" type="button" data-close="1">Done</button>`
        });
      });
    }

    const partner = document.getElementById("partnerLink");
    if (partner) {
      partner.addEventListener("click", (e) => {
        e.preventDefault();
        openPartnerModal();
      });
    }
  }

  function initCommon() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    setActiveNav();
    initMobileMenu();
    initFooterLinks();

    const cartBtn = document.getElementById("cartBtn");
    if (cartBtn) cartBtn.addEventListener("click", openCartModal);

    renderCartCount();
  }

  function initPage() {
    const page = document.body.getAttribute("data-page");
    if (page === "home") initHomePage();
    if (page === "deals") initDealsPage();
    if (page === "mission") initMissionPage();
    if (page === "impact") initImpactPage();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCommon();
    initPage();
  });
})();
