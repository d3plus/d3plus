import type {Column, Profile, Row} from "./columns.js";
import {toDate} from "./values.js";

/** The shapes the chooser finds in a dataset, which decide its charts. */
export interface Traits {
  rows: Row[];
  columns: Column[];
  /** Measures: number columns other than coordinates. */
  numbers: Column[];
  /** Category columns, place codes included. */
  categories: Column[];
  dates: Column[];
  /** The measure most charts draw. */
  value?: Column;
  /** Whether the categories and dates identify each row (a summary table, not raw observations). */
  keyed: boolean;
  /** A category naming each row: no value repeats. */
  item?: Column;
  /** Category columns that nest, outermost first (empty unless 2 or more). */
  hierarchy: Column[];
  /** Two categories that cross rather than nest. */
  crossTab?: [Column, Column];
  /** A two-valued category beside another category, for a two-sided chart. */
  twoSided?: {sides: Column; category: Column};
  /** Columns naming each row's two ends, and how many distinct nodes they name. */
  flows?: {source: Column; target: Column; nodes: number};
  ohlc?: {open: Column; high: Column; low: Column; close: Column};
  /** Columns holding the start and end of each row's span. */
  range?: {start: Column; end: Column};
  /** Number columns bounding the value, as a confidence band. */
  bounds?: {lower: Column; upper: Column};
  /** A number column the value is measured against. */
  target?: Column;
  sets?: Column;
  geo: {iso3?: Column; state?: Column; lat?: Column; lon?: Column};
  /** The date most charts draw, and how many distinct values it has. */
  date?: Column;
  periods: number;
  /** The years a date column spans. */
  years: number;
  /** A category splitting the rows into series over time. */
  series?: Column;
  /** A category splitting the rows into 2 to 12 groups of 5 or more. */
  groups?: Column;
}

/** The text of a row's values for some keys, as one string. */
const tuple = (row: Row, keys: string[]) =>
  JSON.stringify(keys.map(k => row[k] ?? null));

/** Whether no two rows share values for every key. */
export function uniqueBy(rows: Row[], keys: string[]): boolean {
  if (!keys.length) return rows.length <= 1;
  const seen = new Set<string>();
  for (const row of rows) {
    const t = tuple(row, keys);
    if (seen.has(t)) return false;
    seen.add(t);
  }
  return true;
}

/**
 * Whether `child` nests in `parent`: each child value always appears with
 * the same parent value, and the parent has fewer values.
 */
export function nestedIn(rows: Row[], child: Column, parent: Column): boolean {
  if (parent.unique >= child.unique) return false;
  const seen = new Map<string, string>();
  for (const row of rows) {
    if (!(child.key in row) || !(parent.key in row)) continue;
    const c = String(row[child.key]);
    const p = String(row[parent.key]);
    if (seen.has(c) && seen.get(c) !== p) return false;
    seen.set(c, p);
  }
  return true;
}

/** The longest chain of nested categories, outermost first. */
export function hierarchyChain(rows: Row[], categories: Column[]): Column[] {
  const sorted = categories
    .filter(c => c.unique >= 2)
    .sort((a, b) => a.unique - b.unique);
  const chains: Column[][] = [];
  sorted.forEach((col, i) => {
    let best: Column[] = [];
    for (let j = 0; j < i; j++)
      if (chains[j].length > best.length && nestedIn(rows, col, sorted[j]))
        best = chains[j];
    chains.push([...best, col]);
  });
  const longest = chains.reduce<Column[]>(
    (a, b) => (b.length > a.length ? b : a),
    [],
  );
  return longest.length >= 2 ? longest : [];
}

/** Whether either category nests in the other. */
const nests = (rows: Row[], a: Column, b: Column) =>
  nestedIn(rows, a, b) || nestedIn(rows, b, a);

/** Two categories that cross, the pair with the fewest combinations. */
export function crossTabPair(
  rows: Row[],
  categories: Column[],
): [Column, Column] | undefined {
  const usable = categories.filter(c => c.unique >= 2 && c.unique <= 50);
  let best: [Column, Column] | undefined;
  for (let i = 0; i < usable.length; i++)
    for (let j = i + 1; j < usable.length; j++) {
      const [a, b] = [usable[i], usable[j]];
      if (a.unique === rows.length || b.unique === rows.length) continue;
      if (nests(rows, a, b) || !uniqueBy(rows, [a.key, b.key])) continue;
      if (!best || a.unique * b.unique < best[0].unique * best[1].unique)
        best = [a, b];
    }
  return best;
}

