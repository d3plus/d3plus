/**
    Axis tooltips: hovering an axis's title or one of its tick labels shows
    the chart's tooltip, with the text the axis's `titleTooltip` or
    `tickTooltip` gives. A label drawn cut short heads the tooltip with its
    whole text, so an axis that sets neither option still shows what its
    cut labels say.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneEvent} from "@d3plus/render";

import {axisTooltipTarget} from "../../components/Axis/axisTooltipTargets.js";
import type {AxisTooltipTarget} from "../../components/Axis/axisTooltipTargets.js";
import {isPlainObject} from "../../fluent.js";
import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {constantValue} from "../../utils/constant.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** What an axis tooltip shows. */
export interface AxisTooltipContent {
  /** The label's whole text when it is drawn cut short, else `false`. */
  title: string | false;
  /** The text the axis option gives, else `false`. */
  body: string | false;
  /** The tooltip config the axis option gives, its accessors bound to the label. */
  config?: Record<string, unknown>;
}

/**
    A copy of a config value whose functions, at any depth, are called with
    `args` whatever they are passed.
    @param value A config object, or any value in one.
    @param args What every function in it receives.
*/
export function bindAccessors(value: unknown, args: unknown[]): unknown {
  if (typeof value === "function")
    return function (this: unknown): unknown {
      return value.apply(this, args);
    };
  if (Array.isArray(value)) return value.map(v => bindAccessors(v, args));
  if (isPlainObject(value))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, bindAccessors(v, args)]),
    );
  return value;
}

/** Whether a function's result is text to show. */
const hasText = (text: unknown): boolean =>
  text !== undefined && text !== null && text !== false && text !== "";

/**
    What hovering an axis label shows, from the axis's `titleTooltip` or
    `tickTooltip`: a string is the body, a function returns it (given the
    title, or the tick's value and index), and an object is a tooltip config
    whose accessors receive the same. A label drawn cut short adds its whole
    text as the title. Null when there is nothing to show: the option is
    `false`, or the label is drawn whole and the option is unset or its
    function returns nothing.
    @param target The hovered label.
    @param fullText Whether a cut label shows its whole text.
    @param self The `this` the option's function is called with.
*/
export function resolveAxisTooltip(
  target: AxisTooltipTarget,
  fullText = true,
  self?: unknown,
): AxisTooltipContent | null {
  const {option, part, value, index} = target;
  if (option === false) return null;
  const title = target.truncated && fullText ? target.text : false;
  const args = part === "title" ? [value] : [value, index];
  if (isPlainObject(option))
    return {
      title,
      body: false,
      config: bindAccessors(option, args) as Record<string, unknown>,
    };
  const text =
    typeof option === "function"
      ? option.apply(self, args)
      : typeof option === "string"
        ? option
        : undefined;
  const body = hasText(text) ? `${text}` : false;
  return title === false && body === false ? null : {title, body};
}

/** The data of the axis tooltips shown, which tell them from a mark's or legend's. */
const shownData = new WeakSet<object>();

/**
    Whether a tooltip datum is an axis tooltip's.
    @param d The first of a tooltip's data.
*/
export function isAxisTooltipDatum(d: unknown): boolean {
  return typeof d === "object" && d !== null && shownData.has(d);
}

/** Whether the chart's tooltip is showing an axis tooltip. */
function showing(viz: VizInstance): boolean {
  return isAxisTooltipDatum(viz._tooltipClass?.data()[0]);
}

/** The client position of a pointer event: the tooltip's anchor. */
function pointer(event: SceneEvent): number[] {
  const native = event.nativeEvent as (MouseEvent & TouchEvent) | undefined;
  return native && native.touches && native.touches.length
    ? [native.touches[0].clientX, native.touches[0].clientY]
    : native
      ? [native.clientX, native.clientY]
      : event.point;
}

/**
    Shows the chart's tooltip for an axis label at the pointer: the chart's
    `tooltipConfig` for its styles, then the label's title and body in place
    of a mark's, then the axis option's own config. The tooltip's settings
    are put back once it is drawn, so a mark's or legend's tooltip never
    inherits them.
*/
function renderAxisTooltip(
  viz: VizInstance,
  target: AxisTooltipTarget,
  content: AxisTooltipContent,
  event: SceneEvent,
): void {
  const tip = viz._tooltipClass!;
  const prep = configPrep.bind(viz as unknown as ConfigPrepHost);
  const {part, value, index, text} = target;
  const datum = {part, value, index, text};
  shownData.add(datum);
  const saved = {...tip.schema};
  tip
    .data([datum as unknown as DataPoint])
    .config(prep(viz.schema.tooltipConfig))
    .title(content.title)
    .body(content.body)
    .footer(false)
    .thead([])
    .tbody([])
    .position(pointer(event));
  // A title with nothing under it needs no gap below.
  if (!content.config && content.body === false)
    tip.titleStyle({"margin-bottom": "0"});
  if (content.config) tip.config(prep(content.config));
  tip.render();
  for (const key of Object.keys(tip.schema))
    if (!(key in saved)) delete tip.schema[key];
  Object.assign(tip.schema, saved);
}

/**
    Shows, moves, or hides the axis tooltip for a pointer event. Moving onto
    a label with something to show (see `resolveAxisTooltip`) shows it at the
    pointer; moving anywhere else, or leaving the chart, hides it when it is
    still the tooltip showing. Charts with `tooltip: false` skip the whole
    text of cut labels, and show only what an axis option gives. Labels show
    nothing while a transition is in flight.
    @param viz The chart.
    @param event The pointer event.
    @returns Whether an axis tooltip is showing for the event.
*/
export function handleAxisTooltip(
  viz: VizInstance,
  event: SceneEvent,
): boolean {
  if (!viz._tooltipClass) return false;
  const moving = event.type === "mousemove" || event.type === "mouseenter";
  if (!moving && event.type !== "mouseleave") return false;
  const settled = !viz._transitionEndsAt || Date.now() >= viz._transitionEndsAt;
  const target =
    moving && settled ? axisTooltipTarget(event.pick?.node) : undefined;
  const fullText = constantValue(viz.schema.tooltip)?.value !== false;
  const content = target && resolveAxisTooltip(target, fullText, viz);
  if (target && content) {
    renderAxisTooltip(viz, target, content, event);
    return true;
  }
  if (showing(viz)) viz._tooltipClass.data([]).render();
  return false;
}
