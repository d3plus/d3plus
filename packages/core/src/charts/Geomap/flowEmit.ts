/**
    Geomap's links as scene nodes: each link's path, a wider transparent hit
    path over it so thin links are easy to point at, its arrowheads, and its
    label. The links sit above the topojson shapes and below the coordinate
    points, so a link runs into the point at its end and the points stay on
    top to hover.
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {interpolateRgb} from "d3-interpolate";

import {arrowEnds, arrowNode, arrowSizeFor} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {linkColorResolver} from "../features/linkColor.js";
import {linkAriaLabel, linkHitPath} from "../features/linkInteraction.js";
import {emitLinkLabels} from "../features/linkLabels.js";
import type {LabelCircle} from "../features/circleLabelPlacement.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {polylineEndTip, polylineMidpoint} from "./flowGeometry.js";
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

/** Arrowheads at a link's selected ends, each pointing into its end's mark. */
function flowArrows(
  viz: VizInstance,
  link: FlowLink,
  fill: string | undefined,
): SceneNode[] {
  const datum = link.datum;
  const ends = arrowEnds(viz.schema.arrows as ArrowValue, datum, link.index);
  if (!ends.source && !ends.target) return [];
  const size = arrowSizeFor(viz.schema.arrowSize, datum, link.index, link.size);
  const out: SceneNode[] = [];
  for (const end of ["target", "source"] as const) {
    const run = end === "target" ? link.targetRun : link.sourceRun;
    if (!ends[end] || !run) continue;
    const r = link[end].r;
    const tip = polylineEndTip(run, end, r ? r + 1 : 0);
    out.push(
      arrowNode({
        key: `${flowLinkKey(link)}-arrow-${end === "target" ? "t" : "s"}`,
        datum,
        x: tip.x,
        y: tip.y,
        angle: tip.angle,
        size,
        fill,
      }),
    );
  }
  return out;
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
    paths.push({
      type: "path",
      key,
      d: link.d,
      datum: link.datum as DataPoint,
      index: link.index,
      paint,
      aria: {label: linkAriaLabel(viz, link.datum)},
    } as SceneNode);
    hits.push(linkHitPath(key, link.d, link.datum, link.size) as SceneNode);
    arrows.push(
      ...flowArrows(
        viz,
        link,
        typeof paint.stroke === "string" ? paint.stroke : undefined,
      ),
    );
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
