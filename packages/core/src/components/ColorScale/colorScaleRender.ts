import {scaleLinear} from "d3-scale";

import {assign, elem, textWidth} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import {gradientToken} from "@d3plus/render";
import type {SceneGradient} from "@d3plus/render";

import type {DataPoint} from "@d3plus/data";

import type ColorScale from "./ColorScale.js";
import type {ColorScaleCompute} from "./colorScaleScale.js";

/** Shared <g> groups and transition params created by ColorScale.render. */
export interface ColorScaleGroups {
  labelGroup: D3Selection;
  rectGroup: D3Selection;
  legendGroup: D3Selection;
  groupParams: Record<string, unknown>;
  gradient: boolean;
}

interface GradientGeometry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axisScale: any;
  scaleRange: unknown[];
  axisDomain: number[];
  axisBounds: Record<string, number>;
  offsets: Record<string, number>;
}

/** Builds the axis/label configs and trims the gradient for end labels. */
function prepareGradientAxis(
  cs: ColorScale,
  compute: ColorScaleCompute,
  offsets: Record<string, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): {axisConfig: Record<string, any>; labelConfig: Record<string, any>; axisDomain: number[]; labelData: string[]} {
  const {horizontal, height, width, domain, labels, ticks} = compute;

  const axisDomain = (domain as number[]).slice();
  if (cs.schema.bucketAxis) {
    const last = axisDomain[axisDomain.length - 1];
    const prev = axisDomain[axisDomain.length - 2];
    const mod = last ? last / 10 : prev / 10;

    const pow =
      mod >= 1 || mod <= -1
        ? Math.round(mod).toString().length - 1
        : mod
            .toString()
            .split(".")[1]
            .replace(/([1-9])[1-9].*$/, "$1").length * -1;
    const ten = Math.pow(10, pow);
    axisDomain[axisDomain.length - 1] = last + ten;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axisConfig: Record<string, any> = assign(
    {
      domain: horizontal ? axisDomain : axisDomain.slice().reverse(),
      duration: cs.schema.duration,
      height: cs.schema.height,
      labels: labels || ticks,
      orient: cs.schema.orient,
      padding: cs.schema.padding,
      scale: cs.schema.scale === "log" ? "log" : "linear",
      ticks,
      width: cs.schema.width,
    },
    cs.schema.axisConfig,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labelConfig: Record<string, any> = assign(
    {
      height: cs.schema[height] / 2,
      width: cs.schema[width] / 2,
    },
    cs.schema.labelConfig,
  );

  cs._labelClass.config(labelConfig);
  const labelData: string[] = [];

  if (horizontal && cs._labelMin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelCSS: Record<string, any> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-family": (cs._labelClass.fontFamily() as any)(cs._labelMin),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-size": (cs._labelClass.fontSize() as any)(cs._labelMin),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-weight": (cs._labelClass.fontWeight() as any)(cs._labelMin),
    };

    if (labelCSS["font-family"] instanceof Array)
      labelCSS["font-family"] = labelCSS["font-family"][0];
    let labelMinWidth = textWidth(cs._labelMin, labelCSS);

    if (labelMinWidth && labelMinWidth < cs.schema[width] / 2) {
      labelData.push(cs._labelMin);
      labelMinWidth += cs.schema.padding;
      if (horizontal) offsets.x += labelMinWidth;
      axisConfig[width] -= labelMinWidth;
    }
  }
  if (horizontal && cs._labelMax) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelCSS: Record<string, any> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-family": (cs._labelClass.fontFamily() as any)(cs._labelMax),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-size": (cs._labelClass.fontSize() as any)(cs._labelMax),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "font-weight": (cs._labelClass.fontWeight() as any)(cs._labelMax),
    };

    if (labelCSS["font-family"] instanceof Array)
      labelCSS["font-family"] = labelCSS["font-family"][0];
    let labelMaxWidth = textWidth(cs._labelMax, labelCSS);

    if (labelMaxWidth && labelMaxWidth < cs.schema[width] / 2) {
      labelData.push(cs._labelMax);
      labelMaxWidth += cs.schema.padding;
      if (!horizontal) offsets.y += labelMaxWidth;
      axisConfig[width] -= labelMaxWidth;
    }
  }

  return {axisConfig, labelConfig, axisDomain, labelData};
}

