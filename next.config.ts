import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app", "localhost:3000"],
    },
  },
  allowedDevOrigins: ["*.ngrok-free.app", "localhost:3000"],
};

export default nextConfig;
