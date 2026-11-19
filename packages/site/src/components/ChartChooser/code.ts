import type {Cell, Row} from "./columns.js";

/** A config entry: a key and the source code of its value. */
export type Field = [key: string, code: string];

/** What a chart's generated code declares beyond the data. */
export interface Plan {
  /** Declarations between `const data` and `const config`. */
  prelude?: string[];
  fields: Field[];
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** An object key as source: bare when it can be, else quoted. */
export const objectKey = (key: string) =>
  IDENTIFIER.test(key) ? key : JSON.stringify(key);

/** A string as source. */
export const str = (s: string) => JSON.stringify(s);

/** A list of strings as source. */
export const strList = (list: string[]) => `[${list.map(str).join(", ")}]`;

/** A property read off `d` as source: `d.year`, or `d["Life Expectancy"]`. */
export const prop = (key: string) =>
  IDENTIFIER.test(key) ? `d.${key}` : `d[${str(key)}]`;

/** A cell as source. */
function cellSource(value: Cell): string {
  if (Array.isArray(value)) return strList(value);
  return typeof value === "string" ? str(value) : String(value);
}

/** A row as a one-line object literal. */
export function rowSource(row: Row): string {
  const entries = Object.entries(row).map(
    ([k, v]) => `${objectKey(k)}: ${cellSource(v)}`,
  );
  return `{${entries.join(", ")}}`;
}

/** The `const data = […];` declaration of a dataset, one row per line. */
export function dataSource(rows: Row[]): string {
  if (!rows.length) return "const data = [];";
  return `const data = [\n${rows.map(r => `  ${rowSource(r)},`).join("\n")}\n];`;
}

/** The whole playground code: the data, any prelude, and the config. */
export function codeSource(rows: Row[], plan: Plan): string {
  const parts = [dataSource(rows)];
  if (plan.prelude?.length) parts.push(plan.prelude.join("\n"));
  const fields = plan.fields.map(([k, v]) =>
    k === v ? `  ${k},` : `  ${objectKey(k)}: ${v},`,
  );
  parts.push(`const config = {\n${fields.join("\n")}\n};`);
  return `${parts.join("\n\n")}\n`;
}

/**
 * A round upper end for a value axis: 1 for shares, 100 for percentages,
 * else the value rounded up at its leading digit.
 */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  if (max <= 1) return 1;
  if (max <= 100) return 100;
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / step) * step;
}
