import {extent, max} from "d3-array";
import {brushX} from "d3-brush";
import {scaleTime} from "d3-scale";

import {date, elem, textWidth} from "@d3plus/dom";
import {formatDate} from "@d3plus/format";
import {locale} from "@d3plus/locales";
import {textWrap} from "@d3plus/text";

import {configPrep} from "../../utils/index.js";
import type {VizContext} from "../../utils/configPrep.js";

import type Timeline from "./Timeline.js";

/** Coerces ticks/data to dates and resolves the tick format. */
export function prepareTicks(tl: Timeline): {
  ticks: unknown[];
  tickFormat: (d: Date) => string;
} {
  if (tl.schema.ticks) tl.schema.ticks = (tl.schema.ticks as (string | number | false | undefined)[]).map(date);
  if (tl._data) tl._data = (tl._data as (string | number | false | undefined)[]).map(date);

  let ticks = tl.schema.ticks ? tl.schema.ticks : tl.schema.domain.map(date);
  if (!tl.schema.ticks) {
    const d3Scale = scaleTime()
      .domain(ticks as Date[])
      .range([0, tl.schema.width]);
    ticks = d3Scale.ticks();
  }

  const timeLocale =
    tl.schema.timeLocale || locale[tl.schema.locale] || locale["en-US"];
  if (tl._userFormat === undefined)
    tl._userFormat = tl.schema.tickFormat || false;
  const tickFormat = (tl.schema.tickFormat = tl._userFormat
    ? tl._userFormat
    : (d: Date) =>
        formatDate(d, ticks as Date[]).replace(
          /^Q/g,
          timeLocale.quarter as string,
        )) as (d: Date) => string;

  return {ticks, tickFormat};
}

/** Measures the widest tick label, driving the auto button/tick decision. */
export function measureTicksWidth(
  tl: Timeline,
  ticks: unknown[],
  tickFormat: (d: Date) => string,
): void {
  tl._ticksWidth = tl.schema.width;
  if (["auto", "buttons"].includes(tl.schema.buttonBehavior)) {
    let maxLabel = 0;
    ticks.forEach((d: unknown, i: number) => {
      const {fontFamily, fontSize} = tl.schema.shapeConfig.labelConfig;

      const f =
          typeof fontFamily === "function" ? fontFamily(d, i) : fontFamily,
        s = typeof fontSize === "function" ? fontSize(d, i) : fontSize;

      const wrap = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(
          tl.schema.shapeConfig.lineHeight
            ? tl.schema.shapeConfig.lineHeight(d, i)
            : undefined,
        );

      const res = wrap(tickFormat(d as Date));

      let width = res.lines.length
        ? Math.ceil(
            max(
              res.lines.map((line: string) =>
                textWidth(line, {"font-family": f, "font-size": s}),
              ),
            )!,
          ) +
          s / 4
        : 0;

      if (width % 2) width++;
      if (maxLabel < width) maxLabel = width + 2 * tl.schema.buttonPadding;
    });
    tl._ticksWidth = maxLabel * ticks.length;
  }
}

/** Resolves button-vs-tick behavior and sets the scale/domain/range. */
export function configureScale(
  tl: Timeline,
  ticks: unknown[],
  playButtonWidth: number,
): boolean {
  const space = tl.schema.width - playButtonWidth;

  tl._buttonBehaviorCurrent =
    tl.schema.buttonBehavior === "auto"
      ? tl._ticksWidth < space
        ? "buttons"
        : "ticks"
      : tl.schema.buttonBehavior;
  const hiddenHandles = (tl._hiddenHandles =
    tl._buttonBehaviorCurrent === "buttons" && !tl.schema.brushing);

  if (tl._buttonBehaviorCurrent === "buttons") {
    tl.schema.scale = "ordinal";
    const domain = scaleTime()
      .domain(tl.schema.domain.map(date) as Date[])
      .ticks()
      .map(Number);

    tl.schema.domain = tl.schema.ticks
      ? tl.schema.ticks
      : Array.from(
          Array(domain[domain.length - 1] - domain[0] + 1),
          (_: unknown, x: number) => domain[0] + x,
        ).map(date);

    tl.schema.ticks = tl.schema.domain;

    const buttonMargin = (0.5 * tl._ticksWidth) / tl.schema.ticks.length;

    const emptySpace = tl.schema.width - tl._ticksWidth - playButtonWidth;

    tl._paddingLeft =
      tl.schema.buttonAlign === "middle"
        ? emptySpace / 2 + playButtonWidth
        : tl.schema.buttonAlign === "end"
          ? emptySpace + playButtonWidth
          : playButtonWidth;

    tl.schema.range = [
      tl._paddingLeft + buttonMargin,
      tl._paddingLeft + tl._ticksWidth - buttonMargin,
    ];
  } else {
    tl.schema.scale = "time";
    tl.schema.domain = extent(ticks as Date[]) as unknown as (string | number | boolean | Date)[];
    tl.schema.range = [
      playButtonWidth ? playButtonWidth * 1.5 : undefined,
      undefined,
    ];
    tl._paddingLeft = playButtonWidth;
  }

  return hiddenHandles;
}

