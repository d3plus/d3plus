/**
    The value the chart's colorScale reads from a row: the chart's own
    `colorScale` for its data rows, and, on the node-link charts, each link's
    numeric `linkColor` value for its link rows (see `linkColorScaleRows`).
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

type Accessor = (d: DataPoint, i: number) => unknown;

/** Each chart's link rows (raw `links` entries and drawn link datums) and their numeric `linkColor` values. */
const linkValues = new WeakMap<object, WeakMap<object, number>>();

/** The link rows behind the last `linkColorScaleRows` call, per chart. */
const rowCache = new WeakMap<
  object,
  {links: unknown; nodes: unknown; accessor: unknown; rows: DataPoint[]}
>();

function valuesOf(viz: VizInstance): WeakMap<object, number> {
  let map = linkValues.get(viz);
  if (!map) linkValues.set(viz, (map = new WeakMap()));
  return map;
}

/** Whether `v` is a number the colorScale can place. */
export function isScaleValue(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
    Notes a drawn link datum's numeric `linkColor` value, so the colorScale
    reads it for that link (hovering it marks the value on the colorScale,
    and hovering a colorScale bucket highlights the links in it).
*/
export function noteLinkValue(
  viz: VizInstance,
  datum: object,
  value: number,
): void {
  valuesOf(viz).set(datum, value);
}

/**
    A `links` row as `linkColor` reads it before the chart lays its links
    out: `source` and `target` set to the `nodes` entries they name (by id,
    or by position for a number), as a drawn link's datum has them. An end
    no node matches reads as `{id}`.
*/
function rowWithEnds(
  row: DataPoint,
  nodes: DataPoint[],
  byId: Map<string, DataPoint>,
): DataPoint {
  const end = (v: unknown): DataPoint => {
    if (v && typeof v === "object") return v as DataPoint;
    const node =
      byId.get(`${v}`) ?? (typeof v === "number" ? nodes[v] : undefined);
    return node ?? ({id: v} as DataPoint);
  };
  return {...row, source: end(row.source), target: end(row.target)};
}

/**
    The `links` entries whose `linkColor` value is a number: the rows the
    chart's colorScale adds to its own. Empty when `linkColor` isn't a key or
    accessor, or no link has a numeric value.
*/
export function linkColorScaleRows(viz: VizInstance): DataPoint[] {
  const accessor = viz.schema.linkColor as unknown;
  const links = viz.schema.links as unknown;
  if (typeof accessor !== "function" || !Array.isArray(links)) return [];
  const nodes = viz.schema.nodes as unknown;
  const cached = rowCache.get(viz);
  if (
    cached &&
    cached.links === links &&
    cached.nodes === nodes &&
    cached.accessor === accessor
  )
    return cached.rows;
  const nodeRows = Array.isArray(nodes) ? (nodes as DataPoint[]) : [];
  const byId = new Map<string, DataPoint>();
  for (const n of nodeRows)
    if (
      n &&
      typeof n === "object" &&
      n.id !== undefined &&
      !byId.has(`${n.id}`)
    )
      byId.set(`${n.id}`, n);
  const values = valuesOf(viz);
  const rows: DataPoint[] = [];
  (links as DataPoint[]).forEach((row, i) => {
    if (!row || typeof row !== "object") return;
    const v = (accessor as Accessor)(rowWithEnds(row, nodeRows, byId), i);
    if (!isScaleValue(v)) return;
    values.set(row, v);
    rows.push(row);
  });
  rowCache.set(viz, {links, nodes, accessor, rows});
  return rows;
}

/**
    The accessor the chart's colorScale reads values with: the chart's own
    `colorScale`, which also reads each link row's numeric `linkColor`
    value when it has links colored by number. Undefined when neither
    gives the colorScale anything to show.
*/
export function colorScaleValue(viz: VizInstance): Accessor | undefined {
  const own =
    typeof viz.schema.colorScale === "function"
      ? (viz.schema.colorScale as Accessor)
      : undefined;
  if (!linkColorScaleRows(viz).length) return own;
  const values = valuesOf(viz);
  return (d, i) => {
    if (d && typeof d === "object" && values.has(d)) return values.get(d);
    return own ? own(d, i) : undefined;
  };
}

/**
    The color the chart's colorScale gives `value`: the scale's color for it,
    or the scale's last color while it has no domain yet.
*/
export function colorScaleColor(viz: VizInstance, value: unknown): unknown {
  const cs = viz._colorScaleClass;
  if (!cs) return undefined;
  const scale = cs._colorScale as
    | (((v: unknown) => unknown) & {
        domain: () => unknown[];
        range: () => unknown[];
      })
    | undefined;
  const colors = cs.color() as unknown;
  if (!scale) return Array.isArray(colors) ? colors[colors.length - 1] : colors;
  if (!scale.domain().length) return scale.range()[scale.range().length - 1];
  return scale(value);
}
