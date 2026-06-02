import {extent, min, range as d3Range} from "d3-array";
import * as scales from "d3-scale";

import {elem} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import type {GroupNode, Paint, SceneNode, Transform} from "@d3plus/render";

import * as shapes from "../../shapes/index.js";
import {configPrep} from "../../utils/index.js";

import type Axis from "./Axis.js";

/* catches for -0 and less*/
export const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);

const floorPow = (d: number): number =>
  Math.pow(10, Math.floor(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const ceilPow = (d: number): number =>
  Math.pow(10, Math.ceil(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const fixFloat = (d: number): number => {
  const str = `${d}`;
  if (str.includes("e-") || str === "0") return 0;
  const nineMatch = str.match(/(-*[0-9]+\.[0]*)([0-8]+)9{3,}[0-9]+$/);
  if (nineMatch) return +`${nineMatch[1]}${+nineMatch[2] + 1}`;
  const zeroMatch = str.match(/(-*[0-9]+\.[0]*)([1-9]+)0*[0-9]*0{3,}[0-9]+$/);
  if (zeroMatch) return +`${zeroMatch[1]}${+zeroMatch[2]}`;
  return d;
};

const maxTimezoneOffset = 1000 * 60 * 60 * 26;

/**
 * Calculates ticks from a given scale (negative and/or positive)
 * @param {scale} scale A d3-scale object
 * @private
*/
function calculateStep(
  this: Axis,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scale: any,
  minorTicks: boolean = false,
): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepScale = (scales as any)
    .scaleLinear()
    .domain([200, 1200])
    .range([8, 28]);
  const scaleRange = scale.range();
  const size = Math.abs(scaleRange[1] - scaleRange[0]);
  let step = Math.floor(stepScale(size));

  if (this.schema.scale === "time") {
    if (this._data && this._data.length) {
      const dataExtent = extent(this._data);
      const distance = this._data.reduce(
        (n: number, d: unknown, i: number, arr: unknown[]) => {
          if (i) {
            const dist = Math.abs((d as number) - (arr[i - 1] as number));
            if (dist < n) n = dist;
          }
          return n;
        },
        Infinity,
      );
      const newStep = Math.round(
        ((dataExtent[1] as number) - (dataExtent[0] as number)) / distance,
      );
      step = min([step * (minorTicks ? 2 : 0.5), newStep])!;
    } else {
      step = minorTicks ? step * 2 : step / 2;
    }
  }

  return Math.floor(step);
}

/**
 * Calculates ticks from a given scale (negative and/or positive)
 * @param {scale} scale A d3-scale object
 * @private
*/
export function calculateTicks(
  this: Axis,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scale: any,
  minorTicks: boolean = false,
): unknown[] {
  let ticks: unknown[] = [];

  const scaleClone = scale.copy();
  if (this.schema.scale === "time" && this._data.length) {
    const newDomain = extent(this._data);
    const range = (newDomain as unknown[]).map(scale);
    scaleClone.domain(newDomain).range(range);
  }

  const domain = scaleClone.domain();
  const inverted = domain[1] < domain[0];
  const step = calculateStep.bind(this)(scaleClone, minorTicks);

  if (!minorTicks && this.schema.scale === "log") {
    const roundDomain = domain.map((d: number) =>
      Math.log10(d) % 1 === 0 ? d : (inverted ? ceilPow : floorPow)(d),
    );
    const invertedRound = roundDomain[1] < roundDomain[0];
    const powers = roundDomain.map(
      (d: number) =>
        (isNegative(d) ? -1 : 1) *
        ([-1, 1].includes(d) || Math.abs(d) < 1 ? 1 : Math.log10(Math.abs(d))),
    );
    const powMod = Math.ceil(
      (Math.abs(powers[1] - powers[0]) + 1) / (step * 0.65),
    );

    ticks =
      (powMod <= 1 && powers[0] === powers[1]) || invertedRound !== inverted
        ? scaleClone
            .ticks(step)
            .filter((d: number) => +`${d}`.replace("0.", "") % 2 === 0)
        : d3Range(powers[0], powers[1], powers[1] < powers[0] ? -1 : 1)
            .concat([powers[1]])
            .filter((d: number) => Math.abs(d) % powMod === 0)
            .map(
              (d: number) =>
                +`${
                  (isNegative(d) ? -1 : 1) *
                  (d
                    ? Math.pow(10, Math.abs(d))
                    : Math.sign(1 / d) > 0
                      ? 1
                      : -1)
                }`.replace(/9+/g, "1"),
            );
  } else {
    ticks = scaleClone.ticks(step);
    if (
      !minorTicks &&
      !["log", "time"].includes(this.schema.scale) &&
      ticks.length > 1
    ) {
      const majorDiff = Math.abs(fixFloat((ticks[1] as number) - (ticks[0] as number)) * 2);
      ticks = ticks.filter((d: unknown) => {
        const mod = Math.abs(d as number) % majorDiff;
        const modFloat = fixFloat(mod);
        if (modFloat !== mod) {
          return !modFloat || modFloat === majorDiff;
        }
        return mod === 0;
      });
    }
  }

  // for time scale, if data array has been provided, filter out ticks that are not in the array
  if (this.schema.scale === "time" && this._data.length) {
    const dataNumbers = this._data.map(Number);
    ticks = ticks.filter((t: unknown) => {
      const tn = +(t as number);
      return dataNumbers.find(
        (n: number) =>
          n >= tn - maxTimezoneOffset && n <= tn + maxTimezoneOffset,
      );
    });
  }

  // forces min/max into ticks, if not present
  if (
    !this._d3ScaleNegative ||
    isNegative(domain[inverted ? 1 : 0]) ===
      ticks.some((d: unknown) => isNegative(d as number))
  ) {
    if (!ticks.map(Number).includes(+domain[0])) {
      ticks.unshift(domain[0]);
    }
  }
  if (
    !this._d3ScaleNegative ||
    isNegative(domain[inverted ? 0 : 1]) ===
      ticks.some((d: unknown) => isNegative(d as number))
  ) {
    if (!ticks.map(Number).includes(+domain[1])) {
      ticks.push(domain[1]);
    }
  }

  return ticks;
}

/** Laid-out artifacts produced by `measureAxis` that the paint phase consumes. */
export interface AxisMeasure {
  ticks: unknown[];
  labels: unknown[];
  range: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textData: any[];
  tickFormat: (d: unknown) => string;
  hBuff: number;
  labelHeight: number;
}

/**
    Builds the per-tick config array consumed by the tick Shape. Extracted from
    `Axis.render` so the render method stays under the per-function line budget;
    behavior is identical.
    @private
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTickData(axis: Axis, measure: AxisMeasure): any[] {
  const {ticks, labels, textData, tickFormat, hBuff, labelHeight} = measure;
  const {height, x, y, horizontal, opposite} = axis._position;
  const flip = ["top", "left"].includes(axis.schema.orient);
  const p = axis.schema.padding;
  const margin: Record<string, number> = axis._margin;
  const bounds = axis._outerBounds;

  const labelOnly = labels.filter(
    (d: unknown, i: number) => textData[i].lines.length && !ticks.includes(d),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rotated = textData.some((d: any) => d.rotate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tickData: any[] = ticks.concat(labelOnly).map((d: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = textData.find((td: any) => td.d === d);

    const xPos = axis._getPosition(d);
    const space = data ? data.space : 0;
    const lines = data ? data.lines.length : 1;
    const lineHeight = data ? data.lineHeight : 1;
    const fP = data ? data.fP : 0;

    const labelOffset = data && axis.schema.labelOffset ? data.offset : 0;

    const labelWidth = horizontal
      ? space
      : bounds.width -
        margin[axis._position.opposite] -
        hBuff -
        margin[axis.schema.orient] +
        p;

    const offset = margin[opposite],
      size = (hBuff + labelOffset) * (flip ? -1 : 1),
      yPos = flip ? bounds[y] + bounds[height] - offset : bounds[y] + offset;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tickConfig: any = {
      id: d,
      labelBounds:
        rotated && data
          ? {
              x: -data.width / 2 + data.fS / 4,
              y:
                axis.schema.orient === "bottom"
                  ? size + (data.width - lineHeight * lines) / 2 + fP
                  : size - (data.width + lineHeight * lines) / 2 - 2 * fP,
              width: data.width,
              height: data.height,
            }
          : {
              x: horizontal
                ? -space / 2
                : axis.schema.orient === "left"
                  ? -labelWidth - p + size
                  : size + p,
              y: horizontal
                ? axis.schema.orient === "bottom"
                  ? size + fP
                  : size - labelHeight - fP
                : -space / 2,
              width: horizontal ? space : labelWidth,
              height: horizontal ? labelHeight : space,
            },
      rotate: data ? data.rotate : false,
      size:
        labels.includes(d) ||
        (axis.schema.scale === "log" && Math.log10(Math.abs(d)) % 1 === 0)
          ? size
          : ticks.includes(d)
            ? Math.ceil(size / 2)
            : axis._data.find((t: unknown) => +(t as number) === d)
              ? Math.ceil(size / 4)
              : 0,
      text:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !(data || ({} as any)).truncated && labels.includes(d)
          ? tickFormat(d)
          : false,
      tick: ticks.includes(d),
      [x]:
        xPos + (axis.schema.scale === "band" ? axis._d3Scale.bandwidth() / 2 : 0),
      [y]: yPos,
    };

    return tickConfig;
  });

  if (axis.schema.shape === "Line") {
    tickData = tickData.concat(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tickData.map((d: any) => {
        const dupe = Object.assign({}, d);
        dupe[y] += d.size;
        return dupe;
      }),
    );
  }

  return tickData;
}

/**
    Instantiates and renders the compute-mode tick Shape from `tickData`.
    Extracted from `Axis.render`; behavior is identical.
    @private
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configureTickShape(axis: Axis, tickData: any[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axis._tickShape = (new (shapes as any)[axis.schema.shape]())
    // v4: tick shape is always compute-only — the Axis composes ticks into
    // its own toScene; the inner shape never auto-renders its own <svg>.
    // `.select(null)` is the formal no-mount signal that pairs with
    // compute mode; without it, a future Shape.render reorder that
    // moves the body-div fallback above the compute-mode early-return
    // would silently leak one <div> per tick render.
    .renderMode("compute")
    .select(null)
    .data(tickData)
    .duration(axis.schema.duration)
    .labelConfig({
      ellipsis: (d: unknown) => (d && (d as string).length ? `${d}...` : ""),
      // The label TextBox invokes this with the laid-out label record, whose
      // tick datum (carrying `rotate`) sits on `.data`; fall back to the raw
      // datum for any path that passes it directly.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rotate: (d: any) => ((d.rotate ?? (d.data && d.data.rotate)) ? -90 : 0),
    });
  // v4 scene-only: tick shape stays compute-mode; toScene() composes ticks.
  // No `g.ticks` DOM wrapper needed in the detached compute.
  axis._tickShape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .config(configPrep.bind(axis as any)(axis.schema.shapeConfig))
    .labelConfig({padding: 0})
    .render();
}

/**
    Renders the axis title TextBox in compute mode. Extracted from
    `Axis.render`; behavior is identical.
    @private
*/
export function renderAxisTitle(
  axis: Axis,
  measure: AxisMeasure,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  group: any,
): void {
  const {range} = measure;
  const {horizontal} = axis._position;
  const margin: Record<string, number> = axis._margin;
  const bounds = axis._outerBounds;

  // Title TextBox runs in compute mode regardless. When there's no
  // parent group (standaloneCompute path above), skip the title's
  // DOM mount — its scene comes via toScene() anyway.
  axis._titleClass
    .renderMode("compute")
    .data(axis.schema.title ? [{text: axis.schema.title}] : [])
    .duration(axis.schema.duration)
    .height(margin[axis.schema.orient])
    .rotate(axis.schema.orient === "left" ? -90 : axis.schema.orient === "right" ? 90 : 0)
    .select(
      !group
        ? (null as unknown as HTMLElement)
        : elem("g.d3plus-Axis-title", {parent: group}).node(),
    )
    .text(((d: DataPoint) => d.text) as unknown as string)
    .verticalAlign("middle")
    .width(range[range.length - 1] - range[0])
    .x(
      horizontal
        ? range[0]
        : axis.schema.orient === "left"
          ? bounds.x +
            margin.left / 2 -
            (range[range.length - 1] - range[0]) / 2
          : bounds.x +
            bounds.width -
            margin.right / 2 -
            (range[range.length - 1] - range[0]) / 2,
    )
    .y(
      horizontal
        ? axis.schema.orient === "bottom"
          ? bounds.y + bounds.height - margin.bottom
          : bounds.y
        : range[0] +
            (range[range.length - 1] - range[0]) / 2 -
            margin[axis.schema.orient] / 2,
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .config(configPrep.bind(axis as any)(axis.schema.titleConfig))
    .render();
}

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
  const xDiff = axis.schema.scale === "band" ? axis._d3Scale.bandwidth() / 2 : 0;
  const isHorizontalAxis = xKey === "x";
  return axis._gridLineData.map(d => {
    const xPos = (axis._getPosition(d.id) as number) + xDiff;
    const a: [number, number] = isHorizontalAxis ? [xPos, position] : [position, xPos];
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
  const x1mod =
    axis.schema.scale === "band"
      ? axis._d3Scale.step() - axis._d3Scale.bandwidth()
      : axis.schema.scale === "point"
        ? axis._d3Scale.step() * axis._d3Scale.padding()
        : 0;
  const x2mod =
    axis.schema.scale === "band"
      ? axis._d3Scale.step()
      : axis.schema.scale === "point"
        ? axis._d3Scale.step() * axis._d3Scale.padding()
        : 0;
  const sortedDomain = (
    axis._d3ScaleNegative ? axis._d3ScaleNegative.domain() : []
  )
    .concat(axis._d3Scale ? axis._d3Scale.domain() : [])
    .sort((a: number, b: number) => a - b);
  if (!sortedDomain.length) return null;
  const x1 = (axis._getPosition(sortedDomain[0]) as number) - x1mod;
  const x2 =
    (axis._getPosition(sortedDomain[sortedDomain.length - 1]) as number) + x2mod;
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
    children.push({type: "line", key: `grid-${i}`, points: g.points, paint: gridPaint});
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
    const lbl = (axis._tickShape as {_labelClass?: {toScene?: () => GroupNode; _data?: unknown[]}})._labelClass;
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
  if (bar) {
    const barPaint = configToPaint(axis, axis.schema.barConfig as Record<string, unknown>);
    children.push({type: "line", key: "bar", points: bar.points, paint: barPaint});
  }

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
