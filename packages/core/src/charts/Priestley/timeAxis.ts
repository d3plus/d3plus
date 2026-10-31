/**
    Time helpers Priestley and Gantt share: the `start`/`end` accessor
    fields, the min/max aggregation seeds they register, date parsing for a
    time-scaled axis, and the time axis render that pushes the axis scene and
    returns its scale.
*/

import {min, max} from "d3-array";

import {date} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode, Transform} from "@d3plus/render";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {ConfigField} from "../../fluent.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A start or end value: a date on a time axis, a number otherwise. */
export type TimeValue = number | Date;

/** The Axis surface the time axis render drives. */
export interface TimeAxisLike {
  config: (c: unknown) => TimeAxisLike;
  measure: () => TimeAxisLike;
  renderMode: (m: string) => TimeAxisLike;
  select: (el: HTMLElement | undefined) => TimeAxisLike;
  render: () => TimeAxisLike;
  outerBounds: () => {height: number};
  toScene: () => {children?: unknown[]} | undefined;
  schema: {padding: number; orient?: string};
  _d3Scale: (v: TimeValue) => number;
}

/** Stores a function as given and wraps a data key in an accessor. */
const timeAccessor = (v: unknown): unknown =>
  typeof v === "function" ? v : fieldAccessor(v as string);

/** Registers `agg` for a data key that has no aggregation yet. */
const seedAgg =
  (agg: typeof min | typeof max) =>
  (viz: VizInstance, v: unknown): void => {
    const k = typeof v === "function" ? null : (v as string);
    if (k && !viz.schema.aggs[k]) viz.schema.aggs[k] = agg;
  };

/** The `start` and `end` accessor fields. */
export function timeFields(): ConfigField[] {
  return [
    /**
        Accessor function or string key for the end date of each data point. A
        key also aggregates grouped rows by their latest end.
        @type {string | function}
    */
    {
      key: "end",
      default: accessor("end"),
      coerce: timeAccessor,
      onSet: seedAgg(max),
    },
    /**
        Accessor function or string key for the start date of each data point. A
        key also aggregates grouped rows by their earliest start.
        @type {string | function}
    */
    {
      key: "start",
      default: accessor("start"),
      coerce: timeAccessor,
      onSet: seedAgg(min),
    },
  ];
}

/**
    Seeds the `start`/`end` reducers for the default accessors, which are
    functions the fields' `onSet` can't read a data key from, so the time
    domain spans min(start)…max(end) instead of summing them.
*/
export function seedTimeAggs(viz: VizInstance): void {
  if (!viz.schema.aggs.start) viz.schema.aggs.start = min;
  if (!viz.schema.aggs.end) viz.schema.aggs.end = max;
}

/** Whether the chart's `axisConfig` plots dates. */
export function isTimeAxis(viz: VizInstance): boolean {
  const axisConfig = viz.schema.axisConfig as {scale?: string} | undefined;
  return axisConfig?.scale === "time";
}

/**
    Reads a start or end value: parsed as a date on a time axis, else a
    number. Missing or unparseable values return null.
*/
export function parseTime(value: unknown, time: boolean): TimeValue | null {
  if (value === undefined || value === null || value === "") return null;
  if (time) {
    const d = date(value as string);
    return d instanceof Date && !isNaN(+d) ? d : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Where the time axis draws, in the chart scene's coordinates. */
export interface TimeAxisFrame {
  domain: number[];
  width: number;
  height: number;
  /** Where the axis group sits. */
  transform: Transform;
  /** The axis group's scene key. */
  key: string;
  /** Extra config applied after `axisConfig` (e.g. a Gantt's default orient). */
  config?: Record<string, unknown>;
}

/** The time axis's measured height and padding. */
export interface TimeAxisSize {
  height: number;
  padding: number;
}

/** Applies the axis frame's size and domain, then `frame.config` and `axisConfig`. */
const configure = (
  viz: VizInstance,
  axis: TimeAxisLike,
  frame: Pick<TimeAxisFrame, "domain" | "width" | "height" | "config">,
): TimeAxisLike =>
  axis
    .config({domain: frame.domain, height: frame.height, width: frame.width})
    .config(frame.config ?? {})
    .config(viz.schema.axisConfig);

/**
    Measures the chart's time axis (`viz.ctx.axisTest`) over `frame`: the
    height its ticks and labels take, and its padding.
*/
export function measureTimeAxis(
  viz: VizInstance,
  frame: Pick<TimeAxisFrame, "domain" | "width" | "height" | "config">,
): TimeAxisSize {
  const axisTest = viz.ctx.axisTest as TimeAxisLike;
  configure(viz, axisTest, frame).measure();
  return {
    height: axisTest.outerBounds().height,
    padding: axisTest.schema.padding,
  };
}

/**
    Renders the chart's time axis (`viz.ctx.axis`) over `frame`, pushes its
    scene onto `viz._chartScene` (with any extra `group` fields), and returns
    its scale.
*/
export function renderTimeAxis(
  viz: VizInstance,
  frame: TimeAxisFrame,
  group: Partial<SceneNode> = {},
): (v: TimeValue) => number {
  const axis = viz.ctx.axis as TimeAxisLike;
  configure(viz, axis, frame)
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .render();
  const axisScene = axis.toScene();
  if (axisScene) {
    (viz._chartScene ||= []).push({
      type: "group",
      key: frame.key,
      transform: frame.transform,
      children: (axisScene.children ?? []) as unknown as SceneNode[],
      ...group,
    } as SceneNode);
  }
  return axis._d3Scale;
}

/** Reads a row's raw start or end through the chart's accessor. */
export function rowTime(
  viz: VizInstance,
  key: "start" | "end",
  d: DataPoint,
  i: number,
): unknown {
  return (viz.schema[key] as (d: DataPoint, i: number) => unknown)(d, i);
}
