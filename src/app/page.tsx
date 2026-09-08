import Link from "next/link";
import { branding } from "@/lib/branding";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        {branding.productName}
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        {branding.shortTagline}
      </p>
      <div className="mt-2 flex gap-4 text-sm">
        <Link href="/login" className="underline">
          Log in
        </Link>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-500">
        Under active development.
      </p>
    </div>
  );
}
