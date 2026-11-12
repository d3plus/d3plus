/**
    The axis title, configured once for both the measure and the paint, so
    the title claims exactly the room it draws.
*/
import type {DataPoint} from "@d3plus/data";

import TextBox from "../TextBox.js";
import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";

import type Axis from "./Axis.js";

/**
    Configures `box` as the axis title wrapped across `range`, in a box
    `height` tall: its text, width, rotation, and `titleConfig`.
*/
export function configureTitle(
  box: TextBox,
  axis: Axis,
  range: number[],
  height: number,
): TextBox {
  const {orient} = axis.schema;
  return box
    .data(axis.schema.title ? [{text: axis.schema.title}] : [])
    .height(height)
    .rotate(orient === "left" ? -90 : orient === "right" ? 90 : 0)
    .text(((d: DataPoint) => d.text) as unknown as string)
    .verticalAlign("middle")
    .width(range[range.length - 1] - range[0])
    .config(
      configPrep.bind(axis as unknown as ConfigPrepHost)(
        axis.schema.titleConfig,
      ),
    );
}

/**
    The room the axis title claims on the axis's side: its lines as the
    title TextBox wraps them across `range`, within `height`, to the whole
    pixel, plus the axis's padding.
*/
export function titleRoom(axis: Axis, range: number[], height: number): number {
  const box = configureTitle(
    new TextBox().renderMode("compute"),
    axis,
    range,
    height,
  );
  const [datum] = box._textData();
  const text = datum ? Math.ceil(datum.lines.length * datum.lH) : 0;
  return text + axis.schema.padding;
}
