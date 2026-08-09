import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.ngrok-free.app", "*.ngrok.app", "*.ngrok.io"],
    },
  },
  allowedDevOrigins: ["*.ngrok-free.app", "localhost:3000"],
};

export default nextConfig;
