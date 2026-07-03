
-- Add phone column to profiles (nullable, unique when set)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles(phone)
  WHERE phone IS NOT NULL;

-- OTP storage table
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_phone_created_idx
  ON public.phone_otps(phone, created_at DESC);

-- Only service_role (edge functions) can touch OTP table. No client access.
GRANT ALL ON public.phone_otps TO service_role;

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon = no access from client. Only service_role bypasses RLS.
CREATE POLICY "service role manages otps"
  ON public.phone_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
