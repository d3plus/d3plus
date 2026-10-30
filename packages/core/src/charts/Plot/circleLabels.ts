/**
    Labels of a Plot's Circle marks (scatter, bubble, beeswarm points): each
    stays inside its circle when it fits there, else moves beside it where
    there's room, else hides (see `labelPosition` and `features/circleLabels.ts`).

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {Shape} from "../../shapes/index.js";
import type {ShapeAes} from "../../shapes/Shape.js";
import {
  emitOutsideLabels,
  insideFontMin,
  layoutCircleLabels,
  outsideLabels,
} from "../features/circleLabels.js";
import type {CircleLabelItem} from "../features/circleLabels.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {PlotDatum} from "../features/plotPaint.js";

type Accessor<T> = (d: DataPoint, i: number) => T;
type LabelBounds = (
  this: Shape,
  d: DataPoint,
  i: number,
  aes: ShapeAes,
) => unknown;

/** A value, or an accessor's value for a row. */
const valueOf = <T>(v: unknown, d: DataPoint, i: number): T | undefined =>
  (typeof v === "function" ? (v as Accessor<T>)(d, i) : v) as T | undefined;

/** The plot rect the labels stay in, in shape coordinates. */
function plotBounds(ctx: ShapeEmitContext) {
  const xs = ctx.xRange.slice(0, 2).map(Number);
  const ys = ctx.yRange.slice(0, 2).map(r => Number(r) - (ctx.x2Height ?? 0));
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
}

/**
    Places the labels of a configured Circle shape before it renders: the
    shape keeps the labels that stay inside (an `"auto"` one no smaller than
    `pointLabelConfig.fontMin`), and the returned function emits the ones that
    sit beside their circles, to paint over the circles. Returns null, leaving
    the shape's labels alone, when the user gave the Circles their own
    `labelBounds`.
    @param ctx The shape group's emit context.
    @param s The Circle shape, configured but not yet rendered.
    @param userConfig The user's merged Circle shapeConfig.
*/
export function plotCircleLabels(
  ctx: ShapeEmitContext,
  s: Shape,
  userConfig: Record<string, unknown>,
): (() => SceneNode[]) | null {
  if (userConfig.labelBounds) return null;
  const {viz, values} = ctx;
  const schema = s.schema as Record<string, Accessor<unknown>> & {
    labelConfig: Record<string, unknown>;
    labelBounds: LabelBounds;
  };
  const labelConfig = schema.labelConfig;
  const items: CircleLabelItem<DataPoint>[] = values.map((d, i) => {
    const row = d as PlotDatum;
    const r = Number(schema.r(d, i));
    return {
      key: d,
      datum: (row.data ?? d) as DataPoint,
      index: typeof row.i === "number" ? row.i : i,
      x: Number(schema.x(d, i)),
      y: Number(schema.y(d, i)),
      r,
      text: schema.label(d, i),
      inside: {
        width: r * 2,
        height: r * 2,
        shape: "circle",
        padding: valueOf<number | string>(labelConfig.padding, d, i),
        font: {
          family: valueOf<string | string[]>(labelConfig.fontFamily, d, i),
          weight: valueOf<string | number>(labelConfig.fontWeight, d, i),
        },
      },
    };
  });
  const layout = layoutCircleLabels(viz, items, plotBounds(ctx));
  if (!layout.size) return null;

  const bounds = schema.labelBounds;
  const fontMin = labelConfig.fontMin;
  // A label placed beside its circle, or hidden, has no bounds inside it.
  schema.labelBounds = function (d, i, aes) {
    const placed = layout.get(d);
    if (placed && placed.position !== "inside") return null;
    return bounds.call(this, d, i, aes);
  };
  s.config({
    labelConfig: {
      fontMin: (rec: DataPoint, i: number) =>
        insideFontMin(
          viz,
          layout.get(rec.data as DataPoint),
          valueOf<number>(fontMin, rec, i) ?? 8,
        ),
    },
  });

  const indexOf = new Map(values.map((d, i) => [d, i]));
  const labels = outsideLabels(layout, d => ({
    id: `${valueOf(schema.id, d, indexOf.get(d) ?? 0)}`,
    datum: d,
  }));
  return () =>
    emitOutsideLabels(viz, labels, {fontOpacity: labelConfig.fontOpacity});
}

/**
    Lifts a Circle group's labels over every circle. Sized circles are layered
    by a `z` rank (largest behind), and a node without one sorts as 0, so
    without this a label would paint beneath the circles layered over its own.
    @param nodes The group's circles and labels.
*/
export function labelsOverCircles(nodes: SceneNode[]): SceneNode[] {
  let top = -Infinity;
  for (const n of nodes) if (typeof n.z === "number") top = Math.max(top, n.z);
  if (top === -Infinity) return nodes;
  return nodes.map(n => (n.type === "text" ? {...n, z: top + 1} : n));
}
