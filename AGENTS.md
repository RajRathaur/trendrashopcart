# Project Rules

- Validate delivery phone, address, and compulsory GPS coordinates through `src/lib/deliveryDetails.ts` before every customer order insert, so all checkout paths enforce the same rules.
- Festival sale settings (on/off, title, coupon, start/end time) live in site_content keys parsed by src/lib/festivalSale.ts, so admin can change them without code changes.
- Virtual Try-On runs fully in the browser (MediaPipe Pose loaded lazily from CDN, fit math in `src/lib/tryOnFit.ts`), so shopper camera/photos never leave the device and the product page bundle stays light.
