import {date} from "@d3plus/dom";

import type {D3Scale} from "../../utils/index.js";
import type Axis from "./Axis.js";

/* catches for -0 and less*/
export const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);

/**
    The share of the regular tick spacing a forced domain-end label must clear
    to keep its label: an end value at or within this distance of its nearest
    regular tick keeps its tick mark but not its label.
*/
export const END_LABEL_MIN_SPACING = 0.5;

/** The fewest regular ticks needed to judge their spacing. */
export const END_LABEL_MIN_TICKS = 3;

/**
    Whether a domain-end value forced onto an axis sits too close to the
    regular ticks to carry a label: no farther (in pixels) from its nearest
    regular tick than `minSpacing` times the gap between that tick and the
    next. Axes with fewer than `END_LABEL_MIN_TICKS` regular ticks always keep
    it.
    @param end The forced domain-end value.
    @param regular The axis's regular ("nice") tick values, without the end.
    @param position Maps a value to its pixel position.
    @param minSpacing The required gap, as a share of the regular spacing.
    @private
*/
export function crowdsEndLabel(
  end: number,
  regular: number[],
  position: (d: number) => number,
  minSpacing: number = END_LABEL_MIN_SPACING,
): boolean {
  if (regular.length < END_LABEL_MIN_TICKS) return false;
  const pixels = regular.map(position).sort((a, b) => a - b);
  const endPixel = position(end);
  if (![endPixel, ...pixels].every(Number.isFinite)) return false;
  const last = pixels.length - 1;
  const atStart =
    Math.abs(endPixel - pixels[0]) <= Math.abs(endPixel - pixels[last]);
  const nearest = atStart ? pixels[0] : pixels[last];
  const neighbor = atStart ? pixels[1] : pixels[last - 1];
  const spacing = Math.abs(nearest - neighbor);
  if (!spacing) return false;
  // tolerance absorbs float error in pixel positions at exactly `minSpacing`
  return Math.abs(endPixel - nearest) - spacing * minSpacing <= spacing * 1e-9;
}

/**
    Forces the domain's two ends into an axis's tick values when they are not
    already present (unless `domainTicks` is false). For a label pass, an end
    that crowds the regular ticks (see `crowdsEndLabel`) is left out, so it
    keeps the tick mark from the tick pass without a label — unless the user's
    own `ticks` include that value.
    @param axis The axis whose config (`domainTicks`, `ticks`, `scale`) applies.
    @param ticks The regular tick values; ends are added to this array.
    @param domain The domain of `scale`.
    @param scale The (sub-)scale the ticks were computed from.
    @param labels Whether these values become labels rather than tick marks.
    @private
*/
export function addDomainEnds(
  axis: Axis,
  ticks: unknown[],
  domain: unknown[],
  scale: D3Scale,
  labels: boolean,
): unknown[] {
  if (axis.schema.domainTicks === false) return ticks;
  const inverted = (domain[1] as number) < (domain[0] as number);
  const regular = ticks.map(Number);
  const userTicks = ((axis.schema.ticks ?? []) as unknown[]).map(d =>
    Number(
      axis.schema.scale === "time" ? date(d as string | number | false) : d,
    ),
  );
  const keep = (d: unknown): boolean =>
    !ticks.map(Number).includes(Number(d)) &&
    (!labels ||
      userTicks.includes(Number(d)) ||
      !crowdsEndLabel(Number(d), regular, v => scale(v)));
  // on a split (log) scale, only the half holding the end receives it
  const fits = (end: unknown): boolean =>
    !axis._d3ScaleNegative ||
    isNegative(end as number) === ticks.some(d => isNegative(d as number));
  if (fits(domain[inverted ? 1 : 0]) && keep(domain[0]))
    ticks.unshift(domain[0]);
  if (fits(domain[inverted ? 0 : 1]) && keep(domain[1])) ticks.push(domain[1]);
  return ticks;
}
