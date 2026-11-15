/**
    WordCloud — one word per row, its font size by value, packed glyph-tight
    around the middle of the chart area.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — each word's text node and the rect that takes its events.
      - `cloudLayout.ts` — spiral placement and the shrink-to-fit loop.
      - `glyphMask.ts` — rasterizes words into 1-bit glyph masks.
      - `occupancy.ts` — the masks and the occupancy bitmap they collide on.
      - `spiral.ts` — the Archimedean and rectangular spirals.
      - `fontScale.ts` — values to font sizes.
      - `rotation.ts` — seeded hashing and each word's angle.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {legendLargestFirst, rowLegend} from "../features/sharedFields.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyWordCloudLayout} from "./applyLayout.js";
import {wordCloudEmit} from "./emit.js";

/** The tooltip's "Value" row: the word's summed value. */
export function wordCloudTooltipRows(
  viz: VizInstance,
): [() => string, (d: DataPoint, i: number) => string][] {
  return [
    [
      () => viz.schema.translate("Value"),
      (d, i) => {
        const sum = viz.schema.sum as (d: DataPoint, i: number) => number;
        const v = Number(sum(d, i));
        return Number.isFinite(v)
          ? formatAbbreviate(v, viz.schema.locale as string)
          : "";
      },
    ],
  ];
}

export const wordCloudDef: DataDrivenChartDefinition = {
  name: "WordCloud",

  layoutStage: applyWordCloudLayout,
  emit: wordCloudEmit,

  ctx: {},

  fields: [
    // A cloud of a few hundred words still hovers and animates quickly.
    {key: "dataCutoff", default: 500},
    /**
        The largest font size, in pixels, given to the word with the largest
        value. When the words don't all fit, every size shrinks together
        until they do.
        @type {number}
    */
    {key: "fontMax", default: 60},
    /**
        The smallest font size, in pixels, given to the word with the
        smallest value.
        @type {number}
    */
    {key: "fontMin", default: 10},
    /**
        How values map onto font sizes between `fontMin` and `fontMax`:
        `"sqrt"` (default) so each word's ink area grows about in step with
        its value, `"linear"` for its height, or `"log"` for values spanning
        orders of magnitude.
        @type {"sqrt" | "linear" | "log"}
    */
    {key: "fontScale", default: "sqrt"},
    /**
        The words' font weight: a number or keyword, or an accessor
        `(d, i) => weight` per word.
        @type {number | string | function}
    */
    {key: "fontWeight", default: 600},
    /**
        The angle, in degrees clockwise, each word is drawn at: a number for
        every word, an array of angles (each word takes one, picked from a
        hash of its id, so it keeps its angle across redraws), or an
        accessor `(d, i) => degrees`. Defaults to `0`, every word
        horizontal.
        @type {number | number[] | function}
    */
    {key: "rotate", default: 0},
    /**
        The path each word walks out from the middle while looking for room:
        `"archimedean"` (default) packs the words into a rounded cloud,
        `"rectangular"` into a boxier one.
        @type {"archimedean" | "rectangular"}
    */
    {key: "spiral", default: "archimedean"},
    /**
        Accessor function or string key for each word's value, which sets
        its font size. Rows with the same id add up.
        @type {string | function}
    */
    {
      key: "sum",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : fieldAccessor(v as string)),
      onSet: (viz, v) => {
        viz.schema.thresholdKey = v;
      },
    },
    /**
        The clearance, in pixels, kept around each word's glyphs.
        @type {number}
    */
    {key: "wordPadding", default: 1},
    {key: "zoom", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({tbody: wordCloudTooltipRows(viz)}),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: (viz: VizInstance) => ({tbody: wordCloudTooltipRows(viz)}),
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => legendLargestFirst(viz, "sum"),
    },
    {key: "legend", coerce: "const", factory: rowLegend},
  ],
};

/**
    Draws a word cloud: one word per row, its font size set by its value
    (`sum`), packed around the middle of the chart, largest first, each word
    fitted against the glyphs of the words before it so small words nest in
    the gaps of large ones. The layout is the same on every draw. When the
    words don't all fit, every font size shrinks until they do. Color the
    words by `groupBy` or `colorScale`; hover a word to see its value.
*/
export default makeChart(wordCloudDef);
