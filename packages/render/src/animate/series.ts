import {area as d3area, line as d3line} from "d3-shape";

import {curveFor} from "../paths.js";
import type {PathSeries} from "../scene.js";

type Point = [number, number];

/**
    The SVG path a series draws: the line through its `top` points, or the
    area between its `top` and `base` edges, with its curve. A point that
    sits exactly on the one before it (as a point growing out of, or folding
    into, its neighbor does at the ends of a tween) is drawn once, since
    some curves (`monotoneX`) can't run through two points at one place.
    @param series The keyed points.
*/
export function seriesPath(series: PathSeries): string {
  const {base, curve} = series;
  const same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];
  const index = series.top
    .map((_, i) => i)
    .filter(
      i =>
        !i ||
        !same(series.top[i], series.top[i - 1]) ||
        (base !== undefined && !same(base[i], base[i - 1])),
    );
  const top = index.map(i => series.top[i]);
  if (!base)
    return (
      d3line<Point>()
        .curve(curveFor(curve))
        .x(p => p[0])
        .y(p => p[1])(top) ?? ""
    );
  return (
    d3area<number>()
      .curve(curveFor(curve))
      .x0(i => base[i][0])
      .y0(i => base[i][1])
      .x1(i => series.top[i][0])
      .y1(i => series.top[i][1])(index) ?? ""
  );
}

/** Each key's index, or null when a key repeats. */
function indexByKey(
  keys: PathSeries["keys"],
): Map<string | number, number> | null {
  const index = new Map<string | number, number>();
  for (let i = 0; i < keys.length; i++) {
    if (index.has(keys[i])) return null;
    index.set(keys[i], i);
  }
  return index;
}

/**
    For each position of `keys`, the index of the nearest key at or before
    it (or, with none before it, after it) that `kept` holds, or -1 when no
    key is kept.
*/
function nearestKept(
  keys: PathSeries["keys"],
  kept: Map<string | number, number>,
): number[] {
  const n = keys.length;
  const out = new Array<number>(n).fill(-1);
  let last = -1;
  for (let i = 0; i < n; i++) {
    if (kept.has(keys[i])) last = i;
    out[i] = last;
  }
  let next = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (kept.has(keys[i])) next = i;
    if (out[i] < 0) out[i] = next;
  }
  return out;
}

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/**
    Tweens one series into another by key: a point both hold slides from
    its old place to its new one, a point only `b` holds grows out of where
    its nearest shared neighbor was, and a point only `a` holds folds into
    where its nearest shared neighbor goes. The tween's points keep the
    order both series draw in, a dropped point beside its old neighbors.
    Returns null when the two can't be matched: they share no key, a key
    repeats, their shared keys run in a different order, they draw with
    different curves, or one is an area and the other a line.
    @param a The series to tween from.
    @param b The series to tween to.
*/
export function interpolateSeries(
  a: PathSeries,
  b: PathSeries,
): ((t: number) => PathSeries) | null {
  if ((a.curve ?? "linear") !== (b.curve ?? "linear")) return null;
  if (!a.base !== !b.base) return null;
  const aIndex = indexByKey(a.keys),
    bIndex = indexByKey(b.keys);
  if (!aIndex || !bIndex) return null;

  // Shared keys must run in the same order in both.
  let last = -1,
    shared = 0;
  for (const key of a.keys) {
    const j = bIndex.get(key);
    if (j === undefined) continue;
    if (j < last) return null;
    last = j;
    shared++;
  }
  if (!shared) return null;

  const aNear = nearestKept(a.keys, bIndex),
    bNear = nearestKept(b.keys, aIndex);
  const keys: PathSeries["keys"] = [];
  const from: number[] = [],
    to: number[] = [];
  // Each tween point reads its start from `a` and its end from `b`, by index.
  let i = 0,
    j = 0;
  while (i < a.keys.length || j < b.keys.length) {
    if (i < a.keys.length && !bIndex.has(a.keys[i])) {
      keys.push(a.keys[i]);
      from.push(i);
      to.push(bIndex.get(a.keys[aNear[i]])!);
      i++;
    } else if (j < b.keys.length && !aIndex.has(b.keys[j])) {
      keys.push(b.keys[j]);
      from.push(aIndex.get(b.keys[bNear[j]])!);
      to.push(j);
      j++;
    } else {
      keys.push(b.keys[j]);
      from.push(i);
      to.push(j);
      i++;
      j++;
    }
  }

  const edge =
    (fromPts: Point[], toPts: Point[]) =>
    (t: number): Point[] =>
      from.map((f, k) => lerp(fromPts[f], toPts[to[k]], t));
  const top = edge(a.top, b.top);
  const base = a.base && b.base ? edge(a.base, b.base) : null;
  return t =>
    t >= 1
      ? b
      : {
          keys,
          top: top(t),
          ...(base ? {base: base(t)} : {}),
          curve: b.curve,
        };
}
