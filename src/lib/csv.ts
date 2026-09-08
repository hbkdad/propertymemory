export type CsvColumn<T> = { key: keyof T; label: string };

// RFC 4180: quote a field only when it contains a comma, quote, or newline;
// escape embedded quotes by doubling them.
function escapeCsvField(value: unknown) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((column) => escapeCsvField(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => escapeCsvField(row[column.key])).join(","));
  return [header, ...lines].join("\r\n");
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
