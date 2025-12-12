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
    // Monitor cart updates to detect when main product is added
    // Works with any cart system (Hulk, native Shopify, AJAX, etc.)
    observeCartUpdates();
  }

  var lastCartCount = null;
  var addonsProcessing = false;
  
  function observeCartUpdates() {
    // Get initial cart count
    fetchCartCount().then(function(count) {
      lastCartCount = count;
    });
    
    // Listen for various cart update events
    document.addEventListener('cart:updated', handleCartUpdate);
    document.addEventListener('cart.requestComplete', handleCartUpdate);
    
    // Poll cart count periodically as fallback
    setInterval(function() {
      fetchCartCount().then(function(count) {
        if (count !== lastCartCount && count > lastCartCount) {
          lastCartCount = count;
          handleCartUpdate();
        }
        lastCartCount = count;
      });
    }, 500);
  }
  
  function fetchCartCount() {
    return fetch('/cart.js')
      .then(function(response) { return response.json(); })
      .then(function(cart) { return cart.item_count; })
      .catch(function() { return null; });
  }
  
  function handleCartUpdate() {
    if (addonsProcessing) {
      return;
    }
    
    var addonsContainer = document.querySelector('[id^="product-addons-"], .addon-options, .product-addons');
    if (!addonsContainer) {
      return;
    }
    
    var checkedAddons = addonsContainer.querySelectorAll('.product-addons__checkbox:checked:not([disabled])');
    if (checkedAddons.length === 0) {
      return;
    }
    
    addonsProcessing = true;
    
    // Wait a moment for main product to finish adding
    setTimeout(function() {
      addAddonsToCart().finally(function() {
        // Reset after a delay
        setTimeout(function() {
          addonsProcessing = false;
        }, 2000);
      });
    }, 300);
  }
  
  function addAddonsToCart() {
    var addonsContainer = document.querySelector('[id^="product-addons-"], .addon-options, .product-addons');
    if (!addonsContainer) {
      return Promise.resolve();
    }
    
    var checkedAddons = addonsContainer.querySelectorAll('.product-addons__checkbox:checked:not([disabled])');
    if (checkedAddons.length === 0) {
      return Promise.resolve();
    }
    
    var items = [];
    for (var i = 0; i < checkedAddons.length; i++) {
      var checkbox = checkedAddons[i];
      var addonVariantId = parseInt(checkbox.dataset.variantId || checkbox.dataset.addonVariantId, 10);
      if (addonVariantId) {
        items.push({ id: addonVariantId, quantity: 1 });
      }
    }
    
    if (items.length === 0) {
      return Promise.resolve();
    }
    
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    })
    .then(function(response) {
      return response.json();
    })
    .then(function() {
      console.log('Add-ons successfully added to cart');
      return Promise.resolve();
    })
    .catch(function(err) {
      console.error('Failed to add add-ons to cart:', err);
      return Promise.reject(err);
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