import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";
import type {Scene, SceneNode, TrailCatchup} from "@d3plus/render";

import type {VizInstance} from "./vizTypes.js";

/** Normalize any period value (year number, ms, Date) to milliseconds. */
const ms = (v: unknown): number => Number(date(Number(v)));

/** Keys of the trailed-persist circle/rect marks in a scene. */
function trailKeys(scene: Scene): Set<string | number> {
  const keys = new Set<string | number>();
  const on = (v: unknown): boolean => v === true || (typeof v === "number" && v > 0);
  const visit = (nodes: SceneNode[]): void => {
    for (const n of nodes) {
      if (on(n.trailPersist) && (n.type === "circle" || n.type === "rect")) keys.add(n.key);
      if (n.type === "group") visit((n as {children: SceneNode[]}).children);
    }
  };
  visit(scene.root.children);
  return keys;
}

/**
    On a forward jump that skips periods, compute each persistent-trail mark's
    real pixel position at every skipped period, so the trail can bend through
    them (via the render layer's `commitTrailCatchups`) rather than drawing one
    coarse straight segment.

    Cheap: `trailPersist` forces `axisPersist`, so the x/y scales are fixed across
    periods — a mark's position at period P is just `_xFunc(datum_at_P)` plus a
    data lookup, no re-layout. Returns [] for charts without x/y scales (e.g.
    Geomap) or when the jump skips no period.
*/
export function computeTrailCatchup(
  viz: VizInstance, scene: Scene, prevSeq: number, sequence: number,
): TrailCatchup[] {
  const xFunc = viz._xFunc, yFunc = viz._yFunc, x = viz._x, y = viz._y, id = viz._id;
  const time = viz.schema.time as ((d: DataPoint, i: number) => unknown) | undefined;
  if (!xFunc || !yFunc || !x || !y || !viz._data || !time) return [];

  const keys = trailKeys(scene);
  if (!keys.size) return [];

  // Distinct periods strictly between the last drawn one and the destination.
  const periods = new Set<number>();
  viz._data.forEach((r, i) => periods.add(ms(time(r, i))));
  const skipped = [...periods].filter(p => p > prevSeq && p < sequence).sort((a, b) => a - b);
  if (!skipped.length) return [];

  // Each trailed series' row (and its data index) at each period.
  const rows = new Map<string | number, Map<number, {d: DataPoint; i: number}>>();
  viz._data.forEach((r, i) => {
    const k = id(r, i);
    if (!keys.has(k)) return;
    let m = rows.get(k);
    if (!m) rows.set(k, (m = new Map()));
    m.set(ms(time(r, i)), {d: r, i});
  });

  const px = (val: number | Date | string): DataPoint =>
    (viz._xTime ? date(val as number) : val) as unknown as DataPoint;
  const py = (val: number | Date | string): DataPoint =>
    (viz._yTime ? date(val as number) : val) as unknown as DataPoint;

  return skipped
    .map(seq => ({
      sequence: seq,
      positions: [...keys].flatMap(k => {
        const row = rows.get(k)?.get(seq);
        if (!row) return [];
        return [{key: k, x: xFunc(px(x(row.d, row.i))), y: yFunc(py(y(row.d, row.i)))}];
      }),
    }))
    .filter(cu => cu.positions.length > 0);
}