/** Renders the measurement + visible axes, returning bounds and the position scale. */
function renderGradientAxes(
  cs: ColorScale,
  compute: ColorScaleCompute,
  groups: ColorScaleGroups,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axisConfig: Record<string, any>,
  offsets: Record<string, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): {axisBounds: Record<string, number>; axisScale: any; scaleRange: unknown[]} {
  const {horizontal, height, width, x, y} = compute;

  cs._axisTest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .renderMode("compute" as any)
    .select(
      elem("g.d3plus-ColorScale-axisTest", {
        enter: {opacity: 0},
        parent: cs._group,
      }).node(),
    )
    .config(axisConfig)
    .duration(0)
    .render();

  const axisBounds = cs._axisTest.outerBounds();

  cs._outerBounds[width] = cs.schema[width] - cs.schema.padding * 2;
  cs._outerBounds[height] = axisBounds[height] + cs.schema.size;

  cs._outerBounds[x] = cs.schema.padding;
  cs._outerBounds[y] = cs.schema.padding;
  if (cs.schema.align === "middle")
    cs._outerBounds[y] = (cs.schema[height] - cs._outerBounds[height]) / 2;
  else if (cs.schema.align === "end")
    cs._outerBounds[y] =
      cs.schema[height] - cs.schema.padding - cs._outerBounds[height];

  const axisGroupOffset =
    cs._outerBounds[y] +
    (["bottom", "right"].includes(cs.schema.orient) ? cs.schema.size : 0) -
    (axisConfig.padding || cs._axisClass.padding());
  const transform = `translate(${offsets.x + (horizontal ? 0 : axisGroupOffset)}, ${offsets.y + (horizontal ? axisGroupOffset : 0)})`;
  cs._axisClass
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .renderMode("compute" as any)
    .select(
      elem(
        "g.d3plus-ColorScale-axis",
        assign(groups.groupParams, {
          condition: true,
          enter: {transform},
          update: {transform},
        }),
      ).node(),
    )
    .config(axisConfig)
    .align("start")
    .render();

  const axisScale = cs._axisTest._getPosition.bind(cs._axisTest);
  const scaleRange = cs._axisTest._getRange();

  return {axisBounds, axisScale, scaleRange};
}

/**
    Computes the smooth-gradient spec and stashes its serializable fill token on
    `cs._gradientFill`. Encodes the gradient vector in objectBoundingBox units
    (0–1) so a backend scales it to the painted Rect: horizontal runs left→right
    `[0,0]→[1,0]`, vertical runs bottom→top `[0,1]→[0,0]` — matching the
    direction the SVG `<linearGradient>` attrs used previously.
*/
function renderGradientStops(
  cs: ColorScale,
  compute: ColorScaleCompute,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axisScale: any,
  scaleRange: unknown[],
): void {
  const {horizontal, colors} = compute;

  const scaleDomain = cs._colorScale.domain();
  const offsetScale = scaleLinear()
    .domain(scaleRange as number[])
    .range(horizontal ? [0, 100] : [100, 0]);

  const stops = (colors as string[])
    .map((color, i) => ({
      offset:
        (i <= scaleDomain.length - 1
          ? (offsetScale(axisScale(scaleDomain[i])) as number)
          : 100) / 100,
      color: String(color),
    }))
    .sort((a, b) => a.offset - b.offset);

  const spec: SceneGradient = {
    type: "linear",
    from: horizontal ? [0, 0] : [0, 1],
    to: horizontal ? [1, 0] : [0, 0],
    stops,
  };

  cs._gradientFill = gradientToken(spec);
}

