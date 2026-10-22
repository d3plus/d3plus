/**
    `vizPreDraw(viz)` — the shared data prep every draw runs first. It writes
    onto the viz:
      1. `_drawDepth` and the `_id` / `_ids` / `_drawLabel` closures;
      2. `_filteredData` (time filter, `filter`, rollup, hide/solo, then the
         chart's `_thresholdFunction`) and `_legendData`;
      3. the hover/duration override past `dataCutoff`;
    and mounts the no-data message when nothing is left to draw.

    `Viz._preDraw()` calls it, so subclass overrides run it through
    `super._preDraw()`.
*/

import {group, min} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {computeFilteredData, computeTimeFilter} from "./preDrawData.js";
import type {VizPreDrawResult} from "./preDrawData.js";
import {configureOrdinalColor} from "../viz/ordinalColor.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

function listify(n: DataPoint[keyof DataPoint][]): string {
  return n.reduce<string>(
    (str: string, item: DataPoint[keyof DataPoint], i: number) => {
      if (!i) str += item;
      else if (i === n.length - 1 && i === 1) str += ` and ${item}`;
      else if (i === n.length - 1) str += `, and ${item}`;
      else str += `, ${item}`;
      return str;
    },
    "",
  );
}

function accessorFetch(
  acc: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  while (d.__d3plus__ && d.data) {
    d = d.data as DataPoint;
    i = d.i as number;
  }
  return acc(d, i);
}

/** The id / ids / drawLabel closures produced for a given preDraw. */
interface LabelClosures {
  id: (d: DataPoint, i: number) => string | number;
  ids: (d: DataPoint, i: number) => string[];
  drawLabel: (d: DataPoint, i: number, depth?: number) => string;
}

/**
    Builds the id / ids / drawLabel snapshot closures from the viz instance.
*/
function buildLabelClosures(viz: Viz, drawDepth: number): LabelClosures {
  // SNAPSHOT CLOSURES (v4 hardening): each closure captures `groupBy`,
  // `label`, `thresholdName`, and `locale` AT CONSTRUCTION instead of
  // reading viz.* at invocation. This makes `ctx.id(d, i)` referentially
  // transparent for those fields — a caller holding the closure across
  // renders gets the input's id-as-of-this-preDraw, not whatever the
  // viz has been mutated to since.
  //
  // EXCEPTION — `_drawDepth`: `drawLabel`'s effective depth is read LIVE
  // from `viz._drawDepth` at call time, falling back to the snapshotted
  // `drawDepth`. So features / stages / subclass overrides that mutate
  // `viz._drawDepth` after preDraw are reflected in label/aria output.
  // Treemap's normal `.depth(n).render()` flow still works (render reruns
  // preDraw); the live read covers the intra-render mutation path.
  const snapGroupBy = viz.schema.groupBy as ((
    d: DataPoint,
    i: number,
  ) => DataPoint[keyof DataPoint])[];
  const snapLabel = viz.schema.label;
  const snapThresholdName = viz.schema.thresholdName;
  const snapLocale = viz.schema.locale;

  // groupBy values are string|number for id/keying purposes (numbers are
  // stringified so numeric and string ids never collide), including each id
  // in a merged datum's array.
  const keyId = (v: unknown): unknown => (typeof v === "number" ? `${v}` : v);
  const id = (d: DataPoint, i: number): string | number => {
    const groupByDrawDepth = accessorFetch(snapGroupBy[drawDepth], d, i);
    return (
      Array.isArray(groupByDrawDepth)
        ? groupByDrawDepth.map(keyId)
        : keyId(groupByDrawDepth)
    ) as string | number;
  };

  const ids = (d: DataPoint, i: number) =>
    snapGroupBy.map(g => `${accessorFetch(g, d, i)}`).filter(Boolean);

  const drawLabel = (d: DataPoint, i: number, depth?: number) => {
    // Resolve the effective depth at call time. Prefer the live
    // `viz._drawDepth` over the snapshot so intra-render mutations
    // (e.g. a feature/stage that adjusts depth post-preDraw, or a
    // subclass override) are reflected in label/aria output.
    // `viz._drawDepth ?? drawDepth` mirrors the pre-snapshot behavior.
    const liveLeaf = (viz._drawDepth as number | undefined) ?? drawDepth;
    const effDepth = depth ?? liveLeaf;
    if (!d) return "";
    while (d.__d3plus__ && d.data) {
      d = d.data as DataPoint;
      i = d.i as number;
    }
    // ColorScale range buckets carry their label in `id` and have no groupBy
    // fields, so the groupBy resolution below would yield "undefined".
    if (d._isColorScaleBucket) return `${d.id}`;
    if (d._isAggregation) {
      return `${snapThresholdName(d, i)} < ${formatAbbreviate(
        (d._threshold as number) * 100,
        snapLocale,
      )}%`;
    }
    if (snapLabel && effDepth === liveLeaf) return `${snapLabel(d, i)}`;
    const l = ids(d, i).slice(0, effDepth + 1);
    const n =
      l.reverse().find((ll: string) => !((ll as unknown) instanceof Array)) ||
      l[l.length - 1];
    return (n as unknown) instanceof Array
      ? listify(n as unknown as DataPoint[keyof DataPoint][])
      : `${n}`;
  };

  return {id, ids, drawLabel};
}

