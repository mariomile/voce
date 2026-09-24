import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Our AGENTS.md is hand-written: don't let `next dev` append its block.
  agentRules: false,
};

export default nextConfig;
