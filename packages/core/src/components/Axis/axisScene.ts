/**
    The axis's backend-agnostic scene: gridlines and the domain bar emitted
    natively, composed with the tick Shape's and title TextBox's scenes.
*/
import type {GroupNode, Paint, SceneNode, Transform} from "@d3plus/render";

import type Axis from "./Axis.js";
import {axisBarNodes} from "./axisBreak.js";

/**
    Converts an attribute-style config (e.g. gridConfig, barConfig) into a Paint.
    @private
*/
export function configToPaint(
  axis: Axis,
  cfg: Record<string, unknown>,
  datum?: unknown,
  index = 0,
): Paint {
  // Resolve a config value that may be a function (d3-selection style
  // accessor invocation pattern) or a literal. Functions are evaluated
  // against the Axis instance and receive the datum + index, so per-line
  // accessors (e.g. Plot's gridConfig.stroke, which reads `d.id` to make
  // the boundary line transparent) resolve correctly.
  const resolve = (v: unknown): unknown => {
    if (typeof v === "function") {
      try {
        return (v as (this: unknown, d: unknown, i: number) => unknown).call(
          axis,
          datum,
          index,
        );
      } catch {
        return undefined;
      }
    }
    return v;
  };
  const p: Paint = {};
  const stroke = resolve(cfg.stroke);
  if (stroke != null) p.stroke = String(stroke);
  const strokeWidth = resolve(cfg["stroke-width"]);
  if (strokeWidth != null) p.strokeWidth = Number(strokeWidth);
  const strokeOpacity = resolve(cfg["stroke-opacity"]);
  if (strokeOpacity != null) p.strokeOpacity = Number(strokeOpacity);
  const strokeLinecap = resolve(cfg["stroke-linecap"]);
  if (strokeLinecap != null)
    p.strokeLinecap = strokeLinecap as Paint["strokeLinecap"];
  const dasharray = resolve(cfg["stroke-dasharray"]);
  if (dasharray != null) {
    const parts = String(dasharray)
      .split(/[\s,]+/)
      .map(Number)
      .filter(n => Number.isFinite(n));
    if (parts.length) p.strokeDasharray = parts;
  }
  const opacity = resolve(cfg.opacity);
  if (opacity != null) p.opacity = Number(opacity);
  const fill = resolve(cfg.fill);
  if (fill != null) p.fill = String(fill);
  return p;
}

/**
    Replicates _gridPosition's math to compute each gridline's endpoints in the
    axis's internal coordinate space.
    @private
*/
export function gridLinePoints(axis: Axis): {points: [number, number][]}[] {
  if (!axis._gridLineData || !axis._gridLineData.length) return [];
  const {height, x: xKey, y: yKey, opposite} = axis._position;
  const offset = axis._margin[opposite];
  const position = ["top", "left"].includes(axis.schema.orient)
    ? axis._outerBounds[yKey] + axis._outerBounds[height] - offset
    : axis._outerBounds[yKey] + offset;
  const size = ["top", "left"].includes(axis.schema.orient) ? offset : -offset;
  const xDiff =
    axis.schema.scale === "band" ? axis._d3Scale!.bandwidth!() / 2 : 0;
  const isHorizontalAxis = xKey === "x";
  return (axis._gridLineData ?? []).map(d => {
    const xPos = (axis._getPosition(d.id) as number) + xDiff;
    const a: [number, number] = isHorizontalAxis
      ? [xPos, position]
      : [position, xPos];
    const b: [number, number] = isHorizontalAxis
      ? [xPos, position + size]
      : [position + size, xPos];
    return {points: [a, b]};
  });
}

