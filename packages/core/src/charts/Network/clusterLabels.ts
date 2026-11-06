/**
    Cluster names on a Network: each cluster's name (see `clusters.ts`)
    written inside the hull of its nodes, at the open spot nearest the
    cluster's middle, clear of every node, every node label beside its node,
    and the other names. A name shrinks to fit, down to `fontMin`, and a
    cluster with no room for it goes unnamed. Names are inert to the pointer
    and keyboard, in the chart's ink over a halo of its background.
*/

import {polygonContains, polygonHull} from "d3-polygon";

import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {measureLabel} from "../features/circleLabels.js";
import {textHalo} from "../features/textHalo.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {ClusterState} from "./clusters.js";

type Point = [number, number];

/** `clusterConfig.labelConfig`'s defaults. */
export const CLUSTER_LABEL_DEFAULTS = {fontMax: 16, fontMin: 10, padding: 4};

/** The resolved `clusterConfig.labelConfig`, or null when names stay off the chart. */
export interface ClusterLabelSettings {
  fontMax: number;
  fontMin: number;
  padding: number;
  /** The rest, as TextBox config (fontColor, fontFamily, fontWeight, …). */
  text: Record<string, unknown>;
}

/** Reads `clusterConfig.labelConfig`, with its defaults for anything missing or invalid. */
export function clusterLabelSettings(
  viz: VizInstance,
): ClusterLabelSettings | null {
  const cfg = (viz.schema.clusterConfig ?? {}).labelConfig;
  if (cfg === false) return null;
  const {fontMax, fontMin, padding, ...text} = (cfg ?? {}) as Record<
    string,
    unknown
  >;
  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
  const max = num(fontMax, CLUSTER_LABEL_DEFAULTS.fontMax);
  return {
    fontMax: max,
    fontMin: Math.min(max, num(fontMin, CLUSTER_LABEL_DEFAULTS.fontMin)),
    padding: num(padding, CLUSTER_LABEL_DEFAULTS.padding),
    text,
  };
}

/** A circle a name keeps clear of. */
export interface ClusterLabelCircle {
  x: number;
  y: number;
  r: number;
}

/** Whether a box's interior overlaps a circle. */
function boxHitsCircle(b: Bounds, c: ClusterLabelCircle): boolean {
  const dx = c.x - Math.max(b.x, Math.min(c.x, b.x + b.width));
  const dy = c.y - Math.max(b.y, Math.min(c.y, b.y + b.height));
  return dx * dx + dy * dy < c.r * c.r;
}

/** Whether two boxes' interiors overlap. */
function boxesOverlap(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

/**
    A grid of buckets over the circles and boxes names keep clear of, so a
    test only checks the obstacles near it. `add` puts a placed name in.
*/
export function clusterLabelObstacles(
  circles: readonly ClusterLabelCircle[],
  boxes: readonly Bounds[],
  cell = 32,
): {hits: (box: Bounds) => boolean; add: (box: Bounds) => void} {
  const buckets = new Map<string, (ClusterLabelCircle | Bounds)[]>();
  const each = (b: Bounds, fn: (key: string) => void) => {
    for (
      let i = Math.floor(b.x / cell);
      i <= Math.floor((b.x + b.width) / cell);
      i++
    )
      for (
        let j = Math.floor(b.y / cell);
        j <= Math.floor((b.y + b.height) / cell);
        j++
      )
        fn(`${i},${j}`);
  };
  const extent = (o: ClusterLabelCircle | Bounds): Bounds =>
    "r" in o
      ? {x: o.x - o.r, y: o.y - o.r, width: o.r * 2, height: o.r * 2}
      : o;
  const add = (o: ClusterLabelCircle | Bounds) => {
    const b = extent(o);
    if (![b.x, b.y, b.width, b.height].every(Number.isFinite)) return;
    each(b, key => {
      const list = buckets.get(key);
      if (list) list.push(o);
      else buckets.set(key, [o]);
    });
  };
  circles.forEach(add);
  boxes.forEach(add);
  const hits = (box: Bounds): boolean => {
    let hit = false;
    each(box, key => {
      if (hit) return;
      for (const o of buckets.get(key) ?? []) {
        if ("r" in o ? boxHitsCircle(box, o) : boxesOverlap(box, o)) {
          hit = true;
          return;
        }
      }
    });
    return hit;
  };
  return {hits, add};
}

/**
    The nearest of `points` to a position, found ring by ring through a grid
    of `cell`-pixel buckets, or undefined when there are none.
*/
export function nearestPoint<T extends {x: number; y: number}>(
  points: readonly T[],
  cell = 32,
): (x: number, y: number) => T | undefined {
  const buckets = new Map<string, T[]>();
  let ix0 = Infinity,
    ix1 = -Infinity,
    iy0 = Infinity,
    iy1 = -Infinity;
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const i = Math.floor(p.x / cell);
    const j = Math.floor(p.y / cell);
    [ix0, ix1, iy0, iy1] = [
      Math.min(ix0, i),
      Math.max(ix1, i),
      Math.min(iy0, j),
      Math.max(iy1, j),
    ];
    const key = `${i},${j}`;
    const list = buckets.get(key);
    if (list) list.push(p);
    else buckets.set(key, [p]);
  }
  return (x, y) => {
    if (!buckets.size) return undefined;
    const ci = Math.floor(x / cell);
    const cj = Math.floor(y / cell);
    const reach = Math.max(
      Math.abs(ci - ix0),
      Math.abs(ci - ix1),
      Math.abs(cj - iy0),
      Math.abs(cj - iy1),
    );
    let best: T | undefined;
    let bestD = Infinity;
    for (let k = 0; k <= reach; k++) {
      // Every point in ring k is at least (k - 1) cells away.
      if (best && (k - 1) * cell > Math.sqrt(bestD)) break;
      for (let i = ci - k; i <= ci + k; i++)
        for (let j = cj - k; j <= cj + k; j++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== k) continue;
          for (const p of buckets.get(`${i},${j}`) ?? []) {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (d < bestD) [best, bestD] = [p, d];
          }
        }
    }
    return best;
  };
}

