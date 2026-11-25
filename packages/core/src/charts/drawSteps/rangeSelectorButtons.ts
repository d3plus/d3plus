/**
    The buttons of a Plot's range selector (`rangeSelector`): what each one
    names, the window of dates it shows, and its label.

    @module
*/
import {
  timeDay,
  timeMonth,
  timeWeek,
  timeYear,
  utcDay,
  utcMonth,
  utcWeek,
  utcYear,
} from "d3-time";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

/** The unit a range button steps back by, or `"ytd"`/`"all"`. */
export type RangeStep = "day" | "week" | "month" | "year" | "ytd" | "all";

/** A range button: `count` `step`s back from the data's last date. */
export interface RangeButton {
  /** The button's text. Defaults to a short form of the range (`"6M"`). */
  label?: string;
  /** How many `step`s back the window reaches. Defaults to `1`. */
  count?: number;
  /** The unit: `"day"`, `"week"`, `"month"`, `"year"`, `"ytd"` (from the start of the last date's year), or `"all"`. */
  step: RangeStep;
}

/** A `rangeSelector` entry: a short form (`"1M"`, `"6M"`, `"YTD"`, `"1Y"`, `"All"`) or a button object. */
export type RangeSelectorOption = string | RangeButton;

/** The buttons `rangeSelector: true` shows. */
export const RANGE_SELECTOR_DEFAULT: RangeSelectorOption[] = [
  "1M",
  "6M",
  "YTD",
  "1Y",
  "All",
];

const STEPS: Record<string, RangeStep> = {
  D: "day",
  W: "week",
  M: "month",
  Y: "year",
};

/**
    Reads a `rangeSelector` entry: a count and a unit letter (`"3M"`: D, W, M,
    or Y, either case), `"YTD"`, `"All"`, or a button object. Null for
    anything else.
    @param option The entry.
*/
export function parseRangeButton(option: unknown): RangeButton | null {
  if (option && typeof option === "object") {
    const {step, count, label} = option as RangeButton;
    if (!["day", "week", "month", "year", "ytd", "all"].includes(step))
      return null;
    const n = count === undefined ? 1 : +count;
    if (!(n > 0)) return null;
    return {step, count: n, ...(label === undefined ? {} : {label})};
  }
  if (typeof option !== "string") return null;
  const text = option.trim().toUpperCase();
  if (text === "YTD") return {step: "ytd"};
  if (text === "ALL") return {step: "all"};
  const match = /^(\d+)\s*([DWMY])$/.exec(text);
  if (!match || !(+match[1] > 0)) return null;
  return {step: STEPS[match[2]], count: +match[1]};
}

/**
    The buttons a `rangeSelector` setting asks for: the defaults for `true`,
    each valid entry of a list, none otherwise.
    @param setting The chart's `rangeSelector`.
*/
export function rangeButtons(setting: unknown): RangeButton[] {
  const list =
    setting === true
      ? RANGE_SELECTOR_DEFAULT
      : Array.isArray(setting)
        ? setting
        : [];
  return list.map(parseRangeButton).filter((b): b is RangeButton => b !== null);
}

/**
    The window of dates a button shows, as times: from `count` `step`s
    before the data's last date to that date (`"ytd"` from the start of its
    year), cut to the data's first date. Null for `"all"`.
    @param button The button.
    @param extent The data's first and last times.
    @param utc Whether the axis reads dates in UTC.
*/
export function rangeWindow(
  button: RangeButton,
  extent: [number, number],
  utc = false,
): [number, number] | null {
  if (button.step === "all") return null;
  const end = new Date(extent[1]);
  const count = button.count ?? 1;
  const interval = {
    day: utc ? utcDay : timeDay,
    week: utc ? utcWeek : timeWeek,
    month: utc ? utcMonth : timeMonth,
    year: utc ? utcYear : timeYear,
  };
  const start =
    button.step === "ytd"
      ? (utc ? utcYear : timeYear).floor(end)
      : interval[button.step].offset(end, -count);
  // A month back from March 31 is the last day of February, not March 2.
  const day = (d: Date): number => (utc ? d.getUTCDate() : d.getDate());
  if (
    (button.step === "month" || button.step === "year") &&
    day(start) !== day(end)
  ) {
    if (utc) start.setUTCDate(0);
    else start.setDate(0);
  }
  return [Math.max(extent[0], +start), extent[1]];
}

/**
    Whether a button's window takes in the data's whole span, so it shows
    the same as "All".
    @param button The button.
    @param extent The data's first and last times.
    @param utc Whether the axis reads dates in UTC.
*/
export function coversAll(
  button: RangeButton,
  extent: [number, number],
  utc = false,
): boolean {
  const window = rangeWindow(button, extent, utc);
  return !window || window[0] <= extent[0];
}

/** Translates a UI string, filling its `{0}` placeholder. */
export type Translate = (
  text: string,
  locale?: string,
  ...args: unknown[]
) => string;

const SHORT: Record<string, string> = {
  day: "{0}D",
  week: "{0}W",
  month: "{0}M",
  year: "{0}Y",
};
const LONG: Record<string, [string, string]> = {
  day: ["Last day", "Last {0} days"],
  week: ["Last week", "Last {0} weeks"],
  month: ["Last month", "Last {0} months"],
  year: ["Last year", "Last {0} years"],
};

/**
    A button's text: its own `label`, else the short form of its range
    (`"6M"`, `"YTD"`, `"All"`) in the chart's language.
    @param button The button.
    @param translate The chart's `translate`.
*/
export function rangeLabel(button: RangeButton, translate: Translate): string {
  if (button.label !== undefined) return button.label;
  if (button.step === "ytd") return translate("YTD");
  if (button.step === "all") return translate("All");
  return translate(SHORT[button.step], undefined, button.count ?? 1);
}

/**
    What a button does, spelled out for screen readers ("Last 6 months").
    @param button The button.
    @param translate The chart's `translate`.
*/
export function rangeAriaLabel(
  button: RangeButton,
  translate: Translate,
): string {
  if (button.step === "ytd") return translate("Year to date");
  if (button.step === "all") return translate("Full range");
  const count = button.count ?? 1;
  const [one, many] = LONG[button.step];
  return count === 1 ? translate(one) : translate(many, undefined, count);
}

/** The default style of each range button: structural only, like the zoom buttons'. */
export const rangeSelectorStyleDefault = {
  "align-items": "center",
  "box-sizing": "border-box",
  display: "inline-flex",
  font: `600 11px/1 ${fontFamilyStringify(fontFamily)}`,
  height: "20px",
  "justify-content": "center",
  margin: 0,
  "min-width": "20px",
  padding: "0 5px",
};
/** The default style of the range button showing the chart's current window. */
export const rangeSelectorStyleActiveDefault = {
  "background-color": "AccentColor",
  "border-color": "AccentColor",
  color: "AccentColorText",
};
/** The default hover style of a range button: none. */
export const rangeSelectorStyleHoverDefault = false as const;
