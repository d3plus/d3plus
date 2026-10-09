import {default as BarBuffer} from "./Bar.js";
import {default as BoxBuffer} from "./Box.js";
import {default as CircleBuffer} from "./Circle.js";
import {default as LineBuffer} from "./Line.js";
import {default as RectBuffer} from "./Rect.js";

/** Plot's axis buffer function for each shape type (see `Plot.buffer`). */
export const defaultBuffers = {
  Bar: BarBuffer,
  Box: BoxBuffer,
  Circle: CircleBuffer,
  Line: LineBuffer,
  Rect: RectBuffer,
};
