/* ============================================
   STITCH - Amazon-Style Shopify Theme
   theme.js - Core JavaScript
   ============================================ */

'use strict';

// ============================================
// UTILITY HELPERS
// ============================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

function formatMoney(cents) {
  const amount = (cents / 100).toFixed(2);
  return `$${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
const Toast = (() => {
  let container = null;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }
  function show(message, type = 'default', duration = 3500) {
    const c = getContainer();
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    el.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icon}</span><span>${message}</span>`;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
  }
  return { show };
})();

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
  const toggle = $('#mobile-menu-toggle');
  const menu = $('#mobile-menu');
  const overlay = $('#mobile-menu-overlay');
  const close = $('.mobile-menu-close');

  function openMenu() {
    menu && menu.classList.remove('hidden');
    overlay && overlay.classList.remove('hidden');
    requestAnimationFrame(() => { menu && menu.classList.add('open'); });
    menu && menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu && menu.classList.remove('open');
    setTimeout(() => {
      menu && menu.classList.add('hidden');
      overlay && overlay.classList.add('hidden');
    }, 300);
    menu && menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  on(toggle, 'click', openMenu);
  on(close, 'click', closeMenu);
  on(overlay, 'click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

// ============================================
// SEARCH MODAL
// ============================================
function initSearchModal() {
  const modal = $('#search-modal');
  const triggers = $$('[data-search-trigger]');
  const closeBtn = $('.search-modal-close');
  const overlay = modal && modal.querySelector('.search-modal-overlay');

  function openSearch() {
    modal && modal.classList.remove('hidden');
    modal && modal.setAttribute('aria-hidden', 'false');
    const input = modal && modal.querySelector('.search-modal-input');
    setTimeout(() => input && input.focus(), 100);
    document.body.style.overflow = 'hidden';
  }
  function closeSearch() {
    modal && modal.classList.add('hidden');
    modal && modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  triggers.forEach(t => on(t, 'click', openSearch));
  on(closeBtn, 'click', closeSearch);
  on(overlay, 'click', closeSearch);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeSearch(); });
}

// ============================================
// STICKY HEADER
// ============================================
function initStickyHeader() {
  const header = $('.site-header');
  if (!header) return;
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 80 && current > lastScroll) {
      header.style.transform = 'translateY(-100%)';
      header.style.transition = 'transform 0.3s ease';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = current;
  }, { passive: true });
}

