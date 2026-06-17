import {max} from "d3-array";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor} from "@d3plus/dom";

import {accessor, constant} from "../../utils/index.js";

import type Legend from "./Legend.js";

const padding = 5;

/**
    Builds the Legend's default `shapeConfig` object. The accessors close over
    the `legend` instance so they read live `_lineData` / `_outerBounds` /
    `_rtl` / `_titleHeight` state during render.
*/
export function buildLegendShapeConfig(legend: Legend): Record<string, unknown> {
  return {
    fill: accessor("color"),
    height: constant(12),
    hitArea: (dd: DataPoint, i: number) => {
      const d = legend._lineData[i],
        h = max([d.height as number, d.shapeHeight as number]);
      return {
        width: (d.width as number) + (d.shapeWidth as number),
        height: h,
        x: -(d.shapeWidth as number) / 2,
        y: -h! / 2,
      };
    },
    labelBounds: (dd: DataPoint, i: number) => {
      const d = legend._lineData[i];
      let x = (d.shapeWidth as number) / 2;
      if (d.shape === "Circle") x -= (d.shapeR as number) / 2;
      const height = max([d.shapeHeight as number, d.height as number]);
      const rtlMod = legend._rtl
        ? (d.shapeWidth as number) + (d.width as number) + legend.schema.padding * 2
        : 0;
      return {
        width: d.width as number,
        height,
        x: x + padding - rtlMod,
        y: -height! / 2,
      };
    },
    labelConfig: {
      fontColor: () => {
        const bg = legend._select ? backgroundColor(legend._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontFamily: legend._titleClass.fontFamily(),
      fontResize: false,
      fontSize: constant(10),
      // The swatch's `hitArea` already spans the label, so let it own pointer
      // events for the whole item. A bare label would carry a different scene
      // key than its swatch, so hovering across the swatch→label padding would
      // otherwise read as leaving one item and entering another.
      pointerEvents: constant("none"),
      verticalAlign: "middle",
    },
    opacity: 1,
    r: constant(6),
    width: constant(12),
    x: (d: DataPoint, i: number) => {
      const datum = legend._lineData[i];
      const y = datum.y;
      const pad =
        legend.schema.align === "left" ||
        (legend.schema.align === "right" && legend.schema.direction === "column")
          ? 0
          : legend.schema.align === "center"
            ? (legend._outerBounds.width -
                legend._rowWidth(
                  legend._lineData.filter(
                    (l: Record<string, unknown>) => y === l.y,
                  ),
                )) /
              2
            : legend._outerBounds.width -
              legend._rowWidth(
                legend._lineData.filter((l: Record<string, unknown>) => y === l.y),
              );
      const prevWords = legend._lineData
        .slice(0, i)
        .filter((l: Record<string, unknown>) => y === l.y);
      const rtlMod = legend._rtl ? (datum.width as number) + legend.schema.padding : 0;
      return (
        legend._rowWidth(prevWords) +
        legend.schema.padding * (prevWords.length ? (datum.sentence ? 2 : 1) : 0) +
        legend._outerBounds.x +
        (datum.shapeWidth as number) / 2 +
        pad +
        rtlMod
      );
    },
    y: (d: DataPoint, i: number) => {
      const ld = legend._lineData[i];
      return (
        (ld.y as number) +
        legend._titleHeight +
        legend._outerBounds.y +
        max(
          legend._lineData
            .filter((l: Record<string, unknown>) => ld.y === l.y)
            .map((l: Record<string, unknown>) => l.height as number)
            .concat(
              legend._data.map((l: DataPoint, x: number) =>
                legend._fetchConfig("height", l, x) as number,
              ),
            ),
        )! /
          2
      );
    },
  };
}
