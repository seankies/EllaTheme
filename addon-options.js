/**
 * Add-on Options functionality for Ella Shopify Theme
 * Handles checkbox selection and adds main product + add-ons to cart
 */
(function() {
  'use strict';

  // Configuration
  const SELECTORS = {
    ADDON_CONTAINER: '[id^="addon-options-"]',
    ADDON_CHECKBOX: '.addon-options__checkbox',
    PRODUCT_FORM: 'form[action^="/cart/add"], form[action*="/cart/add"]',
    VARIANT_INPUT: 'select[name="id"], input[name="id"][type="hidden"], input[name="id"]:not([type])',
    QUANTITY_INPUT: 'input[name="quantity"]',
    SUBMIT_BUTTON: '[type="submit"]',
    CART_DRAWER: '#halo-cart-sidebar, .halo-side-cart, [data-cart-drawer]'
  };

  /**
   * Initialize add-on options functionality
   */
  function initAddonOptions() {
    const productForms = document.querySelectorAll(SELECTORS.PRODUCT_FORM);
    
    if (!productForms || productForms.length === 0) return;
    
    productForms.forEach(function(form) {
      // Check if already initialized to prevent duplicate listeners
      if (form.dataset.addonOptionsInitialized === 'true') return;
      
      form.dataset.addonOptionsInitialized = 'true';
      form.addEventListener('submit', handleFormSubmit);
    });
  }

  /**
   * Handle form submission
   */
  function handleFormSubmit(e) {
    try {
      const form = e.target;
      const addonsContainer = form.querySelector(SELECTORS.ADDON_CONTAINER);
      
      if (!addonsContainer) return; // No add-ons on this form
      
      const checkedAddons = Array.from(addonsContainer.querySelectorAll(SELECTORS.ADDON_CHECKBOX + ':checked'));
      
      if (checkedAddons.length === 0) return; // No add-ons selected, allow normal form submission
      
      // Prevent default form submission
      e.preventDefault();
      e.stopPropagation();
      
      // Get configuration from container data attributes
      const config = {
        quantityBehavior: addonsContainer.dataset.quantityBehavior || 'fixed',
        afterAddBehavior: addonsContainer.dataset.afterAddBehavior || 'redirect_cart',
        tagWithMain: addonsContainer.dataset.tagWithMain === 'true',
        mainProductId: addonsContainer.dataset.mainProductId,
        mainProductTitle: addonsContainer.dataset.mainProductTitle
      };
      
      // Get main product data
      const variantInput = form.querySelector(SELECTORS.VARIANT_INPUT);
      if (!variantInput) {
        console.error('[Addon Options] Could not find variant input');
        return;
      }
      
      const qtyInput = form.querySelector(SELECTORS.QUANTITY_INPUT);
      const mainVariantId = parseInt(variantInput.value);
      const mainQty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
      
      if (!mainVariantId || isNaN(mainVariantId)) {
        console.error('[Addon Options] Invalid variant ID');
        return;
      }
      
      // Disable submit buttons and show loading state
      const submitBtns = form.querySelectorAll(SELECTORS.SUBMIT_BUTTON);
      const originalBtnTexts = [];
      submitBtns.forEach((btn, idx) => {
        originalBtnTexts[idx] = btn.textContent;
        btn.setAttribute('disabled', 'disabled');
        btn.classList.add('loading');
        btn.textContent = 'Adding...';
      });
      
      // Build items array
      const items = [];
      
      // Add main product
      items.push({
        id: mainVariantId,
        quantity: mainQty
      });
      
      // Add selected add-ons
      checkedAddons.forEach(checkbox => {
        const addonVariantId = parseInt(checkbox.dataset.addonVariantId);
        if (!addonVariantId || isNaN(addonVariantId)) return;
        
        // Determine quantity based on behavior setting
        let addonQty = 1;
        if (config.quantityBehavior === 'match_main') {
          addonQty = mainQty;
        }
        
        const item = {
          id: addonVariantId,
          quantity: addonQty
        };
        
        // Optionally tag add-ons with reference to main product
        if (config.tagWithMain) {
          item.properties = {
            '_attached_to': config.mainProductTitle
          };
        }
        
        items.push(item);
      });
      
      // Add all items to cart
      addItemsToCart(items)
        .then(function(data) {
          console.log('[Addon Options] Successfully added items to cart', data);
          
          // Handle post-add behavior
          handlePostAddBehavior(config.afterAddBehavior, submitBtns, originalBtnTexts);
        })
        .catch(function(err) {
          console.error('[Addon Options] Error adding to cart:', err);
          
          // Show user-friendly error message
          const errorMsg = 'Sorry, there was an error adding items to your cart. Please try again.';
          
          // Try to use theme's notification system if available
          if (typeof window.showNotification === 'function') {
            window.showNotification(errorMsg, 'error');
          } else if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.showNotification === 'function') {
            window.Shopify.showNotification(errorMsg, 'error');
          } else {
            // Fallback to alert only if no notification system exists
            alert(errorMsg);
          }
          
          // Re-enable buttons
          submitBtns.forEach((btn, idx) => {
            btn.removeAttribute('disabled');
            btn.classList.remove('loading');
            btn.textContent = originalBtnTexts[idx] || 'Add to Cart';
          });
        });
        
    } catch (err) {
      console.error('[Addon Options] Form submit error:', err);
    }
  }

  /**
   * Add multiple items to cart
   */
  function addItemsToCart(items) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ items: items })
    })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(err) {
          throw new Error(err.description || 'Failed to add items to cart');
        });
      }
      return response.json();
    });
  }

  /**
   * Handle behavior after items are added to cart
   */
  function handlePostAddBehavior(behavior, submitBtns, originalBtnTexts) {
    switch (behavior) {
      case 'stay':
        // Just show success and re-enable buttons
        submitBtns.forEach((btn, idx) => {
          btn.removeAttribute('disabled');
          btn.classList.remove('loading');
          btn.textContent = 'Added!';
          setTimeout(function() {
            btn.textContent = originalBtnTexts[idx] || 'Add to Cart';
          }, 2000);
        });
        
        // Trigger cart update event for theme
        document.dispatchEvent(new CustomEvent('cart:updated'));
        if (typeof window.refreshMiniCart === 'function') {
          window.refreshMiniCart();
        }
        break;
        
      case 'open_drawer':
        // Try to open cart drawer if it exists
        const cartDrawer = document.querySelector(SELECTORS.CART_DRAWER);
        if (cartDrawer) {
          // Try various methods to open drawer
          if (typeof cartDrawer.show === 'function') {
            cartDrawer.show();
          } else if (cartDrawer.classList.contains('halo-side-cart')) {
            cartDrawer.classList.add('is-open');
            document.body.classList.add('cart-drawer-open', 'overflow-hidden');
          } else {
            cartDrawer.style.display = 'block';
            cartDrawer.classList.add('is-open', 'active');
          }
          
          // Trigger cart refresh
          document.dispatchEvent(new CustomEvent('cart:updated'));
          if (typeof window.refreshMiniCart === 'function') {
            window.refreshMiniCart();
          }
          
          // Re-enable buttons
          submitBtns.forEach((btn, idx) => {
            btn.removeAttribute('disabled');
            btn.classList.remove('loading');
            btn.textContent = originalBtnTexts[idx] || 'Add to Cart';
          });
        } else {
          // Fallback to cart page if drawer not found
          window.location.href = '/cart';
        }
        break;
        
      case 'redirect_cart':
      default:
        // Redirect to cart page
        window.location.href = '/cart';
        break;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAddonOptions);
  } else {
    initAddonOptions();
  }

  // Reinitialize on Shopify theme section events
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initAddonOptions);
    document.addEventListener('shopify:section:reorder', initAddonOptions);
  }

})();