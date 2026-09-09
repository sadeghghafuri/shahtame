/**
 * اسکریپت مستقل سبد خرید شاه طعم (Shah Tame Independent Cart Script)
 * فایل: cart.js
 * توضیحات: این اسکریپت به صورت خودکار پاپ‌آپ سبد خرید را در صفحه تزریق کرده
 * و تمام داده‌ها را از طریق localStorage بین صفحه اصلی و فروشگاه همگام می‌سازد.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shahtame_cart';

  const toPersian = (num) => (num !== undefined && num !== null ? num.toString() : '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const formatPrice = (num) => toPersian((parseInt(num, 10) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

  function loadCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('shahtame:cart-change', { detail: { cart } }));
    } catch (e) {}
  }

  let cart = loadCart();

  // تزریق خودکار ساختار HTML پاپ‌آپ سبد خرید به انتهای body
  function injectDrawerMarkup() {
    if (document.getElementById('cart-drawer')) return;

    // استایل‌های پویا
    const style = document.createElement('style');
    style.textContent = `
      .st-drawer-slider { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: row; width: 200%; height: 100%; }
      .st-checkout-step-2 .st-drawer-slider { transform: translateX(50%); }
      .st-card-glow { box-shadow: 0 0 24px rgba(211, 84, 0, 0.45), 0 0 0 1.5px #d35400 !important; transform: scale(1.02); border-color: #d35400 !important; }
    `;
    document.head.appendChild(style);

    // بک‌دراپ
    const backdrop = document.createElement('div');
    backdrop.id = 'cart-backdrop';
    backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 opacity-0 pointer-events-none';
    document.body.appendChild(backdrop);

    // پنل کشویی
    const drawer = document.createElement('aside');
    drawer.id = 'cart-drawer';
    drawer.className = 'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#131313] border-l border-[#2a2a2a] z-[9999] transform translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col overflow-hidden text-right font-vazir';
    drawer.dir = 'rtl';

    drawer.innerHTML = `
      <div class="st-drawer-slider" id="st-drawer-slider">
        <!-- مرحله ۱: اقلام -->
        <div class="w-1/2 h-full flex flex-col justify-between flex-shrink-0 bg-[#131313]">
          <div class="p-6 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <button class="text-[#e0c0b2] hover:text-[#e9c176] transition-colors p-1 cursor-pointer" id="st-close-cart-btn" type="button">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h2 class="text-xl font-bold text-[#e9c176] flex items-center gap-2">
                <span>سبد خرید</span>
                <span class="text-sm font-normal text-[#e0c0b2]">(<span id="st-drawer-flavors-count">۰</span> طعم)</span>
              </h2>
            </div>
            <div class="text-xs text-[#e0c0b2] bg-[#2a2a2a] px-2.5 py-1 rounded border border-[#353534]">مرحله ۱ از ۲</div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4" id="st-cart-scroll-area">
            <div class="space-y-4 flex flex-col hidden" id="st-cart-items-list"></div>
            <div class="flex flex-col items-center justify-center text-center pb-8 text-[#e0c0b2] gap-3" id="st-empty-cart-msg">
              <div class="bg-[#232323] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto shadow-2xl">
                <div class="w-16 h-16 rounded-full bg-[#37332c] border border-[#c97a3e]/30 flex items-center justify-center mb-4 text-[#e9c176]">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <h3 class="font-bold text-[#e9c176] text-base mb-1.5">سبد خرید شما خالی است</h3>
                <p class="text-[#e2bfb4] text-sm leading-relaxed mb-6 font-normal">محصولات ما را بررسی کرده و طعم و عطر اصیل را به سبد خود بیفزایید</p>
                <button class="bg-[#d35400] hover:bg-[#b04600] text-white font-medium py-2.5 px-6 rounded-xl transition-all text-sm cursor-pointer w-full" id="st-empty-explore-btn" type="button">مشاهده طعم‌ها</button>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-[#2a2a2a] bg-[#0e0e0e]/90 backdrop-blur-md shrink-0 space-y-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center text-[#e0c0b2]">
                <span>جمع کل اقلام:</span>
                <span class="text-[#e9c176] font-bold text-lg"><span id="st-cart-total">۰</span> <span class="text-sm font-normal text-[#e9c176] mr-1">تومان</span></span>
              </div>
              <div class="justify-between items-center text-[#e0c0b2] hidden" id="st-shipping-row">
                <span>هزینه ارسال:</span>
                <span class="text-[#e9c176] font-medium bg-[#604403]/40 px-2 py-0.5 rounded border border-[#dab36a]/30">رایگان (سفارش بالای ۴ قلم)</span>
              </div>
              <div class="pt-3 pb-1 border-t border-[#2a2a2a] flex justify-between items-center text-lg font-bold text-white">
                <span class="font-semibold text-base text-white">مبلغ قابل پرداخت:</span>
                <span class="text-white flex items-baseline gap-1.5"><span class="font-extrabold text-white text-2xl" id="st-cart-payable">۰</span><span class="text-sm font-medium text-white">تومان</span></span>
              </div>
            </div>
            <button class="w-full py-3.5 px-4 bg-[#d35400] hover:bg-[#ee671c] rounded text-center text-white font-bold text-base opacity-50 cursor-not-allowed transition-all" disabled id="st-proceed-checkout-btn" type="button">ثبت سفارش و ادامه</button>
          </div>
        </div>

        <!-- مرحله ۲: فرم ارسال -->
        <div class="w-1/2 h-full flex flex-col justify-between flex-shrink-0 bg-[#131313]">
          <div class="p-6 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <button class="text-[#e0c0b2] hover:text-[#e9c176] transition-colors p-1 cursor-pointer" id="st-back-to-cart-btn" type="button">
                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
              </button>
              <h2 class="text-xl font-bold text-[#e9c176]">اطلاعات ارسال</h2>
            </div>
            <div class="text-xs text-[#e0c0b2] bg-[#2a2a2a] px-2.5 py-1 rounded border border-[#353534]">مرحله ۲ از ۲</div>
          </div>
          <div class="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
            <div class="space-y-1.5">
              <label class="block text-[#e0c0b2]">نام و نام خانوادگی <span class="text-[#d35400]">*</span></label>
              <input class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2.5 text-[#e5e2e1]" id="st-field-name" placeholder="مثال: علی احمدی" type="text" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[#e0c0b2]">شماره همراه <span class="text-[#d35400]">*</span></label>
              <input class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2.5 text-[#e5e2e1] text-right" dir="ltr" id="st-field-phone" maxlength="11" placeholder="۰۹۱۲۳۴۵۶۷۸۹" type="tel" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[#e0c0b2] mb-1">استان <span class="text-[#d35400]">*</span></label>
                <input class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2 text-[#e5e2e1]" id="st-field-province" placeholder="تهران" type="text" />
              </div>
              <div>
                <label class="block text-[#e0c0b2] mb-1">شهر <span class="text-[#d35400]">*</span></label>
                <input class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2 text-[#e5e2e1]" id="st-field-city" placeholder="تهران" type="text" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[#e0c0b2]">کد پستی (۱۰ رقمی) <span class="text-[#d35400]">*</span></label>
              <input class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2.5 text-[#e5e2e1] text-right" dir="ltr" id="st-field-postal" maxlength="10" placeholder="۱۲۳۴۵۶۷۸۹۰" type="text" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[#e0c0b2]">آدرس دقیق پستی <span class="text-[#d35400]">*</span></label>
              <textarea class="w-full bg-[#0e0e0e] border border-[#353534] rounded px-3 py-2.5 text-[#e5e2e1]" id="st-field-address" rows="2"></textarea>
            </div>
          </div>
          <div class="p-6 border-t border-[#2a2a2a] bg-[#0e0e0e]/90 shrink-0">
            <button class="w-full py-3.5 px-4 bg-[#d35400] hover:bg-[#ee671c] text-white font-bold text-lg rounded text-center opacity-50 cursor-not-allowed" disabled id="st-final-payment-btn" type="button">پرداخت نهایی</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
  }

  function updateUI() {
    const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // به‌روزرسانی تمام نشانگرهای هدر در هر دو صفحه
    document.querySelectorAll('#cart-nav-badge, #header-cart-badge, .cart-count-badge').forEach((badge) => {
      badge.textContent = toPersian(totalCount);
      badge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
      badge.classList.toggle('hidden', totalCount === 0);
    });

    const drawerCount = document.getElementById('st-drawer-flavors-count');
    const totalEl = document.getElementById('st-cart-total');
    const payableEl = document.getElementById('st-cart-payable');
    const shippingRow = document.getElementById('st-shipping-row');
    const itemsList = document.getElementById('st-cart-items-list');
    const emptyMsg = document.getElementById('st-empty-cart-msg');
    const proceedBtn = document.getElementById('st-proceed-checkout-btn');

    if (drawerCount) drawerCount.textContent = toPersian(totalCount);
    if (totalEl) totalEl.textContent = formatPrice(totalPrice);
    if (payableEl) payableEl.textContent = formatPrice(totalPrice);

    if (shippingRow) {
      shippingRow.classList.toggle('hidden', totalCount < 4);
      shippingRow.classList.toggle('flex', totalCount >= 4);
    }

    if (cart.length > 0) {
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (itemsList) {
        itemsList.style.display = 'flex';
        itemsList.classList.remove('hidden');
        itemsList.innerHTML = cart.map(item => `
          <div class="flex gap-3.5 p-3.5 rounded-xl bg-[#1e1e1e] border border-[#353534] hover:border-[#c5a059]/40 transition-colors">
            <img class="w-20 h-20 rounded-lg object-cover bg-[#201f1f]" src="${item.image}" alt="${item.title}" />
            <div class="flex flex-col justify-between flex-1 py-0.5">
              <div class="flex justify-between items-start">
                <h3 class="text-sm font-medium text-[#e5e2e1]">${item.title}</h3>
                <button class="st-delete-btn text-[#e0c0b2] hover:text-[#ffb4ab] p-1 cursor-pointer" data-id="${item.id}">✕</button>
              </div>
              <div class="flex justify-between items-end mt-2">
                <div class="flex items-center gap-2 bg-[#141414] rounded-lg border border-[#353534] px-2 py-0.5">
                  <button class="st-decrease-btn text-[#e5e2e1] p-1" data-id="${item.id}">-</button>
                  <span class="text-sm text-[#e9c176] font-bold">${toPersian(item.quantity)}</span>
                  <button class="st-increase-btn text-[#e5e2e1] p-1" data-id="${item.id}">+</button>
                </div>
                <span class="text-base font-bold text-[#c5a059]">${formatPrice(item.price * item.quantity)} تومان</span>
              </div>
            </div>
          </div>
        `).join('');
      }
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    } else {
      if (itemsList) {
        itemsList.innerHTML = '';
        itemsList.style.display = 'none';
      }
      if (emptyMsg) emptyMsg.style.display = 'flex';
      if (proceedBtn) {
        proceedBtn.disabled = true;
        proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  function openDrawer() {
    document.getElementById('cart-backdrop')?.classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('cart-backdrop')?.classList.add('opacity-100');
    document.getElementById('cart-drawer')?.classList.remove('translate-x-full');
    document.getElementById('cart-drawer')?.classList.remove('st-checkout-step-2');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('cart-drawer')?.classList.add('translate-x-full');
    document.getElementById('cart-backdrop')?.classList.remove('opacity-100');
    document.getElementById('cart-backdrop')?.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      document.body.style.overflow = '';
      document.getElementById('cart-drawer')?.classList.remove('st-checkout-step-2');
    }, 300);
  }

  function addToCart(p) {
    const existing = cart.find(i => String(i.id) === String(p.id));
    if (existing) existing.quantity += 1;
    else cart.push({ id: p.id, title: p.title, price: parseInt(p.price, 10), image: p.image || p.img, subtitle: p.subtitle || '', quantity: 1 });
    saveCart(cart);
    updateUI();
  }

  // رویدادهای سراسری
  document.addEventListener('click', (e) => {
    // باز کردن سبد با کلیک روی آیکون در هر صفحه
    if (e.target.closest('#cart-nav-btn, #header-cart-btn, .open-cart-btn')) {
      e.preventDefault();
      openDrawer();
    }
    // افزودن محصول به سبد از دکمه‌ها
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      e.preventDefault();
      addToCart({
        id: addBtn.dataset.id,
        title: addBtn.dataset.title || 'ادویه اعلا',
        price: addBtn.dataset.price,
        image: addBtn.dataset.img || addBtn.dataset.image,
        subtitle: addBtn.dataset.subtitle
      });
      const card = addBtn.closest('.product-card');
      if (card) {
        card.classList.add('st-card-glow');
        setTimeout(() => card.classList.remove('st-card-glow'), 600);
      }
    }
    if (e.target.closest('#st-close-cart-btn, #cart-backdrop, #st-empty-explore-btn')) closeDrawer();
    if (e.target.closest('#st-proceed-checkout-btn')) document.getElementById('cart-drawer')?.classList.add('st-checkout-step-2');
    if (e.target.closest('#st-back-to-cart-btn')) document.getElementById('cart-drawer')?.classList.remove('st-checkout-step-2');
    
    const inc = e.target.closest('.st-increase-btn');
    if (inc) {
      const item = cart.find(i => String(i.id) === String(inc.dataset.id));
      if (item) { item.quantity += 1; saveCart(cart); updateUI(); }
    }
    const dec = e.target.closest('.st-decrease-btn');
    if (dec) {
      const idx = cart.findIndex(i => String(i.id) === String(dec.dataset.id));
      if (idx !== -1) {
        cart[idx].quantity -= 1;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
        saveCart(cart);
        updateUI();
      }
    }
    const del = e.target.closest('.st-delete-btn');
    if (del) {
      cart = cart.filter(i => String(i.id) !== String(del.dataset.id));
      saveCart(cart);
      updateUI();
    }
  });

  // هماهنگ‌سازی میان تب‌ها و صفحات
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      cart = loadCart();
      updateUI();
    }
  });

  // راه‌اندازی در هنگام بارگذاری صفحه
  const init = () => {
    injectDrawerMarkup();
    updateUI();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // در دسترس قرار دادن متدها برای برنامه‌نویس
  window.ShahTameCart = { open: openDrawer, close: closeDrawer, add: addToCart, getItems: () => cart };
})();
