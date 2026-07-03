import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Global handler that runs after any OAuth/full-page auth redirect.
 * When a user lands back on the app with an authenticated session,
 * consume any saved `post_login_redirect` (set before signInWithOAuth)
 * and navigate to that same-origin path.
 */
const PostLoginRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;
    const target = sessionStorage.getItem("post_login_redirect");
    if (!target) return;

    // Only same-origin relative paths
    const safe = target.startsWith("/") && !target.startsWith("//");
    sessionStorage.removeItem("post_login_redirect");
    if (safe && target !== location.pathname) {
      navigate(target, { replace: true });
    }
  }, [user, isLoading, navigate, location.pathname]);

  return null;
};

export default PostLoginRedirect;
