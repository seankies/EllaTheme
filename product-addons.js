/**
 * Product Add-ons functionality
 * Makes add-ons behave as separate cart line items with their variant IDs and SKUs
 */
(function() {
  'use strict';

  function initProductAddons() {
    const productForms = document.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]');
    
    if (!productForms || productForms.length === 0) return;
    
    productForms.forEach(function(form) {
      // Store original button text
      const submitBtns = form.querySelectorAll('[type="submit"]');
      const originalButtonTexts = Array.from(submitBtns).map(btn => btn.textContent);
      
      // Setup checkbox change handlers for visual feedback (fallback for :has())
      const addonsContainer = form.querySelector('[id^="product-addons-"], .addon-options');
      if (addonsContainer) {
        const checkboxes = addonsContainer.querySelectorAll('.addon-options__checkbox, .product-addons__checkbox');
        checkboxes.forEach(function(checkbox) {
          // Toggle selected class on parent label for browsers without :has() support
          checkbox.addEventListener('change', function() {
            const parentLabel = checkbox.closest('.addon-options__item, .product-addons__item');
            if (parentLabel) {
              if (checkbox.checked) {
                parentLabel.classList.add('is-selected');
              } else {
                parentLabel.classList.remove('is-selected');
              }
            }
          });
        });
      }
      
      form.addEventListener('submit', function(e) {
        try {
          const addonsContainer = form.querySelector('[id^="product-addons-"], .addon-options');
          if (!addonsContainer) return;
          
          // Fix: removed space before class selector
          const checkedAddons = Array.from(addonsContainer.querySelectorAll('.addon-options__checkbox:checked, .product-addons__checkbox:checked'));
          if (checkedAddons.length === 0) return;
          
          e.preventDefault();
          
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
          submitBtns.forEach(btn => {
            btn.setAttribute('disabled', 'disabled');
            btn.textContent = 'Adding...';
          });
          
          // Build items array for batch add
          const items = [{ id: mainVariantId, quantity: mainQty }];
          
          // Get addon variant IDs from data attributes (support legacy and new attributes)
          checkedAddons.forEach(checkbox => {
            // Try multiple data attributes: data-variant-id, data-addon-variant-id, or value
            const addonVariantId = parseInt(
              checkbox.dataset.variantId || 
              checkbox.dataset.addonVariantId || 
              checkbox.value
            );
            if (addonVariantId) {
              items.push({ id: addonVariantId, quantity: 1 });
            }
          });
          
          // Try batch add with items array first
          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items })
          })
          .then(response => {
            if (!response.ok) throw new Error('Batch add failed');
            return response.json();
          })
          .then(() => {
            // Success - redirect to cart or trigger cart update event
            if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cartUpdateCallbacks) {
              window.Shopify.theme.cartUpdateCallbacks.forEach(callback => callback());
            }
            window.location.href = '/cart';
          })
          .catch(err => {
            console.warn('Batch add failed, trying sequential adds:', err);
            
            // Fallback to sequential adds
            let sequence = Promise.resolve();
            items.forEach(item => {
              sequence = sequence.then(() =>
                fetch('/cart/add.js', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: item.id, quantity: item.quantity })
                })
                .then(response => {
                  if (!response.ok) throw new Error(`Failed to add item ${item.id}`);
                  return response.json();
                })
              );
            });
            
            return sequence.then(() => {
              // Success - redirect to cart
              if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cartUpdateCallbacks) {
                window.Shopify.theme.cartUpdateCallbacks.forEach(callback => callback());
              }
              window.location.href = '/cart';
            });
          })
          .catch(err => {
            console.error('Error adding to cart:', err);
            alert('Sorry, there was an error adding items to your cart. Please try again.');
            
            // Re-enable buttons with original text
            submitBtns.forEach((btn, idx) => {
              btn.removeAttribute('disabled');
              btn.textContent = originalButtonTexts[idx] || 'Add to Cart';
            });
          });
          
        } catch (err) {
          console.error('Product addons error:', err);
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