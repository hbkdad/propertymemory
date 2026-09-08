"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700 print:hidden"
    >
      Print
    </button>
  );
}
