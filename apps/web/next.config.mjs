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
    ],
  },
  transpilePackages: ["@rentease/shared"],
};

export default nextConfig;
