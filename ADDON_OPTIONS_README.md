# Add-on Options Block - Configuration Guide

## Overview
The Add-on Options block allows you to offer complementary products as checkbox selections on your product pages. When customers click "Add to Cart," both the main product and selected add-ons are added to the cart as separate line items.

## Features
- ✅ Display up to 10 add-on products with checkboxes
- ✅ Configurable column layout (1-3 columns on desktop)
- ✅ Per-addon customization: variant selection, custom labels, price display
- ✅ Flexible quantity behavior (fixed or match main product)
- ✅ Configurable post-add behavior (stay, open drawer, or redirect to cart)
- ✅ Optional tagging of add-ons with main product reference
- ✅ Hide sold-out items option
- ✅ Fully responsive design
- ✅ Works with all Ella theme product page layouts

## How to Enable

### Step 1: Access Theme Customizer
1. In your Shopify admin, go to **Online Store > Themes**
2. Click **Customize** on your active Ella theme
3. Navigate to a product page

### Step 2: Add the Add-on Options Block
1. In the left sidebar, scroll to the **Product information** section
2. Click **Add block**
3. Select **Add-on Options** from the list
4. Position the block where you want it (typically after the Buy Buttons block)

### Step 3: Configure General Settings

#### Heading
- **Default:** "Add-ons"
- **Purpose:** The title displayed above your add-on options
- **Example:** "Frequently bought together" or "Complete your order"

#### Column Count
- **Options:** 1, 2, or 3 columns
- **Default:** 1 column
- **Note:** On mobile devices, add-ons always display in a single column
- **Recommendation:** Use 2-3 columns if you have many add-ons

#### Quantity Behavior
- **Fixed quantity of 1:** Each selected add-on is added with quantity 1, regardless of main product quantity
- **Match main product quantity:** If customer orders 3 of the main product, 3 of each selected add-on will also be added
- **Default:** Fixed quantity of 1
- **Use case for matching:** Product bundles, matching accessories (e.g., phone + multiple cases)

#### After Adding to Cart
- **Stay on page:** Customer remains on product page with success message
- **Open cart drawer:** Opens the cart sidebar/drawer if your theme has one
- **Redirect to cart page:** Takes customer directly to the cart page (default)
- **Recommendation:** Use "Open cart drawer" for best user experience if available

#### Tag Add-ons with Main Product
- **Default:** Off
- **When enabled:** Adds a property `_attached_to: [Main Product Title]` to each add-on in the cart
- **Purpose:** Helps identify which add-ons were purchased with which main product
- **Use case:** Order fulfillment, bundling logic, analytics

### Step 4: Configure Add-on Products

You can add up to 10 different add-on products. For each add-on:

#### Add-on Product (Required)
- Select the product from your store that you want to offer as an add-on
- **Note:** Only products that exist in your store can be selected

#### Variant ID (Optional)
- **Purpose:** Specify a particular variant if the product has multiple options
- **How to find:** 
  1. Go to Products in Shopify admin
  2. Open the product
  3. Click on a specific variant
  4. Look at the URL: `.../variants/[VARIANT_ID]`
- **If left blank:** The first available variant will be used
- **Example use:** Offer "Protection Plan - 2 Year" instead of showing all plan durations

#### Label Override (Optional)
- **Purpose:** Display custom text instead of the product title
- **Examples:**
  - Product: "Premium Leather Case" → Label: "Add Premium Case (+$29.99)"
  - Product: "Extended Warranty" → Label: "2-Year Protection Plan"
- **If left blank:** Shows product title (and variant title if not "Default Title")

#### Show Price
- **Default:** Checked (on)
- **When enabled:** Displays "+ $XX.XX" next to the add-on
- **When disabled:** Only shows the product name/label

#### Hide if Sold Out
- **Default:** Unchecked (off)
- **When enabled:** Add-on won't appear if the variant is sold out
- **When disabled:** Add-on appears but checkbox is disabled with "Sold Out" badge

### Step 5: Adjust Spacing (Optional)
- **Spacing Top:** Space above the add-ons block (0-100px)
- **Spacing Bottom:** Space below the add-ons block (0-100px)
- **Default:** 0px top, 15px bottom

## Configuration Examples

### Example 1: Simple Product Accessories
**Scenario:** Selling a camera, offering accessories

**Configuration:**
- Heading: "Complete Your Camera Kit"
- Column Count: 2
- Quantity Behavior: Fixed quantity of 1
- After Adding: Open cart drawer
- Add-ons:
  1. Product: "Camera Bag" | Show Price: Yes
  2. Product: "Extra Battery" | Show Price: Yes
  3. Product: "64GB SD Card" | Show Price: Yes
  4. Product: "Lens Cleaning Kit" | Show Price: Yes

