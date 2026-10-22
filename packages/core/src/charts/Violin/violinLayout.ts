/**
    Pure Violin geometry: where each violin sits along the category axis and
    the outline of its density curve.
*/
import type {DensityPoint} from "@d3plus/math";

/** Which side of its center a violin draws: both, or one half of a split pair. */
export type ViolinSide = "both" | "start" | "end";

/** A violin's place along the category axis, in pixels. */
export interface ViolinSlot {
  center: number;
  /** Half the violin's widest extent. */
  half: number;
  side: ViolinSide;
}

/**
    The distance between neighboring categories on a point scale spanning
    `span` pixels with `padding` steps of outer padding on each end.
    @param span The pixel length of the category axis.
    @param count The number of categories.
    @param padding The outer padding, in steps.
*/
export function categoryStep(
  span: number,
  count: number,
  padding: number,
): number {
  return Math.abs(span) / Math.max(1, count - 1 + 2 * padding);
}

/** Options for `violinSlots`. */
export interface ViolinSlotOptions {
  /** Pixel position of a category. */
  position: (category: string) => number;
  /** Distance between neighboring categories. */
  step: number;
  /** Pixel gap left between neighboring categories' violins. */
  gap: number;
  /** Draws a category holding exactly two violins as the two halves of one. */
  split: boolean;
}

/**
    Places each violin: one violin fills its category's band (less `gap`);
    several in one category share it side by side, or, when `split` and there
    are exactly two, each draws one half of a shared outline.
    @param categories Each violin's category, in drawing order.
    @param options Positions and spacing.
    @returns One slot per violin, in the same order.
*/
export function violinSlots(
  categories: readonly string[],
  options: ViolinSlotOptions,
): ViolinSlot[] {
  const {position, step, gap, split} = options;
  const width = Math.max(1, step > gap ? step - gap : step);
  const members = new Map<string, number[]>();
  categories.forEach((c, i) => {
    if (!members.has(c)) members.set(c, []);
    members.get(c)!.push(i);
  });
  const slots: ViolinSlot[] = new Array(categories.length);
  members.forEach((indices, category) => {
    const center = position(category);
    const k = indices.length;
    if (split && k === 2) {
      slots[indices[0]] = {center, half: width / 2, side: "start"};
      slots[indices[1]] = {center, half: width / 2, side: "end"};
      return;
    }
    const sub = width / k;
    const inner = k > 1 ? Math.min(2, sub / 4) : 0;
    indices.forEach((index, j) => {
      slots[index] = {
        center: center - width / 2 + sub * (j + 0.5),
        half: Math.max(0.5, (sub - inner) / 2),
        side: "both",
      };
    });
  });
  return slots;
}

/** One sampled point of a violin's outline. */
export interface ViolinPoint {
  /** The observed value. */
  value: number;
  /** Distance from the center to the edge, in pixels. */
  extent: number;
}

/**
    A curve's points as pixel distances from the violin's center: each
    density times `scale` (which maps densities onto `[0, 1]`) times `half`.
    @param curve The `[value, density]` points.
    @param scale The density → `[0, 1]` factor.
    @param half Half the violin's widest extent.
*/
export function violinOutline(
  curve: readonly DensityPoint[],
  scale: number,
  half: number,
): ViolinPoint[] {
  return curve.map(([value, density]) => ({
    value,
    extent: density * scale * half,
  }));
}

/**
    The pixel edges of a violin at a given extent: `[low, high]` along the
    category axis, collapsing one edge onto the center for a split half.
    @param slot The violin's slot.
    @param extent Distance from the center to the edge.
*/
export function violinEdges(
  slot: ViolinSlot,
  extent: number,
): [number, number] {
  const {center, side} = slot;
  return [
    side === "end" ? center : center - extent,
    side === "start" ? center : center + extent,
  ];
}
