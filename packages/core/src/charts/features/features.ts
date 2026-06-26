/**
    FeatureModule + layout engine. The chart-level features (title,
    subtitle, total, legend, timeline, colorScale, back) are
    `FeatureModule` values composed by `runLayout`, which performs
    **explicit margin negotiation** — each feature returns a `MarginClaim`
    + optional `panel` scene node + optional declarative `vizUpdate`
    writes, and the engine accumulates margins across features in order.

    Every Plot-family + chart-shell feature here is wired into
    `vizDrawPure` via `runLayout(ctx, [...features])`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {extent, min, rollup, sum} from "d3-array";
import {select} from "d3-selection";

import {merge, unique} from "@d3plus/data";
import type {DataPoint, MergedDataPoint} from "@d3plus/data";
import {date, elem, stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import type {SceneNode} from "@d3plus/render";

import {resolveSpec} from "../pipeline/resolveSpec.js";
import type {VizContext} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

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
    side effects become *explicit* data flow.

    Today's order in `Viz._draw` (`drawTitle`, `drawSubtitle`, `drawTotal`,
    `drawBack`, `drawAttribution`, `drawColorScale`, `drawLegend`,
    `drawTimeline`) should be ported verbatim as the default sequence — port
    the math first, then improve.
*/
export function runLayout(
  ctx: VizContext,
  features: FeatureModule[],
  baseMargin: Required<MarginClaim> = {top: 0, right: 0, bottom: 0, left: 0},
): LayoutResult {
  // `claims` is this call's accumulated margin (the returned delta).
  // `layoutMargin` handed to each feature is the running TOTAL —
  // `baseMargin` (margin already taken by prior runLayout calls in the same
  // draw) plus the claims taken so far in this call — so a feature reads
  // the true current margin without touching viz._margin.
  const claims: Required<MarginClaim> = {top: 0, right: 0, bottom: 0, left: 0};
  const panels: SceneNode[] = [];
  for (const f of features) {
    if (!f.layout) continue;
    const layoutMargin: Required<MarginClaim> = {
      top: baseMargin.top + claims.top,
      right: baseMargin.right + claims.right,
      bottom: baseMargin.bottom + claims.bottom,
      left: baseMargin.left + claims.left,
    };
    const result = f.layout({...ctx, layoutMargin});
    const {panel, margin: claim, vizUpdate} = result;
    if (panel) panels.push(panel);
    claims.top += claim.top ?? 0;
    claims.right += claim.right ?? 0;
    claims.bottom += claim.bottom ?? 0;
    claims.left += claim.left ?? 0;
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
  return {panels, margin: claims};
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
    getText: (viz: VizInstance) => string | false;
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
    (layoutMargin.left + layoutMargin.right + padding.left + padding.right);

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
    Title as a FeatureModule. Uses `_titleClass._textData()` for height
    (pure compute, no DOM) and returns the margin claim explicitly.
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

export {legendFeature} from "./featuresLegend.js";

/* -------------------------------- Timeline ------------------------------- */

/**
    Helper mirroring drawTimeline's `setTimeFilter`. Triggers a re-render when
    the brush selection changes — kept here so the feature owns its event flow.
*/
function setTimeFilter(viz: VizInstance, s: Date | Date[] | number[]): void {
  if (!Array.isArray(s)) s = [s, s] as Date[];
  if (JSON.stringify(s) !== JSON.stringify(viz._timelineSelection)) {
    viz._timelineSelection = s;
    const nums = (s as Array<Date | number>).map(Number) as number[];
    viz
      .timeFilter!((d: DataPoint) => {
        const ms = (date(viz.schema.time(d)) as Date).getTime();
        return ms >= nums[0] && ms <= nums[1];
      })
      .render!();
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
  layout: ({viz, layoutMargin}) => {
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
      transform: `translate(${layoutMargin.left + padding.left}, 0)`,
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
      .height(viz.schema.height - layoutMargin.bottom)
      .locale(viz.schema.locale)
      .select(timelineGroup)
      .ticks(ticks.sort((a: Date, b: Date) => +a - +b))
      .width(
        viz.schema.width -
          (layoutMargin.left + layoutMargin.right + padding.left + padding.right),
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

    // Repaint the scene when playback toggles without moving the selection
    // (e.g. a manual pause), so the play/pause glyph refreshes immediately.
    timeline._onPlayToggle = () => viz._scheduleSceneRepaint();

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
  layout: ({viz, layoutMargin}) => {
    const data = Array.from(
      rollup(
        viz._data,
        (leaves: DataPoint[]) => merge(leaves, viz.schema.aggs),
        (d: DataPoint, i: number) =>
          `${viz.schema.time ? viz.schema.time(d, i) : "all"}-${viz._ids(d, i).join("_")}`,
      ).values(),
    );

    const position = sanitizePosition(viz.schema.colorScalePosition.bind(viz)(resolveSpec(viz)));
    const wide = ["top", "bottom"].includes(position as string);
    const showColorScale = viz.schema.colorScale && position;
    const padding = viz.schema.colorScalePadding()
      ? viz._padding
      : {top: 0, right: 0, bottom: 0, left: 0};

    const availableWidth =
      viz.schema.width - (layoutMargin.left + layoutMargin.right + padding.left + padding.right);
    const width = wide
      ? min([viz.schema.colorScaleMaxSize, availableWidth])!
      : viz.schema.width - (layoutMargin.left + layoutMargin.right);

    const availableHeight =
      viz.schema.height - (layoutMargin.bottom + layoutMargin.top + padding.bottom + padding.top);
    const height = !wide
      ? min([viz.schema.colorScaleMaxSize, availableHeight])!
      : viz.schema.height - (layoutMargin.bottom + layoutMargin.top);

    const transform = {
      opacity: position ? 1 : 0,
      transform: `translate(${
        wide
          ? layoutMargin.left + padding.left + (availableWidth - width) / 2
          : layoutMargin.left
      }, ${
        wide
          ? layoutMargin.top
          : layoutMargin.top + padding.top + (availableHeight - height) / 2
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

    // Discrete (bucket/jenks/quantile) colorScales render their swatches via an
    // internal Legend, which composes cleanly through the Viz scene — so run
    // them in compute mode (like the legend) so the Viz's toScene owns them and
    // hover/active dimming applies. Without this they render full-mode, where
    // paintComponentScene paints a full-opacity copy that overlays and defeats
    // the dimming. The smooth-gradient variant stays full-mode: its gradient
    // fill is materialized through paintComponentScene, not the Viz scene.
    const csCfg = (viz.schema.colorScaleConfig || {}) as {
      scale?: string;
      bucketAxis?: boolean;
    };
    const csDiscrete =
      !csCfg.bucketAxis &&
      ["buckets", "jenks", "quantile"].includes(
        typeof csCfg.scale === "string" ? csCfg.scale : "",
      );

    viz._colorScaleClass
      .renderMode(csDiscrete ? "compute" : "full")
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
        // Use the colorScale's OWN padding for its margin claim — not the
        // legend's, so a custom legendPadding doesn't shift the
        // colorScale's claim when the legend is hidden. The colorScale
        // class is the source of truth.
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
    the DOM-creating side effect imperatively from inside `layout()`, so
    invocation is funneled through `runLayout` for consistency with the
    other features. It claims zero margin and emits no panel.
*/
export const attributionFeature: FeatureModule = {
  name: "attribution",
  configFields: ["attribution", "attributionStyle"],
  layout: ({viz}) => {
    let attr: D3Selection = select(viz._select.node().parentNode)
      .selectAll("div.d3plus-attribution")
      .data(viz.schema.attribution ? [0] : []) as unknown as D3Selection;

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
