/**
    Venn — sets drawn as overlapping circles, one region per row: a set's
    circle, or the area where its sets overlap.

    Implementation files in this folder:
      - `circles.ts` — circle geometry: shared areas and their outlines.
      - `nelderMead.ts` — the minimizer the layout and label spots use.
      - `vennLayout.ts` — the area-proportional and classic layouts.
      - `vennFit.ts` — orientation, packing apart sets that don't overlap,
        and fitting the circles to the chart area.
      - `vennRegions.ts` — label spots and exclusive counts.
      - `vennData.ts` — reading rows, hidden sets, and blended region colors.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — region paths and their labels.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {chartBackground} from "../viz/backgroundInk.js";
import {shapeHoverEnabled} from "../viz/shapeHover.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyVennLayout} from "./applyLayout.js";
import {vennEmit} from "./emit.js";
import {
  SET_SEPARATOR,
  blendedFill,
  coversSets,
  mergeSets,
  rowSets,
  vennRows,
} from "./vennData.js";
import {vennTooltipRows} from "./tooltip.js";

/** A string key reads that field; a function is used as is. */
const optionalField = (v: unknown) =>
  typeof v === "function" ? v : fieldAccessor(v as string);

/**
    The `sets` accessor: a function as is, or a key read as a field, with
    the key kept so rows merge their sets under it as lists (see
    `mergeSets`).
*/
const setsAccessor = (v: unknown) =>
  typeof v === "function"
    ? v
    : Object.assign(fieldAccessor(v as string), {setsKey: v as string});

/**
    Hovering a region (or a set in the legend) highlights it with every
    region inside it: a set's circle with all of its overlaps, an overlap
    with the smaller overlaps within it.
*/
function installVennHover(viz: VizInstance): void {
  const base = viz.schema.on.mouseenter as (d: DataPoint, i: number) => void;
  viz.schema.on.mouseenter = function (d: DataPoint, i: number) {
    const sets = rowSets(viz, d, i);
    if (!sets.length || viz._hoverBucket || !shapeHoverEnabled(viz))
      return base.call(viz, d, i);
    viz._hoverBucket = false;
    (viz as VizInstance & {hover: (p: unknown) => unknown}).hover(
      (h: DataPoint, x: number) => coversSets(rowSets(viz, h, x), sets),
    );
  };
}

export const vennDef: DataDrivenChartDefinition = {
  name: "Venn",

  layoutStage: applyVennLayout,
  emit: vennEmit,
  insetRegion: sceneInsetRegion,
  thresholdFunction: (viz, data, all) =>
    vennRows(viz, data as DataPoint[], all as DataPoint[] | undefined),

  setup: (viz: VizInstance) => {
    const fill = viz.schema.shapeConfig.fill as (
      d: DataPoint,
      i: number,
    ) => unknown;
    viz.schema.shapeConfig.fill = blendedFill(viz, fill);
    installVennHover(viz);
  },

  facet: {aspect: 1},

  ctx: {},

  fields: [
    {
      key: "groupBy",
      factory: (viz: VizInstance) => [
        (d: DataPoint, i: number) => {
          const sets = rowSets(viz, d, i);
          return sets.length === 1 ? sets[0] : sets.join(SET_SEPARATOR);
        },
      ],
    },
    {
      key: "label",
      coerce: "const",
      factory: (viz: VizInstance) => (d: DataPoint, i: number) =>
        rowSets(viz, d, i).join(SET_SEPARATOR),
    },
    /**
        What the count in each region's label means: `"exclusive"` counts
        the items in that region and none of the smaller regions drawn
        inside it (so the counts across the diagram add up to the whole),
        `"inclusive"` shows each row's own size, every item in all of its
        sets. Tooltips show both.
        @type {"exclusive" | "inclusive"}
    */
    {key: "labelCounts", default: "exclusive"},
    {key: "legendSort", default: () => 0},
    /**
        When `true`, each set is a circle whose area matches its size and
        each overlap's area matches its row's size, as closely as circles
        allow (exact for two sets, close for three, approximate beyond).
        Sets that share nothing are drawn apart, and a set inside another
        inside its circle. When `false`, every set is an equal circle in the
        classic arrangement (side by side, a triangle, or a ring), whatever
        the sizes.
    */
    {key: "proportional", default: true},
    /**
        The accessor function or key for the sets each row stands for: an
        array of set names (`["A", "B"]` for where A and B overlap) or a
        single name for a set on its own.
        @type {string | function}
    */
    {
      key: "sets",
      default: "sets",
      coerce: setsAccessor,
      onSet: (viz: VizInstance, value: unknown) => {
        const key = (value as {setsKey?: string}).setsKey;
        if (key) (viz.schema.aggs as Record<string, unknown>)[key] = mergeSets;
      },
    },
    /**
        The accessor function or key for each row's size: the count of
        items in every one of its sets (a set's whole size for a single
        set, the size of the overlap for several).
        @type {string | function}
    */
    {key: "value", default: accessor("size"), coerce: optionalField},
    /**
        Formats each size shown in labels and tooltips, as
        `(value, datum) => string`. Defaults to the locale's abbreviated
        number format.
    */
    {
      key: "valueFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /** Zooming and panning don't help read a Venn diagram, so they're off by default. */
    {key: "zoom", default: false},
    {key: "shape", default: constant("Path"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        // A line in the chart's background color between regions, so
        // every region reads as its own shape.
        stroke: () => chartBackground(viz),
        strokeWidth: 2,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => vennTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a Venn diagram from an array of rows, each naming one or more
    sets (`sets`) and a size (`value`): a row with one set is that set's
    circle, a row with several is the area where those sets overlap. By
    default circles and overlaps are sized to their values (an Euler
    diagram when sets don't overlap); `proportional: false` draws the
    classic equal circles. Each region is labeled with its count, and
    hovering one shows its exact intersection.
*/
export default makeChart(vennDef);
