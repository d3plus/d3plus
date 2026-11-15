/**
    The Gantt's inert scene nodes: the label column's text, each group's
    summary bracket, the dependency arrows, the critical path's key, and
    the "today" line. None of
    them take the pointer or keyboard focus.
*/

import type {LineNode, PathNode, SceneNode, TextNode} from "@d3plus/render";

import {arrowNode} from "../features/edgeArrows.js";
import {referenceLineNodes} from "../features/referenceAnnotations.js";
import type {Annotation} from "../features/annotationTypes.js";
import {isUtcAxis} from "../Priestley/timeAxis.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {LABEL_INDENT, LABEL_PADDING} from "./applyLayout.js";
import type {GanttLayout, GanttMark} from "./applyLayout.js";
import {
  criticalKeyLabel,
  KEY_GAP,
  KEY_SAMPLE,
  linkKey,
} from "./ganttCritical.js";
import {bracketPath, elbowRoute} from "./ganttGeometry.js";
import {labelWidth} from "./ganttLabels.js";
import type {Point} from "./ganttGeometry.js";

/** The `dependencyConfig` settings, resolved. */
export interface DependencyStyle {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  arrowSize: number;
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Reads `dependencyConfig`, with the chart's ink as the default color. */
export function dependencyStyle(viz: VizInstance): DependencyStyle {
  const cfg = (viz.schema.dependencyConfig ?? {}) as Record<string, unknown>;
  return {
    stroke: (cfg.stroke as string) || backgroundInk(viz),
    strokeWidth: num(cfg.strokeWidth, 1),
    strokeOpacity: num(cfg.strokeOpacity, 0.55),
    arrowSize: Math.max(2, num(cfg.arrowSize, 6)),
  };
}

/** The `criticalPathConfig` settings, resolved. */
export interface CriticalStyle {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  arrowSize: number;
  /** The opacity tasks off the critical path take. */
  mutedOpacity: number;
  /** The key's label, or false for no key. */
  label: string | false;
}

/**
    Reads `criticalPathConfig`: critical arrows take the dependency color at
    full opacity, twice as wide, with larger heads; other tasks are muted to
    0.35 opacity; and the key reads the translated "Critical path".
*/
export function criticalStyle(viz: VizInstance): CriticalStyle {
  const cfg = (viz.schema.criticalPathConfig ?? {}) as Record<string, unknown>;
  const dep = dependencyStyle(viz);
  const strokeWidth = num(cfg.strokeWidth, dep.strokeWidth * 2);
  return {
    stroke: (cfg.stroke as string) || dep.stroke,
    strokeWidth,
    strokeOpacity: num(cfg.strokeOpacity, 1),
    arrowSize: Math.max(
      2,
      num(cfg.arrowSize, dep.arrowSize + (strokeWidth - dep.strokeWidth) * 2),
    ),
    mutedOpacity: Math.max(0, Math.min(1, num(cfg.mutedOpacity, 0.35))),
    label: criticalKeyLabel(viz),
  };
}

/** The label column's text: one node per row with a fitted label. */
export function labelNodes(
  layout: GanttLayout,
  marks: GanttMark[],
): TextNode[] {
  const {font} = layout;
  const byRow = new Map(marks.map(m => [m.row, m]));
  const out: TextNode[] = [];
  layout.rows.forEach((row, k) => {
    const fitted = layout.labels[k];
    if (!fitted || !fitted.lines.length) return;
    const group = row.kind === "group";
    const indent = !group && row.indent ? LABEL_INDENT : 0;
    const top = layout.cy[k] - (fitted.lines.length * font.lineHeight) / 2;
    const mark = byRow.get(k);
    out.push({
      type: "text",
      key: `gantt-label-${row.key}`,
      interactive: false,
      ...(mark ? {datum: mark.data, index: mark.i} : {}),
      x: 0,
      y: 0,
      transform: {x: LABEL_PADDING + indent, y: top},
      lines: fitted.lines.map((text, i) => ({
        text,
        x: 0,
        y: font.lineHeight * (i + 0.5),
        width: fitted.widths[i],
      })),
      font: {
        family: font.family,
        size: font.size,
        weight: group ? 600 : 400,
        anchor: "start",
        baseline: "middle",
      },
      paint: {fill: font.color},
    } as TextNode);
  });
  return out;
}

/** Each group header's summary bracket, from its first start to its last end. */
export function groupNodes(viz: VizInstance, layout: GanttLayout): PathNode[] {
  const fill = backgroundInk(viz);
  const out: PathNode[] = [];
  layout.rows.forEach((row, k) => {
    if (row.kind !== "group") return;
    const x0 = layout.x(row.start),
      x1 = Math.max(layout.x(row.end), x0 + 1);
    out.push({
      type: "path",
      key: `gantt-${row.key}`,
      interactive: false,
      d: bracketPath(x0, x1, layout.cy[k], Math.max(2, layout.band * 0.4)),
      paint: {fill, fillOpacity: 0.6},
    } as PathNode);
  });
  return out;
}

/** Where a dependency leaves a task: its bar's right edge or its diamond's right tip. */
export function taskEnd(mark: GanttMark, r: number): Point {
  return [mark.milestone ? mark.x1 + r : mark.x1, mark.cy];
}

/** Where a dependency enters a task: its bar's left edge or its diamond's left tip. */
export function taskStart(mark: GanttMark, r: number): Point {
  return [mark.milestone ? mark.x1 - r : mark.x0, mark.cy];
}

/**
    One elbow line and arrowhead per dependency whose predecessor is drawn,
    from the predecessor's end to the dependent's start. Each carries both
    tasks as interaction points, so hovering either keeps it lit while the
    rest dim. With a critical path, its links draw last, in the
    `criticalPathConfig` style.
*/
export function dependencyNodes(
  viz: VizInstance,
  layout: GanttLayout,
  marks: GanttMark[],
  r: number,
): SceneNode[] {
  const plain = dependencyStyle(viz);
  const bold = layout.critical ? criticalStyle(viz) : plain;
  const byId = new Map(marks.map(m => [m.id, m]));
  const out: SceneNode[] = [];
  const last: SceneNode[] = [];
  for (const mark of marks) {
    for (const id of mark.dependencies) {
      const pred = byId.get(id);
      if (!pred || pred === mark) continue;
      const critical = !!layout.critical?.links.has(linkKey(pred.id, mark.id));
      const style = critical ? bold : plain;
      (critical ? last : out).push(
        ...dependencyLink(layout, pred, mark, r, style),
      );
    }
  }
  return [...out, ...last];
}

/** A dependency's elbow line and arrowhead, in `style`. */
function dependencyLink(
  layout: GanttLayout,
  pred: GanttMark,
  mark: GanttMark,
  r: number,
  style: DependencyStyle,
): SceneNode[] {
  const stub = Math.max(8, style.arrowSize + 4);
  const from = taskEnd(pred, r),
    to = taskStart(mark, r);
  const points = elbowRoute(from, to, stub, layout.step).slice();
  points[points.length - 1] = [to[0] - style.arrowSize * 0.8, to[1]];
  const key = `gantt-dependency-${pred.id}-${mark.id}`;
  const interactionPoints = [
    {x: from[0], y: from[1], datum: pred.data, index: pred.i},
    {x: to[0], y: to[1], datum: mark.data, index: mark.i},
  ];
  const line = {
    type: "line",
    key,
    interactive: false,
    points,
    curve: "linear",
    interactionPoints,
    paint: {
      fill: "none",
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      strokeOpacity: style.strokeOpacity,
    },
  } as LineNode;
  const arrow = arrowNode({
    key: `${key}-arrow`,
    datum: mark.data,
    x: to[0],
    y: to[1],
    angle: 0,
    size: style.arrowSize,
    fill: style.stroke,
  });
  return [
    line,
    {
      ...arrow,
      datum: undefined,
      interactionPoints,
      paint: {...arrow.paint, fillOpacity: style.strokeOpacity},
    } as SceneNode,
  ];
}

/**
    The critical path's key in the label column's empty corner beside the
    time axis: a sample critical arrow and its label. Nothing without a
    critical path, a label, or room for both.
*/
export function criticalKeyNodes(
  viz: VizInstance,
  layout: GanttLayout,
): SceneNode[] {
  if (!layout.critical) return [];
  const style = criticalStyle(viz);
  if (!style.label) return [];
  const {font, corner} = layout;
  const textX = LABEL_PADDING + KEY_SAMPLE + KEY_GAP;
  const width = labelWidth(style.label, font);
  if (
    corner.x1 - LABEL_PADDING - textX < width ||
    corner.y1 - corner.y0 < font.lineHeight
  )
    return [];
  const cy = (corner.y0 + corner.y1) / 2;
  const tip = LABEL_PADDING + KEY_SAMPLE;
  const arrow = arrowNode({
    key: "gantt-critical-key-arrow",
    datum: {},
    x: tip,
    y: cy,
    angle: 0,
    size: style.arrowSize,
    fill: style.stroke,
  });
  return [
    {
      type: "line",
      key: "gantt-critical-key-line",
      interactive: false,
      points: [
        [LABEL_PADDING, cy],
        [tip - style.arrowSize * 0.8, cy],
      ],
      curve: "linear",
      paint: {
        fill: "none",
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeOpacity: style.strokeOpacity,
      },
    } as LineNode,
    {
      ...arrow,
      datum: undefined,
      interactive: false,
      paint: {...arrow.paint, fillOpacity: style.strokeOpacity},
    } as SceneNode,
    {
      type: "text",
      key: "gantt-critical-key-label",
      interactive: false,
      x: 0,
      y: 0,
      transform: {x: textX, y: cy},
      lines: [{text: style.label, x: 0, y: 0, width}],
      font: {
        family: font.family,
        size: font.size,
        weight: 400,
        anchor: "start",
        baseline: "middle",
      },
      paint: {fill: font.color},
    } as TextNode,
  ];
}

/** The time `today` marks: now for `true`, the value given otherwise, or null when off. */
export function todayValue(
  today: unknown,
  now: () => Date = () => new Date(),
): unknown {
  if (today === true) return now();
  if (today === false || today === undefined || today === null || today === "")
    return null;
  return today;
}

/**
    The "today" line across the rows at `today`, styled by `todayConfig` and
    labeled with the translated "Today" unless `todayConfig.label` says
    otherwise. Nothing when `today` is off or falls outside the time axis.
*/
export function todayNodes(viz: VizInstance, layout: GanttLayout): SceneNode[] {
  const value = todayValue(viz.schema.today);
  if (value === null) return [];
  const cfg = (viz.schema.todayConfig ?? {}) as Record<string, unknown>;
  const annotation: Annotation = {
    label: viz.schema.translate("Today"),
    fontSize: 11,
    labelPosition: "end",
    strokeOpacity: 0.85,
    strokeWidth: 1.5,
    ...cfg,
    shape: "ReferenceLine",
    x: value,
  };
  return referenceLineNodes(
    viz,
    annotation,
    {
      plot: layout.plot,
      axes: {
        x: {
          scale: v => layout.x(v as number | Date),
          time: layout.time,
          utc: isUtcAxis(viz),
        },
      },
    },
    "gantt-today",
  );
}
