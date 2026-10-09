/**
    Pyramid's own scene chrome, layered onto the Plot scene: a title above
    each half, and the comparison outline traced around each side's bars.
*/
import type {DataPoint} from "@d3plus/data";
import type {LineNode, Paint, Scene, SceneNode} from "@d3plus/render";

import TextBox from "../../components/TextBox.js";
import {PLOT_ZOOM_CONTENT_KEY} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {finite, sideSign, type RowAccessor} from "./pyramidData.js";

/** A category's center on the discrete axis and its outline's offset from the center line. */
export interface OutlineRow {
  y: number;
  x: number;
}

/**
    The stepped outline around one side: from the center line out to each
    row's value across that row's band (`step` tall), then back to the
    center line, top to bottom.
*/
export function comparisonOutline(rows: OutlineRow[], center: number, step: number): [number, number][] {
  const sorted = rows.slice().sort((a, b) => a.y - b.y);
  if (!sorted.length) return [];
  const half = step / 2;
  const points: [number, number][] = [[center, sorted[0].y - half]];
  for (const row of sorted) points.push([row.x, row.y - half], [row.x, row.y + half]);
  points.push([center, sorted[sorted.length - 1].y + half]);
  return points;
}

/** The smallest gap between neighboring positions, or `fallback` for fewer than two. */
export function bandStep(positions: number[], fallback: number): number {
  const sorted = Array.from(new Set(positions)).sort((a, b) => a - b);
  let step = Infinity;
  for (let i = 1; i < sorted.length; i++) step = Math.min(step, sorted[i] - sorted[i - 1]);
  return Number.isFinite(step) ? step : fallback;
}

/** Normalizes a `strokeDasharray` given as a string ("4 2") or number array. */
export function dashArray(v: unknown): number[] | undefined {
  if (Array.isArray(v)) return v.map(Number);
  if (typeof v === "string" && v.trim()) return v.trim().split(/[\s,]+/).map(Number);
  if (typeof v === "number") return [v];
  return undefined;
}

/** A config value that may be a function of the side value and its index. */
function resolve<T>(v: unknown, side: string, index: number): T {
  return (typeof v === "function" ? v(side, index) : v) as T;
}

/** Inputs for the comparison outline. */
interface OutlineInput {
  sides: string[];
  categories: unknown[];
  data: DataPoint[];
  category: RowAccessor;
  side: RowAccessor;
  comparison: RowAccessor;
  divisor: number;
  x: (v: number) => number;
  y: (v: unknown) => number;
  fallbackStep: number;
  config: Record<string, unknown>;
  /** Where each side starts: its distance from zero (the center gutter's half-width, in values). */
  inset?: number;
}

/** The comparison outline for each side with any comparison value. */
export function comparisonNodes(input: OutlineInput): LineNode[] {
  const {sides, categories, data, category, side, comparison, divisor, x, y, fallbackStep, config} = input;
  const inset = input.inset ?? 0;
  const step = bandStep(categories.map(c => y(c)), fallbackStep);
  return sides.flatMap((s, index) => {
    const sums = new Map<string, number>();
    data.forEach((d, i) => {
      if (`${side(d, i)}` !== s) return;
      const v = finite(comparison(d, i));
      if (v === undefined) return;
      const key = `${category(d, i)}`;
      sums.set(key, (sums.get(key) ?? 0) + Math.abs(v) / (divisor || 1));
    });
    if (!sums.size) return [];
    const sign = sideSign(sides, s);
    const center = x(sign * inset);
    const rows = categories.map(c => ({y: y(c), x: x(sign * ((sums.get(`${c}`) ?? 0) + inset))}));
    const paint: Paint = {
      fill: "none",
      stroke: resolve<string>(config.stroke, s, index),
      strokeWidth: resolve<number>(config.strokeWidth, s, index),
      strokeOpacity: resolve<number>(config.strokeOpacity, s, index),
    };
    const dash = dashArray(resolve(config.strokeDasharray, s, index));
    if (dash) paint.strokeDasharray = dash;
    return [{
      type: "line",
      key: `pyramid-comparison-${index}`,
      points: comparisonOutline(rows, center, step),
      curve: "linear",
      paint,
      interactive: false,
      interactionGroup: "axis",
    } as LineNode];
  });
}

