## Goal
Login sirf email + password ho. OTP verification sirf signup ke waqt (naya Gmail verify karne ke liye) — uske baad har login pe OTP bilkul nahi.

## Changes

### `src/pages/Login.tsx`
- Password login flow se pura 2FA/OTP block hata dena:
  - `handleSubmit` me `signIn` success ke baad seedha redirect — no `signOut()`, no `signInWithOtp()`, no `localStorage` verified flag, no `pending2FA`.
  - `pending2FA`, `twoFAEmail`, `twoFAOtp`, `twoFALoading`, `resendCooldown` state + `handleVerify2FA` + `handleResend2FA` + OTP UI block sab remove.
  - "Verify it's you" heading aur OTP input card hata dena.
- Signup flow (`signUp`) as-is — Supabase confirmation email already sent (`emailRedirectTo: window.location.origin`), user email link se verify karega. Toast message rahega: "Account created! Please check your email to verify."
- "Email OTP" tab (passwordless login via OTP) — user ne mention nahi kiya, lekin ye alag optional login method hai. **Rakhna hai** as-is (user ke liye backup); user ne sirf password-flow ka OTP hatane ko bola.

### No other files touched
- `useAuth.tsx`, Supabase config, migrations — no changes needed.

## Result
- Signup: email + password → confirmation email → verify → login.
- Login: email + password → straight in. No OTP ever again.
