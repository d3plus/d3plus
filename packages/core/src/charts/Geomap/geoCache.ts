/**
    Geomap's caches across draws: the features of each topojson, the
    projection fit, and each feature's projected path. A redraw with the same
    topojson, chart size, and projection reuses them instead of streaming
    every shape through the projection again.

    @module
*/

import {feature as topojsonFeature} from "topojson-client";

/** A GeoJSON FeatureCollection, as `topojson-client` returns one. */
export interface FeatureCollection {
  type: string;
  features: Record<string, unknown>[];
}

/** A d3-geo projection, as far as the caches read it. */
type Projection = ((point: [number, number]) => unknown) &
  Record<string, unknown>;

/** The features converted from each topojson object, by its key. */
const topoCache = new WeakMap<object, Map<string, FeatureCollection>>();

/**
    The features of the object `key` names in `topo` (or its first object),
    as `topojson-client`'s `feature`. The conversion is kept per topojson, so
    each draw gets new feature objects around the same geometries.
*/
export function topoFeatures(
  topo: Record<string, unknown>,
  key?: string,
): FeatureCollection {
  const objects = topo.objects as Record<string, unknown>;
  const k = key && objects[key] ? key : Object.keys(objects)[0];
  let byKey = topoCache.get(topo);
  if (!byKey) topoCache.set(topo, (byKey = new Map()));
  let collection = byKey.get(k);
  if (!collection) {
    collection = topojsonFeature(
      topo as unknown as Parameters<typeof topojsonFeature>[0],
      k,
    ) as unknown as FeatureCollection;
    byKey.set(k, collection);
  }
  return Array.isArray(collection.features)
    ? {...collection, features: collection.features.map(f => ({...f}))}
    : {...collection};
}

/** The projection settings that place points, besides a custom projection's own. */
const SETTINGS = [
  "scale",
  "translate",
  "rotate",
  "center",
  "angle",
  "reflectX",
  "reflectY",
  "parallels",
  "clipAngle",
  "clipExtent",
  "precision",
  "preclip",
  "postclip",
];

/** Points spread over the globe, projected to tell projections apart. */
const PROBES: [number, number][] = [
  [0, 0],
  [-98, 39],
  [-150, 61],
  [-157, 21],
  [-66, 18],
  [12, 50],
  [116, 40],
  [151, -34],
  [-58, -34],
  [28, -26],
];

/** An id for each function a setting holds, so a new one changes the state. */
const functionIds = new WeakMap<object, number>();
let nextFunctionId = 0;

/** A string that tells values apart: numbers exactly (-0 and NaN included), functions by identity. */
function serialize(value: unknown): string {
  if (typeof value === "function") {
    let id = functionIds.get(value);
    if (id === undefined) functionIds.set(value, (id = nextFunctionId++));
    return `f${id}`;
  }
  if (typeof value === "number")
    return Object.is(value, -0) ? "-0" : String(value);
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  if (value === null || value === undefined) return String(value);
  if (typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  return "?";
}

/**
    The state of `projection`: its settings and where it places a spread of
    points. Two equal states draw the same paths (a projection with a setting
    outside the list shows it in the points). Null when a setting can't be
    read, which matches nothing.
*/
export function projectionState(projection: Projection): string | null {
  try {
    const parts: string[] = [];
    for (const name of SETTINGS) {
      const get = projection[name];
      if (typeof get === "function")
        parts.push(
          `${name}=${serialize((get as () => unknown).call(projection))}`,
        );
    }
    for (const p of PROBES) parts.push(serialize(projection(p)));
    return parts.join(";");
  } catch {
    return null;
  }
}

/**
    Whether two GeoJSON values are the same: the same object, or arrays and
    plain objects whose entries are the same, numbers compared exactly.
*/
export function sameGeo(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!sameGeo(a[i], b[i])) return false;
    return true;
  }
  if (
    !a ||
    !b ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(b) ||
    Object.getPrototypeOf(a) !== Object.prototype ||
    Object.getPrototypeOf(b) !== Object.prototype
  )
    return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    k =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      sameGeo(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
  );
}

/** A fit, and the projection state it left. */
interface Fit {
  extent: [[number, number], [number, number]];
  object: unknown;
  state: string | null;
}

const fits = new WeakMap<object, Fit>();

/**
    `projection.fitExtent(extent, object)`, skipped when the projection's
    last fit was to the same extent and object and nothing about it has
    changed since: fitting again would give the same scale and translate.
*/
export function fitExtentOnce(
  projection: Projection & {
    fitExtent: (
      extent: [[number, number], [number, number]],
      object: unknown,
    ) => unknown;
  },
  extent: [[number, number], [number, number]],
  object: unknown,
): void {
  const last = fits.get(projection);
  if (
    last &&
    last.state !== null &&
    sameGeo(last.extent, extent) &&
    last.state === projectionState(projection) &&
    sameGeo(last.object, object)
  )
    return;
  projection.fitExtent(extent, object);
  fits.set(projection, {
    extent: [[...extent[0]], [...extent[1]]],
    object,
    state: projectionState(projection),
  });
}

/** Each projection's paths, by geometry, for the state they were drawn in. */
const paths = new WeakMap<
  object,
  {state: string; byGeometry: WeakMap<object, string | null>}
>();

/**
    `path(feature)` for each feature, kept by the feature's geometry while
    `projection` stays in the same state (see `projectionState`).
*/
export function cachedPaths(
  projection: Projection,
  path: (feature: unknown) => string | null,
): (feature: unknown) => string | null {
  const state = projectionState(projection);
  if (state === null) return path;
  let cache = paths.get(projection);
  if (cache?.state !== state)
    paths.set(projection, (cache = {state, byGeometry: new WeakMap()}));
  const {byGeometry} = cache;
  return feature => {
    const geometry = (feature as {geometry?: unknown} | null)?.geometry;
    if (!geometry || typeof geometry !== "object") return path(feature);
    if (byGeometry.has(geometry)) return byGeometry.get(geometry)!;
    const d = path(feature);
    byGeometry.set(geometry, d);
    return d;
  };
}
