import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Our AGENTS.md is hand-written: don't let `next dev` append its block.
  agentRules: false,
  experimental: {
    // CSV imports send files up to 1 MB: the default 1 MB leaves no room for the request around it.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
