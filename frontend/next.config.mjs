import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.pinimg.com"],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/demo.mp4",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
};

export default nextConfig;
