import { DEALS, PARTNERS, CATEGORIES, IMPACT, PILOT_PREFIXES } from './data.js';

/* -----------------------------
   Storage helpers
----------------------------- */
const LS = {
  cart: 'lastbite_cart_v1',
  orders: 'lastbite_orders_v1',
  profile: 'lastbite_profile_v1',
  impact: 'lastbite_user_impact_v1'
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
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(n);
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

/* -----------------------------
   Basic UI primitives
----------------------------- */
const app = document.getElementById('app');
const modalRoot = document.getElementById('modalRoot');
const toastRoot = document.getElementById('toastRoot');

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

function openModal({ title, bodyHTML, footerHTML, onMount }) {
  modalRoot.hidden = false;
  modalRoot.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
      <div class="modal__head">
        <strong>${escapeHTML(title)}</strong>
        <button class="btn btn--ghost" type="button" data-close="1" aria-label="Close">✕</button>
      </div>
      <div class="modal__body">${bodyHTML}</div>
      <div class="modal__foot">${footerHTML ?? ''}</div>
    </div>
  `;
  const close = () => closeModal();
  modalRoot.querySelector('[data-close]')?.addEventListener('click', close);

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  const onClickAway = (e) => {
    const modal = modalRoot.querySelector('.modal');
    if (modal && !modal.contains(e.target)) close();
  };

  document.addEventListener('keydown', onKey);
  modalRoot.addEventListener('click', onClickAway);

  const cleanup = () => {
    document.removeEventListener('keydown', onKey);
    modalRoot.removeEventListener('click', onClickAway);
  };

  modalRoot.dataset.cleanup = '1';
  modalRoot._cleanup = cleanup;

  onMount?.(modalRoot);
}

function closeModal() {
  if (modalRoot._cleanup) modalRoot._cleanup();
  modalRoot.hidden = true;
  modalRoot.innerHTML = '';
  modalRoot._cleanup = null;
}

function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* -----------------------------
   Header: active links, mobile menu, cart button
----------------------------- */
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');

function setActive(route) {
  const links = document.querySelectorAll('a[data-route]');
  links.forEach((a) => {
    const is = a.dataset.route === route;
    if (is) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });
}

function openMobileNav() {
  mobileNav.hidden = false;
  navToggle.setAttribute('aria-expanded', 'true');
}
function closeMobileNav() {
  mobileNav.hidden = true;
  navToggle.setAttribute('aria-expanded', 'false');
}
function toggleMobileNav() {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  expanded ? closeMobileNav() : openMobileNav();
}

navToggle?.addEventListener('click', toggleMobileNav);
mobileNav?.addEventListener('click', (e) => {
  if (e.target.matches('a')) closeMobileNav();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileNav();
});
document.addEventListener('click', (e) => {
  const header = document.querySelector('.header');
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  if (!expanded) return;
  if (header && !header.contains(e.target)) closeMobileNav();
});

/* Footer quick links */
document.getElementById('contactLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  openModal({
    title: 'Contact',
    bodyHTML: `
      <p class="muted">Prototype contact (demo).</p>
      <p><strong>Email:</strong> hello@lastbite.example</p>
      <p class="tiny muted">Replace with a real inbox when launching.</p>
    `,
    footerHTML: `<button class="btn btn--primary" type="button" data-close="1">Done</button>`
  });
});
document.getElementById('partnerLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  openPartnerModal();
});

/* -----------------------------
   Cart + impact
----------------------------- */
function getCart() {
  return readJSON(LS.cart, []);
}
function setCart(cart) {
  writeJSON(LS.cart, cart);
  renderCartCount();
}
function renderCartCount() {
  const cart = getCart();
  const n = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
  cartCount.textContent = String(n);
}
renderCartCount();

function getUserImpact() {
  return readJSON(LS.impact, { meals: 0, kgFood: 0, kgCO2e: 0, donated: 0, savings: 0 });
}
function setUserImpact(v) {
  writeJSON(LS.impact, v);
}

function computeImpactForCheckout(cartItems) {
  const meals = cartItems.reduce((s, it) => s + it.qty, 0);
  const kgFood = meals * IMPACT.kgFoodPerMeal;
  const kgCO2e = meals * IMPACT.kgCO2ePerMeal;

  const grossProfit = cartItems.reduce((s, it) => {
    const per = it.mode === 'delivery' ? IMPACT.grossProfitDelivery : IMPACT.grossProfitPickup;
    return s + per * it.qty;
  }, 0);

  const donated = grossProfit * IMPACT.donationRate;

  return { meals, kgFood, kgCO2e, donated, grossProfit };
}

function cartLines(cart) {
  return cart
    .map((it) => {
      const deal = DEALS.find((d) => d.id === it.id);
      return { ...it, deal };
    })
    .filter((x) => x.deal);
}

function cartTotals(cart) {
  const lines = cartLines(cart);
  const subtotal = lines.reduce((s, l) => s + l.deal.price * l.qty, 0);
  const original = lines.reduce((s, l) => s + l.deal.originalValue * l.qty, 0);
  const savings = Math.max(0, original - subtotal);
  return { lines, subtotal, original, savings };
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
                <div class="tiny muted" style="margin-top:4px;">Mode: <strong>${l.mode === 'delivery' ? 'Delivery' : 'Pickup'}</strong></div>
                <div class="tiny muted">Price: <strong>${money(l.deal.price)}</strong> (was ${money(l.deal.originalValue)})</div>
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <button class="btn btn--ghost" type="button" data-qtyminus="${escapeHTML(l.deal.id)}">−</button>
                <strong aria-label="Quantity">${l.qty}</strong>
                <button class="btn btn--ghost" type="button" data-qtyplus="${escapeHTML(l.deal.id)}">+</button>
              </div>
            </div>
          </div>
        `
          )
          .join('')}

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
              <div class="tiny muted">
                Donation estimate = 5% of assumed gross profit (demo). Replace with real unit economics when launching.
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    : `<p class="muted">Your cart is empty. Add a deal from <a href="#/deals">Browse Deals</a>.</p>`;

  openModal({
    title: 'Cart (demo checkout)',
    bodyHTML,
    footerHTML: `
      <button class="btn btn--ghost" type="button" data-close="1">Close</button>
      <button class="btn btn--primary" type="button" id="checkoutBtn" ${lines.length ? '' : 'disabled'}>Checkout (demo)</button>
    `,
    onMount: (root) => {
      root.querySelectorAll('[data-qtyminus]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-qtyminus');
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
      root.querySelectorAll('[data-qtyplus]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-qtyplus');
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

      root.querySelector('#checkoutBtn')?.addEventListener('click', () => {
        if (!lines.length) return;

        // Save order
        const order = {
          id: `ord_${Date.now()}`,
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

        // Add to user impact totals
        const ui = getUserImpact();
        const next = {
          meals: ui.meals + impact.meals,
          kgFood: ui.kgFood + impact.kgFood,
          kgCO2e: ui.kgCO2e + impact.kgCO2e,
          donated: ui.donated + impact.donated,
          savings: ui.savings + savings
        };
        setUserImpact(next);

        // Clear cart
        setCart([]);
        closeModal();
        toast(`Checkout complete (demo): +${impact.meals} meals rescued`);

        renderRoute();
      });
    }
  });
}