// ============================================
// CART DRAWER
// ============================================
const CartDrawer = (() => {
  const drawer = () => $('#cart-drawer');
  const overlay = () => $('#cart-overlay');

  function open() {
    const d = drawer(), o = overlay();
    d && d.classList.remove('hidden');
    o && o.classList.remove('hidden');
    requestAnimationFrame(() => { d && d.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    refresh();
  }
  function close() {
    const d = drawer(), o = overlay();
    d && d.classList.remove('open');
    setTimeout(() => {
      d && d.classList.add('hidden');
      o && o.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
  }
  async function refresh() {
    try {
      const resp = await fetch('/cart.js');
      const cart = await resp.json();
      renderDrawer(cart);
      updateCartCount(cart.item_count);
    } catch (e) { console.error('Cart refresh failed:', e); }
  }
  function renderDrawer(cart) {
    const body = $('#cart-drawer-body');
    const footer = $('#cart-drawer-footer');
    if (!body) return;

    if (cart.item_count === 0) {
      body.innerHTML = `
        <div class="cart-drawer__empty">
          <span class="material-symbols-outlined">shopping_cart</span>
          <p style="font-weight:600;margin-bottom:8px">Your cart is empty</p>
          <p style="font-size:13px;color:var(--color-text-secondary)">Add items to get started</p>
          <a href="/collections/all" class="btn btn-primary mt-4" style="display:inline-flex" onclick="CartDrawer.close()">Shop now</a>
        </div>`;
      if (footer) footer.innerHTML = '';
      return;
    }

    body.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item__image">
          <a href="${item.url}"><img src="${item.image}" alt="${item.product_title}" loading="lazy"></a>
        </div>
        <div class="cart-item__details">
          <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
          ${item.variant_title ? `<div class="cart-item__variant">${item.variant_title}</div>` : ''}
          <div class="cart-item__controls">
            <div class="qty-selector" style="height:28px">
              <button class="qty-btn" onclick="CartDrawer.updateQty('${item.key}', ${item.quantity - 1})" style="width:28px;height:28px">−</button>
              <input class="qty-input" type="number" value="${item.quantity}" min="0" style="width:40px;height:28px;font-size:13px" onchange="CartDrawer.updateQty('${item.key}', this.value)">
              <button class="qty-btn" onclick="CartDrawer.updateQty('${item.key}', ${item.quantity + 1})" style="width:28px;height:28px">+</button>
            </div>
            <span class="cart-item-action-link" onclick="CartDrawer.updateQty('${item.key}', 0)">Remove</span>
          </div>
        </div>
        <div class="cart-item__price">${formatMoney(item.final_line_price)}</div>
      </div>`).join('');

    if (footer) footer.innerHTML = `
      <div class="cart-drawer__subtotal">
        <span>Subtotal (${cart.item_count} item${cart.item_count !== 1 ? 's' : ''})</span>
        <span>${formatMoney(cart.total_price)}</span>
      </div>
      <a href="/checkout" class="btn btn-primary btn-full" style="margin-bottom:8px">Proceed to Checkout</a>
      <a href="/cart" class="btn btn-ghost btn-full">View Cart</a>
      <p class="cart-notice">Taxes and shipping calculated at checkout</p>`;
  }
  function updateCartCount(count) {
    $$('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; });
  }
  async function updateQty(key, qty) {
    try {
      const resp = await fetch('/cart/change.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: parseInt(qty) })
      });
      const cart = await resp.json();
      renderDrawer(cart);
      updateCartCount(cart.item_count);
    } catch (e) { Toast.show('Error updating cart', 'error'); }
  }
  async function addItem(variantId, quantity = 1, properties = {}) {
    try {
      const resp = await fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity, properties })
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.description); }
      await refresh();
      open();
      Toast.show('Added to cart!', 'success');
    } catch (e) { Toast.show(e.message || 'Could not add to cart', 'error'); }
  }

  return { open, close, refresh, updateQty, addItem };
})();

// ============================================
// ADD TO CART FORMS
// ============================================
function initAddToCartForms() {
  document.addEventListener('submit', async e => {
    const form = e.target.closest('form[action="/cart/add"]');
    if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const variantInput = form.querySelector('[name="id"]');
    if (!variantInput) return;

    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:auto"></div>'; }

    await CartDrawer.addItem(variantInput.value, parseInt(form.querySelector('[name="quantity"]')?.value || 1));

    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
}

// ============================================
// PRODUCT GALLERY
// ============================================
function initProductGallery() {
  const gallery = $('.product-gallery');
  if (!gallery) return;
  const mainImg = gallery.querySelector('.product-gallery__main img');
  const thumbs = $$('.product-gallery__thumb', gallery);

  thumbs.forEach(thumb => {
    on(thumb, 'click', () => {
      const src = thumb.dataset.src;
      if (mainImg && src) {
        mainImg.src = src;
        mainImg.srcset = '';
      }
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
  if (thumbs[0]) thumbs[0].classList.add('active');
}

// ============================================
// VARIANT SELECTOR
// ============================================
function initVariantSelector() {
  const form = $('form[action="/cart/add"]');
  if (!form) return;
  const swatches = $$('.variant-swatch', form);
  const priceEl = $('.price-main');
  const comparePriceEl = $('.price-was');
  const hiddenInput = form.querySelector('[name="id"]');

  swatches.forEach(swatch => {
    on(swatch, 'click', () => {
      const group = swatch.dataset.group;
      $$(`[data-group="${group}"]`, form).forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');

      // Find matching variant
      const selected = {};
      $$('.variant-swatch.selected', form).forEach(s => { selected[s.dataset.group] = s.dataset.value; });

      const variants = JSON.parse(form.dataset.variants || '[]');
      const match = variants.find(v => {
        return Object.entries(selected).every(([key, val]) => {
          const idx = parseInt(key);
          return v[`option${idx + 1}`] === val;
        });
      });
      if (match) {
        if (hiddenInput) hiddenInput.value = match.id;
        if (priceEl) priceEl.innerHTML = `<span class="price-symbol">$</span>${(match.price / 100).toFixed(2)}`;
        if (comparePriceEl && match.compare_at_price > match.price) {
          comparePriceEl.innerHTML = `Was: <s>${formatMoney(match.compare_at_price)}</s>`;
          comparePriceEl.style.display = '';
        } else if (comparePriceEl) { comparePriceEl.style.display = 'none'; }
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = !match.available;
          submitBtn.textContent = match.available ? 'Add to Cart' : 'Sold Out';
        }
      }
    });
  });
}

// ============================================
// QUANTITY SELECTOR
// ============================================
function initQtySelectors() {
  document.addEventListener('click', e => {
    if (e.target.matches('.qty-btn') || e.target.closest('.qty-btn')) {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      const input = btn.parentElement.querySelector('.qty-input');
      if (!input) return;
      let val = parseInt(input.value) || 1;
      if (btn.dataset.action === 'decrease' || btn.textContent.includes('−') || btn.textContent.includes('-')) val = Math.max(1, val - 1);
      else val++;
      input.value = val;
    }
  });
}

// ============================================
// WISHLIST (localStorage)
// ============================================
const Wishlist = (() => {
  const KEY = 'stitch_wishlist';
  function get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function toggle(id) {
    let list = get();
    const idx = list.indexOf(String(id));
    if (idx > -1) { list.splice(idx, 1); Toast.show('Removed from wishlist', 'default'); }
    else { list.push(String(id)); Toast.show('Added to wishlist!', 'success'); }
    save(list);
    updateUI();
    return idx === -1;
  }
  function has(id) { return get().includes(String(id)); }
  function updateUI() {
    $$('[data-wishlist-btn]').forEach(btn => {
      const id = btn.dataset.wishlistBtn;
      const icon = btn.querySelector('.material-symbols-outlined');
      if (has(id)) {
        btn.classList.add('wishlisted');
        if (icon) { icon.style.fontVariationSettings = "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"; icon.style.color = '#B12704'; }
      } else {
        btn.classList.remove('wishlisted');
        if (icon) { icon.style.fontVariationSettings = ''; icon.style.color = ''; }
      }
    });
  }
  return { toggle, has, updateUI };
})();

// ============================================
// COLLECTION FILTERS (client-side toggle)
// ============================================
function initCollectionFilters() {
  const filterToggle = $('#filter-toggle');
  const sidebar = $('.collection-sidebar');

  on(filterToggle, 'click', () => {
    sidebar && sidebar.classList.toggle('open');
    if (filterToggle) {
      filterToggle.textContent = sidebar && sidebar.classList.contains('open') ? 'Hide Filters' : 'Show Filters';
    }
  });

  // Sort change
  const sortSelect = $('#sort-select');
  on(sortSelect, 'change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', sortSelect.value);
    window.location.href = url.toString();
  });
}

// ============================================
// BACK TO TOP
// ============================================
function initBackToTop() {
  const btn = $('#back-to-top');
  on(btn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// PROMO CODE (Cart)
// ============================================
function initPromoCode() {
  const form = $('#promo-form');
  on(form, 'submit', e => {
    e.preventDefault();
    const input = form.querySelector('input');
    if (input && input.value.trim()) {
      Toast.show('Discount codes are applied at checkout', 'default');
    }
  });
}

// ============================================
// ANNOUNCEMENT BAR DISMISS
// ============================================
function initAnnouncementBar() {
  const bar = $('.announcement-bar');
  const dismissBtn = $('#announcement-dismiss');
  if (!bar || !dismissBtn) return;
  const key = 'announcement_dismissed_' + bar.dataset.id;
  if (localStorage.getItem(key)) { bar.style.display = 'none'; return; }
  on(dismissBtn, 'click', () => {
    bar.style.display = 'none';
    localStorage.setItem(key, '1');
  });
}

// ============================================
// SCROLL REVEAL (subtle)
// ============================================
function initScrollReveal() {
  const els = $$('[data-reveal]');
  if (!els.length || !window.IntersectionObserver) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'; io.observe(el); });
  document.addEventListener('animationend', () => {});
  // Add revealed class styles dynamically
  const style = document.createElement('style');
  style.textContent = '[data-reveal].revealed { opacity: 1 !important; transform: none !important; }';
  document.head.appendChild(style);
}

// ============================================
// IMAGE LAZY LOAD
// ============================================
function initLazyImages() {
  if (!window.IntersectionObserver) return;
  const imgs = $$('img[data-src]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        if (e.target.dataset.srcset) e.target.srcset = e.target.dataset.srcset;
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(img => io.observe(img));
}

// ============================================
// GLOBAL EVENT DELEGATION
// ============================================
document.addEventListener('click', e => {
  // Cart trigger
  if (e.target.matches('[data-cart-trigger]') || e.target.closest('[data-cart-trigger]')) {
    e.preventDefault(); CartDrawer.open();
  }
  // Wishlist
  if (e.target.matches('[data-wishlist-btn]') || e.target.closest('[data-wishlist-btn]')) {
    const btn = e.target.closest('[data-wishlist-btn]');
    if (btn) Wishlist.toggle(btn.dataset.wishlistBtn);
  }
  // Close cart
  if (e.target.matches('#cart-drawer-close') || e.target.closest('#cart-drawer-close')) {
    CartDrawer.close();
  }
  // Close on overlay click
  if (e.target.matches('#cart-overlay')) { CartDrawer.close(); }
});

// ============================================
// INIT ALL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearchModal();
  initStickyHeader();
  initAddToCartForms();
  initProductGallery();
  initVariantSelector();
  initQtySelectors();
  initCollectionFilters();
  initBackToTop();
  initPromoCode();
  initAnnouncementBar();
  initScrollReveal();
  initLazyImages();
  CartDrawer.refresh();
  Wishlist.updateUI();
});

// Expose globals
window.CartDrawer = CartDrawer;
window.Toast = Toast;
window.Wishlist = Wishlist;

// ============================================
// PREDICTIVE SEARCH
// ============================================
const PredictiveSearch = (() => {
  let debounceTimer = null;
  let currentQuery = '';

  function init() {
    const inputs = document.querySelectorAll('.header-search-input, .search-modal-input');
    inputs.forEach(input => {
      const wrap = input.closest('.header-search-wrap, .search-modal-input-wrap');
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = input.value.trim();
        if (q.length < 2) { closeDropdown(input); return; }
        debounceTimer = setTimeout(() => search(input, q), 280);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeDropdown(input);
        if (e.key === 'ArrowDown') { e.preventDefault(); focusResult(input, 1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); focusResult(input, -1); }
      });
      document.addEventListener('click', e => {
        if (!input.contains(e.target)) closeDropdown(input);
      });
    });
  }

  async function search(input, query) {
    if (query === currentQuery) return;
    currentQuery = query;
    try {
      const res = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5&resources[fields]=title,vendor,price,image`);
      const data = await res.json();
      renderDropdown(input, query, data.resources?.results?.products || []);
    } catch (e) { closeDropdown(input); }
  }

  function renderDropdown(input, query, products) {
    let dropdown = getOrCreateDropdown(input);
    let html = '';

    if (products.length > 0) {
      html += `<div class="predictive-search__section"><div class="predictive-search__label">Products</div>`;
      products.forEach(p => {
        const price = p.price ? `$${(p.price / 100).toFixed(2)}` : '';
        const imgSrc = p.image || '';
        html += `<a href="${p.url}" class="predictive-search__item">
          <div class="predictive-search__img">${imgSrc ? `<img src="${imgSrc}" alt="${p.title}" loading="lazy">` : '<span class="material-symbols-outlined" style="font-size:20px;color:var(--color-border)">inventory_2</span>'}</div>
          <div class="predictive-search__info">
            <div class="predictive-search__vendor">${p.vendor || ''}</div>
            <div class="predictive-search__title">${p.title}</div>
            <div class="predictive-search__price">${price}</div>
          </div>
        </a>`;
      });
      html += `</div>`;
    }

    html += `<div class="predictive-search__section">
      <div class="predictive-search__query" onclick="document.querySelector('form[action*=search]').querySelector('[name=q]').value='${query.replace(/'/g,"\\'")}';document.querySelector('form[action*=search]').submit()">
        <span class="material-symbols-outlined">search</span> Search for "<strong>${query}</strong>"
      </div>
    </div>`;

    if (products.length > 0) {
      html += `<div class="predictive-search__footer">
        <a href="/search?type=product&q=${encodeURIComponent(query)}" class="btn btn-ghost btn-sm btn-full" style="text-align:center">View all results for "${query}"</a>
      </div>`;
    }

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  }

  function getOrCreateDropdown(input) {
    const formWrap = input.closest('.header-search') || input.closest('.search-modal-form');
    let existing = formWrap && formWrap.querySelector('.predictive-search');
    if (existing) return existing;
    const d = document.createElement('div');
    d.className = 'predictive-search';
    d.style.display = 'none';
    if (formWrap) formWrap.style.position = 'relative';
    formWrap && formWrap.appendChild(d);
    return d;
  }

  function closeDropdown(input) {
    currentQuery = '';
    const formWrap = input.closest('.header-search, .search-modal-form');
    const d = formWrap && formWrap.querySelector('.predictive-search');
    if (d) d.style.display = 'none';
  }

  function focusResult(input, dir) {
    const formWrap = input.closest('.header-search, .search-modal-form');
    const items = formWrap && [...formWrap.querySelectorAll('.predictive-search__item, .predictive-search__query')];
    if (!items || !items.length) return;
    const focused = formWrap.querySelector('.predictive-search__item:focus, .predictive-search__query:focus');
    const idx = focused ? items.indexOf(focused) : -1;
    const next = items[(idx + dir + items.length) % items.length];
    next && next.focus();
  }

  return { init };
})();

// ============================================
// QUICK VIEW MODAL
// ============================================
const QuickView = (() => {
  function init() {
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-quick-view]');
      if (!btn) return;
      e.preventDefault();
      const url = btn.dataset.quickView;
      await open(url);
    });
  }

  async function open(productUrl) {
    let container = document.getElementById('quick-view-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'quick-view-container';
      container.className = 'quick-view-overlay';
      document.body.appendChild(container);
    }
    container.innerHTML = `<div class="quick-view-modal"><div style="padding:60px;text-align:center"><div class="spinner" style="margin:auto;width:32px;height:32px"></div></div></div>`;
    container.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
      const res = await fetch(`${productUrl}?view=quick-view`);
      // Fallback: fetch full page and extract product info
      const fullRes = await fetch(productUrl);
      const html = await fullRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title = doc.querySelector('h1')?.textContent.trim() || '';
      const price = doc.querySelector('.price-main')?.textContent.trim() || '';
      const img = doc.querySelector('.product-gallery__main img, .product-gallery img, [class*=product] img')?.src || '';
      const desc = doc.querySelector('.product-description')?.innerHTML || '';
      const addToCartBtn = doc.querySelector('[type=submit][class*=cart], .btn-primary')?.outerHTML || `<button class="btn btn-primary btn-full btn-lg">View Full Product</button>`;

      container.innerHTML = `
        <div class="quick-view-overlay" onclick="QuickView.close(event)" id="qv-overlay">
          <div class="quick-view-modal" onclick="event.stopPropagation()">
            <div class="quick-view-modal__header">
              <span style="font-size:15px;font-weight:700">${title}</span>
              <button class="quick-view-modal__close" onclick="QuickView.close()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="quick-view-modal__body">
              <div class="quick-view-modal__image">
                ${img ? `<img src="${img}" alt="${title}" loading="lazy">` : '<span class="material-symbols-outlined" style="font-size:64px;color:var(--color-border)">inventory_2</span>'}
              </div>
              <div>
                <div style="font-size:26px;font-weight:400;color:var(--color-price);margin-bottom:12px">${price}</div>
                <div style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:16px;max-height:180px;overflow-y:auto">${desc}</div>
                <a href="${productUrl}" class="btn btn-ghost btn-full" style="margin-bottom:8px">View Full Details</a>
                <a href="${productUrl}" class="btn btn-primary btn-full btn-lg">Add to Cart</a>
              </div>
            </div>
          </div>
        </div>`;
    } catch (err) {
      container.innerHTML = `<div class="quick-view-overlay" onclick="QuickView.close()"><div class="quick-view-modal" onclick="event.stopPropagation()" style="padding:40px;text-align:center"><p>Could not load product. <a href="${productUrl}" class="btn btn-primary" style="margin-top:16px;display:inline-flex">View Product</a></p></div></div>`;
    }
  }

  function close(e) {
    if (e && e.target.id !== 'qv-overlay' && !e.target.closest('.quick-view-modal__close')) return;
    const container = document.getElementById('quick-view-container');
    if (container) { container.classList.remove('open'); container.innerHTML = ''; }
    document.body.style.overflow = '';
  }

  return { init, open, close };
})();

