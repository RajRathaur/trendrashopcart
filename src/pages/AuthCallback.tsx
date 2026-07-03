import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PUBLISHED_APP_ORIGIN = "https://trendrashopcart.lovable.app";
const ALLOWED_FORWARD_ORIGINS = new Set([
  PUBLISHED_APP_ORIGIN,
  "https://trendra.store",
  "https://www.trendra.store",
]);

const getHashParams = () => new URLSearchParams(window.location.hash.replace(/^#/, ""));

const getSafePostLoginPath = () => {
  const saved = sessionStorage.getItem("post_login_redirect");
  sessionStorage.removeItem("post_login_redirect");
  return saved && saved.startsWith("/") && !saved.startsWith("//") ? saved : "/";
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing secure login");

  const nextOrigin = useMemo(() => {
    const value = new URL(window.location.href).searchParams.get("next_origin");
    if (!value) return null;
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const completeLogin = async () => {
      const hash = window.location.hash;
      const hashParams = getHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (
        nextOrigin &&
        nextOrigin !== window.location.origin &&
        ALLOWED_FORWARD_ORIGINS.has(nextOrigin) &&
        accessToken &&
        refreshToken
      ) {
        const target = new URL("/auth/callback", nextOrigin);
        target.hash = hash.replace(/^#/, "");
        window.location.replace(target.toString());
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;
        navigate(getSafePostLoginPath(), { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate(getSafePostLoginPath(), { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    };

    completeLogin().catch(() => {
      setMessage("Login could not be completed. Please try again.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    });
  }, [navigate, nextOrigin]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Google login</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </main>
  );
};

export default AuthCallback;