cartBtn?.addEventListener('click', openCartModal);

/* -----------------------------
   Browse Deals
----------------------------- */
function pctOff(deal) {
  return Math.round((1 - deal.price / deal.originalValue) * 100);
}

function parseEndTimeToday(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
}

function endsLabel(windowEnd) {
  const end = parseEndTimeToday(windowEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return { text: 'Ended', severity: 'muted' };
  const mins = Math.round(diff / 60000);
  if (mins <= 120) return { text: `Ends in ${mins}m`, severity: 'orange' };
  const time = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return { text: `Ends ${time}`, severity: 'muted' };
}

function buildDealCard(deal) {
  const off = pctOff(deal);
  const tags = [...deal.tags, ...(deal.dietary ?? [])];

  const end = endsLabel(deal.windowEnd);
  const endBadge =
    end.severity === 'orange'
      ? `<span class="badge badge--orange">⏳ ${escapeHTML(end.text)}</span>`
      : `<span class="badge">⏰ ${escapeHTML(end.text)}</span>`;

  const deliveryBadge = deal.deliveryAvailable
    ? `<span class="badge badge--lime">🚚 Delivery</span>`
    : `<span class="badge">🏃 Pickup only</span>`;

  return `
    <article class="card dealCard" data-deal-id="${escapeHTML(deal.id)}">
      <div class="dealCard__top">
        <div class="dealIcon" aria-hidden="true">${escapeHTML(deal.emoji || '🍽️')}</div>
        <div class="badgeRow" aria-label="Deal badges">
          <span class="badge badge--orange">-${off}%</span>
          ${deliveryBadge}
          ${endBadge}
        </div>
      </div>

      <div class="dealCard__body">
        <p class="tiny muted" style="margin:0;">${escapeHTML(deal.partner)} • ${escapeHTML(deal.category)} • ${deal.distanceKm.toFixed(1)} km</p>
        <h3 class="dealTitle">${escapeHTML(deal.title)}</h3>
        <p class="dealMeta">${escapeHTML(deal.window)} • ${escapeHTML(deal.description)}</p>

        <div class="priceRow" aria-label="Pricing">
          <div class="priceNow">${money(deal.price)}</div>
          <div class="priceWas">${money(deal.originalValue)}</div>
        </div>

        <div class="tags" aria-label="Tags">
          ${tags.map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
        </div>

        <div class="dealActions">
          <button class="btn btn--primary btn--block" type="button" data-add="${escapeHTML(deal.id)}">
            Reserve (demo)
          </button>
        </div>
      </div>
    </article>
  `;
}

function openReserveModal(dealId) {
  const deal = DEALS.find((d) => d.id === dealId);
  if (!deal) return;

  const off = pctOff(deal);

  const bodyHTML = `
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
                ${deal.deliveryAvailable ? `<option value="delivery">Delivery</option>` : ''}
              </select>
            </div>

            <div class="field">
              <label for="qtySelect">Quantity</label>
              <select id="qtySelect">
                ${[1,2,3,4,5].map((n) => `<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>

            <div class="tiny muted">
              Impact estimate per meal: ${IMPACT.kgFoodPerMeal} kg food saved • ${IMPACT.kgCO2ePerMeal} kg CO₂e avoided (demo).
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  openModal({
    title: 'Reserve (demo)',
    bodyHTML,
    footerHTML: `
      <button class="btn btn--ghost" type="button" data-close="1">Cancel</button>
      <button class="btn btn--primary" type="button" id="addToCartBtn">Add to cart</button>
    `,
    onMount: (root) => {
      const modeSelect = root.querySelector('#modeSelect');
      const qtySelect = root.querySelector('#qtySelect');

      if (!deal.deliveryAvailable) {
        modeSelect.value = 'pickup';
        modeSelect.disabled = true;
      }

      root.querySelector('#addToCartBtn')?.addEventListener('click', () => {
        const mode = modeSelect.value;
        const qty = Number(qtySelect.value);

        const cart = getCart();
        const existing = cart.find((x) => x.id === deal.id && x.mode === mode);
        if (existing) existing.qty += qty;
        else cart.push({ id: deal.id, mode, qty });

        setCart(cart);
        closeModal();
        toast(`Added to cart: ${deal.title}`);
      });
    }
  });
}

function renderDealsView() {
  const partnerOptions = ['All partners', ...PARTNERS];
  const tagOptions = ['All tags', 'Pickup', 'Delivery', 'Vegetarian', 'Nut-free', 'Limited', 'Best value'];
  const sortOptions = [
    { v: 'recommended', t: 'Recommended' },
    { v: 'bestValue', t: 'Best value' },
    { v: 'endingSoon', t: 'Ending soon' },
    { v: 'nearest', t: 'Nearest' },
    { v: 'lowestPrice', t: 'Lowest price' }
  ];

  const chips = ['All', ...CATEGORIES];

  const html = `
    <div class="container">
      <div class="card hero">
        <div class="hero__inner">
          <div class="hero__kicker">Browse end-of-day deals • Prototype listings</div>
          <h1 class="h2" style="margin-top:10px;">Surplus-only marketplace. Big guaranteed discounts.</h1>
          <p class="muted" style="margin:6px 0 0;">
            These are sample deals for a prototype. Not affiliated with the businesses listed.
          </p>

          <div class="hero__stats">
            <span class="statPill">💸 Typical discount <b>40–70%</b></span>
            <span class="statPill">🕗 Orders cluster at <b>closing time</b></span>
            <span class="statPill">🎗️ <b>5%</b> of profits donated</span>
          </div>
        </div>
      </div>

      <section class="section">
        <div class="section__head">
          <div>
            <h2 class="h2">Browse Deals</h2>
            <p class="muted" style="margin:0;">Filter by category, partner, and tags. Sort by value or pickup window.</p>
          </div>
        </div>

        <div class="toolbar">
          <div class="chips" id="categoryChips" aria-label="Category chips">
            ${chips.map((c, i) => `
              <button class="chip ${i===0?'isOn':''}" type="button" data-chip="${escapeHTML(c)}">${escapeHTML(c)}</button>
            `).join('')}
          </div>

          <div class="toolbar__grid" style="margin-top:12px;">
            <div class="field">
              <label for="q">Search</label>
              <input id="q" placeholder="e.g., bagels, croissants, cheesecake" />
            </div>

            <div class="field">
              <label for="partner">Partner</label>
              <select id="partner">
                ${partnerOptions.map((p, i) => `<option value="${i===0?'all':escapeHTML(p)}">${escapeHTML(p)}</option>`).join('')}
              </select>
            </div>

            <div class="field">
              <label for="tag">Tag</label>
              <select id="tag">
                ${tagOptions.map((t, i) => `<option value="${i===0?'all':escapeHTML(t)}">${escapeHTML(t)}</option>`).join('')}
              </select>
            </div>

            <div class="field">
              <label for="sort">Sort</label>
              <select id="sort">
                ${sortOptions.map((o) => `<option value="${o.v}">${o.t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="resultsBar">
            <div class="muted" id="resultsCount">Showing deals…</div>
            <div class="tiny muted">Tip: deals refresh near closing time.</div>
          </div>
        </div>

        <div class="section">
          <div class="dealsGrid" id="dealsGrid"></div>
          <div id="emptyState" class="card" style="display:none; margin-top:16px;">
            <div class="card__pad">
              <strong>No deals match your filters.</strong>
              <p class="muted" style="margin:6px 0 0;">Try clearing tags or switching categories.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  app.innerHTML = html;

  const state = { category: 'All', q: '', partner: 'all', tag: 'all', sort: 'recommended' };
  const grid = document.getElementById('dealsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');

  function normalize(s) { return String(s).toLowerCase(); }

  function matches(deal) {
    const catOk = state.category === 'All' ? true : deal.category === state.category;
    const pOk = state.partner === 'all' ? true : normalize(deal.partner) === normalize(state.partner);
    const qOk = !state.q
      ? true
      : [deal.title, deal.partner, deal.description, deal.category].some((x) => normalize(x).includes(normalize(state.q)));

    const tagOk = (() => {
      if (state.tag === 'all') return true;
      const t = normalize(state.tag);
      if (t === 'delivery') return deal.deliveryAvailable;
      if (t === 'pickup') return true;
      const bucket = new Set([ ...deal.tags.map(normalize), ...(deal.dietary ?? []).map(normalize) ]);
      return bucket.has(t);
    })();

    return catOk && pOk && qOk && tagOk;
  }

  function sortDeals(arr) {
    const copy = [...arr];
    if (state.sort === 'bestValue') copy.sort((a, b) => (pctOff(b) - pctOff(a)));
    else if (state.sort === 'endingSoon') copy.sort((a, b) => parseEndTimeToday(a.windowEnd) - parseEndTimeToday(b.windowEnd));
    else if (state.sort === 'nearest') copy.sort((a, b) => a.distanceKm - b.distanceKm);
    else if (state.sort === 'lowestPrice') copy.sort((a, b) => a.price - b.price);
    else copy.sort((a, b) => (pctOff(b) - pctOff(a)) || (a.distanceKm - b.distanceKm));
    return copy;
  }

  function render() {
    const filtered = DEALS.filter(matches);
    const sorted = sortDeals(filtered);

    grid.innerHTML = sorted.map(buildDealCard).join('');
    resultsCount.textContent = `Showing ${sorted.length} deal${sorted.length === 1 ? '' : 's'}.`;
    emptyState.style.display = sorted.length ? 'none' : 'block';

    grid.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => openReserveModal(btn.getAttribute('data-add')));
    });
  }

  document.getElementById('categoryChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-chip]');
    if (!btn) return;
    const val = btn.getAttribute('data-chip');
    state.category = val;
    document.querySelectorAll('button[data-chip]').forEach((b) => {
      b.classList.toggle('isOn', b.getAttribute('data-chip') === val);
    });
    render();
  });

  document.getElementById('q')?.addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
  document.getElementById('partner')?.addEventListener('change', (e) => { state.partner = e.target.value; render(); });
  document.getElementById('tag')?.addEventListener('change', (e) => { state.tag = e.target.value; render(); });
  document.getElementById('sort')?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });

  const t = setInterval(render, 60000);
  window.addEventListener('hashchange', () => clearInterval(t), { once: true });

  render();
}

