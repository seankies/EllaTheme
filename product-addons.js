/**
 * Product Add-ons functionality
 * Supports both data-variant-id and data-addon-variant-id
 * Implements delegated selection, visual feedback, and robust add-to-cart
 * 
 * INTEGRATION WITH MAIN PRODUCT:
 * - Automatically intercepts the main product's "Add to Cart" form submission
 * - When customer clicks main product "Add to Cart" button:
 *   1. Main product is added to cart
 *   2. All checked add-on products are also added to cart
 *   3. Customer is redirected to cart page with all items
 * - Uses bulk add-to-cart API (/cart/add.js) for optimal performance
 * - Falls back to sequential adding if bulk fails
 * - Mobile-friendly with larger tap targets and responsive design
 */
(function() {
  'use strict';

  // Initialize checkbox state synchronization
  function syncCheckboxState(checkbox) {
    const item = checkbox.closest('[data-addon-item]');
    if (!item) return;
    
    if (checkbox.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  }

  // Initialize all checkboxes on page load
  function initCheckboxStates() {
    const allCheckboxes = document.querySelectorAll('.product-addons__checkbox, .addon-options .product-addons__checkbox');
    allCheckboxes.forEach(function(checkbox) {
      syncCheckboxState(checkbox);
    });
  }

  // Delegated event handling for checkbox changes
  function setupDelegatedHandlers() {
    document.addEventListener('change', function(e) {
      if (e.target.matches('.product-addons__checkbox, .addon-options .product-addons__checkbox')) {
        syncCheckboxState(e.target);
      }
    });

    // Also handle click events on the label for better UX (but not on checkbox itself)
    document.addEventListener('click', function(e) {
      // Only handle clicks that are NOT on the checkbox or its wrapper
      if (e.target.matches('input[type="checkbox"]') || e.target.closest('.product-addons__checkbox-wrapper')) {
        return; // Let the checkbox handle its own clicks
      }
      
      const item = e.target.closest('[data-addon-item]');
      if (item) {
        const checkbox = item.querySelector('.product-addons__checkbox');
        if (checkbox && !checkbox.disabled) {
          checkbox.checked = !checkbox.checked;
          // Dispatch change event for accessibility
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          syncCheckboxState(checkbox);
        }
      }
    });
  }

  function initProductAddons() {
    const productForms = document.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]');
    
    if (!productForms || productForms.length === 0) return;
    
    productForms.forEach(function(form) {
      // Avoid duplicate listeners by checking if handler already exists
      if (!form.dataset.addonsInitialized) {
        form.dataset.addonsInitialized = 'true';
        form.addEventListener('submit', handleFormSubmit);
      }
    });
  }

  function handleFormSubmit(e) {
    try {
      const form = e.target;
      // Look for add-ons anywhere on the page, not just in the form
      // This allows add-ons to be rendered as separate blocks
      const addonsContainer = document.querySelector('[id^="product-addons-"], .addon-options, .product-addons');
      if (!addonsContainer) return;
      
      const checkedAddons = Array.from(addonsContainer.querySelectorAll('.product-addons__checkbox:checked'));
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
      const submitBtns = form.querySelectorAll('[type="submit"]');
      submitBtns.forEach(function(btn) {
        btn.setAttribute('disabled', 'disabled');
        const originalText = btn.textContent;
        btn.setAttribute('data-original-text', originalText);
        btn.textContent = 'Adding...';
      });
      
      // Build items array for cart
      const items = [{ id: mainVariantId, quantity: mainQty }];
      
      checkedAddons.forEach(function(checkbox) {
        // Support both data-variant-id and data-addon-variant-id
        const addonVariantId = parseInt(checkbox.dataset.variantId || checkbox.dataset.addonVariantId);
        if (addonVariantId) {
          items.push({ id: addonVariantId, quantity: 1 });
        }
      });
      
      // Try adding all items with /cart/add.js first
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to add items to cart');
        }
        return response.json();
      })
      .then(function() {
        // Success - redirect to cart
        window.location.href = '/cart';
      })
      .catch(function(err) {
        console.warn('Bulk add failed, trying fallback method:', err);
        // Fallback: Add items sequentially using /cart/add
        addItemsSequentially(items, submitBtns);
      });
      
    } catch (err) {
      console.error('Product addons error:', err);
    }
  }

  // Fallback method: add items one by one using form submission
  function addItemsSequentially(items, submitBtns) {
    // Try sequential AJAX adds first
    let sequence = Promise.resolve();
    items.forEach(function(item) {
      sequence = sequence.then(function() {
        return fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, quantity: item.quantity })
        })
        .then(function(response) {
          if (!response.ok) throw new Error('Failed to add item ' + item.id);
          return response.json();
        });
      });
    });
    
    sequence
      .then(function() {
        window.location.href = '/cart';
      })
      .catch(function(err) {
        console.error('Sequential add also failed:', err);
        // Last resort: use traditional form submission for main product
        alert('Sorry, there was an error adding items to your cart. Please try again.');
        
        // Re-enable buttons
        submitBtns.forEach(function(btn) {
          btn.removeAttribute('disabled');
          const originalText = btn.getAttribute('data-original-text') || 'Add to Cart';
          btn.textContent = originalText;
        });
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupDelegatedHandlers();
      initCheckboxStates();
      initProductAddons();
    });
  } else {
    setupDelegatedHandlers();
    initCheckboxStates();
    initProductAddons();
  }

  // Reinitialize on theme section reloads
  // Note: setupDelegatedHandlers() is not called here because handlers
  // are attached to document and persist across section reloads
  document.addEventListener('shopify:section:load', function() {
    initCheckboxStates();
    initProductAddons();
  });
})();