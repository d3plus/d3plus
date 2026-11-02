/**
    Geomap's `links`: resolves each link's two ends to places on the map,
    sizes the links from `linkSize`, and shapes each one's path.

    A link end is either a `[longitude, latitude]` pair, drawn to that
    coordinate, or an id (a string, a number, or an object with an `id`)
    naming a row of the chart's data or a topojson feature. An id ends at
    its row's coordinate point when the row has one (`point`), and otherwise
    at the centroid of its topojson shape. Links with an end that names
    nothing on the map are left out.
*/

import {extent} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {
  forgetLinkNodes,
  makeLinkDatum,
  publishLinkGraph,
  setLinkValue,
} from "../features/linkInteraction.js";
import type {LinkDatum, LinkEnd} from "../features/linkInteraction.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  clipsToCircle,
  coordinateVisible,
  featureAnchor,
  flowArc,
  isLonLat,
  polylineBox,
  toLonLat,
} from "./flowGeometry.js";
import type {GeoPathFn, LonLat, Point, Projector} from "./flowGeometry.js";

/** One end of a drawn link: the place it names, and the mark drawn there. */
export interface FlowEnd extends LinkEnd {
  coord: LonLat;
  /** The mark at the end: a coordinate point, a topojson shape, or none. */
  shape?: "Circle" | "Path";
  /** The radius of the point at the end, or 0. */
  r: number;
}

/** A link as Geomap draws it. */
export interface FlowLink {
  datum: LinkDatum;
  /** The link's index in `links`. */
  index: number;
  source: FlowEnd;
  target: FlowEnd;
  /** The stroke width, in pixels. */
  size: number;
  d: string;
  /** The path as projected points, or null where the projection cuts it. */
  points: Point[] | null;
  /** Where the source is drawn, or null when the projection hides it. */
  sourceAt: Point | null;
  /** Where the target is drawn, or null when the projection hides it. */
  targetAt: Point | null;
  /** The box around the drawn path. */
  box: [Point, Point];
}

/** A drawn topojson shape, as Geomap's layout lists them. */
interface TopoRow {
  data?: DataPoint;
  feature: unknown;
  id: string | number;
}

/** What `geomapFlowLinks` reads from Geomap's layout. */
export interface FlowLayoutInput {
  pointData: DataPoint[];
  topoData: TopoRow[];
  pointR: (d: DataPoint, i: number) => number;
  path: GeoPathFn;
}

/**
    What a link end refers to: a coordinate, an id (as a string), or null
    for anything else.
*/
export function linkEndRef(ref: unknown): LonLat | string | null {
  if (isLonLat(ref)) return [ref[0], ref[1]];
  if (typeof ref === "string") return ref;
  if (typeof ref === "number" && Number.isFinite(ref)) return `${ref}`;
  if (ref && typeof ref === "object" && "id" in ref) {
    const id = (ref as {id: unknown}).id;
    if (typeof id === "string" || typeof id === "number") return `${id}`;
  }
  return null;
}

/** A coordinate's name: its longitude and latitude, in the chart's locale. */
export function coordinateLabel(coord: LonLat, locale?: string): string {
  let format: (n: number) => string;
  try {
    const f = new Intl.NumberFormat(locale || undefined, {
      maximumFractionDigits: 2,
    });
    format = n => f.format(n);
  } catch {
    format = n => `${Math.round(n * 100) / 100}`;
  }
  return `${format(coord[0])}, ${format(coord[1])}`;
}

/**
    Builds the resolver that turns a link end into the place it names on the
    map (see the module notes), or null when it names nothing.
*/
export function flowEndResolver(
  v: VizInstance,
  input: Omit<FlowLayoutInput, "path">,
): (ref: unknown) => FlowEnd | null {
  const points = new Map<string, FlowEnd>();
  input.pointData.forEach((d, i) => {
    const coord = toLonLat(v.schema.point(d, i));
    if (!coord) return;
    const id = `${v._id(d, i)}`;
    if (points.has(id)) return;
    const r = input.pointR(d, i);
    points.set(id, {
      data: d,
      i,
      id,
      coord,
      shape: "Circle",
      r: Number.isFinite(r) ? r : 0,
    });
  });
  const shapes = new Map<string, {row: TopoRow; i: number}>();
  input.topoData.forEach((row, i) => {
    const id = `${row.id}`;
    if (!shapes.has(id)) shapes.set(id, {row, i});
  });
  const anchors = new Map<string, FlowEnd | null>();
  const coords = new Map<string, FlowEnd>();
  const locale = v.schema.locale as string | undefined;
  return ref => {
    const key = linkEndRef(ref);
    if (key === null) return null;
    if (typeof key !== "string") {
      const id = key.join(",");
      if (!coords.has(id))
        coords.set(id, {
          data: {point: key} as unknown as DataPoint,
          i: 0,
          id,
          label: coordinateLabel(key, locale),
          coord: key,
          r: 0,
        });
      return coords.get(id)!;
    }
    const point = points.get(key);
    if (point) return point;
    if (!anchors.has(key)) {
      const shape = shapes.get(key);
      const coord = shape ? featureAnchor(shape.row.feature) : null;
      anchors.set(
        key,
        shape && coord
          ? {
              // The datum the shape is drawn with, so hovering it finds its links.
              data: (shape.row.data ?? shape.row) as DataPoint,
              i: shape.i,
              id: key,
              coord,
              shape: "Path",
              r: 0,
            }
          : null,
      );
    }
    return anchors.get(key)!;
  };
}