/* -----------------------------
   Home
----------------------------- */
function renderHomeView() {
  const profile = readJSON(LS.profile, { postal: '' });
  const community = IMPACT.communityBase;
  const ui = getUserImpact();

  const combined = {
    meals: community.meals + ui.meals,
    kgFood: community.kgFood + ui.kgFood,
    kgCO2e: community.kgCO2e + ui.kgCO2e,
    donated: community.donated + ui.donated,
    savings: community.savings + ui.savings
  };

  app.innerHTML = `
    <div class="container">
      <div class="card hero">
        <div class="hero__inner">
          <div class="hero__kicker">End-of-day discounted food platform</div>
          <h1 class="h1">Big discounts on surplus food.<br/>Real impact, built in.</h1>
          <p class="muted" style="margin:0; max-width: 66ch;">
            Restaurants and shops list end-of-day surplus near closing. You buy at a large discount for pickup or delivery.
            Every purchase helps reduce waste — and <strong>5% of profits</strong> are donated to the UN World Food Programme (WFP).
          </p>

          <div class="hero__cta">
            <a class="btn btn--primary" href="#/deals">Browse demo deals</a>
            <a class="btn btn--ghost" href="#/how">How it works</a>
          </div>

          <div class="hero__stats">
            <span class="statPill">💸 Typical discount <b>40–70%</b></span>
            <span class="statPill">🌿 Fight waste with <b>every order</b></span>
            <span class="statPill">🎗️ Donate <b>5%</b> of profits</span>
          </div>
        </div>
      </div>

      <section class="section grid grid--2">
        <div class="card">
          <div class="card__pad">
            <h2 class="h2">Check if your area is in the pilot (demo)</h2>
            <p class="muted" style="margin:0;">We launch neighborhood-by-neighborhood so pickup windows stay tight and discounts stay high.</p>

            <div class="section" style="margin-top:14px;">
              <form id="areaForm" class="grid" style="gap:10px; max-width:520px;">
                <div class="field">
                  <label for="postal">Postal code</label>
                  <input id="postal" placeholder="e.g., M5V 2T6" value="${escapeHTML(profile.postal || '')}" />
                </div>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                  <button class="btn btn--primary" type="submit">Check my area</button>
                  <button class="btn btn--ghost" type="button" id="clearPostal">Clear</button>
                </div>
              </form>
              <p class="tiny muted" style="margin-top:10px;">Prototype pilot logic: treats prefixes ${PILOT_PREFIXES.join(', ')} as “in pilot”.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__pad">
            <h2 class="h2">Impact totals (demo)</h2>
            <p class="muted" style="margin:0;">Community baseline + your local demo actions.</p>

            <div class="grid grid--3" style="margin-top:12px; gap:10px;">
              <div class="badge badge--lime">🍽️ ${combined.meals.toLocaleString()} meals</div>
              <div class="badge">🥕 ${Math.round(combined.kgFood).toLocaleString()} kg food</div>
              <div class="badge">🌿 ${Math.round(combined.kgCO2e).toLocaleString()} kg CO₂e</div>
            </div>

            <div class="grid grid--3" style="margin-top:10px; gap:10px;">
              <div class="badge badge--orange">🎗️ ${money(combined.donated)} donated</div>
              <div class="badge">💸 ${money(combined.savings)} saved</div>
              <div class="badge">📍 Pilot: ${profile.postal ? escapeHTML(profile.postal.toUpperCase()) : 'not set'}</div>
            </div>

            <div class="section" style="margin-top:14px;">
              <a class="btn btn--ghost" href="#/impact">Open Impact Tracker</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="card">
          <div class="card__pad">
            <div class="section__head" style="margin-bottom:0;">
              <div>
                <h2 class="h2">Join the beta list (demo)</h2>
                <p class="muted" style="margin:0;">Get launch updates and early access.</p>
              </div>
            </div>

            <form id="waitlistForm" class="grid" style="gap:10px; margin-top:12px; max-width:680px;">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" placeholder="you@example.com" required />
              </div>
              <button class="btn btn--primary" type="submit">Join beta</button>
              <div id="waitlistMsg" class="tiny muted" role="status"></div>
            </form>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById('areaForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const postal = (document.getElementById('postal').value || '').trim().toUpperCase();
    writeJSON(LS.profile, { postal });

    const prefix = postal.replace(/\s+/g, '').slice(0, 2);
    const ok = PILOT_PREFIXES.includes(prefix);

    toast(ok ? `You're in our pilot zone (demo): ${postal}` : `Not in pilot yet (demo): ${postal} — join the beta list.`);
    renderRoute();
  });

  document.getElementById('clearPostal')?.addEventListener('click', () => {
    writeJSON(LS.profile, { postal: '' });
    toast('Pilot location cleared.');
    renderRoute();
  });

  document.getElementById('waitlistForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const msg = document.getElementById('waitlistMsg');
    msg.textContent = email ? `Thanks — added (demo): ${email}` : 'Please enter an email.';
    toast('Joined beta list (demo).');
    e.target.reset();
  });
}

