/**
    The bivariate ColorScale's key: its grid of colors turned 45° into a
    diamond, low/low at the bottom corner and high/high at the top, the first
    variable rising toward the right corner and the second toward the left,
    each named along its lower edge.
*/
import {textWidth} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";
import {fontFamilyStringify, textWrap} from "@d3plus/text";

import type {DataPoint} from "@d3plus/data";

import type {D3Scale} from "../../utils/index.js";
import {formatYear, isYearLike} from "../Axis/yearValues.js";
import type ColorScale from "./ColorScale.js";
import {
  bivariateBucketCount,
  bivariatePalette,
  bivariateScale,
  isBivariatePair,
} from "./bivariateScale.js";
import type {BivariateBins, BivariateScale} from "./bivariateScale.js";

/** The side of the key's grid before it turns, in pixels, when it fits. */
const GRID_SIDE = 80;
/** The gap between the diamond's edge and its labels. */
const LABEL_GAP = 4;

/** A bivariate key cell's datum: a colorScale bucket that is one cell of the grid. */
export interface BivariateCell extends DataPoint {
  color: string;
  id: string;
  _isColorScaleBucket: true;
  /** The cell's column: the first variable's bin. */
  _bivariateX: number;
  /** The cell's row: the second variable's bin. */
  _bivariateY: number;
}

/** Where a laid-out bivariate key draws, in its own space. */
export interface BivariateLayout {
  nodes: SceneNode[];
  bounds: {x: number; y: number; width: number; height: number};
}

/** Grid point `(u, v)` (`u` along the first variable, `v` the second) turned into the diamond, low/low at the origin. */
function toDiamond(u: number, v: number): [number, number] {
  return [(u - v) * Math.SQRT1_2, -(u + v) * Math.SQRT1_2];
}

/**
    The names the key gives its two variables: `bivariateLabels`, else the
    names the chart passes (its field names).
    @param cs The ColorScale.
*/
export function bivariateAxisLabels(cs: ColorScale): [string, string] {
  const own = cs.schema.bivariateLabels as unknown;
  const fields = (cs._bivariateFields ?? []) as unknown[];
  const pick = (k: number): string => {
    const label = Array.isArray(own) ? own[k] : undefined;
    const value = label ?? fields[k];
    return value === undefined || value === null ? "" : `${value}`;
  };
  return [pick(0), pick(1)];
}

/**
    How a ColorScale's values read in a bivariate key's ranges and in a
    chart's tooltip: `axisConfig.tickFormat`, else a variable whose values
    all read as years as years, else abbreviated (`formatAbbreviate`).
    @param cs The ColorScale.
    @param values The variable's values.
*/
export function colorScaleValueFormat(
  cs: ColorScale,
  values: number[],
): (v: number) => string {
  const tickFormat = cs.schema.axisConfig?.tickFormat as
    ((v: number) => string) | undefined;
  if (tickFormat) return tickFormat;
  if (values.length && isYearLike(values))
    return v => formatYear(v, cs.schema.locale);
  return v => formatAbbreviate(v, cs.schema.locale);
}

/** A bin's range as text (`"lo - hi"`, or one value), or "" for an empty bin. */
function rangeText(
  cs: ColorScale,
  bins: BivariateBins,
  b: number,
  format: (v: number) => string,
): string {
  const range = bins.ranges[b];
  if (!range) return "";
  return cs.schema.bucketJoiner(format(range[0]), format(range[1]));
}

/** A cell's title: each variable's name and the range of its bin. */
function cellTitle(
  cs: ColorScale,
  scale: BivariateScale,
  [i, j]: [number, number],
  labels: [string, string],
  formats: [(v: number) => string, (v: number) => string],
): string {
  return [
    [labels[0], rangeText(cs, scale.x, i, formats[0])],
    [labels[1], rangeText(cs, scale.y, j, formats[1])],
  ]
    .filter(([, range]) => range)
    .map(([label, range]) => (label ? `${label}: ${range}` : range))
    .join(", ");
}

/** The label font the key reads off `labelConfig`, for `text`. */
function labelFont(
  cs: ColorScale,
  text: string,
): {family: string; size: number; weight: number | string; color: string} {
  const read = (key: string): unknown => {
    const v = (cs._labelClass as unknown as Record<string, () => unknown>)[
      key
    ]();
    return typeof v === "function" ? v(text, 0) : v;
  };
  const family = read("fontFamily") as string | string[];
  return {
    family: fontFamilyStringify(family),
    size: Number(read("fontSize")) || 12,
    weight: (read("fontWeight") as number | string) ?? 400,
    color: `${read("fontColor")}`,
  };
}

