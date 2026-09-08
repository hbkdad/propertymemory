"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a progressive enhancement; the app works fine
        // without it if registration fails (unsupported browser, etc.).
      });
    }
  }, []);

  return null;
}
