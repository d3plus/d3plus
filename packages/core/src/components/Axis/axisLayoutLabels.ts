/**
    Label/text layout helpers for `measureAxis` (see `axisLayout.ts`). Pure
    compute — no DOM. `createTextData` measures every label via `textWrap`,
    resolves truncation/offset, and returns the `textData` array the paint
    phase consumes; `computeAxisBounds` derives `_outerBounds` + margins.
*/
import {max, min} from "d3-array";

import {fontFamily as d3plusFontFamily, textWrap} from "@d3plus/text";

import {wholeWordFit, wholeWordSplit} from "../../utils/wholeWords.js";

import type Axis from "./Axis.js";

/** Resolves a tick's pixel size from the shape config (or a constant). */
export type TickGet = (d?: {tick?: boolean; id?: unknown}, i?: number) => number;

/**
    One measured axis label. Built incrementally: the base fields come from the
    label-mapping pass, `space`/`lines`/`widths`/`width`/`height` are filled by
    `calculateLabelSize`, and `truncated`/`offset` by the collision passes.
*/
export interface AxisTextDatum {
  d: unknown;
  i: number;
  fF: string;
  fP: number;
  fS: number;
  lineHeight: number;
  position: number;
  rotate?: boolean;
  space: number;
  lines: string[];
  widths: number[];
  width: number;
  height: number;
  /**
      Whether the whole label fits its share of the axis: no word dropped or
      cut off, and none broken across lines with a hyphen.
  */
  fits: boolean;
  /** Whether the overlap pass hides the label to make room for its neighbors. */
  truncated?: boolean;
  offset?: number;
}

interface LabelLayoutCtx {
  horizontal: boolean;
  hBuff: number;
  p: number;
  tickFormat: (d: unknown) => string;
  /** Whether each label is measured on a single line (see `wholeLineLabels`). */
  wholeLine?: boolean;
  /**
      Whether each label wraps within its own share of the axis (see
      `ownLabelSpaces`) rather than the widest share any label has.
  */
  ownSpace?: boolean;
}

/** Applies the axis title's wrapped height to the orient-side margin. */
export function applyTitleMargin(
  axis: Axis,
  ctx: {range: number[]; p: number; height: string; margin: Record<string, number>},
): void {
  if (!axis.schema.title) return;
  const {range, p, height, margin} = ctx;
  const {fontFamily, fontSize, lineHeight} = axis.schema.titleConfig;
  const titleWrap = textWrap()
    .fontFamily(typeof fontFamily === "function" ? fontFamily() : fontFamily)
    .fontSize(typeof fontSize === "function" ? fontSize() : fontSize)
    .lineHeight(typeof lineHeight === "function" ? lineHeight() : lineHeight)
    .width(range[range.length - 1] - range[0] - p * 2)
    .height((axis.schema[height] as number) - axis.schema.tickSize - p * 2);
  const lines = titleWrap(axis.schema.title).lines.length;
  margin[axis.schema.orient] = lines * titleWrap.lineHeight()! + p;
}

/** Resolves the tick height/width buffers from the shape config. */
export function computeBuffers(
  axis: Axis,
  _ticks: unknown[],
  tickGet: TickGet,
  height: string,
): {hBuff: number; wBuff: number} {
  // The ternary and `tickGet` already resolve per-tick functions to a single
  // value, so both buffers are numbers by here.
  let hBuff: number =
    axis.schema.shape === "Circle"
      ? typeof axis.schema.shapeConfig.r === "function"
        ? axis.schema.shapeConfig.r({tick: true})
        : axis.schema.shapeConfig.r
      : axis.schema.shape === "Rect"
        ? typeof axis.schema.shapeConfig[height] === "function"
          ? axis.schema.shapeConfig[height]({tick: true})
          : axis.schema.shapeConfig[height]
        : axis.schema.tickSize;
  let wBuff: number = tickGet({tick: true});

  if (axis.schema.shape === "Rect") hBuff /= 2;
  if (axis.schema.shape !== "Circle") wBuff /= 2;

  return {hBuff, wBuff};
}

