/** One row of pasted data, as parsed: CSV and TSV cells are strings. */
export type RawRow = Record<string, unknown>;

/** What pasted text parsed to. */
export interface Parsed {
  rows: RawRow[];
  /** The format the text was read as, or null for empty text. */
  format: "json" | "csv" | "tsv" | null;
  /** Why the text couldn't be read; `rows` is then empty. */
  error?: string;
}

/**
 * The delimiter of a block of delimited text: whichever of tab, comma, and
 * semicolon its header line has most of (outside quotes). A tab wins ties,
 * since spreadsheets paste tab-separated cells.
 */
export function sniffDelimiter(text: string): "\t" | "," | ";" {
  const header = text.split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, "");
  const count = (c: string) => header.split(c).length - 1;
  const tabs = count("\t");
  const commas = count(",");
  const semis = count(";");
  if (tabs && tabs >= commas && tabs >= semis) return "\t";
  return semis > commas ? ";" : ",";
}

/**
 * Splits delimited text into rows of cells, honoring double-quoted cells
 * (which may hold the delimiter, newlines, and `""` for a quote).
 */
export function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') cell += text[i++];
      else quoted = false;
    } else if (c === '"' && cell.trim() === "") {
      quoted = true;
      cell = "";
    } else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

/**
 * Column names for a header row: trimmed, with a blank one named by its
 * position and a repeated one numbered, so every key is unique.
 */
export function headerKeys(header: string[]): string[] {
  const seen = new Map<string, number>();
  return header.map((raw, i) => {
    const name = raw.trim() || `column ${i + 1}`;
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    return n > 1 ? `${name} ${n}` : name;
  });
}

/** Reads CSV or TSV text with a header row into rows of string cells. */
export function parseDelimited(text: string, delimiter: string): RawRow[] {
  const [header, ...body] = splitDelimited(text, delimiter);
  if (!header) return [];
  const keys = headerKeys(header);
  return body.map(cells =>
    Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? ""])),
  );
}

/** Whether a value is a plain object (a JSON row). */
function isRow(value: unknown): value is RawRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The rows of parsed JSON: an array of objects, or the first array of
 * objects an object holds (as in `{"data": [...]}`).
 */
export function jsonRows(value: unknown): RawRow[] | string {
  const list = Array.isArray(value)
    ? value
    : isRow(value)
      ? Object.values(value).find(Array.isArray)
      : undefined;
  if (!list) return "JSON must be an array of objects, one per row.";
  if (!list.every(isRow))
    return "Every item in the JSON array must be an object, one per row.";
  return list;
}

/**
 * Parses pasted data: a JSON array of objects, or CSV or TSV text with a
 * header row (as pasted from a spreadsheet).
 */
export function parseData(text: string): Parsed {
  const trimmed = text.trim();
  if (!trimmed) return {rows: [], format: null};
  if (/^[[{]/.test(trimmed)) {
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {rows: [], format: "json", error: `Invalid JSON: ${message}`};
    }
    const rows = jsonRows(value);
    return typeof rows === "string"
      ? {rows: [], format: "json", error: rows}
      : {rows, format: "json"};
  }
  const delimiter = sniffDelimiter(trimmed);
  const rows = parseDelimited(trimmed, delimiter);
  const format = delimiter === "\t" ? "tsv" : "csv";
  if (!rows.length)
    return {
      rows,
      format,
      error: "Found a header row but no data rows beneath it.",
    };
  return {rows, format};
}
