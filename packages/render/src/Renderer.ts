import type {DataPoint} from "@d3plus/data";

import type {Scene, SceneNode} from "./scene.js";

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
  */
  target(): RenderTarget | undefined;

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

  /** Tear down listeners, observers, and the drawing surface. */
  destroy(): void;
}
