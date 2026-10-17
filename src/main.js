import './style.css';
import { STORE_CONFIG, products } from './data.js';

/* ========================================================================= */
/* 🍯 HELPER FUNCTIONS FOR PRODUCT SIZES & PRICING                           */
/* ========================================================================= */

/**
 * Helper function to compute complete pricing, sale, and stock status for any jar size
 */
export function getSizePricing(sizeObj) {
  if (!sizeObj) {
    return {
      size: '500g',
      weight: '500g Glass Jar',
      price: 0,
      regularPrice: 0,
      salePrice: 0,
      currentPrice: 0,
      onSale: false,
      inStock: true,
      discountPercent: 0
    };
  }

  const regularPrice = Number(sizeObj.price) || 0;
  const rawSalePrice = (sizeObj.salePrice !== undefined && sizeObj.salePrice !== null) ? Number(sizeObj.salePrice) : regularPrice;
  const onSale = Boolean(sizeObj.onSale && rawSalePrice < regularPrice && rawSalePrice > 0);
  const currentPrice = onSale ? rawSalePrice : regularPrice;
  const inStock = sizeObj.inStock !== false;
  const discountPercent = onSale && regularPrice > 0 ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0;

  return {
    size: sizeObj.size,
    weight: sizeObj.weight || `${sizeObj.size} Glass Jar`,
    price: regularPrice,
    regularPrice: regularPrice,
    salePrice: rawSalePrice,
    currentPrice: currentPrice,
    onSale: onSale,
    inStock: inStock,
    discountPercent: discountPercent
  };
}

/**
 * Helper to pick preferred size or first in-stock size
 */
export function getActiveProductSize(product, preferredSize) {
  if (!product || !product.sizes || product.sizes.length === 0) return null;
  if (preferredSize) {
    const match = product.sizes.find(s => s.size === preferredSize);
    if (match) return match;
  }
  const inStockMatch = product.sizes.find(s => s.inStock !== false);
  return inStockMatch || product.sizes[0];
}

/* ========================================================================= */
/* GLOBAL APPLICATION STATE                                                  */
/* ========================================================================= */
let currentView = 'home';
let activeCategory = 'all';
let currentSort = 'featured';
let cart = [];
let selectedShipping = 'pickup'; // Options: 'pickup' (Free), 'surrounding' (Free), 'outside' (Confirmed with seller)

// Active bottle size selections per product / view (Defaults to 500g)
const productSelectedSizes = {
  'litchi-blossom': '500g',
  'creamed litchi honey': '500g',
  'eucalyptus-blossom': '500g',
  'ketepa-pride-hex': '250g'
};
let featuredSelectedSize = '500g';
let pdpSelectedSize = '500g';
let pdpCurrentProductId = 'litchi-blossom';
let pdpQty = 1;
let activeTeaCategory = 'all';
let currentTeaSort = 'featured';
let currentFeaturedSlide = 0;
const totalFeaturedSlides = 2;
let featuredSlideInterval = null;
let pendingRemoveCartItemId = null;
let lastOrderData = null;

/**
 * Robust product finder helper
 */
export function findProduct(id) {
  if (!id) return products[0];
  return products.find(p => p.id === id || (id === 'litchi-blossom' && p.id === 'litchi-blossom') || (id === 'creamed-litchi-honey' && p.id === 'creamed litchi honey') || (id === 'eucalyptus-blossom' && p.id === 'eucalyptus-blossom')) || products[0];
}

// Load cart from LocalStorage if available
try {
  const storedCart = localStorage.getItem('nectar_hive_cart');
  if (storedCart) {
    cart = JSON.parse(storedCart);
    // ensure backwards compatibility for items without cartItemId or weight
    cart.forEach(item => {
      if (!item.size) item.size = '500g';
      if (!item.weight) item.weight = `${item.size} Glass Jar`;
      if (!item.cartItemId) item.cartItemId = `${item.id}-${item.size}`;
    });
  }
} catch (e) {
  cart = [];
}

/* Featured section size selector */
export function selectFeaturedSize(size) {
  featuredSelectedSize = size;
  const prod = findProduct('eucalyptus-blossom');
  const sizeObj = prod.sizes.find(s => s.size === size) || prod.sizes[1];
  const sizeData = getSizePricing(sizeObj);

  const priceEl = document.getElementById('featured-price-display');
  const labelEl = document.getElementById('featured-size-label');
  const specEl = document.getElementById('featured-size-spec');

  if (priceEl) {
    if (sizeData.onSale) {
      priceEl.innerHTML = `R ${sizeData.currentPrice} <span class="text-sm font-normal text-stone-400 line-through ml-1.5">R ${sizeData.regularPrice}</span> <span class="ml-1.5 text-xs bg-[#D1A22A] text-black font-bold px-1.5 py-0.5 rounded">SALE</span>`;
    } else {
      priceEl.textContent = `R ${sizeData.currentPrice}`;
    }
  }
  if (labelEl) labelEl.textContent = `per ${sizeData.size} glass jar (ZAR)`;
  if (specEl) specEl.textContent = sizeData.weight;

  ['250g', '500g', '1kg'].forEach(s => {
    const btn = document.getElementById(`featured-size-btn-${s}`);
    if (btn) {
      if (s === size) {
        btn.className = "py-2 px-2.5 rounded border text-center transition-all bg-amber-deep text-white border-amber-deep shadow-sm";
        const lastSpan = btn.querySelector('span:last-child');
        if (lastSpan) lastSpan.className = "block text-[11px] text-gold font-semibold font-bahnschrift";
      } else {
        btn.className = "py-2 px-2.5 rounded border text-center transition-all bg-neutral-warm border-[#BEB3A0] text-amber hover:bg-neutral-warm/80";
        const lastSpan = btn.querySelector('span:last-child');
        if (lastSpan) lastSpan.className = "block text-[11px] text-[#877C6B] font-semibold font-bahnschrift";
      }
    }
  });
}

export function addFeaturedToCart() {
  addToCart('eucalyptus-blossom', 1, featuredSelectedSize);
}

export function selectProductCardSize(productId, size, event) {
  if (event) {
    event.stopPropagation();
  }
  productSelectedSizes[productId] = size;
  renderShopProducts();
  renderTeaProducts();
}

/* ========================================================================= */
/* 🏷️ META TAGS & SEO PER PAGE                                               */
/* ========================================================================= */
const PAGE_META = {
  home: {
    title: "NECTAR AND HIVE | Pure South African Honey · KZN, Durban",
    description: "Artisanal, raw single-origin honey crafted by nature and perfected by bees in KZN, Durban, KwaZulu-Natal. 100% pure, unheated, cold-extracted South African honey by NECTAR AND HIVE."
  },
  shop: {
    title: "Honey Collection | Raw & Creamed Jars · NECTAR AND HIVE Durban",
    description: "Browse 100% raw South African single-origin honeys in 250g, 500g, and 1kg glass jars with live size stock and promotional sales. Direct WhatsApp dispatch by NECTAR AND HIVE."
  },
  tea: {
    title: "KETEPA Pride Kenyan Tea | NECTAR AND HIVE Durban",
    description: "World-famous Kenyan black tea by Kenya Tea Packers (KETEPA) in the iconic hexagonal presentation pack. Authentic highland loose leaf tea curated alongside raw South African honey in Durban."
  },
  'thank-you': {
    title: "Thank You for Your Order! | NECTAR AND HIVE Durban",
    description: "Your raw honey order has been compiled and dispatched to WhatsApp. Thank you for supporting sustainable artisanal apiculture in KwaZulu-Natal with NECTAR AND HIVE."
  },
  privacy: {
    title: "Privacy Policy (POPIA Compliant) | NECTAR AND HIVE Durban",
    description: "Learn how your contact details and delivery preferences are safely handled under South Africa's Protection of Personal Information Act (POPIA) by NECTAR AND HIVE."
  },
  terms: {
    title: "Terms of Service & Delivery Policy | NECTAR AND HIVE Durban",
    description: "Terms and conditions for single-origin raw honey orders, Sherwood local collection, surrounding Durban delivery, and nationwide courier by NECTAR AND HIVE."
  },
  '404': {
    title: "Honey Pot Not Found (404) | NECTAR AND HIVE Durban",
    description: "The page or honey variety you requested could not be found. Return to our Durban raw honey catalog at NECTAR AND HIVE."
  }
};

export function updatePageMeta(viewName, product = null) {
  let title = "NECTAR AND HIVE | Pure South African Honey & KETEPA Tea";
  let desc = "Artisanal, raw single-origin honey crafted in KZN, Durban, alongside authentic Kenyan KETEPA Pride Tea.";

  if (viewName === 'pdp' && product) {
    title = `${product.name} | ${product.brand || 'Artisanal'} · NECTAR AND HIVE Durban`;
    desc = `${product.subtitle || ''} — Harvested in ${product.origin}. ${product.description.substring(0, 140)}...`;
  } else if (PAGE_META[viewName]) {
    title = PAGE_META[viewName].title;
    desc = PAGE_META[viewName].description;
  }

  document.title = title;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', desc);
}

/* ========================================================================= */
/* 📊 UTM ATTRIBUTION TRACKING                                               */
/* ========================================================================= */
export function initUtmTracking() {
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const collected = {};
    let hasUtm = false;

    keys.forEach(k => {
      const val = params.get(k);
      if (val) {
        collected[k] = val;
        hasUtm = true;
      }
    });

    if (hasUtm) {
      sessionStorage.setItem('nectar_utm_params', JSON.stringify(collected));
    }
  } catch (e) {}
}

