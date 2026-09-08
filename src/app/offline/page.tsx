import { branding } from "@/lib/branding";

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        {branding.productName} couldn&apos;t reach the network and this page hasn&apos;t been saved for
        offline use yet. Reconnect and try again.
      </p>
    </div>
  );
}
