/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.pinimg.com"], // 👈 whitelist your image domain here
  },
};

export default nextConfig;  // ✅ ESM syntax instead of module.exports
