/**
    The scene nodes of a Geomap's clustered points: the lone points, each
    cluster's bubble (a pie of its points' colors under its count, or a
    plain circle when they share one), a fanned-out cluster's points and
    the legs to them, the points' labels, and the links rerouted to the
    clusters. Everything keeps its pixel size as the map zooms, so drawn
    at zoom scale `k`, each size is divided by `k`.

    @module
*/

import {arc} from "d3-shape";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily} from "@d3plus/text";

import type {LabelCircle} from "../features/circleLabelPlacement.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {chartBounds} from "../features/chartGeometry.js";
import {emitFlowLabels, emitFlowLinks} from "./flowEmit.js";
import type {FlowLink} from "./flowLinks.js";
import {geomapPointLabels} from "./pointLabels.js";
import {spiderOffsets} from "./pointCluster.js";
import type {ClusterNode} from "./pointCluster.js";
import {clusterRow, geoClusterTitle} from "./pointClusterLayout.js";
import type {GeoClusterState} from "./pointClusterLayout.js";
import {rerouteFlowLinks} from "./pointClusterLinks.js";
import {AGGREGATE_INDEX, rowIndex} from "../features/rowIndex.js";
import {pointSizeOf} from "./pointAccessors.js";

/** The key prefixes of the nodes a clustered draw owns (see `emitClusterScene`). */
export const CLUSTER_SCENE_KEYS = /^geomap-(link|point|cluster|spider|label)-/;

/** The width of the halo around a pie's count, in pixels. */
export const CLUSTER_HALO = 3;

/** The largest font of a cluster's count, in pixels. */
export const CLUSTER_FONT = 11;

/** One color of a cluster's pie: the fill and how many of its points take it. */
export interface ClusterColor {
  fill: string;
  count: number;
}

/**
    The colors of a cluster's points, the most common first (ties in the
    order they first appear).
    @param fills Every point's fill.
    @param leaves The cluster's points.
*/
export function clusterColors(
  fills: string[],
  leaves: number[],
): ClusterColor[] {
  const out = new Map<string, ClusterColor>();
  for (const leaf of leaves) {
    const fill = fills[leaf];
    const entry = out.get(fill);
    if (entry) entry.count++;
    else out.set(fill, {fill, count: 1});
  }
  return [...out.values()].sort((a, b) => b.count - a.count);
}

/**
    The wedges of a pie of radius `r`, one per color, each spanning its
    share of the points, clockwise from the top.
    @param colors The colors.
    @param r The pie's radius.
*/
export function clusterWedges(
  colors: ClusterColor[],
  r: number,
): {fill: string; d: string}[] {
  const total = colors.reduce((sum, c) => sum + c.count, 0);
  const shape = arc<{a0: number; a1: number}>()
    .innerRadius(0)
    .outerRadius(r)
    .startAngle(w => w.a0)
    .endAngle(w => w.a1);
  let a = 0;
  return colors.map(c => {
    const a0 = a;
    a += (2 * Math.PI * c.count) / total;
    return {fill: c.fill, d: shape({a0, a1: a}) ?? ""};
  });
}

/** What drawing a lone point reads. */
interface PointAt {
  d: DataPoint;
  i: number;
  x: number;
  y: number;
  /** The radius drawn, in unzoomed pixels. */
  r: number;
}

/**
    A coordinate point's circle: origin-centered with its position in the
    transform (the motion-trail layer reads it there), its stroke held at
    one screen width as the map zooms.
    @param viz The Geomap.
    @param circleConfig The merged Circle shapeConfig.
    @param p The point.
    @param trail Whether it trails between timeline frames.
*/
export function pointNode(
  viz: VizInstance,
  circleConfig: Record<string, unknown>,
  p: PointAt,
  trail: boolean = Boolean(circleConfig.trail),
): SceneNode {
  // The row's position in the data, as the point's handlers get it.
  const i = rowIndex(viz._filteredData, p.d);
  const paint = paintFromShapeConfig(circleConfig, p.d, i);
  return {
    type: "circle",
    key: `geomap-point-${viz._id(p.d, p.i)}`,
    cx: 0,
    cy: 0,
    r: p.r,
    transform: {x: p.x, y: p.y},
    datum: p.d,
    index: i,
    paint: {
      ...paint,
      vectorEffect: paint.vectorEffect ?? "non-scaling-stroke",
    },
    aria: {
      label: `${viz._drawLabel(p.d, i)}, ${pointSizeOf(viz, p.d)}.`,
    },
    ...(trail ? {trail: true} : {}),
    ...(trail && circleConfig.trailPersist
      ? {trailPersist: circleConfig.trailPersist}
      : {}),
  } as SceneNode;
}

