/**
    Waterfall's value labels and tooltip rows.
*/
import {colorDefaults as defaultColors, type ColorDefaults} from "@d3plus/color";

import type {WaterfallKind, WaterfallStep} from "./steps.js";

/** The English name of each step kind, as passed to `translate`. */
export const KIND_LABELS: Record<WaterfallKind, string> = {
  increase: "Increase",
  decrease: "Decrease",
  total: "Total",
};

/** The colors a waterfall's chart config sets per kind. */
export interface KindColors {
  increaseColor?: unknown;
  decreaseColor?: unknown;
  totalColor?: unknown;
}

/**
    The fill for a step kind: the chart's own color for it, else from the
    color defaults (`on` for increases, `off` for decreases, `sequential` for
    totals).
*/
export function kindColor(kind: WaterfallKind, colors: KindColors, defaults?: Partial<ColorDefaults>): string {
  const own = colors[`${kind}Color`];
  if (typeof own === "string" && own) return own;
  const fallback = {...defaultColors, ...defaults};
  return kind === "increase" ? fallback.on : kind === "decrease" ? fallback.off : fallback.sequential;
}

/**
    A step's label: a subtotal's running total, or a change with its sign
    ("+120", "-40").
*/
export function stepLabel(step: WaterfallStep, format: (n: number) => string): string {
  if (step.kind === "total") return format(step.end);
  return step.change > 0 ? `+${format(step.change)}` : format(step.change);
}

/** Whether a step's bar ends above (or right of) where it starts. */
export const endsForward = (step: WaterfallStep): boolean =>
  step.kind === "total" ? step.end >= step.start : step.change >= 0;

/** A label box, relative to its bar's origin. */
export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How much room a label takes beyond its bar's end. */
export const LABEL_SPAN = {height: 20, width: 56, minWidth: 64, gap: 2};

/**
    The box for a step's label, just past the end of its bar. A Bar draws from
    its origin at the step's start: vertical bars grow up when they end
    forward and down otherwise; horizontal bars grow right or left.
*/
export function labelBox(step: WaterfallStep, size: {width: number; height: number}, vertical: boolean): LabelBox {
  const forward = endsForward(step);
  const {gap} = LABEL_SPAN;
  if (vertical) {
    const width = Math.max(size.width, LABEL_SPAN.minWidth);
    const height = LABEL_SPAN.height;
    return {x: -width / 2, y: forward ? -size.height - height - gap : size.height + gap, width, height};
  }
  const width = LABEL_SPAN.width;
  return {x: forward ? size.width + gap : -size.width - width - gap, y: -size.height / 2, width, height: size.height};
}

/** Text alignment for a step's label, keeping it against its bar's end. */
export function labelAlign(step: WaterfallStep, vertical: boolean): {textAnchor: string; verticalAlign: string} {
  const forward = endsForward(step);
  return vertical
    ? {textAnchor: "middle", verticalAlign: forward ? "bottom" : "top"}
    : {textAnchor: forward ? "start" : "end", verticalAlign: "middle"};
}

/**
    Tooltip rows beyond the bar's own category and value: a change's running
    total afterward. A subtotal's value already is its running total.
*/
export function tooltipRows(
  step: WaterfallStep | undefined,
  format: (n: number) => string,
  translate: (s: string) => string,
): [string, string][] {
  if (!step || step.kind === "total") return [];
  return [[translate("Running Total"), format(step.end)]];
}
