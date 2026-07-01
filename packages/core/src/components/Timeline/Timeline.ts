import {max, min} from "d3-array";
import type {BrushBehavior} from "d3-brush";
import {pointers} from "d3-selection";

import {assign, attrize, date} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {closest} from "@d3plus/math";
import type {GroupNode} from "@d3plus/render";

import {Axis, TextBox} from "../index.js";
import {constant} from "../../utils/index.js";
import {installFluent} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";

import {initTimelineDefaults} from "./timelineConfig.js";
import {
  configureScale,
  measureTicksWidth,
  paintTimelineScene,
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
  // Set by the host Viz (timelineFeature) to repaint the scene after a play
  // state change that doesn't move the selection — e.g. a manual pause — so the
  // play/pause glyph refreshes without waiting for the next interaction.
  _onPlayToggle?: () => void;
  _brush!: BrushBehavior<unknown>;
  _brushGroup!: D3Selection;
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
      event.selection !== null &&
      (!this.schema.brushing || this.schema.snapping)
    ) {
      // Grabbing the brush cancels playback — once, not every frame.
      if (this._playTimer) {
        clearInterval(this._playTimer);
        this._playTimer = false;
        this._playButtonClass.render();
      }

      // Track the snapped selection for `on.brush` consumers, but let d3-brush
      // render the brush freely during the drag and snap once, on release
      // (`_brushEnd`). Repainting a snapped selection over d3-brush on every
      // brush event (a live visual snap) is unstable: it races d3-brush's own
      // redraw, and reconciling the raw gesture state against the snapped paint
      // on release makes the selection oscillate mid-drag (1↔2 buttons) and
      // collapse to a single button on release. A one-shot snap on click/press
      // (`_brushStart`) is safe because it doesn't race a per-frame redraw.
      this._updateDomain(event);
    }

    this._brushStyle();
    if (this.schema.on.brush) (this.schema.on.brush as (...args: unknown[]) => unknown)(this.schema.selection);
  }

  /**
      Repaints the brush selection/handle rects at the given pixel limits,
      matching d3-brush's own `redraw` geometry. Used for the one-shot snap on
      click/press (`_brushStart`) so the target button is shown immediately.
      Not used per-frame during a drag: repainting over d3-brush every brush
      event races its own redraw and destabilizes the gesture — drags snap on
      release (`_brushEnd`) instead.
      @private
*/
  _snapBrushVisual(limit: number[]): void {
    const handleSize = this._hiddenHandles ? 0 : this.schema.handleSize;
    this._brushGroup
      .selectAll(".selection")
      .attr("x", limit[0])
      .attr("width", limit[1] - limit[0]);
    this._brushGroup
      .selectAll<SVGGElement, {type: string}>(".handle")
      .attr("x", (d: {type: string}) =>
        (d.type[d.type.length - 1] === "e" ? limit[1] : limit[0]) -
        handleSize / 2,
      );
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
      // Interacting with the brush cancels playback.
      if (this._playTimer) clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();

      // Snap the visual immediately so clicking/pressing a button shows its
      // target selection right away, not only on release. Visual only (no
      // `brush.move`) so d3-brush's just-started gesture isn't desynced — see
      // `_brushBrush`; the selection is committed on `_brushEnd`.
      if (event.selection !== null)
        this._snapBrushVisual(
          this._updateBrushLimit(this._updateDomain(event)) as number[],
        );
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
      .selectAll<SVGGElement, {type: string}>(".handle")
      .call(attrize, this.schema.handleConfig)
      .attr("display", this._hiddenHandles ? "none" : "block")
      .attr("transform", (d: {type: string}) =>
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
      domain = domain.map(d => this._d3Scale!.invert!(d as number));
    domain = domain.map(Number);

    const ticks =
      this._buttonBehaviorCurrent === "ticks"
        ? this._availableTicks.map(Number)
        : this._d3Scale!.range();

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
                  ticks.indexOf(domain[0] as number)
                ] as string | number | false,
              )
            : [
                date(
                  this._availableTicks[
                    ticks.indexOf(domain[0] as number)
                  ] as string | number | false,
                ),
                date(
                  this._availableTicks[
                    ticks.indexOf(domain[1] as number)
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
        ? (domain as (string | number | false | undefined)[])
            .map(date)
            .map(d => this._d3Scale!(d as Date)) as number[]
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
      Toggles timeline playback. When stopped, advances the selection one tick
      every `playButtonInterval` ms until it reaches the final tick; when
      playing, stops. Invoked by the play button's DOM hit target (the scene
      path wires no listeners, so the click can't reach the TextBox itself).
      @private
*/
  _togglePlay(): void {
    // Currently playing → pause.
    if (this._playTimer) {
      clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();
      this._onPlayToggle?.();
      return;
    }

    // Stopped → start advancing the selection one tick per interval. The
    // periods to step through are `schema.ticks` in "buttons" mode, but the
    // resolved `_availableTicks` in "ticks" mode (schema.ticks is unset there) —
    // mirrors `setupBrush`/`_updateDomain`. Without this the play loop threw on
    // `schema.ticks.map(...)` for "ticks"-mode timelines (e.g. wide standalone).
    // Advance the selection AND notify listeners. `render()` alone only redraws
    // the timeline's own brush; the "end" callback is what the parent Viz wires
    // to its time filter (see timelineFeature), so without firing it the visible
    // data never changes as playback steps. Mirrors what a brush drag commits.
    const advance = (sel: unknown[]): void => {
      this.selection(sel).render();
      if (this.schema.on.end)
        (this.schema.on.end as (...args: unknown[]) => unknown)(this.schema.selection);
    };

    let firstTime = true;
    const nextYear = () => {
      const periods = (
        this._buttonBehaviorCurrent === "ticks"
          ? this._availableTicks
          : this.schema.ticks
      ) as (string | number | false | undefined)[];
      if (!periods || !periods.length) return;
      let selection: unknown[] = (this.schema.selection || [
        this.schema.domain[this.schema.domain.length - 1],
      ]) as unknown[];
      if (!(selection instanceof Array)) selection = [selection];
      selection = (selection as (string | number | false | undefined)[]).map(date).map(Number);
      if (selection.length === 1) selection.push(selection[0]);
      const ticks = periods.map(Number);
      const firstIndex = ticks.indexOf(selection[0] as number);
      const lastIndex = ticks.indexOf(selection[selection.length - 1] as number);
      if (lastIndex === ticks.length - 1) {
        if (!firstTime) {
          if (this._playTimer) clearInterval(this._playTimer);
          this._playTimer = false;
          this._playButtonClass.render();
          this._onPlayToggle?.();
        } else {
          advance([periods[0], periods[lastIndex - firstIndex]]);
        }
      } else {
        if (lastIndex + 1 === ticks.length - 1) {
          if (this._playTimer) clearInterval(this._playTimer);
          this._playTimer = false;
        }
        advance([periods[firstIndex + 1], periods[lastIndex + 1]]);
      }
      firstTime = false;
    };
    this._playTimer = setInterval(nextYear, this.schema.playButtonInterval);
    nextYear();
    // Reflect the now-playing state immediately, even when the selection was
    // already at the final tick (nextYear made no move, so no brush re-render).
    this._onPlayToggle?.();
  }

  /**
      Extends the native Axis scene with the Timeline-specific play-button
      TextBox.

      The brush selection + handles are NOT composed here: d3-brush owns its
      own DOM (mounted in `g.brushGroup` and styled by `_brushStyle`), which the
      Viz lifts above the scene so it paints on top of the timeline ticks. That
      DOM brush is the sole brush visual and interaction layer — drawing a
      second copy from the scene only duplicated it at the wrong height (the
      full outer bounds rather than the tick band), so the overlay no longer
      lined up with the timeline.
*/
  toScene(): GroupNode {
    const scene = super.toScene();

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

    // Standalone (non-Viz) use: a parent Viz normally composes the timeline's
    // scene via toScene(), but on its own `_managesOwnScenePaint` made
    // Axis.render() skip the paint, leaving only the brush/play DOM. Paint the
    // full timeline scene — the axis (ticks/track/labels) AND the play button's
    // pixels, which it renders in compute mode for toScene() to compose — and
    // run it AFTER renderPlayButton so the button's data exists when toScene()
    // reads it. The play button's transparent hit rect and the brush stay as
    // DOM in `_group`.
    if (this.schema.renderMode !== "compute" && this._select) {
      paintTimelineScene(this, this.toScene());
      // Lift the interactive brush + play-button group above the painted scene
      // so the brush overlay receives pointer events and the selection/handles
      // + play hit-rect sit on top of the ticks.
      if (this._group) {
        const parent = this._select.node();
        const group = this._group.node();
        if (parent && group && group.parentNode === parent) parent.appendChild(group);
      }
    }

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
