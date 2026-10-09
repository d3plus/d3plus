/**
    The static parts of the dial, as scene nodes in the dial's own
    coordinates (origin at the dial's center): the track, the bands, the tick
    marks and labels, and the value and name labels. None of them are hit
    targets; the indicators and their hit areas carry the interaction.
*/

import {arc as d3Arc} from "d3-shape";
import {textWidth} from "@d3plus/dom";
import type {ArcGeometry, PathNode, SceneNode, TextNode} from "@d3plus/render";

import type {DialLayout} from "./dialLayout.js";
import {gaugeAngle} from "./gaugeGeometry.js";
import type {GaugeShared} from "./applyLayout.js";

/** Resolved colors and fonts for a gauge's static parts. */
export interface DialStyle {
  trackFill: string;
  tickStroke: string;
  tickStrokeWidth: number;
  fontColor: string;
  fontFamily: string;
  tickFormat: (value: number) => string;
}

const arcGen = d3Arc<ArcGeometry>();

/** The SVG path for an annular sector. */
export const arcPath = (geometry: ArcGeometry): string =>
  arcGen(geometry) ?? "";

/** An annular-sector path node, carrying its geometry so updates tween as arcs. */
export function arcNode(
  key: string,
  geometry: ArcGeometry,
  fill: string,
): PathNode {
  return {
    type: "path",
    key,
    interactive: false,
    d: arcPath(geometry),
    arc: geometry,
    paint: {fill},
  };
}

/**
    `text` at `size`, shrunk (down to `minSize`) to fit `maxWidth`, then cut
    short with an ellipsis if it still doesn't fit.
*/
export function fitText(
  text: string,
  family: string,
  size: number,
  maxWidth: number,
  minSize = 8,
  weight: number | string = 400,
): {text: string; size: number; width: number} {
  const measure = (t: string, s: number) =>
    textWidth(t, {
      "font-family": family,
      "font-size": s,
      "font-weight": weight,
    });
  let width = measure(text, size);
  if (width > maxWidth && width > 0) {
    size = Math.max(minSize, (size * maxWidth) / width);
    width = measure(text, size);
  }
  let fitted = text;
  while (width > maxWidth && fitted.length > 1) {
    fitted = fitted.slice(0, -1);
    width = measure(`${fitted.trimEnd()}…`, size);
    if (width <= maxWidth) return {text: `${fitted.trimEnd()}…`, size, width};
  }
  return {text: fitted, size, width};
}

/** A single-line label centered on `(x, y)`. */
export function textNode(
  key: string,
  text: string,
  x: number,
  y: number,
  opts: {
    size: number;
    family: string;
    color: string;
    weight?: number | string;
    width?: number;
  },
): TextNode {
  const width =
    opts.width ??
    textWidth(text, {"font-family": opts.family, "font-size": opts.size});
  return {
    type: "text",
    key,
    interactive: false,
    x: 0,
    y: 0,
    transform: {x, y},
    lines: [{text, x: 0, y: 0, width}],
    font: {
      family: opts.family,
      size: opts.size,
      weight: opts.weight ?? 400,
      anchor: "middle",
      baseline: "middle",
    },
    paint: {fill: opts.color},
  };
}

/** One path of radial tick marks running inward from `r0` to `r1`. */
function tickPath(angles: number[], r0: number, r1: number): string {
  return angles
    .map(a => {
      const sin = Math.sin(a);
      const cos = Math.cos(a);
      return `M${r0 * sin},${-r0 * cos}L${r1 * sin},${-r1 * cos}`;
    })
    .join("");
}

/** The tracks, bands, and ticks (marks and labels) of the dial. */
export function emitDialParts(
  key: string,
  layout: DialLayout,
  shared: GaugeShared,
  style: DialStyle,
): SceneNode[] {
  const {domain, start, end, ticks, bands} = shared;
  const angle = (v: number) => gaugeAngle(v, domain, start, end);
  const nodes: SceneNode[] = layout.rings.map((ring, i) =>
    arcNode(
      `${key}-track-${i}`,
      {
        innerRadius: ring.inner,
        outerRadius: ring.outer,
        startAngle: start,
        endAngle: end,
      },
      style.trackFill,
    ),
  );
  bands.forEach((b, i) =>
    nodes.push(
      arcNode(
        `${key}-band-${i}`,
        {
          innerRadius: layout.bandInner,
          outerRadius: layout.bandOuter,
          startAngle: angle(b.min),
          endAngle: angle(b.max),
        },
        b.color,
      ),
    ),
  );
  const tickPaint = {
    fill: "none",
    stroke: style.tickStroke,
    strokeLinecap: "round" as const,
  };
  if (ticks.minor.length)
    nodes.push({
      type: "path",
      key: `${key}-minor-ticks`,
      interactive: false,
      d: tickPath(
        ticks.minor.map(angle),
        layout.tickOuter,
        layout.tickOuter - layout.minorLength,
      ),
      paint: {
        ...tickPaint,
        strokeWidth: style.tickStrokeWidth / 2,
        strokeOpacity: 0.75,
      },
    });
  if (ticks.major.length)
    nodes.push({
      type: "path",
      key: `${key}-major-ticks`,
      interactive: false,
      d: tickPath(
        ticks.major.map(angle),
        layout.tickOuter,
        layout.tickOuter - layout.majorLength,
      ),
      paint: {...tickPaint, strokeWidth: style.tickStrokeWidth},
    });
  if (layout.tickLabelRadius > 0)
    ticks.major.forEach((t, i) => {
      const a = angle(t);
      const r = layout.tickLabelRadius;
      nodes.push(
        textNode(
          `${key}-tick-${i}`,
          style.tickFormat(t),
          r * Math.sin(a),
          -r * Math.cos(a),
          {
            size: layout.tickFontSize,
            family: style.fontFamily,
            color: style.fontColor,
          },
        ),
      );
    });
  return nodes;
}

/** The value label and, when the gauge is named, its name beneath it. */
export function emitDialLabels(
  key: string,
  layout: DialLayout,
  style: DialStyle,
  value: string,
  name: string | undefined,
): SceneNode[] {
  const nodes: SceneNode[] = [];
  if (value) {
    const fit = fitText(
      value,
      style.fontFamily,
      layout.valueFontSize,
      layout.valueMaxWidth,
      8,
      600,
    );
    nodes.push(
      textNode(`${key}-value`, fit.text, 0, layout.valueY, {
        size: fit.size,
        family: style.fontFamily,
        color: style.fontColor,
        weight: 600,
        width: fit.width,
      }),
    );
  }
  if (name && layout.nameFontSize) {
    const fit = fitText(
      name,
      style.fontFamily,
      layout.nameFontSize,
      layout.nameMaxWidth,
    );
    nodes.push(
      textNode(`${key}-name`, fit.text, 0, layout.nameY, {
        size: fit.size,
        family: style.fontFamily,
        color: style.fontColor,
        width: fit.width,
      }),
    );
  }
  return nodes;
}
