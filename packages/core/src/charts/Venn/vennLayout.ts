/**
    Where Venn and Euler diagrams put their circles. The area-proportional
    layout follows venn.js (Ben Frederickson, MIT): each set is a circle of
    area equal to its size; a greedy pass places the circles one by one to
    match their pairwise overlaps, then a Nelder–Mead search moves them to
    minimize the squared error of every region's area. Sets that share
    nothing come apart (an Euler diagram), and a set inside another sits
    inside its circle. The classic layout draws every set as an equal
    circle in a fixed arrangement.
*/

import {
  circleCrossings,
  circleOverlap,
  distance,
  distanceForOverlap,
  intersectionArea,
} from "./circles.js";
import type {VennCircle} from "./circles.js";
import {nelderMead} from "./nelderMead.js";

/** A region's sets and its size: the count of items in every one of the sets. */
export interface VennArea {
  sets: string[];
  size: number;
}

/** A circle per set name. */
export type VennCircles = Record<string, VennCircle>;

/** The key two regions with the same sets share, whatever their order. */
export function areaKey(sets: string[]): string {
  return JSON.stringify(sets.slice().sort());
}

/**
    The areas a layout can use: one per distinct set combination, sets that
    have their own area, sizes that are finite and positive, and no
    intersection larger than its smallest set. Every pair of sets without an
    area of its own is added as sharing nothing, so those circles stay
    apart.
*/
export function layoutAreas(areas: VennArea[]): VennArea[] {
  const sizes = new Map<string, number>();
  for (const a of areas)
    if (a.sets.length === 1 && Number.isFinite(a.size) && a.size > 0)
      sizes.set(a.sets[0], a.size);
  const seen = new Set<string>();
  const out: VennArea[] = [];
  for (const a of areas) {
    const sets = [...new Set(a.sets)];
    const key = areaKey(sets);
    if (!sets.length || seen.has(key) || !sets.every(s => sizes.has(s)))
      continue;
    seen.add(key);
    const cap = Math.min(...sets.map(s => sizes.get(s)!));
    const size = Number.isFinite(a.size) ? Math.max(0, a.size) : 0;
    out.push({sets, size: Math.min(size, cap)});
  }
  const names = [...sizes.keys()];
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++)
      if (!seen.has(areaKey([names[i], names[j]])))
        out.push({sets: [names[i], names[j]], size: 0});
  return out;
}

/** The squared error between the area each region should have and the area its circles share. */
export function vennLoss(circles: VennCircles, areas: VennArea[]): number {
  let loss = 0;
  for (const a of areas) {
    if (a.sets.length < 2) continue;
    const members = a.sets.map(s => circles[s]);
    const overlap =
      members.length === 2
        ? circleOverlap(
            members[0].radius,
            members[1].radius,
            distance(members[0], members[1]),
          )
        : intersectionArea(members);
    loss += (overlap - a.size) ** 2;
  }
  return loss;
}

/** A pair's overlap, as seen from one of its sets. */
interface PairOverlap {
  set: string;
  size: number;
  weight: number;
}

/** Each set's pairwise overlaps, from `areas` (as `layoutAreas` returns them). */
function pairOverlaps(
  areas: VennArea[],
  circles: VennCircles,
): Map<string, PairOverlap[]> {
  const overlaps = new Map<string, PairOverlap[]>();
  for (const s of Object.keys(circles)) overlaps.set(s, []);
  for (const a of areas) {
    if (a.sets.length !== 2) continue;
    const [left, right] = a.sets;
    const smaller = Math.min(
      Math.PI * circles[left].radius ** 2,
      Math.PI * circles[right].radius ** 2,
    );
    // A set wholly inside the other can sit anywhere inside it.
    const weight = a.size + 1e-10 >= smaller ? 0 : 1;
    overlaps.get(left)!.push({set: right, size: a.size, weight});
    overlaps.get(right)!.push({set: left, size: a.size, weight});
  }
  return overlaps;
}

