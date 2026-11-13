/**
    The axis title, configured once for both the measure and the paint, so
    the title claims exactly the room it draws.
*/
import type {DataPoint} from "@d3plus/data";
import {fontExists, parseSides, textWidth} from "@d3plus/dom";
import {softHyphen} from "@d3plus/text";

import TextBox from "../TextBox.js";
import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";

import type Axis from "./Axis.js";

/**
    Whether the first word of `box`'s text is wider than its line on its
    own, as the wrap measures it. The wrap can't place such a word on any
    line, so the box would draw nothing.
*/
export function firstWordOverflows(
  box: TextBox,
  d: DataPoint,
  i: number,
): boolean {
  const text = box.schema.text(d, i);
  if (text === undefined) return false;
  const [first] = box.schema.split(`${text}`.trim(), i) as string[];
  if (!first) return false;
  // A syllable ending in a soft hyphen is drawn with a hyphen at a break.
  const word = first.endsWith(softHyphen) ? `${first.slice(0, -1)}-` : first;
  const padding = parseSides(box.schema.padding(d, i));
  const width = textWidth(word, {
    "font-family": fontExists(box.schema.fontFamily(d, i)) as string,
    "font-size": box.schema.fontSize(d, i),
    "font-weight": box.schema.fontWeight(d, i),
  }) as number;
  return width > box.schema.width(d, i) - padding.left - padding.right;
}

/**
    Configures `box` as the axis title wrapped across `range`, in a box
    `height` tall: its text, width, rotation, and `titleConfig`. A first
    word too wide for the axis is cut mid-word with the ellipsis
    (`truncateWord`), so the title still draws; any other title cut short
    ends at a word break. A `truncateWord` in `titleConfig` overrides both.
    A title left out (see `measureAxis` in `axisLimit.ts`) has no data, so
    draws nothing.
*/
export function configureTitle(
  box: TextBox,
  axis: Axis,
  range: number[],
  height: number,
): TextBox {
  const {orient} = axis.schema;
  return box
    .data(
      axis.schema.title && !axis._dropTitle ? [{text: axis.schema.title}] : [],
    )
    .height(height)
    .rotate(orient === "left" ? -90 : orient === "right" ? 90 : 0)
    .text(((d: DataPoint) => d.text) as unknown as string)
    .verticalAlign("middle")
    .width(range[range.length - 1] - range[0])
    .truncateWord((d: DataPoint, i: number) => firstWordOverflows(box, d, i))
    .config(
      configPrep.bind(axis as unknown as ConfigPrepHost)(
        axis.schema.titleConfig,
      ),
    );
}

/**
    The room the axis title claims on the axis's side: its lines as the
    title TextBox wraps them across `range`, within `height`, to the whole
    pixel, plus the axis's padding. A title that draws nothing claims no
    room.
*/
export function titleRoom(axis: Axis, range: number[], height: number): number {
  const box = configureTitle(
    new TextBox().renderMode("compute"),
    axis,
    range,
    height,
  );
  const [datum] = box._textData();
  if (!datum?.lines.some(line => line)) return 0;
  return Math.ceil(datum.lines.length * datum.lH) + axis.schema.padding;
}
