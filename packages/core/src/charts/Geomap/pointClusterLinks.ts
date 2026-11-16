/**
    Reroutes a Geomap's links to its clusters: a link whose end is a point
    drawn in a cluster's bubble (or fanned out from one) runs to where it
    is drawn instead, stopping at the bubble's edge, and a link with both
    ends in one cluster isn't drawn.

    @module
*/

import type {VizInstance} from "../viz/vizTypes.js";
import {
  clipsToCircle,
  flowArc,
  polylineBox,
  screenArc,
} from "./flowGeometry.js";
import type {GeoPathFn, LonLat, Point, Projector} from "./flowGeometry.js";
import {bundleFlowLinks} from "./flowLinks.js";
import type {FlowEnd, FlowLink} from "./flowLinks.js";
import type {ClusterPlaces} from "./pointClusterEmit.js";
import type {GeoClusterState} from "./pointClusterLayout.js";

/** Each clustered point's index, by the id links name it with. */
const leafIds = new WeakMap<GeoClusterState, Map<string, number>>();

/** The index of the clustered point a link end names, if it names one. */
function endLeaf(
  viz: VizInstance,
  state: GeoClusterState,
  end: FlowEnd,
): number | undefined {
  if (end.shape !== "Circle") return undefined;
  let ids = leafIds.get(state);
  if (!ids) {
    ids = new Map();
    state.rows.forEach((d, i) => {
      const id = `${viz._id(d, i)}`;
      if (!ids!.has(id)) ids!.set(id, i);
    });
    leafIds.set(state, ids);
  }
  return ids.get(end.id);
}

/** Where a link end is drawn: its place in unzoomed pixels, its radius there, and its node. */
interface EndPlace {
  at: Point;
  r: number;
  node: number;
  moved: boolean;
}

/**
    The links, rerouted to where their ends are drawn (see the module
    notes), each end's radius in unzoomed pixels at the zoom scale drawn.
    @param viz The Geomap.
    @param links The links, as laid out.
    @param state The clusters.
    @param places Where each point is drawn.
*/
export function rerouteFlowLinks(
  viz: VizInstance,
  links: FlowLink[],
  state: GeoClusterState,
  places: ClusterPlaces,
): FlowLink[] {
  const {k} = state;
  const projection = viz.schema.projection as Projector & {
    invert?: (p: Point) => LonLat | null;
  };
  const path = (viz.ctx as {path?: GeoPathFn}).path;
  const curve = clipsToCircle(projection)
    ? 0
    : Number(viz.schema.linkCurve) || 0;
  const placeOf = (end: FlowEnd): EndPlace | null => {
    const leaf = endLeaf(viz, state, end);
    if (leaf === undefined) return null;
    const at: Point = [places.at[leaf * 2], places.at[leaf * 2 + 1]];
    const own = state.leaves[leaf];
    return {
      at,
      r: places.r[leaf] / k,
      node: places.node[leaf],
      moved: at[0] !== own.x || at[1] !== own.y,
    };
  };
  const out: FlowLink[] = [];
  for (const link of links) {
    const s = placeOf(link.source),
      t = placeOf(link.target);
    if (s && t && s.node === t.node && (s.moved || t.moved)) continue;
    const source = s ? {...link.source, r: s.r} : link.source;
    const target = t ? {...link.target, r: t.r} : link.target;
    if (!s?.moved && !t?.moved) {
      out.push({...link, source, target});
      continue;
    }
    const sourceAt = s?.moved ? s.at : link.sourceAt;
    const targetAt = t?.moved ? t.at : link.targetAt;
    const coordOf = (p: EndPlace | null, end: FlowEnd): LonLat =>
      (p?.moved && projection.invert?.(p.at)) || end.coord;
    const geo =
      path && projection.invert
        ? flowArc(
            coordOf(s, link.source),
            coordOf(t, link.target),
            projection,
            path,
            curve,
          )
        : null;
    const drawn =
      geo ??
      (sourceAt && targetAt ? screenArc(sourceAt, targetAt, curve) : null);
    if (!drawn) continue;
    out.push({
      ...link,
      source: {...source, coord: coordOf(s, link.source)},
      target: {...target, coord: coordOf(t, link.target)},
      ...drawn,
      sourceAt,
      targetAt,
      box: drawn.points ? polylineBox(drawn.points) : link.box,
    });
  }
  if (path) bundleFlowLinks(viz, out, projection, path);
  return out;
}
