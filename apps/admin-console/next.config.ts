import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@enterprise-ai-hub/admin-ui", "@enterprise-ai-hub/shared-config"],
};

export default nextConfig;