/* -----------------------------
   How It Works
----------------------------- */
function renderHowView() {
  app.innerHTML = `
    <div class="container">
      <div class="card hero">
        <div class="hero__inner">
          <div class="hero__kicker">How It Works</div>
          <h1 class="h2" style="margin-top:10px;">A surplus-only flow built for closing time.</h1>
          <p class="muted" style="margin:0; max-width: 70ch;">
            Partners list surplus near closing. Customers reserve through LastBite. Orders cluster when kitchens and drivers are less busy — keeping fees lower.
          </p>
        </div>
      </div>

      <section class="section grid grid--3">
        <div class="card"><div class="card__pad">
          <div class="h3">1) Partners list surplus</div>
          <p class="muted" style="margin:0;">Restaurants, cafés and grocery shops post end-of-day items at <strong>40–70% off</strong>.</p>
        </div></div>

        <div class="card"><div class="card__pad">
          <div class="h3">2) You reserve in-app</div>
          <p class="muted" style="margin:0;">Browse by category, location, dietary needs. Pay in-app and pick up during a timed window (or delivery where offered).</p>
        </div></div>

        <div class="card"><div class="card__pad">
          <div class="h3">3) Track impact</div>
          <p class="muted" style="margin:0;">See estimated meals rescued, food saved, CO₂ avoided — plus a running total of your savings.</p>
        </div></div>
      </section>

      <section class="section grid grid--2">
        <div class="card"><div class="card__pad">
          <h2 class="h2">Pricing (prototype)</h2>
          <p class="muted" style="margin:0;">Typical discount range: <strong>40–70% off</strong> the original menu value.</p>
          <div class="section" style="margin-top:12px;">
            <div class="badge">Pickup: higher margin (no delivery cost)</div>
            <div class="badge" style="margin-top:8px;">Delivery: available for select partners</div>
          </div>
          <p class="tiny muted" style="margin-top:12px;">
            This demo uses your business report assumptions for illustrative impact/donation estimates.
          </p>
        </div></div>

        <div class="card"><div class="card__pad">
          <h2 class="h2">FAQ (prototype)</h2>
          <details>
            <summary><strong>Are these items safe?</strong></summary>
            <p class="muted">Partners only list items that are unsold but still good to eat. Always follow partner handling and allergy notes.</p>
          </details>
          <details>
            <summary><strong>What if I miss the pickup window?</strong></summary>
            <p class="muted">Pickup windows are short to match closing time. In a real launch, missed windows may be non-refundable.</p>
          </details>
          <details>
            <summary><strong>Allergens and dietary filters?</strong></summary>
            <p class="muted">Deals can include dietary tags. Always verify ingredients directly with the partner.</p>
          </details>
          <details>
            <summary><strong>How is impact calculated?</strong></summary>
            <p class="muted">This prototype uses simple estimates per meal. Replace with a verified methodology at launch.</p>
          </details>
        </div></div>
      </section>

      <section class="section">
        <a class="btn btn--primary" href="#/deals">Browse Deals</a>
      </section>
    </div>
  `;
}

