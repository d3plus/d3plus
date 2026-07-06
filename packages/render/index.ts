export type {
  AriaSpec,
  ClipShape,
  CurveName,
  FontSpec,
  FontStyle,
  HitShape,
  NodeBase,
  Paint,
  Transform,
  RectNode,
  CircleNode,
  LineNode,
  AreaNode,
  PathNode,
  ImageNode,
  TextNode,
  TextLine,
  TextRun,
  GroupNode,
  HtmlOverlayNode,
  SceneNode,
  SceneGradient,
  Scene,
} from "./src/scene.js";

export {gradientToken, parseGradient} from "./src/scene.js";

export type {
  RenderTarget,
  DrawOptions,
  RenderHandle,
  PickResult,
  SceneEvent,
  SceneEventType,
  RendererKind,
  Renderer,
} from "./src/Renderer.js";

export {default as SvgRenderer} from "./src/svg/SvgRenderer.js";
export {default as CanvasRenderer} from "./src/canvas/CanvasRenderer.js";

export {patternTileSvg} from "./src/canvas/patternTile.js";

export {curveFor, linePath, areaPath} from "./src/paths.js";

export {domToScene} from "./src/dom.js";

export {applyDeclarativeEvents} from "./src/overlay.js";

export {collapse, cubicInOut, interpolateNode} from "./src/animate/interpolate.js";
export type {Interp} from "./src/animate/interpolate.js";
export {diffChildren, interpolateScene} from "./src/animate/diff.js";
export type {GroupDiff} from "./src/animate/diff.js";
export {commitTrailScene, isPersistTrail, persistTrailNode, TrailLog} from "./src/animate/trailLog.js";
