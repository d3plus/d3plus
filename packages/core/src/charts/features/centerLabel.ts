/**
    The text a ring chart (Pie with a hole, Donut, Sunburst, RadialBar) draws
    in its empty middle when `centerLabel` is set: the chart's total, a
    string, or what a function returns, wrapped and shrunk to fit the largest
    box in the hole (see `centerLabelBoxes`). It is chrome: it carries no
    datum, takes no pointer events, and draws nothing when it can't fit whole.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode, TextNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {isFullTurn} from "../Pie/arcFit.js";
import {largestSectorBox, sectorEdges} from "../Pie/sectorBox.js";
import {centerLabelLines} from "../Pie/straightLayout.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The `centerLabel` setting: the total (`true`), a string, or a function of the drawn data and their total. */
export type CenterLabelSetting =
  | boolean
  | string
  | ((data: DataPoint[], total: number) => unknown)
  | null
  | undefined;

/** A chart's empty middle: a circle of `radius` around the origin, or the slice of it a partial sweep spans (radians, 0 at 12 o'clock, clockwise). */
export interface CenterHole {
  radius: number;
  startAngle?: number;
  endAngle?: number;
}

/** A box the text may fill, around the origin. */
export interface CenterLabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The outline the text wraps within. */
  shape: "circle" | "square";
}

/** The scene key of the center label's group. */
export const CENTER_LABEL_KEY = "center-label";

/** The width/height ratios tried for a partial sweep's hole. */
const SECTOR_ASPECTS = [1, 2, 3];

/**
    The `centerLabelConfig` defaults: the chart's text color, sized between
    10 and 40 pixels, 5 pixels clear of the ring.
    @param viz The chart.
*/
export function centerLabelDefaults(viz: VizInstance): Record<string, unknown> {
  return {
    fontColor: () => backgroundInk(viz),
    fontMax: 40,
    fontMin: 10,
    padding: 5,
  };
}

/**
    The sum of `value` over `data`, leaving out values that aren't numbers.
    @param data The drawn rows.
    @param value The chart's value accessor.
*/
export function centerLabelTotal(
  data: DataPoint[],
  value: (d: DataPoint, i: number) => unknown,
): number {
  return data.reduce((sum, d, i) => {
    const v = Number(value(d, i));
    return Number.isFinite(v) ? sum + v : sum;
  }, 0);
}

/**
    The text a `centerLabel` setting draws: the total, formatted the way the
    chart's tooltips format values, for `true`; the string itself; or a
    function's return value. Empty for a falsy setting or return value.
    @param setting The `centerLabel` setting.
    @param data The drawn rows.
    @param total Their total.
    @param locale The chart's locale.
*/
export function centerLabelText(
  setting: CenterLabelSetting,
  data: DataPoint[],
  total: number,
  locale?: string,
): string {
  if (!setting) return "";
  if (typeof setting === "function") {
    const out = setting(data, total);
    return out || out === 0 ? String(out) : "";
  }
  if (typeof setting === "string") return setting;
  return formatAbbreviate(total, locale);
}

/**
    The boxes the text may fill in a hole: the whole circle (its text wrapped
    to the circle) for a full turn, or, for a partial sweep, the largest box
    of each of a few shapes that fits in the slice of the circle it spans.
    Empty when the hole has no room.
    @param hole The hole.
*/
export function centerLabelBoxes(hole: CenterHole): CenterLabelBox[] {
  const r = hole.radius;
  if (!(r > 0)) return [];
  const {startAngle, endAngle} = hole;
  if (
    startAngle === undefined ||
    endAngle === undefined ||
    isFullTurn(startAngle, endAngle)
  )
    return [{x: -r, y: -r, width: r * 2, height: r * 2, shape: "circle"}];
  const edges = sectorEdges({
    innerRadius: 0,
    outerRadius: r,
    startAngle,
    endAngle,
  });
  if (!edges) return [];
  return SECTOR_ASPECTS.flatMap(aspect => {
    const box = largestSectorBox(edges, s => [s * aspect, s]);
    return box ? [{...box, shape: "square" as const}] : [];
  });
}

