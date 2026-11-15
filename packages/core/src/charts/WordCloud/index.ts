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

import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {
  legendLargestFirst,
  rowLegend,
  shareRow,
} from "../features/sharedFields.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {thresholdFunction} from "../Treemap/thresholdFunction.js";

import {applyWordCloudLayout} from "./applyLayout.js";
import {wordCloudEmit} from "./emit.js";
import {defaultSize, wordSize} from "./size.js";
import type {SizeFn} from "./size.js";

/** A WordCloud, with the `size` accessor it installs. */
type WordCloudViz = VizInstance & {size: (value?: unknown) => unknown};

/** The tooltip's rows: the word's summed value, then its share of the drawn words. */
export function wordCloudTooltipRows(viz: VizInstance): unknown[][] {
  return [
    [
      () => viz.schema.translate("Value"),
      (d: DataPoint, i: number, x?: Record<string, unknown>) => {
        if (x && x._isColorScaleBucket) return "";
        const v = wordSize(viz)(d, i);
        return Number.isFinite(v)
          ? formatAbbreviate(v, viz.schema.locale as string)
          : "";
      },
    ],
    shareRow(viz, wordSize(viz)),
  ];
}

/**
    Installs `size`, stored on `_size` as Plot and Network store theirs, and
    pointed at by `thresholdKey` so the threshold compares word values.
*/
function installSize(v: WordCloudViz): void {
  /**
      Accessor function or data key for each word's value, which sets its
      font size. Rows with the same id add up. Defaults to `"value"`.
      @type {string | function}
  */
  v.size = function (this: WordCloudViz, _?: unknown) {
    if (!arguments.length) return this._size;
    const fn =
      typeof _ === "function"
        ? (_ as SizeFn)
        : _ === undefined || _ === null || _ === false
          ? defaultSize
          : (fieldAccessor(String(_)) as unknown as SizeFn);
    this._size = fn;
    this._sizeKey = typeof _ === "string" ? _ : undefined;
    this.schema.thresholdKey = fn;
    return this;
  };
}

export const wordCloudDef: DataDrivenChartDefinition = {
  name: "WordCloud",

  layoutStage: applyWordCloudLayout,
  emit: wordCloudEmit,

  thresholdFunction: (viz: VizInstance, data: unknown[]) =>
    thresholdFunction(data as DataPoint[], {
      aggs: viz.schema.aggs,
      drawDepth: viz._drawDepth,
      groupBy: viz.schema.groupBy as ((
        d: DataPoint,
      ) => DataPoint[keyof DataPoint])[],
      threshold: viz.schema.threshold as (branchData: DataPoint[]) => number,
      thresholdKey: viz.schema.thresholdKey as (d: DataPoint) => number,
      label: (d: DataPoint, i: number) => viz._drawLabel(d, i),
    }),

  defaults: {
    size: defaultSize,
  },

  setup: (viz: VizInstance) => {
    installSize(viz as WordCloudViz);
    viz.schema.thresholdKey = viz._size;
    // Small words merge into one only when `threshold` is set.
    viz.schema.threshold = constant(0);
  },

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
        The clearance, in pixels, kept around each word's glyphs.
        @type {number}
    */
    {key: "wordPadding", default: 2},
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
      factory: (viz: VizInstance) => legendLargestFirst(viz, wordSize(viz)),
    },
    {key: "legend", coerce: "const", factory: rowLegend},
  ],
};

/**
    Draws a word cloud: one word per row, its font size set by its value
    (`size`), packed around the middle of the chart, largest first, each word
    fitted against the glyphs of the words before it so small words nest in
    the gaps of large ones. The layout is the same on every draw. When the
    words don't all fit, every font size shrinks until they do. Color the
    words by `groupBy` or `colorScale`; hover a word to see its value and
    share. With `threshold`, the smallest words merge into one.
*/
export default makeChart(wordCloudDef);
