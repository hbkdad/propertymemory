import Link from "next/link";
import { branding } from "@/lib/branding";

const faqs = [
  {
    q: "What is this?",
    a: `${branding.productName} keeps the history of a home or rental property in one place -- every appliance, repair, warranty, and receipt -- so you're not digging through drawers and emails when you need one answer. It's not property-management software: no rent collection, no accounting, no tenant screening.`,
  },
  {
    q: "How do I get started?",
    a: "Sign up, name your first property, then add spaces (like Kitchen or Basement) and assets (like a furnace or dishwasher) as you go. Nothing has to be filled in all at once -- add detail whenever you have it.",
  },
  {
    q: "How does scanning a receipt or appliance label work?",
    a: "Smart capture reads the photo and fills in the manufacturer, model, serial number, or amount for you. It's always shown back to you to review and correct before anything is saved -- nothing is committed automatically, since OCR isn't perfect.",
  },
  {
    q: "Who can see my property's information?",
    a: "Only you, and anyone you explicitly add to your household or organization. Every property, record, and file is isolated at the database level so no other account can read or write it -- not just hidden in the interface.",
  },
  {
    q: "Can I get my data out?",
    a: "Yes, any time, from each property's page: a full PDF report, or CSV files for your history, assets, and expenses -- useful for an insurer, a buyer, or just a backup.",
  },
  {
    q: "Does it work without an internet connection?",
    a: "You can install it to your home screen like an app. Pages you've already visited stay available if you lose signal, though anything you haven't loaded yet still needs a connection the first time.",
  },
  {
    q: "What does it cost?",
    a: "Nothing right now.",
  },
  {
    q: "I found a bug, or something's missing.",
    a: `Email ${branding.supportEmail}.`,
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 underline">
        Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Help</h1>

      <dl className="mt-8 space-y-6">
        {faqs.map((faq) => (
          <div key={faq.q}>
            <dt className="font-medium">{faq.q}</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