/** Renders the color rect(s) and returns the resolved rect config. */
function renderGradientRect(
  cs: ColorScale,
  compute: ColorScaleCompute,
  groups: ColorScaleGroups,
  geom: GradientGeometry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const {height, width, x, y, ticks} = compute;
  const {axisScale, scaleRange, axisDomain, axisBounds, offsets} = geom;

  /** determines the width of buckets*/
  const bucketWidth = (d: number, i: number): number => {
    const next = ticks![i + 1] || axisDomain[axisDomain.length - 1];
    return Math.abs(axisScale(next) - axisScale(d));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rectConfig: Record<string, any> = assign(
    {
      duration: cs.schema.duration,
      fill: ticks
        ? (d: number) => cs._colorScale(d)
        : cs._gradientFill,
      [x]: ticks
        ? (d: number, i: number) =>
            axisScale(d) +
            bucketWidth(d, i) / 2 -
            (["left", "right"].includes(cs.schema.orient)
              ? bucketWidth(d, i)
              : 0)
        : (scaleRange[0] as number) + ((scaleRange[1] as number) - (scaleRange[0] as number)) / 2 + offsets[x],
      [y]:
        cs._outerBounds[y] +
        (["top", "left"].includes(cs.schema.orient) ? axisBounds[height] : 0) +
        cs.schema.size / 2 +
        offsets[y],
      [width]: ticks ? bucketWidth : (scaleRange[1] as number) - (scaleRange[0] as number),
      [height]: cs.schema.size,
    },
    cs.schema.rectConfig,
  );

  // Force internal shapes into compute mode so they populate label/scene data
  // without spinning up their own SvgRenderer (which would nest a second <svg>
  // into the page). Legend/Axis do the same.
  cs._rectClass
    .renderMode("compute")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .data((ticks || [0]) as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .id(((_d: unknown, i: number) => i) as any)
    .select(groups.rectGroup.node())
    .config(rectConfig)
    .render();

  return rectConfig;
}

/** Renders the labelMin/labelMax text alongside the gradient. */
function renderGradientLabels(
  cs: ColorScale,
  compute: ColorScaleCompute,
  groups: ColorScaleGroups,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelConfig: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rectConfig: Record<string, any>,
  labelData: string[],
): void {
  const {horizontal, height, width} = compute;

  labelConfig.height = cs._outerBounds[height];
  labelConfig.width = cs._outerBounds[width];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cs._labelClass as any).renderMode("compute");
  cs._labelClass
    .config(labelConfig)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .data(labelData as any)
    .select(groups.labelGroup.node())
    .x(((d: DataPoint) =>
      (d as unknown as string) === cs._labelMax
        ? rectConfig.x + rectConfig.width / 2 + cs.schema.padding
        : cs._outerBounds.x) as unknown as number)
    .y(
      ((d: DataPoint) =>
        rectConfig.y -
        (cs._labelClass.fontSize() as (d: DataPoint) => number)(d) /
          2) as unknown as number,
    )
    .text(((d: DataPoint) => d) as unknown as string)
    .rotate(horizontal ? 0 : cs.schema.orient === "right" ? 90 : -90)
    .render();
}

/** Renders the smooth-gradient (and bucketed-rect) ColorScale variant. */
export function renderGradient(
  cs: ColorScale,
  compute: ColorScaleCompute,
  groups: ColorScaleGroups,
): void {
  const offsets: Record<string, number> = {x: 0, y: 0};

  const {axisConfig, labelConfig, axisDomain, labelData} = prepareGradientAxis(
    cs,
    compute,
    offsets,
  );

  const {axisBounds, axisScale, scaleRange} = renderGradientAxes(
    cs,
    compute,
    groups,
    axisConfig,
    offsets,
  );

  renderGradientStops(cs, compute, axisScale, scaleRange);

  const rectConfig = renderGradientRect(cs, compute, groups, {
    axisScale,
    scaleRange,
    axisDomain,
    axisBounds,
    offsets,
  });

  renderGradientLabels(cs, compute, groups, labelConfig, rectConfig, labelData);
}

/** Renders the discrete legend ColorScale variant (jenks/buckets/quantile). */
export function renderLegendVariant(
  cs: ColorScale,
  compute: ColorScaleCompute,
  groups: ColorScaleGroups,
): void {
  const {horizontal, allValues, ticks, colors} = compute;

  elem(
    "g.d3plus-ColorScale-axis",
    Object.assign({condition: groups.gradient}, groups.groupParams),
  );

  let legendData = ticks!.reduce(
    (
      arr: {color: string; id: string; _isColorScaleBucket: boolean}[],
      tick: number,
      i: number,
    ) => {
      const label = cs.schema.bucketFormat.bind(cs)(tick, i, ticks!, allValues);
      // `_isColorScaleBucket` marks these as range buckets (not groupBy rows)
      // so a parent Viz's `_drawLabel` titles their tooltip with the bucket
      // label (`id`) instead of resolving to "undefined" via groupBy.
      arr.push({color: colors[i + 1], id: label, _isColorScaleBucket: true});

      return arr;
    },
    [],
  );
  if (!horizontal) legendData = legendData.reverse();

  const legendConfig = assign(
    {
      align: horizontal
        ? "center"
        : ({start: "left", middle: "center", end: "right"} as Record<string, string>)[cs.schema.align],
      direction: horizontal ? "row" : "column",
      duration: cs.schema.duration,
      height: cs.schema.height,
      padding: cs.schema.padding,
      shapeConfig: assign(
        {duration: cs.schema.duration} as Record<string, unknown>,
        (cs.schema.axisConfig.shapeConfig || {}) as Record<string, unknown>,
      ),
      title: cs.schema.axisConfig.title,
      titleConfig: (cs.schema.axisConfig.titleConfig || {}) as Record<string, unknown>,
      width: cs.schema.width,
      verticalAlign: horizontal
        ? ({start: "top", middle: "middle", end: "bottom"} as Record<string, string>)[cs.schema.align]
        : "middle",
    } as Record<string, unknown>,
    cs.schema.legendConfig,
  );

  cs._legendClass
    .renderMode("compute")
    .data(legendData)
    .select(groups.legendGroup.node())
    .config(legendConfig)
    .render();

  cs._outerBounds = cs._legendClass.outerBounds();
}
