# Project Rules

- Validate delivery phone, address, and compulsory GPS coordinates through `src/lib/deliveryDetails.ts` before every customer order insert, so all checkout paths enforce the same rules.
- Festival sale settings (on/off, title, coupon, start/end time) live in site_content keys parsed by src/lib/festivalSale.ts, so admin can change them without code changes.
