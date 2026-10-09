/**
    Pyramid's center gutter: the category labels drawn down the middle of the
    chart, between the two halves. The value axis gets an interior break
    (`[-inset, inset]`) as wide as the widest label, so zero sits at both
    inner edges, and the stack offset starts each side at its own edge.
*/
import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as d3plusFontFamily, fontFamilyStringify} from "@d3plus/text";

import type TextBox from "../../components/TextBox.js";
import {stackOffsetDiverging} from "../Plot/stackHelpers.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {bandStep} from "./scene.js";

/** Where Pyramid draws its category labels. */
export type CategoryPosition = "center" | "left";

/** The value-axis half-width of the break, relative to the axis extent. */
const INSET_RATIO = 1e-9;

/**
    The value each side starts from in the center layout: small enough to be
    invisible in the bars, but nonzero, so the left side's zero and the right
    side's zero sit on opposite edges of the gutter.
*/
export function gutterInset(extent: number): number {
  return (extent > 0 ? extent : 1) * INSET_RATIO;
}

/**
    A diverging stack offset that starts negative segments at `-inset()` and
    positive ones at `inset()`, leaving the gutter between the two halves.
*/
export function gutterStackOffset(inset: () => number) {
  return (series: number[][][], order: number[]): void => {
    stackOffsetDiverging(series as never, order);
    const e = inset();
    if (!e) return;
    for (const s of series)
      for (const d of s) {
        const shift = d[0] < 0 ? -e : e;
        d[0] += shift;
        d[1] += shift;
      }
  };
}

/** A label's font, resolved from an axis `labelConfig`. */
export interface LabelFont {
  family: string;
  size: number;
  weight: number | string;
  padding: number;
}

/** Resolves a (possibly accessor-valued) axis `labelConfig` for one label. */
export function labelFont(config: Record<string, unknown>, d: unknown, i: number): LabelFont {
  const read = (key: string) => {
    const v = config[key];
    return typeof v === "function" ? v(d, i) : v;
  };
  const family = read("fontFamily") ?? d3plusFontFamily;
  return {
    family: fontFamilyStringify(family as string | string[]),
    size: Number(read("fontSize")) || 12,
    weight: (read("fontWeight") as number | string) ?? 400,
    padding: Number(read("padding")) || 0,
  };
}

/** The gutter's width: the widest label plus its padding on both sides. */
export function gutterWidth(texts: string[], fonts: LabelFont[], measure = textWidth): number {
  let widest = 0;
  let padding = 0;
  texts.forEach((text, i) => {
    const f = fonts[i];
    const w = measure(text, {"font-family": f.family, "font-size": f.size, "font-weight": f.weight}) as number;
    widest = Math.max(widest, w);
    padding = Math.max(padding, f.padding);
  });
  return Math.ceil(widest + padding * 2);
}

/**
    Which band labels fit: keeps the first label, each next one that clears
    the last kept one, and always the last label (dropping kept neighbors it
    would overlap), like the axis's own thinning. `positions` are band
    centers in drawing order; `height` is a label's height.
*/
export function thinBands(positions: number[], height: number): boolean[] {
  const keep = positions.map(() => false);
  let last: number | undefined;
  positions.forEach((p, i) => {
    if (last === undefined || Math.abs(p - last) >= height) {
      keep[i] = true;
      last = p;
    }
  });
  const end = positions.length - 1;
  if (end > 0 && !keep[end]) {
    keep[end] = true;
    for (let i = end - 1; i >= 0 && Math.abs(positions[end] - positions[i]) < height; i--) keep[i] = false;
  }
  return keep;
}

/** One gutter label and the box it is centered in. */
export interface GutterLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: LabelFont;
}

/** Lays out the gutter labels as scene text nodes. */
export function gutterLabelNodes(box: TextBox, labels: GutterLabel[], color: string): SceneNode[] {
  box
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .data(labels)
    .config({
      fontColor: color,
      fontFamily: (d: GutterLabel) => d.font.family,
      fontSize: (d: GutterLabel) => d.font.size,
      fontWeight: (d: GutterLabel) => d.font.weight,
      textAnchor: "middle",
      verticalAlign: "middle",
    })
    .render();
  const group = box.toScene();
  return [{type: "group", key: "pyramid-categories", interactionGroup: "axis", children: group.children ?? []} as SceneNode];
}

