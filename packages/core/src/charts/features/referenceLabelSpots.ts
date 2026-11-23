/**
    Where reference line and band labels may sit: the spot each prefers,
    and every other spot `placeReferenceLabels` may move it to.
*/
import {
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import type {TextAlign, TextBlock} from "./annotationText.js";
import type {Box} from "./calloutLayout.js";
import {
  LABEL_PAD as PAD,
  slideSteps,
  type LabelSpot,
} from "./referenceLabelPlacement.js";

/**
    Where a reference line's label goes (the top-left of its text block, and
    its alignment): beside the line's `"end"` (the right of a horizontal line,
    the top of a vertical one) or `"start"`, above a horizontal line (below
    it near the plot's top) and right of a vertical one (left of it near the
    plot's right edge).
    @param frame The plot area and its axes.
    @param line The line's axis and pixel position.
    @param block The wrapped label.
    @param position Which end of the line.
*/
export function referenceLineLabelAt(
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number},
  block: TextBlock,
  position: "start" | "end" = "end",
): {x: number; y: number; align: TextAlign} {
  const {plot} = frame;
  if (isVertical(line.axis)) {
    const above = line.at - PAD - block.height;
    return {
      x: position === "start" ? plot.x0 + PAD : plot.x1 - PAD,
      y: above >= plot.y0 ? above : line.at + PAD,
      align: position === "start" ? "start" : "end",
    };
  }
  const right = line.at + PAD + block.width <= plot.x1;
  return {
    x: right ? line.at + PAD : line.at - PAD,
    y: position === "start" ? plot.y1 - PAD - block.height : plot.y0 + PAD,
    align: right ? "start" : "end",
  };
}

/**
    Where a reference band's label goes: inside its top-left corner
    (`"start"`) or top-right (`"end"`).
    @param box The band's rect.
    @param position Which corner.
*/
export function referenceBandLabelAt(
  box: Box,
  position: "start" | "end" = "start",
): {x: number; y: number; align: TextAlign} {
  return position === "end"
    ? {x: box.x + box.width - PAD, y: box.y + PAD, align: "end"}
    : {x: box.x + PAD, y: box.y + PAD, align: "start"};
}

/** Each spot of `firsts` crossed with each of `seconds`, `firsts` varying slowest. */
const cross = <A, B>(firsts: A[], seconds: B[]): [A, B][] =>
  firsts.flatMap(a => seconds.map(b => [a, b] as [A, B]));

/**
    Every spot a reference line's label may take, the one
    `referenceLineLabelAt` picks first: then the other side of the line, then
    the line's other end on either side, then along the line from the
    preferred end on either side.
    @param frame The plot area and its axes.
    @param line The line's axis and pixel position.
    @param block The wrapped label.
    @param position Which end of the line is preferred.
*/
export function referenceLineLabelSpots(
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number},
  block: TextBlock,
  position: "start" | "end" = "end",
): LabelSpot[] {
  const {plot} = frame;
  const first = referenceLineLabelAt(frame, line, block, position);
  const other = position === "start" ? "end" : "start";
  if (isVertical(line.axis)) {
    // A horizontal line: its ends are the plot's sides; its sides, above and below.
    const sides = [
      first.y,
      first.y === line.at + PAD ? line.at - PAD - block.height : line.at + PAD,
    ];
    const ends: [number, TextAlign][] = [
      [first.x, first.align],
      other === "start" ? [plot.x0 + PAD, "start"] : [plot.x1 - PAD, "end"],
    ];
    const along = slideSteps(
      first.align === "end" ? plot.x1 - PAD - block.width : plot.x0 + PAD,
      first.align === "end" ? plot.x0 + PAD : plot.x1 - PAD - block.width,
    );
    return [
      ...cross(ends, sides).map(([[x, align], y]) => ({x, y, align})),
      ...cross(along, sides).map(([x, y]) => ({x, y, align: "start" as const})),
    ];
  }
  // A vertical line: its ends are the plot's top and bottom; its sides, right and left.
  const sides: [number, TextAlign][] = [
    [first.x, first.align],
    first.align === "start" ? [line.at - PAD, "end"] : [line.at + PAD, "start"],
  ];
  const top = plot.y0 + PAD,
    bottom = plot.y1 - PAD - block.height;
  const ends = [first.y, first.y === top ? bottom : top];
  const along = slideSteps(first.y, first.y === top ? bottom : top);
  return cross([...ends, ...along], sides).map(([y, [x, align]]) => ({
    x,
    y,
    align,
  }));
}

/**
    Every spot a reference band's label may take, inside the band: the
    corner `referenceBandLabelAt` picks first, then the other top corner,
    then the bottom corners, then along the band's length from its top (or,
    across the plot, from its preferred side).
    @param box The band's rect.
    @param axis The band's axis.
    @param block The wrapped label.
    @param position Which top corner is preferred.
*/
export function referenceBandLabelSpots(
  box: Box,
  axis: AnnotationAxis,
  block: TextBlock,
  position: "start" | "end" = "start",
): LabelSpot[] {
  const startX: [number, TextAlign] = [box.x + PAD, "start"],
    endX: [number, TextAlign] = [box.x + box.width - PAD, "end"];
  const xs = position === "end" ? [endX, startX] : [startX, endX];
  const top = box.y + PAD,
    bottom = box.y + box.height - PAD - block.height;
  const corners = cross([top, bottom], xs).map(([y, [x, align]]) => ({
    x,
    y,
    align,
  }));
  if (isVertical(axis)) {
    const [[x0], [x1]] = xs;
    const fromX = position === "end" ? x0 - block.width : x0;
    const toX = position === "end" ? x1 : x1 - block.width;
    return [
      ...corners,
      ...cross(slideSteps(fromX, toX), [top, bottom]).map(([x, y]) => ({
        x,
        y,
        align: "start" as const,
      })),
    ];
  }
  return [
    ...corners,
    ...cross(slideSteps(top, bottom), xs).map(([y, [x, align]]) => ({
      x,
      y,
      align,
    })),
  ];
}
