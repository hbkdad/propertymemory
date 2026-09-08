import "server-only";
import QRCode from "qrcode";
import { headers } from "next/headers";

// A plain page GET (unlike a Server Action POST) carries no Origin header --
// browsers only send Origin for actions/CORS-relevant requests. Reconstruct
// from Host + the proxy-set forwarded-proto header instead (what Vercel and
// most reverse proxies set), falling back to http for local dev.
async function siteOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = requestHeaders.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

// Asset primary keys are already opaque UUIDs (ADR/architecture: no separate
// public_id needed) -- the QR just encodes a normal, authenticated asset URL.
export async function assetUrl(assetId: string) {
  return `${await siteOrigin()}/assets/${assetId}`;
}

export async function generateQrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 1, width: 240 });
}
