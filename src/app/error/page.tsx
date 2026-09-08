import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Link expired or invalid</h1>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        That confirmation or reset link is no longer valid. Request a new one and try again.
      </p>
      <Link href="/login" className="text-sm underline">
        Back to log in
      </Link>
    </div>
  );
}
