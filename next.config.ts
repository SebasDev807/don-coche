import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    allowedOrigins: ["*.ngrok-free.app", "localhost:3000"],
  },
};

export default nextConfig;