export function getUtmParams() {
  try {
    const saved = sessionStorage.getItem('nectar_utm_params');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

/* ========================================================================= */
/* 📈 PRIVACY-FIRST ANALYTICS LOGGER                                         */
/* ========================================================================= */
export function trackEvent(eventName, eventParams = {}) {
  const utm = getUtmParams();
  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    path: window.location.hash || '#home',
    ...utm,
    ...eventParams
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  try {
    const logs = JSON.parse(sessionStorage.getItem('nectar_analytics_log') || '[]');
    logs.push(payload);
    if (logs.length > 50) logs.shift();
    sessionStorage.setItem('nectar_analytics_log', JSON.stringify(logs));
  } catch (e) {}
}

/* ========================================================================= */
/* VIEW ROUTING & TRANSITIONS                                                */
/* ========================================================================= */
export function navigateTo(viewName, productId = null, updateHash = true) {
  currentView = viewName;

  const views = {
    home: document.getElementById('view-home'),
    shop: document.getElementById('view-shop'),
    tea: document.getElementById('view-tea'),
    pdp: document.getElementById('view-product-detail'),
    'thank-you': document.getElementById('view-thank-you'),
    privacy: document.getElementById('view-privacy'),
    terms: document.getElementById('view-terms'),
    '404': document.getElementById('view-404')
  };

  const navLinks = {
    home: document.getElementById('nav-link-home'),
    shop: document.getElementById('nav-link-shop'),
    tea: document.getElementById('nav-link-tea')
  };

  // Hide all views
  Object.values(views).forEach(v => {
    if (v) v.classList.add('hidden');
  });

  // Reset desktop nav active classes
  Object.values(navLinks).forEach(link => {
    if (link) link.className = "text-[#877C6B] hover:text-gold transition-colors py-1 relative whitespace-nowrap";
  });

  let targetProduct = null;

  if (viewName === 'home') {
    if (views.home) views.home.classList.remove('hidden');
    if (navLinks.home) navLinks.home.className = "text-gold font-semibold transition-colors py-1 relative whitespace-nowrap";
    if (updateHash) history.replaceState(null, '', '#home');
  } else if (viewName === 'shop') {
    if (views.shop) views.shop.classList.remove('hidden');
    if (navLinks.shop) navLinks.shop.className = "text-gold font-semibold transition-colors py-1 relative whitespace-nowrap";
    renderShopProducts();
    if (updateHash) history.replaceState(null, '', '#shop');
  } else if (viewName === 'tea') {
    if (views.tea) views.tea.classList.remove('hidden');
    if (navLinks.tea) navLinks.tea.className = "text-emerald-900 font-bold transition-colors py-1 relative whitespace-nowrap inline-flex items-center gap-1.5";
    renderTeaProducts();
    if (updateHash) history.replaceState(null, '', '#tea');
  } else if (viewName === 'pdp' && productId) {
    targetProduct = findProduct(productId);
    if (targetProduct) {
      if (views.pdp) views.pdp.classList.remove('hidden');
      renderProductDetailView(productId);
      if (updateHash) history.replaceState(null, '', `#pdp-${productId}`);
    } else {
      return navigateTo('404', null, updateHash);
    }
  } else if (viewName === 'thank-you') {
    if (views['thank-you']) views['thank-you'].classList.remove('hidden');
    if (updateHash) history.replaceState(null, '', '#thank-you');
  } else if (viewName === 'privacy') {
    if (views.privacy) views.privacy.classList.remove('hidden');
    if (updateHash) history.replaceState(null, '', '#privacy');
  } else if (viewName === 'terms') {
    if (views.terms) views.terms.classList.remove('hidden');
    if (updateHash) history.replaceState(null, '', '#terms');
  } else {
    // 404 Fallback
    currentView = '404';
    if (views['404']) views['404'].classList.remove('hidden');
    if (updateHash) history.replaceState(null, '', '#404');
  }

  // Update Page Metadata (Title & Description)
  updatePageMeta(currentView, targetProduct);

  // Track page view event
  trackEvent('page_view', { page_view: currentView, product_id: productId });

  // Scroll to top with smooth behavior
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========================================================================= */
/* ☕ KETEPA TEA COLLECTION CONTROLLER & FILTERING                           */
/* ========================================================================= */
export function handlePdpBack() {
  const prod = findProduct(pdpCurrentProductId);
  if (prod && (prod.category === 'tea' || prod.brand === 'KETEPA' || prod.id === 'ketepa-pride-hex')) {
    navigateTo('tea');
  } else {
    navigateTo('shop');
  }
}

export function setTeaFilterCategory(cat) {
  activeTeaCategory = cat;

  const filterBtns = ['all', 'black', 'gift'];
  filterBtns.forEach(b => {
    const btn = document.getElementById(`tea-filter-${b}`);
    if (btn) {
      if (b === cat) {
        btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors bg-[#2D322F] text-[#F4F1EA] font-bahnschrift";
      } else {
        btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors bg-white border border-[#BEB3A0] text-[#2D322F] hover:border-[#2D322F] font-bahnschrift";
      }
    }
  });

  renderTeaProducts();
}

export function handleTeaSortChange(sortVal) {
  currentTeaSort = sortVal;
  renderTeaProducts();
}

/**
 * Minimal Product Card for Tea Grid: Image, Name, Price, Sale/Stock, Add to Bag
 */
export function renderTeaProducts() {
  const grid = document.getElementById('tea-products-grid');
  const countSpan = document.getElementById('tea-product-count');
  if (!grid) return;

  // Filter: Tea products only
  let filtered = products.filter(p => p.category === 'tea' || p.brand === 'KETEPA' || p.id === 'ketepa-pride-hex');

  if (activeTeaCategory === 'black') {
    filtered = filtered.filter(p => (p.subtitle && p.subtitle.toLowerCase().includes('black')) || (p.description && p.description.toLowerCase().includes('black')));
  } else if (activeTeaCategory === 'gift') {
    filtered = filtered.filter(p => p.id.includes('hex') || (p.subtitle && p.subtitle.toLowerCase().includes('gift')) || (p.name && p.name.toLowerCase().includes('hexagonal')));
  }

  // Sort
  if (currentTeaSort === 'price-asc') {
    filtered.sort((a, b) => {
      const aSize = getSizePricing(a.sizes.find(s => s.size === (productSelectedSizes[a.id] || '250g')) || a.sizes[0]);
      const bSize = getSizePricing(b.sizes.find(s => s.size === (productSelectedSizes[b.id] || '250g')) || b.sizes[0]);
      return aSize.currentPrice - bSize.currentPrice;
    });
  } else if (currentTeaSort === 'price-desc') {
    filtered.sort((a, b) => {
      const aSize = getSizePricing(a.sizes.find(s => s.size === (productSelectedSizes[a.id] || '250g')) || a.sizes[0]);
      const bSize = getSizePricing(b.sizes.find(s => s.size === (productSelectedSizes[b.id] || '250g')) || b.sizes[0]);
      return bSize.currentPrice - aSize.currentPrice;
    });
  } else if (currentTeaSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countSpan) {
    countSpan.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-[#2D322F]/60 font-bahnschrift">
        <i class="ph ph-coffee text-4xl text-[#505649] mb-2 block"></i>
        <p class="text-sm font-bold uppercase tracking-wider">No tea varieties match the selected criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const activeSize = productSelectedSizes[p.id] || (p.sizes && p.sizes[0] ? p.sizes[0].size : '250g');
    const sizeObj = (p.sizes && p.sizes.find(s => s.size === activeSize)) || (p.sizes && p.sizes[0]) || { size: '250g', price: p.price, inStock: true };
    const sizeData = getSizePricing(sizeObj);
    const isSizeAvailable = sizeData.inStock && p.inStock;

    return `
      <div class="bg-white border border-[#BEB3A0] hover:border-[#2D322F] transition-colors flex flex-col group">
        
        <!-- 1. Product Image: Sharp square container, clickable -> PDP -->
        <div 
          onclick="navigateTo('pdp', '${p.id}')"
          class="relative aspect-square overflow-hidden cursor-pointer bg-[#505649]">
          <img 
            src="${p.image}" 
            alt="${p.name} - KETEPA Tea" 
            class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            referrerpolicy="no-referrer"
            onerror="this.onerror=null; this.src='${p.fallbackImage}';"
          />
          
          <!-- Status Badges: Sharp minimal squares -->
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 font-bahnschrift">
            <span class="bg-[#2D322F] text-[#F4F1EA] px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
              Kenyan Import
            </span>
            ${sizeData.onSale ? `
              <span class="bg-[#D1A22A] text-[#2D322F] px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                SALE -${sizeData.discountPercent}%
              </span>
            ` : ''}
            <span class="bg-white/95 text-[#2D322F] border border-[#2D322F]/25 px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 ${isSizeAvailable ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
              <span>${isSizeAvailable ? 'In Stock' : 'Out of Stock'}</span>
            </span>
          </div>
        </div>

        <!-- 2. Product Name, Price, Add to Cart (Clean, Uncluttered, Sharp) -->
        <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
          
          <div>
            <h3 
              onclick="navigateTo('pdp', '${p.id}')"
              class="font-display text-lg sm:text-xl font-bold text-[#2D322F] hover:text-[#505649] transition-colors cursor-pointer leading-snug">
              ${p.name}
            </h3>

            <!-- Price Display -->
            <div class="mt-2.5 flex items-baseline gap-2">
              <span class="font-display text-xl sm:text-2xl font-bold text-[#2D322F] tabular-nums">
                R ${sizeData.currentPrice}
              </span>
              ${sizeData.onSale ? `
                <span class="text-xs text-neutral-400 line-through font-semibold tabular-nums">
                  R ${sizeData.regularPrice}
                </span>
              ` : ''}
            </div>
          </div>

          <!-- 3. Add to Cart Button (Sharp Square) -->
          <div>
            ${!isSizeAvailable ? `
              <button 
                type="button" 
                disabled 
                class="w-full py-3.5 bg-neutral-200 text-neutral-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed font-bahnschrift">
                Out of Stock
              </button>
            ` : `
              <button 
                type="button" 
                onclick="addToCart('${p.id}', 1, '${activeSize}')" 
                class="w-full py-3.5 bg-[#505649] hover:bg-[#2D322F] text-[#F4F1EA] font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer font-bahnschrift">
                <i class="ph ph-handbag font-bold text-sm"></i>
                <span>Add to Bag</span>
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  }).join('');
}

/* ========================================================================= */
/* 🎠 FEATURED PRODUCTS SLIDESHOW CONTROLLER                                 */
/* ========================================================================= */
export function showFeaturedSlide(index) {
  currentFeaturedSlide = (index + totalFeaturedSlides) % totalFeaturedSlides;

  for (let i = 0; i < totalFeaturedSlides; i++) {
    const slide = document.getElementById(`featured-slide-${i}`);
    const dot = document.getElementById(`featured-dot-${i}`);
    if (slide) {
      if (i === currentFeaturedSlide) {
        slide.classList.remove('hidden', 'opacity-0');
        slide.classList.add('opacity-100');
      } else {
        slide.classList.add('hidden', 'opacity-0');
        slide.classList.remove('opacity-100');
      }
    }
    if (dot) {
      if (i === currentFeaturedSlide) {
        dot.className = "w-8 h-1 bg-[#2D322F] transition-all cursor-pointer";
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.className = "w-6 h-1 bg-[#2D322F]/20 hover:bg-[#2D322F]/50 transition-all cursor-pointer";
        dot.removeAttribute('aria-current');
      }
    }
  }

  const counter = document.getElementById('featured-slide-counter');
  if (counter) {
    counter.textContent = `0${currentFeaturedSlide + 1} / 0${totalFeaturedSlides}`;
  }
}

export function nextFeaturedSlide(resetTimer = false) {
  showFeaturedSlide(currentFeaturedSlide + 1);
  if (resetTimer) startFeaturedAutoplay();
}

export function prevFeaturedSlide(resetTimer = false) {
  showFeaturedSlide(currentFeaturedSlide - 1);
  if (resetTimer) startFeaturedAutoplay();
}

export function startFeaturedAutoplay() {
  if (featuredSlideInterval) clearInterval(featuredSlideInterval);
  featuredSlideInterval = setInterval(() => {
    nextFeaturedSlide(false);
  }, 4000);
}

export function pauseFeaturedAutoplay() {
  if (featuredSlideInterval) {
    clearInterval(featuredSlideInterval);
    featuredSlideInterval = null;
  }
}

export function resumeFeaturedAutoplay() {
  startFeaturedAutoplay();
}

export function handleScrollTo(sectionId) {
  if (currentView !== 'home') {
    navigateTo('home', null, true);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  } else {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ========================================================================= */
/* SHOP RENDERING & FILTERING (HONEY COLLECTION)                             */
/* ========================================================================= */
export function setFilterCategory(cat) {
  activeCategory = cat;

  const filterBtns = ['all', 'raw', 'creamed'];
  filterBtns.forEach(b => {
    const btn = document.getElementById(`filter-${b}`);
    if (btn) {
      if (b === cat) {
        btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors bg-[#2D322F] text-[#F4F1EA] font-bahnschrift";
      } else {
        btn.className = "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors bg-white border border-[#BEB3A0] text-[#2D322F] hover:border-[#2D322F] font-bahnschrift";
      }
    }
  });

  renderShopProducts();
}

export function handleSortChange(sortVal) {
  currentSort = sortVal;
  renderShopProducts();
}

/**
 * Minimal Product Card for Honey Collection: Image, Name, Price, Sale/Stock, Add to Bag
 */
export function renderShopProducts() {
  const grid = document.getElementById('products-grid');
  const countSpan = document.getElementById('shop-product-count');
  if (!grid) return;

  // Filter: Exclude tea products from Honey Collection page
  let filtered = products.filter(p => {
    if (p.category === 'tea' || p.brand === 'KETEPA' || p.id === 'ketepa-pride-hex') return false;
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  // Sort
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => {
      const aSize = getSizePricing(a.sizes.find(s => s.size === (productSelectedSizes[a.id] || '500g')) || a.sizes[1]);
      const bSize = getSizePricing(b.sizes.find(s => s.size === (productSelectedSizes[b.id] || '500g')) || b.sizes[1]);
      return aSize.currentPrice - bSize.currentPrice;
    });
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => {
      const aSize = getSizePricing(a.sizes.find(s => s.size === (productSelectedSizes[a.id] || '500g')) || a.sizes[1]);
      const bSize = getSizePricing(b.sizes.find(s => s.size === (productSelectedSizes[b.id] || '500g')) || b.sizes[1]);
      return bSize.currentPrice - aSize.currentPrice;
    });
  } else if (currentSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countSpan) countSpan.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-[#2D322F]/60 font-bahnschrift">
        <i class="ph ph-magnifying-glass text-4xl text-[#D1A22A] mb-2 block"></i>
        <p class="text-sm font-bold uppercase tracking-wider">No honey varieties match the selected criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const activeSize = productSelectedSizes[p.id] || '500g';
    const sizeObj = p.sizes.find(s => s.size === activeSize) || p.sizes[1];
    const sizeData = getSizePricing(sizeObj);
    const isSizeAvailable = sizeData.inStock && p.inStock;

    return `
      <div class="bg-white border border-[#BEB3A0] hover:border-[#2D322F] transition-colors flex flex-col group">
        
        <!-- 1. Product Image: Sharp square container, clickable -> PDP -->
        <div 
          onclick="navigateTo('pdp', '${p.id}')"
          class="relative aspect-square overflow-hidden cursor-pointer bg-[#F4F1EA]">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            referrerpolicy="no-referrer"
            onerror="this.onerror=null; this.src='${p.fallbackImage}';"
          />
          
          <!-- Status Badges: Sharp minimal squares -->
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 font-bahnschrift">
            ${sizeData.onSale ? `
              <span class="bg-[#2D322F] text-[#F4F1EA] px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                SALE -${sizeData.discountPercent}%
              </span>
            ` : ''}
            <span class="bg-white/95 text-[#2D322F] border border-[#2D322F]/25 px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 ${isSizeAvailable ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
              <span>${isSizeAvailable ? 'In Stock' : 'Out of Stock'}</span>
            </span>
          </div>
        </div>

        <!-- 2. Product Name, Price, Add to Cart (Clean, Uncluttered, Sharp) -->
        <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
          
          <div>
            <h3 
              onclick="navigateTo('pdp', '${p.id}')"
              class="font-display text-lg sm:text-xl font-bold text-[#2D322F] hover:text-[#D1A22A] transition-colors cursor-pointer leading-snug">
              ${p.name}
            </h3>

            <!-- Price Display -->
            <div class="mt-2.5 flex items-baseline gap-2">
              <span class="font-display text-xl sm:text-2xl font-bold text-[#2D322F] tabular-nums">
                R ${sizeData.currentPrice}
              </span>
              ${sizeData.onSale ? `
                <span class="text-xs text-neutral-400 line-through font-semibold tabular-nums">
                  R ${sizeData.regularPrice}
                </span>
              ` : ''}
            </div>
          </div>

          <!-- 3. Add to Cart Button (Sharp Square) -->
          <div>
            ${!isSizeAvailable ? `
              <button 
                type="button" 
                disabled 
                class="w-full py-3.5 bg-neutral-200 text-neutral-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed font-bahnschrift">
                Out of Stock
              </button>
            ` : `
              <button 
                type="button" 
                onclick="addToCart('${p.id}', 1, '${activeSize}')" 
                class="w-full py-3.5 bg-[#2D322F] text-[#F4F1EA] hover:bg-[#D1A22A] hover:text-[#2D322F] font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer font-bahnschrift">
                <i class="ph ph-handbag font-bold text-sm"></i>
                <span>Add to Bag</span>
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  }).join('');
}

export function openProductModal(productId) {
  navigateTo('pdp', productId);
}

/* ========================================================================= */
/* PRODUCT DETAIL VIEW (PDP) - WITH COMPLETE INFORMATION & SHARP SQUARES    */
/* ========================================================================= */
export function renderProductDetailView(productId) {
  const product = findProduct(productId);
  const container = document.getElementById('pdp-content-container');
  if (!product || !container) return;

  pdpCurrentProductId = product.id;
  if (!productSelectedSizes[product.id]) {
    productSelectedSizes[product.id] = product.sizes && product.sizes[0] ? product.sizes[0].size : '500g';
  }
  pdpSelectedSize = productSelectedSizes[product.id];
  pdpQty = 1;

  const currentSizeObj = product.sizes.find(s => s.size === pdpSelectedSize) || product.sizes[0];
  const sizeData = getSizePricing(currentSizeObj);
  const isSizeAvailable = sizeData.inStock && product.inStock;

  container.className = "bg-white border border-[#BEB3A0] overflow-hidden";

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch">
      
      <!-- Left Column: Gallery & Imagery (Sharp Square) -->
      <div class="lg:col-span-6 bg-[#F4F1EA] flex flex-col justify-between p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#BEB3A0]">
        <div>
          <div class="relative overflow-hidden aspect-square w-full bg-white border border-[#BEB3A0]/70">
            <img 
              id="pdp-main-image"
              src="${product.image}" 
              alt="${product.name}" 
              class="w-full h-full object-cover transition-opacity duration-300"
              referrerpolicy="no-referrer"
              onerror="this.onerror=null; this.src='${product.fallbackImage}';"
            />
            
            <!-- Badges on Image -->
            <div class="absolute top-4 left-4 flex flex-col gap-2 z-10 font-bahnschrift">
              ${sizeData.onSale ? `
                <span class="bg-[#2D322F] text-[#F4F1EA] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  SALE -${sizeData.discountPercent}% OFF
                </span>
              ` : ''}
              <span class="bg-white text-[#2D322F] border border-[#2D322F]/25 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 ${isSizeAvailable ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
                <span>${isSizeAvailable ? 'In Stock · Ready for Delivery' : 'Currently Out of Stock'}</span>
              </span>
            </div>
          </div>

          ${product.gallery && product.gallery.length > 1 ? `
            <div class="flex items-center gap-3 pt-4">
              ${product.gallery.map((imgSrc, idx) => `
                <button 
                  type="button" 
                  onclick="document.getElementById('pdp-main-image').src = '${imgSrc}'; document.querySelectorAll('.pdp-gallery-thumb').forEach(t => { t.classList.remove('border-[#2D322F]'); t.classList.add('border-[#BEB3A0]'); }); this.classList.remove('border-[#BEB3A0]'); this.classList.add('border-[#2D322F]');"
                  class="pdp-gallery-thumb w-16 h-16 overflow-hidden border ${idx === 0 ? 'border-[#2D322F]' : 'border-[#BEB3A0]'} bg-white cursor-pointer">
                  <img src="${imgSrc}" alt="${product.name} view ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='src/assets/${imgSrc}';" />
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Spec Badges Strip (Sharp Squares) -->
        <div class="grid grid-cols-3 gap-3 pt-6 text-center text-xs font-bahnschrift">
          <div class="p-3 bg-white border border-[#BEB3A0]">
            <span class="text-[10px] uppercase font-bold text-[#2D322F]/60 block">Volume</span>
            <span id="pdp-volume-spec" class="font-bold text-[#2D322F]">${sizeData.weight}</span>
          </div>
          <div class="p-3 bg-white border border-[#BEB3A0]">
            <span class="text-[10px] uppercase font-bold text-[#2D322F]/60 block">Process</span>
            <span class="font-bold text-[#2D322F]">${product.category === 'tea' ? 'CTC' : 'Raw & Unheated'}</span>
          </div>
          <div class="p-3 bg-white border border-[#BEB3A0]">
            <span class="text-[10px] uppercase font-bold text-[#2D322F]/60 block">Origin</span>
            <span class="font-bold text-[#2D322F]">${product.category === 'tea' ? 'Kenya' : 'Durban, KZN'}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Purchase & Full Information Module -->
      <div class="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between space-y-8 bg-white">
        
        <div class="space-y-6">
          
          <div>
            <div class="text-xs font-bold tracking-widest uppercase text-[#D1A22A] mb-1 font-bahnschrift">
              <span>${product.origin}</span>
              <span aria-hidden="true" class="mx-1">·</span>
              <span>${product.harvestSeason}</span>
            </div>
            <h1 class="font-display text-3xl sm:text-4xl font-bold text-[#2D322F] tracking-tight">
              ${product.name}
            </h1>
            <p class="text-xs text-[#2D322F]/70 mt-1 font-bold font-bahnschrift uppercase tracking-wider">
              ${product.subtitle}
            </p>
          </div>

          <!-- Bottle / Pack Size Selection with Sharp Square Buttons -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#2D322F] font-bahnschrift">
              <span>${product.category === 'tea' ? 'Select Presentation' : 'Choose Bottle Size'}</span>
              <span id="pdp-size-weight-indicator" class="${isSizeAvailable ? 'text-[#D1A22A]' : 'text-rose-600'} font-bold">
                ${sizeData.weight} ${!isSizeAvailable ? '(Out of Stock)' : ''}
              </span>
            </div>
            <div class="grid ${product.sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-2.5">
              ${product.sizes.map(s => {
                const sData = getSizePricing(s);
                const isSelected = s.size === pdpSelectedSize;
                const isAvailable = sData.inStock && product.inStock;

                if (!isAvailable) {
                  return `
                    <button 
                      type="button" 
                      onclick="selectPdpSize('${s.size}')" 
                      id="pdp-size-btn-${s.size}" 
                      class="p-3 border border-neutral-300 text-center min-h-[48px] opacity-60 bg-neutral-100 text-neutral-500 cursor-pointer">
                      <span class="block text-sm font-bold font-bahnschrift line-through">${s.size}</span>
                      <span class="block text-[10px] text-rose-600 font-bold uppercase tracking-wider">Sold Out</span>
                    </button>
                  `;
                }

                if (sData.onSale) {
                  return `
                    <button 
                      type="button" 
                      onclick="selectPdpSize('${s.size}')" 
                      id="pdp-size-btn-${s.size}" 
                      class="p-3 border text-center transition-colors min-h-[48px] ${isSelected 
                        ? 'border-[#2D322F] bg-[#2D322F] text-[#F4F1EA]' 
                        : 'border-[#BEB3A0] bg-white text-[#2D322F] hover:border-[#2D322F]'}">
                      <span class="block text-sm font-bold font-bahnschrift flex items-center justify-center gap-1">
                        ${s.size}
                        <span class="text-[9px] bg-[#D1A22A] text-black font-extrabold px-1">SALE</span>
                      </span>
                      <span class="block text-xs font-bold font-bahnschrift">
                        R ${sData.currentPrice} <span class="line-through text-stone-400 text-[10px]">R ${sData.regularPrice}</span>
                      </span>
                    </button>
                  `;
                }

                return `
                  <button 
                    type="button" 
                    onclick="selectPdpSize('${s.size}')" 
                    id="pdp-size-btn-${s.size}" 
                    class="p-3 border text-center transition-colors min-h-[48px] ${isSelected 
                      ? 'border-[#2D322F] bg-[#2D322F] text-[#F4F1EA]' 
                      : 'border-[#BEB3A0] bg-white text-[#2D322F] hover:border-[#2D322F]'}">
                    <span class="block text-sm font-bold font-bahnschrift">${s.size}</span>
                    <span class="block text-xs font-semibold font-bahnschrift">R ${sData.currentPrice}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Price and Strikethrough -->
          <div class="flex items-baseline gap-3 pb-4 border-b border-[#BEB3A0] flex-wrap">
            <div class="flex items-baseline gap-2">
              <span id="pdp-price-display" class="font-display text-3xl sm:text-4xl font-bold text-[#2D322F] tabular-nums">
                R ${sizeData.currentPrice}
              </span>
              <span id="pdp-strikethrough-display" class="text-base text-stone-400 line-through font-semibold tabular-nums ${sizeData.onSale ? '' : 'hidden'}">
                R ${sizeData.regularPrice}
              </span>
              <span id="pdp-sale-badge-display" class="text-xs font-bold uppercase tracking-wider text-[#F4F1EA] bg-[#2D322F] px-2 py-0.5 font-bahnschrift ${sizeData.onSale ? '' : 'hidden'}">
                Save R ${sizeData.regularPrice - sizeData.currentPrice} (-${sizeData.discountPercent}%)
              </span>
            </div>
            <span id="pdp-price-unit" class="text-xs text-[#2D322F]/60 font-bahnschrift">ZAR per ${sizeData.size} (VAT Inclusive)</span>
          </div>

          <!-- Out of Stock Warning Banner -->
          <div id="pdp-out-of-stock-banner" class="${isSizeAvailable ? 'hidden' : ''} p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-bahnschrift">
            <i class="ph ph-warning-circle text-base text-rose-600 shrink-0"></i>
            <span>This size is temporarily sold out. Please select another size above to order.</span>
          </div>

          <!-- Tasting Notes -->
          <div class="space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-[#2D322F] block font-bahnschrift">Aroma &amp; Tasting Profile</span>
            <div class="flex flex-wrap gap-2">
              ${product.flavorNotes.map(n => `
                <span class="text-xs px-3 py-1 bg-[#F4F1EA] text-[#2D322F] border border-[#BEB3A0] font-bahnschrift font-semibold">
                  ${n}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Editorial Description -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#2D322F] font-bahnschrift">Harvest &amp; Purity Details</h4>
            <p class="text-sm sm:text-base text-[#2D322F]/85 leading-relaxed font-normal font-bahnschrift">
              ${product.description}
            </p>
          </div>

          <!-- Culinary Pairing Advice -->
          <div class="p-4 bg-[#F4F1EA] border border-[#BEB3A0] space-y-1 font-bahnschrift">
            <span class="text-xs font-bold text-[#2D322F] uppercase tracking-wider flex items-center gap-1.5">
              <i class="ph ph-sparkle text-[#D1A22A]"></i>
              Serving &amp; Pairing Recommendation
            </span>
            <p class="text-xs text-[#2D322F]/80 leading-relaxed font-light">
              ${product.pairings}
            </p>
          </div>

        </div>

        <!-- Quantity Selector & Add To Cart Button (Sharp Squares) -->
        <div class="pt-6 border-t border-[#BEB3A0] space-y-4 font-bahnschrift">
          <div class="flex items-center gap-4">
            <div class="flex items-center border border-[#2D322F] bg-white ${!isSizeAvailable ? 'opacity-40 pointer-events-none' : ''}">
              <button 
                type="button"
                onclick="changePdpQty(-1)" 
                class="w-12 h-12 flex items-center justify-center text-[#2D322F] hover:bg-[#F4F1EA] transition-colors text-base font-bold">
                -
              </button>
              <span id="pdp-qty-display" class="px-4 py-2 text-xs font-bold text-[#2D322F] tabular-nums min-w-[36px] text-center">
                1
              </span>
              <button 
                type="button"
                onclick="changePdpQty(1)" 
                class="w-12 h-12 flex items-center justify-center text-[#2D322F] hover:bg-[#F4F1EA] transition-colors text-base font-bold">
                +
              </button>
            </div>

            <button 
              id="pdp-add-to-cart-btn"
              type="button"
              onclick="handlePdpAddToCart('${product.id}')"
              ${!isSizeAvailable ? 'disabled' : ''}
              class="flex-1 py-4 px-6 font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 min-h-[48px] ${isSizeAvailable 
                ? 'bg-[#2D322F] hover:bg-[#D1A22A] text-[#F4F1EA] hover:text-[#2D322F] cursor-pointer' 
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}">
              <i class="ph ${isSizeAvailable ? 'ph-handbag' : 'ph-prohibit'} font-bold text-base"></i>
              <span id="pdp-btn-label">${isSizeAvailable ? `Add to Bag · R <span id="pdp-dynamic-total">${sizeData.currentPrice}</span>` : 'Out of Stock - Select Another Size'}</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-[11px] text-[#2D322F]/70 pt-2 font-bahnschrift">
            <span class="flex items-center gap-1.5">
              <i class="ph ph-truck text-[#D1A22A]"></i>
              Free Pickup in Sherwood · Surrounding Delivery Free
            </span>
            <span class="flex items-center gap-1.5">
              <i class="ph ph-shield-check text-[#D1A22A]"></i>
              100% Purity Guarantee
            </span>
          </div>
        </div>

      </div>

    </div>
  `;
}

export function selectPdpSize(size) {
  pdpSelectedSize = size;
  productSelectedSizes[pdpCurrentProductId] = size;
  const product = findProduct(pdpCurrentProductId);
  const sizeObj = product.sizes.find(s => s.size === size) || product.sizes[0];
  const sizeData = getSizePricing(sizeObj);
  const isSizeAvailable = sizeData.inStock && product.inStock;

  const priceEl = document.getElementById('pdp-price-display');
  const strikeEl = document.getElementById('pdp-strikethrough-display');
  const badgeEl = document.getElementById('pdp-sale-badge-display');
  const unitEl = document.getElementById('pdp-price-unit');
  const totalEl = document.getElementById('pdp-dynamic-total');
  const volEl = document.getElementById('pdp-volume-spec');
  const indEl = document.getElementById('pdp-size-weight-indicator');
  const bannerEl = document.getElementById('pdp-out-of-stock-banner');
  const addBtn = document.getElementById('pdp-add-to-cart-btn');
  const btnLabel = document.getElementById('pdp-btn-label');

  if (priceEl) priceEl.textContent = `R ${sizeData.currentPrice}`;
  if (strikeEl) {
    if (sizeData.onSale) {
      strikeEl.textContent = `R ${sizeData.regularPrice}`;
      strikeEl.classList.remove('hidden');
    } else {
      strikeEl.classList.add('hidden');
    }
  }
  if (badgeEl) {
    if (sizeData.onSale) {
      badgeEl.textContent = `Save R ${sizeData.regularPrice - sizeData.currentPrice} (-${sizeData.discountPercent}%)`;
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }
  }
  if (unitEl) unitEl.textContent = `ZAR per ${sizeData.size} (VAT Inclusive)`;
  if (totalEl) totalEl.textContent = sizeData.currentPrice * pdpQty;
  if (volEl) volEl.textContent = sizeData.weight;
  if (indEl) {
    indEl.textContent = `${sizeData.weight} ${!isSizeAvailable ? '(Sold Out)' : ''}`;
    indEl.className = isSizeAvailable ? 'text-[#D1A22A] font-bold' : 'text-rose-600 font-bold';
  }
  if (bannerEl) {
    if (isSizeAvailable) {
      bannerEl.classList.add('hidden');
    } else {
      bannerEl.classList.remove('hidden');
    }
  }

  if (addBtn && btnLabel) {
    if (isSizeAvailable) {
      addBtn.disabled = false;
      addBtn.className = "flex-1 py-4 px-6 font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 min-h-[48px] bg-[#2D322F] hover:bg-[#D1A22A] text-[#F4F1EA] hover:text-[#2D322F] cursor-pointer";
      btnLabel.innerHTML = `Add to Bag · R <span id="pdp-dynamic-total">${sizeData.currentPrice * pdpQty}</span>`;
    } else {
      addBtn.disabled = true;
      addBtn.className = "flex-1 py-4 px-6 font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 min-h-[48px] bg-neutral-200 text-neutral-400 cursor-not-allowed";
      btnLabel.textContent = "Out of Stock - Select Another Size";
    }
  }

  product.sizes.forEach(s => {
    const btn = document.getElementById(`pdp-size-btn-${s.size}`);
    if (btn) {
      const sData = getSizePricing(s);
      const isAvail = sData.inStock && product.inStock;

      if (!isAvail) {
        btn.className = "p-3 border border-neutral-300 text-center min-h-[48px] opacity-60 bg-neutral-100 text-neutral-500 cursor-pointer";
      } else if (s.size === size) {
        btn.className = "p-3 border text-center transition-colors min-h-[48px] border-[#2D322F] bg-[#2D322F] text-[#F4F1EA]";
      } else {
        btn.className = "p-3 border text-center transition-colors min-h-[48px] border-[#BEB3A0] bg-white text-[#2D322F] hover:border-[#2D322F]";
      }
    }
  });
}

export function handlePdpAddToCart(productId) {
  addToCart(productId, pdpQty, pdpSelectedSize);
}

export function changePdpQty(delta) {
  pdpQty = Math.max(1, pdpQty + delta);
  const display = document.getElementById('pdp-qty-display');
  const dynamicTotal = document.getElementById('pdp-dynamic-total');
  if (display) display.textContent = pdpQty;

  const product = findProduct(pdpCurrentProductId);
  if (product) {
    const currentSizeObj = product.sizes.find(s => s.size === pdpSelectedSize) || product.sizes[0];
    const sizeData = getSizePricing(currentSizeObj);
    if (dynamicTotal) {
      dynamicTotal.textContent = sizeData.currentPrice * pdpQty;
    }
  }
}

/* ========================================================================= */
/* SHOPPING CART LOGIC & DRAWER                                              */
/* ========================================================================= */
export function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer || !overlay) return;

  if (open) {
    overlay.classList.remove('hidden');
    drawer.classList.remove('translate-x-full');
    renderCart();
  } else {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('hidden');
  }
}

export function addToCart(productId, qty = 1, size = null) {
  const product = findProduct(productId);
  if (!product) return;

  if (!product.inStock) {
    showToast('Product Unavailable', 'This seasonal batch is currently reserved.', 'info');
    return;
  }

  const chosenSize = size || productSelectedSizes[product.id] || '500g';
  const sizeObj = product.sizes.find(s => s.size === chosenSize) || product.sizes[1] || { size: chosenSize, weight: `${chosenSize} Glass Jar`, price: product.price };
  const sizeData = getSizePricing(sizeObj);

  if (!sizeData.inStock) {
    showToast('Size Sold Out', `The ${sizeData.weight} is currently out of stock. Please select another jar size.`, 'info');
    return;
  }

  const cartItemId = `${product.id}-${sizeData.size}`;
  const existing = cart.find(item => (item.cartItemId && item.cartItemId === cartItemId) || (item.id === product.id && item.size === sizeData.size));

  if (existing) {
    existing.qty += qty;
    existing.price = sizeData.currentPrice;
    existing.regularPrice = sizeData.regularPrice;
    existing.onSale = sizeData.onSale;
  } else {
    cart.push({
      cartItemId: cartItemId,
      id: product.id,
      name: product.name,
      size: sizeData.size,
      weight: sizeData.weight,
      price: sizeData.currentPrice,
      regularPrice: sizeData.regularPrice,
      onSale: sizeData.onSale,
      discountPercent: sizeData.discountPercent,
      image: product.image,
      fallbackImage: product.fallbackImage,
      qty: qty
    });
  }

  saveCart();
  updateCartBadge();
  showToast('Added to Bag', `${qty}× ${product.name} (${sizeData.weight})`, 'cart');
  toggleCartDrawer(true);
}

export function updateCartQty(cartItemId, delta) {
  const item = cart.find(i => (i.cartItemId && i.cartItemId === cartItemId) || i.id === cartItemId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => (i.cartItemId && i.cartItemId !== cartItemId) && i.id !== cartItemId);
  }

  saveCart();
  renderCart();
  updateCartBadge();
}

export function removeFromCart(cartItemId) {
  cart = cart.filter(i => (i.cartItemId && i.cartItemId !== cartItemId) && i.id !== cartItemId);
  saveCart();
  renderCart();
  updateCartBadge();
  showToast('Item Removed', 'The item was removed from your bag.', 'info');
}

export function saveCart() {
  try {
    localStorage.setItem('nectar_hive_cart', JSON.stringify(cart));
  } catch (e) {}
}

export function updateCartBadge() {
  const badge = document.getElementById('header-cart-count');
  const stickyBadge = document.getElementById('mobile-sticky-cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (badge) {
    badge.textContent = totalItems;
    badge.classList.add('scale-125');
    setTimeout(() => badge.classList.remove('scale-125'), 200);
  }
  if (stickyBadge) {
    stickyBadge.textContent = totalItems;
  }
}

export function promptRemoveFromCart(cartItemId) {
  pendingRemoveCartItemId = cartItemId;
  const item = cart.find(i => (i.cartItemId && i.cartItemId === cartItemId) || i.id === cartItemId);
  const modal = document.getElementById('confirm-remove-modal');
  const textEl = document.getElementById('confirm-remove-text');

  if (textEl && item) {
    textEl.textContent = `Are you sure you want to remove "${item.name} (${item.weight || item.size})" from your bag?`;
  }
  if (modal) {
    modal.classList.remove('hidden');
  }
}

export function executeRemoveCartItem() {
  if (!pendingRemoveCartItemId) return;
  removeFromCart(pendingRemoveCartItemId);
  cancelRemoveCartItem();
}

export function cancelRemoveCartItem() {
  pendingRemoveCartItemId = null;
  const modal = document.getElementById('confirm-remove-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleShippingChange(method) {
  selectedShipping = method;
  renderCart();
}

export function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Calculates shipping details based on chosen method
 */
export function getShippingDetails() {
  if (selectedShipping === 'surrounding') {
    return {
      method: 'surrounding',
      label: 'Delivery in Surrounding Areas — Free',
      summaryLabel: 'Surrounding Areas Delivery (Free)',
      cartFeeText: 'Free',
      isConfirmedWithSeller: false,
      feeAmount: 0
    };
  } else if (selectedShipping === 'outside') {
    return {
      method: 'outside',
      label: 'Delivery Outside Surrounding Areas & Nationwide — Confirmed with seller',
      summaryLabel: 'Outside / Nationwide (Confirmed with seller)',
      cartFeeText: 'Confirmed with seller',
      isConfirmedWithSeller: true,
      feeAmount: 0
    };
  } else {
    // Default: pickup
    return {
      method: 'pickup',
      label: 'Local Pickup (Sherwood, Durban) — Free',
      summaryLabel: 'Sherwood Pickup (Free)',
      cartFeeText: 'Free',
      isConfirmedWithSeller: false,
      feeAmount: 0
    };
  }
}

export function renderCart() {
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingFeeEl = document.getElementById('cart-shipping-fee');
  const totalEl = document.getElementById('cart-total');
  const footer = document.getElementById('cart-footer-container');
  const shippingNote = document.getElementById('cart-shipping-note');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div class="w-16 h-16 rounded-full bg-neutral-warm flex items-center justify-center text-gold">
          <i class="ph ph-handbag text-3xl"></i>
        </div>
        <div>
          <h4 class="font-display text-lg font-bold text-amber-deep">Your Bag is Empty</h4>
          <p class="text-xs text-[#877C6B] mt-1 max-w-xs font-light">
            Discover our raw, single-origin South African honeys harvested in KZN, Durban.
          </p>
        </div>
        <button 
          onclick="toggleCartDrawer(false); navigateTo('shop');"
          class="px-6 py-2.5 bg-gold hover:bg-gold-dark text-amber-deep font-semibold text-xs rounded transition-colors font-bahnschrift">
          Explore Collection
        </button>
      </div>
    `;
    if (footer) footer.classList.add('opacity-50', 'pointer-events-none');
    if (subtotalEl) subtotalEl.textContent = "R 0";
    if (shippingFeeEl) shippingFeeEl.textContent = "Free";
    if (totalEl) totalEl.textContent = "R 0";
    if (shippingNote) shippingNote.classList.add('hidden');
    return;
  }

  if (footer) footer.classList.remove('opacity-50', 'pointer-events-none');

  // Render Cart Items
  container.innerHTML = cart.map(item => {
    const itemKey = item.cartItemId || item.id;
    const displayWeight = item.weight || (item.size ? `${item.size} Glass Jar` : '500g Glass Jar');
    return `
    <div class="flex items-center gap-4 p-3 bg-neutral-warm/60 rounded-xl border border-[#BEB3A0]/60">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0 border border-[#BEB3A0]/60">
        <img 
          src="${item.image}" 
          alt="${item.name}" 
          class="w-full h-full object-cover"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='${item.fallbackImage}';"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <h4 class="font-display text-sm font-bold text-amber-deep truncate">
            ${item.name}
          </h4>
          ${(item.id && item.id.includes('ketepa')) || item.brand === 'KETEPA' ? `
            <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase font-bahnschrift">
              Kenyan Tea
            </span>
          ` : ''}
          ${item.onSale ? `
            <span class="text-[9px] bg-gradient-to-r from-amber-500 to-[#D1A22A] text-black font-extrabold px-1.5 py-0.5 rounded uppercase font-bahnschrift shadow-sm">
              Sale
            </span>
          ` : ''}
        </div>
        <span class="text-[11px] text-[#877C6B] block font-bahnschrift">${displayWeight}</span>
        <div class="flex items-baseline gap-1.5 mt-0.5">
          <span class="text-xs font-bold text-amber-deep tabular-nums">
            R ${item.price} each
          </span>
          ${item.onSale && item.regularPrice && item.regularPrice > item.price ? `
            <span class="text-[10px] text-stone-400 line-through font-semibold tabular-nums">
              R ${item.regularPrice}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="flex flex-col items-end gap-2 shrink-0">
        <button 
          onclick="promptRemoveFromCart('${itemKey}')"
          class="text-amber/40 hover:text-rose-600 text-xs transition-colors p-1"
          title="Remove"
          aria-label="Remove ${item.name} from bag">
          <i class="ph ph-trash"></i>
        </button>

        <div class="flex items-center border border-[#BEB3A0] rounded bg-white text-xs font-bahnschrift">
          <button 
            onclick="updateCartQty('${itemKey}', -1)" 
            class="w-8 h-8 flex items-center justify-center text-amber hover:text-gold font-bold text-sm"
            aria-label="Decrease quantity">
            -
          </button>
          <span class="px-2 font-bold tabular-nums text-amber-deep text-center min-w-[20px]">${item.qty}</span>
          <button 
            onclick="updateCartQty('${itemKey}', 1)" 
            class="w-8 h-8 flex items-center justify-center text-amber hover:text-gold font-bold text-sm"
            aria-label="Increase quantity">
            +
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');

  const subtotal = getCartSubtotal();
  const shipping = getShippingDetails();
  const total = subtotal + shipping.feeAmount;

  if (shippingNote) {
    if (shipping.isConfirmedWithSeller) {
      shippingNote.classList.remove('hidden');
    } else {
      shippingNote.classList.add('hidden');
    }
  }

  if (subtotalEl) subtotalEl.textContent = `R ${subtotal}`;
  if (shippingFeeEl) {
    shippingFeeEl.textContent = shipping.cartFeeText;
  }
  if (totalEl) {
    totalEl.textContent = shipping.isConfirmedWithSeller
      ? `R ${subtotal} (+ delivery TBC)`
      : `R ${total}`;
  }
}

/* ========================================================================= */
/* CHECKOUT MODAL & ORDER SUBMISSION WITH FORM VALIDATION & STATES          */
/* ========================================================================= */
export function openCheckoutModal() {
  if (cart.length === 0) return;
  toggleCartDrawer(false);
  const modal = document.getElementById('checkout-modal');
  const summaryTotal = document.getElementById('checkout-summary-total');
  const summaryShipping = document.getElementById('checkout-summary-shipping');
  if (modal) modal.classList.remove('hidden');

  // Reset error states
  ['cust-name', 'cust-phone', 'cust-address'].forEach(id => {
    const input = document.getElementById(id);
    const err = document.getElementById(`err-${id}`);
    if (input) input.classList.remove('input-error');
    if (err) err.classList.add('hidden');
  });

  const subtotal = getCartSubtotal();
  const shipping = getShippingDetails();
  if (summaryTotal) {
    summaryTotal.textContent = shipping.isConfirmedWithSeller
      ? `R ${subtotal} (+ delivery TBC)`
      : `R ${subtotal + shipping.feeAmount}`;
  }
  if (summaryShipping) {
    summaryShipping.textContent = shipping.summaryLabel;
  }
  trackEvent('begin_checkout', { subtotal: subtotal, items_count: cart.length });
}

export function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleCheckoutSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const emailInput = document.getElementById('cust-email');
  const addressInput = document.getElementById('cust-address');
  const notesInput = document.getElementById('cust-notes');

  const errName = document.getElementById('err-cust-name');
  const errPhone = document.getElementById('err-cust-phone');
  const errAddress = document.getElementById('err-cust-address');

  let isValid = true;
  let firstInvalidInput = null;

  // Reset previous errors
  [nameInput, phoneInput, addressInput].forEach(inp => inp && inp.classList.remove('input-error'));
  [errName, errPhone, errAddress].forEach(err => err && err.classList.add('hidden'));

  // Validate Full Name
  if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
    isValid = false;
    nameInput.classList.add('input-error');
    if (errName) errName.classList.remove('hidden');
    if (!firstInvalidInput) firstInvalidInput = nameInput;
  }

  // Validate Phone (At least 7 digits)
  const cleanPhone = phoneInput.value.replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.length < 7) {
    isValid = false;
    phoneInput.classList.add('input-error');
    if (errPhone) errPhone.classList.remove('hidden');
    if (!firstInvalidInput) firstInvalidInput = phoneInput;
  }

  // Validate Address
  if (!addressInput.value.trim() || addressInput.value.trim().length < 5) {
    isValid = false;
    addressInput.classList.add('input-error');
    if (errAddress) errAddress.classList.remove('hidden');
    if (!firstInvalidInput) firstInvalidInput = addressInput;
  }

  if (!isValid) {
    if (firstInvalidInput) firstInvalidInput.focus();
    return;
  }

  // Show Button Loading Spinner
  const submitBtn = document.getElementById('checkout-submit-btn');
  const btnSpinner = document.getElementById('checkout-btn-spinner');
  const btnIcon = document.getElementById('checkout-btn-icon');
  const btnText = document.getElementById('checkout-btn-text');

  if (submitBtn) submitBtn.disabled = true;
  if (btnSpinner) btnSpinner.classList.remove('hidden');
  if (btnIcon) btnIcon.classList.add('hidden');
  if (btnText) btnText.textContent = "Formatting WhatsApp Order...";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput?.value.trim() || '';
  const address = addressInput.value.trim();
  const notes = notesInput?.value.trim() || '';

  const subtotal = getCartSubtotal();
  const shipping = getShippingDetails();
  const total = subtotal + shipping.feeAmount;
  const orderRef = `#NH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const deliveryLabel = shipping.label;
  const deliveryFeeDisplay = shipping.isConfirmedWithSeller ? 'To be confirmed with seller' : 'Free';
  const totalDisplay = shipping.isConfirmedWithSeller 
    ? `R ${subtotal} (Plus delivery to be confirmed with seller)` 
    : `R ${total}`;

  const hasTea = cart.some(i => (i.id && i.id.includes('ketepa')) || i.brand === 'KETEPA');
  const hasHoney = cart.some(i => !i.id || !i.id.includes('ketepa'));
  const orderCategoryHeader = (hasTea && hasHoney) 
    ? '🍯☕ NEW HONEY & TEA ORDER ☕🍯' 
    : (hasTea ? '☕ NEW KETEPA TEA ORDER ☕' : '🍯 NEW HONEY ORDER 🍯');

  const itemsText = cart.map(item => {
    const displayWeight = item.weight || (item.size ? `${item.size} Glass Jar` : '250g Pack');
    const prefix = ((item.id && item.id.includes('ketepa')) || item.brand === 'KETEPA') ? '☕ [Tea]' : '🍯 [Honey]';
    return `• ${item.qty}x ${prefix} ${item.name} (${displayWeight}) — R ${item.price * item.qty}`;
  }).join('\n');

  const utm = getUtmParams();
  let utmFooter = '';
  if (utm.utm_source || utm.utm_campaign) {
    utmFooter = `\n_Referral: ${utm.utm_source || 'direct'}${utm.utm_medium ? ' / ' + utm.utm_medium : ''}${utm.utm_campaign ? ' (' + utm.utm_campaign + ')' : ''}_`;
  }

  const message = 
`*${STORE_CONFIG.brandName.toUpperCase()} — ${orderCategoryHeader}*
----------------------------------------
*Order Reference:* ${orderRef}

👤 *CUSTOMER DETAILS:*
• *Name:* ${name}
• *Phone:* ${phone}
${email ? `• *Email:* ${email}\n` : ''}• *Delivery Address / Pickup Preference:* ${address}
${notes ? `• *Special Notes:* ${notes}\n` : ''}
🚚 *DELIVERY METHOD:*
• ${deliveryLabel}

📦 *ITEMS ORDERED:*
${itemsText}

💰 *PAYMENT SUMMARY:*
• Subtotal: R ${subtotal}
• Delivery: ${deliveryFeeDisplay}
• *Total (ZAR): ${totalDisplay}*
----------------------------------------
_Please confirm my order and share payment coordinates${shipping.isConfirmedWithSeller ? ' and delivery quote' : ''}. Thank you!_${utmFooter}`;

  const waUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

  // Save last order data for thank-you view
  lastOrderData = {
    orderRef: orderRef,
    customerName: name,
    phone: phone,
    address: address,
    items: [...cart],
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    waUrl: waUrl,
    totalDisplay: totalDisplay
  };

  trackEvent('whatsapp_order_sent', {
    order_ref: orderRef,
    subtotal: subtotal,
    total: total,
    items_count: cart.length
  });

  setTimeout(() => {
    // Open WhatsApp link safely
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Reset button state
    if (submitBtn) submitBtn.disabled = false;
    if (btnSpinner) btnSpinner.classList.add('hidden');
    if (btnIcon) btnIcon.classList.remove('hidden');
    if (btnText) btnText.textContent = "Send Order on WhatsApp";

    closeCheckoutModal();

    // Clear cart
    cart = [];
    saveCart();
    updateCartBadge();

    // Render Thank You View
    renderThankYouPage(lastOrderData);
    navigateTo('thank-you');

    showToast('Order Prepared for WhatsApp', `Ref: ${orderRef}`, 'success');
  }, 400);
}

export function renderThankYouPage(order) {
  if (!order) return;
  const refEl = document.getElementById('ty-order-ref');
  const shipEl = document.getElementById('ty-shipping-method');
  const itemsList = document.getElementById('ty-items-list');
  const totalEl = document.getElementById('ty-total-amount');
  const waBtn = document.getElementById('ty-whatsapp-resume-btn');

  if (refEl) refEl.textContent = order.orderRef;
  if (shipEl) shipEl.textContent = order.shipping.summaryLabel;
  if (totalEl) totalEl.textContent = order.shipping.isConfirmedWithSeller ? `R ${order.subtotal} (+ delivery TBC)` : `R ${order.total}`;
  if (waBtn) waBtn.href = order.waUrl;

  if (itemsList && order.items) {
    itemsList.innerHTML = order.items.map(item => `
      <div class="flex items-center justify-between text-amber/85 text-xs">
        <span>${item.qty}× ${item.name} (${item.weight || item.size})</span>
        <span class="font-bold tabular-nums">R ${item.price * item.qty}</span>
      </div>
    `).join('');
  }
}

export function instantWhatsAppOrder() {
  if (cart.length === 0) return;

  const subtotal = getCartSubtotal();
  const shipping = getShippingDetails();
  const total = subtotal + shipping.feeAmount;
  const totalDisplay = shipping.isConfirmedWithSeller 
    ? `R ${subtotal} (+ delivery to be confirmed with seller)` 
    : `R ${total} (ZAR)`;
  const deliveryFeeDisplay = shipping.isConfirmedWithSeller ? 'To be confirmed with seller' : 'Free';
  const orderRef = `#NH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const deliveryLabel = shipping.label;

  const itemsText = cart.map(item => {
    const displayWeight = item.weight || (item.size ? `${item.size} Glass Jar` : '500g Glass Jar');
    return `• ${item.qty}x ${item.name} (${displayWeight}) — R ${item.price * item.qty}`;
  }).join('\n');

  const message = 
`🍯 *${STORE_CONFIG.brandName.toUpperCase()} — QUICK CART ORDER* 🍯
----------------------------------------
*Order Reference:* ${orderRef}

Hi ${STORE_CONFIG.brandName}! I would like to place an order for the following items:

📦 *MY CART:*
${itemsText}

🚚 *DELIVERY PREFERENCE:*
• ${deliveryLabel}

💰 *ESTIMATED TOTAL:*
• Subtotal: R ${subtotal}
• Delivery: ${deliveryFeeDisplay}
• Total: ${totalDisplay}
----------------------------------------
_My delivery address / contact details:_ 
(Typing my address & details here...)`;

  const waUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');

  lastOrderData = {
    orderRef: orderRef,
    customerName: 'Direct Customer',
    phone: '',
    address: 'Sent directly via WhatsApp chat',
    items: [...cart],
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    waUrl: waUrl,
    totalDisplay: totalDisplay
  };

  toggleCartDrawer(false);
  cart = [];
  saveCart();
  updateCartBadge();

  renderThankYouPage(lastOrderData);
  navigateTo('thank-you');
  showToast('Opened in WhatsApp', `Ref: ${orderRef}`, 'success');
}

export function closeSuccessModal() {
  const successModal = document.getElementById('order-success-modal');
  if (successModal) successModal.classList.add('hidden');
  if (lastOrderData) {
    renderThankYouPage(lastOrderData);
    navigateTo('thank-you');
  } else {
    navigateTo('home');
  }
}

/* ========================================================================= */
/* CONNECT WITH US DROPDOWN                                                  */
/* ========================================================================= */
export function toggleConnectDropdown() {
  const menu = document.getElementById('connect-dropdown-menu');
  const caret = document.getElementById('connect-caret');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (caret) caret.classList.add('rotate-180');
  } else {
    menu.classList.add('hidden');
    if (caret) caret.classList.remove('rotate-180');
  }
}

document.addEventListener('click', (e) => {
  const container = document.getElementById('connect-dropdown-container');
  const menu = document.getElementById('connect-dropdown-menu');
  const caret = document.getElementById('connect-caret');
  if (container && !container.contains(e.target)) {
    if (menu && !menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      if (caret) caret.classList.remove('rotate-180');
    }
  }
});

export function toggleMobileMenu() {
  const mobileNav = document.getElementById('mobile-nav');
  const icon = document.getElementById('mobile-menu-icon');
  const btn = document.getElementById('mobile-menu-btn');
  if (mobileNav) {
    const isClosed = mobileNav.classList.contains('hidden');
    if (isClosed) {
      mobileNav.classList.remove('hidden');
      if (icon) icon.className = "ph ph-x text-2xl";
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      mobileNav.classList.add('hidden');
      if (icon) icon.className = "ph ph-list text-2xl";
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }
}

/* ========================================================================= */
/* TOAST NOTIFICATION SYSTEM                                                 */
/* ========================================================================= */
export function showToast(title, message, iconType = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `
    pointer-events-auto bg-white border border-[#BEB3A0] shadow-luxury rounded-xl p-4 
    flex items-start gap-3 w-80 max-w-full transform transition-all duration-300 
    translate-y-8 opacity-0
  `;

  let iconMarkup = '<i class="ph ph-check-circle text-gold text-xl"></i>';
  if (iconType === 'cart') {
    iconMarkup = '<i class="ph ph-handbag text-gold text-xl"></i>';
  } else if (iconType === 'info') {
    iconMarkup = '<i class="ph ph-info text-slate text-xl"></i>';
  }

  toast.innerHTML = `
    <div class="shrink-0 mt-0.5">${iconMarkup}</div>
    <div class="flex-1 min-w-0">
      <h5 class="text-xs font-bold text-amber-deep font-bahnschrift">${title}</h5>
      <p class="text-[11px] text-[#877C6B] mt-0.5 leading-snug truncate">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-amber/40 hover:text-amber text-xs p-0.5" aria-label="Dismiss toast">
      <i class="ph ph-x"></i>
    </button>
  `;

  container.appendChild(toast);

  // Animate entrance
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-8', 'opacity-0');
  });

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 3500);
}

/* ========================================================================= */
/* 📜 SCROLL PROGRESS & BACK TO TOP LISTENERS                                */
/* ========================================================================= */
export function initScrollListeners() {
  const progressBar = document.getElementById('scroll-progress-bar');
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const header = document.getElementById('site-header');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(progress));
    }

    if (backToTopBtn) {
      if (scrollTop > 260) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100', 'pointer-events-auto');
      } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto');
      }
    }

    if (header) {
      if (scrollTop > 20) {
        header.classList.add('shadow-md', 'bg-white/95');
        header.classList.remove('bg-white/90');
      } else {
        header.classList.remove('shadow-md', 'bg-white/95');
        header.classList.add('bg-white/90');
      }
    }
  }, { passive: true });
}