/** Whether the shapeConfig enables a persistent trail (a positive count or `true`). */
function hasPersistentTrail(sc: Record<string, unknown> | undefined): boolean {
  const on = (v: unknown): boolean =>
    v === true || (typeof v === "number" && v > 0);
  const shape = (k: string): unknown =>
    (sc?.[k] as {trailPersist?: unknown} | undefined)?.trailPersist;
  return (
    !!sc && (on(sc.trailPersist) || on(shape("Circle")) || on(shape("Rect")))
  );
}

/**
    The hover/duration override past `dataCutoff` and the no-data flag, from
    a draw's final (post-threshold) `filteredData`.
*/
export function vizPostThresholdCtx(
  viz: Viz,
  filteredData: DataPoint[],
  id: (d: DataPoint, i: number) => string | number,
): {
  hoverOverride?: {
    hoverOpacity: number;
    duration: number;
    stashOriginals?: boolean;
    restoreOriginals?: boolean;
  };
  noDataMessage: boolean;
} {
  const result: ReturnType<typeof vizPostThresholdCtx> = {noDataMessage: false};
  const uniqueIds = group(filteredData, id).size;
  if (uniqueIds > viz.schema.dataCutoff) {
    result.hoverOverride = {
      hoverOpacity: 1,
      duration: 0,
      stashOriginals: true,
    };
  } else if (viz._userHover !== undefined) {
    result.hoverOverride = {
      hoverOpacity: viz._userHover,
      duration: viz._userDuration!,
      restoreOriginals: true,
    };
  }
  result.noDataMessage = !!(viz.schema.noDataMessage && !filteredData.length);
  return result;
}

export function vizPreDraw(viz: Viz): void {
  // Reads the live viz rather than a `resolveSpec(viz)` snapshot:
  // `BaseClass.config()` reflects over every accessor and memoizes the
  // defaults on first call, which would freeze them to whatever
  // partially-configured state the chart is in at its first draw.
  const drawDepth =
    viz.schema.depth !== void 0
      ? (min([
          viz.schema.depth >= 0 ? viz.schema.depth : 0,
          viz.schema.groupBy.length - 1,
        ]) as number)
      : viz.schema.groupBy.length - 1;
  const {id, ids, drawLabel} = buildLabelClosures(viz, drawDepth);

  // The synthesized time filter feeds this draw's rows but is never written
  // onto `viz.schema.timeFilter`: it captures the latest time at synthesis,
  // so pinning it would make a later render with newer data skip
  // re-synthesis and filter the newer rows out.
  const out: VizPreDrawResult = {};
  computeFilteredData(viz, out, drawDepth, id, computeTimeFilter(viz));

  viz._drawDepth = drawDepth;
  viz._id = id;
  viz._ids = ids;
  viz._drawLabel = drawLabel;
  if (out.legendData !== undefined) viz._legendData = out.legendData;

  // A persistent trail only stays coherent with fixed axes (so committed
  // segments don't drift as the domain shifts) and a single-period timeline (so
  // the forward/backward step logic has one current time). Turn both on
  // automatically when `trailPersist` is set, so callers don't have to know.
  if (hasPersistentTrail(viz.schema.shapeConfig as Record<string, unknown>)) {
    (viz as {_axisPersist?: boolean})._axisPersist = true;
    viz.schema.timelineConfig = {
      ...(viz.schema.timelineConfig || {}),
      brushing: false,
    };
  }

  // The threshold reads `this.schema.aggs`/`_drawDepth`/`_groupBy` through
  // the chart's instance method, so it runs after the writes above.
  let filteredData = out.filteredData || [];
  if (viz._data.length && out._thresholdTree) {
    filteredData = viz._thresholdFunction!(filteredData, out._thresholdTree);
  }
  viz._filteredData = filteredData;

  // Ordinal color mode: build the single-hue ramp scale from the distinct
  // values of the drawn data (a no-op when colorOrdinal is off).
  configureOrdinalColor(viz);

  // hover/duration override + noDataMessage flag — computed against
  // the post-threshold filteredData.
  const post = vizPostThresholdCtx(viz, filteredData, viz._id);
  if (post.hoverOverride?.stashOriginals) {
    if (viz._userHover === undefined)
      viz._userHover = viz.schema.shapeConfig.hoverOpacity || 0.5;
    if (viz._userDuration === undefined)
      viz._userDuration = viz.schema.shapeConfig.duration || 600;
    viz.schema.shapeConfig.hoverOpacity = post.hoverOverride.hoverOpacity;
    viz.schema.shapeConfig.duration = post.hoverOverride.duration;
  } else if (post.hoverOverride?.restoreOriginals) {
    viz.schema.shapeConfig.hoverOpacity = post.hoverOverride.hoverOpacity;
    viz.schema.shapeConfig.duration = post.hoverOverride.duration;
  }

  // No-data-message DOM mount + opacity fade.
  if (post.noDataMessage) {
    viz._messageClass!.render({
      container: viz._select!.node().parentNode,
      html: viz.schema.noDataHTML(viz),
      mask: false,
      style: viz.schema.messageStyle,
    });
    viz._select!.transition().duration(viz.schema.duration).attr("opacity", 0);
  }
}
