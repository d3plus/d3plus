/**
    Which kind of labels an axis draws: one per category or value read in
    sequence, and how much room each label of an uneven axis has.
*/
import type Axis from "./Axis.js";

/**
    Each label's own share of an axis whose labels sit unevenly, such as one
    label per variable-width bar (see `Plot/barWidth.ts`): reaching halfway to
    the nearer of its neighbors on either side, so labels wrapped within their
    shares never meet, while one between far-off neighbors keeps the room
    they leave it. A lone label spans the whole range.
*/
export function ownLabelSpaces(
  positions: number[],
  rangeOuter: number[],
): number[] {
  if (positions.length < 2)
    return positions.map(() =>
      Math.abs(rangeOuter[rangeOuter.length - 1] - rangeOuter[0]),
    );
  return positions.map((position: number, i: number) => {
    const gaps = [positions[i - 1], positions[i + 1]]
      .filter((n: number | undefined): n is number => n !== undefined)
      .map((n: number) => Math.abs(position - n));
    return Math.min(...gaps);
  });
}

/**
    Whether a horizontal axis's labels are values read in sequence (dates, or
    numbers on a category axis) that are drawn whole on one line: thinned
    rather than wrapped or cut short, since any one of them reads alone.
    Labels naming categories wrap or rotate instead (see `rotatesLabels`).
*/
export function wholeLineLabels(axis: Axis, labels: unknown[]): boolean {
  const {scale} = axis.schema;
  if (scale === "time") return true;
  return (
    isDiscreteScale(scale) &&
    labels.length > 0 &&
    labels.every((d: unknown) => d instanceof Date || !isNaN(d as number))
  );
}

/** Whether a scale places one tick per category (every value labeled in turn). */
export function isDiscreteScale(scale: string): boolean {
  return ["band", "ordinal", "point"].includes(scale);
}
