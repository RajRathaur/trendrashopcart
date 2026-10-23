# Project Rules

- Validate delivery phone, address, and compulsory GPS coordinates through `src/lib/deliveryDetails.ts` before every customer order insert, so all checkout paths enforce the same rules.
- Festival sale settings (on/off, title, coupon, start/end time) live in site_content keys parsed by src/lib/festivalSale.ts, so admin can change them without code changes.
- Virtual Try-On runs fully in the browser (MediaPipe Pose body landmarks only, loaded lazily from CDN; fit math in `src/lib/tryOnFit.ts`, garment cut-out in `src/lib/garmentCutout.ts`), so shopper camera/photos never leave the device and the product page bundle stays light. The only exception is the opt-in AI Pro Try-On (`ai-tryon` edge function): it takes the garment photo from the product record, never stores the shopper photo, and enforces a per-user daily cap via `ai_tryon_usage` with rules in `supabase/functions/ai-tryon/limit.ts`.
