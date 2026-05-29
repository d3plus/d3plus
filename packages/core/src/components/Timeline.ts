import {extent, max, min} from "d3-array";
import {brushSelection, brushX} from "d3-brush";
import {scaleTime} from "d3-scale";
import {pointers} from "d3-selection";

import {colorContrast, colorDefaults} from "@d3plus/color";
import {assign, attrize, backgroundColor, date, elem, textWidth} from "@d3plus/dom";
import {formatDate} from "@d3plus/format";
import {locale} from "@d3plus/locales";
import {closest} from "@d3plus/math";
import {textWrap} from "@d3plus/text";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {Axis, TextBox} from "../components/index.js";
import {configPrep, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

const colorMid = "#bbb";

/** Timeline's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const timelineSchema: ConfigField[] = [
  {key: "buttonPadding", coerce: "identity", default: 10},
  {key: "brushing", coerce: "identity", default: true},
  {key: "brushFilter", coerce: "identity"},
  {key: "brushMin", coerce: "const", default: constant(1)},
  {key: "buttonAlign", coerce: "identity", default: "middle"},
  {key: "buttonBehavior", coerce: "identity", default: "auto"},
  {key: "buttonHeight", coerce: "identity", default: 24},
  {key: "handleSize", coerce: "identity", default: 6},
  {key: "playButton", coerce: "identity", default: true},
  {key: "playButtonInterval", coerce: "identity", default: 1000},
  {key: "selection", coerce: "identity"},
  {key: "snapping", coerce: "identity", default: true},
];

/**
    Creates an interactive timeline brush component for selecting time periods within a visualization.
*/
export default class Timeline extends Axis {
  _buttonBehaviorCurrent: string;
  _hiddenHandles: boolean;
  declare _on: Record<string, (...args: unknown[]) => unknown>;
  _playButtonClass: TextBox;
  _playTimer!: ReturnType<typeof setInterval> | false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _brush: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _brushGroup: any;
  _paddingLeft: number;
  _ticksWidth: number;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
*/
  constructor() {
    super();
    installFluent(this, timelineSchema);

    this.schema.brushFilter = (event: unknown) => {
      const e = event as Record<string, unknown>;
      return !e.button && (e.detail as number) < 2;
    };
    this.schema.domain = [2001, 2010];
    this.schema.gridSize = 0;
    this.schema.handleConfig = {
      fill: colorDefaults.light,
      stroke: "#228be6",
      "stroke-width": 2,
      rx: 2,
      ry: 2,
    };
    this.schema.height = 100;
    this.schema.labelOffset = false;
    this._on = {};
    this.orient("bottom");
    this._playButtonClass = new TextBox()
      .on("click", () => {
        // if playing, pause
        if (this._playTimer) {
          if (this._playTimer) clearInterval(this._playTimer);
          this._playTimer = false;
          this._playButtonClass.render();
        }
        // otherwise, start playing
        else {
          let firstTime = true;
          const nextYear = () => {
            let selection: unknown[] = (this.schema.selection || [
              this.schema.domain[this.schema.domain.length - 1],
            ]) as unknown[];
            if (!(selection instanceof Array)) selection = [selection];
            selection = (selection as (string | number | false | undefined)[]).map(date).map(Number);
            if (selection.length === 1) selection.push(selection[0]);
            const ticks = this.schema.ticks!.map(Number);
            const firstIndex = ticks.indexOf(selection[0] as number);
            const lastIndex = ticks.indexOf(selection[selection.length - 1] as number);
            if (lastIndex === ticks.length - 1) {
              if (!firstTime) {
                if (this._playTimer) clearInterval(this._playTimer);
                this._playTimer = false;
                this._playButtonClass.render();
              } else {
                this.selection([
                  this.schema.ticks![0],
                  this.schema.ticks![lastIndex - firstIndex],
                ]).render();
              }
            } else {
              if (lastIndex + 1 === ticks.length - 1) {
                if (this._playTimer) clearInterval(this._playTimer);
                this._playTimer = false;
              }
              this.selection([
                this.schema.ticks![firstIndex + 1],
                this.schema.ticks![lastIndex + 1],
              ]).render();
            }
            firstTime = false;
          };
          this._playTimer = setInterval(nextYear, this.schema.playButtonInterval);
          nextYear();
        }
      })
      .on("mousemove", () =>
        this._playButtonClass.select().style("cursor", "pointer"),
      );
    this.schema.playButtonConfig = {
      fontColor: colorDefaults.dark,
      fontSize: 15,
      text: () => (this._playTimer ? "\u23F8" : "\u23F5"),
      textAnchor: "middle",
      verticalAlign: "middle",
    };
    this.schema.selectionConfig = {
      fill: "#228be6",
      "fill-opacity": () =>
        this._buttonBehaviorCurrent === "buttons" ? 0.3 : 1,
      "stroke-width": 0,
    };
    this.schema.shape = "Rect";
    this.schema.barConfig = assign({}, this.schema.barConfig, {
      stroke: () =>
        this._buttonBehaviorCurrent === "buttons" ? "transparent" : colorMid,
      "stroke-width": () => (this._buttonBehaviorCurrent === "buttons" ? 0 : 1),
    });
    this.schema.shapeConfig = assign({}, this.schema.shapeConfig, {
      labelBounds: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? {
              x: (d.labelBounds as Record<string, unknown>).x,
              y: -this.schema.buttonHeight / 2 + 1,
              width: (d.labelBounds as Record<string, unknown>).width,
              height: this.schema.buttonHeight,
            }
          : d.labelBounds,
      labelConfig: {
        fontColor: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
        fontSize: () => 12,
        verticalAlign: () =>
          this._buttonBehaviorCurrent === "buttons" ? "middle" : "top",
      },
      fill: () =>
        this._buttonBehaviorCurrent === "buttons" ? "#fff" : colorMid,
      stroke: () =>
        this._buttonBehaviorCurrent === "buttons" ? colorMid : "transparent",
      height: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? this.schema.buttonHeight
          : d.tick
            ? this.schema.handleSize
            : 0,
      width: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? this._ticksWidth / this._availableTicks.length
          : d.tick
            ? this.schema.domain.map(Number).includes(d.id as number)
              ? 2
              : 1
            : 0,
      y: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? this.schema.align === "middle"
            ? this.schema.height / 2
            : this.schema.align === "start"
              ? this._margin.top + this.schema.buttonHeight / 2
              : this.schema.height - this.schema.buttonHeight / 2 - this._margin.bottom
          : d.y,
      rx: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? 0
          : this.schema.domain.map(Number).includes(d.id as number)
            ? 1
            : 0,
      ry: (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? 0
          : this.schema.domain.map(Number).includes(d.id as number)
            ? 1
            : 0,
    });
    this._buttonBehaviorCurrent = "auto";
    this._hiddenHandles = false;
    this._paddingLeft = 0;
    this._ticksWidth = 0;
  }

  /**
      Triggered on brush "brush".
      @private
*/
   
  _brushBrush(event: Record<string, unknown>): void {
    if (
      event.sourceEvent &&
      (event.sourceEvent as Record<string, unknown>).offsetX &&
      event.selection !== null &&
      (!this.schema.brushing || this.schema.snapping)
    ) {
      if (this._playTimer) clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();

      const domain = this._updateDomain(event);
      this._brushGroup.call(this._brush.move, this._updateBrushLimit(domain));
    }

    this._brushStyle();
    if (this._on.brush) (this._on.brush as (...args: unknown[]) => unknown)(this.schema.selection);
  }

  /**
      Triggered on brush "end".
      @private
*/
   
  _brushEnd(event: Record<string, unknown>): void {
    if (!event.sourceEvent) return; // Only transition after input.

    const domain = this._updateDomain(event);

    this._brushStyle();

    if (this.schema.brushing || !this.schema.snapping)
      this._brushGroup
        .transition(this._transition)
        .call(this._brush.move, this._updateBrushLimit(domain));

    if (this._on.end) (this._on.end as (...args: unknown[]) => unknown)(this.schema.selection);
  }

  /**
      Triggered on brush "start".
      @private
*/
   
  _brushStart(event: Record<string, unknown>): void {
    if (event.sourceEvent !== null && (!this.schema.brushing || this.schema.snapping)) {
      if (this._playTimer) clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();

      const domain = this._updateDomain(event);
      this._brushGroup.call(this._brush.move, this._updateBrushLimit(domain));
    }

    this._brushStyle();
    if (this._on.start) (this._on.start as (...args: unknown[]) => unknown)(event);
  }

  /**
      Overrides the default brush styles.
      @private
*/
  _brushStyle(): void {
    const {height} = this._position;
    const timelineHeight =
      this.schema.shape === "Circle"
        ? typeof this.schema.shapeConfig.r === "function"
          ? this.schema.shapeConfig.r({tick: true}) * 2
          : this.schema.shapeConfig.r
        : this.schema.shape === "Rect"
          ? typeof this.schema.shapeConfig[height] === "function"
            ? this.schema.shapeConfig[height]({tick: true})
            : this.schema.shapeConfig[height]
          : this.schema.tickSize;

    const brushSelection = this._brushGroup
      .selectAll(".selection")
      .call(attrize, this.schema.selectionConfig)
      .attr("transform", "translate(0,-1)")
      .attr("height", timelineHeight + 2);

    const brushHandle = this._brushGroup
      .selectAll(".handle")
      .call(attrize, this.schema.handleConfig)
      .attr("display", this._hiddenHandles ? "none" : "block")
      .attr("transform", (d: Record<string, unknown>) =>
        this._buttonBehaviorCurrent === "buttons"
          ? `translate(${d.type === "w" ? -this.schema.handleSize / 2 : 0},-1)`
          : "",
      )
      .attr(
        "height",
        this._buttonBehaviorCurrent === "buttons"
          ? this.schema.buttonHeight + 2
          : timelineHeight + this.schema.handleSize,
      );

    this._brushGroup
      .selectAll(".overlay")
      .attr("x", this._paddingLeft)
      .attr("cursor", "pointer")
      .attr(
        "transform",
        `translate(0,${
          this._buttonBehaviorCurrent === "buttons"
            ? this.schema.buttonHeight / 2
            : -this.schema.handleSize
        })`,
      )
      .attr(
        "width",
        this._buttonBehaviorCurrent === "buttons"
          ? this._ticksWidth
          : this.schema.width,
      )
      .attr(
        "height",
        this._buttonBehaviorCurrent === "buttons"
          ? this.schema.buttonHeight
          : this.schema.handleSize * 2,
      );

    if (this._buttonBehaviorCurrent === "buttons") {
      const yTransform =
        this.schema.align === "middle"
          ? this.schema.height / 2 - this.schema.buttonHeight / 2
          : this.schema.align === "start"
            ? this._margin.top
            : this.schema.height - this.schema.buttonHeight - this._margin.bottom;

      brushHandle.attr("y", yTransform);
      brushSelection.attr("y", yTransform);
    }
  }

  /**
      Updates domain of the timeline used in brush functions.
      @private
*/
   
  _updateDomain(event: Record<string, unknown>): unknown[] {
    const x = pointers(event, this._select.node());
    let domain: unknown[] =
      (event.selection && this.schema.brushing) || !x.length
        ? (event.selection as unknown[])
        : [x[0][0], x[0][0]];

    if (this._buttonBehaviorCurrent === "ticks")
      domain = domain.map(this._d3Scale.invert);
    domain = domain.map(Number);

    if (
      event.type === "brush" &&
      this.schema.brushing &&
      this._buttonBehaviorCurrent === "buttons"
    ) {
      const diffs = (event.selection as number[]).map((d: number) =>
        Math.abs(d - ((event.sourceEvent as Record<string, unknown>).offsetX as number)),
      );

      const sel = event.selection as number[];
      const offsetX = (event.sourceEvent as Record<string, unknown>).offsetX as number;
      domain =
        diffs[1] <= diffs[0]
          ? [sel[0], offsetX].sort(
              (a: number, b: number) => a - b,
            )
          : [offsetX, sel[1]].sort(
              (a: number, b: number) => a - b,
            );
    }

    const ticks =
      this._buttonBehaviorCurrent === "ticks"
        ? this._availableTicks.map(Number)
        : this._d3Scale.range();

    if (this._buttonBehaviorCurrent === "ticks") {
      // find closest min and max ticks from data
      // and their indices in the ticks Array
      let minDomain: unknown = date(closest(domain[0] as number, ticks));
      let minIndex = ticks.indexOf(+(minDomain as number));
      let maxDomain: unknown = date(closest(domain[1] as number, ticks));
      let maxIndex = ticks.indexOf(+(maxDomain as number));

      // using the indices, determine if the 2 ends of the brush
      // are too close to each other. "ticksApart" always needs to
      // be less than the current current brushMin minus 1. For
      // example, a brushMin of "2" means that the min and max domain
      // values need to be "1" space apart from eachother.
      let ticksApart = Math.abs(maxIndex - minIndex);
      const minTicksAllowed = this.schema.brushMin() - 1;

      // if the min and max are not far enough apart to satisfy
      // brushMin, then forcibly extend the domain.
      if (ticksApart < minTicksAllowed) {
        // push the maxDomain out as far as possible to account for brushMin
        maxIndex = min([
          ticks.length - 1,
          maxIndex + (minTicksAllowed - ticksApart),
        ])!;
        maxDomain = ticks[maxIndex];
        ticksApart = Math.abs(maxIndex - minIndex);

        // if the domain is still not far enough apart, extent the minDomain
        // as far as possible to allow for brushMin
        if (ticksApart < minTicksAllowed) {
          minIndex = max([0, minIndex - (minTicksAllowed - ticksApart)])!;
          minDomain = ticks[minIndex];
        }
      }

      domain[0] = minDomain;
      domain[1] = maxDomain;
    } else {
      domain[0] = closest(domain[0] as number, ticks as number[]);
      domain[1] = closest(domain[1] as number, ticks as number[]);
    }

    // if the brush event has finished, update the current "selection" value
    const single = +(domain[0] as number) === +(domain[1] as number);
    if (event.type === "brush" || event.type === "end") {
      this.schema.selection =
        this._buttonBehaviorCurrent === "ticks"
          ? single
            ? domain[0]
            : domain
          : single
            ? date(
                this._availableTicks[
                  ticks.indexOf(domain[0] as unknown as string | number | false)
                ] as string | number | false,
              )
            : [
                date(
                  this._availableTicks[
                    ticks.indexOf(
                      domain[0] as unknown as string | number | false,
                    )
                  ] as string | number | false,
                ),
                date(
                  this._availableTicks[
                    ticks.indexOf(
                      domain[1] as unknown as string | number | false,
                    )
                  ] as string | number | false,
                ),
              ];
    }

    return domain;
  }

  /**
      Updates limits of the brush.
      @private
*/
   
  _updateBrushLimit(domain: unknown[]): unknown[] {
    const selection =
      this._buttonBehaviorCurrent === "ticks"
        ? (domain as (string | number | false | undefined)[]).map(date).map(this._d3Scale) as number[]
        : domain as number[];

    if (selection[0] === selection[1]) {
      selection[0] -= 0.1;
      selection[1] += 0.1;
    }

    if (this._buttonBehaviorCurrent === "buttons") {
      const handleSize = this._hiddenHandles ? 0 : this.schema.handleSize;
      const buttonWidth =
        0.5 * (this._ticksWidth / this._availableTicks.length - handleSize);
      selection[0] -= buttonWidth;
      selection[1] += buttonWidth;
    }

    return selection;
  }

  /**
      Extends the native Axis scene with the Timeline-specific brush selection
      overlay (snapshotted, since d3-brush manages its DOM directly) and the
      play-button TextBox (native).
*/
  toScene(): GroupNode {
    const scene = super.toScene();

    // Native brush selection + handles (no domToScene snapshot). The selection
    // is read directly from d3-brush via brushSelection(node) — returns pixel
    // coords. Interaction belongs to the renderer/event layer; this draws only
    // the visual.
    const brushNode =
      this._brushGroup && typeof this._brushGroup.node === "function"
        ? (this._brushGroup.node() as Element | null)
        : null;
    const sel = brushNode ? brushSelection(brushNode as SVGGElement) : null;
    if (sel && Array.isArray(sel) && sel.length === 2) {
      const {y: yKey, height: hKey} = this._position;
      const yPos = this._outerBounds[yKey];
      const hPos = this._outerBounds[hKey];
      const x1 = sel[0] as number;
      const x2 = sel[1] as number;
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const handle = this._hiddenHandles ? 0 : this.schema.handleSize;
      const selectionPaint = {fill: "rgba(0,0,0,0.10)", stroke: "rgba(0,0,0,0.25)", strokeWidth: 1};
      const handlePaint = {fill: "#fff", stroke: "rgba(0,0,0,0.5)", strokeWidth: 1};
      const extras: SceneNode[] = [
        {
          type: "rect",
          key: "tl-brush-selection",
          x: left,
          y: yPos,
          width: right - left,
          height: hPos,
          paint: selectionPaint,
        },
      ];
      if (handle > 0) {
        extras.push({
          type: "rect",
          key: "tl-brush-handle-w",
          x: left - handle / 2,
          y: yPos,
          width: handle,
          height: hPos,
          paint: handlePaint,
        });
        extras.push({
          type: "rect",
          key: "tl-brush-handle-e",
          x: right - handle / 2,
          y: yPos,
          width: handle,
          height: hPos,
          paint: handlePaint,
        });
      }
      scene.children.push(...extras);
    }

    const pb = this._playButtonClass as unknown as {
      toScene?: () => GroupNode;
      _data?: unknown[];
    };
    if (this.schema.playButton && pb && typeof pb.toScene === "function" && pb._data && pb._data.length) {
      scene.children.push(pb.toScene());
    }

    return scene;
  }

  /**
      Draws the timeline.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    const {height, y} = this._position;

    if (this.schema.ticks) this.schema.ticks = (this.schema.ticks as (string | number | false | undefined)[]).map(date);
    if (this._data) this._data = (this._data as (string | number | false | undefined)[]).map(date);

    let ticks = this.schema.ticks ? this.schema.ticks : this.schema.domain.map(date);
    if (!this.schema.ticks) {
      const d3Scale = scaleTime()
        .domain(ticks as Date[])
        .range([0, this.schema.width]);
      ticks = d3Scale.ticks();
    }

    const timeLocale =
      this.schema.timeLocale || locale[this._locale] || locale["en-US"];
    if (this._userFormat === undefined)
      this._userFormat = this.schema.tickFormat || false;
    const tickFormat = (this.schema.tickFormat = this._userFormat
      ? this._userFormat
      : (d: Date) =>
          formatDate(d, ticks as Date[]).replace(
            /^Q/g,
            timeLocale.quarter as string,
          ));

    // Measures size of ticks
    this._ticksWidth = this.schema.width;
    if (["auto", "buttons"].includes(this.schema.buttonBehavior)) {
      let maxLabel = 0;
      ticks.forEach((d: unknown, i: number) => {
        const {fontFamily, fontSize} = this.schema.shapeConfig.labelConfig;

        const f =
            typeof fontFamily === "function" ? fontFamily(d, i) : fontFamily,
          s = typeof fontSize === "function" ? fontSize(d, i) : fontSize;

        const wrap = textWrap()
          .fontFamily(f)
          .fontSize(s)
          .lineHeight(
            this.schema.shapeConfig.lineHeight
              ? this.schema.shapeConfig.lineHeight(d, i)
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
        if (maxLabel < width) maxLabel = width + 2 * this.schema.buttonPadding;
      });
      this._ticksWidth = maxLabel * ticks.length;
    }

    const playButtonWidth: number = this.schema.playButton
      ? (this.schema.playButtonConfig.width as number) || this.schema.buttonHeight
      : 0;
    const space = this.schema.width - playButtonWidth;

    this._buttonBehaviorCurrent =
      this.schema.buttonBehavior === "auto"
        ? this._ticksWidth < space
          ? "buttons"
          : "ticks"
        : this.schema.buttonBehavior;
    const hiddenHandles = (this._hiddenHandles =
      this._buttonBehaviorCurrent === "buttons" && !this.schema.brushing);

    if (this._buttonBehaviorCurrent === "buttons") {
      this.schema.scale = "ordinal";
      const domain = scaleTime()
        .domain(this.schema.domain.map(date) as Date[])
        .ticks()
        .map(Number);

      this.schema.domain = this.schema.ticks
        ? this.schema.ticks
        : Array.from(
            Array(domain[domain.length - 1] - domain[0] + 1),
            (_: unknown, x: number) => domain[0] + x,
          ).map(date);

      this.schema.ticks = this.schema.domain;

      const buttonMargin = (0.5 * this._ticksWidth) / this.schema.ticks.length;

      const emptySpace = this.schema.width - this._ticksWidth - playButtonWidth;

      this._paddingLeft =
        this.schema.buttonAlign === "middle"
          ? emptySpace / 2 + playButtonWidth
          : this.schema.buttonAlign === "end"
            ? emptySpace + playButtonWidth
            : playButtonWidth;

      this.schema.range = [
        this._paddingLeft + buttonMargin,
        this._paddingLeft + this._ticksWidth - buttonMargin,
      ];
    } else {
      this.schema.scale = "time";
      this.schema.domain = extent(ticks as Date[]) as unknown as (string | number | boolean | Date)[];
      this.schema.range = [
        playButtonWidth ? playButtonWidth * 1.5 : undefined,
        undefined,
      ];
      this._paddingLeft = playButtonWidth;
    }

    super.render(callback);

    const offset = this._outerBounds[y],
      range = this._d3Scale.range();

    const brush = (this._brush = brushX()
      .extent([
        [range[0], offset],
        [range[range.length - 1], offset + this._outerBounds[height]],
      ])
      .filter(this.schema.brushFilter)
      .handleSize(hiddenHandles ? 0 : this.schema.handleSize)
      .on("start", this._brushStart.bind(this))
      .on("brush", this._brushBrush.bind(this))
      .on("end", this._brushEnd.bind(this)));

    // data Array to be used when detecting the default value
    const defaultData =
      this._buttonBehaviorCurrent === "ticks" ? this._availableTicks : range;

    // the default selection, if needed
    const defaultSelection = [
      this.schema.brushMin() > defaultData.length
        ? defaultData[0]
        : defaultData[defaultData.length - this.schema.brushMin()],
      defaultData[defaultData.length - 1],
    ];

    // the current selection, considering user input, defaults, and data
    const selection: unknown[] =
      this.schema.selection === void 0
        ? defaultSelection
        : this.schema.selection instanceof Array
          ? this._buttonBehaviorCurrent === "buttons"
            ? this.schema.selection
                .map(date)
                .map((d: unknown) => range[this.schema.ticks!.map(Number).indexOf(+(d as number))])
            : this.schema.selection.map(date)
          : this._buttonBehaviorCurrent === "buttons"
            ? [range[this.schema.ticks!.map(Number).indexOf(+(this.schema.selection as number))]]
            : [this.schema.selection];

    if (selection.length === 1) selection.push(selection[0]);
    this._updateBrushLimit(selection);

    this._brushGroup = elem("g.brushGroup", {parent: this._group});
    this._brushGroup
      .call(brush)
      .transition(this._transition)
      .call(
        brush.move,
        this._buttonBehaviorCurrent === "ticks"
          ? this._updateBrushLimit(selection)
          : selection,
      );

    this._outerBounds.y -= this.schema.handleSize / 2;
    this._outerBounds.height += this.schema.handleSize / 2;

    const playButtonGroup = elem("g.d3plus-Timeline-play", {
      parent: this._group,
    });

    this._playButtonClass
      .renderMode("compute")
      .data(
        this.schema.playButton
          ? [
              {
                x: this._paddingLeft - playButtonWidth,
                y:
                  this._buttonBehaviorCurrent === "buttons"
                    ? this.schema.align === "middle"
                      ? this.schema.height / 2 - this.schema.buttonHeight / 2
                      : this.schema.align === "start"
                        ? this._margin.top
                        : this.schema.height -
                          this.schema.buttonHeight -
                          this._margin.bottom
                    : this._outerBounds.y,
                width: playButtonWidth,
                height: this.schema.buttonHeight,
              },
            ]
          : [],
      )
      .select(playButtonGroup.node())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .config(configPrep.bind(this as any)(this.schema.playButtonConfig))
      .render();

    return this;
  }

  /**
      Handle style.
*/
  handleConfig(): Record<string, unknown>;
  handleConfig(_: Record<string, unknown>): this;
  handleConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.handleConfig = assign(this.schema.handleConfig, _!)), this)
      : this.schema.handleConfig;
  }

  /**
      Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.
*/
   
  on(): Record<string, (...args: unknown[]) => unknown>;
  on(_: string): ((...args: unknown[]) => unknown) | undefined;
  on(_: string, f: (...args: unknown[]) => unknown): this;
  on(_: Record<string, (...args: unknown[]) => unknown>): this;
  on(
    _?: string | Record<string, (...args: unknown[]) => unknown>,
    f?: (...args: unknown[]) => unknown,
  ): Record<string, (...args: unknown[]) => unknown> | ((...args: unknown[]) => unknown) | undefined | this {
    return arguments.length === 2
      ? ((this._on[_ as string] = f!), this)
      : arguments.length
        ? typeof _ === "string"
          ? this._on[_]
          : ((this._on = assign({} as Record<string, unknown>, this._on, _ as Record<string, unknown>) as Record<string, (...args: unknown[]) => unknown>), this)
        : this._on;
  }

  /**
      The config Object for the Rect class used to create the playButton.
*/
  playButtonConfig(): Record<string, unknown>;
  playButtonConfig(_: Record<string, unknown>): this;
  playButtonConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.playButtonConfig = assign(this.schema.playButtonConfig, _!)), this)
      : this.schema.playButtonConfig;
  }

  /**
      Selection style.
*/
  selectionConfig(): Record<string, unknown>;
  selectionConfig(_: Record<string, unknown>): this;
  selectionConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.selectionConfig = assign(this.schema.selectionConfig, _!)), this)
      : this.schema.selectionConfig;
  }
}
