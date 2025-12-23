/**
 * Product Add-ons functionality
 */
(function() {
  'use strict';

  let initialized = false;

  function initProductAddons() {
    if (initialized) return;
    initialized = true;

    const productForms = document.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]');
    
    if (!productForms || productForms.length === 0) return;
    
    productForms.forEach(function(form) {
      // Check if already initialized
      if (form.dataset.addonsInitialized) return;
      form.dataset.addonsInitialized = 'true';

      form.addEventListener('submit', handleFormSubmit);
    });
    
    // Sync initial checkbox states and setup delegation
    syncCheckboxStates();
  }

  function handleFormSubmit(e) {
    try {
      const form = e.target;
      const addonsContainer = form.querySelector('[id^="product-addons-"]');
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
  }
  
  function syncCheckboxStates() {
    // Use event delegation on the container instead of individual checkboxes
    const addonsContainers = document.querySelectorAll('[id^="product-addons-"]');
    
    addonsContainers.forEach(container => {
      // Initialize current checkbox states
      const checkboxes = container.querySelectorAll('.product-addons__checkbox');
      checkboxes.forEach(checkbox => {
        updateCheckboxUI(checkbox);
      });

      // Event delegation for checkbox changes
      container.addEventListener('change', function(e) {
        if (e.target.classList.contains('product-addons__checkbox')) {
          updateCheckboxUI(e.target);
        }
      });
    });
  }

  function updateCheckboxUI(checkbox) {
    const label = checkbox.closest('.product-addons__item');
    if (!label) return;

    if (checkbox.checked) {
      label.classList.add('product-addons__item--checked');
    } else {
      label.classList.remove('product-addons__item--checked');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductAddons);
  } else {
    initProductAddons();
  }

  // Reinitialize on theme section reloads
  document.addEventListener('shopify:section:load', function() {
    initialized = false;
    initProductAddons();
  });
})();