/**
    The spots a set's circle could take: at the right distance from each
    placed set it overlaps, beside it on each side, and where two of those
    distances meet.
*/
function candidateSpots(
  circle: VennCircle,
  placed: PairOverlap[],
  circles: VennCircles,
): {x: number; y: number}[] {
  const spots: {x: number; y: number}[] = [];
  const reach = placed.map(o =>
    distanceForOverlap(circle.radius, circles[o.set].radius, o.size),
  );
  placed.forEach((o, j) => {
    const p = circles[o.set];
    const d = reach[j];
    spots.push(
      {x: p.x + d, y: p.y},
      {x: p.x - d, y: p.y},
      {x: p.x, y: p.y + d},
      {x: p.x, y: p.y - d},
    );
    for (let k = j + 1; k < placed.length; k++) {
      const q = circles[placed[k].set];
      spots.push(
        ...circleCrossings(
          {x: p.x, y: p.y, radius: d},
          {x: q.x, y: q.y, radius: reach[k]},
        ),
      );
    }
  });
  return spots;
}

/**
    A first layout: the set with the most overlap at the origin, then each
    set in turn (most overlap first) at whichever candidate spot fits the
    sets already placed best.
*/
export function greedyLayout(areas: VennArea[]): VennCircles {
  const circles: VennCircles = {};
  for (const a of areas)
    if (a.sets.length === 1)
      circles[a.sets[0]] = {
        x: 1e10,
        y: 1e10,
        radius: Math.sqrt(a.size / Math.PI),
      };
  const pairs = areas.filter(a => a.sets.length === 2);
  const overlaps = pairOverlaps(pairs, circles);
  const order = [...overlaps.entries()]
    .map(([set, list]) => ({
      set,
      size: list.reduce((s, o) => s + o.size * o.weight, 0),
    }))
    .sort((a, b) => b.size - a.size);
  if (!order.length) return circles;
  const placed = new Set<string>([order[0].set]);
  circles[order[0].set].x = 0;
  circles[order[0].set].y = 0;
  for (const {set} of order.slice(1)) {
    const near = overlaps
      .get(set)!
      .filter(o => placed.has(o.set))
      .sort((a, b) => b.size - a.size);
    const circle = circles[set];
    let best = {x: 0, y: 0};
    let bestLoss = Infinity;
    for (const spot of candidateSpots(circle, near, circles)) {
      circle.x = spot.x;
      circle.y = spot.y;
      const loss = vennLoss(circles, pairs);
      if (loss < bestLoss) {
        bestLoss = loss;
        best = spot;
      }
    }
    circle.x = best.x;
    circle.y = best.y;
    placed.add(set);
  }
  return circles;
}

/**
    The area-proportional layout of `areas`: each set a circle of area equal
    to its size, placed so that every region's area comes as close to its
    size as the circles allow. Exact for two sets, close for three, and an
    approximation beyond (not every combination of regions can be drawn
    with circles). In the sizes' own units, centered nowhere in particular;
    see `fitCircles`.
*/
export function proportionalLayout(areas: VennArea[]): VennCircles {
  const valid = layoutAreas(areas);
  const circles = greedyLayout(valid);
  const names = Object.keys(circles);
  if (names.length < 2) return circles;
  const start = names.flatMap(s => [circles[s].x, circles[s].y]);
  const at = (x: number[]): VennCircles => {
    const out: VennCircles = {};
    names.forEach((s, k) => {
      out[s] = {x: x[2 * k], y: x[2 * k + 1], radius: circles[s].radius};
    });
    return out;
  };
  const {x} = nelderMead(p => vennLoss(at(p), valid), start, {
    maxIterations: 500 * names.length,
  });
  return at(x);
}

/**
    The classic circle layout: every set an equal circle of radius 1. One
    set alone, two side by side, three in a triangle (two above, one
    below), and more in a ring around a center they all cover (the chart
    draws four and five sets as ellipses instead; see `vennEllipses.ts`).
*/
export function classicLayout(names: string[]): VennCircles {
  const out: VennCircles = {};
  const n = names.length;
  if (n === 1) out[names[0]] = {x: 0, y: 0, radius: 1};
  else if (n === 2) {
    out[names[0]] = {x: -0.5, y: 0, radius: 1};
    out[names[1]] = {x: 0.5, y: 0, radius: 1};
  } else if (n === 3) {
    const reach = 1 / Math.sqrt(3);
    const angles = [-150, -30, 90].map(a => (a * Math.PI) / 180);
    names.forEach((s, k) => {
      out[s] = {
        x: reach * Math.cos(angles[k]),
        y: reach * Math.sin(angles[k]),
        radius: 1,
      };
    });
  } else
    names.forEach((s, k) => {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
      out[s] = {x: 0.6 * Math.cos(a), y: 0.6 * Math.sin(a), radius: 1};
    });
  return out;
}