/** A label's wrapped lines and measured size (see `calculateLabelSize`). */
type LabelSize = {lines: string[]; widths: number[]; width: number; height: number; fits: boolean};

/**
    Wraps + measures a single label, returning its sized text result. Given a
    `cache`, a label whose text, font, and space match one measured before
    reuses that measurement.
*/
function calculateLabelSize(
  axis: Axis,
  datum: AxisTextDatum,
  ctx: LabelLayoutCtx,
  cache?: Map<string, LabelSize>,
): LabelSize {
  const {horizontal, hBuff, p, tickFormat} = ctx;
  const {d, i, fF, fP, fS, rotate, space} = datum;
  const h = rotate ? "width" : "height",
    w = rotate ? "height" : "width";

  const lineHeight = axis.schema.shapeConfig.lineHeight
    ? axis.schema.shapeConfig.lineHeight(d, i)
    : undefined;
  const text = tickFormat(d);
  const key = cache && JSON.stringify([text, fF, fP, fS, lineHeight, rotate, space]);
  const cached = key ? cache!.get(key) : undefined;
  if (cached) return {...cached, lines: cached.lines.slice(), widths: cached.widths.slice()};

  const wSize = min([axis.schema.maxSize, axis.schema.width]);
  const hSize = min([axis.schema.maxSize, axis.schema.height]);

  const wrap = textWrap()
    .fontFamily(fF)
    .fontSize(fS)
    .lineHeight(lineHeight);

  wrap[w](
    horizontal
      ? space
      : wSize! - hBuff - p - axis._margin.left - axis._margin.right,
  );
  wrap[h](
    horizontal
      ? hSize! - hBuff - p - axis._margin.top - axis._margin.bottom
      : space,
  );

  type Sized = ReturnType<typeof wrap> & {width: number; height: number; fits: boolean};
  let res: Sized, fits: boolean;
  if (ctx.wholeLine) {
    // Measured across the whole axis (`maxSize` caps its depth, not its
    // length), a label that still breaks onto a second line can't be drawn
    // whole on one.
    wrap.width((axis.schema.width as number) - p * 2);
    res = wrap(text) as Sized;
    fits = !res.truncated && res.lines.filter((l: string) => l !== "").length <= 1;
  }
  else {
    res = wrap(text) as Sized;
    // A label that only fits by breaking a word mid-word doesn't fit.
    fits = wholeWordFit(res, () => wrap.split(wholeWordSplit)(text) as Sized).fits;
    // A label wider than its share of the axis wraps to nothing; measure it
    // across the whole axis instead, so the overlap pass thins the labels out.
    if (horizontal && !rotate && `${text}`.trim() && !res.lines.some((l: string) => l !== "")) {
      wrap.width(wSize! - p * 2);
      res = wrap(text) as Sized;
    }
  }
  res.fits = fits;
  res.lines = res.lines.filter((d: string) => d !== "");
  res.width = res.lines.length ? Math.ceil(max(res.widths)!) : 0;
  res.height = res.lines.length
    ? Math.ceil(res.lines.length * (wrap.lineHeight() as number)) + fP
    : 0;
  if (key) cache!.set(key, {lines: res.lines.slice(), widths: res.widths.slice(), width: res.width, height: res.height, fits});
  return res;
}

/**
    A measured label's text extent along its axis, which the overlap pass
    spaces at least the label's padding apart. Text running along the axis
    spans its measured width. Stacked across the axis, it spans its lines'
    glyphs: every line but the last at full line height, plus one font size.
    The measured `height` also holds the label's padding (see
    `calculateLabelSize`) and the leading above and below the text, which this
    leaves out, so neighbors are spaced by their padding alone, as they are
    along a horizontal axis.
*/
export function labelExtent(
  datum: Pick<AxisTextDatum, "fP" | "fS" | "height" | "lineHeight" | "lines" | "rotate" | "width">,
  horizontal: boolean,
): number {
  if (Boolean(datum.rotate) !== horizontal) return datum.width;
  const lines = datum.lines.length;
  return lines ? (lines - 1) * datum.lineHeight + datum.fS : 0;
}

