/* eslint-disable */
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

  function syncCheckboxState(checkbox) {
    var item = checkbox.closest('[data-addon-item]');
    if (!item) {
      return;
    }
    
    if (checkbox.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  }

  function initCheckboxStates() {
    var allCheckboxes = document.querySelectorAll('.product-addons__checkbox, .addon-options .product-addons__checkbox');
    for (var i = 0; i < allCheckboxes.length; i++) {
      syncCheckboxState(allCheckboxes[i]);
    }
  }

  function setupDelegatedHandlers() {
    document.addEventListener('change', function(e) {
      if (e.target.matches && e.target.matches('.product-addons__checkbox, .addon-options .product-addons__checkbox')) {
        syncCheckboxState(e.target);
      }
    });

    document.addEventListener('click', function(e) {
      if (e.target.matches && (e.target.matches('input[type="checkbox"]') || e.target.closest('.product-addons__checkbox-wrapper'))) {
        return;
      }
      
      var item = e.target.closest('[data-addon-item]');
      if (item) {
        var checkbox = item.querySelector('.product-addons__checkbox');
        if (checkbox && !checkbox.disabled) {
          checkbox.checked = !checkbox.checked;
          var event = document.createEvent('HTMLEvents');
          event.initEvent('change', true, false);
          checkbox.dispatchEvent(event);
          syncCheckboxState(checkbox);
        }
      }
    });
  }

  function initProductAddons() {
    var productForms = document.querySelectorAll('form[action*="/cart/add"], form.product-form, form[data-product-id]');
    
    if (!productForms || productForms.length === 0) {
      return;
    }
    
    for (var i = 0; i < productForms.length; i++) {
      var form = productForms[i];
      if (!form.dataset.addonsInitialized) {
        form.dataset.addonsInitialized = 'true';
        form.addEventListener('submit', handleFormSubmit);
      }
    }
  }

  function handleFormSubmit(e) {
    try {
      var form = e.target;
      
      var addonsContainer = document.querySelector('[id^="product-addons-"], .addon-options, .product-addons');
      if (!addonsContainer) {
        return;
      }
      
      var checkedAddons = addonsContainer.querySelectorAll('.product-addons__checkbox:checked:not([disabled])');
      if (checkedAddons.length === 0) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      var variantInput = form.querySelector('select[name="id"], input[name="id"][type="hidden"], input[name="id"]:not([type])');
      if (!variantInput) {
        console.error('Could not find variant input');
        return;
      }
      
      var qtyInput = form.querySelector('input[name="quantity"]');
      var mainVariantId = parseInt(variantInput.value, 10);
      var mainQty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      
      if (!mainVariantId) {
        console.error('Invalid variant ID');
        return;
      }
      
      var submitBtns = form.querySelectorAll('[type="submit"]');
      for (var i = 0; i < submitBtns.length; i++) {
        var btn = submitBtns[i];
        btn.setAttribute('disabled', 'disabled');
        var originalText = btn.textContent;
        btn.setAttribute('data-original-text', originalText);
        btn.textContent = 'Adding...';
      }
      
      var items = [{ id: mainVariantId, quantity: mainQty }];
      
      for (var j = 0; j < checkedAddons.length; j++) {
        var checkbox = checkedAddons[j];
        var addonVariantId = parseInt(checkbox.dataset.variantId || checkbox.dataset.addonVariantId, 10);
        if (addonVariantId) {
          items.push({ id: addonVariantId, quantity: 1 });
        }
      }
      
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
        window.location.href = '/cart';
      })
      .catch(function(err) {
        console.warn('Bulk add failed, trying fallback method:', err);
        addItemsSequentially(items, submitBtns);
      });
      
    } catch (err) {
      console.error('Product addons error:', err);
    }
  }

  function addItemsSequentially(items, submitBtns) {
    var sequence = Promise.resolve();
    for (var i = 0; i < items.length; i++) {
      (function(item) {
        sequence = sequence.then(function() {
          return fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, quantity: item.quantity })
          })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('Failed to add item ' + item.id);
            }
            return response.json();
          });
        });
      })(items[i]);
    }
    
    sequence
      .then(function() {
        window.location.href = '/cart';
      })
      .catch(function(err) {
        console.error('Sequential add also failed:', err);
        alert('Sorry, there was an error adding items to your cart. Please try again.');
        
        for (var i = 0; i < submitBtns.length; i++) {
          var btn = submitBtns[i];
          btn.removeAttribute('disabled');
          var originalText = btn.getAttribute('data-original-text') || 'Add to Cart';
          btn.textContent = originalText;
        }
      });
  }

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

  document.addEventListener('shopify:section:load', function() {
    initCheckboxStates();
    initProductAddons();
  });
})();