/**
    Pure geometry for RadialBar's concentric tracks: the ring each row's bar
    runs along, and the room beside each track's start for its label. Angles
    are radians, 0 at 12 o'clock, increasing clockwise.
*/

import {arcExtent, unionBox} from "../Gauge/gaugeGeometry.js";
import type {GaugeBox} from "../Gauge/gaugeGeometry.js";

/** One track's ring. */
export interface RadialBarTrack {
  inner: number;
  outer: number;
}

/**
    Splits the ring between `inner` and `outer` into `count` equal bands, the
    first outermost. Each track fills its band except for `padding` (a share
    of the band) left empty on its inner side.
*/
export function radialBarTracks(
  count: number,
  inner: number,
  outer: number,
  padding: number,
): RadialBarTrack[] {
  const n = Math.max(0, Math.floor(count));
  if (!n || !(outer > inner)) return [];
  const band = (outer - inner) / n;
  const pad = Math.max(0, Math.min(0.95, padding));
  return Array.from({length: n}, (_v, k) => {
    const o = outer - k * band;
    return {inner: o - band * (1 - pad), outer: o};
  });
}

/**
    How long a label may run back from a track's start along the tangent,
    for a track centered at radius `mid` in a circle of radius `outer`, when
    the sweep leaves `gapAngle` radians empty before the start. The label
    reaches no further than the circle's own radius and, for a gap under a
    quarter turn, stops short of the tracks' far end; `gap` px stay clear at
    the start.
*/
export function radialBarLabelRoom(
  mid: number,
  outer: number,
  gapAngle: number,
  gap = 0,
): number {
  if (!(mid > 0) || !(outer > 0)) return 0;
  let room = outer;
  if (gapAngle < Math.PI / 2)
    room = Math.min(room, mid * Math.tan(Math.max(0, gapAngle)));
  return Math.max(0, room - gap);
}

/**
    The tracks' footprint in units of the outer radius: the swept arc (with
    the center) plus the strip the track labels run along, `reach` back from
    the start along the tangent.
*/
export function radialBarFootprint(
  start: number,
  end: number,
  reach: number,
): GaugeBox {
  const sx = Math.sin(start);
  const sy = -Math.cos(start);
  const lx = sx - reach * Math.cos(start);
  const ly = sy - reach * Math.sin(start);
  return unionBox(arcExtent(start, end), {
    x0: Math.min(sx, lx),
    x1: Math.max(sx, lx),
    y0: Math.min(sy, ly),
    y1: Math.max(sy, ly),
  });
}