/**
    Replicates _barPosition's math to compute the domain-bar endpoints.
    @private
*/
export function barLinePoints(axis: Axis): {points: [number, number][]} | null {
  if (!axis._d3Scale && !axis._d3ScaleNegative) return null;
  const {height, x: xKey, y: yKey, opposite} = axis._position;
  const offset = axis._margin[opposite];
  const position = ["top", "left"].includes(axis.schema.orient)
    ? axis._outerBounds[yKey] + axis._outerBounds[height] - offset
    : axis._outerBounds[yKey] + offset;
  // A point scale's outer padding splits between its ends by `align`.
  const align =
    axis.schema.scale === "point" && axis._d3Scale!.align
      ? axis._d3Scale!.align()
      : 0.5;
  const x1mod =
    axis.schema.scale === "band"
      ? axis._d3Scale!.step!() - axis._d3Scale!.bandwidth!()
      : axis.schema.scale === "point"
        ? axis._d3Scale!.step!() * axis._d3Scale!.padding!() * 2 * align
        : 0;
  const x2mod =
    axis.schema.scale === "band"
      ? axis._d3Scale!.step!()
      : axis.schema.scale === "point"
        ? axis._d3Scale!.step!() * axis._d3Scale!.padding!() * 2 * (1 - align)
        : 0;
  const sortedDomain = (
    axis._d3ScaleNegative ? axis._d3ScaleNegative.domain() : []
  )
    .concat(axis._d3Scale ? axis._d3Scale.domain() : [])
    .sort((a, b) => (a as number) - (b as number));
  if (!sortedDomain.length) return null;
  const x1 = (axis._getPosition(sortedDomain[0]) as number) - x1mod;
  const x2 =
    (axis._getPosition(sortedDomain[sortedDomain.length - 1]) as number) +
    x2mod;
  const isHorizontalAxis = xKey === "x";
  return {
    points: isHorizontalAxis
      ? [
          [x1, position],
          [x2, position],
        ]
      : [
          [position, x1],
          [position, x2],
        ],
  };
}

/**
    Produces a backend-agnostic scene graph for the axis with no DOM dependency:
    gridlines + domain bar emitted natively, tick marks/labels composed from the
    tick Shape's toScene(), and the title from the title TextBox's toScene().
    @private
*/
export function axisToScene(axis: Axis): GroupNode {
  const children: SceneNode[] = [];

  const gridData = axis._gridLineData ?? [];
  gridLinePoints(axis).forEach((g, i) => {
    const gridPaint = configToPaint(
      axis,
      axis.schema.gridConfig as Record<string, unknown>,
      gridData[i],
      i,
    );
    children.push({
      type: "line",
      key: `grid-${i}`,
      points: g.points,
      paint: gridPaint,
    });
  });

  const tickGroup =
    axis._tickShape && typeof axis._tickShape.toScene === "function"
      ? (axis._tickShape.toScene() as GroupNode)
      : null;
  if (tickGroup) children.push(tickGroup);
  // Tick LABELS — appended here because Shape.toScene no longer
  // includes _labelClass children (collectComputed is the canonical
  // aggregator for the chart pipeline; Axis composes labels itself).
  if (axis._tickShape) {
    const lbl = (
      axis._tickShape as {
        _labelClass?: {toScene?: () => GroupNode; _data?: unknown[]};
      }
    )._labelClass;
    if (
      lbl &&
      typeof lbl.toScene === "function" &&
      lbl._data &&
      lbl._data.length
    ) {
      const lblScene = lbl.toScene();
      if (lblScene && Array.isArray(lblScene.children))
        children.push(...(lblScene.children as SceneNode[]));
    }
  }

  const bar = barLinePoints(axis);
  if (bar)
    children.push(
      ...axisBarNodes(axis, bar.points, cfg => configToPaint(axis, cfg)),
    );

  if (
    axis._titleClass &&
    typeof (axis._titleClass as {toScene?: unknown}).toScene === "function" &&
    (axis._titleClass as {_data?: unknown[]})._data &&
    ((axis._titleClass as {_data?: unknown[]})._data as unknown[]).length
  ) {
    children.push((axis._titleClass as {toScene: () => GroupNode}).toScene());
  }

  // The axis was placed inside a container the caller positioned (e.g. Plot's
  // xGroup); preserve that placement on the scene root.
  let transform: Transform | undefined;
  const node =
    axis._select && typeof axis._select.node === "function"
      ? (axis._select.node() as Element | null)
      : null;
  if (node && typeof node.getAttribute === "function") {
    const attr = node.getAttribute("transform");
    if (attr) {
      const m = /translate\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)/.exec(attr);
      if (m) transform = {x: Number(m[1]), y: Number(m[2])};
    }
  }

  return {
    type: "group",
    key: `Axis-${axis._uuid.slice(0, 8)}`,
    ...(transform ? {transform} : {}),
    children,
  };
}
