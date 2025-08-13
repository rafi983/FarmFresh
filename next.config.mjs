/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Increase API payload size limit to handle multiple compressed images
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
  // Handle large request bodies in the new App Router
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
