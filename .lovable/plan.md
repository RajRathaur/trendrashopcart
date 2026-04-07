

# Order Tracking Page with Real-Time Status Updates

## Overview
Create a dedicated order detail/tracking page (`/order/:id`) that shows a visual timeline of the order's journey, order details, items, and updates in real-time using Supabase Realtime subscriptions.

## What gets built

1. **New page: `src/pages/OrderDetail.tsx`**
   - Route: `/order/:id` (navigated from the Orders list)
   - Visual vertical timeline showing all order statuses (Order Placed > Confirmed > Shipped > Delivered) with timestamps
   - Current status highlighted with animation; completed steps shown in green
   - Full order details: items list, shipping address, payment method, total
   - Real-time listener on the `orders` table so status changes appear instantly without refresh
   - Estimated delivery date based on order date
   - Support for cancelled/returned states with appropriate styling

2. **Update `src/pages/Orders.tsx`**
   - Add a "Track Order" button/link on each order card that navigates to `/order/:orderId`

3. **Update `src/App.tsx`**
   - Add route for `/order/:id`

4. **Enable Realtime on orders table**
   - Database migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`

## Technical Details

- **Realtime**: Subscribe to `postgres_changes` on `orders` table filtered by the specific order ID, listening for `UPDATE` events to refresh status
- **Timeline component**: Vertical timeline with connector lines, icons per status, and timestamps. Uses Framer Motion for entrance animations
- **Mobile-first**: Designed for the 427px viewport the user is currently using
- **Status flow**: pending → confirmed → shipped → delivered (with cancelled/returned as terminal states)

