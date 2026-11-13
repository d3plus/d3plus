/**
    Lays an axis out within its `maxSize` (see `strictMaxSize`): when the
    labels can't fit beside the title, the title gives way, and when they
    can't fit at all, the labels do. Pure compute, no DOM.
*/
import type Axis from "./Axis.js";
import {layoutAxis} from "./axisLayout.js";
import type {AxisLayoutResult} from "./axisLayout.js";
import {resolveAutoScale} from "./axisScaleType.js";

/**
    Lays out `axis` (see `layoutAxis`) and returns the layout the paint
    phase draws. A label that reaches further out from the axis than its
    `maxSize` leaves room for is left out (see `limitLabels`). When that
    leaves out any label shown, a title is left out instead if every label
    then fits; otherwise the labels are left out and the title stays, unless
    the title alone takes more than the `maxSize` too. The ticks, the axis
    line and its bar still draw, and the axis claims only the room of what
    it draws.
*/
export function measureAxis(axis: Axis): AxisLayoutResult {
  resolveAutoScale(axis);
  axis._dropTitle = false;
  const titled = layoutAxis(axis);
  const limited = axis._limited;
  if (!limited || (!limited.dropped && limited.room >= 0)) return titled;
  if (!axis.schema.title) return titled;

  axis._dropTitle = true;
  const bare = layoutAxis(axis);
  // Without the title every label fits, or the title doesn't fit alone.
  if (!axis._limited?.dropped || limited.room < 0) return bare;

  axis._dropTitle = false;
  return layoutAxis(axis);
}