// ============================================
// STICKY ADD TO CART BAR
// ============================================
function initStickyATC() {
  const productInfo = document.getElementById('product-info-panel');
  const addBtn = document.getElementById('add-to-cart-btn');
  if (!productInfo || !addBtn) return;

  const bar = document.createElement('div');
  bar.className = 'sticky-atc-bar';
  bar.id = 'sticky-atc-bar';

  const title = document.querySelector('.product-info__title')?.textContent.trim() || '';
  const price = document.querySelector('.price-main')?.textContent.trim() || '';
  const img = document.querySelector('#main-product-img')?.src || '';
  const variantId = document.querySelector('[name=id]')?.value || '';

  bar.innerHTML = `
    <div class="sticky-atc-bar__inner">
      <div class="sticky-atc-bar__product">
        <div class="sticky-atc-bar__img">${img ? `<img src="${img}" alt="${title}">` : ''}</div>
        <div>
          <div class="sticky-atc-bar__title">${title}</div>
          <div class="sticky-atc-bar__price">${price}</div>
        </div>
      </div>
      <div class="sticky-atc-bar__actions">
        <form action="/cart/add" method="post" style="display:flex;gap:8px;align-items:center">
          <input type="hidden" name="id" value="${variantId}" id="sticky-variant-id">
          <input type="number" name="quantity" value="1" min="1" style="width:56px;padding:8px;border:1px solid var(--color-border);border-radius:var(--border-radius);font-size:14px;text-align:center">
          <button type="submit" class="btn btn-primary btn-lg">Add to Cart</button>
        </form>
        <a href="#" onclick="scrollToReviews()" class="btn btn-ghost btn-sm" style="white-space:nowrap">See Reviews</a>
      </div>
    </div>`;

  document.body.appendChild(bar);

  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle('visible', !entry.isIntersecting);
  }, { threshold: 0.2 });
  io.observe(addBtn);

  // Keep variant ID in sync
  document.addEventListener('click', e => {
    if (e.target.matches('.variant-swatch')) {
      setTimeout(() => {
        const mainId = document.querySelector('form[action="/cart/add"] [name=id]')?.value;
        const stickyId = document.getElementById('sticky-variant-id');
        if (mainId && stickyId) stickyId.value = mainId;
      }, 50);
    }
  });
}

