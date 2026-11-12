import {color} from "d3-color";

/**
    The stroke the chart's default `shapeConfig.stroke` draws around `fill`:
    a shade darker, or the fill itself when it doesn't parse as a color (e.g.
    "none"/"transparent" on a confidence band), which has no darker shade.
    @private
*/
export function fillStroke(fill: unknown): unknown {
  const c = color(fill as string);
  return c ? c.darker(0.25).toString() : fill;
}
