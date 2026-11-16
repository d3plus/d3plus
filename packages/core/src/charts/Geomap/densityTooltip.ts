/**
    Geomap's tooltip for `dotDensity` and `hexbin`: a bin's measure, a
    group of dots' value and dot count, and a region's totals under its
    dots.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {linkTooltipConfig} from "../features/linkInteraction.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {DotDensityLayout, DotGroup} from "./dotDensityLayout.js";
import {geoBinTitle, geoBinTooltipRows} from "./geoHexbin.js";
import {geoClusterTitle, geoClusterTooltipRows} from "./pointClusterLayout.js";

/** The dot groups each hovered row stands for, per chart, with their dots. */
const noted = new WeakMap<
  object,
  WeakMap<object, {dots: DotDensityLayout; groups: DotGroup[]}>
>();

/**
    Notes the rows a tooltip reads dots for: each group's row, and each
    region's datum with all of the region's groups. Small multiples note
    every panel's.
    @param viz The Geomap.
    @param dots The dots.
    @param regions Each region datum's groups.
*/
export function noteDotRows(
  viz: VizInstance,
  dots: DotDensityLayout,
  regions: Map<DataPoint, DotGroup[]>,
): void {
  let rows = noted.get(viz);
  if (!rows) noted.set(viz, (rows = new WeakMap()));
  for (const g of dots.groups) rows.set(g.row, {dots, groups: [g]});
  for (const [datum, groups] of regions) rows.set(datum, {dots, groups});
}

const fmt = (viz: VizInstance, n: number): string =>
  Number.isFinite(n) ? formatAbbreviate(n, viz.schema.locale) : "";

/**
    The tooltip rows of some dot groups: each category's value (or the
    value, without categories), then the dots drawn and what each stands
    for.
    @param viz The Geomap.
    @param dots The dots.
    @param groups The groups: one, for a hovered group, or a region's.
*/
export function dotTooltipRows(
  viz: VizInstance,
  dots: DotDensityLayout,
  groups: DotGroup[],
): [string, string][] {
  const t = (s: string) => viz.schema.translate(s) as string;
  const rows: [string, string][] = [];
  if (dots.categories)
    [...groups]
      .sort((a, b) => b.value - a.value)
      .forEach(g =>
        rows.push([`${viz._drawLabel(g.row, g.index, 0)}`, fmt(viz, g.value)]),
      );
  else
    rows.push([
      dots.settings.valueName ?? t("Value"),
      fmt(
        viz,
        groups.reduce((sum, g) => sum + g.value, 0),
      ),
    ]);
  const count = groups.reduce((sum, g) => sum + g.points.length, 0);
  rows.push([t("Dots"), fmt(viz, count)]);
  rows.push([t("Each dot"), fmt(viz, dots.per)]);
  return rows;
}

/**
    The tooltip rows Geomap adds for a hovered row: a bin's point count, a
    group of dots' value and count, or the totals of the region they fill.
    Empty for any other row.
    @param viz The Geomap.
    @param d The hovered row.
*/
export function densityTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const bin = geoBinTooltipRows(viz, d);
  if (bin.length) return bin;
  const hit = d && noted.get(viz)?.get(d);
  return hit ? dotTooltipRows(viz, hit.dots, hit.groups) : [];
}

/**
    Geomap's default `tooltipConfig`: a cluster titled by its count and
    listing its first points, a bin titled by its measure, dots and
    regions under them listing their values and dots, and links and
    their ends as on the other node-link charts (see `linkTooltipConfig`).
    @param viz The Geomap.
*/
export function geomapTooltipConfig(viz: VizInstance): {
  title: (d: DataPoint, i: number) => string;
  tbody: (d: DataPoint, i: number) => unknown[];
} {
  const links = linkTooltipConfig(viz);
  return {
    title: (d, i) =>
      geoClusterTitle(viz, d) ?? geoBinTitle(viz, d) ?? links.title(d, i),
    tbody: (d, i) => {
      const cluster = geoClusterTooltipRows(viz, d);
      if (cluster.length) return cluster;
      const rows = densityTooltipRows(viz, d);
      return rows.length ? rows : links.tbody(d, i);
    },
  };
}