/**
    The `[longitude, latitude]` ends of `links`, which the map's initial fit
    takes in when it frames coordinate points.
*/
export function flowLinkCoordinates(links: unknown): LonLat[] {
  if (!Array.isArray(links)) return [];
  const out: LonLat[] = [];
  for (const link of links as {source?: unknown; target?: unknown}[]) {
    if (!link || typeof link !== "object") continue;
    for (const ref of [link.source, link.target])
      if (isLonLat(ref)) out.push([ref[0], ref[1]]);
  }
  return out;
}

/**
    Link stroke widths from their `linkSize` values: scaled by the
    continuous d3-scale `scaleName` onto `[min, max]` pixels when the values
    differ, else each value as is. A missing value takes `min`.
*/
export function flowLinkWidths(
  sizes: unknown[],
  {scale, min, max}: {scale?: string; min: number; max: number},
): number[] {
  const values = sizes.map(s =>
    typeof s === "number" && Number.isFinite(s) ? s : undefined,
  );
  const [lo, hi] = extent(values.filter((s): s is number => s !== undefined));
  if (lo === undefined || hi === undefined || lo === hi)
    return values.map(s => s ?? min);
  const name = `${scale || "sqrt"}`;
  const factory = (scales as unknown as Record<string, unknown>)[
    `scale${name.charAt(0).toUpperCase()}${name.slice(1)}`
  ] as
    | (() => {
        domain: (d: [number, number]) => {
          range: (r: [number, number]) => (n: number) => number;
        };
      })
    | undefined;
  const make =
    factory ?? (scales.scaleSqrt as unknown as NonNullable<typeof factory>);
  const fn = make()
    .domain([lo, hi])
    .range([min, Math.max(min, max)]);
  return values.map(s => (s === undefined ? min : fn(s)));
}

/** The box around a path's points, read from its `d`. */
function pathBox(d: string): [Point, Point] {
  const n = (d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(
    Number,
  );
  const points: Point[] = [];
  for (let k = 0; k + 1 < n.length; k += 2) points.push([n[k], n[k + 1]]);
  return points.length
    ? polylineBox(points)
    : [
        [0, 0],
        [0, 0],
      ];
}

/**
    Resolves, sizes, and shapes the chart's `links` for this draw, and
    publishes them for tooltips and hover (see `publishLinkGraph`).
*/
export function geomapFlowLinks(
  v: VizInstance,
  input: FlowLayoutInput,
): FlowLink[] {
  if (v._facetStep !== "panel") forgetLinkNodes(v);
  const raw = Array.isArray(v.schema.links)
    ? (v.schema.links as DataPoint[])
    : [];
  const resolve = flowEndResolver(v, input);
  const projection = v.schema.projection as Projector;
  // On a globe a bowed arc would leave the disc, so links follow the sphere.
  const drawnAt = (coord: LonLat): Point | null => {
    const p = coordinateVisible(input.path, coord) ? projection(coord) : null;
    return p && Number.isFinite(p[0]) && Number.isFinite(p[1]) ? p : null;
  };
  const curve = clipsToCircle(projection) ? 0 : Number(v.schema.linkCurve) || 0;
  const drawn: (Omit<FlowLink, "size" | "box"> & {box: FlowLink["box"]})[] = [];
  raw.forEach((row, index) => {
    if (!row || typeof row !== "object") return;
    const source = resolve(row.source);
    const target = resolve(row.target);
    if (!source || !target) return;
    const arc = flowArc(
      source.coord,
      target.coord,
      projection,
      input.path,
      curve,
    );
    if (!arc) return;
    drawn.push({
      datum: makeLinkDatum(row, source, target, index),
      index,
      source,
      target,
      ...arc,
      sourceAt: drawnAt(source.coord),
      targetAt: drawnAt(target.coord),
      box: arc.points ? polylineBox(arc.points) : pathBox(arc.d),
    });
  });
  // Sized over the links drawn.
  const linkSize = v.schema.linkSize as (d: DataPoint, i: number) => unknown;
  const widths = flowLinkWidths(
    drawn.map(l => setLinkValue(l.datum, linkSize(l.datum, l.index))),
    {
      scale: v.schema.linkSizeScale as string | undefined,
      min: Number(v.schema.linkSizeMin) || 0,
      max: Number(v.schema.linkSizeMax) || 0,
    },
  );
  const links: FlowLink[] = drawn.map((l, k) => ({...l, size: widths[k]}));
  const ends = new Map<string, FlowEnd>();
  for (const link of links)
    for (const end of [link.source, link.target])
      if (end.shape) ends.set(end.id, end);
  publishLinkGraph(
    v,
    links.map(l => l.datum),
    [...ends.values()],
  );
  return links;
}
