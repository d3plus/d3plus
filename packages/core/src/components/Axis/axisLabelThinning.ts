/**
    Label thinning for `createTextData` (see `axisLayoutLabels.ts`): the
    passes that hide labels crowding their neighbors, and the widening of
    labels that each wrap within their own share of the axis.
*/
import {axisCrossing} from "./axisLabelAngle.js";
import type {AxisTextDatum} from "./axisLayoutLabels.js";

/**
    A measured label's text extent along its axis, which the overlap pass
    spaces at least the label's padding apart. Text running along the axis
    spans its measured width. Stacked across the axis, it spans its lines'
    glyphs: every line but the last at full line height, plus one font size.
    The measured `height` also holds the label's padding (see
    `calculateLabelSize`) and the leading above and below the text, which this
    leaves out, so neighbors are spaced by their padding alone, as they are
    along a horizontal axis. Slanted labels span their glyphs' thickness where
    it crosses the axis.
*/
export function labelExtent(
  datum: Pick<
    AxisTextDatum,
    | "angle"
    | "slant"
    | "fP"
    | "fS"
    | "height"
    | "lineHeight"
    | "lines"
    | "rotate"
    | "width"
  >,
  horizontal: boolean,
): number {
  const lines = datum.lines.length;
  const glyphs = lines ? (lines - 1) * datum.lineHeight + datum.fS : 0;
  // Slanted labels lie side by side: each one's text crosses the axis over
  // its thickness, lengthened by the slant.
  if (datum.slant) {
    const sin = Math.sin(axisCrossing(datum.angle!, horizontal));
    return sin < 1e-9 ? datum.width : glyphs / sin;
  }
  if (Boolean(datum.rotate) !== horizontal) return datum.width;
  return glyphs;
}

/**
    Fits flat labels that each wrap within their own share of the axis (see
    `ownLabelSpaces`, which gives `spaces`). A label too long for its share,
    even wrapped, widens into the room its neighbors leave unused, staying
    centered on its tick and its padding clear of them. Labels widen in
    order of their ticks' slots (laid end to end from the start of the
    scale's `range`, each tick at its slot's center: one bar each, for one
    label per bar), so where two narrow neighbors can't both fit, the
    narrower bar's label is the one hidden; every other label stays as it
    is. `resize` measures a label again at a given width.
*/
export function fitOwnSpaces(
  textData: AxisTextDatum[],
  spaces: number[],
  range: number[],
  resize: (datum: AxisTextDatum, space: number) => AxisTextDatum,
): void {
  const share = (t: AxisTextDatum) => spaces[t.i] - t.fP * 2;
  const pending = new Set(textData.filter((t: AxisTextDatum) => !t.fits));
  // A label still waiting to widen keeps to its own share for now.
  const extent = (t: AxisTextDatum) =>
    pending.has(t) ? Math.min(t.width, share(t)) : t.width;
  // The nearest label shown on either side, past any still waiting to widen when `skip`.
  const shown = (from: number, step: number, skip: boolean) => {
    for (let i = from + step; i >= 0 && i < textData.length; i += step)
      if (!textData[i].truncated && !(skip && pending.has(textData[i])))
        return textData[i];
    return undefined;
  };
  // Widens a label into its neighbors' unused room, if that's more than its share.
  const widen = (datum: AxisTextDatum, skip: boolean) => {
    const widths = [shown(datum.i, -1, skip), shown(datum.i, 1, skip)]
      .filter((t?: AxisTextDatum): t is AxisTextDatum => t !== undefined)
      .map(
        (t: AxisTextDatum) =>
          2 *
          (Math.abs(t.position - datum.position) - extent(t) / 2 - datum.fP),
      );
    // With no label shown beside it, a label may span the whole range.
    const space = Math.floor(
      widths.length
        ? Math.min(...widths)
        : Math.max(...range) - Math.min(...range),
    );
    if (space > share(datum)) resize(datum, space);
    return datum.fits;
  };
  // Each tick's slot, as if the slots ran end to end from the range's
  // start with each tick at its slot's center (one slot per bar).
  let edge = Math.min(...range);
  const slots = textData.map((t: AxisTextDatum) => {
    const slot = Math.max(0, 2 * (t.position - edge));
    edge += slot;
    return slot;
  });
  [...pending]
    .sort((a: AxisTextDatum, b: AxisTextDatum) => slots[b.i] - slots[a.i])
    .forEach((datum: AxisTextDatum) => {
      pending.delete(datum);
      // A label that can't fit beside its neighbors' shares takes the room of
      // any narrower bars' labels still waiting, which then fit around it or hide.
      if (!widen(datum, false)) widen(datum, true);
      datum.truncated = !datum.fits;
    });
}

