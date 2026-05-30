import {colorContrast, colorDefaults} from "@d3plus/color";
import {assign, backgroundColor, date} from "@d3plus/dom";

import TextBox from "./TextBox.js";
import type Timeline from "./Timeline.js";

const colorMid = "#bbb";

/** Builds the play/pause TextBox, wiring its click + hover behavior. */
function buildPlayButton(tl: Timeline): TextBox {
  return new TextBox()
    .on("click", () => {
      // if playing, pause
      if (tl._playTimer) {
        if (tl._playTimer) clearInterval(tl._playTimer);
        tl._playTimer = false;
        tl._playButtonClass.render();
      }
      // otherwise, start playing
      else {
        let firstTime = true;
        const nextYear = () => {
          let selection: unknown[] = (tl.schema.selection || [
            tl.schema.domain[tl.schema.domain.length - 1],
          ]) as unknown[];
          if (!(selection instanceof Array)) selection = [selection];
          selection = (selection as (string | number | false | undefined)[]).map(date).map(Number);
          if (selection.length === 1) selection.push(selection[0]);
          const ticks = tl.schema.ticks!.map(Number);
          const firstIndex = ticks.indexOf(selection[0] as number);
          const lastIndex = ticks.indexOf(selection[selection.length - 1] as number);
          if (lastIndex === ticks.length - 1) {
            if (!firstTime) {
              if (tl._playTimer) clearInterval(tl._playTimer);
              tl._playTimer = false;
              tl._playButtonClass.render();
            } else {
              tl.selection([
                tl.schema.ticks![0],
                tl.schema.ticks![lastIndex - firstIndex],
              ]).render();
            }
          } else {
            if (lastIndex + 1 === ticks.length - 1) {
              if (tl._playTimer) clearInterval(tl._playTimer);
              tl._playTimer = false;
            }
            tl.selection([
              tl.schema.ticks![firstIndex + 1],
              tl.schema.ticks![lastIndex + 1],
            ]).render();
          }
          firstTime = false;
        };
        tl._playTimer = setInterval(nextYear, tl.schema.playButtonInterval);
        nextYear();
      }
    })
    .on("mousemove", () =>
      tl._playButtonClass.select().style("cursor", "pointer"),
    );
}

/** Assembles the per-tick shapeConfig overrides (button vs. tick mode). */
function timelineShapeConfig(tl: Timeline): Record<string, unknown> {
  return {
    labelBounds: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? {
            x: (d.labelBounds as Record<string, unknown>).x,
            y: -tl.schema.buttonHeight / 2 + 1,
            width: (d.labelBounds as Record<string, unknown>).width,
            height: tl.schema.buttonHeight,
          }
        : d.labelBounds,
    labelConfig: {
      fontColor: () => {
        const bg = tl._select ? backgroundColor(tl._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontSize: () => 12,
      verticalAlign: () =>
        tl._buttonBehaviorCurrent === "buttons" ? "middle" : "top",
    },
    fill: () =>
      tl._buttonBehaviorCurrent === "buttons" ? "#fff" : colorMid,
    stroke: () =>
      tl._buttonBehaviorCurrent === "buttons" ? colorMid : "transparent",
    height: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? tl.schema.buttonHeight
        : d.tick
          ? tl.schema.handleSize
          : 0,
    width: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? tl._ticksWidth / tl._availableTicks.length
        : d.tick
          ? tl.schema.domain.map(Number).includes(d.id as number)
            ? 2
            : 1
          : 0,
    y: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? tl.schema.align === "middle"
          ? tl.schema.height / 2
          : tl.schema.align === "start"
            ? tl._margin.top + tl.schema.buttonHeight / 2
            : tl.schema.height - tl.schema.buttonHeight / 2 - tl._margin.bottom
        : d.y,
    rx: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? 0
        : tl.schema.domain.map(Number).includes(d.id as number)
          ? 1
          : 0,
    ry: (d: Record<string, unknown>) =>
      tl._buttonBehaviorCurrent === "buttons"
        ? 0
        : tl.schema.domain.map(Number).includes(d.id as number)
          ? 1
          : 0,
  };
}

/**
    Sets the Timeline-specific defaults that override the inherited Axis config,
    mirroring the original constructor body exactly.
*/
export function initTimelineDefaults(tl: Timeline): void {
  tl.schema.brushFilter = (event: unknown) => {
    const e = event as Record<string, unknown>;
    return !e.button && (e.detail as number) < 2;
  };
  tl.schema.domain = [2001, 2010];
  tl.schema.gridSize = 0;
  tl.schema.handleConfig = {
    fill: colorDefaults.light,
    stroke: "#228be6",
    "stroke-width": 2,
    rx: 2,
    ry: 2,
  };
  tl.schema.height = 100;
  tl.schema.labelOffset = false;
  tl.schema.on = {};
  tl.orient("bottom");
  tl._playButtonClass = buildPlayButton(tl);
  tl.schema.playButtonConfig = {
    fontColor: colorDefaults.dark,
    fontSize: 15,
    text: () => (tl._playTimer ? "\u23F8" : "\u23F5"),
    textAnchor: "middle",
    verticalAlign: "middle",
  };
  tl.schema.selectionConfig = {
    fill: "#228be6",
    "fill-opacity": () =>
      tl._buttonBehaviorCurrent === "buttons" ? 0.3 : 1,
    "stroke-width": 0,
  };
  tl.schema.shape = "Rect";
  tl.schema.barConfig = assign({}, tl.schema.barConfig, {
    stroke: () =>
      tl._buttonBehaviorCurrent === "buttons" ? "transparent" : colorMid,
    "stroke-width": () => (tl._buttonBehaviorCurrent === "buttons" ? 0 : 1),
  });
  tl.schema.shapeConfig = assign(
    {},
    tl.schema.shapeConfig,
    timelineShapeConfig(tl),
  );
  tl._buttonBehaviorCurrent = "auto";
  tl._hiddenHandles = false;
  tl._paddingLeft = 0;
  tl._ticksWidth = 0;
}
