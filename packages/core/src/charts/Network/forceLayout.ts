/**
    Network's precomputed force layout: where the nodes go when the data
    gives them no `x`/`y`. A force simulation settles the nodes by position,
    then the layout is turned so the largest rectangle that fits in its hull
    lies level.

    @module
*/

import {extent} from "d3-array";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type {SimulationLinkDatum, SimulationNodeDatum} from "d3-force";
import {polygonHull} from "d3-polygon";
import {scaleLinear} from "d3-scale";

import {largestRect, pointRotate} from "@d3plus/math";

/** A node the layout places, writing its `fx`/`fy`. */
export interface ForceLayoutNode extends SimulationNodeDatum {
  id: string;
}

/** A link between two of the layout's nodes, and its size (heavier links pull harder). */
export interface ForceLayoutLink {
  source: ForceLayoutNode;
  target: ForceLayoutNode;
  size?: number;
}

/** A simulated link: its ends, rest length, and stiffness. */
interface SimLink extends SimulationLinkDatum<ForceLayoutNode> {
  distance: number;
  strength: number;
}

/** The length the heaviest links settle near, in the layout's own units. */
const LINK_DISTANCE = 30;
/** The share of `LINK_DISTANCE` every node keeps clear around itself. */
const COLLIDE_SHARE = 0.12;
/** The pull toward the middle that holds separate groups of nodes together. */
const CENTER_STRENGTH = 0.05;
/** How hard every node pushes the others off, relative to `LINK_DISTANCE`. */
const CHARGE_SHARE = 2;

/**
    The ticks the simulation runs from its start until it cools: 300, or
    fewer (down to 100) for a network so large each tick costs more.
    @param count The number of nodes.
*/
export function forceLayoutTicks(count: number): number {
  return Math.round(Math.max(100, Math.min(300, 150000 / Math.max(1, count))));
}

/** A rotation (in degrees) about a center point. */
export interface LayoutRotation {
  angle: number;
  cx: number;
  cy: number;
}

/**
    The turn that lays `points` level: two points side by side, and more so
    that the largest rectangle inside their hull is level. Points the hull
    can't hold a rectangle in (all on one line, say) aren't turned.
    @param points The laid-out positions.
*/
export function layoutRotation(points: [number, number][]): LayoutRotation {
  const none = {angle: 0, cx: 0, cy: 0};
  if (points.length === 2) {
    const [[x0, y0], [x1, y1]] = points;
    if (x0 === x1 && y0 === y1) return none;
    return {
      angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
    };
  }
  if (points.length < 3) return none;
  const hull = polygonHull(points);
  const rect = hull && hull.length > 2 ? largestRect(hull) : null;
  if (!rect || !Number.isFinite(rect.angle)) return none;
  return {angle: rect.angle, cx: rect.cx, cy: rect.cy};
}

/**
    Lays `nodes` out by a force simulation, writing each one's `fx`/`fy`:
    links pull their ends together (heavier links, by `size`, shorter and
    harder), every node pushes the others off and keeps clear of them, and
    a weak pull toward the middle keeps unlinked groups close.
    Then the layout is turned level (see `layoutRotation`). The result
    depends only on the nodes' order and the links.
    @param nodes The nodes.
    @param links The links between them.
*/
export function forceLayout(
  nodes: ForceLayoutNode[],
  links: ForceLayoutLink[],
): void {
  // How hard each link pulls, from 0 (the lightest) to 1 (the heaviest).
  const sizes = extent(links, l => l.size);
  const pull =
    sizes[0] === undefined || sizes[0] === sizes[1]
      ? () => 1
      : scaleLinear()
          .domain(sizes as [number, number])
          .range([0, 1])
          .clamp(true);
  const degree = new Map<ForceLayoutNode, number>();
  for (const l of links)
    for (const n of [l.source, l.target])
      degree.set(n, (degree.get(n) ?? 0) + 1);

  // Fresh copies, so the simulation's own fields stay off the nodes and links.
  const simNodes: ForceLayoutNode[] = nodes.map(n => ({id: n.id}));
  const byNode = new Map(nodes.map((n, i) => [n, simNodes[i]]));
  const simLinks: SimLink[] = links.map(l => {
    const p = pull(l.size ?? 0);
    return {
      source: byNode.get(l.source)!,
      target: byNode.get(l.target)!,
      // The lightest links settle half again as long, and pull half as hard.
      distance: LINK_DISTANCE * (1.5 - p / 2),
      // d3-force's default strength: weaker on links to busier nodes.
      strength:
        (0.5 + p / 2) /
        Math.min(degree.get(l.source) ?? 1, degree.get(l.target) ?? 1),
    };
  });
  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink<ForceLayoutNode, SimLink>(simLinks)
        .distance(l => l.distance)
        .strength(l => l.strength),
    )
    .force("charge", forceManyBody().strength(-LINK_DISTANCE * CHARGE_SHARE))
    .force("collide", forceCollide(LINK_DISTANCE * COLLIDE_SHARE))
    .force("x", forceX(0).strength(CENTER_STRENGTH))
    .force("y", forceY(0).strength(CENTER_STRENGTH))
    .stop();
  const ticks = forceLayoutTicks(nodes.length);
  simulation.alphaDecay(1 - Math.pow(simulation.alphaMin(), 1 / ticks));
  simulation.tick(ticks);

  const points = simNodes.map(n => [n.x ?? 0, n.y ?? 0] as [number, number]);
  const {angle, cx, cy} = layoutRotation(points);
  nodes.forEach((n, i) => {
    const [x, y] = pointRotate(points[i], (-angle * Math.PI) / 180, [cx, cy]);
    n.fx = x;
    n.fy = y;
  });
}