function scrollToReviews() {
  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// FREE SHIPPING PROGRESS BAR
// ============================================
function initShippingProgress() {
  const threshold = window.__theme?.free_shipping_threshold || 5000; // cents
  const bars = document.querySelectorAll('.shipping-progress');
  if (!bars.length) return;

  fetch('/cart.js').then(r => r.json()).then(cart => {
    const total = cart.total_price;
    const pct = Math.min((total / threshold) * 100, 100);
    const remaining = Math.max(threshold - total, 0);

    bars.forEach(bar => {
      const fill = bar.querySelector('.shipping-progress__fill');
      const text = bar.querySelector('.shipping-progress__text');
      if (fill) fill.style.width = pct + '%';
      if (text) {
        if (remaining <= 0) {
          bar.classList.add('shipping-progress--complete');
          text.innerHTML = '🎉 <strong>You\'ve unlocked FREE shipping!</strong>';
        } else {
          text.innerHTML = `Add <strong>$${(remaining / 100).toFixed(2)}</strong> more for <strong>FREE shipping</strong>`;
        }
      }
    });
  }).catch(() => {});
}

// ============================================
// RECENTLY VIEWED
// ============================================
const RecentlyViewed = (() => {
  const KEY = 'stitch_rv';
  const MAX = 8;

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  function track(product) {
    if (!product || !product.id) return;
    let list = get().filter(p => p.id !== product.id);
    list.unshift(product);
    list = list.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function render(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const list = get();
    if (list.length < 2) { container.style.display = 'none'; return; }

    container.innerHTML = `
      <div class="section-header"><h2 class="section-title">Recently Viewed</h2></div>
      <div class="products-grid products-grid--5" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${list.map(p => `
          <div class="product-card">
            <div class="product-card__image-wrap">
              <a href="${p.url}">
                <img src="${p.image}" alt="${p.title}" loading="lazy" class="product-card__image">
              </a>
            </div>
            <div class="product-card__body">
              <div class="product-card__brand">${p.vendor || ''}</div>
              <a href="${p.url}" class="product-card__title">${p.title}</a>
              <div class="product-card__price">
                <span class="price-current"><span class="price-symbol">$</span>${(p.price / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // Auto-track on product pages
  function autoTrack() {
    const data = document.getElementById('product-json-data');
    if (data) {
      try {
        const p = JSON.parse(data.textContent);
        track({ id: p.id, title: p.title, url: p.url, image: p.featured_image, price: p.price, vendor: p.vendor });
      } catch (e) {}
    }
  }

  return { track, render, get, autoTrack };
})();

// ============================================
// IMAGE ZOOM (Product Gallery)
// ============================================
function initImageZoom() {
  const mainImg = document.querySelector('.product-gallery__main');
  if (!mainImg) return;
  mainImg.classList.add('product-zoom-wrap');

  mainImg.addEventListener('click', function(e) {
    this.classList.toggle('zoomed');
    if (this.classList.contains('zoomed')) {
      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
      this.style.setProperty('--zoom-x', x);
      this.style.setProperty('--zoom-y', y);
    }
  });

  mainImg.addEventListener('mousemove', function(e) {
    if (!this.classList.contains('zoomed')) return;
    const rect = this.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    this.style.setProperty('--zoom-x', x);
    this.style.setProperty('--zoom-y', y);
  });
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function initCountdownTimers() {
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const end = new Date(el.dataset.countdown).getTime();
    function tick() {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) { el.innerHTML = '<span style="color:var(--color-success);font-weight:700">Deal ended</span>'; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      var daysPart = '';
      if (d > 0) { daysPart = '<span class="countdown-unit">' + d + 'd</span><span class="countdown-sep">:</span>'; }
      var hStr = String(h); while (hStr.length < 2) { hStr = '0' + hStr; }
      var mStr = String(m); while (mStr.length < 2) { mStr = '0' + mStr; }
      var sStr = String(s); while (sStr.length < 2) { sStr = '0' + sStr; }
      el.innerHTML = '<span class="material-symbols-outlined">timer</span><span>Ends in:</span><span class="countdown-units">' + daysPart + '<span class="countdown-unit">' + hStr + '</span><span class="countdown-sep">:</span><span class="countdown-unit">' + mStr + '</span><span class="countdown-sep">:</span><span class="countdown-unit">' + sStr + '</span></span>';
    }
    tick();
    setInterval(tick, 1000);
  });
}

// ============================================
// COOKIE CONSENT BANNER
// ============================================
function initCookieBanner() {
  if (localStorage.getItem('cookie_consent')) return;
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  setTimeout(() => banner.classList.add('visible'), 1500);

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    banner.classList.remove('visible');
  });
  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem('cookie_consent', 'declined');
    banner.classList.remove('visible');
  });
}

