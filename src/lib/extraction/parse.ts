const MONEY_REGEX = /\$?\s?(\d{1,5}(?:,\d{3})*\.\d{2})\b/g;

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function findTotal(text: string): number | null {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (/total/i.test(line) && !/sub\s?total/i.test(line)) {
      const matches = line.match(MONEY_REGEX);
      if (matches) {
        const amount = parseAmount(matches[matches.length - 1]);
        if (amount !== null) return amount;
      }
    }
  }
  // No labeled "total" line found -- the largest dollar amount on the
  // receipt is usually the grand total (subtotal and line items are smaller).
  const all = [...text.matchAll(MONEY_REGEX)]
    .map((match) => parseAmount(match[1]))
    .filter((amount): amount is number => amount !== null);
  return all.length > 0 ? Math.max(...all) : null;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DATE_PATTERNS: { regex: RegExp; toIso: (m: RegExpMatchArray) => string | null }[] = [
  {
    // YYYY-MM-DD or YYYY/MM/DD
    regex: /\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/,
    toIso: (m) => isoDate(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  {
    // MM/DD/YYYY or MM-DD-YYYY
    regex: /\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](20\d{2})\b/,
    toIso: (m) => isoDate(Number(m[3]), Number(m[1]), Number(m[2])),
  },
  {
    // MM/DD/YY -- assumes 20xx
    regex: /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{2})\b/,
    toIso: (m) => isoDate(2000 + Number(m[3]), Number(m[1]), Number(m[2])),
  },
];

export function findDate(text: string): string | null {
  for (const { regex, toIso } of DATE_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const iso = toIso(match);
      if (iso) return iso;
    }
  }
  return null;
}

function firstTextLine(text: string, exclude?: RegExp): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2 && line.length <= 40 && /[a-zA-Z]{2,}/.test(line))
    .filter((line) => !exclude?.test(line));
  return lines[0] ?? null;
}

export function findVendor(text: string): string | null {
  return firstTextLine(text);
}

const MODEL_REGEX = /\bmodel\b\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/.]{2,})/i;
const SERIAL_REGEX = /(?:\bserial\b\s*(?:no\.?|number|#)?|\bs\/?n\b)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/.]{2,})/i;
const LABEL_KEYWORDS = /model|serial|s\/?n/i;

export function findModelNumber(text: string): string | null {
  return text.match(MODEL_REGEX)?.[1].trim() ?? null;
}

export function findSerialNumber(text: string): string | null {
  return text.match(SERIAL_REGEX)?.[1].trim() ?? null;
}

export function findManufacturer(text: string): string | null {
  return firstTextLine(text, LABEL_KEYWORDS);
}

export function parseReceiptText(text: string) {
  return {
    vendor: findVendor(text),
    date: findDate(text),
    total: findTotal(text),
  };
}

export function parseApplianceLabelText(text: string) {
  return {
    manufacturer: findManufacturer(text),
    modelNumber: findModelNumber(text),
    serialNumber: findSerialNumber(text),
  };
}
