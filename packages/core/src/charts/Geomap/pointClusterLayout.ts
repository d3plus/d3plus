/**
    Geomap's `pointCluster`: when coordinate points overlap, the points
    near one another on screen draw as one bubble, which splits as the map
    zooms in (see `pointCluster.ts` for the clustering). This module
    resolves the option, builds a draw's clusters, and makes the rows
    clusters are drawn, hovered, and described with.

    @module
*/

import {scaleSqrt} from "d3-scale";

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {memberName} from "../features/thresholdMembers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {geoHexbinSettings} from "./geoHexbin.js";
import {regionsReshaped} from "./tileGrid.js";
import {toLonLat} from "./flowGeometry.js";
import {
  buildClusterLevels,
  clusterBounds,
  clusterLevelAt,
  clusterSplitK,
  pointsOverlap,
} from "./pointCluster.js";
import type {ClusterLeaf, ClusterLevel, ClusterNode} from "./pointCluster.js";
import type {ClusterDraw} from "./pointClusterEmit.js";

/** The `pointCluster` option. */
export interface PointClusterConfig {
  /** How near points draw as one, in pixels on screen. */
  radius?: number;
}

/** `pointCluster`, resolved for a draw. */
export interface PointClusterSettings {
  radius: number;
}

/** The default cluster radius, in pixels. */
export const CLUSTER_RADIUS = 40;

/** The smallest cluster bubble's radius, in pixels. */
export const CLUSTER_R_MIN = 12;

/** The largest cluster bubble's radius, as a share of the cluster radius. */
export const CLUSTER_R_SHARE = 0.6;

/** How many of its points a cluster's tooltip lists. */
export const CLUSTER_MEMBER_LIMIT = 5;

/** The key a cluster row keeps what it stands for under. */
export const GEO_CLUSTER = "__d3plusGeoCluster";

/** What a cluster row carries. */
export interface GeoClusterMeta {
  /** The node it draws: its id names it across levels. */
  id: number;
  /** How many points it holds. */
  count: number;
  /** Its points' summed `pointSize`, which sizes its bubble. */
  weight: number;
  /** Its points' rows, in data order. */
  rows: DataPoint[];
  /** Its center, in unzoomed pixels. */
  x: number;
  y: number;
  /** The box around its points, in unzoomed pixels. */
  bounds: [[number, number], [number, number]];
  /** The zoom scale it splits at, or `Infinity` when its points never part. */
  splitK: number;
}

/** A draw's clusters, and the zoom they're drawn at. */
export interface GeoClusterState {
  settings: PointClusterSettings;
  /** The clustered points' rows, in data order. */
  rows: DataPoint[];
  /** The points, in unzoomed pixels. */
  leaves: ClusterLeaf[];
  levels: ClusterLevel[];
  /** A cluster bubble's radius in pixels, from its weight. */
  bubble: (weight: number) => number;
  /** Whether the points' `pointSize` values differ. */
  sized: boolean;
  /** The level drawn. */
  level: number;
  /** The zoom scale drawn. */
  k: number;
  /** The id of the cluster fanned out, if one is. */
  spider: number | null;
  /** Each point's fill, read when first drawn. */
  fills?: string[];
  /** Each node's row, so a node keeps one row while it's drawn. */
  datums: WeakMap<ClusterNode, DataPoint>;
  /** The clusters as last drawn, which the next change animates from. */
  drawn?: ClusterDraw;
  /** A pending repaint that drops the points that merged into a cluster. */
  timer?: ReturnType<typeof setTimeout>;
}

/**
    `pointCluster`, resolved: on (`true`, the default, or an object setting
    the `radius`) unless set `false`, or `hexbin`, a `cartogram`, or a
    `tileGrid` leaves the points out.
*/
export function pointClusterSettings(
  viz: VizInstance,
): PointClusterSettings | null {
  const option = viz.schema.pointCluster as
    PointClusterConfig | boolean | undefined;
  if (option === false || geoHexbinSettings(viz) || regionsReshaped(viz))
    return null;
  const radius =
    option && typeof option === "object" ? Number(option.radius) : NaN;
  return {radius: radius > 0 ? radius : CLUSTER_RADIUS};
}

/**
    The radius of a cluster's bubble from its weight: on a square-root
    scale from the lightest cluster at any zoom to the heaviest, onto
    `CLUSTER_R_MIN` up to `CLUSTER_R_SHARE` of the cluster radius.
    @param levels The levels.
    @param radius The cluster radius.
*/
export function clusterBubbleScale(
  levels: ClusterLevel[],
  radius: number,
): (weight: number) => number {
  let lo = Infinity,
    hi = -Infinity;
  for (const level of levels)
    for (const node of level.nodes)
      if (node.leaves.length > 1) {
        if (node.weight < lo) lo = node.weight;
        if (node.weight > hi) hi = node.weight;
      }
  const top = Math.max(CLUSTER_R_MIN, radius * CLUSTER_R_SHARE);
  if (!(hi > lo)) return () => CLUSTER_R_MIN;
  const scale = scaleSqrt().domain([lo, hi]).range([CLUSTER_R_MIN, top]);
  return weight => scale(Math.max(lo, Math.min(hi, weight)));
}

