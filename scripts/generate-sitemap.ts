// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Lists the public pages plus every active product, using the store's main address.
// If the product list can't be fetched (offline build), only the fixed pages are written.
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://trendra.store"; // must match SITE_URL in src/lib/site.ts

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

// Only pages that open without login (see src/lib/publicPaths.ts).
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/bazaar", changefreq: "daily", priority: "0.7" },
  { path: "/reels", changefreq: "daily", priority: "0.7" },
  { path: "/videos", changefreq: "daily", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
];

const readEnv = (): Record<string, string> => {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  const file = resolve(".env");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
};

const fetchProducts = async (): Promise<SitemapEntry[]> => {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/products?select=id,updated_at&is_active=eq.true&price=gt.1&order=created_at.desc&limit=5000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { id: string; updated_at: string | null }[];
    return rows.map((r) => ({
      path: `/product/${r.id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: r.updated_at ? r.updated_at.slice(0, 10) : undefined,
    }));
  } catch {
    return [];
  }
};

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

const products = await fetchProducts();
const entries = [...staticEntries, ...products];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries, ${products.length} products)`);
