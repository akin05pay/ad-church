export type CsvRow = Record<string, string>;

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectDelimiter(text: string) {
  const line = text.split(/\r?\n/, 1)[0] ?? "";
  const options = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;

  for (const delimiter of options) {
    let count = 0;
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') quoted = !quoted;
      if (!quoted && char === delimiter) count += 1;
    }
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

export function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      field = "";

      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some((value) => value !== "")) rows.push(row);

  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) return [];

  const headers = headerRow.map(normalizeHeader);
  return dataRows.map((values) => {
    const record: CsvRow = {};
    headers.forEach((header, index) => {
      if (header) record[header] = values[index] ?? "";
    });
    return record;
  });
}

export function pick(row: CsvRow, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value?.trim()) return value.trim();
  }
  return "";
}

export function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const brazilian = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
