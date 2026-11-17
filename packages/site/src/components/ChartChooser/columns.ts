import {isIso3, stateCode} from "./geo.js";
import type {StateCode} from "./geo.js";
import type {RawRow} from "./parse.js";
import {isEmpty, toBoolean, toDate, toNumber, yearColumn} from "./values.js";
import type {DateKind} from "./values.js";

/** A cell's value once its column is typed. */
export type Cell = string | number | boolean | string[];
/** A row with every cell typed and every empty cell left out. */
export type Row = Record<string, Cell>;

export type ColumnType = "number" | "date" | "category" | "boolean" | "sets";

/** What a column holds, as the chooser reads it. */
export interface Column {
  key: string;
  type: ColumnType;
  /** Rows with a value. */
  count: number;
  /** Distinct values. */
  unique: number;
  /** A number column's range, and whether every value is whole. */
  min?: number;
  max?: number;
  integer?: boolean;
  /** A date column's finest kind of value, and whether every value is ISO. */
  dateKind?: DateKind;
  dateIso?: boolean;
  /** A category column of country codes or US states. */
  geo?: "iso3" | "state";
  stateCode?: StateCode;
  /** A number column of latitudes or longitudes. */
  coord?: "lat" | "lon";
  /** A sets column of text: the delimiter between the names of a row's sets. */
  setDelimiter?: string;
  /** A category column's mean value length, which favors names over codes. */
  length?: number;
}

/** Typed rows and the columns they hold. */
export interface Profile {
  rows: Row[];
  columns: Column[];
}

const DATE_ORDER: DateKind[] = ["year", "quarter", "month", "day", "time"];

/** Every key the rows use, in the order they first appear. */
export function columnKeys(rows: RawRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) keys.add(key);
  return [...keys];
}

/**
 * The delimiter that joins set names in a column of text (`Python & SQL`),
 * or undefined: some values join names with it, and every name joined also
 * stands alone as a value, so the column names sets and their overlaps.
 */
export function setDelimiter(values: string[]): string | undefined {
  for (const d of ["&", "|", "∩", "+", ";", ","]) {
    const combos = values.filter(v => v.includes(d));
    if (!combos.length) continue;
    const singles = new Set(values.filter(v => !v.includes(d)));
    const names = combos.flatMap(v => v.split(d).map(s => s.trim()));
    if (singles.size >= 2 && names.every(n => singles.has(n))) return d;
  }
  return undefined;
}

/** The coordinate a number column's name and range make it, if any. */
export function coordinate(
  key: string,
  min: number,
  max: number,
): "lat" | "lon" | undefined {
  const name = key.trim().toLowerCase();
  if (/^(lat|latitude)$/.test(name) && min >= -90 && max <= 90) return "lat";
  if (/^(lon|lng|long|longitude)$/.test(name) && min >= -180 && max <= 180)
    return "lon";
  return undefined;
}

/**
 * Types one column from its non-empty values, returning the column and a
 * function that types each of its cells.
 */
export function typeColumn(
  key: string,
  values: unknown[],
): {column: Column; cell: (value: unknown) => Cell} {
  const base = {key, count: values.length};
  const distinct = (cells: Cell[]) => new Set(cells.map(String)).size;
  // A column with no values (left out of the profile) is text.
  if (!values.length)
    return {column: {...base, type: "category", unique: 0}, cell: String};

  if (values.some(Array.isArray)) {
    const cell = (v: unknown) =>
      (Array.isArray(v) ? v : [v]).map(s => String(s).trim());
    return {
      column: {...base, type: "sets", unique: distinct(values.map(cell))},
      cell,
    };
  }

  // Zero-padded digits (`"01"`, a FIPS or ZIP code) are codes, not numbers.
  const padded = values.some(
    v => typeof v === "string" && /^0\d/.test(v.trim()),
  );
  const numbers = values.map(toNumber);
  if (!padded && numbers.every(n => n !== undefined)) {
    const ns = numbers as number[];
    if (yearColumn(key, ns)) {
      const column: Column = {...base, type: "date", unique: distinct(ns)};
      Object.assign(column, {dateKind: "year", dateIso: true});
      return {column, cell: v => toNumber(v) as number};
    }
    const min = ns.reduce((a, b) => Math.min(a, b));
    const max = ns.reduce((a, b) => Math.max(a, b));
    const column: Column = {...base, type: "number", unique: distinct(ns)};
    Object.assign(column, {min, max, integer: ns.every(Number.isInteger)});
    const coord = coordinate(key, min, max);
    if (coord) column.coord = coord;
    return {column, cell: v => toNumber(v) as number};
  }

  if (values.every(v => toBoolean(v) !== undefined)) {
    const cell = (v: unknown) => toBoolean(v) as boolean;
    return {
      column: {...base, type: "boolean", unique: distinct(values.map(cell))},
      cell,
    };
  }

  const text = values.map(v => String(v).trim());
  const dates = text.map(toDate);
  if (dates.every(d => d !== undefined)) {
    const kinds = dates.map(d => DATE_ORDER.indexOf(d!.kind));
    const column: Column = {...base, type: "date", unique: distinct(text)};
    column.dateKind = DATE_ORDER[kinds.reduce((a, b) => Math.max(a, b))];
    column.dateIso = dates.every(d => d!.iso);
    return {column, cell: v => String(v).trim()};
  }

  const cell = (v: unknown) => String(v).trim();
  const column: Column = {...base, type: "category", unique: distinct(text)};
  column.length = text.reduce((sum, s) => sum + s.length, 0) / text.length;
  const delimiter = setDelimiter(text);
  if (delimiter) Object.assign(column, {type: "sets", setDelimiter: delimiter});
  else if (isIso3(text)) column.geo = "iso3";
  else {
    const code = stateCode(text);
    if (code) Object.assign(column, {geo: "state", stateCode: code});
  }
  return {column, cell};
}

/** Types every column of parsed rows, and the rows with them. */
export function profileData(raw: RawRow[]): Profile {
  const keys = columnKeys(raw);
  const typed = keys.map(key =>
    typeColumn(
      key,
      raw.map(r => r[key]).filter(v => !isEmpty(v)),
    ),
  );
  const columns = typed.map(t => t.column).filter(c => c.count > 0);
  const rows = raw.map(r => {
    const row: Row = {};
    keys.forEach((key, i) => {
      if (!isEmpty(r[key])) row[key] = typed[i].cell(r[key]);
    });
    return row;
  });
  return {rows, columns};
}

/** A column's type as the summary names it, such as `category · 42 unique`. */
export function describeColumn(column: Column): string {
  const {type, unique} = column;
  if (column.geo === "iso3") return `country code · ${unique} unique`;
  if (column.geo === "state") return `US state · ${unique} unique`;
  if (column.coord) return column.coord === "lat" ? "latitude" : "longitude";
  if (type === "date") return `date · ${column.dateKind}s`;
  if (type === "number") return column.integer ? "number · whole" : "number";
  if (type === "sets") return `sets · ${unique} combinations`;
  if (type === "boolean") return "yes / no";
  return `category · ${unique} unique`;
}