/** Grid points inside each hull, nearest its target first (see `hullSpots`). */
const spotCache = new WeakMap<
  readonly Point[],
  {key: string; spots: Point[]}
>();

/**
    Points on a grid at most `step` pixels apart (no more than 120 a side)
    inside the convex `hull`, nearest `target` first. Kept per hull, so each
    font size a name tries reuses them.
*/
function hullSpots(hull: readonly Point[], target: Point, step: number) {
  const key = `${target}|${step}`;
  const cached = spotCache.get(hull);
  if (cached?.key === key) return cached.spots;
  const xs = hull.map(p => p[0]);
  const ys = hull.map(p => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const nx = Math.min(120, Math.ceil((x1 - x0) / step) + 1);
  const ny = Math.min(120, Math.ceil((y1 - y0) / step) + 1);
  const spots: Point[] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const p: Point = [
        x0 + (nx > 1 ? ((x1 - x0) * i) / (nx - 1) : 0),
        y0 + (ny > 1 ? ((y1 - y0) * j) / (ny - 1) : 0),
      ];
      if (polygonContains(hull as Point[], p)) spots.push(p);
    }
  const away = ([x, y]: Point) => (x - target[0]) ** 2 + (y - target[1]) ** 2;
  spots.sort((a, b) => away(a) - away(b));
  spotCache.set(hull, {key, spots});
  return spots;
}

/**
    The spot for a `width` × `height` box inside the convex `hull` whose
    middle is nearest `target`, among a grid of middles at most `step`
    pixels apart, where `blocked` is false; or null when there is none.
    `blocked` receives the box grown by `padding`.
*/
export function placeClusterLabel(
  hull: readonly Point[],
  size: {width: number; height: number},
  target: Point,
  blocked: (box: Bounds) => boolean,
  padding = 0,
  step = 4,
): Bounds | null {
  const {width, height} = size;
  const poly = hull as Point[];
  for (const [cx, cy] of hullSpots(hull, target, step)) {
    const x = cx - width / 2;
    const y = cy - height / 2;
    const corners: Point[] = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
    if (!corners.every(c => polygonContains(poly, c))) continue;
    const box = {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
    };
    if (!blocked(box)) return {x, y, width, height};
  }
  return null;
}

/** A laid-out node, as Network's emitter holds it. */
interface ClusterNode {
  id: string;
  x: number;
  y: number;
  r: number;
  shape?: string;
  width?: number;
  height?: number;
}

/** A placed name: its text, font size, and box. */
export interface ClusterLabel {
  key: string;
  text: string;
  fontSize: number;
  box: Bounds;
}

/**
    Where a cluster's name may go: the convex hull around its nodes, grown
    by `margin` past each node's edge, and the members' mean position.
*/
export function clusterRegion(
  members: readonly ClusterLabelCircle[],
  margin: number,
): {hull: Point[]; target: Point} | null {
  const corners = members.flatMap(({x, y, r}): Point[] => {
    const d = r + margin;
    return [
      [x - d, y],
      [x + d, y],
      [x, y - d],
      [x, y + d],
      [x - d * Math.SQRT1_2, y - d * Math.SQRT1_2],
      [x + d * Math.SQRT1_2, y - d * Math.SQRT1_2],
      [x + d * Math.SQRT1_2, y + d * Math.SQRT1_2],
      [x - d * Math.SQRT1_2, y + d * Math.SQRT1_2],
    ];
  });
  const hull = polygonHull(corners);
  if (!hull || members.length < 3) return null;
  return {
    hull,
    target: [
      members.reduce((sum, n) => sum + n.x, 0) / members.length,
      members.reduce((sum, n) => sum + n.y, 0) / members.length,
    ],
  };
}

/** The circles and boxes a cluster name keeps clear of: nodes, and labels beside them. */
function nodeObstacles(
  nodes: readonly ClusterNode[],
  besides: readonly Bounds[],
) {
  const rect = (n: ClusterNode) => n.shape === "Rect";
  return clusterLabelObstacles(
    nodes.filter(n => !rect(n)).map(n => ({x: n.x, y: n.y, r: n.r})),
    nodes
      .filter(rect)
      .map(n => {
        const w = n.width ?? n.r * 2;
        const h = n.height ?? n.r * 2;
        return {x: n.x - w / 2, y: n.y - h / 2, width: w, height: h};
      })
      .concat(besides),
  );
}

