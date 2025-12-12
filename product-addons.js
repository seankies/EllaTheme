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
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', function(e) {
        try {
          const addonsContainer = newForm.querySelector('[id^="product-addons-"]');
          if (!addonsContainer) return;
          
          const checkedAddons = Array.from(addonsContainer.querySelectorAll('.product-addons__checkbox:checked'));
          if (checkedAddons.length === 0) return;
          
          e.preventDefault();
          
          // Get main product data
          const variantInput = newForm.querySelector('select[name="id"], input[name="id"][type="hidden"], input[name="id"]:not([type])');
          if (!variantInput) {
            console.error('Could not find variant input');
            return;
          }
          
          const qtyInput = newForm.querySelector('input[name="quantity"]');
          const mainVariantId = parseInt(variantInput.value);
          const mainQty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
          
          if (!mainVariantId) {
            console.error('Invalid variant ID');
            return;
          }
          
          // Disable submit buttons
          const submitBtns = newForm.querySelectorAll('[type="submit"]');
          submitBtns.forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
            const originalText = btn.textContent;
            btn.dataset.originalText = originalText;
            btn.textContent = 'Adding...';
          });
          
          // Add main product first
          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mainVariantId, quantity: mainQty })
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to add main product');
            return response.json();
          })
          .then(() => {
            // Add each addon sequentially
            let sequence = Promise.resolve();
            checkedAddons.forEach(checkbox => {
              const addonVariantId = parseInt(checkbox.dataset.variantId);
              if (!addonVariantId) return;
              
              sequence = sequence.then(() =>
                fetch('/cart/add.js', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: addonVariantId, quantity: 1 })
                })
                .then(response => {
                  if (!response.ok) throw new Error(`Failed to add addon ${addonVariantId}`);
                  return response.json();
                })
                .catch(err => {
                  console.warn('Error adding addon:', addonVariantId, err);
                })
              );
            });
            return sequence;
          })
          .then(() => {
            // Success - redirect to cart
            window.location.href = '/cart';
          })
          .catch(err => {
            console.error('Error adding to cart:', err);
            alert('Sorry, there was an error adding items to your cart. Please try again.');
            
            // Re-enable buttons
            submitBtns.forEach(btn => {
              btn.removeAttribute('disabled');
              btn.textContent = btn.dataset.originalText || 'Add to Cart';
            });
          });
          
        } catch (err) {
          console.error('Product addons error:', err);
        }
      });
    });
    
    // Sync initial checkbox states
    syncCheckboxStates();
  }
  
  function syncCheckboxStates() {
    const checkboxes = document.querySelectorAll('.product-addons__checkbox');
    checkboxes.forEach(checkbox => {
      // Ensure checkbox reflects its checked state visually
      if (checkbox.checked) {
        checkbox.parentElement.classList.add('product-addons__item--checked');
      } else {
        checkbox.parentElement.classList.remove('product-addons__item--checked');
      }
      
      // Add delegated change event
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          this.parentElement.classList.add('product-addons__item--checked');
        } else {
          this.parentElement.classList.remove('product-addons__item--checked');
        }
      });
    });
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