/* ========================================================================= */
/* 🍪 COOKIE UTILITY & PRIVACY CONSENT MANAGEMENT                            */
/* ========================================================================= */
export function setCookie(name, value, days = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    localStorage.setItem(name, value);
  } catch (e) {}
}

export function getCookie(name) {
  try {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return localStorage.getItem(name);
  } catch (e) {
    return null;
  }
}

export function showCookieBanner() {
  const banner = document.getElementById('cookie-consent-popup');
  if (!banner) return;
  banner.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  banner.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
}

export function hideCookieBanner() {
  const banner = document.getElementById('cookie-consent-popup');
  if (!banner) return;
  banner.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
  banner.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
}

export function acceptCookies() {
  setCookie('nectar_cookie_consent', 'accepted', 365);
  hideCookieBanner();
  showToast('Cookies Accepted', 'Your browsing and checkout bag preferences are saved.', 'success');
}

export function rejectCookies() {
  setCookie('nectar_cookie_consent', 'rejected', 365);
  hideCookieBanner();
  showToast('Cookies Declined', 'Non-essential cookies have been disabled.', 'info');
}

export function openCookieBanner() {
  showCookieBanner();
}

export function checkCookieConsent() {
  const consent = getCookie('nectar_cookie_consent');
  if (!consent) {
    setTimeout(() => {
      showCookieBanner();
    }, 800);
  }
}

