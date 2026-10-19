/**
    Waterfall's running-total math: each row becomes a step that floats from
    the running total before it, and subtotal rows draw from zero.
*/
import type {DataPoint} from "@d3plus/data";

/** What a step does to the running total. */
export type WaterfallKind = "increase" | "decrease" | "total";

/** Every step kind, in legend order. */
export const WATERFALL_KINDS: WaterfallKind[] = ["increase", "decrease", "total"];

/** A row accessor, as d3plus passes them. */
export type RowAccessor = (d: DataPoint, i: number) => unknown;

/** One bar of a waterfall. */
export interface WaterfallStep {
  /** The series the step belongs to; each series keeps its own running total. */
  series: string;
  /** The step's position within its series. */
  index: number;
  /** The step's category (its discrete-axis value). */
  category: unknown;
  kind: WaterfallKind;
  /** Where the bar starts: the previous running total, or 0 for a subtotal. */
  start: number;
  /** Where the bar ends: the running total after this step. */
  end: number;
  /** The change in the running total this step makes. */
  change: number;
  /** Whether the bar continues from the previous step's end (and so takes a connector). */
  joins: boolean;
}

/** The accessors `waterfallSteps` reads. */
export interface StepAccessors {
  /** The discrete-axis value of each row. */
  category: RowAccessor;
  /** The series of each row. */
  series: RowAccessor;
  /** The numeric change of each row (a subtotal's value, when given). */
  value: RowAccessor;
  /** Marks subtotal rows. */
  subtotal?: RowAccessor;
  /** Orders a series' categories, compared by each category's first row. */
  sort?: (a: DataPoint, b: DataPoint) => number;
}

/** `v` when it is a finite number, else undefined. */
export const finite = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** A category's rows within one series. */
interface CategoryRows {
  category: unknown;
  rows: [DataPoint, number][];
}

/**
    Compares two categories the way Plot orders its discrete axis: numerically
    where both read as numbers (dates by time), otherwise left in data order.
*/
export function compareCategories(a: unknown, b: unknown): number {
  const diff = Number(a instanceof Date ? +a : a) - Number(b instanceof Date ? +b : b);
  return Number.isNaN(diff) ? 0 : diff;
}

/** Orders a series' categories in place: by `sort` when given, else as Plot's axis does. */
function orderCategories(entries: CategoryRows[], sort?: StepAccessors["sort"]): void {
  if (sort) entries.sort((a, b) => sort(a.rows[0][0], b.rows[0][0]));
  else entries.sort((a, b) => compareCategories(a.category, b.category));
}

/** Whether two running totals are equal up to floating-point noise. */
const sameLevel = (a: number, b: number): boolean =>
  Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/**
    The step for one category of a series, given the running total before it.
    Returns undefined for a non-subtotal category with no numeric value.
*/
export function waterfallStep(
  entry: {category: unknown; values: (number | undefined)[]; subtotal: boolean},
  running: number,
  position: {series: string; index: number},
): WaterfallStep | undefined {
  const defined = entry.values.filter((v): v is number => v !== undefined);
  const sum = defined.reduce((a, b) => a + b, 0);
  const {series, index} = position;
  if (entry.subtotal) {
    // A subtotal with its own value resets the running total to that value.
    const end = defined.length ? sum : running;
    return {
      series, index, category: entry.category, kind: "total",
      start: 0, end, change: end - running,
      joins: index > 0 && sameLevel(end, running),
    };
  }
  if (!defined.length) return undefined;
  return {
    series, index, category: entry.category, kind: sum < 0 ? "decrease" : "increase",
    start: running, end: running + sum, change: sum,
    joins: index > 0,
  };
}

/**
    Lays out every row as a waterfall step. Rows are split into series, each
    series' categories are ordered (see `compareCategories`), and each
    category's rows share one step whose change is the sum of their values.
    Returns each row's step; rows without one (no value, not a subtotal) are
    absent.
*/
export function waterfallSteps(rows: DataPoint[], accessors: StepAccessors): Map<DataPoint, WaterfallStep> {
  const {category, series, value, subtotal, sort} = accessors;
  const grouped = new Map<string, Map<string, CategoryRows>>();
  rows.forEach((d, i) => {
    const s = `${series(d, i)}`;
    const c = category(d, i);
    const key = c instanceof Date ? `${+c}` : `${c}`;
    let categories = grouped.get(s);
    if (!categories) grouped.set(s, (categories = new Map()));
    const entry = categories.get(key);
    if (entry) entry.rows.push([d, i]);
    else categories.set(key, {category: c, rows: [[d, i]]});
  });

  const out = new Map<DataPoint, WaterfallStep>();
  grouped.forEach((categories, s) => {
    const entries = Array.from(categories.values());
    orderCategories(entries, sort);
    let running = 0;
    let index = 0;
    for (const entry of entries) {
      const step = waterfallStep(
        {
          category: entry.category,
          values: entry.rows.map(([d, i]) => finite(value(d, i))),
          subtotal: subtotal ? entry.rows.some(([d, i]) => !!subtotal(d, i)) : false,
        },
        running,
        {series: s, index},
      );
      if (!step) continue;
      running = step.end;
      index++;
      entry.rows.forEach(([d]) => out.set(d, step));
    }
  });
  return out;
}

/** The kinds present among `steps`, in legend order. */
export function waterfallKinds(steps: Iterable<WaterfallStep | undefined>): WaterfallKind[] {
  const seen = new Set<WaterfallKind>();
  for (const step of steps) if (step) seen.add(step.kind);
  return WATERFALL_KINDS.filter(k => seen.has(k));
}

/**
    The value a row reports on the value axis: its own value, or for a
    subtotal without one, the running total it shows.
*/
export function stepValue(raw: unknown, step: WaterfallStep | undefined): unknown {
  if (finite(raw) !== undefined || !step || step.kind !== "total") return raw;
  return step.end;
}

/** A formatted Plot row, as d3-stack carries them on each stacked point. */
interface StackRow {
  id?: unknown;
  data?: DataPoint;
}

/** A d3-stack offset, as Plot applies it. */
export type StackOffset = (series: number[][][], order: number[]) => void;

/**
    A d3-stack offset that floats every bar between its step's start and end
    (low value first, as Plot's stacks expect). Points without a step keep
    d3-stack's own values.
*/
export function waterfallStackOffset(stepOf: (row: DataPoint) => WaterfallStep | undefined): StackOffset {
  return series => {
    for (const s of series) {
      const key = (s as unknown as {key: unknown}).key;
      for (const point of s) {
        const group = (point as unknown as {data?: StackRow[]}).data ?? [];
        const row = group.find(r => r.id === key);
        const step = row && row.data ? stepOf(row.data) : undefined;
        if (!step) continue;
        point[0] = Math.min(step.start, step.end);
        point[1] = Math.max(step.start, step.end);
      }
    }
  };
}
