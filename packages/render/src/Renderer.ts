import type {DataPoint} from "@d3plus/data";

import type {TrailCatchup} from "./animate/trailLog.js";
import type {Scene, SceneNode, TransitionRect} from "./scene.js";

/**
    @interface RenderTarget
    Describes where a renderer should mount. The container is renderer-agnostic
    (a plain element); the backend creates its own <svg> or <canvas> inside it.
*/
export interface RenderTarget {
  container: Element;
  width: number;
  height: number;
  /** Device pixel ratio for HiDPI canvas rendering; defaults to window.devicePixelRatio. */
  pixelRatio?: number;
}

/**
    @interface DrawOptions
    Per-frame options for a drawScene call. A duration of 0 (or omitted) commits
    immediately; a positive duration animates from the previous scene.
*/
export interface DrawOptions {
  duration?: number;
  /** Easing function mapping normalized time [0,1] → [0,1]; shared by both backends. */
  ease?: (t: number) => number;
  /** Called on each committed frame (Canvas) or transition tick (SVG). */
  onFrame?: (t: number) => void;
  onEnd?: () => void;
  /**
      Monotonic timeline value for this draw (e.g. the current period). Orders
      persistent motion trails in time: a higher value than the last draw grows
      the trail forward, a lower one rewinds it. Omit when there's no timeline.
  */
  sequence?: number;
  /**
      Positions of trailed marks at the intermediate periods a multi-period
      forward jump skipped, in ascending order, so a persistent trail bends
      through them instead of drawing one coarse straight segment. Committed
      before `sequence`.
  */
  trailCatchup?: TrailCatchup[];
  /**
      Origin box flip-eligible entering nodes (rect/circle/area without an
      `interactionGroup` — chart body marks, not chrome) collapse FROM on this
      draw, instead of self-collapsing to their own center. Drives the
      drill-down "morph" transition (grow from the clicked parent's rect).
  */
  enterFrom?: TransitionRect;
  /**
      The full layout's reference box `enterFrom`-eligible nodes' own geometry
      is proportionally mapped FROM, into `enterFrom` (e.g. `viz._bodyRect`
      for the draw that resolved `enterFrom`) — so entering siblings scale
      together as one unit (a miniature of the whole layout growing out of
      the clicked parent's rect) rather than each individually filling
      `enterFrom`. Only consulted by node types/shapeTypes `collapseTo`
      opts into proportional mapping for (Treemap cells, Pack circles, Pie
      wedges); omit to keep every eligible node's plain "become `enterFrom`"
      behavior.
  */
  enterFromBody?: TransitionRect;
  /**
      Target box flip-eligible exiting nodes collapse TO on this draw, instead
      of self-collapsing to their own center. Drives the drill-up morph
      (shrink into the reappearing parent's rect).
  */
  exitTo?: TransitionRect;
  /** The `exitTo` counterpart of {@link DrawOptions.enterFromBody} — the OLD layout's reference box exiting nodes' own (frozen, pre-redraw) geometry is proportionally mapped FROM, into `exitTo`. */
  exitToBody?: TransitionRect;
  /**
      The key of a single exiting node to remove immediately, skipping its
      normal collapse animation entirely (not even at `duration: 0`'s snap-to-
      end — it's simply never drawn again, at any `t`). Used for the exact
      node a drill-down morph's `enterFrom` was captured from: since the
      entering nodes already start by filling that same box, the exiting
      original would otherwise render on top of them (exits paint after
      enters) while it animates its own, separate collapse — a visible
      double-image for the whole transition. Leave unset for every other
      exit, which keeps its normal animated collapse.
  */
  instantExitKey?: string | number;
  /**
      The key of a single entering node that starts from `reunionEnterFrom`
      instead of collapsing in from its own center. Used for the drill-up
      morph's reunion node (the reappearing parent a Back click found a
      match for): it starts at the FULL size its former children currently
      occupy (`reunionEnterFrom` — the old, pre-Back body rect) and animates
      DOWN to its own real target geometry, at full opacity throughout (no
      fade) — the mirror of a forward click's entering children starting
      confined within the clicked parent's box and growing outward. Leave
      unset for every other entering node, which keeps its normal animated
      (collapse-from-center) enter.
  */
  reunionEnterKey?: string | number;
  /**
      The box `reunionEnterKey`'s node starts from — see its doc for why.
  */
  reunionEnterFrom?: TransitionRect;
  /**
      Removes every exiting node immediately, skipping its normal collapse
      animation entirely — the drill-up counterpart of `instantExitKey`, but
      for the WHOLE exit set rather than one key: a Back click's reunion
      always resolves to one parent's entire former child set exiting
      together, so there's no single key to name. Pairs with
      `instantEnterKey` so the reappearing parent instantly stands in for
      its vanished children instead of a cross-fade between them.
  */
  instantExitAll?: boolean;
}

