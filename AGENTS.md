# Project Rules

- Validate delivery phone, address, and compulsory GPS coordinates through `src/lib/deliveryDetails.ts` before every customer order insert, so all checkout paths enforce the same rules.