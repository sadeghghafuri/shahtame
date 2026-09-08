<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }
  </style>
</head>
<body>
<!-- STITCH_THREEJS_START:ANIMATION_168 class="fixed inset-0 w-full h-full bg-transparent" -->
<div class="fixed inset-0 w-full h-full bg-transparent" style="display:block;">
<script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"></script>
<div id="threejs-container-ANIMATION_168" style="width:100%;height:100%"></div>
<script>
(function() {
  const container = document.getElementById('threejs-container-ANIMATION_168');
  const devicePixelRatio = window.devicePixelRatio || 1;
  /**
 * cart.js - شاه طعم (Shahtame)
 * ماژول مستقل و جامع سبد خرید کشویی (Cart Drawer) و فرم ثبت سفارش دو مرحله‌ای
 * سازگار با صفحات index.html و shop.html
 * ذخیره‌سازی دائمی در LocalStorage با کلید shahtame_cart
 */

(function() {
  // 1. تزریق استایل‌ها و انیمیشن‌های مورد نیاز سبد خرید
  const cartStyles = `
    /* استایل‌های اختصاصی سبد خرید و انیمیشن‌ها */
    #cart-drawer-backdrop {
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    #cart-drawer-panel {
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.35s ease;
      max-width: 420px;
      width: 100%;
    }
    @media (max-width: 640px) {
      #cart-drawer-panel {
        max-width: 100% !important;
      }
    }
    .cart-item-card {
      background: #131313;
      border: 1px solid rgba(211, 84, 0, 0.15);
      transition: all 0.2s ease;
    }
    .cart-item-card:hover {
      border-color: rgba(211, 84, 0, 0.4);
    }
    .cart-badge-pulse {
      animation: cartPulse 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes cartPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.35); }
      100% { transform: scale(1); }
    }
    /* اسکرول‌بار شیک و باریک برای لیست اقلام سبد خرید */
    #cart-items-list::-webkit-scrollbar,
    #order-form-container::-webkit-scrollbar {
      width: 4px;
    }
    #cart-items-list::-webkit-scrollbar-track,
    #order-form-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }
    #cart-items-list::-webkit-scrollbar-thumb,
    #order-form-container::-webkit-scrollbar-thumb {
      background: rgba(211, 84, 0, 0.4);
      border-radius: 4px;
    }
    #cart-items-list::-webkit-scrollbar-thumb:hover,
    #order-form-container::-webkit-scrollbar-thumb:hover {
      background: rgba(211, 84, 0, 0.8);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'shahtame-cart-styles';
  styleEl.innerHTML = cartStyles;
  document.head.appendChild(styleEl);

  // 2. ساختار HTML سبد خرید و فرم ثبت سفارش دو مرحله‌ای
  const cartHTML = `
  <!-- کانتینر سبد خرید و Drawer (مهار شده در حداکثر 1280px یا تمام‌صفحه) -->
  <div id="cart-drawer-wrapper" class="fixed inset-0 z-[100] pointer-events-none overflow-hidden font-['Vazirmatn',sans-serif]" dir="rtl">
    <!-- پس‌زمینه نیمه‌شفاف و بلور -->
    <div id="cart-drawer-backdrop" onclick="toggleCart(false)" class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 invisible pointer-events-none transition-all duration-300"></div>

    <!-- پنل کشویی سبد خرید مهار شده در سمت راست -->
    <div class="max-w-[1280px] w-full h-full mx-auto relative pointer-events-none">
      <div id="cart-drawer-panel" class="absolute top-0 right-0 h-[100dvh] bg-[#131313]/95 backdrop-blur-xl border-l border-[#d35400]/20 shadow-2xl flex flex-col pointer-events-auto translate-x-full invisible transition-all duration-300 z-10 overflow-hidden">
        
        <!-- هدر پنل سبد خرید -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#161616]/90">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-[#d35400]/15 flex items-center justify-center text-[#d35400]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div>
              <h3 id="cart-drawer-title" class="font-bold text-white text-base">سبد خرید شما</h3>
              <p id="cart-drawer-subtitle" class="text-xs text-white/50"><span id="cart-count-text">۰</span> طعم برگزیده</p>
            </div>
          </div>
          <button onclick="toggleCart(false)" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- محفظه اسلایدی دو مرحله‌ای: مرحله ۱ (اقلام سبد) و مرحله ۲ (فرم ارسال اطلاعات) -->
        <div class="relative flex-1 overflow-hidden">
          
          <!-- مرحله اول: لیست اقلام سبد خرید -->
          <div id="cart-step-1" class="absolute inset-0 flex flex-col transition-transform duration-300 transform translate-y-0">
            <!-- لیست اسکرول‌خور اقلام -->
            <div id="cart-items-list" class="flex-1 overflow-y-auto p-5 space-y-3">
              <!-- آیتم‌ها به صورت دینامیک توسط جاوااسکریپت تزریق می‌شوند -->
            </div>

            <!-- وضعیت کادر سبد خرید خالی -->
            <div id="cart-empty-state" class="hidden flex-col items-center justify-center p-8 text-center my-auto">
              <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d35400] mb-4 shadow-lg">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <h4 class="text-white font-bold text-base mb-1">سبد خرید شما خالی است</h4>
              <p class="text-white/40 text-xs mb-6 max-w-[220px]">هیچ محصولی هنوز به سبد خرید اضافه نشده است.</p>
              <a href="shop.html" onclick="toggleCart(false)" class="px-6 py-2.5 rounded-xl bg-[#d35400] hover:bg-[#e67e22] text-white font-medium text-xs shadow-lg shadow-[#d35400]/20 transition-all">
                مشاهده محصولات فروشگاه
              </a>
            </div>

            <!-- فوتر فیکس مرحله ۱: جمع مبالغ و دکمه ثبت سفارش -->
            <div id="cart-summary-footer" class="border-t border-white/10 bg-[#161616]/95 p-5 space-y-3">
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between text-white/60">
                  <span>جمع کل اقلام:</span>
                  <span id="cart-subtotal-price" class="font-medium text-white">۰ تومان</span>
                </div>
                <div class="flex justify-between text-white/60">
                  <span>هزینه ارسال:</span>
                  <span id="cart-shipping-price" class="text-emerald-400 font-medium">رایگان</span>
                </div>
                <div class="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                  <span>مبلغ نهایی:</span>
                  <span id="cart-total-price" class="text-[#d35400] text-base">۰ تومان</span>
                </div>
              </div>

              <!-- دکمه ثبت سفارش و ادامه به مرحله ارسال اطلاعات -->
              <button id="btn-goto-checkout" onclick="showCheckoutStep(true)" class="w-full py-3.5 px-4 rounded-xl bg-[#d35400] hover:bg-[#e67e22] active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-[#d35400]/25 flex items-center justify-center gap-2 group transition-all">
                <span>ثبت سفارش و ادامه</span>
                <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>

              <div class="text-center pt-1">
                <a href="shop.html" onclick="toggleCart(false)" class="text-xs text-white/40 hover:text-white/70 transition-colors">
                  ادامه خرید از فروشگاه
                </a>
              </div>
            </div>
          </div>

          <!-- مرحله دوم: فرم ارسال اطلاعات و پرداخت -->
          <div id="cart-step-2" class="absolute inset-0 flex flex-col bg-[#131313] transition-transform duration-300 transform translate-y-full">
            <div class="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-[#181818]/60">
              <button onclick="showCheckoutStep(false)" class="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span>بازگشت به سبد</span>
              </button>
              <span class="text-xs text-[#d35400] font-medium">مرحله ۲ از ۲: ثبت مشخصات</span>
            </div>

            <form id="order-form-container" onsubmit="handleOrderPayment(event)" class="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label class="block text-white/70 mb-1.5 font-medium">نام و نام خانوادگی *</label>
                <input type="text" id="order-name" required placeholder="مثال: محمد امینی" class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors">
              </div>

              <div>
                <label class="block text-white/70 mb-1.5 font-medium">شماره تماس همراه (۱۱ رقم) *</label>
                <input type="tel" id="order-phone" required pattern="09[0-9]{9}" maxlength="11" placeholder="مثال: 09123456789" class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors" dir="ltr">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-white/70 mb-1.5 font-medium">استان *</label>
                  <input type="text" id="order-province" required placeholder="مثال: تهران" class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors">
                </div>
                <div>
                  <label class="block text-white/70 mb-1.5 font-medium">شهر *</label>
                  <input type="text" id="order-city" required placeholder="مثال: تهران" class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors">
                </div>
              </div>

              <div>
                <label class="block text-white/70 mb-1.5 font-medium">کد پستی (۱۰ رقم) *</label>
                <input type="text" id="order-postal" required pattern="[0-9]{10}" maxlength="10" placeholder="مثال: 1234567890" class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors" dir="ltr">
              </div>

              <div>
                <label class="block text-white/70 mb-1.5 font-medium">آدرس دقیق پستی *</label>
                <textarea id="order-address" required rows="2" placeholder="خیابان، کوچه، پلاک، واحد..." class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors resize-none"></textarea>
              </div>

              <div>
                <label class="block text-white/70 mb-1.5 font-medium">یادداشت سفارش (اختیاری)</label>
                <input type="text" id="order-notes" placeholder="نکته خاص جهت بسته‌بندی یا ارسال..." class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#d35400] focus:outline-none transition-colors">
              </div>

              <div id="form-error-msg" class="hidden text-rose-400 text-xs p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl"></div>

              <!-- فوتر مرحله ۲: دکمه پرداخت نهایی -->
              <div class="pt-3 border-t border-white/10">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-white/60">مبلغ قابل پرداخت:</span>
                  <span id="order-final-price" class="text-base font-bold text-[#d35400]">۰ تومان</span>
                </div>
                <button type="submit" id="btn-final-pay" class="w-full py-3.5 px-4 rounded-xl bg-[#d35400] hover:bg-[#e67e22] text-white font-bold text-sm shadow-xl shadow-[#d35400]/25 flex items-center justify-center gap-2 transition-all">
                  <span>پرداخت نهایی</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  </div>
  `;

  // 3. تزریق خودکار HTML به انتهای <body> به صورت پویا
  if (document.body) {
    document.body.insertAdjacentHTML('beforeend', cartHTML);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.insertAdjacentHTML('beforeend', cartHTML);
    });
  }

  // 4. مدیریت متغیرها و منطق LocalStorage سبد خرید
  const CART_STORAGE_KEY = 'shahtame_cart';
  let cart = [];

  // بارگذاری از LocalStorage
  function loadCartFromStorage() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        cart = JSON.parse(stored);
      } else {
        cart = [];
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
      cart = [];
    }
  }

  // ذخیره در LocalStorage
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    // ارسال event جهت همگام‌سازی بین تب‌ها یا کامپوننت‌ها
    window.dispatchEvent(new CustomEvent('shahtame_cart_updated', { detail: { cart } }));
  }

  // فرمت‌بندی اعداد به صورت فارسی یا سه‌رقم سه‌رقم
  function formatPrice(num) {
    return Number(num).toLocaleString('fa-IR');
  }

  // به‌روزرسانی نشانگر و آیکون سبد خرید در هدر
  function updateHeaderCartBadge() {
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-badge, #header-cart-badge, [data-cart-badge]');
    
    badges.forEach(badge => {
      if (totalCount > 0) {
        badge.textContent = totalCount;
        badge.classList.remove('hidden');
        badge.classList.remove('cart-badge-pulse');
        void badge.offsetWidth; // ری‌فلوی انیمیشن
        badge.classList.add('cart-badge-pulse');
      } else {
        badge.textContent = '۰';
        badge.classList.add('hidden');
      }
    });

    const countTextEl = document.getElementById('cart-count-text');
    if (countTextEl) {
      countTextEl.textContent = formatPrice(totalCount);
    }
  }

  // رندر اقلام در پنل سبد خرید
  function renderCart() {
    const listEl = document.getElementById('cart-items-list');
    const emptyStateEl = document.getElementById('cart-empty-state');
    const footerEl = document.getElementById('cart-summary-footer');
    const subtotalEl = document.getElementById('cart-subtotal-price');
    const totalEl = document.getElementById('cart-total-price');
    const finalOrderPriceEl = document.getElementById('order-final-price');

    if (!listEl) return;

    if (cart.length === 0) {
      listEl.innerHTML = '';
      listEl.classList.add('hidden');
      if (emptyStateEl) emptyStateEl.classList.remove('hidden');
      if (emptyStateEl) emptyStateEl.classList.add('flex');
      if (footerEl) footerEl.classList.add('hidden');
      updateHeaderCartBadge();
      return;
    }

    listEl.classList.remove('hidden');
    if (emptyStateEl) emptyStateEl.classList.add('hidden');
    if (emptyStateEl) emptyStateEl.classList.remove('flex');
    if (footerEl) footerEl.classList.remove('hidden');

    let subtotal = 0;
    listEl.innerHTML = cart.map((item, index) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      const isMinOne = (item.quantity || 1) <= 1;

      return `
        <div class="cart-item-card rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
          <div class="flex items-center gap-3">
            <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title || 'محصول'}" class="w-14 h-14 object-cover rounded-xl border border-white/10 bg-black/40">
            <div>
              <h4 class="font-bold text-white text-xs leading-tight mb-1 line-clamp-1">${item.title || 'ادویه شاه طعم'}</h4>
              <p class="text-[11px] text-[#d35400] font-semibold">${formatPrice(item.price)} تومان</p>
              ${item.category ? `<span class="text-[10px] text-white/40 block mt-0.5">${item.category}</span>` : ''}
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <!-- دکمه حذف سطل زباله -->
            <button onclick="window.removeFromCart(${index})" class="text-white/30 hover:text-rose-400 p-1 transition-colors" title="حذف از سبد">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>

            <!-- کنترلر افزایش و کاهش تعداد (با حداقل ۱) -->
            <div class="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5">
              <button onclick="window.changeQuantity(${index}, 1)" class="w-5 h-5 flex items-center justify-center text-white/60 hover:text-[#d35400] font-bold text-xs transition-colors">+</button>
              <span class="text-xs text-white font-bold w-4 text-center">${item.quantity || 1}</span>
              <button onclick="window.changeQuantity(${index}, -1)" class="w-5 h-5 flex items-center justify-center ${isMinOne ? 'opacity-30 cursor-not-allowed' : 'text-white/60 hover:text-white'} font-bold text-xs transition-colors" ${isMinOne ? 'disabled' : ''}>-</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const shipping = 0; // ارسال رایگان
    const finalTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal) + ' تومان';
    if (totalEl) totalEl.textContent = formatPrice(finalTotal) + ' تومان';
    if (finalOrderPriceEl) finalOrderPriceEl.textContent = formatPrice(finalTotal) + ' تومان';

    updateHeaderCartBadge();
  }

  // ۵. توابع عمومی متصل به پنجره (Window)
  window.toggleCart = function(forceOpen) {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    const panel = document.getElementById('cart-drawer-panel');
    if (!backdrop || !panel) return;

    const isOpen = !panel.classList.contains('translate-x-full');
    const targetState = (forceOpen !== undefined) ? forceOpen : !isOpen;

    if (targetState) {
      renderCart();
      backdrop.classList.remove('invisible', 'opacity-0');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
      panel.classList.remove('translate-x-full', 'invisible');
      // بازگشت به مرحله ۱ در هر بار باز شدن
      window.showCheckoutStep(false);
    } else {
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      backdrop.classList.add('opacity-0', 'invisible');
      panel.classList.add('translate-x-full', 'invisible');
    }
  };

  window.addToCart = function(productOrId, name, price, image, category) {
    let product = {};
    if (typeof productOrId === 'object' && productOrId !== null) {
      product = productOrId;
    } else {
      product = {
        id: productOrId,
        title: name,
        price: parseInt(price, 10) || 0,
        image: image || '',
        category: category || ''
      };
    }

    const existingIndex = cart.findIndex(item => (item.id && item.id === product.id) || (item.title === product.title));
    if (existingIndex > -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id || Date.now(),
        title: product.title || 'ادویه خالص',
        price: parseInt(product.price, 10) || 0,
        image: product.image || '',
        category: product.category || '',
        quantity: 1
      });
    }

    saveCartToStorage();
    renderCart();

    // فیدبک گرافیکی یا پالس روی دکمه در صورت وجود
    const event = new CustomEvent('shahtame_item_added', { detail: { product } });
    window.dispatchEvent(event);
  };

  window.removeFromCart = function(index) {
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);
      saveCartToStorage();
      renderCart();
    }
  };

  window.changeQuantity = function(index, delta) {
    if (index >= 0 && index < cart.length) {
      const current = cart[index].quantity || 1;
      const next = current + delta;
      if (next >= 1) {
        cart[index].quantity = next;
        saveCartToStorage();
        renderCart();
      }
    }
  };

  window.showCheckoutStep = function(isStep2) {
    const step1 = document.getElementById('cart-step-1');
    const step2 = document.getElementById('cart-step-2');
    const titleEl = document.getElementById('cart-drawer-title');
    
    if (isStep2) {
      if (step1) step1.classList.add('-translate-y-full');
      if (step2) step2.classList.remove('translate-y-full');
      if (titleEl) titleEl.textContent = 'اطلاعات و ثبت سفارش';
    } else {
      if (step1) step1.classList.remove('-translate-y-full');
      if (step2) step2.classList.add('translate-y-full');
      if (titleEl) titleEl.textContent = 'سبد خرید شما';
    }
  };

  window.handleOrderPayment = function(e) {
    e.preventDefault();
    const name = document.getElementById('order-name')?.value;
    const phone = document.getElementById('order-phone')?.value;
    const address = document.getElementById('order-address')?.value;
    const errorMsg = document.getElementById('form-error-msg');

    if (!name || !phone || !address) {
      if (errorMsg) {
        errorMsg.textContent = 'لطفاً تمامی فیلدهای الزامی را تکمیل کنید.';
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    // هدایت یا پیام موفقیت
    alert('سفارش شما با موفقیت ثبت شد! در حال انتقال به درگاه بانکی...');
    // در صورت تمایل، پاک کردن سبد خرید پس از پرداخت:
    // cart = [];
    // saveCartToStorage();
    // renderCart();
    // toggleCart(false);
  };

  // همگام‌سازی لحظه‌ای هنگام تغییر Storage از تب‌های دیگر
  window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
      loadCartFromStorage();
      renderCart();
    }
  });

  // راه‌اندازی اولیه
  document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    renderCart();

    // اتصال خودکار به تمام المان‌های با صفت data-toggle-cart یا دکمه‌های هدر
    document.querySelectorAll('[data-cart-toggle], .cart-toggle-btn, [href*="cart"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.toggleCart(true);
      });
    });
  });

  // اجرای سریع در صورت آماده بودن DOM
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadCartFromStorage();
    renderCart();
  }
})();

})();
</script>
</div>
<!-- STITCH_THREEJS_END:ANIMATION_168 -->
</body>
</html>