/** The count printed on a cluster's bubble, sized to fit inside it. */
function countLabel(
  viz: VizInstance,
  key: string,
  text: string,
  room: number,
  fill: string,
): Omit<SceneNode, "transform"> {
  const family = fontExists(
    (viz.schema.fontFamily as string | string[] | undefined) ??
      defaultFontFamily,
  ) as string;
  const style = {"font-family": family, "font-weight": 600};
  const wide = textWidth(text, {...style, "font-size": CLUSTER_FONT}) as number;
  const size = Math.max(
    7,
    Math.min(
      CLUSTER_FONT,
      wide > 0 ? (CLUSTER_FONT * room) / wide : CLUSTER_FONT,
    ),
  );
  return {
    type: "text",
    key,
    interactive: false,
    x: 0,
    y: 0,
    lines: [{text, x: 0, y: 0, width: (wide * size) / CLUSTER_FONT}],
    font: {family, size, weight: 600, anchor: "middle", baseline: "middle"},
    paint: {fill},
  } as Omit<SceneNode, "transform">;
}

/**
    A cluster's bubble at `[x, y]`: its circle (which takes the pointer),
    a pie of its colors when they differ, and its count, which over a pie
    takes the chart's text color on a halo of its background, so it reads
    on any wedge.
    @param viz The Geomap.
    @param state The clusters.
    @param node The cluster.
    @param k The zoom scale.
*/
export function bubbleNodes(
  viz: VizInstance,
  state: GeoClusterState,
  node: ClusterNode,
  k: number,
): SceneNode[] {
  const row = clusterRow(state, state.level, node);
  const colors = clusterColors(state.fills ?? [], node.leaves);
  const R = state.bubble(node.weight);
  const key = `geomap-cluster-${node.id}`;
  const transform = {x: node.x, y: node.y};
  const mixed = colors.length > 1;
  const fill = colors[0]?.fill;
  const background = chartBackground(viz);
  const out: SceneNode[] = [
    {
      type: "circle",
      key,
      cx: 0,
      cy: 0,
      r: R / k,
      transform,
      datum: row,
      index: AGGREGATE_INDEX,
      paint: {
        fill,
        stroke: background,
        strokeWidth: 1.5,
        vectorEffect: "non-scaling-stroke",
      },
      aria: {label: `${geoClusterTitle(viz, row)}.`},
    } as SceneNode,
  ];
  if (mixed)
    clusterWedges(colors, R / k).forEach((w, n) =>
      out.push({
        type: "path",
        key: `${key}-wedge-${n}`,
        d: w.d,
        transform,
        datum: row,
        interactive: false,
        paint: {fill: w.fill, stroke: "none", strokeWidth: 0},
      } as SceneNode),
    );
  const label = countLabel(
    viz,
    `${key}-label`,
    formatAbbreviate(node.leaves.length, viz.schema.locale),
    R * 2 - 4 - (mixed ? CLUSTER_HALO * 2 : 0),
    mixed
      ? backgroundInk(viz)
      : colorContrast(fill ?? "#fff", viz.schema.colorDefaults),
  );
  out.push({
    ...label,
    ...(mixed
      ? {
          halo: true,
          paint: {
            ...label.paint,
            stroke: background,
            strokeWidth: CLUSTER_HALO,
            strokeOpacity: 1,
          },
        }
      : {}),
    datum: row,
    transform: {...transform, scale: 1 / k},
  } as SceneNode);
  return out;
}

/** Where each point is drawn: its own place, its cluster's, or where it fans out to. */
export interface ClusterPlaces {
  /** Each point's position, in unzoomed pixels, as `x, y` pairs. */
  at: Float64Array;
  /** The radius drawn there, in pixels on screen. */
  r: Float64Array;
  /** The id of the node each point is drawn in. */
  node: Int32Array;
}

/** A clustered draw: its nodes, and where each of its points is. */
export interface ClusterDraw {
  nodes: SceneNode[];
  places: ClusterPlaces;
  /** The nodes that move with a point (see `stageClusterMoves`), and that point. */
  leafOf: Map<SceneNode, number>;
}

/** The leg from a fanned-out cluster's center to one of its points. */
function spiderLeg(
  viz: VizInstance,
  node: ClusterNode,
  leaf: number,
  [dx, dy]: [number, number],
): SceneNode {
  return {
    type: "path",
    key: `geomap-spider-${node.id}-${leaf}`,
    d: `M0,0L${dx},${dy}`,
    transform: {x: node.x, y: node.y},
    interactive: false,
    paint: {
      fill: "none",
      stroke: backgroundInk(viz),
      strokeOpacity: 0.5,
      strokeWidth: 1,
      vectorEffect: "non-scaling-stroke",
    },
  } as SceneNode;
}