/* -----------------------------
   Mission
----------------------------- */
function openPartnerModal() {
  const bodyHTML = `
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
        <label for="email">Email</label>
        <input id="pemail" type="email" placeholder="you@company.com" required />
      </div>
      <div class="field">
        <label for="notes">Notes</label>
        <input id="notes" placeholder="Surplus types, closing time, location…" />
      </div>
      <div class="tiny muted">This form is demo-only. Wire it to a backend or Google Form when launching.</div>
    </form>
  `;

  openModal({
    title: 'Become a partner',
    bodyHTML,
    footerHTML: `
      <button class="btn btn--ghost" type="button" data-close="1">Cancel</button>
      <button class="btn btn--primary" type="button" id="partnerSubmit">Submit (demo)</button>
    `,
    onMount: (root) => {
      root.querySelector('#partnerSubmit')?.addEventListener('click', () => {
        const form = root.querySelector('#partnerForm');
        if (!form.reportValidity()) return;
        closeModal();
        toast('Submitted (demo).');
      });
    }
  });
}

function renderMissionView() {
  app.innerHTML = `
    <div class="container">
      <div class="card hero">
        <div class="hero__inner">
          <div class="hero__kicker">Our Mission</div>
          <h1 class="h2" style="margin-top:10px;">Turn end-of-day surplus into affordable meals.</h1>
          <p class="muted" style="margin:0; max-width: 70ch;">
            LastBite reduces food waste by helping local businesses sell unsold but perfectly good food at a steep discount.
            Customers save money, merchants earn incremental revenue, and the environment benefits.
          </p>
          <div class="hero__stats">
            <span class="statPill">🎯 Focused: <b>surplus-only</b></span>
            <span class="statPill">💸 Discounts: <b>40–70%</b></span>
            <span class="statPill">🎗️ Donate: <b>5%</b> of profits to WFP</span>
          </div>
        </div>
      </div>

      <section class="section grid grid--2">
        <div class="card"><div class="card__pad">
          <h2 class="h2">What makes us different</h2>
          <ul style="margin:0; padding-left: 18px;">
            <li><strong>Surplus-only:</strong> not a general food delivery app.</li>
            <li><strong>Guaranteed discounts:</strong> typically 40–70% off.</li>
            <li><strong>Off-peak operations:</strong> clustered at closing time, keeping costs lower.</li>
            <li><strong>Impact-driven:</strong> visible food/CO₂ saved in the product.</li>
            <li><strong>Social enterprise:</strong> 5% of profits donated to WFP.</li>
          </ul>
        </div></div>

        <div class="card"><div class="card__pad">
          <h2 class="h2">Future roadmap</h2>
          <ul style="margin:0; padding-left: 18px;">
            <li>Surplus groceries + bakery boxes (breakfast / produce boxes)</li>
            <li>Subscriptions and corporate waste-reduction lunch programs</li>
            <li>Reusable packaging with partner restaurants</li>
            <li>Waste analytics for restaurants (planning + forecasting insights)</li>
          </ul>

          <div class="section" style="margin-top:12px;">
            <button class="btn btn--primary" type="button" id="partnerCta">Become a partner (demo)</button>
          </div>
        </div></div>
      </section>

      <section class="section">
        <div class="card">
          <div class="card__pad">
            <div class="section__head" style="margin-bottom:0;">
              <div>
                <h2 class="h2">Example partners (research list)</h2>
                <p class="muted" style="margin:0;">Target bakeries, cafés and shops to start in a dense pilot neighborhood.</p>
              </div>
            </div>

            <div class="grid grid--4" style="margin-top:12px;">
              ${PARTNERS.map((p) => `<div class="badge">${escapeHTML(p)}</div>`).join('')}
            </div>

            <div class="section" style="margin-top:14px;">
              <a class="btn btn--ghost" href="#/deals">See sample deals</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById('partnerCta')?.addEventListener('click', openPartnerModal);
}

/* -----------------------------
   Impact Tracker
----------------------------- */
function renderImpactView() {
  const ui = getUserImpact();
  const community = IMPACT.communityBase;
  const combined = {
    meals: community.meals + ui.meals,
    kgFood: community.kgFood + ui.kgFood,
    kgCO2e: community.kgCO2e + ui.kgCO2e,
    donated: community.donated + ui.donated,
    savings: community.savings + ui.savings
  };

  const orders = readJSON(LS.orders, []);
  const rows = orders.slice(0, 10).map((o) => {
    const d = new Date(o.ts);
    const when = d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    const title = o.lines
      .map((l) => {
        const deal = DEALS.find((x) => x.id === l.id);
        return deal ? `${l.qty}× ${deal.title}` : `${l.qty}× (unknown)`;
      })
      .join(' • ');

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
  }).join('');

  app.innerHTML = `
    <div class="container">
      <div class="card hero">
        <div class="hero__inner">
          <div class="hero__kicker">Impact Tracker</div>
          <h1 class="h2" style="margin-top:10px;">See what you’ve rescued (demo).</h1>
          <p class="muted" style="margin:0;">
            Your impact updates when you complete a <strong>Checkout (demo)</strong>.
          </p>
        </div>
      </div>

      <section class="section grid grid--2">
        <div class="card"><div class="card__pad">
          <h2 class="h2">Your impact</h2>

          <div class="grid grid--3" style="margin-top:12px; gap:10px;">
            <div class="badge badge--lime">🍽️ ${ui.meals.toLocaleString()} meals</div>
            <div class="badge">🥕 ${Math.round(ui.kgFood).toLocaleString()} kg food</div>
            <div class="badge">🌿 ${Math.round(ui.kgCO2e).toLocaleString()} kg CO₂e</div>
          </div>

          <div class="grid grid--3" style="margin-top:10px; gap:10px;">
            <div class="badge badge--orange">🎗️ ${money(ui.donated)} donated</div>
            <div class="badge">💸 ${money(ui.savings)} saved</div>
            <div class="badge">🧾 Orders: ${orders.length}</div>
          </div>

          <div class="section" style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <a class="btn btn--primary" href="#/deals">Browse deals</a>
            <button class="btn btn--ghost" type="button" id="resetImpact">Reset my demo data</button>
          </div>

          <p class="tiny muted" style="margin-top:12px;">
            “Donated” is an estimate: 5% of assumed gross profit (demo unit economics).
          </p>
        </div></div>

        <div class="card"><div class="card__pad">
          <h2 class="h2">Community totals (demo + you)</h2>
          <p class="muted" style="margin:0;">A baseline demo counter plus your local demo actions.</p>

          <div class="grid grid--3" style="margin-top:12px; gap:10px;">
            <div class="badge badge--lime">🍽️ ${combined.meals.toLocaleString()} meals</div>
            <div class="badge">🥕 ${Math.round(combined.kgFood).toLocaleString()} kg</div>
            <div class="badge">🌿 ${Math.round(combined.kgCO2e).toLocaleString()} kg CO₂e</div>
          </div>

          <div class="grid grid--3" style="margin-top:10px; gap:10px;">
            <div class="badge badge--orange">🎗️ ${money(combined.donated)} donated</div>
            <div class="badge">💸 ${money(combined.savings)} saved</div>
            <div class="badge">🏷️ Deals: ${DEALS.length}</div>
          </div>
        </div></div>
      </section>

      <section class="section">
        <div class="section__head">
          <div>
            <h2 class="h2">Recent checkouts</h2>
            <p class="muted" style="margin:0;">Latest 10 demo orders.</p>
          </div>
        </div>

        ${rows || `<div class="card"><div class="card__pad"><p class="muted">No checkouts yet. Add deals to cart and run a demo checkout.</p></div></div>`}
      </section>
    </div>
  `;

  document.getElementById('resetImpact')?.addEventListener('click', () => {
    localStorage.removeItem(LS.orders);
    localStorage.removeItem(LS.impact);
    localStorage.removeItem(LS.cart);
    renderCartCount();
    toast('Reset complete.');
    renderRoute();
  });
}

/* -----------------------------
   Router
----------------------------- */
function routeFromHash() {
  const raw = (location.hash || '#/home').replace('#', '');
  const path = raw.startsWith('/') ? raw.slice(1) : raw;
  const top = path.split('?')[0].split('/')[0];
  if (top === 'home' || top === '') return 'home';
  if (top === 'deals') return 'deals';
  if (top === 'how') return 'how';
  if (top === 'mission') return 'mission';
  if (top === 'impact') return 'impact';
  return 'home';
}

export function renderRoute() {
  const route = routeFromHash();
  setActive(route);
  closeMobileNav();

  if (route === 'home') renderHomeView();
  else if (route === 'deals') renderDealsView();
  else if (route === 'how') renderHowView();
  else if (route === 'mission') renderMissionView();
  else if (route === 'impact') renderImpactView();
}

window.addEventListener('hashchange', renderRoute);
document.getElementById('year').textContent = String(new Date().getFullYear());
renderRoute();

