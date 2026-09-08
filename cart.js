/**
 * Shah Taam - Cart & Checkout Engine (cart.js)
 * کلید ذخیره‌سازی در LocalStorage: shahtame_cart
 */

// مدیریت وضعیت سبد خرید
let cart = [];

// بارگیری سبد خرید از LocalStorage
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem('shahtame_cart');
    cart = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('خطا در بارگیری سبد خرید از حافظه محلی:', e);
    cart = [];
  }
}

// ذخیره‌سازی سبد خرید در LocalStorage
function saveCartToStorage() {
  try {
    localStorage.setItem('shahtame_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('خطا در ذخیره‌سازی سبد خرید در حافظه محلی:', e);
  }
}

// توابع کمکی تبدیل اعداد به فارسی و فرمت قیمت
const formatPrice = num => (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const formatNumber = num => (num || 0).toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// رندر کامل رابط کاربری سبد خرید
function renderCart() {
  saveCartToStorage();

  const cartList = document.getElementById('cart-items-list');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const totalEl = document.getElementById('cart-total');
  const payableEl = document.getElementById('cart-payable');
  const proceedBtn = document.getElementById('proceed-checkout-btn');
  const navBadge = document.getElementById('cart-nav-badge');
  const drawerBadge = document.getElementById('drawer-cart-count');
  const shippingRow = document.getElementById('cart-shipping-row');

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // بروزرسانی تعداد نشانگرها
  if (drawerBadge) drawerBadge.textContent = formatNumber(totalQuantity);
  if (navBadge) {
    navBadge.textContent = formatNumber(totalQuantity);
    if (totalQuantity > 0) {
      navBadge.style.display = 'inline-flex';
      navBadge.classList.remove('hidden');
    } else {
      navBadge.style.display = 'none';
      navBadge.classList.add('hidden');
    }
  }

  // بروزرسانی قیمت‌ها
  if (totalEl) totalEl.textContent = formatPrice(totalPrice);
  if (payableEl) payableEl.textContent = formatPrice(totalPrice);

  // نمایش/مخفی‌سازی هزینه ارسال رایگان (مثلاً برای بالای ۳ قلم)
  if (shippingRow) {
    shippingRow.classList.toggle('hidden', totalQuantity < 4);
    shippingRow.classList.toggle('flex', totalQuantity >= 4);
  }

  // رندر لیست اقلام سبد
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
            <img class="w-full h-full object-cover" src="${item.image}" alt="${item.title}" loading="lazy">
          </div>
          <div class="flex flex-col justify-between flex-1 py-0.5">
            <div class="flex justify-between items-start gap-2">
              <h3 class="text-body-md text-on-surface font-medium leading-tight line-clamp-1">${item.title}</h3>
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

// افزودن محصول به سبد خرید
function addToCart(productId, customProduct = null) {
  let prod = customProduct;
  if (!prod) {
    const catalog = window.catalog || [];
    prod = catalog.find(p => p.id === Number(productId));
  }
  if (!prod) return;

  const existingIndex = cart.findIndex(item => item.id === prod.id);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      id: prod.id,
      title: prod.title,
      price: prod.price,
      image: prod.image,
      quantity: 1
    });
  }

  saveCartToStorage();
  renderCart();

  // انیمیشن کوچک روی نشانگر سبد هدر
  const navBadge = document.getElementById('cart-nav-badge');
  if (navBadge) {
    navBadge.classList.add('cart-pop-scale');
    setTimeout(() => navBadge.classList.remove('cart-pop-scale'), 250);
  }
}

// تغییر تعداد محصول در سبد (حداقل مقدار ۱ است)
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

  saveCartToStorage();
  renderCart();
}

// حذف محصول از سبد خرید
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== Number(productId));
  saveCartToStorage();
  renderCart();
}

// باز کردن کشوی سبد خرید
function openCart() {
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
}

// بستن کشوی سبد خرید
function closeCart() {
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
}

// انکپسوله کردن و اتصال به window جهت استفاده سراسری
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.renderCart = renderCart;
window.getCart = () => cart;

// همگام‌سازی بین زبانه (Multi-Tab Sync)
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

// اعتبارسنجی فرم مرحله دوم
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

// گوش‌به‌زنگ‌های رویدادها (Event Listeners)
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  renderCart();

  const cartNavBtn = document.getElementById('cart-nav-btn');
  if (cartNavBtn) cartNavBtn.addEventListener('click', openCart);

  const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');
  const backToCartBtn = document.getElementById('back-to-cart-btn');

  if (proceedCheckoutBtn) {
    proceedCheckoutBtn.addEventListener('click', () => {
      const drawer = document.getElementById('cart-drawer');
      if (cart.length > 0 && drawer) {
        drawer.classList.add('checkout-step-2');
      }
    });
  }

  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', () => {
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.remove('checkout-step-2');
      }
    });
  }

  // مدیریت کلیک‌ها درون سبد خرید با Event Delegation
  document.addEventListener('click', e => {
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
  });

  // شنوندگان فرم اطلاعات ثبت سفارش
  const fieldName = document.getElementById('field-name');
  const fieldPhone = document.getElementById('field-phone');
  const fieldPostal = document.getElementById('field-postal');
  const fieldAddress = document.getElementById('field-address');
  const finalPaymentBtn = document.getElementById('final-payment-btn');
  const errorMsgBox = document.getElementById('form-error-msg');

  [fieldName, fieldPhone, fieldPostal, fieldAddress].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        if (errorMsgBox) errorMsgBox.classList.add('hidden');
        validateForm();
      });
    }
  });

  if (finalPaymentBtn) {
    finalPaymentBtn.addEventListener('click', () => {
      if (validateForm()) {
        window.location.href = 'checkout.html';
      } else if (errorMsgBox) {
        errorMsgBox.textContent = 'لطفاً تمامی فیلدها را با دقت و به درستی تکمیل کنید';
        errorMsgBox.classList.remove('hidden');
      }
    });
  }
});