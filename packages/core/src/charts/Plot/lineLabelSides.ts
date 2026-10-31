/**
    Pure helpers behind a Plot's `lineLabels` and `lineLabelConfig`: which
    ends of a line take a label, and the value text a label can carry.

    @module
*/

import type {DataPoint} from "@d3plus/data";

/** An end of a line that can carry a label. */
export type LineLabelSide = "start" | "end";

/** What `lineLabels` takes for one series. */
export type LineLabelsValue = boolean | "start" | "end" | "both";

/** The `lineLabels` setting: one value for every series, or a function of each row. */
export type LineLabelsSetting =
  | LineLabelsValue
  | ((d: DataPoint, i: number) => LineLabelsValue | null | undefined);

/** Formats a line label's value: the value, the row it belongs to, and the row's index. */
export type LineLabelValueFormat = (
  value: unknown,
  d: DataPoint,
  i: number,
) => string;

/** The `lineLabelConfig` setting. */
export interface LineLabelConfig {
  /** Adds each end's value after the series name. */
  value?: boolean;
  /** Formats the value (defaults to the y axis's tick format). */
  valueFormat?: LineLabelValueFormat;
}

/**
    The ends a `lineLabels` value labels, left end first: `true` and `"end"`
    label the right end, `"start"` the left end, `"both"` both, and anything
    falsy neither.
*/
export function lineLabelSides(
  value: LineLabelsValue | null | undefined,
): LineLabelSide[] {
  if (value === "both") return ["start", "end"];
  if (value === "start") return ["start"];
  return value ? ["end"] : [];
}

/**
    The ends `setting` labels for row `d` (index `i`): a function setting is
    called with the row, any other setting applies to every row.
*/
export function rowLineLabelSides(
  setting: LineLabelsSetting | null | undefined,
  d: DataPoint,
  i: number,
): LineLabelSide[] {
  return lineLabelSides(
    typeof setting === "function" ? setting(d, i) : setting,
  );
}

/**
    A line label's value text, or `undefined` when `config` leaves values
    off: `valueFormat` when set, else `format` (the y axis's own).
*/
export function lineLabelValue(
  config: LineLabelConfig | undefined,
  value: unknown,
  d: DataPoint,
  i: number,
  format: (value: unknown) => string,
): string | undefined {
  if (!config?.value || value === undefined || value === null) return undefined;
  const text = config.valueFormat
    ? config.valueFormat(value, d, i)
    : format(value);
  return text === undefined || text === null || text === ""
    ? undefined
    : `${text}`;
}

/** A line label's text: the series name, followed by its value when there is one. */
export function lineLabelText(name: unknown, value?: string): string {
  return value === undefined ? `${name}` : `${name} ${value}`;
}

/**
    The key a label's bumped position is stored under: the series id for the
    right end, prefixed for the left end so the two ends never share one.
*/
export function lineLabelKey(
  side: LineLabelSide | undefined,
  id: unknown,
): string {
  return side === "start" ? `start:${id}` : `${id}`;
}
