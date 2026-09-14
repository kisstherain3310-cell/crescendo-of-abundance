import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // localhost is allowed by default; 127.0.0.1 is a different origin.
  // Without this, `next dev` blocks /_next chunks + HMR from 127.0.0.1,
  // which hydrates as HUD-only HTML (tomatoCount) with no canvas/modal.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
