/**
    Helpers for `ChartDefinition.emit` functions.

    Most chart-as-data emits follow the same shape-compute pattern:
    instantiate a Shape (Rect/Circle/Path/…) in `renderMode("compute")`,
    feed it the laid-out data + per-emit config + viz-level shapeConfig,
    call `render()` (which short-circuits before DOM mutation in compute
    mode but populates internal state), then extract:

      - the shape's own scene via `shape.toScene().children`
      - its labels via `shape._labelClass.toScene().children`

    These two helpers reduce that boilerplate to a single call and
    centralize the `configPrep.bind(viz)(viz.schema.shapeConfig, "shape", key)`
    incantation. The helpers swallow exceptions (returning `[]`) to
    preserve the existing pure-Node fallback: tests that run without
    loading the shape registry continue to see an empty emit instead
    of crashing.

    @module
*/

import configPrep from "../utils/configPrep.js";

import type {DataPoint} from "@d3plus/data";
import type {GroupNode, SceneNode} from "@d3plus/render";

/**
    Structural minimum a Shape (or shape-like component: TextBox, Axis)
    must satisfy for the helpers below to work with it. Captures only the
    members the helpers touch — `render()`, optional `toScene()`, and an
    optional inner `_labelClass` with its own `toScene()`.

    Replaces the previous `shape: any` parameter on `collectComputed` and
    `absorbShapeIntoChartScene` — both helpers consume the same surface
    regardless of whether the actual instance is a `Shape` subclass, a
    `TextBox`, an `Axis`, or anything else that exposes these members.
*/
export interface ShapeLike {
  render(): unknown;
  toScene?: () => GroupNode | null | undefined;
  _labelClass?: {
    toScene?: () => GroupNode | null | undefined;
  };
}

/**
    Structural minimum a Viz instance must satisfy for these helpers to
    work. Each chart subclass has many more fields; the helpers only need
    `_chartScene` (mutated by `absorbShapeIntoChartScene`) and
    `schema.shapeConfig` (read by `shapeConfigFor`'s default-config branch).
*/
export interface VizLike {
  _chartScene?: SceneNode[];
  schema: Record<string, unknown>;
}

/**
    Resolve a per-datum accessor — either a function `(d, i) => T` or a bare
    value. The pattern repeats in every flat-data emit (Treemap, Pack, Pie,
    Priestley, …). Centralized here so each emit doesn't need its own copy.
*/
export function resolveAccessor<T>(
  val: unknown,
  d: DataPoint,
  i: number | undefined,
): T | undefined {
  if (typeof val === "function") {
    return (val as (d: DataPoint, i: number | undefined) => T)(d, i);
  }
  return val as T | undefined;
}

/**
    Resolve the standard paint properties (`fill`, `stroke`, `strokeWidth`,
    `opacity`) from a shape-config record for a single datum. Returns a
    `Paint`-shaped object compatible with `SceneNode.paint`. `fill` is
    forced to `string | undefined` to match `Paint.fill` (texture/object
    fills fall through to `undefined`; the existing flat-data emits already
    do this same coercion).
*/
export function paintFromShapeConfig(
  sc: Record<string, unknown>,
  d: DataPoint,
  i: number | undefined,
): {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
} {
  const fill = resolveAccessor<unknown>(sc.fill, d, i);
  const stroke = resolveAccessor<string>(sc.stroke, d, i);
  const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d, i);
  const opacity = resolveAccessor<number>(sc.opacity, d, i);
  return {
    fill: typeof fill === "string" ? fill : undefined,
    stroke,
    strokeWidth,
    opacity,
  };
}

/**
    Apply a shape-config object to a chart-specific shape key, returning the
    configPrep-massaged object suitable for `.config(...)`. Equivalent to
    `(configPrep as any).bind(viz)(config, "shape", key)`. When `config` is
    omitted it defaults to `viz.schema.shapeConfig` (the common case — 11 sites);
    callers that compose a transient config object (e.g. Plot's confidence
    bands) pass it explicitly.

    `kind` is the second `configPrep` argument (the property to filter by).
    Defaults to `"shape"` — the standard call shape. Network's link config
    uses `"edge"` instead.
*/
export function shapeConfigFor(
  viz: VizLike,
  shapeKey: string,
  config?: Record<string, unknown>,
  kind: string = "shape",
): Record<string, unknown> {
  // configPrep itself isn't yet typed in @d3plus/dom; the cast lives here so
  // every caller doesn't need to know about it. The runtime contract is
  // `configPrep.bind(viz)(config, kind, key) → massagedConfig`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (configPrep as any).bind(viz)(config ?? viz.schema.shapeConfig, kind, shapeKey);
}

/**
    Run `shape.render()` in compute mode and collect the resulting scene
    nodes — shape children and/or label children — in a single flat array.
    Returns `[]` if `shape` is missing or rendering throws (pure-Node
    fallback for tests that don't load the shape registry).

    @param shape A shape instance already configured (data, accessors,
                 config) and set to `renderMode("compute")`.
    @param opts.shape Include `shape.toScene().children` (default true).
    @param opts.labels Include `shape._labelClass.toScene().children`
                       (default true).
*/
export function collectComputed(
  shape: ShapeLike | null | undefined,
  opts: {shape?: boolean; labels?: boolean} = {},
): SceneNode[] {
  if (!shape) return [];
  const includeShape = opts.shape !== false;
  const includeLabels = opts.labels !== false;
  try {
    shape.render();
    const out: SceneNode[] = [];
    if (includeShape && typeof shape.toScene === "function") {
      const s = shape.toScene();
      if (s && Array.isArray(s.children)) out.push(...s.children);
    }
    if (includeLabels) {
      const lbl = shape._labelClass;
      if (lbl && typeof lbl.toScene === "function") {
        const ls = lbl.toScene();
        if (ls && Array.isArray(ls.children)) out.push(...ls.children);
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
    Push a compute-mode shape's scene nodes onto `viz._chartScene`. Used
    inside chart-specific layout stages that need to mount axis decorations,
    background rects, or other helper geometry alongside the main shape
    emit. The shape MUST already be in `renderMode("compute")`; this helper
    calls `shape.render()` and then absorbs both the shape and label scenes.

    Lives here (not in Plot.ts) so any chart stage can call it. Optionally
    wraps the absorbed nodes in a group with the given key + transform,
    useful when the decoration needs its own coordinate system that's
    distinct from the chart-wide `_chartTransform`.
*/
export function absorbShapeIntoChartScene(
  viz: VizLike,
  shape: ShapeLike | null | undefined,
  wrap?: {key: string; transform?: {x: number; y: number}},
): void {
  if (!shape || typeof shape.toScene !== "function") return;
  if (!Array.isArray(viz._chartScene)) viz._chartScene = [];
  const children = collectComputed(shape);
  if (!children.length) return;
  if (wrap) {
    viz._chartScene!.push({type: "group", ...wrap, children});
  } else {
    viz._chartScene!.push(...children);
  }
}
