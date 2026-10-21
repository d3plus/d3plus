/**
    Calendar — a calendar heatmap: one square cell per day, weekdays down the
    side and weeks across, one block per year stacked top to bottom (or per
    month, as wall calendars), each day colored by its `colorScale` value.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — day Rects, month outlines, and label scene nodes.
      - `calendarDates.ts` — pure day parsing and week math.
      - `calendarGrid.ts` — pure cell fitting, positions, and outlines.
      - `calendarLayout.ts` — pure block, cell, and label layout.
      - `calendarFormat.ts` — localized date formatters.
      - `calendarInset.ts` — the region chrome may be placed inside.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {
  applyCalendarLayout,
  calendarDateFormat,
  rowDate,
  rowsExtent,
} from "./applyLayout.js";
import {calendarDayKey, dateExtent} from "./calendarDates.js";
import {calendarInsetRegion} from "./calendarInset.js";
import {calendarEmit, colorValue} from "./emit.js";

/** Reads a row's day from its `date` field, else its `time` field. */
export const defaultCalendarDate = (
  d: DataPoint,
): DataPoint[keyof DataPoint] => (d.date !== undefined ? d.date : d.time);

export const calendarDef: DataDrivenChartDefinition = {
  name: "Calendar",

  layoutStage: applyCalendarLayout,
  emit: calendarEmit,
  // Chrome goes in the open space around the calendar when it fits.
  insetRegion: calendarInsetRegion,

  // Hovering a day outlines it, whatever `hoverOpacity` and `dataCutoff` say.
  defaults: {hoverOutline: true},

  facet: {
    // Panels shaped like a year of weeks.
    aspect: 3,
    // Panels share one date range, so a day sits in the same cell in each.
    share: (viz: VizInstance, panels: DataPoint[][]) =>
      dateExtent(panels.flatMap(rows => rowsExtent(viz, rows) ?? [])),
    panel: (viz: VizInstance, {shared, scales}) => {
      viz.ctx.calendarSharedExtent = shared && scales ? scales : undefined;
      return () => {
        viz.ctx.calendarSharedExtent = undefined;
      };
    },
  },

  ctx: {},

  fields: [
    /**
        Each cell's gap to its neighbors, in pixels.
    */
    {key: "cellPadding", default: 2},
    /** Each cell's corner radius, in pixels (kept below a third of the cell). */
    {key: "cellRadius", default: 2},
    /**
        The day each row falls on: a data key or accessor returning a `Date`,
        a millisecond timestamp, or a date string (a bare `"YYYY-MM-DD"` is
        read as that local day). Defaults to the row's `date`, else its `time`.
    */
    {
      key: "date",
      default: defaultCalendarDate,
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    /**
        The fill of days without a value: days missing from the data, and rows
        whose `colorScale` value isn't a number. Defaults to a faint tint of
        the chart's text color, legible on light and dark backgrounds.
    */
    {key: "emptyFill"},
    /**
        Formats the month names along year blocks, and the titles of month
        blocks: a d3-time-format specifier read in the chart's `locale`, a
        function of the month's first day, or `false` for none. Defaults to
        `"%b"` along years; month titles use `"%B %Y"`, shortening to fit.
    */
    {key: "monthFormat"},
    /** Whether to outline each month inside year blocks (see `monthOutlineConfig`). */
    {key: "monthOutline", default: true},
    /**
        The direction weeks run: `"horizontal"` (weeks left to right, weekdays
        down the side) or `"vertical"` (weeks top to bottom, weekdays across
        the top). Defaults to `"horizontal"` for year blocks and `"vertical"`
        for month blocks, which then read as wall calendars.
        @type {"horizontal" | "vertical"}
    */
    {key: "orient"},
    /**
        What each block covers: `"year"` (every whole year the data touches,
        stacked) or `"month"` (every whole month, as a grid of small calendars).
    */
    {key: "period", default: "year"},
    /**
        The first day of the week: `0` (Sunday) through `6` (Saturday), or a
        day name such as `"monday"`. Defaults to the first day of the week in
        the `locale`'s region (Sunday for `"en-US"`, Monday for `"en-GB"`).
    */
    {key: "weekStart"},
    /**
        Formats the weekday names: a d3-time-format specifier read in the
        chart's `locale`, a function of a date on that weekday, or `false` for
        none. Defaults to `"%a"`; names wider than a cell shorten to their
        first letter.
    */
    {key: "weekdayFormat"},
    /**
        Formats the year beside each year block: a d3-time-format specifier,
        a function of the year's first day, or `false` for none. Defaults to `"%Y"`.
    */
    {key: "yearFormat"},
    /** Whether the chart zooms and pans. Off by default: every day is already in view. */
    {key: "zoom", default: false},
    {
      key: "colorScale",
      default: accessor("value"),
    },
    {
      key: "groupBy",
      factory: (viz: VizInstance) => [
        (d: DataPoint, i: number) => {
          const date = rowDate(viz, d, i);
          return date ? calendarDayKey(date) : d.id;
        },
      ],
    },
    {
      key: "label",
      coerce: "const",
      factory: (viz: VizInstance) => (d: DataPoint, i: number) => {
        const date = rowDate(viz, d, i);
        return date ? calendarDateFormat(viz)(date) : "";
      },
    },
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: D3plusConfig,
          arr: DataPoint[],
        ) => unknown;
        // Every day is its own group, so only a categorical color key earns a legend.
        return (config: D3plusConfig, arr: DataPoint[]) =>
          viz._legendCategories ? base.call(viz, config, arr) : false;
      },
    },
    /**
        Styles the weekday, month, and year labels: `fontColor`, `fontFamily`,
        `fontSize` (default `11`), and `fontWeight`. The color defaults to the
        chart's text color, softened toward the background.
    */
    {key: "calendarLabelConfig", merge: true, default: {}},
    /**
        Hovering a day outlines it without fading the other days
        (`hoverOpacity: 1`); hovering a colorScale bucket still fades the
        days outside it.
    */
    {key: "shapeConfig", merge: true, default: {hoverOpacity: 1}},
    /** Adds a "Value" row with the day's `colorScale` value to the tooltip. */
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [
          [
            () => viz.schema.translate("Value"),
            (d: DataPoint, i: number) => {
              const value = colorValue(viz, d, i);
              return value === undefined
                ? ""
                : formatAbbreviate(value, viz.schema.locale);
            },
          ],
        ],
      }),
    },
    /**
        Styles the month outlines: `stroke` (defaults to a tint of the chart's
        text color), `strokeWidth` (default `1`), and `strokeDasharray`.
    */
    {key: "monthOutlineConfig", merge: true, default: {}},
  ],
};

/**
    Draws one square cell per day in a calendar grid, each colored by its
    `colorScale` value: weekdays down the side and weeks across, one block per
    year, with month outlines and localized weekday, month, and year labels.
*/
export default makeChart(calendarDef);