### Example 2: Warranty/Protection Plans
**Scenario:** Offering protection plans with electronics

**Configuration:**
- Heading: "Protect Your Purchase"
- Column Count: 1
- Quantity Behavior: Fixed quantity of 1
- Tag with main: Yes (for order tracking)
- Add-ons:
  1. Product: "Protection Plan" | Variant ID: 123456 (2-year) | Label: "2-Year Protection Plan" | Show Price: Yes
  2. Product: "Protection Plan" | Variant ID: 123457 (3-year) | Label: "3-Year Protection Plan" | Show Price: Yes

### Example 3: Bulk Consumables
**Scenario:** Office supplies where customers might want multiples

**Configuration:**
- Heading: "Add More Supplies"
- Column Count: 2
- Quantity Behavior: Match main product quantity
- After Adding: Redirect to cart
- Add-ons:
  1. Product: "Ink Cartridge Black" | Show Price: Yes
  2. Product: "Ink Cartridge Color" | Show Price: Yes
  3. Product: "Photo Paper Pack" | Show Price: Yes

### Example 4: Service Add-ons
**Scenario:** Physical product with optional services

**Configuration:**
- Heading: "Additional Services"
- Column Count: 1
- Quantity Behavior: Fixed quantity of 1
- Show Price: No (prices in labels instead)
- Add-ons:
  1. Product: "Assembly Service" | Label: "Professional Assembly (includes setup)" | Show Price: No
  2. Product: "Delivery Service" | Label: "White Glove Delivery" | Show Price: No

## Styling Customization

The Add-on Options block uses these CSS classes if you want to customize styling:

```css
.addon-options                    /* Main container */
.addon-options__heading           /* Heading text */
.addon-options__list              /* Grid container */
.addon-options__list--columns-1   /* 1 column layout */
.addon-options__list--columns-2   /* 2 column layout */
.addon-options__list--columns-3   /* 3 column layout */
.addon-options__item              /* Individual add-on */
.addon-options__checkbox          /* Checkbox input */
.addon-options__label             /* Product name/label */
.addon-options__price             /* Price text */
.addon-options__soldout-badge     /* Sold out badge */
```

## Technical Details

### How It Works
1. When customer selects add-ons and clicks "Add to Cart"
2. JavaScript intercepts the form submission
3. Main product is added to cart via Shopify Cart API
4. Each selected add-on is added sequentially
5. Post-add behavior is executed (stay/drawer/redirect)

### Cart API Endpoint
Uses `/cart/add.js` with batch items support for optimal performance.

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported (uses modern JavaScript features)

### Performance
- Minimal performance impact
- JavaScript loads asynchronously (defer)
- CSS is ~4KB, JavaScript is ~7KB (before minification)

## Troubleshooting

### Add-ons not showing
- ✓ Verify block is added in Theme Customizer
- ✓ Check that products are selected in block settings
- ✓ Ensure products exist and are not archived
- ✓ Clear browser cache

### "Add to Cart" button not working
- ✓ Check browser console for JavaScript errors
- ✓ Verify addon-options.js is loading (Network tab)
- ✓ Ensure variant IDs are correct if specified
- ✓ Test with add-ons unchecked (should work normally)

### Add-ons not adding to cart
- ✓ Verify products/variants are available (not sold out)
- ✓ Check browser console for API errors
- ✓ Ensure variant IDs are valid if specified
- ✓ Test add-on products individually

### Styling issues
- ✓ Verify addon-options.css is loading
- ✓ Check for CSS conflicts with custom theme code
- ✓ Test in different browsers
- ✓ Clear theme cache

### Cart drawer not opening
- ✓ Verify your theme has a cart drawer
- ✓ Try "Redirect to cart" behavior instead
- ✓ Check theme-specific cart drawer implementation

## Best Practices

1. **Limit add-ons:** 3-5 options work best for conversion
2. **Relevant products:** Only offer truly complementary products
3. **Clear labeling:** Make it obvious what the add-on is
4. **Price transparency:** Show prices unless there's a reason not to
5. **Mobile testing:** Always test on mobile devices
6. **Performance:** Don't add too many high-resolution images to add-on products
7. **Inventory:** Use "Hide if sold out" for better customer experience
8. **Analytics:** Enable tagging to track which add-ons are popular

## Support

For issues or questions:
1. Check this documentation
2. Review Troubleshooting section
3. Check browser console for errors
4. Contact theme support with specific details

## Changelog

### Version 1.0 (December 2024)
- Initial release
- Support for up to 10 add-ons
- Configurable layouts and behaviors
- Full Ella theme integration