/** One side title's text and the box it is centered in. */
export interface SideTitle {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    A title box centered over each half of the value axis, in side order.
    `inner` is where each half meets the center: the same pixel without a
    gutter, or the gutter's two edges.
*/
export function sideTitleBoxes(
  labels: string[],
  bounds: {left: number; right: number; inner: [number, number]; top: number; height: number},
): SideTitle[] {
  const {left, right, top, height} = bounds;
  const clamp = (v: number) => Math.max(left, Math.min(right, v));
  const halves = [[left, clamp(bounds.inner[0])], [clamp(bounds.inner[1]), right]];
  return labels.slice(0, 2).map((text, i) => ({
    text,
    x: halves[i][0],
    y: top,
    width: Math.max(0, halves[i][1] - halves[i][0]),
    height,
  }));
}

/** Lays out the side titles as scene text nodes. */
export function sideTitleNodes(box: TextBox, titles: SideTitle[], config: Record<string, unknown>): SceneNode[] {
  box
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .data(titles.map((t, i) => ({...t, id: `pyramid-side-${i}`})))
    .config(config)
    .render();
  const group = box.toScene();
  return [{type: "group", key: "pyramid-side-titles", interactionGroup: "axis", children: group.children ?? []} as SceneNode];
}

/** Returns a copy of `scene` with `outlines` added above the bars and `titles` on top. */
export function withPyramidNodes(scene: Scene, outlines: SceneNode[], titles: SceneNode[]): Scene {
  if (!outlines.length && !titles.length) return scene;
  const cells = scene.root.children.find(n => n.key === "viz-chart-cells");
  const zoom = cells && "children" in cells ? cells.children.find(n => n.key === "viz-zoom") : undefined;
  const body = zoom && "children" in zoom ? zoom.children.find(n => n.key === "viz-chart-body") : undefined;
  if (!body || body.type !== "group") return scene;
  const content = body.children.findIndex(n => n.key === PLOT_ZOOM_CONTENT_KEY);
  const children = body.children.slice();
  if (content >= 0 && outlines.length) {
    const group = children[content];
    if (group.type === "group") children[content] = {...group, children: [...group.children, ...outlines]};
  } else children.push(...outlines);
  children.push(...titles);
  body.children = children;
  return scene;
}

/** The comparison-value accessor and side-title config `pyramidScene` reads. */
export interface PyramidSceneInput {
  sides: string[];
  labels: string[];
  side: RowAccessor;
  comparison?: RowAccessor;
  divisor: number;
  titleBox: TextBox;
  showTitles: boolean;
  /** Each side's distance from zero: the gutter's half-width in values, or 0. */
  inset: number;
  /** Draws the category labels in the gutter, given its pixel edges. */
  gutter?: (edges: [number, number]) => SceneNode[];
}

/** Adds the side titles and comparison outline to the painted Plot scene. */
export function pyramidScene(viz: VizInstance, scene: Scene, input: PyramidSceneInput): Scene {
  const x = viz._xFunc as ((v: number) => number) | undefined;
  const y = viz._yFunc as ((v: unknown) => number) | undefined;
  const area = viz._plotArea;
  if (!x || !y || !area || !viz._filteredData?.length) return scene;

  const outlines = input.comparison
    ? comparisonNodes({
        sides: input.sides,
        categories: (viz._yAxis?.domain() as unknown[]) ?? [],
        data: viz._filteredData,
        category: viz._y as RowAccessor,
        side: input.side,
        comparison: input.comparison,
        divisor: input.divisor,
        x,
        y,
        fallbackStep: area.height,
        config: viz.schema.comparisonConfig,
        inset: input.inset,
      })
    : [];

  const edges: [number, number] = [x(-input.inset), x(input.inset)];
  const inset = viz._plotInsetTop ?? 0;
  const titles =
    input.showTitles && inset > 0
      ? sideTitleNodes(
          input.titleBox,
          sideTitleBoxes(input.labels, {
            left: area.x,
            right: area.x + area.width,
            inner: edges,
            top: viz._margin.top - (viz._chartTransform?.y ?? viz._margin.top),
            height: inset,
          }),
          // Titles follow the chart's `fontFamily` unless they set their own.
          {...(viz.schema.fontFamily ? {fontFamily: viz.schema.fontFamily} : {}), ...viz.schema.sideTitleConfig},
        )
      : [];

  const labels = input.gutter ? input.gutter(edges) : [];
  return withPyramidNodes(scene, outlines, [...labels, ...titles]);
}