/** The category axis's label config: its own defaults under the user's `yConfig` labels. */
export function categoryLabelConfig(viz: VizInstance): Record<string, unknown> {
  const own = (viz._yAxis?.shapeConfig() as {labelConfig?: Record<string, unknown>})?.labelConfig ?? {};
  const user = ((viz._yConfig?.shapeConfig as Record<string, unknown>)?.labelConfig ?? {}) as Record<string, unknown>;
  return {...own, ...user};
}

/** How the category axis formats a category. */
export function categoryText(viz: VizInstance, category: unknown): string {
  const format = viz._yConfig?.tickFormat;
  return typeof format === "function" ? `${format(category)}` : `${category}`;
}

/** Every category in the data, for a gutter that keeps its width across frames. */
export function allCategories(viz: VizInstance): unknown[] {
  const y = viz._y as (d: DataPoint, i: number) => unknown;
  return Array.from(new Set(viz._data.map((d: DataPoint, i: number) => y(d, i))));
}

/** A label's height for thinning: one line plus its padding above and below. */
export const labelHeight = (font: LabelFont): number => font.size * 1.2 + font.padding * 2;

/**
    The category labels centered in the gutter between `edges` (pixels), one
    per band that has room, as scene nodes.
*/
export function gutterLabels(viz: VizInstance, box: TextBox, edges: [number, number]): SceneNode[] {
  const y = viz._yFunc as ((v: unknown) => number) | undefined;
  const [left, right] = edges;
  if (!y || !viz._yAxis || !(right > left)) return [];
  const categories = (viz._yAxis.domain() as unknown[]) ?? [];
  const config = categoryLabelConfig(viz);
  const positions = categories.map(c => y(c));
  const fonts = categories.map((c, i) => labelFont(config, c, i));
  const keep = thinBands(positions, Math.max(0, ...fonts.map(labelHeight)));
  const step = bandStep(positions, viz._plotArea?.height ?? 0);
  const labels: GutterLabel[] = categories.flatMap((c, i) => {
    if (!keep[i]) return [];
    // The box must be taller than one line for TextBox to fill it.
    const height = Math.max(step, fonts[i].size * 1.5);
    return [{id: `pyramid-category-${i}`, text: categoryText(viz, c), x: left, y: positions[i] - height / 2, width: right - left, height, font: fonts[i]}];
  });
  const color = typeof config.fontColor === "string" ? config.fontColor : backgroundInk(viz);
  return gutterLabelNodes(box, labels, color);
}

/** Saved category- and value-axis styles the center layout overrides, restored for the left layout. */
export interface AxisRestore {
  y: Record<string, unknown>;
  x: Record<string, unknown>;
}

/** Captures the axes' own styles before the center layout changes them. */
export function captureAxisStyles(viz: VizInstance): AxisRestore {
  return {
    y: {barConfig: {...viz._yAxis!.barConfig()}, tickSize: viz._yAxis!.tickSize()},
    x: {breakConfig: {...viz._xAxis!.breakConfig()}},
  };
}

/**
    The chart's own axis config for a layout: in the center layout, the value
    axis breaks around zero to make the gutter (`width` pixels, the axis line
    gapped, no break marks or lines) and the category axis draws nothing.
*/
export function gutterAxisDefaults(
  position: CategoryPosition,
  inset: number,
  width: number,
  userBreak: unknown,
  restore: AxisRestore,
): {x: Record<string, unknown>; y: Record<string, unknown>} {
  if (position !== "center") return {x: {...restore.x}, y: {...restore.y}};
  const user = Array.isArray(userBreak) ? (Array.isArray(userBreak[0]) ? userBreak : [userBreak]) : [];
  return {
    x: {
      break: [[-inset, inset], ...user],
      breakConfig: {gap: width, lines: false, mask: false, size: 0, space: width, stroke: "transparent"},
    },
    y: {barConfig: {stroke: "transparent"}, tickSize: 0, ticks: []},
  };
}
