/**
    Pure label planning for Funnel: which lines a stage's label shows,
    whether they fit inside the stage or beside it, and the one font size
    every stage's label shares.
*/

/** A conversion rate a stage's label can show. */
export type FunnelConversion = "first" | "previous";

/** The `conversion` setting: one rate, both, or none. */
export type FunnelConversionOption =
  boolean | FunnelConversion | "both" | FunnelConversion[];

/** A box a label can be drawn in. */
export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where a stage's label goes, at what size, and with which lines. */
export interface LabelPlan {
  position: "inside" | "outside";
  fontSize: number;
  lines: string[];
}

/** Sizing limits for `planLabel`. */
export interface LabelSizing {
  fontMin: number;
  fontMax: number;
  /** Space kept between the text and its box's edges. */
  padding: number;
  /** Line height as a multiple of the font size. */
  lineHeight: number;
}

/** The conversion rates a `conversion` setting asks for, in display order. */
export function conversionModes(
  option: FunnelConversionOption | undefined,
): FunnelConversion[] {
  if (option === true || option === "both") return ["first", "previous"];
  if (option === "first" || option === "previous") return [option];
  if (Array.isArray(option))
    return (["first", "previous"] as FunnelConversion[]).filter(m =>
      option.includes(m),
    );
  return [];
}

/**
    The largest font size, up to `fontMax`, at which `lines` fit in a box of
    `width` × `height`, given `measure(line, size)` text widths. Zero when
    nothing fits.
*/
export function fitFontSize(
  lines: string[],
  box: {width: number; height: number},
  measure: (text: string, size: number) => number,
  sizing: LabelSizing,
): number {
  const {fontMax, padding, lineHeight} = sizing;
  const width = box.width - padding * 2;
  const height = box.height - padding * 2;
  if (!lines.length || !(width > 0) || !(height > 0)) return 0;
  const widest = Math.max(...lines.map(l => measure(l, fontMax)));
  const byHeight = height / (lines.length * lineHeight);
  const byWidth = widest > 0 ? (width / widest) * fontMax : fontMax;
  const size = Math.min(fontMax, byHeight, byWidth);
  return Math.floor(size * 2) / 2;
}

/**
    Plans a stage's label: the most lines that fit (dropping from the end),
    inside the stage when the text is nearly as large there as beside it,
    otherwise in the `outside` box. Null when not even the first line fits.
*/
export function planLabel(
  lines: string[],
  inside: {width: number; height: number},
  outside: {width: number; height: number} | null,
  measure: (text: string, size: number) => number,
  sizing: LabelSizing,
): LabelPlan | null {
  for (let k = lines.length; k > 0; k--) {
    const shown = lines.slice(0, k);
    const inSize = fitFontSize(shown, inside, measure, sizing);
    const outSize = outside ? fitFontSize(shown, outside, measure, sizing) : 0;
    if (inSize >= sizing.fontMin && inSize >= outSize * 0.8)
      return {position: "inside", fontSize: inSize, lines: shown};
    if (outSize >= sizing.fontMin)
      return {position: "outside", fontSize: outSize, lines: shown};
  }
  return null;
}

/** One stage's label to plan: its lines and the boxes it can go in. */
export interface StageLabelInput {
  lines: string[];
  inside: {width: number; height: number};
  outside: {width: number; height: number} | null;
  /** A font size the user fixed for this label, which the shared size doesn't change. */
  fixed?: number;
}

/** Every stage's label plan (null where none fits) and the size they share. */
export interface FunnelLabelPlan {
  plans: (LabelPlan | null)[];
  /** The shared font size: 0 when no label without a fixed size is drawn. */
  fontSize: number;
}

/**
    Plans every label in one funnel so they share one font size: the largest
    size, up to `cap`, at which every label still fits where it's placed.
    The steps run once each, in this order, so placement and size never
    feed back into each other:

    1. Placement: each label's lines and side (inside or beside its stage)
       come from `planLabel` at the label's own best size.
    2. Size: the smallest of those placed sizes (and `cap`), so every label
       fits at it.
    3. Re-check: at that size, a label set beside its stage moves inside
       when it fits there too, since the text is the same size either way.
       Labels inside stay inside. Moving doesn't change the size: a moved
       label fits inside at it, and the label that set it stays put (beside
       its stage only because it's smaller inside).

    Lines are never dropped again at the shared size: it's at least
    `fontMin`, where step 1 already chose the lines. A label with a `fixed`
    size is planned at that size alone, and neither sets nor takes the
    shared size.
*/
export function planFunnelLabels(
  labels: StageLabelInput[],
  measure: (text: string, size: number) => number,
  sizing: LabelSizing,
  cap = Infinity,
): FunnelLabelPlan {
  const plans = labels.map(l =>
    planLabel(
      l.lines,
      l.inside,
      l.outside,
      measure,
      l.fixed ? {...sizing, fontMin: l.fixed, fontMax: l.fixed} : sizing,
    ),
  );
  const shared = plans.flatMap((p, k) => (p && !labels[k].fixed ? [k] : []));
  if (!shared.length) return {plans, fontSize: 0};

  const fontSize = Math.min(
    cap,
    ...shared.map(k => (plans[k] as LabelPlan).fontSize),
  );
  for (const k of shared) {
    const p = plans[k] as LabelPlan;
    const inside =
      p.position === "inside" ||
      fitFontSize(p.lines, labels[k].inside, measure, sizing) >= fontSize;
    plans[k] = {...p, position: inside ? "inside" : "outside", fontSize};
  }
  return {plans, fontSize};
}

/**
    One box per line, stacked and centered within `box` across the stage
    order's cross axis (`align` "middle"), or from its top (`"top"`).
*/
export function lineBoxes(
  box: LabelBox,
  count: number,
  lineHeight: number,
  align: "middle" | "top",
): LabelBox[] {
  const block = count * lineHeight;
  const top = align === "top" ? box.y : box.y + (box.height - block) / 2;
  return Array.from({length: count}, (_, j) => ({
    x: box.x,
    y: top + j * lineHeight,
    width: box.width,
    height: lineHeight,
  }));
}
