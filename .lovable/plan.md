## Account Linking: Mobile OTP (MSG91) + Google

Goal: Ek hi user account, chahe Google se login kare ya mobile OTP se. Dono methods same user ko point karenge.

### How linking works

- **Auto-link on match:** Agar mobile OTP wala phone kisi profile mein already save hai, ya Google account ka email kisi profile se match kare → wahi account use hoga (naya nahi banega).
- **Manual link from Profile:** User apni Profile page se "Link Google Account" ya "Link Phone Number" button dabakar dono methods jod sakta hai.

### What you'll need to provide

1. **MSG91 credentials** (SMS bhejne ke liye):
   - `MSG91_AUTH_KEY` (dashboard → API → Auth Key)
   - `MSG91_TEMPLATE_ID` (OTP template ID jo aap MSG91 mein banayenge, DLT-approved for India)
   - `MSG91_SENDER_ID` (6-char sender ID, e.g. `TRENDR`)

Main aapse `add_secret` tool se maangunga jab implementation start karein.

### New DB tables

- `phone_otps` — phone, otp_hash, expires_at (5 min), attempts (max 5), created_at
- `profiles.phone` column add — unique, nullable

### New Edge Functions

- `send-phone-otp` — MSG91 API call karke 6-digit OTP bhejta hai, hashed OTP DB mein save
- `verify-phone-otp` — OTP check karke:
  - Agar phone existing profile se link hai → us user ko sign in karata hai (admin API se magic link generate)
  - Agar naya phone hai aur user pehle se signed-in hai → link kar deta hai
  - Agar naya phone hai aur koi login nahi → naya account banata hai (phone-only, email null)

### UI changes

**`/login` page:**
- 2 tabs: "Email/Password" (existing) aur "Mobile OTP" (naya)
- Mobile OTP tab: Phone input → "Send OTP" → 6-digit OTP input → "Verify & Login"
- Google button same rahega

**`/profile` page:**
- Naya section: "Connected Accounts"
  - Google: linked/not linked → "Link Google" button (uses `supabase.auth.linkIdentity`)
  - Phone: linked number dikhaye ya "Add Phone" button (OTP flow)
  - Unlink option (agar dusri method available ho)

### Auto-linking logic

Google login ke baad `onAuthStateChange` mein check:
- Agar `user.email` kisi purane profile ke email se match kare → merge (profile me google identity add)
- Agar `user.phone` kisi profile ke phone se match kare → merge

Phone OTP verify ke baad:
- Phone se profile dhundo → agar mila to us user ka session issue karo
- Nahi mila → naya user banao

### Files to create/edit

**New:**
- `supabase/functions/send-phone-otp/index.ts`
- `supabase/functions/verify-phone-otp/index.ts`
- `src/components/auth/PhoneOtpForm.tsx`
- `src/components/profile/ConnectedAccounts.tsx`

**Edit:**
- `src/pages/Login.tsx` — add tabs (Email | Mobile)
- `src/pages/Profile.tsx` — add ConnectedAccounts section
- `src/hooks/useAuth.tsx` — expose `linkIdentity`, `linkPhone`, `unlinkIdentity`

### Migration

```text
Table: phone_otps (phone, otp_hash, expires_at, attempts)
Column: profiles.phone (unique text)
RLS: phone_otps → only service_role (edge functions only, no client access)
```

### Security notes

- OTP hashed with bcrypt/sha256 before storing
- Rate limit: max 3 OTPs per phone per hour
- OTP expiry: 5 minutes
- Max 5 verify attempts per OTP
- Phone number validated as Indian format (+91XXXXXXXXXX)

### Order of implementation

1. DB migration (phone_otps table + profiles.phone column)
2. Request MSG91 secrets via `add_secret`
3. Edge functions (send-otp, verify-otp)
4. `PhoneOtpForm` component + Login page tabs
5. `ConnectedAccounts` component + Profile page section
6. Test both flows

Approve karein to shuru karta hoon.