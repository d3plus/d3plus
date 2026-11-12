/**
    The box a vertical axis's flat labels wrap in, so each label is cut
    where it is painted.
*/
import {max} from "d3-array";

import type {AxisTextDatum} from "./axisLayoutLabels.js";

/** A label's wrapped lines and size, as `measure` gives them. */
type Wrapped = Pick<AxisTextDatum, "lines" | "widths" | "width" | "height">;

/**
    A vertical axis paints its flat labels in a box as wide as the widest
    one (see `buildTickData`), narrower than the room they were measured
    in. Where a cut label's line breaks decides where it is cut, so each
    label that doesn't fit is wrapped again in that box (by `measure`, which
    wraps a label within its `room`) until the widest label holds; a label
    that fits wraps the same in any box as wide as it. Records the box on
    each label as its `room`.
    @param textData The axis's measured labels.
    @param measure Wraps a label within its `room`.
*/
export function fitLabelRoom(
  textData: AxisTextDatum[],
  measure: (t: AxisTextDatum) => Wrapped,
): void {
  const widest = () => max(textData, (t: AxisTextDatum) => t.width) || 0;
  let room = widest();
  // A label wrapped in the box is no wider than it, so the box only
  // narrows, and settles.
  for (;;) {
    textData.forEach((t: AxisTextDatum) => (t.room = room));
    textData
      .filter((t: AxisTextDatum) => !t.fits)
      .forEach((t: AxisTextDatum) => {
        const {lines, widths, width, height} = measure(t);
        Object.assign(t, {lines, widths, width, height});
      });
    const next = widest();
    if (next >= room) return;
    room = next;
  }
}