const SOURCE = /^(source|from|origin|src|sender|exporter)\b/i;
const TARGET = /^(target|to|destination|dest|dst|recipient|importer)\b/i;

/** The values a category column holds. */
const valuesOf = (rows: Row[], col: Column) =>
  new Set(rows.filter(r => col.key in r).map(r => String(r[col.key])));

/**
 * Two category columns naming the ends of each row's link: columns named
 * like `source` and `target` (or `from`/`to`), else two columns that share
 * at least a third of their values.
 */
export function flowPair(rows: Row[], categories: Column[]): Traits["flows"] {
  const named = (re: RegExp) => categories.find(c => re.test(c.key.trim()));
  const ends = (source: Column, target: Column) => {
    const nodes = new Set([
      ...valuesOf(rows, source),
      ...valuesOf(rows, target),
    ]);
    return {source, target, nodes: nodes.size};
  };
  const [source, target] = [named(SOURCE), named(TARGET)];
  if (source && target && source !== target) return ends(source, target);
  for (let i = 0; i < categories.length; i++)
    for (let j = i + 1; j < categories.length; j++) {
      const a = valuesOf(rows, categories[i]);
      const b = valuesOf(rows, categories[j]);
      const shared = [...a].filter(v => b.has(v)).length;
      if (shared >= 2 && shared >= Math.min(a.size, b.size) / 3)
        return ends(categories[i], categories[j]);
    }
  return undefined;
}

/** The number column with a name matching `re`, if any. */
const named = (cols: Column[], re: RegExp) =>
  cols.find(c => re.test(c.key.trim()));

/** Columns named open, high, low, and close, if all four exist. */
export function ohlcColumns(numbers: Column[]): Traits["ohlc"] {
  const open = named(numbers, /^open$/i);
  const high = named(numbers, /^high$/i);
  const low = named(numbers, /^low$/i);
  const close = named(numbers, /^(close|adj\.? close)$/i);
  return open && high && low && close ? {open, high, low, close} : undefined;
}

/** A date's moment in ms, or its year, for comparing two date columns. */
function moment(value: unknown): number | undefined {
  if (typeof value === "number") return Date.UTC(value, 0, 1);
  return toDate(value)?.time;
}

const START = /start|begin|from|open|birth|born|launch/i;
const END = /end|finish|until|to\b|close|death|died|due|stop/i;

/**
 * Two date columns holding each row's start and end: named so, or the only
 * two date columns, with the first never after the second.
 */
export function rangePair(rows: Row[], dates: Column[]): Traits["range"] {
  const start = named(dates, START);
  const end = dates.find(c => c !== start && END.test(c.key));
  const pair =
    start && end
      ? {start, end}
      : dates.length === 2
        ? {start: dates[0], end: dates[1]}
        : undefined;
  if (!pair) return undefined;
  const ordered = rows.every(r => {
    const [a, b] = [moment(r[pair.start.key]), moment(r[pair.end.key])];
    return a === undefined || b === undefined || a <= b;
  });
  return ordered ? pair : undefined;
}

/** Number columns named as a band's lower and upper bounds. */
export function boundsPair(numbers: Column[]): Traits["bounds"] {
  const pairs: [RegExp, RegExp][] = [
    [/^(lower|lo|min)\b/i, /^(upper|hi|max)\b/i],
    [/\b(lower|lo)$/i, /\b(upper|hi)$/i],
    [/^low$/i, /^high$/i],
  ];
  for (const [lo, hi] of pairs) {
    const lower = named(numbers, lo);
    const upper = named(numbers, hi);
    if (lower && upper) return {lower, upper};
  }
  const percentiles = numbers
    .map(c => ({c, p: /^p(\d{1,2})$/i.exec(c.key.trim())}))
    .filter(d => d.p)
    .sort((a, b) => +a.p![1] - +b.p![1]);
  if (percentiles.length >= 2)
    return {
      lower: percentiles[0].c,
      upper: percentiles[percentiles.length - 1].c,
    };
  return undefined;
}

const TARGET_NAME = /target|goal|budget|plan|quota|benchmark|expected/i;
const VALUE_NAME =
  /value|count|total|amount|sales|revenue|size|population|score|share|users|people|units|exports|spend/i;

