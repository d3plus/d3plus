/**
    Pure math for Waffle's `layout: "arc"` (and Parliament): units placed on
    concentric rings across a sweep (a half circle by default), each ring
    holding seats in proportion to its radius, and every seat ordered by its
    angle, so categories fill the arc as wedges from one end to the other.
    Radii are fractions of the outer radius; angles are radians, 0 at 12
    o'clock and increasing clockwise (see `Pie/arcFit.ts`).

    @module
*/

import {largestRemainder} from "./waffleLayout.js";

/** The most rings an arc gets. */
export const MAX_ARC_RINGS = 100;

/** One seat on the arc. */
export interface ArcSeat {
  /** Its ring, from 0 innermost. */
  ring: number;
  /** Its place on its ring, from the sweep's start. */
  index: number;
  /** Its angle, in radians. */
  angle: number;
  /** Its ring's radius, as a fraction of the outer radius. */
  radius: number;
}

const finitePositive = (v: number): number =>
  Number.isFinite(v) && v > 0 ? v : 0;

/** The clamped inner radius fraction: from 0 up to just short of the outer radius. */
const innerFraction = (inner: number): number =>
  Math.max(0, Math.min(0.9, Number.isFinite(inner) ? inner : 0));

/**
    The radii of `rings` rings filling the band from `inner` to 1 (fractions
    of the outer radius): each ring's centerline, the band split evenly.
*/
export function arcRingRadii(rings: number, inner: number): number[] {
  const n = Math.max(1, Math.round(finitePositive(rings)) || 1);
  const r0 = innerFraction(inner);
  const w = (1 - r0) / n;
  return Array.from({length: n}, (_, i) => r0 + w * (i + 0.5));
}

/**
    How many seats fit on `rings` rings across `sweep` radians, each seat
    as wide along its ring as the rings are apart.
*/
export function arcCapacity(
  rings: number,
  inner: number,
  sweep: number,
): number {
  const radii = arcRingRadii(rings, inner);
  const w = (1 - innerFraction(inner)) / radii.length;
  return radii.reduce(
    (sum, r) => sum + Math.max(1, Math.floor((Math.abs(sweep) * r) / w)),
    0,
  );
}

/**
    The ring count for `count` seats: the fewest rings whose seats, spaced
    as far apart along each ring as the rings are apart, hold them all.
*/
export function arcRingCount(
  count: number,
  inner: number,
  sweep: number,
): number {
  const n = Math.max(0, Math.round(finitePositive(count)));
  if (!n) return 1;
  let rings = 1;
  while (
    rings < Math.min(n, MAX_ARC_RINGS) &&
    arcCapacity(rings, inner, sweep) < n
  )
    rings++;
  return rings;
}

/**
    The seats on each ring, innermost first: `count` seats shared in
    proportion to each ring's radius (by largest remainder), so every ring
    spaces its seats alike.
*/
export function arcRingSeats(
  count: number,
  rings: number,
  inner: number,
): number[] {
  const radii = arcRingRadii(rings, inner);
  return largestRemainder(
    radii,
    Math.max(0, Math.round(finitePositive(count))),
  );
}

/**
    Every seat's ring, angle and radius, in fill order: by angle from the
    sweep's start (ties go to the inner ring), as the standard parliament
    layout fills them. Each ring spaces its seats evenly across the sweep,
    half a step in from either end.
    @param seats The seats on each ring, innermost first.
    @param inner The inner radius, as a fraction of the outer.
    @param start The sweep's start angle.
    @param end The sweep's end angle.
*/
export function arcSeats(
  seats: number[],
  inner: number,
  start: number,
  end: number,
): ArcSeat[] {
  const radii = arcRingRadii(seats.length, inner);
  const span = end - start;
  const out: ArcSeat[] = [];
  seats.forEach((n, ring) => {
    for (let index = 0; index < n; index++)
      out.push({
        ring,
        index,
        angle: start + (span * (index + 0.5)) / n,
        radius: radii[ring],
      });
  });
  const dir = span < 0 ? -1 : 1;
  return out.sort((a, b) => dir * (a.angle - b.angle) || a.ring - b.ring);
}

/**
    A seat's diameter in pixels at outer radius `radius`: the smaller of the
    gap between rings and the gap between neighbors on the most crowded
    ring, less `padding` (kept to at most 40% of that pitch).
    @param seats The seats on each ring, innermost first.
    @param inner The inner radius, as a fraction of the outer.
    @param sweep The sweep's size, in radians.
    @param radius The outer radius, in pixels.
    @param padding The gap between neighboring seats, in pixels.
*/
export function arcSeatSize(
  seats: number[],
  inner: number,
  sweep: number,
  radius: number,
  padding: number,
): number {
  const radii = arcRingRadii(seats.length, inner);
  const ring = ((1 - innerFraction(inner)) / radii.length) * radius;
  let pitch = ring;
  radii.forEach((r, i) => {
    if (seats[i] > 0)
      pitch = Math.min(pitch, (Math.abs(sweep) * r * radius) / seats[i]);
  });
  const pad = Math.min(finitePositive(padding), pitch * 0.4);
  return Math.max(0, pitch - pad);
}

/** A seat's center, in pixels around the arc's center. */
export function arcSeatPoint(
  seat: Pick<ArcSeat, "angle" | "radius">,
  radius: number,
): [number, number] {
  const r = seat.radius * radius;
  return [r * Math.sin(seat.angle), -r * Math.cos(seat.angle)];
}

/**
    The seats a majority needs: `true` for more than half of `total`, a
    number for that many seats, else none (0).
*/
export function majoritySeats(setting: unknown, total: number): number {
  const n = Math.max(0, Math.round(finitePositive(total)));
  if (setting === true) return n ? Math.floor(n / 2) + 1 : 0;
  if (typeof setting === "number" && Number.isFinite(setting) && setting > 0)
    return Math.min(n, Math.round(setting));
  return 0;
}

/**
    The angle a majority line marks: between the seats before the last one
    a majority needs and that seat, in fill order, so a block of seats from
    the start that reaches past the line holds a majority (for more than
    half of an even house, the line halves the arc).
    @param seats The seats, in fill order (see `arcSeats`).
    @param majority The seats a majority needs.
*/
export function majorityAngle(
  seats: Pick<ArcSeat, "angle">[],
  majority: number,
): number | null {
  if (!majority || majority > seats.length) return null;
  const at = seats[majority - 1].angle;
  const before = seats[majority - 2]?.angle;
  return before === undefined ? at : (before + at) / 2;
}
