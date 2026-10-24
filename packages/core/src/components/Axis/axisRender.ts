import {extent, min, range as d3Range} from "d3-array";
import * as scales from "d3-scale";

import {elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import * as shapes from "../../shapes/index.js";
import type Shape from "../../shapes/Shape.js";
import type {BaseShapeConfig} from "../../shapes/shapeConfig.js";
import type {AxisTextDatum} from "./axisLayoutLabels.js";
import {addDomainEnds, crowdsEndLabel} from "./axisEndLabels.js";
import {configPrep} from "../../utils/index.js";
import type {D3Scale} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";

import type Axis from "./Axis.js";
import {brokenScaleTicks, isBrokenScale} from "./axisBreak.js";
import {ceilPow, fixFloat, floorPow, isNegative} from "./axisRounding.js";
import {powTicks} from "./powTicks.js";
import {timeDataInDomain} from "./timeValues.js";
import {slantedLabelBox} from "./axisLabelAngle.js";
import type {AxisOrient} from "./axisLabelAngle.js";

const maxTimezoneOffset = 1000 * 60 * 60 * 26;

/**
 * Calculates ticks from a given scale (negative and/or positive)
 * @param {scale} scale A d3-scale object
 * @param {Array} scaleData The time axis's data inside the scale's domain.
 * @private
 */
function calculateStep(
  this: Axis,
  scale: D3Scale,
  minorTicks: boolean,
  scaleData: Date[],
): number {
  const stepScale = scales.scaleLinear().domain([200, 1200]).range([8, 28]);
  const scaleRange = scale.range();
  const size = Math.abs(scaleRange[1] - scaleRange[0]);
  let step = Math.floor(stepScale(size));

  if (this.schema.scale === "time") {
    if (scaleData.length) {
      const dataExtent = extent(scaleData as unknown as number[]);
      const distance = (scaleData as unknown[]).reduce(
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
  scale: D3Scale,
  minorTicks: boolean = false,
): unknown[] {
  // A broken scale ticks each segment like an axis; a label pass drops a crowded break edge's label.
  if (isBrokenScale(scale))
    return brokenScaleTicks(
      scale,
      s => calculateTicks.call(this, s, minorTicks),
      minorTicks
        ? undefined
        : (v, regular, s) => !crowdsEndLabel(v, regular, d => s(d)),
    );
  let ticks: unknown[];

  const scaleClone = scale.copy();
  // A time axis ticks the data it shows: the dates inside its domain, so a
  // domain narrower than the data (a zoomed view) re-ticks for that window.
  const scaleData =
    this.schema.scale === "time"
      ? timeDataInDomain(this._scaleData as Date[], scale)
      : [];
  if (scaleData.length) {
    const newDomain = extent(scaleData) as unknown as number[];
    const range = newDomain.map(d => scale(d));
    scaleClone.domain(newDomain).range(range);
  }

  const domain = scaleClone.domain() as number[];
  const inverted = domain[1] < domain[0];
  const step = calculateStep.call(this, scaleClone, minorTicks, scaleData);

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
        ? scaleClone.ticks!(step).filter(
            (d: number) => +`${d}`.replace("0.", "") % 2 === 0,
          )
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
  } else if (scaleClone.exponent && scaleClone.exponent() !== 1) {
    // Labels take every other step, as the linear filter below does.
    ticks = powTicks(
      domain,
      scaleClone.exponent(),
      Math.max(1, step / 2),
      minorTicks,
    );
  } else {
    ticks = scaleClone.ticks!(step);
    if (
      !minorTicks &&
      !["log", "time"].includes(this.schema.scale) &&
      ticks.length > 1
    ) {
      const majorDiff = Math.abs(
        fixFloat((ticks[1] as number) - (ticks[0] as number)) * 2,
      );
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
  if (this.schema.scale === "time" && this._scaleData.length) {
    const dataNumbers = this._scaleData.map(Number);
    ticks = ticks.filter((t: unknown) => {
      const tn = +(t as number);
      return dataNumbers.find(
        (n: number) =>
          n >= tn - maxTimezoneOffset && n <= tn + maxTimezoneOffset,
      );
    });
  }

  return addDomainEnds(this, ticks, domain, scaleClone, !minorTicks);
}

/** Laid-out artifacts produced by `measureAxis` that the paint phase consumes. */
export interface AxisMeasure {
  ticks: unknown[];
  labels: unknown[];
  range: number[];
  textData: AxisTextDatum[];
  tickFormat: (d: unknown) => string;
  hBuff: number;
  labelHeight: number;
}

/** A slanted label's box, relative to its tick (see `slantedLabelBox`). */
function slantedBounds(
  axis: Axis,
  data: AxisTextDatum,
  gap: number,
): Record<string, number> {
  const {x, y, width, height} = slantedLabelBox(
    axis.schema.orient as AxisOrient,
    data.angle!,
    data.width,
    data.height - data.fP,
    data.height,
    gap,
  );
  return {x, y, width, height};
}

/**
    An upright (±90 degree) label's box, relative to its tick: centered on
    it, reaching out from the axis by the label's length.
*/
function uprightBounds(
  axis: Axis,
  data: AxisTextDatum,
  size: number,
): Record<string, number> {
  const {fP, fS, lineHeight, lines, width} = data;
  const text = lineHeight * lines.length;
  return {
    x: -width / 2 + ((data.angle ?? -90) > 0 ? -1 : 1) * (fS / 4),
    y:
      axis.schema.orient === "bottom"
        ? size + (width - text) / 2 + fP
        : size - (width + text) / 2 - 2 * fP,
    width,
    height: data.height,
  };
}

/**
    Builds the per-tick config array consumed by the tick Shape. Extracted from
    `Axis.render` so the render method stays under the per-function line budget;
    behavior is identical.
    @private
*/
export function buildTickData(
  axis: Axis,
  measure: AxisMeasure,
): Record<string, unknown>[] {
  const {ticks, labels, textData, tickFormat, hBuff, labelHeight} = measure;
  const {height, x, y, horizontal, opposite} = axis._position;
  const flip = ["top", "left"].includes(axis.schema.orient);
  const p = axis.schema.padding;
  const margin: Record<string, number> = axis._margin;
  const bounds = axis._outerBounds;

  const labelOnly = labels.filter(
    (d: unknown, i: number) => textData[i].lines.length && !ticks.includes(d),
  );

  const rotated = textData.some((d: AxisTextDatum) => d.rotate);

  let tickData: Record<string, unknown>[] = ticks
    .concat(labelOnly)
    .map((d: unknown) => {
      const data = textData.find((td: AxisTextDatum) => td.d === d);

      const xPos = axis._getPosition(d);
      const space = data ? data.space : 0;
      const fP = data ? data.fP : 0;

      const labelOffset =
        data && axis.schema.labelOffset ? (data.offset ?? 0) : 0;

      const fitWidth = horizontal
        ? space
        : bounds.width -
          margin[axis._position.opposite] -
          hBuff -
          margin[axis.schema.orient] +
          p;
      // A `fixedSize` label space can be narrower than a label: widen that
      // label's box (outward, away from the axis line) instead of dropping it.
      const labelWidth =
        !horizontal && data && typeof axis.schema.fixedSize === "number"
          ? Math.max(fitWidth, Math.ceil(data.width) + p)
          : fitWidth;

      const offset = margin[opposite],
        size = (hBuff + labelOffset) * (flip ? -1 : 1),
        yPos = flip ? bounds[y] + bounds[height] - offset : bounds[y] + offset;

      const tickConfig: Record<string, unknown> = {
        id: d,
        labelBounds: data?.slant
          ? slantedBounds(axis, data, Math.abs(size) + (horizontal ? fP : p))
          : rotated && data
            ? uprightBounds(axis, data, size)
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
        angle: data ? data.angle : 0,
        size:
          labels.includes(d) ||
          (axis.schema.scale === "log" &&
            Math.log10(Math.abs(d as number)) % 1 === 0)
            ? size
            : ticks.includes(d)
              ? Math.ceil(size / 2)
              : axis._scaleData.find((t: unknown) => +(t as number) === d)
                ? Math.ceil(size / 4)
                : 0,
        text: !data?.truncated && labels.includes(d) ? tickFormat(d) : false,
        tick: ticks.includes(d),
        [x]:
          xPos +
          (axis.schema.scale === "band" ? axis._d3Scale!.bandwidth!() / 2 : 0),
        [y]: yPos,
      };

      return tickConfig;
    });

  if (axis.schema.shape === "Line") {
    tickData = tickData.concat(
      tickData.map((d: Record<string, unknown>) => {
        const dupe = Object.assign({}, d);
        dupe[y] = (dupe[y] as number) + (d.size as number);
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
export function configureTickShape(
  axis: Axis,
  tickData: Record<string, unknown>[],
): void {
  axis._tickShape = new (shapes as unknown as Record<string, new () => Shape>)[
    axis.schema.shape
  ]()
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
      rotate: (d: DataPoint) => {
        const datum = (d.rotate !== undefined ? d : d.data) as
          DataPoint | undefined;
        return datum?.rotate ? Number(datum.angle ?? -90) : 0;
      },
    });
  // v4 scene-only: tick shape stays compute-mode; toScene() composes ticks.
  // No `g.ticks` DOM wrapper needed in the detached compute.
  axis
    ._tickShape!.config(
      configPrep.bind(axis as unknown as ConfigPrepHost)(
        axis.schema.shapeConfig,
      ) as Partial<BaseShapeConfig>,
    )
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
  group: D3Selection | null,
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
    .rotate(
      axis.schema.orient === "left"
        ? -90
        : axis.schema.orient === "right"
          ? 90
          : 0,
    )
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
    .config(
      configPrep.bind(axis as unknown as ConfigPrepHost)(
        axis.schema.titleConfig,
      ),
    )
    .render();
}
