import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og.js";

function houseIcon(size) {
  const pad = size * 0.24;
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#171717",
        borderRadius: size * 0.2,
      },
      children: {
        type: "svg",
        props: {
          width: size - pad * 2,
          height: size - pad * 2,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#fafafa",
          strokeWidth: 1.6,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            { type: "path", props: { d: "M3 11.5 12 4l9 7.5" } },
            { type: "path", props: { d: "M5.5 9.8V20h13V9.8" } },
            { type: "path", props: { d: "M9.5 20v-6h5v6" } },
          ],
        },
      },
    },
  };
}

async function render(size, filename) {
  const response = new ImageResponse(houseIcon(size), { width: size, height: size });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(new URL(filename, import.meta.url), buffer);
  console.log(`wrote ${filename}, ${buffer.length} bytes`);
}

await render(192, "../public/icon-192.png");
await render(512, "../public/icon-512.png");
await render(192, "../src/app/icon.png");
await render(180, "../src/app/apple-icon.png");