/** The measure most charts draw: a value-like name, else the first one. */
export function primaryValue(
  numbers: Column[],
  skip: Column[],
): Column | undefined {
  const usable = numbers.filter(c => !skip.includes(c));
  return named(usable, VALUE_NAME) ?? usable[0];
}

/**
 * A category splitting dated rows into series: 2 to 20 values, each date
 * holding at most one row per value. The one with the fewest values.
 */
export function seriesColumn(
  rows: Row[],
  categories: Column[],
  date: Column | undefined,
): Column | undefined {
  if (!date) return undefined;
  return categories
    .filter(c => c.unique >= 2 && c.unique <= 20)
    .sort((a, b) => a.unique - b.unique)
    .find(c => uniqueBy(rows, [date.key, c.key]));
}

/** A category splitting the rows into 2 to 12 groups of 5 or more rows. */
export function groupColumn(
  rows: Row[],
  categories: Column[],
): Column | undefined {
  return categories.find(c => {
    if (c.unique < 2 || c.unique > 12) return false;
    const sizes = new Map<string, number>();
    for (const r of rows)
      if (c.key in r) {
        const k = String(r[c.key]);
        sizes.set(k, (sizes.get(k) ?? 0) + 1);
      }
    return [...sizes.values()].every(n => n >= 5);
  });
}

/** The years between a date column's first and last values. */
export function spanYears(rows: Row[], date: Column | undefined): number {
  if (!date) return 0;
  const times = rows
    .map(r => moment(r[date.key]))
    .filter((t): t is number => t !== undefined);
  if (!times.length) return 0;
  const lo = times.reduce((a, b) => Math.min(a, b));
  const hi = times.reduce((a, b) => Math.max(a, b));
  return (hi - lo) / (365.25 * 864e5);
}

/** Every trait of a profiled dataset. */
export function analyze({rows, columns}: Profile): Traits {
  const numbers = columns.filter(c => c.type === "number" && !c.coord);
  const categories = columns.filter(c => c.type === "category");
  const dates = columns.filter(c => c.type === "date");
  const ohlc = ohlcColumns(numbers);
  const bounds = ohlc ? undefined : boundsPair(numbers);
  const target = numbers.length > 1 ? named(numbers, TARGET_NAME) : undefined;
  const skip = [target, bounds?.lower, bounds?.upper].filter(
    (c): c is Column => !!c,
  );
  const value = ohlc?.close ?? primaryValue(numbers, skip);
  const range = rangePair(rows, dates);
  const date = range?.start ?? dates[0];
  const keys = [
    ...categories,
    ...dates,
    ...columns.filter(c => c.type === "boolean"),
  ];
  const two = categories.find(c => c.unique === 2);
  const other =
    two &&
    categories.find(c => c !== two && c.unique >= 2 && !nests(rows, c, two));
  const lat = columns.find(c => c.coord === "lat");
  const lon = columns.find(c => c.coord === "lon");
  return {
    rows,
    columns,
    numbers,
    categories,
    dates,
    value,
    keyed:
      rows.length > 0 &&
      uniqueBy(
        rows,
        keys.map(c => c.key),
      ),
    item: categories
      .filter(c => c.count === rows.length && c.unique === rows.length)
      .sort((a, b) => (b.length ?? 0) - (a.length ?? 0))[0],
    hierarchy: hierarchyChain(rows, categories),
    crossTab: crossTabPair(rows, categories),
    twoSided: two && other ? {sides: two, category: other} : undefined,
    flows: flowPair(rows, categories),
    ohlc,
    range,
    bounds,
    target,
    sets: columns.find(c => c.type === "sets"),
    geo: {
      iso3: categories.find(c => c.geo === "iso3"),
      state: categories.find(c => c.geo === "state"),
      ...(lat && lon && {lat, lon}),
    },
    date,
    periods: date?.unique ?? 0,
    years: spanYears(rows, date),
    series: seriesColumn(rows, categories, date),
    groups: groupColumn(rows, categories),
  };
}

/**
 * The finest category with 2 to `max` values: the one most charts label
 * their marks by. Between equals, the one with longer values (names over
 * codes).
 */
export function pickCategory(
  t: Traits,
  max = Infinity,
  skip: Column[] = [],
): Column | undefined {
  return t.categories
    .filter(c => c.unique >= 2 && c.unique <= max && !skip.includes(c))
    .sort(
      (a, b) => b.unique - a.unique || (b.length ?? 0) - (a.length ?? 0),
    )[0];
}
