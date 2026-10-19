/**
    Marimekko's pipeline pieces (variable bar widths, its axis defaults, and
    its small-multiple axes), re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  applyBarWidths,
  barKey,
  barSpanAxisConfig,
  barWidthAccessor,
  barWidthLabel,
  barWidthTooltipRows,
  labelBarWidth,
  layoutBarSpans,
  measureBars,
} from "../Plot/barWidth.js";
export type {BarSpan, BarSpanLayout, BarWidthAccessor, MeasuredBar} from "../Plot/barWidth.js";
// Funnel's `percentText` keeps the plain name.
export {
  isExpandOffset,
  marimekkoAxisDefaults,
  marimekkoFacetAxes,
  marimekkoFixedAxes,
  percentText as marimekkoPercentText,
} from "./axis.js";
