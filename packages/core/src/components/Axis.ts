import {extent, min, range as d3Range} from "d3-array";
import * as scales from "d3-scale";
import {select} from "d3-selection";
import {transition} from "d3-transition";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {colorContrast, colorDefaults} from "@d3plus/color";
import {assign, backgroundColor, date, elem, rtl as detectRTL} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import type {DataPoint} from "@d3plus/data";
import type {GroupNode, Paint, SceneNode, Transform} from "@d3plus/render";

import {TextBox} from "../components/index.js";
import {measureAxis} from "./axisLayout.js";
import * as shapes from "../shapes/index.js";
import {configPrep, BaseClass, constant} from "../utils/index.js";

/* catches for -0 and less*/
const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);

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

  if (this._scale === "time") {
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
function calculateTicks(
  this: Axis,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scale: any,
  minorTicks: boolean = false,
): unknown[] {
  let ticks: unknown[] = [];

  const scaleClone = scale.copy();
  if (this._scale === "time" && this._data.length) {
    const newDomain = extent(this._data);
    const range = (newDomain as unknown[]).map(scale);
    scaleClone.domain(newDomain).range(range);
  }

  const domain = scaleClone.domain();
  const inverted = domain[1] < domain[0];
  const step = calculateStep.bind(this)(scaleClone, minorTicks);

  if (!minorTicks && this._scale === "log") {
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
      !["log", "time"].includes(this._scale) &&
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
  if (this._scale === "time" && this._data.length) {
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

/**
    Creates an SVG scale based on an array of data.
*/
export default class Axis extends BaseClass {
  _select!: D3Selection;
  _align: string;
  _barConfig: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _domain: any[];
  _duration: number;
  _gridConfig: Record<string, unknown>;
  _gridLog: boolean;
  _gridSize: number | undefined;
  _grid: unknown[] | undefined;
  _height: number;
  _labelOffset: boolean;
  _labelRotation: boolean | undefined;
  _labels: unknown[] | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare _locale: any;
  _margin: Record<string, number>;
  _maxSize!: number;
  _minSize!: number;
  _orient!: string;
  _outerBounds: Record<string, number>;
  _padding: number;
  _paddingInner: number;
  _paddingOuter: number;
  _position!: {
    horizontal: boolean;
    width: string;
    height: string;
    x: string;
    y: string;
    opposite: string;
  };
  _range: (number | undefined)[] | undefined;
  _rounding: string;
  _roundingInsideMinPrefix: string;
  _roundingInsideMinSuffix: string;
  _roundingInsideMaxPrefix: string;
  _roundingInsideMaxSuffix: string;
  _scale: string;
  _scalePadding: number;
  _shape: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _shapeConfig: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _tickFormat: any;
  _ticks: unknown[] | undefined;
  _tickSize: number;
  _tickSuffix: string;
  _tickUnit: number;
  _timeLocale: Record<string, unknown> | undefined;
  _title: string | undefined;
  _titleClass: TextBox;
  _renderMode!: "full" | "compute";
  // Stored render() intermediates so toScene() can compose natively.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _tickShape?: {toScene?: () => GroupNode; _data?: unknown[]} | any;
  _gridLineData?: {id: unknown}[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _titleConfig: Record<string, any>;
  _width: number;
  // D3 scales have complex polymorphic types that vary at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _d3Scale: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _d3ScaleNegative: any;
  _group!: D3Selection;
  _lastScale: ((d: unknown) => number) | undefined;
  _availableTicks: unknown[];
  _visibleTicks: unknown[];
  _transition!: ReturnType<typeof transition>;
  _userFormat: ((d: unknown) => string) | false | undefined;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._renderMode = "full";
    this._align = "middle";
    this._barConfig = {
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      "stroke-width": 1,
    };
    this._data = [];
    this._domain = [0, 10];
    this._duration = 600;
    this._gridConfig = {
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        const contrast = colorContrast(bg);
        return contrast === colorDefaults.dark ? openColor.colors.gray[200] : openColor.colors.gray[600];
      },
      "stroke-width": 1,
    };
    this._gridLog = false;
    this._height = 400;
    this._labelOffset = false;
    this._labelRotation = false;
    this.orient("bottom");
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._padding = 5;
    this._paddingInner = 0.1;
    this._paddingOuter = 0.1;
    this._rounding = "none";
    this._roundingInsideMinPrefix = "< ";
    this._roundingInsideMinSuffix = "";
    this._roundingInsideMaxPrefix = "";
    this._roundingInsideMaxSuffix = "+";
    this._scale = "linear";
    this._scalePadding = 0.5;
    this._shape = "Line";
    this._shapeConfig = {
      fill: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      height: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
      label: (d: Record<string, unknown>) => d.text,
      labelBounds: (d: Record<string, unknown>) => d.labelBounds,
      labelConfig: {
        fontColor: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
        fontResize: false,
        fontSize: constant(12),
        padding: 5,
        textAnchor: () => {
          const rtl = detectRTL();
          return this._orient === "left"
            ? rtl
              ? "start"
              : "end"
            : this._orient === "right"
              ? rtl
                ? "end"
                : "start"
              : this._labelRotation
                ? this._orient === "bottom"
                  ? "end"
                  : "start"
                : "middle";
        },
        verticalAlign: () =>
          this._orient === "bottom"
            ? "top"
            : this._orient === "top"
              ? this._labelRotation ? "top" : "bottom"
              : "middle",
      },
      r: (d: Record<string, unknown>) => (d.tick ? 4 : 0),
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      strokeWidth: 1,
      width: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
    };
    this._tickSize = 8;
    this._tickSuffix = "normal";
    this._tickUnit = 0;
    this._timeLocale = undefined;
    this._titleClass = new TextBox();
    this._titleConfig = {
      fontColor: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontSize: 12,
      textAnchor: "middle",
    };
    this._width = 400;
    this._margin = {top: 0, right: 0, bottom: 0, left: 0};
    this._availableTicks = [];
    this._visibleTicks = [];
  }


  /**
      Returns the scale's domain, taking into account negative and positive log scales.
      @private
*/
  _getDomain(): unknown[] {
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative) ticks = this._d3ScaleNegative.domain();
    if (this._d3Scale) ticks = ticks.concat(this._d3Scale.domain());

    const domain = ["band", "ordinal", "point"].includes(this._scale)
      ? ticks
      : extent(ticks as number[]);
    return (ticks[0] as number) > (ticks[1] as number)
      ? (domain as unknown[]).reverse()
      : (domain as unknown[]);
  }

  /**
      Returns a value's scale position, taking into account negative and positive log scales.
      @param d @private
*/
  _getPosition(d: unknown): number {
    if (this._scale === "log") {
      if (d === 0)
        return (this._d3Scale || this._d3ScaleNegative).range()[
          this._d3Scale ? 0 : 1
        ];
      return (
        isNegative(d as number) ? this._d3ScaleNegative || (() => 0) : this._d3Scale
      )(d);
    }
    return this._d3Scale(d);
  }

  /**
      Returns the scale's range, taking into account negative and positive log scales.
      @private
*/
  _getRange(): unknown[] {
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative) ticks = this._d3ScaleNegative.range();
    if (this._d3Scale) ticks = ticks.concat(this._d3Scale.range());
    return (ticks[0] as number) > (ticks[1] as number)
      ? (extent(ticks as number[]) as unknown[]).reverse()
      : (extent(ticks as number[]) as unknown[]);
  }

  /**
      Returns the scale's labels, taking into account negative and positive log scales.
      @private
*/
  _getLabels(): unknown[] {
    let labels: unknown[] = [];
    if (this._d3ScaleNegative)
      labels = labels.concat(
        calculateTicks.bind(this)(this._d3ScaleNegative, false),
      );
    if (this._d3Scale)
      labels = labels.concat(calculateTicks.bind(this)(this._d3Scale, false));
    if (this._scale === "log") {
      const diverging =
        labels.some((d: unknown) => isNegative(d as number)) &&
        labels.some((d: unknown) => (d as number) > 0);
      if (diverging) {
        const minValue = min([
          ...this._d3ScaleNegative.domain().map(Math.abs),
          ...this._d3Scale.domain(),
        ]);
        // add minValue if it does not exist, and should
        if (!labels.includes(minValue)) {
          labels.splice(
            labels.findIndex((d: unknown) => (d as number) > minValue!),
            0,
            minValue,
          );
        }
        // remove -minValue if minValue also exists
        if (labels.includes(-minValue!) && labels.includes(minValue)) {
          labels.splice(labels.indexOf(-minValue!), 1);
        }
      }
    }
    return labels;
  }

  /**
      Returns the scale's ticks, taking into account negative and positive log scales.
      @private
*/
  _getTicks(): unknown[] {
    if (
      ["band", "ordinal", "point", "time"].includes(this._scale) &&
      this._data.length &&
      this._data.length < this._width / 4
    ) {
      return this._scale === "time" ? this._data.map(date) : this._data;
    }
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative)
      ticks = ticks.concat(
        calculateTicks.bind(this)(this._d3ScaleNegative, true),
      );
    if (this._d3Scale)
      ticks = ticks.concat(calculateTicks.bind(this)(this._d3Scale, true));
    if (this._scale === "log" && ticks.includes(-1) && ticks.includes(1))
      ticks.splice(ticks.indexOf(-1), 1);
    return ticks;
  }


  /**
      Converts an attribute-style config (e.g. _gridConfig, _barConfig) into a Paint.
      @private
*/
  _configToPaint(cfg: Record<string, unknown>): Paint {
    const p: Paint = {};
    if (cfg.stroke != null) p.stroke = String(cfg.stroke);
    if (cfg["stroke-width"] != null) p.strokeWidth = Number(cfg["stroke-width"]);
    if (cfg["stroke-opacity"] != null) p.strokeOpacity = Number(cfg["stroke-opacity"]);
    if (cfg["stroke-linecap"] != null)
      p.strokeLinecap = cfg["stroke-linecap"] as Paint["strokeLinecap"];
    if (cfg["stroke-dasharray"] != null) {
      const parts = String(cfg["stroke-dasharray"])
        .split(/[\s,]+/)
        .map(Number)
        .filter(n => Number.isFinite(n));
      if (parts.length) p.strokeDasharray = parts;
    }
    if (cfg.opacity != null) p.opacity = Number(cfg.opacity);
    if (cfg.fill != null) p.fill = String(cfg.fill);
    return p;
  }

  /**
      Replicates _gridPosition's math to compute each gridline's endpoints in the
      axis's internal coordinate space.
      @private
*/
  _gridLinePoints(): {points: [number, number][]}[] {
    if (!this._gridLineData || !this._gridLineData.length) return [];
    const {height, x: xKey, y: yKey, opposite} = this._position;
    const offset = this._margin[opposite];
    const position = ["top", "left"].includes(this._orient)
      ? this._outerBounds[yKey] + this._outerBounds[height] - offset
      : this._outerBounds[yKey] + offset;
    const size = ["top", "left"].includes(this._orient) ? offset : -offset;
    const xDiff = this._scale === "band" ? this._d3Scale.bandwidth() / 2 : 0;
    const isHorizontalAxis = xKey === "x";
    return this._gridLineData.map(d => {
      const xPos = (this._getPosition(d.id) as number) + xDiff;
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
  _barLinePoints(): {points: [number, number][]} | null {
    if (!this._d3Scale && !this._d3ScaleNegative) return null;
    const {height, x: xKey, y: yKey, opposite} = this._position;
    const offset = this._margin[opposite];
    const position = ["top", "left"].includes(this._orient)
      ? this._outerBounds[yKey] + this._outerBounds[height] - offset
      : this._outerBounds[yKey] + offset;
    const x1mod =
      this._scale === "band"
        ? this._d3Scale.step() - this._d3Scale.bandwidth()
        : this._scale === "point"
          ? this._d3Scale.step() * this._d3Scale.padding()
          : 0;
    const x2mod =
      this._scale === "band"
        ? this._d3Scale.step()
        : this._scale === "point"
          ? this._d3Scale.step() * this._d3Scale.padding()
          : 0;
    const sortedDomain = (
      this._d3ScaleNegative ? this._d3ScaleNegative.domain() : []
    )
      .concat(this._d3Scale ? this._d3Scale.domain() : [])
      .sort((a: number, b: number) => a - b);
    if (!sortedDomain.length) return null;
    const x1 = (this._getPosition(sortedDomain[0]) as number) - x1mod;
    const x2 =
      (this._getPosition(sortedDomain[sortedDomain.length - 1]) as number) + x2mod;
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
      Produces a backend-agnostic scene graph for this axis with no DOM dependency:
      gridlines + domain bar emitted natively, tick marks/labels composed from the
      tick Shape's toScene(), and the title from the title TextBox's toScene().
*/
  toScene(): GroupNode {
    const children: SceneNode[] = [];

    const gridPaint = this._configToPaint(this._gridConfig as Record<string, unknown>);
    this._gridLinePoints().forEach((g, i) => {
      children.push({type: "line", key: `grid-${i}`, points: g.points, paint: gridPaint});
    });

    const tickGroup =
      this._tickShape && typeof this._tickShape.toScene === "function"
        ? (this._tickShape.toScene() as GroupNode)
        : null;
    if (tickGroup) children.push(tickGroup);
    // Tick LABELS — appended here because Shape.toScene no longer
    // includes _labelClass children (collectComputed is the canonical
    // aggregator for the chart pipeline; Axis composes labels itself).
    if (this._tickShape) {
      const lbl = (this._tickShape as {_labelClass?: {toScene?: () => GroupNode; _data?: unknown[]}})._labelClass;
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

    const bar = this._barLinePoints();
    if (bar) {
      const barPaint = this._configToPaint(this._barConfig as Record<string, unknown>);
      children.push({type: "line", key: "bar", points: bar.points, paint: barPaint});
    }

    if (
      this._titleClass &&
      typeof (this._titleClass as {toScene?: unknown}).toScene === "function" &&
      (this._titleClass as {_data?: unknown[]})._data &&
      ((this._titleClass as {_data?: unknown[]})._data as unknown[]).length
    ) {
      children.push((this._titleClass as {toScene: () => GroupNode}).toScene());
    }

    // The axis was placed inside a container the caller positioned (e.g. Plot's
    // xGroup); preserve that placement on the scene root.
    let transform: Transform | undefined;
    const node =
      this._select && typeof this._select.node === "function"
        ? (this._select.node() as Element | null)
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
      key: `Axis-${this._uuid.slice(0, 8)}`,
      ...(transform ? {transform} : {}),
      children,
    };
  }

  /**
      Renders the current Axis to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    /**
     * In `renderMode("compute")` the axis is scene-only — the caller will
     * read `toScene()`, not the DOM. We skip creating any SVG element at
     * all: the elem() calls later in render() are no-ops when `_select`
     * is undefined (d3-selection.select(undefined) yields a null-wrapped
     * selection whose .append/.select on it short-circuit). This also
     * fixes the "every Axis instance holds a detached svg forever" leak
     * — Plot has four long-lived axes and was accumulating 4 detached
     * SVGs per chart instance.
     *
     * In `renderMode("full")` and `_select` unset, we still create a
     * body-attached svg for back-compat (legacy callers do
     * `new Axis().render()` standalone).
*/
    if (this._select === void 0 && this._renderMode !== "compute") {
      const svgNode = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      svgNode.setAttribute("width", `${this._width}px`);
      svgNode.setAttribute("height", `${this._height}px`);
      document.body.appendChild(svgNode);
      this.select(svgNode as unknown as HTMLElement);
    }

    // Pure layout pass. `measureAxis(this)` constructs the d3 scale, picks
    // ticks, runs label textWrap, and computes outerBounds — no DOM, no
    // rendering. It mutates `this._d3Scale`/`_outerBounds`/`_margin` etc. for
    // consumers reading off the instance, and returns the local layout
    // artifacts the paint phase below consumes. The standalone `measureAxis`
    // lives in axisLayout.ts so Plot test-axes can drive it without a class
    // instance at all (any AxisLike object works).
    const {ticks, labels, range, textData, tickFormat, hBuff, labelHeight} =
      measureAxis(this);

    // Paint-local geometry helpers. `width` is intentionally not destructured
    // here — measureAxis already used it; paint code references `height`/`x`/
    // `y` plus the orient predicates.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {width: _width, height, x, y, horizontal, opposite} = this._position;
    const flip = ["top", "left"].includes(this._orient);
    const p = this._padding;
    const parent = this._select;
    const margin: Record<string, number> = this._margin;
    const bounds = this._outerBounds;

    // Skip the wrapper group only when in compute mode WITHOUT a real
    // `_select` (the standalone compute path used by Plot's axes — toScene
    // is the consumer, no DOM mount needed). When `_select` is set, the
    // group still mounts because consumers (Timeline extends Axis and
    // calls `elem("g.brushGroup", {parent: this._group})` after super
    // render) expect it.
    const standaloneCompute =
      this._renderMode === "compute" &&
      (this._select === void 0 || this._select === null ||
        (typeof this._select.node === "function" && this._select.node() === null));
    const group = standaloneCompute
      ? null
      : elem(`g#d3plus-Axis-${this._uuid}`, {parent});
    this._group = group;

    const gridLineData: {id: unknown}[] = (
      this._gridSize !== 0
        ? this._grid || (this._scale === "log" && !this._gridLog)
          ? labels
          : ticks
        : []
    ).map((d: unknown) => ({id: d}));
    // v4 scene-only: grid lines are emitted natively by toScene() via
    // _gridLinePoints() from this._gridLineData. No legacy <line> DOM.
    this._gridLineData = gridLineData;

    const labelOnly = labels.filter(
      (d: unknown, i: number) => textData[i].lines.length && !ticks.includes(d),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rotated = textData.some((d: any) => d.rotate);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tickData: any[] = ticks.concat(labelOnly).map((d: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = textData.find((td: any) => td.d === d);

      const xPos = this._getPosition(d);
      const space = data ? data.space : 0;
      const lines = data ? data.lines.length : 1;
      const lineHeight = data ? data.lineHeight : 1;
      const fP = data ? data.fP : 0;

      const labelOffset = data && this._labelOffset ? data.offset : 0;

      const labelWidth = horizontal
        ? space
        : bounds.width -
          margin[this._position.opposite] -
          hBuff -
          margin[this._orient] +
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
                  this._orient === "bottom"
                    ? size + (data.width - lineHeight * lines) / 2 + fP
                    : size - (data.width + lineHeight * lines) / 2 - 2 * fP,
                width: data.width,
                height: data.height,
              }
            : {
                x: horizontal
                  ? -space / 2
                  : this._orient === "left"
                    ? -labelWidth - p + size
                    : size + p,
                y: horizontal
                  ? this._orient === "bottom"
                    ? size + fP
                    : size - labelHeight - fP
                  : -space / 2,
                width: horizontal ? space : labelWidth,
                height: horizontal ? labelHeight : space,
              },
        rotate: data ? data.rotate : false,
        size:
          labels.includes(d) ||
          (this._scale === "log" && Math.log10(Math.abs(d)) % 1 === 0)
            ? size
            : ticks.includes(d)
              ? Math.ceil(size / 2)
              : this._data.find((t: unknown) => +(t as number) === d)
                ? Math.ceil(size / 4)
                : 0,
        text:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !(data || ({} as any)).truncated && labels.includes(d)
            ? tickFormat(d)
            : false,
        tick: ticks.includes(d),
        [x]:
          xPos + (this._scale === "band" ? this._d3Scale.bandwidth() / 2 : 0),
        [y]: yPos,
      };

      return tickConfig;
    });

    if (this._shape === "Line") {
      tickData = tickData.concat(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tickData.map((d: any) => {
          const dupe = Object.assign({}, d);
          dupe[y] += d.size;
          return dupe;
        }),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._tickShape = (new (shapes as any)[this._shape]())
      // v4: tick shape is always compute-only — the Axis composes ticks into
      // its own toScene; the inner shape never auto-renders its own <svg>.
      // `.select(null)` is the formal no-mount signal that pairs with
      // compute mode; without it, a future Shape.render reorder that
      // moves the body-div fallback above the compute-mode early-return
      // would silently leak one <div> per tick render.
      .renderMode("compute")
      .select(null)
      .data(tickData)
      .duration(this._duration)
      .labelConfig({
        ellipsis: (d: unknown) => (d && (d as string).length ? `${d}...` : ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rotate: (d: any) => (d.rotate ? -90 : 0),
      });
    // v4 scene-only: tick shape stays compute-mode; toScene() composes ticks.
    // No `g.ticks` DOM wrapper needed in the detached compute.
    this._tickShape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this._shapeConfig))
      .labelConfig({padding: 0})
      .render();

    // v4 scene-only: the domain bar is emitted natively by toScene() via
    // _barLinePoints(). No legacy `line.bar` DOM.

    // Title TextBox runs in compute mode regardless. When there's no
    // parent group (standaloneCompute path above), skip the title's
    // DOM mount — its scene comes via toScene() anyway.
    this._titleClass
      .renderMode("compute")
      .data(this._title ? [{text: this._title}] : [])
      .duration(this._duration)
      .height(margin[this._orient])
      .rotate(this._orient === "left" ? -90 : this._orient === "right" ? 90 : 0)
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
          : this._orient === "left"
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
          ? this._orient === "bottom"
            ? bounds.y + bounds.height - margin.bottom
            : bounds.y
          : range[0] +
              (range[range.length - 1] - range[0]) / 2 -
              margin[this._orient] / 2,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this._titleConfig))
      .render();

    this._lastScale = this._getPosition.bind(this);

    if (callback) setTimeout(callback, this._duration + 100);

    return this;
  }

  /**
      The horizontal alignment.
*/
  align(): string;
  align(_: string): this;
  align(_?: string): string | this {
    return arguments.length ? ((this._align = _!), this) : this._align;
  }

  /**
      Axis line style.
*/
  barConfig(): Record<string, unknown>;
  barConfig(_: Record<string, unknown>): this;
  barConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._barConfig = Object.assign(this._barConfig, _)), this)
      : this._barConfig;
  }

  /**
      An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(_: any[]): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(_?: any[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      Scale domain of the axis.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domain(): any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domain(_: any[]): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domain(_?: any[]): unknown {
    return arguments.length ? ((this._domain = _!), this) : this._domain;
  }

  /**
      Transition duration of the axis.
*/
  duration(): number;
  duration(_: number): this;
  duration(_?: number): number | this {
    return arguments.length ? ((this._duration = _!), this) : this._duration;
  }

  /**
      Grid values of the axis.
*/
  grid(): unknown[] | undefined;
  grid(_: unknown[]): this;
  grid(_?: unknown[]): unknown {
    return arguments.length ? ((this._grid = _), this) : this._grid;
  }

  /**
      Grid config of the axis.
*/
  gridConfig(): Record<string, unknown>;
  gridConfig(_: Record<string, unknown>): this;
  gridConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._gridConfig = Object.assign(this._gridConfig, _)), this)
      : this._gridConfig;
  }

  /**
      Grid behavior of the axis when scale is logarithmic.
*/
  gridLog(): boolean;
  gridLog(_: boolean): this;
  gridLog(_?: boolean): boolean | this {
    return arguments.length ? ((this._gridLog = _!), this) : this._gridLog;
  }

  /**
      Grid size of the axis.
*/
  gridSize(): number | undefined;
  gridSize(_: number): this;
  gridSize(_?: number): number | undefined | this {
    return arguments.length ? ((this._gridSize = _), this) : this._gridSize;
  }

  /**
      Overall height of the axis.
*/
  height(): number;
  height(_: number): this;
  height(_?: number): number | this {
    return arguments.length ? ((this._height = _!), this) : this._height;
  }

  /**
      Visible tick labels of the axis.
*/
  labels(): unknown[] | undefined;
  labels(_: unknown[]): this;
  labels(_?: unknown[]): unknown {
    return arguments.length ? ((this._labels = _), this) : this._labels;
  }

  /**
      Whether to offset overlapping labels further from the axis to prevent collisions.
*/
  labelOffset(): boolean;
  labelOffset(_: boolean): this;
  labelOffset(_?: boolean): boolean | this {
    return arguments.length
      ? ((this._labelOffset = _!), this)
      : this._labelOffset;
  }

  /**
      Whether to rotate horizontal axis labels -90 degrees.
*/
  labelRotation(): boolean | undefined;
  labelRotation(_: boolean): this;
  labelRotation(_?: boolean): boolean | undefined | this {
    return arguments.length
      ? ((this._labelRotation = _), this)
      : this._labelRotation;
  }

  /**
      Maximum size allowed for the space that contains the axis tick labels and title.
*/
  maxSize(): number;
  maxSize(_: number): this;
  maxSize(_?: number): number | this {
    return arguments.length ? ((this._maxSize = _!), this) : this._maxSize;
  }

  /**
      Minimum size alloted for the space that contains the axis tick labels and title.
*/
  minSize(): number;
  minSize(_: number): this;
  minSize(_?: number): number | this {
    return arguments.length ? ((this._minSize = _!), this) : this._minSize;
  }

  /**
      The orientation of the shape.
*/
  orient(): string;
  orient(_: string): this;
  orient(_?: string): string | this {
    if (arguments.length) {
      const horizontal = ["top", "bottom"].includes(_!),
        opps: Record<string, string> = {
          top: "bottom",
          right: "left",
          bottom: "top",
          left: "right",
        };

      this._position = {
        horizontal,
        width: horizontal ? "width" : "height",
        height: horizontal ? "height" : "width",
        x: horizontal ? "x" : "y",
        y: horizontal ? "y" : "x",
        opposite: opps[_!],
      };

      return ((this._orient = _!), this);
    }
    return this._orient;
  }

  /**
      Returns the outer bounds of the axis content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      The padding between each tick label.
*/
  padding(): number;
  padding(_: number): this;
  padding(_?: number): number | this {
    return arguments.length ? ((this._padding = _!), this) : this._padding;
  }

  /**
      The inner padding of band scale.
*/
  paddingInner(): number;
  paddingInner(_: number): this;
  paddingInner(_?: number): number | this {
    return arguments.length
      ? ((this._paddingInner = _!), this)
      : this._paddingInner;
  }

  /**
      The outer padding of band scales.
*/
  paddingOuter(): number;
  paddingOuter(_: number): this;
  paddingOuter(_?: number): number | this {
    return arguments.length
      ? ((this._paddingOuter = _!), this)
      : this._paddingOuter;
  }

  /**
      Scale range (in pixels) of the axis. The given array must have 2 values, but one may be `undefined` to allow the default behavior for that value.
*/
  range(): (number | undefined)[] | undefined;
  range(_: (number | undefined)[]): this;
  range(_?: (number | undefined)[]): unknown {
    return arguments.length ? ((this._range = _), this) : this._range;
  }

  /**
      The rounding method for more evenly spaced ticks at the extents of the scale. Can be "none" (default), "outside", or "inside".
*/
  rounding(): string;
  rounding(_: string): this;
  rounding(_?: string): string | this {
    return arguments.length ? ((this._rounding = _!), this) : this._rounding;
  }

  /**
      The prefix for the minimum value of "inside" rounding scales.
*/
  roundingInsideMinPrefix(): string;
  roundingInsideMinPrefix(_: string): this;
  roundingInsideMinPrefix(_?: string): string | this {
    return arguments.length
      ? ((this._roundingInsideMinPrefix = _!), this)
      : this._roundingInsideMinPrefix;
  }

  /**
      The suffix for the minimum value of "inside" rounding scales.
*/
  roundingInsideMinSuffix(): string;
  roundingInsideMinSuffix(_: string): this;
  roundingInsideMinSuffix(_?: string): string | this {
    return arguments.length
      ? ((this._roundingInsideMinSuffix = _!), this)
      : this._roundingInsideMinSuffix;
  }

  /**
      The prefix for the maximum value of "inside" rounding scales.
*/
  roundingInsideMaxPrefix(): string;
  roundingInsideMaxPrefix(_: string): this;
  roundingInsideMaxPrefix(_?: string): string | this {
    return arguments.length
      ? ((this._roundingInsideMaxPrefix = _!), this)
      : this._roundingInsideMaxPrefix;
  }

  /**
      The suffix for the maximum value of "inside" rounding scales.
*/
  roundingInsideMaxSuffix(): string;
  roundingInsideMaxSuffix(_: string): this;
  roundingInsideMaxSuffix(_?: string): string | this {
    return arguments.length
      ? ((this._roundingInsideMaxSuffix = _!), this)
      : this._roundingInsideMaxSuffix;
  }

  /**
      Scale of the axis.
*/
  scale(): string;
  scale(_: string): this;
  scale(_?: string): string | this {
    return arguments.length ? ((this._scale = _!), this) : this._scale;
  }

  /**
      The "padding" property of the scale, often used in point scales.
*/
  scalePadding(): number;
  scalePadding(_: number): this;
  scalePadding(_?: number): number | this {
    return arguments.length
      ? ((this._scalePadding = _!), this)
      : this._scalePadding;
  }

  /**
      Phase-E: runs the layout pass only — scale construction, tick selection,
      label textWrap, and outerBounds — with **no DOM access**. After it
      returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
      exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
      tick shapes, or label TextBoxes are created.

      This is the v4 path for "how much room will this axis need?" without
      the temp-DOM dance — see `Plot._draw`'s test-axes for the production
      caller. Internally it delegates to the standalone `measureAxis(axis)`
      function in axisLayout.ts; the free function shape means Plot (and
      future callers) can run layout without owning an Axis instance.
  */
  measure(): this {
    measureAxis(this);
    return this;
  }

  /**
      Controls whether render() does the full DOM work ("full", default) or skips
      grid/bar/title DOM and propagates compute mode to the tick Shape ("compute").
      See Shape.renderMode.
*/
  renderMode(): "full" | "compute";
  renderMode(_: "full" | "compute"): this;
  renderMode(_?: "full" | "compute"): "full" | "compute" | this {
    if (!arguments.length) return this._renderMode;
    this._renderMode = _!;
    return this;
  }

  /**
      The SVG container element as a d3 selector or DOM element.

      Passing `null` or `undefined` deliberately leaves the axis unmounted
      — `renderMode("compute")` plus `select(null)` produces a
      scene-only axis (no detached SVG fallback). This is the formal
      contract callers in `plotPaint` use to compute axis layout without
      mounting DOM.
*/
  select(): D3Selection;
  select(_: string | HTMLElement | null | undefined): this;
  select(_?: string | HTMLElement | null): unknown {
    if (!arguments.length) return this._select;
    if (_ == null) {
      this._select = undefined as unknown as D3Selection;
    } else {
      this._select = select(_ as never) as unknown as D3Selection;
    }
    return this;
  }

  /**
      Tick shape constructor.
*/
  shape(): string;
  shape(_: string): this;
  shape(_?: string): string | this {
    return arguments.length ? ((this._shape = _!), this) : this._shape;
  }

  /**
      Tick style of the axis.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(): Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(_: Record<string, any>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(_?: Record<string, any>): unknown {
    return arguments.length
      ? ((this._shapeConfig = assign(this._shapeConfig, _ as Record<string, unknown>)), this)
      : this._shapeConfig;
  }

  /**
      Tick formatter.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickFormat(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickFormat(_: any): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickFormat(_?: any): unknown {
    return arguments.length ? ((this._tickFormat = _), this) : this._tickFormat;
  }

  /**
      Tick values of the axis.
*/
  ticks(): unknown[] | undefined;
  ticks(_: unknown[]): this;
  ticks(_?: unknown[]): unknown {
    return arguments.length ? ((this._ticks = _), this) : this._ticks;
  }

  /**
      Tick size of the axis.
*/
  tickSize(): number;
  tickSize(_: number): this;
  tickSize(_?: number): number | this {
    return arguments.length ? ((this._tickSize = _!), this) : this._tickSize;
  }

  /**
      The tick abbreviation behavior for linear scales. Accepts "normal" (uses formatAbbreviate) or "smallest" (uses the suffix from the smallest tick as reference for every tick).
*/
  tickSuffix(): string;
  tickSuffix(_: string): this;
  tickSuffix(_?: string): string | this {
    return arguments.length
      ? ((this._tickSuffix = _!), this)
      : this._tickSuffix;
  }

  /**
      Defines a custom locale object to be used in time scale. This object must include the following properties: dateTime, date, time, periods, days, shortDays, months, shortMonths. For more information, you can revise [d3p.d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale).
*/
  timeLocale(): Record<string, unknown> | undefined;
  timeLocale(_: Record<string, unknown>): this;
  timeLocale(_?: Record<string, unknown>): unknown {
    return arguments.length ? ((this._timeLocale = _), this) : this._timeLocale;
  }

  /**
      Title of the axis.
*/
  title(): string | undefined;
  title(_: string): this;
  title(_?: string): string | undefined | this {
    return arguments.length ? ((this._title = _), this) : this._title;
  }

  /**
      Title configuration of the axis.
*/
  titleConfig(): Record<string, unknown>;
  titleConfig(_: Record<string, unknown>): this;
  titleConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this._titleConfig = Object.assign(this._titleConfig, _)), this)
      : this._titleConfig;
  }

  /**
      Overall width of the axis.
*/
  width(): number;
  width(_: number): this;
  width(_?: number): number | this {
    return arguments.length ? ((this._width = _!), this) : this._width;
  }
}

