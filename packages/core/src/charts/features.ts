/**
    E2 (RFC §3.4): FeatureModule + layout engine. The chart-level
    drawSteps (title, subtitle, total, legend, timeline, colorScale,
    back) ship as `FeatureModule` values composed by `runLayout`, which
    performs **explicit margin negotiation** — each feature returns a
    `MarginClaim` + optional `panel` scene node + optional declarative
    `vizUpdate` writes, and the engine accumulates margins across
    features in order.

    Status: **production v4 surface.** Every Plot-family + chart-shell
    feature here is wired into `vizDrawPure` via `runLayout(ctx, [...
    features])`. Legacy `drawSteps/*.bind(this)` free-functions have
    been retired in favor of these modules.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {extent, min, rollup, sum} from "d3-array";
import {select} from "d3-selection";

import {merge, unique} from "@d3plus/data";
import type {DataPoint, MergedDataPoint} from "@d3plus/data";
import {date, elem, stylize} from "@d3plus/dom";

import type {SceneNode} from "@d3plus/render";

import {configPrep} from "../utils/index.js";

import type {VizContext} from "./stages.js";

/** A margin claim, in pixels along each side. Unclaimed sides default to 0. */
export interface MarginClaim {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** The shape a `layout` step returns: optional panel node + margin claim + optional viz writebacks. */
export interface FeatureLayout {
  panel: SceneNode | null;
  margin: MarginClaim;
  /**
      v4 purity: features that need to publish CROSS-FEATURE state — a
      write that a DIFFERENT feature or downstream stage will read — return
      those writes here as declarative key→value pairs. `runLayout`
      applies them to viz after the layout call so the next feature in
      the chain sees them.

      Key convention: keys are auto-prefixed with `_` to match viz's
      internal field convention. Return `{drawDepth: 2}` to write
      `viz._drawDepth`; explicitly-underscored keys (`{_drawDepth: 2}`)
      pass through unchanged for the rare case where the engine
      shouldn't prepend. This rule exists because a leading underscore
      is easy to forget and writing `viz.drawDepth` (no underscore) is
      almost never what callers want.

      Intra-feature local writes (a feature setting state that its OWN
      component instance reads inside the same `layout()` body) are
      legitimate direct mutations on viz — `vizUpdate` would defer the
      write past the local read. legendFeature's `_legendDepth` is an
      example of an intra-feature local; timelineFeature's
      `_timelineSelection` similarly mutates from its event handler
      context. The contract is about CROSS-feature mutation, not all
      mutation.
  */
  vizUpdate?: Record<string, any>;
}

/**
    @interface FeatureModule
    A chart-level component (title, subtitle, total, legend, timeline,
    colorScale, back, attribution) expressed as a pure value. Each feature:
      - contributes config keys to the chart's schema (`configFields`),
      - optionally derives extra fields onto the pipeline context (`derive`),
      - optionally claims a margin region + emits its panel scene (`layout`),
      - optionally registers event reducers (`events`).
*/
export interface FeatureModule {
  name: string;
  /** Keys the chart's config inherits from this feature (used by E4 fluent gen). */
  configFields?: string[];
  /** Extra derivations to add into the pipeline context. */
  derive?: (ctx: VizContext) => Partial<VizContext>;
  /**
      Pure layout: read the (possibly updated-by-earlier-features) context and
      return the panel scene + margin this feature claims. The layoutEngine
      threads the margin claims through `ctx.layoutMargin` so a feature can
      read what earlier features already took.
  */
  layout?: (
    ctx: VizContext & {layoutMargin: Required<MarginClaim>},
  ) => FeatureLayout;
  /**
      Event reducers `(ctx, event) => Partial<VizConfig>`. Fire when a
      user interaction occurs on a node tagged with this feature's name.
  */
  events?: Record<string, (ctx: VizContext, event: unknown) => unknown>;
}

/**
    Result of running a list of features through the layout engine.
*/
export interface LayoutResult {
  /** Panel nodes in feature order, ready to compose into the scene root. */
  panels: SceneNode[];
  /** Final margin after every feature claimed its space. */
  margin: Required<MarginClaim>;
}

/**
    The allowed values for `legendPosition` and `colorScalePosition`.
    `false` means "hidden" (the feature still runs to tear down DOM); the
    four strings are the four sides.
*/
export type PanelPosition = false | "top" | "right" | "bottom" | "left";

const VALID_POSITIONS: ReadonlySet<PanelPosition | string> = new Set([
  false as unknown as string,
  "top",
  "right",
  "bottom",
  "left",
]);

/**
    Canonical sanitizer for `legendPosition` / `colorScalePosition`.
    Falls back to `"bottom"` when the user-supplied accessor returns
    something outside the allowed set. Single source of truth — used by
    `vizDrawPure` (for sanitized ctx publication) and by `legendFeature`
    + `colorScaleFeature` (for their internal positioning math).
*/
export function sanitizePosition(raw: unknown): PanelPosition {
  return (VALID_POSITIONS.has(raw as string) ? raw : "bottom") as PanelPosition;
}

/**
    Runs each feature's `layout` in order, accumulating margin claims so that
    later features see the space already taken by earlier ones. The order of
    `features` is the layout order — this is how implicit `this._margin +=`
    side effects from the legacy drawSteps become *explicit* data flow.

    Today's order in `Viz._draw` (`drawTitle`, `drawSubtitle`, `drawTotal`,
    `drawBack`, `drawAttribution`, `drawColorScale`, `drawLegend`,
    `drawTimeline`) should be ported verbatim as the default sequence — port
    the math first, then improve.
*/
export function runLayout(
  ctx: VizContext,
  features: FeatureModule[],
): LayoutResult {
  const margin: Required<MarginClaim> = {top: 0, right: 0, bottom: 0, left: 0};
  const panels: SceneNode[] = [];
  for (const f of features) {
    if (!f.layout) continue;
    const result = f.layout({...ctx, layoutMargin: {...margin}});
    const {panel, margin: claim, vizUpdate} = result;
    if (panel) panels.push(panel);
    margin.top += claim.top ?? 0;
    margin.right += claim.right ?? 0;
    margin.bottom += claim.bottom ?? 0;
    margin.left += claim.left ?? 0;
    // v4 purity: features publish cross-feature viz writes declaratively
    // via `vizUpdate`. The engine applies them — features don't mutate
    // viz directly from layout(). Skips own component-instance config
    // calls (those are local mutation, not cross-feature). Use
    // `Object.keys` (not `for...in`) so inherited enumerable properties
    // on a class-instance vizUpdate don't leak onto viz.
    //
    // Key convention: keys are auto-prefixed with `_` to land on the
    // viz's internal field convention (`viz._drawDepth`, `viz._legendDepth`).
    // Features should return UNPREFIXED keys (`{drawDepth: 2}`); the
    // engine normalizes — so feature authors can't accidentally write
    // `viz.drawDepth` (a different non-underscore property) instead of
    // `viz._drawDepth`. Keys that already start with `_` are passed
    // through unchanged so future explicit-internal writes still work.
    if (vizUpdate && ctx.viz) {
      const target = ctx.viz as Record<string, unknown>;
      for (const k of Object.keys(vizUpdate)) {
        const key = k.startsWith("_") ? k : `_${k}`;
        target[key] = vizUpdate[k];
      }
    }
  }
  return {panels, margin};
}

/* --------------------------- text-block features --------------------------- */

/**
    Shared layout logic for any "single line of text claiming margin.top" feature
    (title, subtitle, total). Each feature passes the viz fields that source its
    text + TextBox + config; the helper computes the panel + margin claim using
    the TextBox's pure `_textData()` (no DOM).
*/
function textBlockLayout(
  ctx: VizContext & {layoutMargin: Required<MarginClaim>},
  opts: {
    panelKey: string;
    getText: (viz: any) => string | false;
    textClassKey: string; // e.g. "_titleClass"
    configKey: string; // schema key, e.g. "titleConfig"
    paddingMethod: string; // schema key, e.g. "titlePadding"
  },
): FeatureLayout {
  const {viz, layoutMargin} = ctx;
  const text = opts.getText(viz);
  if (!text) return {panel: null, margin: {}};

  const usesPadding = (viz.schema[opts.paddingMethod] as () => boolean)();
  const padding = usesPadding
    ? viz._padding
    : {top: 0, right: 0, bottom: 0, left: 0};
  const width =
    viz.schema.width -
    (viz._margin.left + viz._margin.right + padding.left + padding.right);

  const textClass = viz[opts.textClassKey];
  textClass
    .data([{text}])
    .locale(viz.schema.locale)
    .width(width)
    .config(viz.schema[opts.configKey]);
  const boxes = textClass._textData() as Array<{
    lines: string[];
    lH: number;
    fS: number;
    fF: string;
    fC: string;
    fO: number;
    tA: string;
    widths: number[];
  }>;
  if (!boxes.length) return {panel: null, margin: {}};
  const box = boxes[0];

  const x = layoutMargin.left + padding.left;
  const y = layoutMargin.top;
  const lineHeight = box.lH;
  const blockPadding = (viz.schema[opts.configKey]?.padding as number) ?? 0;
  const height = box.lines.length * lineHeight + blockPadding * 2;

  const lines = box.lines.map((str: string, i: number) => ({
    text: str,
    x:
      box.tA === "middle"
        ? width / 2
        : box.tA === "end"
          ? width
          : 0,
    y: (i + 1) * lineHeight - (lineHeight - box.fS),
    width: box.widths?.[i] ?? 0,
  }));

  const panel: SceneNode = {
    type: "text",
    key: opts.panelKey,
    x: 0,
    y: 0,
    lines,
    font: {
      family: box.fF,
      size: box.fS,
      anchor:
        box.tA === "middle" || box.tA === "end" || box.tA === "start"
          ? (box.tA as "middle" | "end" | "start")
          : "start",
      baseline: "alphabetic",
    },
    paint: {fill: box.fC, opacity: box.fO},
    transform: {x, y},
  };

  return {panel, margin: {top: height}};
}

/**
    Converts `drawTitle.ts` to a FeatureModule. The legacy free function
    mutated `this._margin.top` as a side effect after rendering via getBBox.
    The feature uses `_titleClass._textData()` for height (pure compute, no
    DOM) and returns the margin claim explicitly.
*/
export const titleFeature: FeatureModule = {
  name: "title",
  configFields: ["title", "titleConfig", "titlePadding"],
  layout: ctx =>
    textBlockLayout(ctx, {
      panelKey: "viz-title",
      getText: viz => (viz.schema.title ? viz.schema.title(viz._filteredData || []) : false),
      textClassKey: "_titleClass",
      configKey: "titleConfig",
      paddingMethod: "titlePadding",
    }),
};

/** Converts `drawSubtitle.ts` to a FeatureModule. Mirrors titleFeature. */
export const subtitleFeature: FeatureModule = {
  name: "subtitle",
  configFields: ["subtitle", "subtitleConfig", "subtitlePadding"],
  layout: ctx =>
    textBlockLayout(ctx, {
      panelKey: "viz-subtitle",
      getText: viz => (viz.schema.subtitle ? viz.schema.subtitle(viz._filteredData || []) : false),
      textClassKey: "_subtitleClass",
      configKey: "subtitleConfig",
      paddingMethod: "subtitlePadding",
    }),
};

/**
    Converts `drawBack.ts` to a FeatureModule. Visible only when there are
    drill-down history entries; emits a "← Back" TextNode at the chart's
    top-left and claims its line height + padding × 2 from `margin.top`.
*/
export const backFeature: FeatureModule = {
  name: "back",
  configFields: ["backConfig"],
  layout: ({viz, layoutMargin}) => {
    if (!viz._history || !viz._history.length) return {panel: null, margin: {}};

    const text = `← ${viz.schema.translate("Back")}`;
    viz._backClass.data([{text, x: 0, y: 0}]).config(viz.schema.backConfig);
    const boxes = viz._backClass._textData() as Array<{
      lines: string[];
      lH: number;
      fS: number;
      fF: string;
      fC: string;
      fO: number;
      tA: string;
      widths: number[];
    }>;
    // _backClass might have a fontSize/padding only style (no wrapping data),
    // in which case _textData may be empty; fall back to direct accessor reads
    // for the margin claim to match drawBack's math precisely.
    const fontSize = viz._backClass.fontSize()();
    const padding = viz._backClass.padding()();
    const height = fontSize + padding * 2;

    if (!boxes.length) {
      return {panel: null, margin: {top: height}};
    }
    const box = boxes[0];

    const panel: SceneNode = {
      type: "text",
      key: "viz-back",
      x: 0,
      y: 0,
      lines: box.lines.map((str, i) => ({
        text: str,
        x: 0,
        y: (i + 1) * box.lH - (box.lH - box.fS),
        width: box.widths?.[i] ?? 0,
      })),
      font: {family: box.fF, size: box.fS, baseline: "alphabetic"},
      paint: {fill: box.fC, opacity: box.fO},
      transform: {x: layoutMargin.left, y: layoutMargin.top},
    };
    return {panel, margin: {top: height}};
  },
};

/* -------------------------------- Legend --------------------------------- */

const legendAttrs = ["fill", "opacity", "texture"];

/**
    Converts `drawLegend.ts` to a FeatureModule.

    Layout responsibility: roll filtered data up by paint attributes, configure
    + render the chart's `_legendClass` Legend instance (compute mode — Legend
    contributes to the scene via its `toScene()` collected on Viz.toScene),
    and return the margin claim corresponding to its outerBounds + padding.
    No panel SceneNode is emitted — Legend is a component, not a panel; the
    scene composition for Legend happens via Viz.toScene's `components` array.
*/
export const legendFeature: FeatureModule = {
  name: "legend",
  configFields: ["legend", "legendConfig", "legendPadding", "legendPosition", "legendSort"],
  layout: ({viz, layoutMargin}) => {
    // Source: `_legendData` from the rollupAndFilter pipeline stage — same
    // arg drawLegend received via `drawLegend.bind(this)(this._legendData)`.
    const data: DataPoint[] = viz._legendData || [];
    const legendData: DataPoint[] = [];

    const getAttr = (d: DataPoint, i: number, attr: string): string => {
      const shape = viz.schema.shape(d, i);
      if (attr === "fill" && shape === "Line") attr = "stroke";
      const value =
        viz.schema.shapeConfig[shape] && viz.schema.shapeConfig[shape][attr]
          ? viz.schema.shapeConfig[shape][attr]
          : viz.schema.shapeConfig[attr];
      return typeof value === "function" ? value.bind(viz)(d, i) : value;
    };

    const fill = (d: DataPoint, i: number): string =>
      legendAttrs.map(a => getAttr(d, i, a)).join("_");

    const rollupData = viz.schema.colorScale
      ? data.filter(
          (d: DataPoint, i: number) => viz.schema.colorScale(d, i) === undefined,
        )
      : data;
    rollup(
      rollupData,
      (leaves: DataPoint[]) =>
        legendData.push(merge(leaves, viz.schema.aggs) as unknown as DataPoint),
      fill,
    );

    legendData.sort(viz.schema.legendSort);

    const labels = legendData.map((d: DataPoint, i: number) =>
      viz._ids(d, i).slice(0, viz._drawDepth + 1),
    );
    // viz._legendDepth: the legend's drill-down depth (lowest unique
    // groupBy level). Computed and written here BEFORE the
    // `viz._legendClass.render()` call below, because that render
    // invokes `legendLabel.bind(viz)` (Viz.ts:217) which reads
    // `viz._legendDepth` live to format each legend entry. The write
    // is INTRA-FEATURE state — it's owned by legendFeature, consumed
    // by legendFeature's own component instance. `FeatureLayout.vizUpdate`
    // is the CROSS-feature publishing channel (for state OTHER features
    // need); intra-feature writes that the same feature reads in its own
    // body legitimately live on viz directly, which is what's happening
    // here. Downstream consumers (BarChart.ts:28, Viz.ts:210, legendLabel)
    // observe the value after layout completes — same as before.
    viz._legendDepth = 0;
    for (let x = 0; x <= viz._drawDepth; x++) {
      const values = labels.map((l: string[]) => l[x]);
      if (
        !values.some((v: string | string[]) => Array.isArray(v)) &&
        Array.from(new Set(values)).length === legendData.length
      ) {
        viz._legendDepth = x;
        break;
      }
    }

    const hidden = (d: DataPoint, i: number): boolean => {
      let id = viz._id(d, i);
      if (Array.isArray(id)) id = id[0];
      return (
        viz._hidden.includes(id) ||
        (viz._solo.length && !viz._solo.includes(id))
      );
    };

    // Pre-render bounds capture is what drawLegend used to compute the margin
    // *claim* — the previous render's outerBounds; on first render it's zero
    // and Legend re-flows on the second render with the real space. This is
    // the legacy behavior, preserved here so visual output is identical.
    const legendBounds = viz._legendClass.outerBounds();
    const config = viz.config();
    const position = sanitizePosition(viz.schema.legendPosition.bind(viz)(config));
    const wide = ["top", "bottom"].includes(position as string);
    const padding = viz.schema.legendPadding()
      ? viz._padding
      : {top: 0, right: 0, bottom: 0, left: 0};
    const transform = {
      transform: `translate(${
        wide ? viz._margin.left + padding.left : viz._margin.left
      }, ${wide ? viz._margin.top : viz._margin.top + padding.top})`,
    };
    // `visible` gates the legend group's DOM presence + data binding.
    // `position === false` forces it off so `.legendPosition(false)` is
    // an actual hide signal: the legend's render runs against [] data,
    // which exits any prior DOM and emits no scene.
    const visible =
      position === false ? false : viz.schema.legend.bind(viz)(config, legendData);

    // The Legend instance still renders into a `g.d3plus-viz-legend` group as
    // a child of the chart's svg. This group is created via the legacy `elem`
    // helper so the Legend has a DOM `_select` (its `toScene()` walks from
    // there). Once Legend is fully compute-only the elem wrapper can go.
    const legendGroup = elem("g.d3plus-viz-legend", {
      condition: visible && !viz.schema.legendConfig.select,
      enter: transform,
      parent: viz._select,
      duration: viz.schema.duration,
      update: transform,
    }).node();

    viz._legendClass
      .renderMode("compute")
      .id(fill)
      .align(wide ? "center" : position)
      .direction(wide ? "row" : "column")
      .duration(viz.schema.duration)
      .data(visible ? legendData : [])
      .height(
        wide
          ? viz.schema.height - (viz._margin.bottom + viz._margin.top)
          : viz.schema.height -
              (viz._margin.bottom + viz._margin.top + padding.bottom + padding.top),
      )
      .locale(viz.schema.locale)
      .parent(viz)
      .select(legendGroup)
      .shape((d: DataPoint, i: number) =>
        viz.schema.shape(d, i) === "Circle" ? "Circle" : "Rect",
      )
      .verticalAlign(!wide ? "middle" : position)
      .width(
        wide
          ? viz.schema.width -
              (viz._margin.left + viz._margin.right + padding.left + padding.right)
          : viz.schema.width - (viz._margin.left + viz._margin.right),
      )
      .shapeConfig((configPrep as any).bind(viz)(viz.schema.shapeConfig, "legend"))
      .shapeConfig({
        fill: (d: DataPoint, i: number) =>
          hidden(d, i) ? viz.schema.hiddenColor(d, i) : getAttr(d, i, "fill"),
        labelConfig: {
          fontOpacity: (d: DataPoint, i: number) =>
            hidden(d, i) ? viz.schema.hiddenOpacity(d, i) : 1,
        },
      })
      .config(viz.schema.legendConfig)
      .render();

    // Margin claim from the *previous* render's outerBounds. This is the
    // legacy behavior — `outerBounds()` reads stored state, so on the first
    // render the claim is zero and Legend overlaps the chart for one frame;
    // the next render flows with full margin. Preserved verbatim to keep the
    // post-conversion pixels identical.
    const margin: Record<string, number> = {};
    if (!viz.schema.legendConfig.select && legendBounds.height) {
      if (wide)
        margin[position as string] = legendBounds.height + viz._legendClass.padding() * 2;
      else
        margin[position as string] = legendBounds.width + viz._legendClass.padding() * 2;
    }
    // The `layoutMargin` argument is the cumulative claim from earlier features;
    // the runLayout engine will accumulate this feature's claim into it. We
    // don't read it here directly — drawLegend used `viz._margin.left` etc.,
    // which the engine already wrote through.
    void layoutMargin;
    return {panel: null, margin};
  },
};

/* -------------------------------- Timeline ------------------------------- */

/**
    Helper mirroring drawTimeline's `setTimeFilter`. Triggers a re-render when
    the brush selection changes — kept here so the feature owns its event flow.
*/
function setTimeFilter(viz: any, s: Date | Date[] | number[]): void {
  if (!Array.isArray(s)) s = [s, s] as Date[];
  if (JSON.stringify(s) !== JSON.stringify(viz._timelineSelection)) {
    viz._timelineSelection = s;
    const nums = (s as Array<Date | number>).map(Number) as number[];
    (viz.timeFilter((d: DataPoint) => {
      const ms = (date(viz.schema.time(d)) as Date).getTime();
      return ms >= nums[0] && ms <= nums[1];
    }) as any).render();
  }
}

/**
    Converts `drawTimeline.ts` to a FeatureModule.

    Visible only when `_time` is set, `_timeline` is truthy, and there is more
    than one distinct tick. Renders the chart's `_timelineClass` Timeline
    instance (compute mode — scene comes from Timeline.toScene via Viz.toScene's
    components collection) and claims `margin.bottom` from its outerBounds.
*/
export const timelineFeature: FeatureModule = {
  name: "timeline",
  configFields: ["timeline", "timelineConfig", "timelinePadding"],
  layout: ({viz}) => {
    let timelinePossible = viz.schema.time && viz.schema.timeline;
    const ticks = (
      timelinePossible
        ? unique(viz._data.map(viz.schema.time)).map(
            (d: unknown) => date(d as string | number),
          )
        : []
    ) as Date[];
    timelinePossible = timelinePossible && ticks.length > 1;
    const padding = viz.schema.timelinePadding()
      ? viz._padding
      : {top: 0, right: 0, bottom: 0, left: 0};

    const transform = {
      transform: `translate(${viz._margin.left + padding.left}, 0)`,
    };

    const timelineGroup = elem("g.d3plus-viz-timeline", {
      condition: timelinePossible,
      enter: transform,
      parent: viz._select,
      duration: viz.schema.duration,
      update: transform,
    }).node();

    if (!timelinePossible) return {panel: null, margin: {}};

    const data: DataPoint[] = viz._filteredData || [];
    const timeline = viz._timelineClass
      .renderMode("compute")
      .domain(extent(ticks) as [Date, Date])
      .duration(viz.schema.duration)
      .height(viz.schema.height - viz._margin.bottom)
      .locale(viz.schema.locale)
      .select(timelineGroup)
      .ticks(ticks.sort((a: Date, b: Date) => +a - +b))
      .width(
        viz.schema.width -
          (viz._margin.left + viz._margin.right + padding.left + padding.right),
      );

    const dataExtent = extent(
      data
        .map(viz.schema.time)
        .map((d: unknown) => date(d as string | number)) as Date[],
    ) as [Date, Date];
    if (!viz._timelineSelection) {
      viz._timelineSelection = viz.schema.timelineDefault || dataExtent;
    } else {
      if (viz._timelineSelection[0] < dataExtent[0])
        viz._timelineSelection[0] = dataExtent[0];
      if (viz._timelineSelection[1] > dataExtent[1])
        viz._timelineSelection[1] = dataExtent[1];
    }
    timeline.selection(viz._timelineSelection);

    const config = viz.schema.timelineConfig;
    timeline
      .config(config)
      .on("brush", (s: Date[]) => {
        setTimeFilter(viz, s);
        if (config.on && config.on.brush) config.on.brush(s);
      })
      .on("end", (s: Date[]) => {
        setTimeFilter(viz, s);
        if (config.on && config.on.end) config.on.end(s);
      })
      .render();

    return {
      panel: null,
      margin: {bottom: timeline.outerBounds().height + timeline.padding() * 2},
    };
  },
};

/* ------------------------------- ColorScale ------------------------------ */

/**
    Converts `drawColorScale.ts` to a FeatureModule.

    Visible only when `_colorScale` is truthy and `_colorScalePosition` resolves
    to a side. Renders the chart's `_colorScaleClass` ColorScale instance and
    claims margin along its position side.
*/
export const colorScaleFeature: FeatureModule = {
  name: "colorScale",
  configFields: [
    "colorScale",
    "colorScaleConfig",
    "colorScaleMaxSize",
    "colorScalePadding",
    "colorScalePosition",
  ],
  layout: ({viz}) => {
    const data = Array.from(
      rollup(
        viz._data,
        (leaves: DataPoint[]) => merge(leaves, viz.schema.aggs),
        (d: DataPoint, i: number) =>
          `${viz.schema.time ? viz.schema.time(d, i) : "all"}-${viz._ids(d, i).join("_")}`,
      ).values(),
    );

    const position = sanitizePosition(viz.schema.colorScalePosition.bind(viz)(viz.config()));
    const wide = ["top", "bottom"].includes(position as string);
    const showColorScale = viz.schema.colorScale && position;
    const padding = viz.schema.colorScalePadding()
      ? viz._padding
      : {top: 0, right: 0, bottom: 0, left: 0};

    const availableWidth =
      viz.schema.width - (viz._margin.left + viz._margin.right + padding.left + padding.right);
    const width = wide
      ? min([viz.schema.colorScaleMaxSize, availableWidth])!
      : viz.schema.width - (viz._margin.left + viz._margin.right);

    const availableHeight =
      viz.schema.height - (viz._margin.bottom + viz._margin.top + padding.bottom + padding.top);
    const height = !wide
      ? min([viz.schema.colorScaleMaxSize, availableHeight])!
      : viz.schema.height - (viz._margin.bottom + viz._margin.top);

    const transform = {
      opacity: position ? 1 : 0,
      transform: `translate(${
        wide
          ? viz._margin.left + padding.left + (availableWidth - width) / 2
          : viz._margin.left
      }, ${
        wide
          ? viz._margin.top
          : viz._margin.top + padding.top + (availableHeight - height) / 2
      })`,
    };

    const scaleGroup = elem("g.d3plus-viz-colorScale", {
      condition: showColorScale && !viz.schema.colorScaleConfig.select,
      enter: transform,
      parent: viz._select,
      duration: viz.schema.duration,
      update: transform,
    }).node();

    if (!viz.schema.colorScale) return {panel: null, margin: {}};

    const scaleData = data.filter((d: MergedDataPoint, i: number) => {
      const c = viz.schema.colorScale(d as unknown as DataPoint, i);
      return c !== undefined && c !== null;
    });

    viz._colorScaleClass
      .align(
        ({bottom: "end", left: "start", right: "end", top: "start"} as Record<string, string>)[
          position as string
        ] || "bottom",
      )
      .duration(viz.schema.duration)
      .data(scaleData)
      .height(height)
      .locale(viz.schema.locale)
      .orient(position)
      .select(scaleGroup)
      .value(viz.schema.colorScale)
      .width(width)
      .config(viz.schema.colorScaleConfig)
      .render();

    const margin: Record<string, number> = {};
    if (showColorScale) {
      const scaleBounds = viz._colorScaleClass.outerBounds();
      if (!viz.schema.colorScaleConfig.select && scaleBounds.height) {
        // Use the colorScale's OWN padding for its margin claim. Legacy
        // drawColorScale read `viz._legendClass.padding()` here — a
        // faithful-port carry-over that meant a custom legendPadding
        // would shift the colorScale's claim even with the legend
        // hidden. The colorScale class is the source of truth.
        const csPadding =
          typeof viz._colorScaleClass.padding === "function"
            ? viz._colorScaleClass.padding()
            : viz._legendClass.padding();
        if (wide) margin[position] = scaleBounds.height + csPadding * 2;
        else margin[position] = scaleBounds.width + csPadding * 2;
      }
    }
    return {panel: null, margin};
  },
};

/* ------------------------------ Attribution ------------------------------ */

/**
    Converts `drawAttribution.ts` to a FeatureModule.

    Attribution is an HTML `<div>` overlay positioned absolutely outside the SVG
    plane — it doesn't fit naturally as a SceneNode in the chart scene graph.
    Rather than encode an HTML overlay into the scene graph, this feature runs
    the legacy DOM-creating side effect imperatively from inside `layout()`, so
    invocation is still funneled through `runLayout` for consistency with the
    other features. It claims zero margin and emits no panel.
*/
export const attributionFeature: FeatureModule = {
  name: "attribution",
  configFields: ["attribution", "attributionStyle"],
  layout: ({viz}) => {
    let attr: any = select(viz._select.node().parentNode)
      .selectAll("div.d3plus-attribution")
      .data(viz.schema.attribution ? [0] : []);

    const attrEnter = attr
      .enter()
      .append("div")
      .attr("class", "d3plus-attribution");

    attr.exit().remove();

    attr = attr
      .merge(attrEnter)
      .style("position", "absolute")
      .html(viz.schema.attribution)
      .style("right", `${viz._margin.right}px`)
      .style("bottom", `${viz._margin.bottom}px`)
      .call(stylize as never, viz.schema.attributionStyle);

    return {panel: null, margin: {}};
  },
};

/**
    Converts `drawTotal.ts` to a FeatureModule. Slightly different from title/
    subtitle: the text comes from `sum()` over the filtered data when `_total`
    is a function, or from `sum(data.map(_size))` when `_total === true`.
*/
export const totalFeature: FeatureModule = {
  name: "total",
  configFields: ["total", "totalConfig", "totalFormat", "totalPadding"],
  layout: ctx =>
    textBlockLayout(ctx, {
      panelKey: "viz-total",
      getText: viz => {
        const data = viz._filteredData || [];
        const total =
          typeof viz.schema.total === "function"
            ? sum(data.map(viz.schema.total))
            : viz.schema.total === true && viz._size
              ? sum(data.map(viz._size))
              : false;
        return total ? viz.schema.totalFormat(total) : false;
      },
      textClassKey: "_totalClass",
      configKey: "totalConfig",
      paddingMethod: "totalPadding",
    }),
};
