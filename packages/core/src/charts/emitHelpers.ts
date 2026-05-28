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
    centralize the `configPrep.bind(viz)(viz._shapeConfig, "shape", key)`
    incantation. The helpers swallow exceptions (returning `[]`) to
    preserve the existing pure-Node fallback: tests that run without
    loading the shape registry continue to see an empty emit instead
    of crashing.

    @module
*/

import configPrep from "../utils/configPrep.js";

import type {SceneNode} from "@d3plus/render";

/**
    Apply a shape-config object to a chart-specific shape key, returning the
    configPrep-massaged object suitable for `.config(...)`. Equivalent to
    `(configPrep as any).bind(viz)(config, "shape", key)`. When `config` is
    omitted it defaults to `viz._shapeConfig` (the common case — 11 sites);
    callers that compose a transient config object (e.g. Plot's confidence
    bands) pass it explicitly.
*/
export function shapeConfigFor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viz: any,
  shapeKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (configPrep as any).bind(viz)(config ?? viz._shapeConfig, "shape", shapeKey);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shape: any,
  opts: {shape?: boolean; labels?: boolean} = {},
): SceneNode[] {
  if (!shape) return [];
  const includeShape = opts.shape !== false;
  const includeLabels = opts.labels !== false;
  try {
    shape.render();
    const out: SceneNode[] = [];
    if (includeShape) {
      const s = typeof shape.toScene === "function" ? shape.toScene() : null;
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