/** Assigns vertical offsets to alternating labels that would overlap. */
function calculateOffset(arr: AxisTextDatum[] = [], horizontal: boolean): void {
  let offset = 0;
  arr.forEach((datum: AxisTextDatum) => {
    const prev = arr[datum.i - 1];
    const h =
        (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
          ? "width"
          : "height",
      w =
        (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
          ? "height"
          : "width";

    if (!prev) {
      offset = 1;
    } else if (
      prev.position + prev[w] / 2 >
      datum.position - datum[w] / 2
    ) {
      if (offset) {
        datum.offset = prev[h];
        offset = 0;
      } else offset = 1;
    }
  });
}

/**
    Measures every label, computes per-label space, sizes via `textWrap`, and
    resolves truncation (and optional offset). Returns the `textData` array.
*/
export function createTextData(
  axis: Axis,
  ctx: LabelLayoutCtx & {labels: unknown[]; rangeOuter: number[]; offset?: number},
): AxisTextDatum[] {
  const {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset = 1, ownSpace} = ctx;
  const wholeLine = horizontal && !axis._labelRotation && wholeLineLabels(axis, labels);
  // Every label is shown until the overlap pass below thins them.
  axis._shownLabels = labels;
  const labelCtx: LabelLayoutCtx = {horizontal, hBuff, p, tickFormat, wholeLine};
  const {fontSize} = axis.schema.shapeConfig.labelConfig;
  const fontFamilyConfig =
    axis.schema.shapeConfig.labelConfig.fontFamily || d3plusFontFamily;
  const fontPadding = axis.schema.shapeConfig.labelConfig.padding;

  let textData = labels.map((d: unknown, i: number) => {
    const fF =
        typeof fontFamilyConfig === "function" ? fontFamilyConfig(d, i) : fontFamilyConfig,
      fP =
        typeof fontPadding === "function" ? fontPadding(d, i) : fontPadding,
      fS = typeof fontSize === "function" ? fontSize(d, i) : fontSize,
      position = axis._getPosition(d);

    const lineHeight = axis.schema.shapeConfig.lineHeight
      ? axis.schema.shapeConfig.lineHeight(d, i)
      : fS * 1.4;
    // Base record — `space`/`lines`/`width`/`height` are filled below.
    return {
      d,
      i,
      fF,
      fP,
      fS,
      lineHeight,
      position,
      rotate: axis._labelRotation,
    } as AxisTextDatum;
  });

  const maxSpace =
    axis.schema.scale === "band"
      ? axis._d3Scale!.bandwidth!()
      : textData.reduce((s: number, d: AxisTextDatum, i: number) => {
          const {position} = d;
          const prevPosition = !i
            ? textData.length === 1
              ? rangeOuter[0]
              : position - (textData[i + 1].position - position)
            : position - (position - textData[i - 1].position);
          const prevSpace = Math.abs(position - prevPosition);

          const nextPosition =
            i == textData.length - 1
              ? textData.length === 1
                ? rangeOuter[1]
                : position + (position - textData[i - 1].position)
              : position - (position - textData[i + 1].position);
          const nextSpace = Math.abs(position - nextPosition);
          const mod = axis.schema.scale === "point" ? 1 : 2;
          return max([max([prevSpace, nextSpace])! * mod, s])!;
        }, 0);

  const spaces = ownSpace ? ownLabelSpaces(textData.map((d: AxisTextDatum) => d.position), rangeOuter) : undefined;

  // Thinning measures the labels again as they read the ones shown (see
  // `show`), mostly to the same text, so each text is measured once.
  const measured = new Map<string, LabelSize>();
  const size = (datum: AxisTextDatum, space = (spaces ? spaces[datum.i] : maxSpace) - datum.fP * 2): AxisTextDatum => {
    datum.space = space;
    const {lines, widths, width, height, fits} = calculateLabelSize(axis, datum, labelCtx, measured);
    // A label measured wider than its share (see `calculateLabelSize`) is
    // painted at that width; the overlap pass below thins its neighbors.
    if (horizontal && !datum.rotate) datum.space = Math.max(datum.space, Math.ceil(width));
    // Likewise a vertical axis label taller than its share is painted at its
    // own height, leaving the overlap pass to thin out its neighbors.
    else if (!horizontal && !datum.rotate && height - datum.fP > datum.space)
      datum.space = Math.ceil(height);
    return Object.assign(datum, {lines, widths, width, height, fits});
  };
  textData = textData.map((datum: AxisTextDatum) => size(datum));

  // Date labels read which labels are shown (see `Axis._shownLabels`), so a
  // whole-line axis measures them again each time it thins them.
  const show = (shown: AxisTextDatum[], resize: AxisTextDatum[] = shown) => {
    axis._shownLabels = shown.map((t: AxisTextDatum) => t.d);
    resize.forEach((datum: AxisTextDatum) => size(datum));
  };
  if (isDiscreteScale(axis.schema.scale))
    thinEvenly(textData, horizontal, wholeLine ? (step: number, all: boolean) => {
      const shown = textData.filter((_t: AxisTextDatum, i: number) => i % step === 0);
      show(shown, all ? textData : shown);
    } : undefined);
  else if (spaces && horizontal && !axis._labelRotation) fitOwnSpaces(textData, spaces, axis._d3Scale!.range(), size);
  else if (wholeLine) thinGreedilyShown(textData, horizontal, show);
  else thinGreedily(textData, horizontal);

  if (offset > 1) calculateOffset(textData, horizontal);
  return textData;
}

/**
    Each label's own share of an axis whose labels sit unevenly, such as one
    label per variable-width bar (see `Plot/barWidth.ts`): reaching halfway to
    the nearer of its neighbors on either side, so labels wrapped within their
    shares never meet, while one between far-off neighbors keeps the room
    they leave it. A lone label spans the whole range.
*/
export function ownLabelSpaces(positions: number[], rangeOuter: number[]): number[] {
  if (positions.length < 2) return positions.map(() => Math.abs(rangeOuter[rangeOuter.length - 1] - rangeOuter[0]));
  return positions.map((position: number, i: number) => {
    const gaps = [positions[i - 1], positions[i + 1]]
      .filter((n: number | undefined): n is number => n !== undefined)
      .map((n: number) => Math.abs(position - n));
    return Math.min(...gaps);
  });
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
  const extent = (t: AxisTextDatum) => (pending.has(t) ? Math.min(t.width, share(t)) : t.width);
  // The nearest label shown on either side, past any still waiting to widen when `skip`.
  const shown = (from: number, step: number, skip: boolean) => {
    for (let i = from + step; i >= 0 && i < textData.length; i += step)
      if (!textData[i].truncated && !(skip && pending.has(textData[i]))) return textData[i];
    return undefined;
  };
  // Widens a label into its neighbors' unused room, if that's more than its share.
  const widen = (datum: AxisTextDatum, skip: boolean) => {
    const widths = [shown(datum.i, -1, skip), shown(datum.i, 1, skip)]
      .filter((t?: AxisTextDatum): t is AxisTextDatum => t !== undefined)
      .map((t: AxisTextDatum) => 2 * (Math.abs(t.position - datum.position) - extent(t) / 2 - datum.fP));
    // With no label shown beside it, a label may span the whole range.
    const space = Math.floor(widths.length ? Math.min(...widths) : Math.max(...range) - Math.min(...range));
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
  [...pending].sort((a: AxisTextDatum, b: AxisTextDatum) => slots[b.i] - slots[a.i]).forEach((datum: AxisTextDatum) => {
    pending.delete(datum);
    // A label that can't fit beside its neighbors' shares takes the room of
    // any narrower bars' labels still waiting, which then fit around it or hide.
    if (!widen(datum, false)) widen(datum, true);
    datum.truncated = !datum.fits;
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
  return isDiscreteScale(scale) && labels.length > 0 &&
    labels.every((d: unknown) => d instanceof Date || !isNaN(d as number));
}

/** Whether a scale places one tick per category (every value labeled in turn). */
export function isDiscreteScale(scale: string): boolean {
  return ["band", "ordinal", "point"].includes(scale);
}

/**
    Whether label `b` sits too close to label `a` before it, leaving less
    than `b`'s padding between their text.
*/
function crowds(a: AxisTextDatum, b: AxisTextDatum, horizontal: boolean): boolean {
  const gap = Math.abs(b.position - a.position) -
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
  const crowded = (n: number) => textData.some((datum: AxisTextDatum, i: number) =>
    i >= n && i % n === 0 && crowds(textData[i - n], datum, horizontal));
  while (step < textData.length && crowded(step)) {
    step++;
    show?.(step, false);
  }
  // Measures the hidden labels too, as the shown ones read them.
  if (step > 1) show?.(step, true);
  textData.forEach((datum: AxisTextDatum, i: number) => (datum.truncated = i % step !== 0));
}

/**
    Thins a whole-line continuous axis (see `thinGreedily`) whose labels read
    which of them are shown: hiding a label can add the year to the next one
    shown, so the labels are measured against the ones left and thinned
    again, until the shown labels hold (or a few rounds pass).
*/
function thinGreedilyShown(
  textData: AxisTextDatum[],
  horizontal: boolean,
  show: (shown: AxisTextDatum[], resize: AxisTextDatum[]) => void,
): void {
  let shown = textData;
  for (let round = 0; round < 4; round++) {
    thinGreedily(textData, horizontal);
    const next = textData.filter((t: AxisTextDatum) => !t.truncated);
    if (next.length === shown.length && next.every((t: AxisTextDatum, i: number) => t === shown[i])) return;
    shown = next;
    show(shown, textData);
  }
}

/**
    Hides each continuous-axis label that would crowd the last one shown
    before it, keeping the final label and hiding the ones before it that
    crowd it instead.
*/
function thinGreedily(textData: AxisTextDatum[], horizontal: boolean): void {
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
        position - extent(datum) / 2 - fP <
          prev.position + extent(prev) / 2
      ) {
        prev.truncated = true;
        prev = reverseTextData.find((t: AxisTextDatum) => t.i < i && !t.truncated);
      }
    }
    datum.truncated = prev
      ? position - extent(datum) / 2 - fP <
        prev.position + extent(prev) / 2
      : false;
  });
}

/** Derives `_outerBounds` + axis margins from the measured text data. */
export function computeAxisBounds(
  axis: Axis,
  ctx: {
    textData: AxisTextDatum[];
    rangeOuter: number[];
    hBuff: number;
    horizontal: boolean;
    p: number;
    width: string;
    height: string;
    x: string;
    y: string;
    opposite: string;
    margin: Record<string, number>;
  },
): Record<string, number> {
  const {textData, rangeOuter, hBuff, horizontal, p, width, height, x, y, opposite, margin} = ctx;
  const tBuff = axis.schema.shape === "Line" ? 0 : hBuff;
  const bounds: Record<string, number> = (axis._outerBounds = {
    [height]:
      (max(textData, (t: AxisTextDatum) =>
        Math.ceil(t[t.rotate || !horizontal ? "width" : "height"] + (t.offset ?? 0)),
      ) || 0) + (textData.length ? p : 0),
    [width]: rangeOuter[rangeOuter.length - 1] - rangeOuter[0],
    [x]: rangeOuter[0],
  });

  bounds[height] =
    typeof axis.schema.fixedSize === "number"
      ? axis.schema.fixedSize
      : max([axis.schema.minSize, bounds[height]])!;
  axis._labelSpace = bounds[height];

  margin[axis.schema.orient] += hBuff;
  margin[opposite] =
    axis.schema.gridSize !== undefined
      ? max([axis.schema.gridSize, tBuff])!
      : (axis.schema[height] as number) - margin[axis.schema.orient] - bounds[height] - p;
  bounds[height] += margin[opposite] + margin[axis.schema.orient];
  bounds[y] =
    axis.schema.align === "start"
      ? axis.schema.padding
      : axis.schema.align === "end"
        ? (axis.schema[height] as number) - bounds[height] - axis.schema.padding
        : (axis.schema[height] as number) / 2 - bounds[height] / 2;

  return bounds;
}