/**
    One variable's name along its lower edge of the diamond: up to two lines
    as long as the edge, an arrow pointing the way the variable rises.
*/
function edgeLabel(
  cs: ColorScale,
  text: string,
  axis: 0 | 1,
  side: number,
): {node: SceneNode; corners: [number, number][]} | null {
  if (!text) return null;
  const font = labelFont(cs, text);
  const style = {
    "font-family": font.family,
    "font-size": font.size,
    "font-weight": font.weight,
  };
  const arrow = axis === 0 ? " →" : "← ";
  const arrowWidth = textWidth(arrow, style) as number;
  // Lines as long as the edge, never splitting a word.
  const widest = Math.max(
    ...text.split(/\s+/).map(word => textWidth(word, style) as number),
  );
  const wrapped = textWrap()
    .fontFamily(font.family)
    .fontSize(font.size)
    .fontWeight(font.weight)
    .lineHeight(font.size * 1.2)
    .maxLines(2)
    // Whole words only: no hyphenating a long one across the lines.
    .split((sentence: string) => sentence.match(/\S+\s*/g) ?? [])
    .width(Math.max(side - arrowWidth, widest + 1))
    .height(font.size * 1.2 * 2 + 1)(text);
  const lines = wrapped.lines.length ? wrapped.lines.slice() : [text];
  // The arrow rides the line nearest the far corner: the first variable's
  // reads toward its corner at the end of the last line, the second's
  // toward its corner at the start of the first.
  if (axis === 0) lines[lines.length - 1] += arrow;
  else lines[0] = arrow + lines[0];
  const lineHeight = font.size * 1.2;
  const widths = lines.map(l => textWidth(l, style) as number);
  const width = Math.max(...widths);
  // The edge's direction (x) and outward normal (y) the label's lines lie
  // along, and the label's center: the edge's midpoint, or, for a label
  // longer than the edge, past it toward the far corner, so the two labels
  // never meet below the bottom corner.
  const rotate = axis === 0 ? -45 : 45;
  const ex: [number, number] =
    axis === 0 ? [Math.SQRT1_2, -Math.SQRT1_2] : [Math.SQRT1_2, Math.SQRT1_2];
  const shift = ((axis === 0 ? 1 : -1) * Math.max(0, width - side)) / 2;
  const [ox, oy] = axis === 0 ? toDiamond(side / 2, 0) : toDiamond(0, side / 2);
  const mx = ox + ex[0] * shift;
  const my = oy + ex[1] * shift;
  const ey: [number, number] =
    axis === 0 ? [Math.SQRT1_2, Math.SQRT1_2] : [-Math.SQRT1_2, Math.SQRT1_2];
  const depth = LABEL_GAP + lineHeight * lines.length;
  const corners = (
    [
      [-width / 2, LABEL_GAP],
      [width / 2, LABEL_GAP],
      [-width / 2, depth],
      [width / 2, depth],
    ] as [number, number][]
  ).map(
    ([lx, ly]) =>
      [mx + ex[0] * lx + ey[0] * ly, my + ex[1] * lx + ey[1] * ly] as [
        number,
        number,
      ],
  );
  const node = {
    type: "text",
    key: `bivariate-label-${axis}`,
    x: 0,
    y: 0,
    transform: {x: mx, y: my, rotate},
    lines: lines.map((line, k) => ({
      text: line,
      x: 0,
      y: LABEL_GAP + lineHeight * (k + 0.5),
      width: widths[k],
    })),
    font: {
      family: font.family,
      size: font.size,
      weight: font.weight,
      anchor: "middle",
      baseline: "middle",
    },
    paint: {fill: font.color},
    interactive: false,
    aria: {hidden: true},
  } as SceneNode;
  return {node, corners};
}

/**
    A key cell's stroke: the one `legendConfig.shapeConfig` gives the
    colorScale's swatches, which a chart sets to its own shapes' stroke.
*/
function cellStroke(
  cs: ColorScale,
  datum: BivariateCell,
  i: number,
): {stroke?: string; strokeWidth?: number; strokeOpacity?: number} {
  const sc = ((cs.schema.legendConfig as Record<string, unknown> | undefined)
    ?.shapeConfig ?? {}) as Record<string, unknown>;
  const read = (key: string): unknown => {
    const v = sc[key];
    return typeof v === "function" ? v(datum, i) : v;
  };
  const stroke = read("stroke");
  const strokeWidth = Number(read("strokeWidth"));
  const strokeOpacity = read("strokeOpacity");
  if (typeof stroke !== "string" || !stroke || !(strokeWidth > 0)) return {};
  return {
    stroke,
    strokeWidth,
    ...(typeof strokeOpacity === "number" ? {strokeOpacity} : {}),
  };
}