/** The lone points, fanned-out points, and bubbles of the level drawn. */
function clusterLayer(
  viz: VizInstance,
  state: GeoClusterState,
  circleConfig: Record<string, unknown>,
  sort: ((a: DataPoint, b: DataPoint) => number) | undefined,
): {
  nodes: SceneNode[];
  places: ClusterPlaces;
  leafOf: Map<SceneNode, number>;
  points: PointAt[];
  circles: LabelCircle[];
} {
  const {k} = state;
  const n = state.leaves.length;
  const places: ClusterPlaces = {
    at: new Float64Array(n * 2),
    r: new Float64Array(n),
    node: new Int32Array(n),
  };
  const place = (leaf: number, x: number, y: number, r: number, id: number) => {
    places.at[leaf * 2] = x;
    places.at[leaf * 2 + 1] = y;
    places.r[leaf] = r;
    places.node[leaf] = id;
  };
  const lone: PointAt[] = [];
  const fanned: PointAt[] = [];
  const legs: SceneNode[] = [];
  const bubbles: SceneNode[] = [];
  const leafOf = new Map<SceneNode, number>();
  const pointAt = (leaf: number, x: number, y: number): PointAt => ({
    d: state.rows[leaf],
    i: leaf,
    x,
    y,
    r: state.leaves[leaf].r / k,
  });
  for (const node of state.levels[state.level].nodes) {
    if (node.leaves.length === 1) {
      const leaf = node.leaves[0];
      const {x, y, r} = state.leaves[leaf];
      lone.push(pointAt(leaf, x, y));
      place(leaf, x, y, r, node.id);
      continue;
    }
    const R = state.bubble(node.weight);
    const drawn = bubbleNodes(viz, state, node, k);
    drawn.forEach(b => leafOf.set(b, node.leaves[0]));
    if (state.spider === node.id) {
      const offsets = spiderOffsets(
        node.leaves.map(leaf => state.leaves[leaf].r),
        R,
      );
      node.leaves.forEach((leaf, m) => {
        const [dx, dy] = offsets[m];
        const x = node.x + dx / k,
          y = node.y + dy / k;
        fanned.push(pointAt(leaf, x, y));
        place(leaf, x, y, state.leaves[leaf].r, node.id);
        const leg = spiderLeg(viz, node, leaf, [dx / k, dy / k]);
        leafOf.set(leg, node.leaves[0]);
        legs.push(leg);
      });
    } else node.leaves.forEach(leaf => place(leaf, node.x, node.y, R, node.id));
    bubbles.push(...drawn);
  }
  if (sort) lone.sort((a, b) => sort(a.d, b.d));
  const circleNodes = (list: PointAt[]) =>
    list.map(p => {
      const node = pointNode(viz, circleConfig, p, false);
      leafOf.set(node, p.i);
      return node;
    });
  const loneNodes = circleNodes(lone);
  const fanNodes = circleNodes(fanned);
  const points = [...lone, ...fanned];
  const images = backgroundImageNodes(
    circleConfig,
    [...loneNodes, ...fanNodes],
    m => [points[m].d, rowIndex(viz._filteredData, points[m].d)],
  );
  const circles: LabelCircle[] = [
    ...points.map(p => ({x: p.x, y: p.y, r: p.r})),
    ...bubbles
      .filter(b => b.type === "circle")
      .map(b => ({
        x: b.transform!.x!,
        y: b.transform!.y!,
        r: (b as {r: number}).r,
      })),
  ];
  return {
    nodes: [...loneNodes, ...legs, ...bubbles, ...fanNodes, ...images],
    places,
    leafOf,
    points,
    circles,
  };
}

/** What `emitClusterScene` reads from Geomap's layout. */
export interface ClusterSceneInput {
  cluster: GeoClusterState;
  flowLinks?: FlowLink[];
  pointSort?: (a: DataPoint, b: DataPoint) => number;
}

/**
    A clustered draw at the level and zoom scale `state` holds: the links,
    rerouted to the clusters their ends are in; the points, bubbles, and
    fanned-out points; the points' labels, laid out on screen and scaled
    back; and the links' labels.
    @param viz The Geomap.
    @param c The clusters, and the layout's links and point order.
*/
export function emitClusterScene(
  viz: VizInstance,
  c: ClusterSceneInput,
): ClusterDraw {
  const state = c.cluster;
  const {k} = state;
  const circleConfig = shapeConfigFor(viz, "Circle");
  state.fills ??= state.rows.map(
    (d, i) =>
      paintFromShapeConfig(circleConfig, d, i).fill ?? backgroundInk(viz),
  );
  const layer = clusterLayer(viz, state, circleConfig, c.pointSort);
  const links = c.flowLinks?.length
    ? rerouteFlowLinks(viz, c.flowLinks, state, layer.places)
    : [];
  const {width, height} = chartBounds(viz);
  const labels = geomapPointLabels(
    viz,
    {
      points: layer.points.map(p => p.d),
      pointR: (_d, m) => layer.points[m].r * k,
      pointX: (_d, m) => layer.points[m].x * k,
      pointY: (_d, m) => layer.points[m].y * k,
    },
    circleConfig,
    {
      bounds: {x: 0, y: 0, width: width * k, height: height * k},
      obstacles: layer.circles
        .slice(layer.points.length)
        .map(b => ({x: b.x * k, y: b.y * k, r: b.r * k})),
    },
  );
  return {
    nodes: [
      ...emitFlowLinks(viz, links),
      ...layer.nodes,
      {
        type: "group",
        key: "geomap-point-labels",
        transform: {x: 0, y: 0, scale: 1 / k},
        children: labels,
      } as SceneNode,
      ...emitFlowLabels(viz, links, layer.circles),
    ],
    places: layer.places,
    leafOf: layer.leafOf,
  };
}