// ============================================
// AGE GATE
// ============================================
function initAgeGate() {
  const gate = document.getElementById('age-gate');
  if (!gate) return;
  if (sessionStorage.getItem('age_verified')) { gate.style.display = 'none'; return; }
  gate.classList.add('visible');

  document.getElementById('age-confirm')?.addEventListener('click', () => {
    sessionStorage.setItem('age_verified', '1');
    gate.classList.remove('visible');
  });
  document.getElementById('age-deny')?.addEventListener('click', () => {
    window.location.href = 'https://google.com';
  });
}

// ============================================
// NEWSLETTER POPUP
// ============================================
function initNewsletterPopup() {
  const popup = document.getElementById('newsletter-popup');
  if (!popup) return;
  if (localStorage.getItem('newsletter_dismissed') || localStorage.getItem('newsletter_subscribed')) return;

  const delay = parseInt(popup.dataset.delay || '5000');
  setTimeout(() => popup.classList.add('visible'), delay);

  const closeBtn = popup.querySelector('.newsletter-popup__close');
  const skipBtn = popup.querySelector('.newsletter-popup__skip');
  const overlay = popup;

  function dismiss() {
    localStorage.setItem('newsletter_dismissed', '1');
    popup.classList.remove('visible');
  }

  closeBtn?.addEventListener('click', dismiss);
  skipBtn?.addEventListener('click', dismiss);
  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });

  popup.querySelector('form')?.addEventListener('submit', () => {
    localStorage.setItem('newsletter_subscribed', '1');
    setTimeout(() => popup.classList.remove('visible'), 1500);
  });
}