/** The key's cells, a path each, and their corners. */
function cellNodes(
  cs: ColorScale,
  scale: BivariateScale,
  side: number,
): {nodes: SceneNode[]; corners: [number, number][]} {
  const n = scale.size;
  const step = side / n;
  const labels = bivariateAxisLabels(cs);
  const values = (bins: 0 | 1): number[] => scale.domain().map(p => p[bins]);
  const formats: [(v: number) => string, (v: number) => string] = [
    colorScaleValueFormat(cs, values(0)),
    colorScaleValueFormat(cs, values(1)),
  ];
  const nodes: SceneNode[] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const points = [
        toDiamond(i * step, j * step),
        toDiamond((i + 1) * step, j * step),
        toDiamond((i + 1) * step, (j + 1) * step),
        toDiamond(i * step, (j + 1) * step),
      ];
      const datum: BivariateCell = {
        color: scale.colors[j * n + i],
        id: cellTitle(cs, scale, [i, j], labels, formats),
        _isColorScaleBucket: true,
        _bivariateX: i,
        _bivariateY: j,
      };
      nodes.push({
        type: "path",
        key: `bivariate-cell-${i}-${j}`,
        d: `M${points.map(p => p.map(v => +v.toFixed(3)).join(",")).join("L")}Z`,
        datum,
        index: j * n + i,
        paint: {fill: datum.color, ...cellStroke(cs, datum, j * n + i)},
        aria: {label: datum.id},
      } as SceneNode);
    }
  return {
    nodes,
    corners: [
      toDiamond(0, 0),
      toDiamond(side, 0),
      toDiamond(0, side),
      toDiamond(side, side),
    ],
  };
}

/** Lays the key out with a grid `side` pixels across, low/low corner at the origin. */
function layoutAt(
  cs: ColorScale,
  scale: BivariateScale,
  side: number,
): BivariateLayout {
  const cells = cellNodes(cs, scale, side);
  const labels = bivariateAxisLabels(cs);
  const edges = [
    edgeLabel(cs, labels[0], 0, side),
    edgeLabel(cs, labels[1], 1, side),
  ].filter(Boolean) as {node: SceneNode; corners: [number, number][]}[];
  const corners = cells.corners.concat(...edges.map(e => e.corners));
  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    nodes: [...cells.nodes, ...edges.map(e => e.node)],
    bounds: {
      x,
      y,
      width: Math.max(...xs) - x,
      height: Math.max(...ys) - y,
    },
  };
}

/**
    Lays the key out within the ColorScale's `width` × `height`: its grid
    shrinks from its full size to fit, and it sits along the side its labels
    face (`orient`) at its `align`ment, as the swatch legend does.
    @param cs The ColorScale.
    @param scale Its bivariate scale.
*/
export function layoutBivariate(
  cs: ColorScale,
  scale: BivariateScale,
): BivariateLayout {
  const width = Number(cs.schema.width) || 0;
  const height = Number(cs.schema.height) || 0;
  let side = GRID_SIDE;
  let layout = layoutAt(cs, scale, side);
  // Labels keep their size as the grid shrinks (and may wrap anew): shrink
  // the grid by what the whole key overflows until it fits, down to a third
  // of its size.
  for (let tries = 0; tries < 4 && side > GRID_SIDE / 3; tries++) {
    const over = Math.max(
      layout.bounds.width - width,
      layout.bounds.height - height,
    );
    if (over <= 0 || !width || !height) break;
    side = Math.max(GRID_SIDE / 3, side - over * Math.SQRT1_2 - 1);
    layout = layoutAt(cs, scale, side);
  }
  const horizontal = ["bottom", "top"].includes(cs.schema.orient);
  const spare = (room: number, size: number): number => {
    const align = cs.schema.align;
    const free = Math.max(0, room - size);
    return align === "start" ? 0 : align === "end" ? free : free / 2;
  };
  const left = horizontal
    ? Math.max(0, width - layout.bounds.width) / 2
    : spare(width, layout.bounds.width);
  const top = horizontal
    ? spare(height, layout.bounds.height)
    : Math.max(0, height - layout.bounds.height) / 2;
  const dx = left - layout.bounds.x;
  const dy = top - layout.bounds.y;
  return {
    nodes: [
      {
        type: "group",
        key: "bivariate-key",
        transform: {x: dx, y: dy},
        children: layout.nodes,
      } as SceneNode,
    ],
    bounds: {
      x: left,
      y: top,
      width: layout.bounds.width,
      height: layout.bounds.height,
    },
  };
}

/**
    Builds a bivariate ColorScale's scale from its data (each row's `value`
    a pair of numbers), assigns it as the ColorScale's `_colorScale`, and
    lays out its diamond key.
    @param cs The ColorScale.
*/
export function renderBivariate(cs: ColorScale): BivariateLayout {
  const n = bivariateBucketCount(cs.schema.bivariateBuckets);
  const pairs = cs._data
    .map((d: DataPoint, i: number) => cs.schema.value(d, i))
    .filter(isBivariatePair);
  const scale = bivariateScale(
    pairs,
    n,
    bivariatePalette(cs.schema.bivariateColors, n),
  );
  cs._colorScale = scale as unknown as D3Scale<string>;
  cs._barGeometry = undefined;
  cs._labelClass.config(cs.schema.labelConfig);
  const layout = layoutBivariate(cs, scale);
  cs._outerBounds = layout.bounds;
  return layout;
}
