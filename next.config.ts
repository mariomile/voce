import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Our AGENTS.md is hand-written: don't let `next dev` append its block.
  agentRules: false,
  experimental: {
    // CSV imports send files up to 1 MB: the default 1 MB leaves no room for the request around it.
    serverActions: { bodySizeLimit: "2mb" },
  },
  // No page can be framed by another site (clickjacking on the collect settings and the analysis).
  // A full CSP comes later, tested with PostHog and Stripe.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// Links src/i18n/request.ts, where the language of each request is decided.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
