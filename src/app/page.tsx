import Link from "next/link";
import { branding } from "@/lib/branding";

const questions = [
  "Where's the receipt for the water heater?",
  "What paint color is the living room?",
  "When was the furnace last serviced, and by whom?",
  "Which appliances are still under warranty?",
];

const steps = [
  {
    title: "Capture",
    body: "Snap a photo of a receipt or an appliance label. Smart capture reads the manufacturer, model, and serial number for you.",
  },
  {
    title: "Organize",
    body: "Everything files itself under the right property, space, and asset -- structured automatically, never a junk drawer of PDFs.",
  },
  {
    title: "Remember",
    body: "Every repair, purchase, and warranty stays attached to the exact thing it belongs to, for as long as you own the place.",
  },
  {
    title: "Find",
    body: "Search by manufacturer, model number, or address and get the one answer you needed -- in seconds, not a box in the garage.",
  },
];

const features = [
  { title: "Smart capture", body: "Free, built-in OCR reads receipts and appliance labels -- no typing." },
  { title: "Full history", body: "A timeline of every repair, inspection, and renovation, per property." },
  { title: "Warranties & expenses", body: "Know what's covered, what it cost, and what's expiring soon." },
  { title: "Reminders", body: "One-time or recurring -- filters, inspections, anything on a schedule." },
  { title: "QR asset labels", body: "Print a label, stick it on the appliance, scan it to pull up its history." },
  { title: "Export anytime", body: "A full PDF report or CSV data -- for an insurer, a buyer, or a backup." },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{branding.productName}</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">{branding.shortTagline}</p>
        <div className="mt-2 flex gap-4 text-sm">
          <Link href="/login" className="underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white no-underline dark:bg-zinc-100 dark:text-zinc-900"
          >
            Sign up free
          </Link>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-zinc-500">
          Sound familiar?
        </h2>
        <ul className="mx-auto mt-4 max-w-lg space-y-2 text-center text-lg text-zinc-700 dark:text-zinc-300">
          {questions.map((question) => (
            <li key={question}>&ldquo;{question}&rdquo;</li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500">{`0${index + 1}`}</p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">What&apos;s inside</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-20 flex flex-col items-center gap-3 border-t border-zinc-200 pt-10 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No rent collection, no accounting, no tenant screening -- just the history of your property, in one place.
        </p>
        <Link
          href="/signup"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Sign up free
        </Link>
        <p className="mt-4 text-xs text-zinc-500">New features added regularly.</p>
      </div>
    </div>
  );
}