// ============================================
// SOCIAL PROOF POPUP
// ============================================
function initSocialProof() {
  const container = document.getElementById('social-proof-container');
  if (!container) return;

  const events = JSON.parse(container.dataset.events || '[]');
  if (!events.length) return;

  let idx = 0;
  function showNext() {
    const ev = events[idx % events.length];
    idx++;
    const el = document.createElement('div');
    el.className = 'social-proof-popup';
    el.innerHTML = `
      ${ev.image ? `<img src="${ev.image}" alt="${ev.product}">` : ''}
      <div>
        <div class="social-proof-popup__name">${ev.name}</div>
        <div class="social-proof-popup__action">${ev.action}</div>
        <div class="social-proof-popup__time">${ev.time}</div>
      </div>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.4s'; setTimeout(() => el.remove(), 400); }, 4000);
  }

  setTimeout(() => {
    showNext();
    setInterval(showNext, 7000);
  }, 8000);
}

// ============================================
// BACK TO TOP FAB
// ============================================
function initBackToTopFAB() {
  const fab = document.getElementById('back-to-top-fab');
  if (!fab) return;
  window.addEventListener('scroll', () => {
    fab.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// SIZE GUIDE MODAL
// ============================================
function openSizeGuide() {
  document.getElementById('size-guide-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSizeGuide() {
  document.getElementById('size-guide-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('click', e => {
  if (e.target.id === 'size-guide-overlay') closeSizeGuide();
});

// ============================================
// COMPARE PRODUCTS
// ============================================
const Compare = (() => {
  const KEY = 'stitch_compare';
  const MAX = 3;

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function toggle(product) {
    let list = get();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx > -1) { list.splice(idx, 1); Toast.show('Removed from compare', 'default'); }
    else if (list.length >= MAX) { Toast.show(`Max ${MAX} products to compare`, 'error'); return; }
    else { list.push(product); Toast.show('Added to compare', 'success'); }
    save(list);
    renderBar();
  }

  function renderBar() {
    let bar = document.getElementById('compare-bar');
    const list = get();
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'compare-bar';
      bar.className = 'compare-bar';
      document.body.appendChild(bar);
    }
    if (list.length === 0) { bar.classList.remove('visible'); return; }
    bar.classList.add('visible');
    bar.innerHTML = `
      <div class="compare-bar__inner">
        <span style="font-size:13px;font-weight:700;flex-shrink:0">${list.length} / ${MAX} to compare</span>
        <div class="compare-bar__items">
          ${list.map(p => `
            <div class="compare-bar__item">
              ${p.image ? `<img src="${p.image}" alt="${p.title}">` : ''}
              <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${p.title}</span>
              <button class="compare-bar__remove" onclick="Compare.toggle(${JSON.stringify(p).replace(/"/g,'&quot;')})">✕</button>
            </div>`).join('')}
        </div>
        ${list.length >= 2 ? `<a href="/pages/compare?ids=${list.map(p => p.id).join(',')}" class="btn btn-primary btn-sm" style="flex-shrink:0">Compare Now</a>` : `<span style="font-size:12px;color:rgba(255,255,255,0.5)">Add 1 more to compare</span>`}
        <button onclick="Compare.clearAll()" class="btn btn-ghost btn-sm" style="flex-shrink:0;color:#fff;border-color:rgba(255,255,255,0.3)">Clear</button>
      </div>`;
  }

  function clearAll() { save([]); renderBar(); }

  return { toggle, get, renderBar, clearAll };
})();

// ============================================
// VIDEO SECTIONS
// ============================================
function initVideoSections() {
  document.querySelectorAll('.video-section__poster').forEach(poster => {
    poster.addEventListener('click', function() {
      const section = this.closest('.video-section');
      const video = section?.querySelector('video');
      const iframe = section?.querySelector('iframe');
      if (video) { video.play(); this.style.display = 'none'; }
      if (iframe) {
        const src = iframe.src;
        iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
        this.style.display = 'none';
      }
    });
  });
}

// ============================================
// TABS (Generic)
// ============================================
function switchGenericTab(tabId, panel, btn) {
  const container = btn.closest('[data-tabs]') || document;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  container.querySelectorAll('.tab-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(panel)?.classList.add('active');
  btn.classList.add('active');
}

// ============================================
// MARQUEE — pause on hover (already via CSS, ensure JS init)
// ============================================
function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(track => {
    const clone = track.cloneNode(true);
    track.parentElement.appendChild(clone);
  });
}

// ============================================
// ENHANCED INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  PredictiveSearch.init();
  QuickView.init();
  initStickyATC();
  initShippingProgress();
  RecentlyViewed.autoTrack();
  RecentlyViewed.render('#recently-viewed-section');
  initImageZoom();
  initCountdownTimers();
  initCookieBanner();
  initAgeGate();
  initNewsletterPopup();
  initSocialProof();
  initBackToTopFAB();
  initVideoSections();
  initMarquee();
  Compare.renderBar();

  // Add back-to-top fab if not present
  if (!document.getElementById('back-to-top-fab')) {
    const fab = document.createElement('button');
    fab.id = 'back-to-top-fab';
    fab.className = 'back-to-top-fab';
    fab.setAttribute('aria-label', 'Back to top');
    fab.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';
    document.body.appendChild(fab);
    initBackToTopFAB();
  }
});

// Expose
window.PredictiveSearch = PredictiveSearch;
window.QuickView = QuickView;
window.Compare = Compare;
window.RecentlyViewed = RecentlyViewed;
window.openSizeGuide = openSizeGuide;
window.closeSizeGuide = closeSizeGuide;
window.switchGenericTab = switchGenericTab;
