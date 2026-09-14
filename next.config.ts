import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Optional: allow loopback IP in `next dev` (localhost is already allowed).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
