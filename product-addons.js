/**
 * Product Add-ons functionality
 */
(function() {
  'use strict';

  function initProductAddons() {
    const productForms = document.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]');
    
    if (!productForms || productForms.length === 0) return;
    
    productForms.forEach(function(form) {
      // Remove any existing listeners to avoid duplicates
      form.removeEventListener('submit', handleFormSubmit);
      form.addEventListener('submit', handleFormSubmit);
    });
  }

  function handleFormSubmit(e) {
    try {
      const form = e.target;
      const addonsContainer = form.querySelector('[data-product-addons]');
      if (!addonsContainer) return;
      
      const checkedAddons = Array.from(addonsContainer.querySelectorAll('.product-addons__checkbox:checked'));
      if (checkedAddons.length === 0) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Get main product data
      const variantInput = form.querySelector('select[name="id"], input[name="id"][type="hidden"], input[name="id"]:not([type])');
      if (!variantInput) {
        console.error('Could not find variant input');
        return;
      }
      
      const qtyInput = form.querySelector('input[name="quantity"]');
      const mainVariantId = parseInt(variantInput.value);
      const mainQty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
      
      if (!mainVariantId) {
        console.error('Invalid variant ID');
        return;
      }
      
      // Disable submit buttons
      const submitBtns = form.querySelectorAll('[type="submit"]');
      const originalButtonTexts = [];
      submitBtns.forEach(btn => {
        originalButtonTexts.push(btn.textContent);
        btn.setAttribute('disabled', 'disabled');
        btn.textContent = 'Adding...';
      });
      
      // Prepare items for cart
      const items = [{ id: mainVariantId, quantity: mainQty }];
      checkedAddons.forEach(checkbox => {
        const addonVariantId = parseInt(checkbox.dataset.addonVariantId);
        if (addonVariantId) {
          items.push({ id: addonVariantId, quantity: 1 });
        }
      });
      
      // Add all items to cart using /cart/add.js with fallback
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      })
      .then(response => {
        if (!response.ok) {
          // Fallback: add items sequentially
          return addItemsSequentially(items);
        }
        return response.json();
      })
      .then(() => {
        // Success - trigger cart update event if needed
        if (window.theme && window.theme.cart) {
          window.theme.cart.getCart();
        }
        // Redirect to cart or trigger cart drawer
        if (window.after_add_to_cart && window.after_add_to_cart.type === 'page') {
          window.location.href = '/cart';
        } else {
          window.location.href = '/cart';
        }
      })
      .catch(err => {
        console.error('Error adding to cart:', err);
        alert('Sorry, there was an error adding items to your cart. Please try again.');
        
        // Re-enable buttons
        submitBtns.forEach((btn, index) => {
          btn.removeAttribute('disabled');
          btn.textContent = originalButtonTexts[index] || 'Add to Cart';
        });
      });
      
    } catch (err) {
      console.error('Product addons error:', err);
    }
  }

  function addItemsSequentially(items) {
    let sequence = Promise.resolve();
    items.forEach(item => {
      sequence = sequence.then(() =>
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        .then(response => {
          if (!response.ok) throw new Error(`Failed to add item ${item.id}`);
          return response.json();
        })
      );
    });
    return sequence;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductAddons);
  } else {
    initProductAddons();
  }

  // Reinitialize on theme section reloads
  document.addEventListener('shopify:section:load', initProductAddons);
})();