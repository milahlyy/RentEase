/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "media.karousell.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8787",
      },
      {
        protocol: "https",
        hostname: "api-rentease.milahly.top",
      },
    ],
  },
  transpilePackages: ["@rentease/shared"],
};

export default nextConfig;