/** Builds the d3-brush, computes the active selection, and mounts the brush group. */
export function setupBrush(
  tl: Timeline,
  hiddenHandles: boolean,
  height: string,
  y: string,
): void {
  const offset = tl._outerBounds[y],
    range = tl._d3Scale!.range();

  const brush = (tl._brush = brushX()
    .extent([
      [range[0], offset],
      [range[range.length - 1], offset + tl._outerBounds[height]],
    ])
    .filter(tl.schema.brushFilter)
    .handleSize(hiddenHandles ? 0 : tl.schema.handleSize)
    .on("start", tl._brushStart.bind(tl))
    .on("brush", tl._brushBrush.bind(tl))
    .on("end", tl._brushEnd.bind(tl)));

  // data Array to be used when detecting the default value
  const defaultData =
    tl._buttonBehaviorCurrent === "ticks" ? tl._availableTicks : range;

  // the default selection, if needed
  const defaultSelection = [
    tl.schema.brushMin() > defaultData.length
      ? defaultData[0]
      : defaultData[defaultData.length - tl.schema.brushMin()],
    defaultData[defaultData.length - 1],
  ];

  // the current selection, considering user input, defaults, and data
  const selection: unknown[] =
    tl.schema.selection === void 0
      ? defaultSelection
      : tl.schema.selection instanceof Array
        ? tl._buttonBehaviorCurrent === "buttons"
          ? tl.schema.selection
              .map(date)
              .map((d: unknown) => range[tl.schema.ticks!.map(Number).indexOf(+(d as number))])
          : tl.schema.selection.map(date)
        : tl._buttonBehaviorCurrent === "buttons"
          ? [range[tl.schema.ticks!.map(Number).indexOf(+(tl.schema.selection as number))]]
          : [tl.schema.selection];

  if (selection.length === 1) selection.push(selection[0]);
  tl._updateBrushLimit(selection);

  tl._brushGroup = elem("g.brushGroup", {parent: tl._group});
  tl._brushGroup
    .call(brush)
    .transition(tl._transition)
    .call(
      brush.move,
      tl._buttonBehaviorCurrent === "ticks"
        ? tl._updateBrushLimit(selection)
        : selection,
    );

  tl._outerBounds.y -= tl.schema.handleSize / 2;
  tl._outerBounds.height += tl.schema.handleSize / 2;
}

/** Renders the play button TextBox into its own group. */
export function renderPlayButton(tl: Timeline, playButtonWidth: number): void {
  const playButtonGroup = elem("g.d3plus-Timeline-play", {
    parent: tl._group,
  });

  const playData = tl.schema.playButton
    ? [
        {
          x: tl._paddingLeft - playButtonWidth,
          y:
            tl._buttonBehaviorCurrent === "buttons"
              ? tl.schema.align === "middle"
                ? tl.schema.height / 2 - tl.schema.buttonHeight / 2
                : tl.schema.align === "start"
                  ? tl._margin.top
                  : tl.schema.height -
                    tl.schema.buttonHeight -
                    tl._margin.bottom
              : tl._outerBounds.y,
          width: playButtonWidth,
          height: tl.schema.buttonHeight,
        },
      ]
    : [];

  tl._playButtonClass
    .renderMode("compute")
    .data(playData)
    .select(playButtonGroup.node())
    .config(configPrep.bind(tl as unknown as VizContext)(tl.schema.playButtonConfig))
    .render();

  // The play button's pixels are composed into the scene (compute mode), but
  // the scene render path mounts no per-node listeners, so a click can't reach
  // the TextBox. Mirror the d3-brush DOM that drives the brush: mount a
  // transparent hit rect in this group (lifted above the scene with the rest
  // of the timeline) and route its click to the play/pause toggle.
  const hit = elem("rect.d3plus-Timeline-play-hit", {
    parent: playButtonGroup,
    condition: playData.length > 0,
  });
  if (playData.length) {
    const box = playData[0];
    hit
      .attr("x", box.x)
      .attr("y", box.y)
      .attr("width", box.width)
      .attr("height", box.height)
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", () => tl._togglePlay());
  }
}