/**
    Whether label `b` sits too close to label `a` before it, leaving less
    than `b`'s padding between their text.
*/
function crowds(
  a: AxisTextDatum,
  b: AxisTextDatum,
  horizontal: boolean,
): boolean {
  const gap =
    Math.abs(b.position - a.position) -
    (labelExtent(a, horizontal) + labelExtent(b, horizontal)) / 2;
  return gap < b.fP;
}

/**
    Hides labels on a discrete axis at a regular interval: every label when
    they all fit side by side, otherwise every second label, or third, and so
    on, using the shortest interval at which no two shown labels crowd.
*/
export function thinEvenly(
  textData: AxisTextDatum[],
  horizontal: boolean,
  show?: (step: number, all: boolean) => void,
): void {
  let step = 1;
  const crowded = (n: number) =>
    textData.some(
      (datum: AxisTextDatum, i: number) =>
        i >= n && i % n === 0 && crowds(textData[i - n], datum, horizontal),
    );
  while (step < textData.length && crowded(step)) {
    step++;
    show?.(step, false);
  }
  // Measures the hidden labels too, as the shown ones read them.
  if (step > 1) show?.(step, true);
  textData.forEach(
    (datum: AxisTextDatum, i: number) => (datum.truncated = i % step !== 0),
  );
}

/**
    Thins a whole-line continuous axis (see `thinGreedily`) whose labels read
    which of them are shown: hiding a label can add the year to the next one
    shown, so the labels are measured against the ones left and thinned
    again, until the shown labels hold (or a few rounds pass).
*/
export function thinGreedilyShown(
  textData: AxisTextDatum[],
  horizontal: boolean,
  show: (shown: AxisTextDatum[], resize: AxisTextDatum[]) => void,
): void {
  let shown = textData;
  for (let round = 0; round < 4; round++) {
    thinGreedily(textData, horizontal);
    const next = textData.filter((t: AxisTextDatum) => !t.truncated);
    if (
      next.length === shown.length &&
      next.every((t: AxisTextDatum, i: number) => t === shown[i])
    )
      return;
    shown = next;
    show(shown, textData);
  }
}

/**
    Hides each continuous-axis label that would crowd the last one shown
    before it, keeping the final label and hiding the ones before it that
    crowd it instead.
*/
export function thinGreedily(
  textData: AxisTextDatum[],
  horizontal: boolean,
): void {
  const reverseTextData = textData.slice().reverse();
  textData.forEach((datum: AxisTextDatum) => {
    const {fP, i, position} = datum;
    const extent = (t: AxisTextDatum) => labelExtent(t, horizontal);
    let prev: AxisTextDatum | undefined = i
      ? reverseTextData.find((t: AxisTextDatum) => t.i < i && !t.truncated)
      : undefined;
    if (i === textData.length - 1) {
      while (
        prev &&
        position - extent(datum) / 2 - fP < prev.position + extent(prev) / 2
      ) {
        prev.truncated = true;
        prev = reverseTextData.find(
          (t: AxisTextDatum) => t.i < i && !t.truncated,
        );
      }
    }
    datum.truncated = prev
      ? position - extent(datum) / 2 - fP < prev.position + extent(prev) / 2
      : false;
  });
}
