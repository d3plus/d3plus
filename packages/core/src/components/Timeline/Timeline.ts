import {max, min} from "d3-array";
import {brushSelection} from "d3-brush";
import {pointers} from "d3-selection";

import {assign, attrize, date} from "@d3plus/dom";
import {closest} from "@d3plus/math";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {Axis, TextBox} from "../index.js";
import {constant} from "../../utils/index.js";
import {installFluent} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";

import {initTimelineDefaults} from "./timelineConfig.js";
import {
  configureScale,
  measureTicksWidth,
  prepareTicks,
  renderPlayButton,
  setupBrush,
} from "./timelineRender.js";

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
  _buttonBehaviorCurrent!: string;
  _hiddenHandles!: boolean;
  _playButtonClass!: TextBox;
  _playTimer!: ReturnType<typeof setInterval> | false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _brush: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _brushGroup: any;
  _paddingLeft!: number;
  _ticksWidth!: number;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
*/
  constructor() {
    super();
    installFluent(this, timelineSchema);
    initTimelineDefaults(this);
    // Timeline composes its brush/play-button after super.render(); it paints
    // the scene itself at the end of render() so Axis.render() must not paint
    // a half-built scene mid-way through.
    this._managesOwnScenePaint = true;
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
    if (this.schema.on.brush) (this.schema.on.brush as (...args: unknown[]) => unknown)(this.schema.selection);
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

    if (this.schema.on.end) (this.schema.on.end as (...args: unknown[]) => unknown)(this.schema.selection);
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
    if (this.schema.on.start) (this.schema.on.start as (...args: unknown[]) => unknown)(event);
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

    const {ticks, tickFormat} = prepareTicks(this);
    measureTicksWidth(this, ticks, tickFormat);

    const playButtonWidth: number = this.schema.playButton
      ? (this.schema.playButtonConfig.width as number) || this.schema.buttonHeight
      : 0;

    const hiddenHandles = configureScale(this, ticks, playButtonWidth);

    super.render(callback);

    setupBrush(this, hiddenHandles, height, y);
    renderPlayButton(this, playButtonWidth);

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
      ? ((this.schema.on[_ as string] = f!), this)
      : arguments.length
        ? typeof _ === "string"
          ? this.schema.on[_]
          : ((this.schema.on = assign({} as Record<string, unknown>, this.schema.on, _ as Record<string, unknown>) as Record<string, (...args: unknown[]) => unknown>), this)
        : this.schema.on;
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