/* ============================== free function ============================== */

/**
    Pure-function entry point for axis layout. Given a fully configured
    `Axis` instance, runs the layout pass (no DOM) and returns a fresh result
    bag — bounds, the d3 scale(s), a `getPosition` projector, plus the
    laid-out tick state.

    Callers who don't want to manage an Axis instance long-term can build
    one on the fly, call this, and discard:

    ```ts
    const axis = new AxisBottom()
      .domain([0, 100])
      .width(800).height(400)
      .data(data)
      .config(userAxisConfig);
    const layout = computeAxisLayout(axis);
    // layout.bounds, layout.getPosition, layout.d3Scale all populated.
    ```

    This is the "no temp DOM, no test svg" path Plot's `_xTest`/`_yTest`
    consume — see Plot._draw. Internally this is a thin wrapper over
    `axis.measure()` returning a frozen snapshot of the laid-out state.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AxisLayout {
  bounds: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d3Scale: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d3ScaleNegative: any;
  getPosition: (d: unknown) => number;
  availableTicks: unknown[];
  visibleTicks: unknown[];
  margin: Record<string, number>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeAxisLayout(axis: any): AxisLayout {
  // Free function from axisLayout.ts. Mutates `axis` (legacy interop) and
  // returns the layout artifacts; we re-shape its result + the mutated
  // instance fields into the stable `AxisLayout` API.
  measureAxis(axis);
  return {
    bounds: axis._outerBounds,
    d3Scale: axis._d3Scale,
    d3ScaleNegative: axis._d3ScaleNegative,
    getPosition: (d: unknown) => axis._getPosition(d),
    availableTicks: axis._availableTicks,
    visibleTicks: axis._visibleTicks,
    margin: axis._margin,
  };
}

// Re-export the standalone `measureAxis` and its result type so consumers
// can import them from the same module as the Axis class.
export {measureAxis} from "./axisLayout.js";
export type {AxisLayoutResult} from "./axisLayout.js";
