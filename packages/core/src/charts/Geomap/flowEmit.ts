/**
    Geomap's links as scene nodes: each link's path (ending inside its
    arrowheads), a wider transparent hit path over the whole path so thin
    links are easy to point at, its arrowheads, and its label. The links sit above the topojson shapes and below the coordinate
    points, so a link runs into the point at its end and the points stay on
    top to hover.
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {interpolateRgb} from "d3-interpolate";

import {chordArrowNodes, polylineArrowEdge} from "../features/curvedArrows.js";
import {edgeArrowTrims} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {linkColorResolver} from "../features/linkColor.js";
import {linkAriaLabel, linkHitPath} from "../features/linkInteraction.js";
import {emitLinkLabels} from "../features/linkLabels.js";
import type {LabelCircle} from "../features/circleLabelPlacement.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {pathRuns, polylineMidpoint} from "./flowGeometry.js";
import type {Point} from "./flowGeometry.js";
import type {FlowLink} from "./flowLinks.js";

/** A link's scene key. */
export const flowLinkKey = (link: FlowLink): string =>
  `geomap-link-${link.source.id}-${link.target.id}-${link.index}`;

/**
    The color of links `linkColor` doesn't color: halfway between the
    chart's background and its text color, a gray that reads over both the
    land and the water of a light or dark map.
*/
export function flowLinkGray(viz: VizInstance): string {
  return interpolateRgb(chartBackground(viz), backgroundInk(viz))(0.5);
}

/** The link's paint: `linkColor` (else `flowLinkGray`) at its width. */
function flowLinkPaint(
  viz: VizInstance,
  link: FlowLink,
  color: ReturnType<typeof linkColorResolver>,
  gray: string,
): Paint {
  return {
    fill: "none",
    stroke: color(link.datum, link) ?? gray,
    strokeWidth: link.size,
    strokeOpacity: 0.85,
    strokeLinecap: "round",
  };
}

/** Whether the run starts (within a pixel) at `at`. */
const startsAt = (run: Point[] | undefined, at: Point | null): boolean =>
  !!run && !!at && Math.hypot(run[0][0] - at[0], run[0][1] - at[1]) <= 1;

/**
    A link's visible stroke and its arrowheads. Each head's tip sits on the
    path, clear of the point at its end, and is aimed along the chord from
    its base (`size` further back along the path) to its tip; the stroke
    follows the path to each base, then runs straight along that chord to
    end inside the head (see `polylineArrowEdge`). A head goes only on an
    end the projection draws.
*/
export function flowArrowEdge(
  viz: VizInstance,
  link: FlowLink,
  fill: string | undefined,
): {d: string; arrows: SceneNode[]} {
  const trims = edgeArrowTrims({
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize: viz.schema.arrowSize,
    strokeWidth: link.size,
    datum: link.datum,
    i: link.index,
  });
  if (!trims.ends.source && !trims.ends.target) return {d: link.d, arrows: []};
  const runs = pathRuns(link.d);
  const last = runs[runs.length - 1];
  const inset = (r: number) => (r ? r + 1 : 0);
  // The first run leaves the source and the last reaches the target, when
  // the projection draws them.
  const ends = {
    source: trims.ends.source && startsAt(runs[0], link.sourceAt),
    target:
      trims.ends.target &&
      startsAt(last ? [...last].reverse() : undefined, link.targetAt),
  };
  const {d, source, target} = polylineArrowEdge(
    runs,
    {...trims, ends},
    {source: inset(link.source.r), target: inset(link.target.r)},
  );
  return {
    d,
    arrows: chordArrowNodes({
      ends: {source, target},
      size: trims.size,
      datum: link.datum,
      keyPrefix: `${flowLinkKey(link)}-arrow`,
      fill,
    }),
  };
}

/** The links, their hit paths, and their arrowheads, in that order. */
export function emitFlowLinks(
  viz: VizInstance,
  links: FlowLink[],
): SceneNode[] {
  if (!links.length) return [];
  const color = linkColorResolver(viz);
  const gray = flowLinkGray(viz);
  const paths: SceneNode[] = [];
  const hits: SceneNode[] = [];
  const arrows: SceneNode[] = [];
  // Widest first, so a thin link stays visible over a wide one.
  const order = [...links].sort((a, b) => b.size - a.size || a.index - b.index);
  for (const link of order) {
    const paint = flowLinkPaint(viz, link, color, gray);
    const key = flowLinkKey(link);
    const edge = flowArrowEdge(
      viz,
      link,
      typeof paint.stroke === "string" ? paint.stroke : undefined,
    );
    // A stroke ending inside its head ends square, so no cap pokes past it.
    if (edge.arrows.length) paint.strokeLinecap = "butt";
    paths.push({
      type: "path",
      key,
      d: edge.d,
      datum: link.datum as DataPoint,
      index: link.index,
      paint,
      aria: {label: linkAriaLabel(viz, link.datum)},
    } as SceneNode);
    hits.push(linkHitPath(key, link.d, link.datum, link.size) as SceneNode);
    arrows.push(...edge.arrows);
  }
  return [...paths, ...hits, ...arrows];
}

/** The link labels, at the middle of each link, clear of the points. */
export function emitFlowLabels(
  viz: VizInstance,
  links: FlowLink[],
  circles: LabelCircle[],
): SceneNode[] {
  return emitLinkLabels(
    viz,
    links.map((link, i) => ({
      key: flowLinkKey(link),
      link: link.datum,
      i,
      anchor: link.points ? polylineMidpoint(link.points) : null,
      priority: link.size,
    })),
    {circles},
  );
}