/**
    The clusters of a draw's points, or null when clustering is off or none
    of the points' circles overlap (see `pointsOverlap`).
    @param viz The Geomap.
    @param rows The points drawn, in data order.
    @param pointR Each point's radius, in pixels.
    @param k The zoom scale the map is drawn at.
*/
export function geomapPointClusters(
  viz: VizInstance,
  rows: DataPoint[],
  pointR: (d: DataPoint, i: number) => number,
  k: number = 1,
): GeoClusterState | null {
  const settings = pointClusterSettings(viz);
  if (!settings || rows.length < 2) return null;
  const projection = viz.schema.projection as (
    c: [number, number],
  ) => [number, number] | null;
  const sizes = rows.map((d, i) => Number(viz.schema.pointSize(d, i)));
  const weights = sizes.map(s => (Number.isFinite(s) && s > 0 ? s : 0));
  const weighed = weights.some(w => w > 0);
  const kept: DataPoint[] = [];
  const leaves: ClusterLeaf[] = [];
  rows.forEach((d, i) => {
    const coord = toLonLat(viz.schema.point(d, i));
    const p = coord ? projection(coord) : null;
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return;
    const r = pointR(d, i);
    kept.push(d);
    leaves.push({
      x: p[0],
      y: p[1],
      r: Number.isFinite(r) ? r : 0,
      weight: weighed ? weights[i] : 1,
    });
  });
  if (!pointsOverlap(leaves)) return null;
  const levels = buildClusterLevels(leaves, settings.radius);
  const finite = sizes.filter(Number.isFinite);
  return {
    settings,
    rows: kept,
    leaves,
    levels,
    bubble: clusterBubbleScale(levels, settings.radius),
    sized: finite.some(s => s !== finite[0]),
    level: clusterLevelAt(levels, k),
    k,
    spider: null,
    datums: new WeakMap(),
  };
}

/**
    The row a cluster is drawn and hovered with (one per node, kept while
    the node is drawn).
    @param state The clusters.
    @param j The node's level.
    @param node The node.
*/
export function clusterRow(
  state: GeoClusterState,
  j: number,
  node: ClusterNode,
): DataPoint {
  let row = state.datums.get(node);
  if (!row) {
    const meta: GeoClusterMeta = {
      id: node.id,
      count: node.leaves.length,
      weight: node.weight,
      rows: node.leaves.map(i => state.rows[i]),
      x: node.x,
      y: node.y,
      bounds: clusterBounds(state.leaves, node.leaves),
      splitK: clusterSplitK(state.levels, j, node),
    };
    row = {
      id: `geocluster-${node.id}-${node.leaves.length}`,
      [GEO_CLUSTER]: meta as never,
    };
    state.datums.set(node, row);
  }
  return row;
}

/** What a (possibly wrapped) cluster row carries, if it is one. */
export function geoClusterMeta(
  d: DataPoint | undefined,
): GeoClusterMeta | undefined {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d
    ? (d[GEO_CLUSTER] as unknown as GeoClusterMeta | undefined)
    : undefined;
}

const fmt = (viz: VizInstance, n: number): string =>
  Number.isFinite(n) ? formatAbbreviate(n, viz.schema.locale) : "";

/** A cluster's tooltip title and aria label: how many points it holds, such as "12 points". */
export function geoClusterTitle(
  viz: VizInstance,
  d: DataPoint,
): string | undefined {
  const meta = geoClusterMeta(d);
  if (!meta) return undefined;
  return viz.schema.translate("{0} points", undefined, fmt(viz, meta.count));
}

/**
    A cluster's tooltip rows: up to `limit` of its points, the largest
    first when their `pointSize` values differ (each with its value), else
    in data order, then how many more it holds. Empty for any other row.
    @param viz The Geomap.
    @param d The hovered row.
    @param limit How many points to list.
*/
export function geoClusterTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  limit: number = CLUSTER_MEMBER_LIMIT,
): [string, string][] {
  const meta = geoClusterMeta(d);
  const state = viz.ctx.geomapCtx as {cluster?: GeoClusterState} | undefined;
  if (!meta) return [];
  const sized = state?.cluster?.sized ?? false;
  const size = (row: DataPoint) => Number(viz.schema.pointSize(row));
  const listed = meta.rows.map((row, i) => ({row, i}));
  if (sized)
    listed.sort(
      (a, b) =>
        (size(b.row) || -Infinity) - (size(a.row) || -Infinity) || a.i - b.i,
    );
  const rows: [string, string][] = listed
    .slice(0, limit)
    .map(({row, i}) => [
      memberName(`${viz._drawLabel(row, i)}`),
      sized ? fmt(viz, size(row)) : "",
    ]);
  const rest = meta.count - Math.min(limit, meta.count);
  if (rest > 0)
    rows.push([
      memberName(`+${fmt(viz, rest)} ${viz.schema.translate("more")}`),
      "",
    ]);
  return rows;
}
