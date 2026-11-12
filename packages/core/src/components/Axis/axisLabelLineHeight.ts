/**
    The line height axis labels are measured and painted with, so a label
    measured as N lines paints as N lines in the room measured for it.
*/

import configValue from "../../utils/configValue.js";

type Accessor<T> = T | ((d: unknown, i: number) => T);

/** The parts of an axis's `shapeConfig` that set its labels' line height. */
export interface LabelLineHeightConfig {
  labelConfig?: {fontSize?: Accessor<number>; lineHeight?: Accessor<number>};
  lineHeight?: Accessor<number>;
}

/** How many times its font size a label's line height is by default (TextBox's default). */
export const LABEL_LINE_HEIGHT = 1.2;

/**
    The line height of the axis label for tick `d`: the label config's
    `lineHeight` when set, else the shape config's, else 1.2 times the
    label's `fontSize`, as the label's TextBox draws it by default.
    @param shapeConfig The axis's `shapeConfig`.
    @param d The tick value.
    @param i The tick's index.
    @param fontSize The label's font size, read from the label config when
    not given.
*/
export function labelLineHeight(
  shapeConfig: LabelLineHeightConfig | undefined,
  d: unknown,
  i: number,
  fontSize: number = configValue(
    shapeConfig?.labelConfig?.fontSize ?? 12,
    d,
    i,
  ),
): number {
  const value = shapeConfig?.labelConfig?.lineHeight ?? shapeConfig?.lineHeight;
  const lineHeight = value === undefined ? undefined : configValue(value, d, i);
  return typeof lineHeight === "number" && lineHeight > 0
    ? lineHeight
    : fontSize * LABEL_LINE_HEIGHT;
}