/**
    The TextBox config the label is drawn with: the user's `centerLabelConfig`
    over the centered defaults. A `fontSize` without `fontResize` fixes the
    size; otherwise the text shrinks from `fontMax` to fit.
    @param config The `centerLabelConfig`.
*/
export function centerLabelStyle(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const fontResize = config.fontResize ?? config.fontSize === undefined;
  return {
    textAnchor: "middle",
    verticalAlign: "middle",
    ...config,
    fontResize,
    pointerEvents: "none",
  };
}

/** The label's text nodes in one box, or null when the text doesn't fit whole. */
function fitIn(
  text: string,
  box: CenterLabelBox,
  style: Record<string, unknown>,
): TextNode[] | null {
  const nodes = emitLabels({
    data: [{text}],
    label: () => text,
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: () => CENTER_LABEL_KEY,
    labelBounds: () => ({...box}),
    labelConfig: style,
  }).filter((n): n is TextNode => n.type === "text");
  if (!nodes.length || nodes.some(n => n.truncated)) return null;
  return nodes;
}

/** The largest font size among text nodes. */
const fontSizeOf = (nodes: TextNode[]) =>
  Math.max(...nodes.map(n => n.font?.size ?? 0));

/**
    The center label's layout: one inert group holding the text, at the
    largest size that fits the hole whole, centered in the box it fits, and
    that box. With `reserve`, each box gives up that many pixels at its
    bottom (for a second line of chrome beneath, such as Parliament's
    majority). Null when `centerLabel` is unset or the text fits nowhere.
    @param viz The chart.
    @param hole The chart's empty middle, around its origin.
    @param value The chart's value accessor, summed for the total.
    @param reserve The height each box keeps free at its bottom.
*/
export function centerLabelLayout(
  viz: VizInstance,
  hole: CenterHole,
  value: (d: DataPoint, i: number) => unknown,
  reserve = 0,
): {nodes: SceneNode[]; box: CenterLabelBox} | null {
  const setting = viz.schema.centerLabel as CenterLabelSetting;
  if (!setting) return null;
  const boxes = centerLabelBoxes(hole)
    .map(b =>
      reserve > 0
        ? {...b, height: b.height - reserve, shape: "square" as const}
        : b,
    )
    .filter(b => b.height > 0);
  if (!boxes.length) return null;
  const data = (viz._filteredData ?? []) as DataPoint[];
  const text = centerLabelText(
    setting,
    data,
    centerLabelTotal(data, value),
    viz.schema.locale,
  );
  if (!text) return null;
  const config = (viz.schema.centerLabelConfig ?? {}) as Record<
    string,
    unknown
  >;
  const style = centerLabelStyle(config);
  let best: {nodes: TextNode[]; box: CenterLabelBox} | null = null;
  for (const box of boxes) {
    const nodes = fitIn(text, box, style);
    if (nodes && (!best || fontSizeOf(nodes) > fontSizeOf(best.nodes)))
      best = {nodes, box};
  }
  if (!best) return null;
  // The text is chrome: no datum for hover to match or a tooltip to show.
  const children: SceneNode[] = best.nodes.map(n => ({
    ...n,
    datum: undefined,
    index: undefined,
    interactive: false,
  }));
  if (style.verticalAlign === "middle")
    centerLabelLines(children, best.box.y + best.box.height / 2);
  return {
    nodes: [
      {type: "group", key: CENTER_LABEL_KEY, interactive: false, children},
    ],
    box: best.box,
  };
}

/**
    The center label's scene nodes (see `centerLabelLayout`). Empty when
    `centerLabel` is unset or the text fits nowhere.
    @param viz The chart.
    @param hole The chart's empty middle, around its origin.
    @param value The chart's value accessor, summed for the total.
*/
export function centerLabelNodes(
  viz: VizInstance,
  hole: CenterHole,
  value: (d: DataPoint, i: number) => unknown,
): SceneNode[] {
  return centerLabelLayout(viz, hole, value)?.nodes ?? [];
}
