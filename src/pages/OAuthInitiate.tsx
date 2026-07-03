import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

const LOVABLE_PROJECT_ID = "b7c26f5d-c4f2-4d2d-923d-999abc0354cb";
const OAUTH_BROKER_URL = "https://oauth.lovable.app/initiate";

const OAuthInitiate = () => {
  const targetUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("project_id", LOVABLE_PROJECT_ID);
    return `${OAUTH_BROKER_URL}?${params.toString()}`;
  }, []);

  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Opening Google login</h1>
        <p className="text-muted-foreground">Please wait while Trendra connects securely.</p>
        <a className="inline-flex text-primary underline underline-offset-4" href={targetUrl}>
          Continue manually
        </a>
      </div>
    </main>
  );
};

export default OAuthInitiate;