/**
 * Shah Taam - Cart & Checkout Drawer Module (cart.js)
 * High-performance, isolated cart drawer with GitHub API sync & persistent state.
 */

(function () {
  'use strict';

  // 1. FAST PRELOAD FONTS FROM GITHUB REPOSITORY (HIGHEST PRIORITY)
  const fontFiles = [
    'https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Regular.woff2',
    'https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Medium.woff2',
    'https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Bold.woff2'
  ];

  fontFiles.forEach(url => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      document.head.appendChild(link);
    }
  });

  // 2. INJECT DRAWER & FONT STYLES EXACTLY MATCHING DESIGN SYSTEM
  const drawerStyles = `
    @font-face {
      font-family: 'Vazirmatn';
      src: url('https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Vazirmatn';
      src: url('https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Vazirmatn';
      src: url('https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/webfonts/Vazirmatn-FD-NL-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    .drawer-slider {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .checkout-step-2 .drawer-slider {
      transform: translateX(50%);
    }
    .card-added-glow {
      box-shadow: 0 0 24px rgba(211, 84, 0, 0.45), 0 0 0 1.5px #d35400 !important;
      transform: scale(1.018);
      border-color: #d35400 !important;
    }
    .header-cart-badge, .cart-count-badge, #cart-nav-badge {
      transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease !important;
      will-change: transform;
    }
    .cart-pop-scale {
      transform: scale(1.16) !important;
      transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = drawerStyles;
  document.head.appendChild(styleEl);

  // 3. CART DRAWER & CHECKOUT FORM HTML MARKUP INJECTION
  const cartMarkup = `
  <div class="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 opacity-0 invisible" id="cart-drawer-overlay">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" id="cart-backdrop"></div>
    <div class="relative max-w-[1280px] w-full h-full mx-auto overflow-hidden pointer-events-none">
      <aside class="absolute top-0 right-0 h-full w-[400px] max-w-full bg-[#131313] border-l border-[#d35400]/20 shadow-2xl z-10 pointer-events-auto transition-transform duration-300 ease-in-out transform translate-x-full flex flex-col overflow-hidden" id="cart-drawer">
        <div class="drawer-slider flex flex-row w-[200%] h-full">
          <!-- Step 1: Cart Items Panel -->
          <div class="w-1/2 h-full flex flex-col justify-between flex-shrink-0 bg-[#131313]">
            <div class="p-6 border-b border-surface-container-high flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <button class="text-on-surface-variant hover:text-secondary transition-colors p-1 cursor-pointer" id="close-cart-btn" title="بستن سبد خرید" type="button">
                  <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 class="text-headline-lg font-bold text-secondary flex items-center gap-2">
                  <span>سبد خرید</span>
                  <span class="text-sm font-normal text-on-surface-variant">(<span class="cart-count-badge font-medium text-on-surface-variant" id="drawer-cart-count">۰</span> طعم)</span>
                </h2>
              </div>
              <div class="text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded border border-surface-variant/40">
                مرحله ۱ از ۲
              </div>
            </div>
            
            <!-- Items Scroll -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <div class="space-y-4 flex-col hidden" id="cart-items-list" style="display: none;"></div>
              <div class="flex flex-col items-center justify-center text-center pt-[45px] pb-8 text-on-surface-variant gap-3" id="empty-cart-msg" style="display: flex;">
                <div class="bg-[#232323] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto shadow-2xl backdrop-blur-md">
                  <div class="w-16 h-16 rounded-full bg-[#37332c] border border-[#c97a3e]/30 flex items-center justify-center mb-4 text-[#e9c176] shadow-[0_0_16px_rgba(211,84,0,0.18)]">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  </div>
                  <h3 class="font-bold text-[#e9c176] text-base mb-1.5">سبد خرید شما خالی است</h3>
                  <p class="text-[#e2bfb4] text-sm leading-relaxed mb-6 font-normal">محصولات ما را بررسی کرده<br/>و طعم و عطر اصیل را به سبد خود بیفزایید</p>
                  <button class="group bg-[#d35400] hover:bg-[#b04600] text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#d35400]/20 active:scale-95 text-sm cursor-pointer w-full" id="empty-explore-btn" type="button">
                    <span>مشاهده طعم‌ها</span>
                    <svg class="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 1 Footer -->
            <div class="p-6 border-t border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-md shrink-0 space-y-4">
              <div class="space-y-2 text-label-sm">
                <div class="flex justify-between items-center text-on-surface-variant">
                  <span>جمع کل اقلام:</span>
                  <span class="text-[#e9c176] font-bold text-headline-lg"><span id="cart-total">۰</span> <span class="text-sm font-normal text-[#e9c176] mr-1">تومان</span></span>
                </div>
                <div class="justify-between items-center text-on-surface-variant hidden" id="cart-shipping-row">
                  <span>هزینه ارسال:</span>
                  <span class="text-secondary font-medium">رایگان</span>
                </div>
                <div class="pt-3 pb-1 border-t border-surface-container-high flex justify-between items-center text-headline-lg font-bold text-on-surface">
                  <span class="font-semibold text-body-lg text-white">مبلغ قابل پرداخت:</span>
                  <span class="text-white flex items-baseline gap-1.5">
                    <span class="font-extrabold text-white tracking-tight text-display-lg-mobile" id="cart-payable">۰</span>
                    <span class="text-body-lg font-medium text-white">تومان</span>
                  </span>
                </div>
              </div>
              <div class="flex flex-col gap-2.5 pt-2">
                <button class="w-full py-3.5 px-4 bg-burnt-copper hover:bg-primary-container rounded text-center shadow-lg flex items-center justify-center gap-2 group transition-all duration-300 text-white font-bold text-body-lg opacity-50 cursor-not-allowed" disabled id="proceed-checkout-btn" type="button">
                  <span class="text-[20px] font-extrabold tracking-wide">ثبت سفارش و ادامه</span>
                  <svg class="w-5 h-5 shrink-0 transition-transform duration-300 ease-in-out group-hover:-translate-x-1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                </button>
                <a class="w-full py-2.5 px-4 text-on-surface-variant hover:text-secondary text-label-sm text-center transition-colors cursor-pointer block" href="shop.html" id="continue-shopping-btn">
                  ادامه خرید از فروشگاه
                </a>
              </div>
            </div>
          </div>

          <!-- Step 2: Checkout Information Panel -->
          <div class="w-1/2 h-full flex flex-col justify-between flex-shrink-0 bg-[#131313]">
            <div class="p-6 border-b border-surface-container-high flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <button class="text-on-surface-variant hover:text-secondary transition-colors p-1 cursor-pointer flex items-center gap-1 text-label-sm" id="back-to-cart-btn" title="بازگشت به سبد خرید" type="button">
                  <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
                </button>
                <h2 class="text-headline-lg font-bold text-secondary">ارسال اطلاعات</h2>
              </div>
              <div class="text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded border border-surface-variant/40">
                مرحله ۲ از ۲
              </div>
            </div>

            <!-- Checkout Form -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4 text-label-sm">
              <div class="hidden p-3 rounded bg-error-container/20 border border-error/40 text-error text-xs" id="form-error-msg"></div>
              <div class="space-y-1.5">
                <label class="block text-on-surface-variant" for="field-name">نام و نام خانوادگی <span class="text-burnt-copper">*</span></label>
                <input class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors" id="field-name" placeholder="مثال: علی احمدی" type="text"/>
                <p class="hidden text-error text-xs mt-1" id="error-name">لطفاً نام خود را به طور کامل وارد کنید.</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-on-surface-variant" for="field-phone">شماره تماس <span class="text-burnt-copper">*</span></label>
                <input class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors text-right" dir="ltr" id="field-phone" inputmode="numeric" maxlength="11" placeholder="۰۹۱۲۳۴۵۶۷۸۹" type="tel"/>
                <p class="hidden text-error text-xs mt-1" id="error-phone">شماره تماس باید ۱۱ رقمی و با ۰۹ شروع شود.</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="block text-on-surface-variant" for="field-province">استان <span class="text-burnt-copper">*</span></label>
                  <input class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors" id="field-province" placeholder="مثال: تهران" type="text"/>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-on-surface-variant" for="field-city">شهر <span class="text-burnt-copper">*</span></label>
                  <input class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors" id="field-city" placeholder="مثال: تهران" type="text"/>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-on-surface-variant" for="field-postal">کد پستی <span class="text-burnt-copper">*</span></label>
                <input class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors text-right" dir="ltr" id="field-postal" maxlength="10" placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰" type="text"/>
                <p class="hidden text-error text-xs mt-1" id="error-postal">کد پستی معتبر ۱۰ رقمی وارد کنید.</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-on-surface-variant" for="field-address">آدرس دقیق پستی <span class="text-burnt-copper">*</span></label>
                <textarea class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors leading-relaxed" id="field-address" placeholder="خیابان، کوچه، پلاک، واحد" rows="2"></textarea>
                <p class="hidden text-error text-xs mt-1" id="error-address">لطفاً نشانی کامل پستی خود را بنویسید.</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-on-surface-variant" for="field-notes">توضیحات سفارش (اختیاری)</label>
                <textarea class="w-full bg-surface-container-lowest border border-surface-variant rounded px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors leading-relaxed" id="field-notes" placeholder="هر گونه توضیح در مورد نحوه ارسال و..." rows="2"></textarea>
              </div>
            </div>

            <!-- Step 2 Footer -->
            <div class="p-6 border-t border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-md shrink-0 space-y-3">
              <button class="w-full py-3.5 px-4 bg-burnt-copper hover:bg-primary-container text-white font-bold text-headline-lg rounded text-center transition-colors shadow-lg flex items-center justify-center gap-2 group opacity-50 cursor-not-allowed" disabled id="final-payment-btn" type="button">
                <span>پرداخت نهایی</span>
                <svg class="w-6 h-6 shrink-0 pointer-events-none transform transition-transform duration-300 ease-in-out group-hover:-translate-x-1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="14" rx="2" width="20" x="2" y="5"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
              </button>
              <p class="text-center text-xs mt-3 flex items-center justify-center gap-1.5 text-[#e0c0b2]">
                <svg class="w-3.5 h-3.5 inline-block text-[#e0c0b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
                <span>پرداخت امن بانکی در شبکه شتاب</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
  `;

  function initMarkup() {
    if (!document.getElementById('cart-drawer-overlay')) {
      const container = document.createElement('div');
      container.innerHTML = cartMarkup;
      document.body.appendChild(container.firstElementChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarkup);
  } else {
    initMarkup();
  }

  // 4. DATA & CATALOG MANAGEMENT FROM GITHUB REPOSITORY
  const fallbackCatalog = [
    { id: 1, title: "ادویه خورشت", category: "blends", categoryName: "ترکیبات خاص", price: 370000, description: "عمق طعم مادری", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-خورشت.jpg" },
    { id: 2, title: "ادویه فلافل", category: "blends", categoryName: "ترکیبات خاص", price: 270000, description: "طعم خاص جنوبی و ترد", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-فلافل.jpg" },
    { id: 3, title: "ادویه قرمه سبزی", category: "blends", categoryName: "ترکیبات خاص", price: 450000, description: "ملایم و معطر", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-قرمه-سبزی.jpg" },
    { id: 4, title: "ادویه ماکارونی", category: "blends", categoryName: "ترکیبات خاص", price: 330000, description: "سبک و ملایم", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-ماکارونی.jpg" },
    { id: 5, title: "ادویه مرغ", category: "blends", categoryName: "ترکیبات خاص", price: 500000, description: "طعم دودی ملایم با رگه‌های زعفرانی", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-مرغ.jpg" },
    { id: 6, title: "ادویه پاپریکا", category: "base", categoryName: "ادویه‌های پایه", price: 210000, description: "دودی و شیرین‌مزه", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/پاپریکا-شاه-طعم.jpg" },
    { id: 7, title: "زردچوبه اعلا", category: "base", categoryName: "ادویه‌های پایه", price: 180000, description: "طلایی با طعم ملایم", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/زردچوبه-شاه-طعم.jpg" },
    { id: 8, title: "ادویه کاری", category: "base", categoryName: "ادویه‌های پایه", price: 290000, description: "ترش و گس‌نما", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/ادویه-کاری-شاه-طعم.jpg" },
    { id: 9, title: "ادویه غذای دریایی", category: "blends", categoryName: "ترکیبات خاص", price: 350000, description: "گرم و ملایم", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/محصول-ادویه-غذای-دریایی.jpg" },
    { id: 10, title: "فلفل سیاه دانه‌درشت", category: "base", categoryName: "ادویه‌های پایه", price: 185000, description: "تیز و عطری", image: "https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/فلفل-سیاه-شاه-طعم.jpg" },
    { id: 11, title: "پک هدیه امپریال", category: "gifts", categoryName: "پک‌های هدیه", price: 1200000, description: "کلکسیون نفیس ادویه‌های ناب و برگزیده", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgGsWSPzoZ9sk61At0huIG_9C2r7x7N9tSz2C0w3hqDnJVHMsBK1UWDB0BQ2NLENDMOBKSA8w0g8nq7-E5lQFDUQaKmxAug9YHihiEaK27AwdUn2NSdNRuvmaqtiBQDdvJnzaNAeua-PuShYtWrQSGk1LeUD1ZTQXqM1I5AtWS2mV7wAPJmDLLnOQioHKuJLIze5G7WlLFxe1E42SQJ-3PzoZr8mA9MRayb4P4fG2b_ZdO5e61gBI" }
  ];

  window.shahtameCatalog = [...fallbackCatalog];

  // Cart State Initialization
  let cart = [];
  try {
    const stored = localStorage.getItem('shahtame_cart');
    if (stored) cart = JSON.parse(stored);
  } catch (e) {
    cart = [];
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem('shahtame_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }

  // Real-time synchronization across pages & tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'shahtame_cart') {
      try {
        cart = JSON.parse(e.newValue) || [];
      } catch {
        cart = [];
      }
      renderCart();
    }
  });

  // Persian Number Helpers
  const formatPrice = num => (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const formatNumber = num => (num || 0).toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  function resolveImageUrl(url) {
    if (!url) return '';
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    return `https://raw.githubusercontent.com/sadeghghafuri/shahtame/main/images/${clean.replace(/^\.?\/*images\//, '')}`;
  }

  function parseMarkdownFrontmatter(mdText) {
    const meta = {};
    let body = mdText;
    const match = mdText.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---([\s\S]*)$/);
    if (match) {
      match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        }
      });
      body = match[2].trim();
    }
    return { meta, body };
  }

  // Synchronize product information across all cards on the page (index carousel & shop grid)
  function syncProductsOnPage(prods) {
    if (!Array.isArray(prods) || prods.length === 0) return;

    document.querySelectorAll('.product-card').forEach(card => {
      const titleEl = card.querySelector('h3');
      const rawTitle = titleEl ? titleEl.textContent.trim() : '';
      const addBtn = card.querySelector('.add-to-cart-btn');
      const btnId = addBtn ? addBtn.dataset.id : null;
      const btnTitle = addBtn ? addBtn.dataset.title : '';

      const normalize = s => (s || '').replace(/\s+/g, ' ').trim();
      const cardNorm = normalize(rawTitle);
      const btnNorm = normalize(btnTitle);

      const match = prods.find(p => {
        const pNorm = normalize(p.title);
        return (cardNorm && (pNorm === cardNorm || cardNorm.includes(pNorm) || pNorm.includes(cardNorm))) ||
               (btnNorm && (pNorm === btnNorm || btnNorm.includes(pNorm))) ||
               (btnId && String(p.id) === String(btnId));
      });

      if (match) {
        // Update Title
        if (titleEl && match.title) {
          titleEl.textContent = match.title;
        }

        // Update Subtitle / Description
        let descEl = card.querySelector('p');
        if (descEl && match.description) {
          descEl.textContent = match.description;
        } else if (!descEl && match.description && titleEl) {
          descEl = document.createElement('p');
          descEl.className = 'font-label-sm text-xs text-on-surface-variant mb-2';
          descEl.textContent = match.description;
          titleEl.insertAdjacentElement('afterend', descEl);
        }

        // Update Price text
        const priceEl = card.querySelector('.text-secondary');
        if (priceEl && match.price) {
          priceEl.textContent = formatPrice(match.price) + ' تومان';
        }

        // Update Image
        const imgEl = card.querySelector('img');
        if (imgEl && match.image) {
          if (!imgEl.src || !imgEl.src.includes(encodeURI(match.image.split('/').pop()))) {
            imgEl.src = match.image;
          }
          imgEl.alt = match.title;
        }

        // Update Add to Cart Button dataset attributes
        if (addBtn) {
          addBtn.dataset.id = match.id;
          addBtn.dataset.title = match.title;
          addBtn.dataset.price = match.price;
          addBtn.dataset.img = match.image;
          addBtn.dataset.description = match.description || '';
        }
      }
    });

    // Synchronize active cart items with latest data from GitHub
    let cartModified = false;
    cart.forEach(item => {
      const match = prods.find(p => p.id === item.id || p.title === item.title);
      if (match) {
        if (item.price !== match.price || item.title !== match.title || item.image !== match.image || (match.description && item.description !== match.description)) {
          item.price = match.price;
          item.title = match.title;
          item.image = match.image;
          if (match.description) item.description = match.description;
          cartModified = true;
        }
      }
    });
    if (cartModified) {
      renderCart();
    }
  }
  window.syncProductsOnPage = syncProductsOnPage;

  // Dynamic GitHub Fetching
  async function fetchGitHubProducts() {
    try {
      const res = await fetch('https://api.github.com/repos/sadeghghafuri/shahtame/contents/content/products');
      if (!res.ok) throw new Error('GitHub fetch failed');
      const files = await res.json();
      if (!Array.isArray(files)) throw new Error('Invalid GitHub response');

      const mdFiles = files.filter(f => f.name.endsWith('.md'));
      const prods = await Promise.all(mdFiles.map(async (file, idx) => {
        try {
          const fileRes = await fetch(file.download_url);
          const text = await fileRes.text();
          const { meta, body } = parseMarkdownFrontmatter(text);
          const priceNum = parseInt((meta.price || '0').toString().replace(/[^\d]/g, ''), 10) || 100000;
          const rawCat = (meta.category || '').trim();
          const isBlend = rawCat.includes('ترکیب') || rawCat.includes('blend') || rawCat.includes('خاص');
          const isGift = rawCat.includes('gift') || rawCat.includes('هدیه') || rawCat.includes('پک');
          return {
            id: idx + 1,
            title: meta.title || file.name.replace('.md', ''),
            price: priceNum,
            category: isBlend ? 'blends' : (isGift ? 'gifts' : 'base'),
            categoryName: isBlend ? 'ترکیبات خاص' : (isGift ? 'پک‌های هدیه' : 'ادویه‌های پایه'),
            rawCategory: rawCat,
            image: resolveImageUrl(meta.image),
            description: (meta.description || meta.desc || body || '').trim(),
            body: body
          };
        } catch {
          return null;
        }
      }));

      const validProds = prods.filter(Boolean);
      if (validProds.length > 0) {
        window.shahtameCatalog = validProds;
        syncProductsOnPage(validProds);
        window.dispatchEvent(new CustomEvent('shahtame:catalog-loaded', { detail: validProds }));
      }
    } catch (err) {
      console.warn('Cart module loaded fallback products catalog.');
      syncProductsOnPage(fallbackCatalog);
    }
  }

  // 5. CART DRAWER RENDERER & UI STATE UPDATE
  function renderCart() {
    saveCartToStorage();

    const cartList = document.getElementById('cart-items-list');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const totalEl = document.getElementById('cart-total');
    const payableEl = document.getElementById('cart-payable');
    const proceedBtn = document.getElementById('proceed-checkout-btn');
    const drawerBadge = document.getElementById('drawer-cart-count');
    const shippingRow = document.getElementById('cart-shipping-row');

    // Header Badges Sync across index.html and shop.html
    const navBadges = document.querySelectorAll('#cart-nav-badge, .header-cart-badge');

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (drawerBadge) drawerBadge.textContent = formatNumber(totalQuantity);
    
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = formatNumber(totalQuantity);
    });

    navBadges.forEach(badge => {
      badge.textContent = formatNumber(totalQuantity);
      if (totalQuantity > 0) {
        badge.style.display = 'inline-flex';
        badge.classList.remove('hidden');
      } else {
        badge.style.display = 'none';
        badge.classList.add('hidden');
      }
    });

    if (totalEl) totalEl.textContent = formatPrice(totalPrice);
    if (payableEl) payableEl.textContent = formatPrice(totalPrice);

    if (shippingRow) {
      shippingRow.classList.toggle('hidden', totalQuantity < 4);
      shippingRow.classList.toggle('flex', totalQuantity >= 4);
    }

    if (cart.length > 0) {
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (cartList) {
        cartList.style.display = 'flex';
        cartList.classList.remove('hidden');
        cartList.innerHTML = '';

        cart.forEach(item => {
          const itemTotal = item.price * item.quantity;
          const itemEl = document.createElement('div');
          itemEl.className = 'cart-item flex gap-3.5 p-3.5 rounded-xl bg-[#1e1e1e] border border-surface-variant/50 hover:border-aged-gold/40 transition-colors relative group shadow-sm';
          itemEl.dataset.id = item.id;
          
          itemEl.innerHTML = `
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-surface-container border border-surface-variant/40 flex-shrink-0 relative">
              <img class="w-full h-full object-cover" src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuCjo0drPsrPLiAbhSJeky3ROxSS11vYQFOuj759H9qXjsLRDQMdAcybSsN9ckwrGP_vv_U7O57jdwq11OI8Zh4gaOo3KF80Bo79UanSbQSLYY3zsCD7NaHNn5n3kE0fMKncoZZnE8uexRoh0gfYfZGRWA1HTn1-kNRUwkQ-AybLRr9uV8RBOslNY9IBK-d1GKjxyywKzs34Y98Umon7yf9MzRFCiGxog_QiuTD1tRi33K010M8oA2g';">
            </div>
            <div class="flex flex-col justify-between flex-1 py-0.5">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <h3 class="text-body-md text-on-surface font-medium leading-tight line-clamp-1">${item.title}</h3>
                  ${item.description ? `<p class="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">${item.description}</p>` : ''}
                </div>
                <button class="delete-cart-item text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer" data-id="${item.id}" title="حذف از سبد" type="button">
                  <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                </button>
              </div>
              <div class="flex justify-between items-end mt-2.5">
                <div class="flex items-center gap-1.5 bg-[#141414] rounded-lg border border-surface-variant/70 px-2 py-0.5">
                  <button class="decrease-cart-item text-on-surface hover:text-burnt-copper transition-colors p-1 cursor-pointer ${item.quantity <= 1 ? 'opacity-40' : ''}" data-id="${item.id}" type="button" title="کاهش">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"></path></svg>
                  </button>
                  <span class="text-sm text-secondary min-w-[22px] text-center font-bold">${formatNumber(item.quantity)}</span>
                  <button class="increase-cart-item text-on-surface hover:text-burnt-copper transition-colors p-1 cursor-pointer" data-id="${item.id}" type="button" title="افزایش">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                  </button>
                </div>
                <div class="text-left rtl:text-right">
                  <span class="text-body-md font-bold text-aged-gold">${formatPrice(itemTotal)}</span>
                  <span class="text-xs text-on-surface-variant mr-1">تومان</span>
                </div>
              </div>
            </div>
          `;
          cartList.appendChild(itemEl);
        });
      }

      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        proceedBtn.classList.add('cursor-pointer');
      }
    } else {
      if (cartList) {
        cartList.innerHTML = '';
        cartList.style.display = 'none';
        cartList.classList.add('hidden');
      }
      if (emptyMsg) {
        emptyMsg.style.display = 'flex';
        emptyMsg.classList.remove('hidden');
      }

      if (proceedBtn) {
        proceedBtn.disabled = true;
        proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
        proceedBtn.classList.remove('cursor-pointer');
      }
    }
  }

  // 6. EXPOSED GLOBAL CART CONTROLLERS
  window.openCart = function () {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay) {
      overlay.classList.remove('invisible', 'opacity-0', 'pointer-events-none');
      overlay.classList.add('visible', 'opacity-100', 'pointer-events-auto');
    }
    if (drawer) {
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0');
      drawer.classList.remove('checkout-step-2');
    }
    document.body.style.overflow = 'hidden';
  };

  window.closeCart = function () {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.add('translate-x-full');
      drawer.classList.remove('translate-x-0');
    }
    if (overlay) {
      overlay.classList.remove('opacity-100', 'pointer-events-auto');
      overlay.classList.add('opacity-0', 'pointer-events-none');
    }
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('invisible');
      }
      document.body.style.overflow = '';
      if (drawer) drawer.classList.remove('checkout-step-2');
    }, 300);
  };

  window.addToCart = function (productOrId) {
    let prod = null;
    if (typeof productOrId === 'object' && productOrId !== null) {
      prod = productOrId;
    } else {
      const idNum = Number(productOrId);
      prod = (window.shahtameCatalog || []).find(p => p.id === idNum) || 
             (window.catalog || []).find(p => p.id === idNum);
    }

    if (!prod) return;

    const existingIndex = cart.findIndex(item => item.id === prod.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
      if (prod.description && !cart[existingIndex].description) {
        cart[existingIndex].description = prod.description;
      }
    } else {
      cart.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        image: prod.image,
        description: prod.description || '',
        quantity: 1
      });
    }

    renderCart();

    // Micro interaction animation on header cart badge (smooth gentle pulse)
    const navBadges = document.querySelectorAll('#cart-nav-badge, .header-cart-badge');
    navBadges.forEach(badge => {
      badge.classList.remove('cart-pop-scale');
      void badge.offsetWidth; // smooth re-trigger
      badge.classList.add('cart-pop-scale');
      setTimeout(() => badge.classList.remove('cart-pop-scale'), 320);
    });
  };

  function updateCartQuantity(productId, delta) {
    const existingIndex = cart.findIndex(item => item.id === Number(productId));
    if (existingIndex === -1) return;

    if (delta < 0) {
      if (cart[existingIndex].quantity > 1) {
        cart[existingIndex].quantity -= 1;
      } else {
        return;
      }
    } else {
      cart[existingIndex].quantity += delta;
    }

    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== Number(productId));
    renderCart();
  }

  // 7. CHECKOUT FORM VALIDATION & STEP SLIDER
  function validateField(input, errorEl, condition) {
    if (!input) return false;
    if (input.value.trim() === '') {
      input.classList.remove('border-error', 'border-secondary');
      input.classList.add('border-surface-variant');
      if (errorEl) errorEl.classList.add('hidden');
      return false;
    }
    if (condition) {
      input.classList.remove('border-error', 'border-surface-variant');
      input.classList.add('border-secondary');
      if (errorEl) errorEl.classList.add('hidden');
      return true;
    }
    input.classList.remove('border-secondary', 'border-surface-variant');
    input.classList.add('border-error');
    if (errorEl) errorEl.classList.remove('hidden');
    return false;
  }

  function validateForm() {
    const fieldName = document.getElementById('field-name');
    const fieldPhone = document.getElementById('field-phone');
    const fieldPostal = document.getElementById('field-postal');
    const fieldAddress = document.getElementById('field-address');
    const finalPaymentBtn = document.getElementById('final-payment-btn');
    const errorPhone = document.getElementById('error-phone');
    const errorPostal = document.getElementById('error-postal');

    if (!fieldName || !fieldPhone || !fieldPostal || !fieldAddress) return false;

    const nameVal = fieldName.value.trim();
    const phoneVal = fieldPhone.value.trim();
    const postalVal = fieldPostal.value.trim();
    const addressVal = fieldAddress.value.trim();

    const isNameValid = nameVal.length >= 2;
    const isPhoneValid = /^09\d{9}$/.test(phoneVal);
    const isPostalValid = /^\d{10}$/.test(postalVal);
    const isAddressValid = addressVal.length >= 5;

    fieldName.classList.toggle('border-secondary', isNameValid && nameVal !== '');
    fieldAddress.classList.toggle('border-secondary', isAddressValid && addressVal !== '');

    const phoneOk = validateField(fieldPhone, errorPhone, isPhoneValid);
    const postalOk = validateField(fieldPostal, errorPostal, isPostalValid);

    const isValid = isNameValid && phoneOk && postalOk && isAddressValid;
    if (finalPaymentBtn) {
      finalPaymentBtn.disabled = !isValid;
      finalPaymentBtn.classList.toggle('opacity-50', !isValid);
      finalPaymentBtn.classList.toggle('cursor-not-allowed', !isValid);
    }
    return isValid;
  }

  // 8. GLOBAL EVENT DELEGATION
  document.addEventListener('click', (e) => {
    // Continue shopping button - close cart and navigate to shop.html
    const continueBtn = e.target.closest('#continue-shopping-btn');
    if (continueBtn) {
      window.closeCart();
      if (!window.location.pathname.endsWith('shop.html')) {
        window.location.href = 'shop.html';
      }
      return;
    }

    // Backdrop / Close actions
    if (e.target.id === 'cart-backdrop' || e.target.closest('#close-cart-btn') || e.target.closest('#empty-explore-btn')) {
      window.closeCart();
      return;
    }

    // Add to cart buttons (Supports shop.html, index.html & drawer)
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      e.preventDefault();
      const id = addBtn.dataset.id;
      let targetProd = (window.shahtameCatalog || []).find(p => p.id === Number(id));
      if (!targetProd && window.catalog) {
        targetProd = (window.catalog || []).find(p => p.id === Number(id));
      }
      if (!targetProd && addBtn.dataset.title) {
        targetProd = {
          id: Number(id),
          title: addBtn.dataset.title,
          price: Number(addBtn.dataset.price) || 0,
          image: addBtn.dataset.img || '',
          description: addBtn.dataset.description || ''
        };
      }
      window.addToCart(targetProd || id);

      const card = addBtn.closest('.product-card');
      if (card) {
        card.classList.add('card-added-glow');
        setTimeout(() => card.classList.remove('card-added-glow'), 500);
      }

      const iconBox = addBtn.querySelector('.btn-icon-box');
      const textEl = addBtn.querySelector('.btn-text');
      addBtn.classList.replace('bg-burnt-copper', 'bg-secondary-container');
      addBtn.classList.replace('text-on-primary', 'text-secondary');
      if (iconBox) iconBox.innerHTML = '<svg class="w-4 h-4 text-secondary shrink-0 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>';
      if (textEl) textEl.textContent = 'افزوده شد';

      setTimeout(() => {
        addBtn.classList.replace('bg-secondary-container', 'bg-burnt-copper');
        addBtn.classList.replace('text-secondary', 'text-on-primary');
        if (iconBox) iconBox.innerHTML = '<svg class="w-4 h-4 shrink-0 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"></path></svg>';
        if (textEl) textEl.textContent = 'افزودن به سبد';
      }, 1000);
      return;
    }

    // Item Quantity Adjustments & Delete inside Cart
    const incBtn = e.target.closest('.increase-cart-item');
    if (incBtn) {
      e.preventDefault();
      updateCartQuantity(incBtn.dataset.id, 1);
      return;
    }

    const decBtn = e.target.closest('.decrease-cart-item');
    if (decBtn) {
      e.preventDefault();
      updateCartQuantity(decBtn.dataset.id, -1);
      return;
    }

    const delBtn = e.target.closest('.delete-cart-item');
    if (delBtn) {
      e.preventDefault();
      removeFromCart(delBtn.dataset.id);
      return;
    }

    // Step Navigation
    const proceedCheckoutBtn = e.target.closest('#proceed-checkout-btn');
    if (proceedCheckoutBtn) {
      const drawer = document.getElementById('cart-drawer');
      if (cart.length > 0 && drawer) {
        drawer.classList.add('checkout-step-2');
      }
      return;
    }

    const backToCartBtn = e.target.closest('#back-to-cart-btn');
    if (backToCartBtn) {
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.remove('checkout-step-2');
      }
      return;
    }

    // Payment Submission
    const finalPaymentBtn = e.target.closest('#final-payment-btn');
    if (finalPaymentBtn) {
      const errorMsgBox = document.getElementById('form-error-msg');
      if (validateForm()) {
        window.location.href = 'checkout.html';
      } else if (errorMsgBox) {
        errorMsgBox.textContent = 'لطفاً تمامی فیلدها را با دقت و به درستی تکمیل کنید';
        errorMsgBox.classList.remove('hidden');
      }
      return;
    }

    // Header Navigation Cart Button Trigger
    const cartNavBtn = e.target.closest('#cart-nav-btn, .open-cart-trigger');
    if (cartNavBtn) {
      e.preventDefault();
      window.openCart();
    }
  });

  // Attach input listeners for validation
  document.addEventListener('input', (e) => {
    if (['field-name', 'field-phone', 'field-postal', 'field-address'].includes(e.target.id)) {
      const errorMsgBox = document.getElementById('form-error-msg');
      if (errorMsgBox) errorMsgBox.classList.add('hidden');
      validateForm();
    }
  });

  // INITIAL RUN
  renderCart();
  syncProductsOnPage(fallbackCatalog);
  fetchGitHubProducts();
})();
