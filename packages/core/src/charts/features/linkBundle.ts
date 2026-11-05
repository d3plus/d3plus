/**
    `linkBundle` for a chart's links: bundles their straight runs (see
    `bundleEdges`) with the chart's `linkBundleConfig`, through a cache kept
    on the chart, so a redraw with the links where they were reuses the
    last bundling.
*/

import {bundleEdges, edgeBundleCache} from "./edgeBundling.js";
import type {
  EdgeBundleCache,
  EdgeBundleOptions,
  Segment,
} from "./edgeBundling.js";
import type {Point} from "./polyline.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The chart's bundling cache, created on first use. */
export function linkBundleCache(viz: VizInstance): EdgeBundleCache {
  const cache = viz.ctx.linkBundleCache as EdgeBundleCache | undefined;
  if (cache) return cache;
  const created = edgeBundleCache();
  viz.ctx.linkBundleCache = created;
  return created;
}

/**
    Each edge's bundled path, from its source to its target, with the
    chart's `linkBundleConfig`.
*/
export function bundleLinkPaths(
  viz: VizInstance,
  edges: readonly Segment[],
): Point[][] {
  return bundleEdges(
    edges,
    (viz.schema.linkBundleConfig ?? {}) as Partial<EdgeBundleOptions>,
    linkBundleCache(viz),
  );
}
