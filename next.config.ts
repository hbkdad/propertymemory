import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Matches the 25MB cap on attachments.size_bytes in the DB schema, plus
    // headroom for multipart/form-data overhead (default limit is 1MB).
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
