/**
    The regions of a laid-out Venn diagram: where each region's label goes
    (the point deepest inside the part of the region no smaller region
    covers) and how many items fall only in it.
*/

import {distance, intersection} from "./circles.js";
import type {VennCircle} from "./circles.js";
import {areaKey} from "./vennLayout.js";
import type {VennArea, VennCircles} from "./vennLayout.js";
import {nelderMead} from "./nelderMead.js";

/** A label spot: where, and how far it is from the nearest edge of its region. */
export interface VennLabelSpot {
  x: number;
  y: number;
  /** The radius of the largest circle around the spot inside its region; 0 or less when the region has no room of its own. */
  margin: number;
}

/**
    How far `point` is from the nearest edge of the region inside every
    `inside` circle and outside every `outside` circle: positive inside the
    region, negative outside it.
*/
export function regionMargin(
  point: {x: number; y: number},
  inside: VennCircle[],
  outside: VennCircle[],
): number {
  let margin = Infinity;
  for (const c of inside)
    margin = Math.min(margin, c.radius - distance(c, point));
  for (const c of outside)
    margin = Math.min(margin, distance(c, point) - c.radius);
  return margin;
}

/**
    The point deepest inside the region within every `inside` circle and
    outside every `outside` circle, with its margin. When that region is
    empty, the deepest point of the circles' shared area instead, with a
    margin of 0.
*/
export function vennLabelSpot(
  inside: VennCircle[],
  outside: VennCircle[],
): VennLabelSpot {
  const starts: {x: number; y: number}[] = [];
  for (const c of inside)
    starts.push(
      {x: c.x, y: c.y},
      {x: c.x + c.radius / 2, y: c.y},
      {x: c.x - c.radius / 2, y: c.y},
      {x: c.x, y: c.y + c.radius / 2},
      {x: c.x, y: c.y - c.radius / 2},
    );
  for (const arc of intersection(inside).arcs) starts.push(arc.p1);
  let start = starts[0];
  let best = -Infinity;
  for (const p of starts) {
    const m = regionMargin(p, inside, outside);
    if (m >= best) {
      best = m;
      start = p;
    }
  }
  const {x} = nelderMead(
    p => -regionMargin({x: p[0], y: p[1]}, inside, outside),
    [start.x, start.y],
    {maxIterations: 500, minErrorDelta: 1e-10},
  );
  const margin = regionMargin({x: x[0], y: x[1]}, inside, outside);
  if (margin > 0) return {x: x[0], y: x[1], margin};
  if (outside.length) return {...vennLabelSpot(inside, []), margin: 0};
  return {x: x[0], y: x[1], margin: 0};
}

/**
    The circles a region's label must stay out of: every circle not among
    the region's own sets, except those that wholly contain one of them
    (a region inside another set can't be outside it).
*/
export function outsideCircles(
  sets: string[],
  circles: VennCircles,
): VennCircle[] {
  const own = sets.map(s => circles[s]).filter(Boolean);
  return Object.entries(circles)
    .filter(([s]) => !sets.includes(s))
    .map(([, c]) => c)
    .filter(c => !own.some(o => distance(o, c) + o.radius <= c.radius + 1e-10));
}

/**
    How many items fall in each region and in none of the smaller regions
    inside it, by inclusion and exclusion over the regions given: a set's
    size, less its pairs, plus its triples, and so on. Regions not given
    count as empty, and a negative result (sizes that don't add up) as 0.
    Keyed by `areaKey`.
*/
export function exclusiveSizes(areas: VennArea[]): Map<string, number> {
  const out = new Map<string, number>();
  const sized = areas.map(a => ({set: new Set(a.sets), size: a.size}));
  for (const a of areas) {
    let total = 0;
    for (const b of sized) {
      if (b.set.size < a.sets.length || !a.sets.every(s => b.set.has(s)))
        continue;
      const sign = (b.set.size - a.sets.length) % 2 ? -1 : 1;
      total += sign * (Number.isFinite(b.size) ? b.size : 0);
    }
    out.set(areaKey(a.sets), Math.max(0, total));
  }
  return out;
}

/**
    The sets a region lies wholly inside: its own, and every set whose
    circle holds one of its circles. Sorted, so regions covering the same
    area list the same sets.
*/
export function enclosingSets(sets: string[], circles: VennCircles): string[] {
  const own = sets.map(s => circles[s]).filter(Boolean);
  return Object.keys(circles)
    .filter(
      s =>
        sets.includes(s) ||
        own.some(
          o => distance(o, circles[s]) + o.radius <= circles[s].radius + 1e-10,
        ),
    )
    .sort();
}

/**
    Groups the regions that cover the same area (a set inside another
    covers the same area as its overlap with it), each group in the order
    given. The last region in a group with the most sets draws on top.
*/
export function sameAreaGroups<T extends {sets: string[]}>(
  regions: T[],
  circles: VennCircles,
): T[][] {
  const groups = new Map<string, T[]>();
  for (const r of regions) {
    const key = areaKey(enclosingSets(r.sets, circles));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return [...groups.values()];
}