/* ========================================================================= */
/* HASH CHANGE ROUTING SUPPORT                                               */
/* ========================================================================= */
export function handleHashChange() {
  const hash = window.location.hash.replace('#', '');

  if (!hash || hash === 'home') {
    navigateTo('home', null, false);
  } else if (hash === 'shop') {
    navigateTo('shop', null, false);
  } else if (hash === 'tea') {
    navigateTo('tea', null, false);
  } else if (hash.startsWith('pdp-')) {
    const pId = hash.replace('pdp-', '');
    navigateTo('pdp', pId, false);
  } else if (hash === 'thank-you') {
    navigateTo('thank-you', null, false);
  } else if (hash === 'privacy') {
    navigateTo('privacy', null, false);
  } else if (hash === 'terms') {
    navigateTo('terms', null, false);
  } else if (hash === 'process') {
    handleScrollTo('process');
  } else {
    navigateTo('404', null, false);
  }
}

window.addEventListener('hashchange', handleHashChange);

/* ========================================================================= */
/* INITIALIZATION                                                            */
/* ========================================================================= */
export function initializeApp() {
  initUtmTracking();
  initScrollListeners();
  updateCartBadge();
  checkCookieConsent();
  handleHashChange();
  startFeaturedAutoplay();
  renderTeaProducts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/* ========================================================================= */
/* 🌐 GLOBAL WINDOW ATTACHMENTS (FOR HTML INLINE HANDLERS)                    */
/* ========================================================================= */
window.STORE_CONFIG = STORE_CONFIG;
window.products = products;
window.getSizePricing = getSizePricing;
window.getActiveProductSize = getActiveProductSize;
window.findProduct = findProduct;
window.selectFeaturedSize = selectFeaturedSize;
window.addFeaturedToCart = addFeaturedToCart;
window.selectProductCardSize = selectProductCardSize;
window.updatePageMeta = updatePageMeta;
window.initUtmTracking = initUtmTracking;
window.getUtmParams = getUtmParams;
window.trackEvent = trackEvent;
window.navigateTo = navigateTo;
window.handlePdpBack = handlePdpBack;
window.setTeaFilterCategory = setTeaFilterCategory;
window.handleTeaSortChange = handleTeaSortChange;
window.renderTeaProducts = renderTeaProducts;
window.showFeaturedSlide = showFeaturedSlide;
window.nextFeaturedSlide = nextFeaturedSlide;
window.prevFeaturedSlide = prevFeaturedSlide;
window.startFeaturedAutoplay = startFeaturedAutoplay;
window.pauseFeaturedAutoplay = pauseFeaturedAutoplay;
window.resumeFeaturedAutoplay = resumeFeaturedAutoplay;
window.handleScrollTo = handleScrollTo;
window.setFilterCategory = setFilterCategory;
window.handleSortChange = handleSortChange;
window.renderShopProducts = renderShopProducts;
window.openProductModal = openProductModal;
window.renderProductDetailView = renderProductDetailView;
window.selectPdpSize = selectPdpSize;
window.handlePdpAddToCart = handlePdpAddToCart;
window.changePdpQty = changePdpQty;
window.toggleCartDrawer = toggleCartDrawer;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.saveCart = saveCart;
window.updateCartBadge = updateCartBadge;
window.promptRemoveFromCart = promptRemoveFromCart;
window.executeRemoveCartItem = executeRemoveCartItem;
window.cancelRemoveCartItem = cancelRemoveCartItem;
window.handleShippingChange = handleShippingChange;
window.getCartSubtotal = getCartSubtotal;
window.getShippingDetails = getShippingDetails;
window.renderCart = renderCart;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.handleCheckoutSubmit = handleCheckoutSubmit;
window.renderThankYouPage = renderThankYouPage;
window.instantWhatsAppOrder = instantWhatsAppOrder;
window.closeSuccessModal = closeSuccessModal;
window.toggleConnectDropdown = toggleConnectDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;
window.initScrollListeners = initScrollListeners;
window.setCookie = setCookie;
window.getCookie = getCookie;
window.showCookieBanner = showCookieBanner;
window.hideCookieBanner = hideCookieBanner;
window.acceptCookies = acceptCookies;
window.rejectCookies = rejectCookies;
window.openCookieBanner = openCookieBanner;
window.checkCookieConsent = checkCookieConsent;
window.handleHashChange = handleHashChange;
window.initializeApp = initializeApp;