/**
    @interface RenderHandle
    The result of a drawScene call. `finished` resolves when any animation completes,
    letting callers (e.g. Viz.render) await a stable, painted state.
*/
export interface RenderHandle {
  finished: Promise<void>;
  /** Abort an in-flight animation, leaving the surface at its current frame. */
  cancel(): void;
}

/**
    @interface PickResult
    The outcome of a hit-test: the topmost interactive node at a point.
*/
export interface PickResult {
  node: SceneNode;
  datum?: DataPoint;
  index?: number;
}

/**
    @type SceneEventType
    The pointer interaction types a renderer dispatches.
*/
export type SceneEventType =
  | "click"
  | "dblclick"
  | "contextmenu"
  | "mouseenter"
  | "mouseleave"
  | "mousemove";

/**
    @interface SceneEvent
    A backend-neutral pointer event, carrying the local point and the picked node
    (if any), so interaction handling is decoupled from DOM event targets.
*/
export interface SceneEvent {
  type: SceneEventType | string;
  point: [number, number];
  pick: PickResult | null;
  nativeEvent: Event;
}

/**
    @type RendererKind
    Which drawing technology a renderer uses.
*/
export type RendererKind = "svg" | "canvas" | "webgl";

/**
    @interface Renderer
    The pluggable backend contract. Chart logic emits a Scene; a Renderer realizes
    it. The same Scene must produce equivalent output and equivalent pick() results
    across backends — that equivalence is the parity guarantee of the architecture.
*/
export interface Renderer {
  readonly kind: RendererKind;

  /** Attach to a target element and prepare the drawing surface. */
  mount(target: RenderTarget): void;

  /** Update the surface dimensions (and re-scale for HiDPI on Canvas). */
  resize(width: number, height: number): void;

  /**
      Return the mount target the renderer is currently attached to.
      Used by hosts that need to compare against their own DOM (e.g. to
      decide whether to remount on container change) without reaching
      into renderer-private fields.

      Optional so that third-party Renderer implementations that predate
      this method still satisfy the interface — callers must tolerate
      `undefined` and fall back to a remount-on-change strategy.
  */
  target?(): RenderTarget | undefined;

  /**
      Reconcile the current output to `scene`, animating from the previously drawn
      scene when `opts.duration` is positive. The single method that matters.
  */
  drawScene(scene: Scene, opts?: DrawOptions): RenderHandle;

  /** Hit-test a point in surface-local coordinates. Returns the topmost interactive node. */
  pick(point: [number, number]): PickResult | null;

  /** Subscribe to pointer events on the surface. Returns an unsubscribe function. */
  on(handler: (event: SceneEvent) => void): () => void;

  /** Serialize the current scene to an SVG string (Canvas backends re-render via SVG). */
  toSVGString?(): string;

  /** Rasterize the current surface to a canvas element. */
  toCanvas?(): HTMLCanvasElement;

  /**
      Resolve once all in-flight async resources (images, texture patterns) have
      decoded and a final frame has painted. Server-side callers await this
      before reading pixels; the browser repaints live and never needs it.
  */
  whenSettled?(): Promise<void>;

  /** Tear down listeners, observers, and the drawing surface. */
  destroy(): void;
}
