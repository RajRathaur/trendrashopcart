# Trendra premium marketplace format

## Goal
Match the uploaded reference’s clean, dense marketplace format while keeping Trendra branding, existing products, games, payments, and admin features intact.

## Changes
- Rework the top area into the same compact structure: slim offer strip, blue brand/search/account bar, then a white category navigation row.
- Make the homepage light, crisp, and commerce-focused with a compact trust strip, circular category rail, colorful section banners, dense product rows, and a structured dark footer.
- Polish product cards to match the reference: larger product image, compact category/name/rating/price hierarchy, discount and deal badges, wishlist control, and stable mobile sizing.
- Keep the current page order and functionality, but reduce heavy animation, excessive spacing, rounded panels, and effects that cause visual lag.
- Preserve responsive behavior: two products per row on mobile, denser desktop rows, no clipped text, and no overlapping controls.

## Technical details
- Reuse existing Trendra assets and live product/category data; no dummy customer data will be added.
- Use existing semantic theme tokens and shared controls rather than isolated hardcoded styling.
- Limit expensive entrance effects on repeated product rows and keep ads lazy-loaded.
- Verify the homepage at desktop and mobile sizes, check scrolling and interactions, then confirm the latest build is clean.
