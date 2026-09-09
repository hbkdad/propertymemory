import { defineConfig, devices } from "@playwright/test";

// Port 3010 is not arbitrary: Supabase Auth's redirect-URL allow-list
// (supabase/config.toml site_url/additional_redirect_urls) only permits this
// exact origin, so email-confirmation links would 400 on any other port.
//
// Host must be `localhost`, not `127.0.0.1`, despite both being in that
// allow-list: Next 16's NextURL silently rewrites any 127.x.x.x hostname to
// the literal string "localhost" when a route handler does
// request.nextUrl.clone() (see node_modules/next/dist/server/web/next-url.js,
// REGEX_LOCALHOST_HOSTNAME) -- src/app/auth/confirm/route.ts does exactly
// that to build its post-confirmation redirect. Starting from 127.0.0.1
// means that redirect silently lands on a different-origin `localhost` URL,
// which doesn't carry the 127.0.0.1-scoped session cookie the confirm route
// just set, so the user bounces to /login looking logged out. Starting from
// localhost avoids the rewrite entirely -- and matches how this app is
// actually used locally (see README.md).
const PORT = 3010;
const BASE_URL = `http://localhost:${PORT}`;

// Boots against `next build && next start`, not `next dev` -- this project
// has repeatedly hit Turbopack dev-mode staleness that doesn't reflect real
// output (see docs/STATUS.md Issues #6, #8, #14, #15), and E2E is exactly
// the layer meant to catch what unit tests can't, so it should exercise the
// same artifact a real deploy would serve.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // each test signs up its own user, but shares one Mailpit inbox/webServer
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});
