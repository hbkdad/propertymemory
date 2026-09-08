import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Matches the 25MB cap on attachments.size_bytes in the DB schema, plus
    // headroom for multipart/form-data overhead (default limit is 1MB).
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
  // tesseract.js spawns a worker thread by resolving a real file path to its
  // own worker script at runtime. If bundled, Turbopack/webpack rewrite that
  // path and the spawn fails with MODULE_NOT_FOUND -- so it must be loaded
  // via plain `require` from node_modules instead of bundled.
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
};

export default nextConfig;
