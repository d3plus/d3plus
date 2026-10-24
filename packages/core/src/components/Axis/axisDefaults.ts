import {colorContrast} from "@d3plus/color";
import {backgroundColor, rtl as detectRTL} from "@d3plus/dom";

import {constant} from "../../utils/index.js";
import {gridStroke} from "./gridStroke.js";
import {
  labelAngle,
  rotatedTextAnchor,
  settingAngle,
  slantsLabels,
} from "./axisLabelAngle.js";
import type Axis from "./Axis.js";

/** A color that contrasts with the background behind the axis's container. */
function contrastInk(axis: Axis): () => string {
  return () => {
    const bg = axis._select
      ? backgroundColor(axis._select.node())
      : "rgb(255, 255, 255)";
    return colorContrast(bg, axis.schema.colorDefaults);
  };
}

/** The default `barConfig` (the domain line). */
export function axisBarConfig(axis: Axis): Record<string, unknown> {
  return {
    stroke: contrastInk(axis),
    "stroke-width": 1,
  };
}

/** The default `baselineBreakConfig` / `breakConfig`. */
export function axisBreakConfig(axis: Axis): Record<string, unknown> {
  return {
    angle: 30,
    gap: 5,
    lineConfig: {},
    lines: true,
    mask: true,
    size: 10,
    space: 36,
    stroke: contrastInk(axis),
    "stroke-width": 1,
  };
}

/** The default `gridConfig`. */
export function axisGridConfig(axis: Axis): Record<string, unknown> {
  return {
    stroke: () => gridStroke(axis._select?.node(), axis.schema.colorDefaults),
    "stroke-width": 1,
  };
}

/** The default `shapeConfig` (tick marks and their labels). */
export function axisShapeConfig(axis: Axis): Record<string, unknown> {
  return {
    fill: contrastInk(axis),
    height: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
    label: (d: Record<string, unknown>) => d.text,
    labelBounds: (d: Record<string, unknown>) => d.labelBounds,
    labelConfig: {
      fontColor: contrastInk(axis),
      fontResize: false,
      fontSize: constant(12),
      padding: 5,
      textAnchor: () => {
        const setting = axis._labelRotationSetting;
        if (
          axis._labelRotation &&
          slantsLabels(setting, axis._position.horizontal)
        )
          return rotatedTextAnchor(axis.schema.orient, settingAngle(setting));
        const rtl = detectRTL();
        return axis.schema.orient === "left"
          ? rtl
            ? "start"
            : "end"
          : axis.schema.orient === "right"
            ? rtl
              ? "end"
              : "start"
            : axis._labelRotation
              ? rotatedTextAnchor(
                  axis.schema.orient,
                  labelAngle(true, axis._labelRotationSetting),
                )
              : "middle";
      },
      verticalAlign: () =>
        axis.schema.orient === "bottom"
          ? "top"
          : axis.schema.orient === "top"
            ? axis._labelRotation
              ? "top"
              : "bottom"
            : "middle",
    },
    r: (d: Record<string, unknown>) => (d.tick ? 4 : 0),
    stroke: contrastInk(axis),
    strokeWidth: 1,
    width: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
  };
}

/** The default `titleConfig`. */
export function axisTitleConfig(axis: Axis): Record<string, unknown> {
  return {
    fontColor: contrastInk(axis),
    fontSize: 12,
    textAnchor: "middle",
  };
}
