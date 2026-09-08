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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Smart capture uses a plain <input capture> file picker, not
          // getUserMedia(), so camera can stay fully disabled here too.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // frame-ancestors is the modern, non-bypassable replacement for
          // X-Frame-Options (kept above for older browsers) -- closes the
          // clickjacking vector on the login/auth forms specifically.
          // A full script/style-restricting CSP was deliberately left for
          // later: doing it properly needs nonces threaded through `proxy.ts`
          // and forces every currently-static page into dynamic rendering,
          // which is a real cost for a marginal gain here -- there's no
          // third-party script, no dangerouslySetInnerHTML with untrusted
          // content (the one usage, the QR SVG, was traced and only ever
          // contains numeric path data -- see STATUS.md), and React escapes
          // JSX output by default.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
        ],
      },
    ];
  },
};

export default nextConfig;