/**
    Places each cluster's name (largest cluster first) in its region (see
    `clusterRegion`, grown by `fontMax`), at the open spot nearest its
    middle whose ends and middle all lie nearer one of its own nodes than
    any other node, at the largest font size from `fontMax` down to
    `fontMin` that finds one. A cluster with fewer than three drawn nodes
    goes unnamed.
    @param besides The boxes of node labels drawn beside their nodes.
*/
export function layoutClusterLabels(
  viz: VizInstance,
  nodes: readonly ClusterNode[],
  besides: readonly Bounds[],
): ClusterLabel[] {
  const state = viz.ctx.clusterState as ClusterState | undefined;
  const settings = clusterLabelSettings(viz);
  if (!state?.active || !settings || !(settings.fontMax > 0)) return [];
  const drawn = nodes.filter(n => Number.isFinite(n.x) && Number.isFinite(n.y));
  const byId = new Map(drawn.map(n => [n.id, n]));
  const obstacles = nodeObstacles(drawn, besides);
  const nearest = nearestPoint(drawn);
  const {padding, fontMax, fontMin} = settings;
  const font = (size: number) => ({
    family: settings.text.fontFamily as string | string[] | undefined,
    size,
    weight: (settings.text.fontWeight as string | number | undefined) ?? 600,
  });
  const out: ClusterLabel[] = [];
  for (const cluster of state.clusters) {
    const own = new Set(cluster.ids);
    const members = cluster.ids.flatMap(id => byId.get(id) ?? []);
    const region = clusterRegion(members, fontMax);
    if (!region) continue;
    const ownsAll = (b: Bounds) =>
      [b.x + padding, b.x + b.width / 2, b.x + b.width - padding].every(x =>
        own.has(nearest(x, b.y + b.height / 2)?.id ?? ""),
      );
    const blocked = (b: Bounds) => obstacles.hits(b) || !ownsAll(b);
    for (let size = fontMax; size >= fontMin; size--) {
      const box = placeClusterLabel(
        region.hull,
        measureLabel(cluster.name, font(size)),
        region.target,
        blocked,
        padding,
      );
      if (!box) continue;
      const text = cluster.name;
      out.push({
        key: `network-cluster-label-${cluster.index}`,
        text,
        fontSize: size,
        box,
      });
      obstacles.add({
        x: box.x - padding,
        y: box.y - padding,
        width: box.width + padding * 2,
        height: box.height + padding * 2,
      });
      break;
    }
  }
  return out;
}

/** The placed names as text nodes, inert, in the chart's ink over a halo of its background. */
export function emitClusterLabels(
  viz: VizInstance,
  labels: readonly ClusterLabel[],
): SceneNode[] {
  const settings = clusterLabelSettings(viz);
  if (!labels.length || !settings) return [];
  const byId = new Map(labels.map(l => [`${l.key}_0`, l]));
  const sizeOf = (rec: DataPoint) => byId.get(`${rec.id}`)?.fontSize ?? 10;
  const nodes = emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => (d as unknown as ClusterLabel).text,
    labelBounds: d => {
      const {width, height} = (d as unknown as ClusterLabel).box;
      return {x: -width / 2, y: -height / 2, width, height};
    },
    x: d => {
      const {box} = d as unknown as ClusterLabel;
      return box.x + box.width / 2;
    },
    y: d => {
      const {box} = d as unknown as ClusterLabel;
      return box.y + box.height / 2;
    },
    aes: constant({}),
    rotate: constant(0),
    id: d => (d as unknown as ClusterLabel).key,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      fontWeight: 600,
      ...settings.text,
      fontResize: false,
      fontSize: sizeOf,
      lineHeight: (rec: DataPoint) => sizeOf(rec) * 1.2,
      padding: 0,
      pointerEvents: "none",
      textAnchor: "middle",
      verticalAlign: "middle",
    },
  }).map(node => {
    const {datum: _datum, ...rest} = node as SceneNode & {datum?: unknown};
    void _datum;
    return {...rest, interactive: false} as SceneNode;
  });
  const largest = Math.max(...labels.map(l => l.fontSize));
  return textHalo(nodes, chartBackground(viz), Math.max(2, largest / 4));
}

/**
    Network's cluster names, as text nodes, and the boxes they cover (which
    link labels keep clear of).
    @param placed Each node's label placement; those beside a node are obstacles.
*/
export function networkClusterLabels(
  viz: VizInstance,
  nodes: readonly ClusterNode[],
  placed: ReadonlyMap<unknown, {position: string; box?: Bounds}>,
): {scene: SceneNode[]; boxes: Bounds[]} {
  const besides = [...placed.values()].flatMap(p =>
    p.position === "outside" && p.box ? [p.box] : [],
  );
  const labels = layoutClusterLabels(viz, nodes, besides);
  return {scene: emitClusterLabels(viz, labels), boxes: labels.map(l => l.box)};
}
