# @d3plus/render

[![NPM version](https://img.shields.io/npm/v/@d3plus/render.svg)](https://www.npmjs.com/package/@d3plus/render)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=render)](https://codecov.io/gh/d3plus/d3plus/flags)

A backend-agnostic scene graph and pluggable SVG/Canvas renderers for d3plus visualizations.

## Installing

If using npm, `npm install @d3plus/render`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/render).

```js
import {*} from "@d3plus/render";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/render"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Classes | Description |
| --- | --- |
| [`CanvasRenderer`](#canvasrenderer) | A Renderer backend that paints a Scene to a Canvas. It consumes the identical |
| [`SvgRenderer`](#svgrenderer) | Renderer |
| [`TrailLog`](#traillog) |  |

| Functions | Description |
| --- | --- |
| [`applyDeclarativeEvents`](#applydeclarativeevents) | Declarative event delegation for `HtmlOverlayNode.events`. Attaches |
| [`areaPath`](#areapath) | Generates an SVG path string for an area node. The topline and baseline share |
| [`collapse`](#collapse) | Produces the degenerate "zero" form of a node used as the start of an enter |
| [`commitTrailCatchups`](#committrailcatchups) | Commit the trailed marks' positions at the intermediate periods a multi-period |
| [`commitTrailScene`](#committrailscene) | Fold every trailed-persist node in a scene into the log (once per draw) at the |
| [`cubicInOut`](#cubicinout) | The default easing curve, identical to d3-transition's default (cubic in-out), |
| [`curveFor`](#curvefor) | Resolves a curve name to a d3-shape curve factory, defaulting to linear. |
| [`diffChildren`](#diffchildren) | Matches two sibling node lists by their stable `key`, classifying each into |
| [`domToScene`](#domtoscene) | Converts a rendered SVG subtree into a scene graph. This is a migration bridge: |
| [`gradientToken`](#gradienttoken) | Encodes a SceneGradient as a `gradient:<json>` `Paint.fill` token. |
| [`interpolateNode`](#interpolatenode) | Builds an interpolator between two nodes of the same type. When the types differ |
| [`interpolateScene`](#interpolatescene) | Builds a function that returns the interpolated scene at a given time, driving |
| [`isPersistTrail`](#ispersisttrail) | Whether a node opts into a persistent trail (a positive count or `true`). |
| [`linePath`](#linepath) | Generates an SVG path string for a line node. |
| [`parseGradient`](#parsegradient) | Decodes a `gradient:<json>` token, or returns null if `fill` is not one. |
| [`patternTileSvg`](#patterntilesvg) | Builds standalone SVG markup for one tile of a `pattern:<json>` texture |
| [`persistTrailNode`](#persisttrailnode) | Builds a mark's persistent-trail scene node (Canvas backend) at progress `t`. |

| Interfaces | Description |
| --- | --- |
| [`AreaNode`](#areanode) | NodeBase |
| [`AriaSpec`](#ariaspec) | AriaSpec |
| [`CircleNode`](#circlenode) | NodeBase |
| [`DrawOptions`](#drawoptions) | DrawOptions |
| [`FontSpec`](#fontspec) | FontSpec |
| [`GroupDiff`](#groupdiff) | GroupDiff |
| [`GroupNode`](#groupnode) | A transform/clip container; mirrors the nested <g> structure of the SVG output. |
| [`HtmlOverlayNode`](#htmloverlaynode) | Embedded HTML at an absolute pixel position over the scene. The renderer |
| [`ImageNode`](#imagenode) | NodeBase |
| [`LineNode`](#linenode) | NodeBase |
| [`NodeBase`](#nodebase) | NodeBase |
| [`Paint`](#paint) | Paint |
| [`PathNode`](#pathnode) | Pre-serialized SVG path data (the Path shape, Geomap, d3-geo output). |
| [`PickResult`](#pickresult) | PickResult |
| [`RectNode`](#rectnode) | NodeBase |
| [`Renderer`](#renderer) | Renderer |
| [`RenderHandle`](#renderhandle) | RenderHandle |
| [`RenderTarget`](#rendertarget) | RenderTarget |
| [`Scene`](#scene) | Scene |
| [`SceneEvent`](#sceneevent) | SceneEvent |
| [`SceneGradient`](#scenegradient) | SceneGradient |
| [`TextLine`](#textline) | A single laid-out line of text within a TextNode. |
| [`TextNode`](#textnode) | NodeBase |
| [`TextRun`](#textrun) | TextRun |
| [`TrailCatchup`](#trailcatchup) | A skipped intermediate period and the trailed marks' positions there. |
| [`Transform`](#transform) | Transform |

| Type Aliases | Description |
| --- | --- |
| [`ClipShape`](#clipshape) |  |
| [`CurveName`](#curvename) |  |
| [`FontStyle`](#fontstyle) |  |
| [`HitShape`](#hitshape) |  |
| [`Interp`](#interp) |  |
| [`RendererKind`](#rendererkind) |  |
| [`SceneEventType`](#sceneeventtype) |  |
| [`SceneNode`](#scenenode) |  |

## Classes

<a id="canvasrenderer"></a>

### CanvasRenderer

Defined in: [canvas/CanvasRenderer.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L50)

A Renderer backend that paints a Scene to a Canvas. It consumes the identical
scene the SVG backend does; geometry/style are already resolved, so painting is
a straight walk. Animation runs one requestAnimationFrame loop over interpolateScene.

#### Implements

- [`Renderer`](#renderer)

#### Constructors

<a id="constructor"></a>

##### Constructor

> **new CanvasRenderer**(): [`CanvasRenderer`](#canvasrenderer)

###### Returns

[`CanvasRenderer`](#canvasrenderer)

#### Methods

<a id="destroy"></a>

##### destroy()

> **destroy**(): `void`

Defined in: [canvas/CanvasRenderer.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L578)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`destroy`](#destroy-2)

<a id="drawscene"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [canvas/CanvasRenderer.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L129)

Reconcile the current output to `scene`, animating from the previously drawn
scene when `opts.duration` is positive. The single method that matters.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | [`Scene`](#scene) |
| `opts?` | [`DrawOptions`](#drawoptions) |

###### Returns

[`RenderHandle`](#renderhandle)

###### Implementation of

[`Renderer`](#renderer).[`drawScene`](#drawscene-2)

<a id="mount"></a>

##### mount()

> **mount**(`target`: [`RenderTarget`](#rendertarget)): `void`

Defined in: [canvas/CanvasRenderer.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L94)

Attach to a target element and prepare the drawing surface.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`RenderTarget`](#rendertarget) |

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`mount`](#mount-2)

<a id="on"></a>

##### on()

> **on**(`handler`: (`event`: [`SceneEvent`](#sceneevent)) => `void`): () => `void`

Defined in: [canvas/CanvasRenderer.ts:494](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L494)

Subscribe to pointer events on the surface. Returns an unsubscribe function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`event`: [`SceneEvent`](#sceneevent)) => `void` |

###### Returns

() => `void`

###### Implementation of

[`Renderer`](#renderer).[`on`](#on-2)

<a id="pick"></a>

##### pick()

> **pick**(`point`: \[`number`, `number`\]): [`PickResult`](#pickresult) \| `null`

Defined in: [canvas/CanvasRenderer.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L431)

Hit-test a point in surface-local coordinates. Returns the topmost interactive node.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `point` | \[`number`, `number`\] |

###### Returns

[`PickResult`](#pickresult) \| `null`

###### Implementation of

[`Renderer`](#renderer).[`pick`](#pick-2)

<a id="resize"></a>

##### resize()

> **resize**(`width`: `number`, `height`: `number`): `void`

Defined in: [canvas/CanvasRenderer.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L108)

Update the surface dimensions (and re-scale for HiDPI on Canvas).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`resize`](#resize-2)

<a id="target"></a>

##### target()

> **target**(): [`RenderTarget`](#rendertarget) \| `undefined`

Defined in: [canvas/CanvasRenderer.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L125)

Public view onto the mount target. See SvgRenderer.target — same
contract: host code uses this to detect container changes without
reaching into the private `_target` slot.

###### Returns

[`RenderTarget`](#rendertarget) \| `undefined`

###### Implementation of

[`Renderer`](#renderer).[`target`](#target-2)

<a id="tocanvas"></a>

##### toCanvas()

> **toCanvas**(): `HTMLCanvasElement`

Defined in: [canvas/CanvasRenderer.ts:574](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L574)

Rasterize the current surface to a canvas element.

###### Returns

`HTMLCanvasElement`

###### Implementation of

[`Renderer`](#renderer).[`toCanvas`](#tocanvas-1)

<a id="tosvgstring"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [canvas/CanvasRenderer.ts:563](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L563)

Re-renders the retained scene through the SVG backend to produce an SVG string.

###### Returns

`string`

###### Implementation of

[`Renderer`](#renderer).[`toSVGString`](#tosvgstring-2)

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"canvas"` | [canvas/CanvasRenderer.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L51) |

***

<a id="svgrenderer"></a>

### SvgRenderer

Defined in: [svg/SvgRenderer.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L55)

Renderer
The pluggable backend contract. Chart logic emits a Scene; a Renderer realizes
it. The same Scene must produce equivalent output and equivalent pick() results
across backends — that equivalence is the parity guarantee of the architecture.

#### Implements

- [`Renderer`](#renderer)

#### Constructors

<a id="constructor-1"></a>

##### Constructor

> **new SvgRenderer**(): [`SvgRenderer`](#svgrenderer)

###### Returns

[`SvgRenderer`](#svgrenderer)

#### Methods

<a id="destroy-1"></a>

##### destroy()

> **destroy**(): `void`

Defined in: [svg/SvgRenderer.ts:611](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L611)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`destroy`](#destroy-2)

<a id="drawscene-1"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [svg/SvgRenderer.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L134)

Reconcile the current output to `scene`, animating from the previously drawn
scene when `opts.duration` is positive. The single method that matters.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | [`Scene`](#scene) |
| `opts?` | [`DrawOptions`](#drawoptions) |

###### Returns

[`RenderHandle`](#renderhandle)

###### Implementation of

[`Renderer`](#renderer).[`drawScene`](#drawscene-2)

<a id="mount-1"></a>

##### mount()

> **mount**(`target`: [`RenderTarget`](#rendertarget)): `void`

Defined in: [svg/SvgRenderer.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L94)

Attach to a target element and prepare the drawing surface.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`RenderTarget`](#rendertarget) |

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`mount`](#mount-2)

<a id="on-1"></a>

##### on()

> **on**(`handler`: (`event`: [`SceneEvent`](#sceneevent)) => `void`): () => `void`

Defined in: [svg/SvgRenderer.ts:536](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L536)

Subscribe to pointer events on the surface. Returns an unsubscribe function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`event`: [`SceneEvent`](#sceneevent)) => `void` |

###### Returns

() => `void`

###### Implementation of

[`Renderer`](#renderer).[`on`](#on-2)

<a id="pick-1"></a>

##### pick()

> **pick**(`point`: \[`number`, `number`\]): [`PickResult`](#pickresult) \| `null`

Defined in: [svg/SvgRenderer.ts:508](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L508)

Hit-test a point in surface-local coordinates. Returns the topmost interactive node.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `point` | \[`number`, `number`\] |

###### Returns

[`PickResult`](#pickresult) \| `null`

###### Implementation of

[`Renderer`](#renderer).[`pick`](#pick-2)

<a id="resize-1"></a>

##### resize()

> **resize**(`width`: `number`, `height`: `number`): `void`

Defined in: [svg/SvgRenderer.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L117)

Update the surface dimensions (and re-scale for HiDPI on Canvas).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`resize`](#resize-2)

<a id="target-1"></a>

##### target()

> **target**(): [`RenderTarget`](#rendertarget) \| `undefined`

Defined in: [svg/SvgRenderer.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L130)

Public view onto the mount target. v4: callers (e.g. `Viz._drawSceneToTarget`)
use this to compare the current target's container against their
desired one without reaching into the private `_target` field.

###### Returns

[`RenderTarget`](#rendertarget) \| `undefined`

###### Implementation of

[`Renderer`](#renderer).[`target`](#target-2)

<a id="tosvgstring-1"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [svg/SvgRenderer.ts:607](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L607)

Serialize the current scene to an SVG string (Canvas backends re-render via SVG).

###### Returns

`string`

###### Implementation of

[`Renderer`](#renderer).[`toSVGString`](#tosvgstring-2)

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind-1"></a> `kind` | `readonly` | `"svg"` | [svg/SvgRenderer.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L56) |

***

<a id="traillog"></a>

### TrailLog

Defined in: [animate/trailLog.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L58)

#### Constructors

<a id="constructor-2"></a>

##### Constructor

> **new TrailLog**(): [`TrailLog`](#traillog)

###### Returns

[`TrailLog`](#traillog)

#### Methods

<a id="commit"></a>

##### commit()

> **commit**(`key`: `string` \| `number`, `parts`: `TrailParts`, `persist`: `number` \| `boolean`, `seq?`: `number`): `void`

Defined in: [animate/trailLog.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L70)

Fold a mark's current geometry into its history, keyed by the timeline value
`seq`. Trails only grow as time moves FORWARD (`seq` increases): each forward
step commits the segment that was growing and starts the new one. Moving
BACKWARD retracts instead — the most recent segment animates away and is
dropped, rewinding the trail without drawing new history. Without a `seq`
(no timeline) nothing accumulates; a repaint at the same `seq` (e.g. a resize
or hover) just tracks the current position.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` \| `number` |
| `parts` | `TrailParts` |
| `persist` | `number` \| `boolean` |
| `seq?` | `number` |

###### Returns

`void`

<a id="prune"></a>

##### prune()

> **prune**(`seen`: `Set`\<`string` \| `number`\>): `void`

Defined in: [animate/trailLog.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L129)

Drop history for keys no longer present, so the log tracks the live marks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `seen` | `Set`\<`string` \| `number`\> |

###### Returns

`void`

<a id="segments"></a>

##### segments()

> **segments**(`key`: `string` \| `number`): `object`

Defined in: [animate/trailLog.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L134)

The live segments for a mark: the animating one (or null) and committed ones.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` \| `number` |

###### Returns

`object`

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `animating` | `Anim` \| `null` | [animate/trailLog.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L134) |
| `committed` | `TrailSeg`[] | [animate/trailLog.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L134) |

## Functions

<a id="applydeclarativeevents"></a>

### applyDeclarativeEvents()

> **applyDeclarativeEvents**(`host`: `HTMLElement`, `events`: `Record`\<`string`, `Partial`\<`Record`\<`string`, (`e`: `Event`) => `void`\>\>\> \| `undefined`): `void`

Defined in: [overlay.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/render/src/overlay.ts#L148)

Declarative event delegation for `HtmlOverlayNode.events`. Attaches
ONE delegated listener per event type on the host element; each
listener walks the live spec by `event.target.closest(selector)`
matching. The spec is stored on the host via `__d3plusEvents` so
subsequent draws can replace handlers in place without re-binding
DOM listeners.

Idempotent: safe to call on every draw — a host that already has
delegated listeners just gets its spec replaced.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `host` | `HTMLElement` |
| `events` | `Record`\<`string`, `Partial`\<`Record`\<`string`, (`e`: `Event`) => `void`\>\>\> \| *required* |

#### Returns

`void`

***

<a id="areapath"></a>

### areaPath()

> **areaPath**(`node`: [`AreaNode`](#areanode)): `string`

Defined in: [paths.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/render/src/paths.ts#L56)

Generates an SVG path string for an area node. The topline and baseline share
x positions by index (as d3plus areas do); the area is filled between them.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`AreaNode`](#areanode) | The area node. |

#### Returns

`string`

***

<a id="collapse"></a>

### collapse()

> **collapse**(`node`: [`SceneNode`](#scenenode)): [`SceneNode`](#scenenode)

Defined in: [animate/interpolate.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/interpolate.ts#L181)

Produces the degenerate "zero" form of a node used as the start of an enter
animation and the end of an exit animation: opacity fades to 0, and geometric
shapes collapse (rect shrinks toward its center, circle radius → 0), mirroring
the enter/exit conventions of the SVG Shape classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`SceneNode`](#scenenode) | The node to collapse. |

#### Returns

[`SceneNode`](#scenenode)

***

<a id="committrailcatchups"></a>

### commitTrailCatchups()

> **commitTrailCatchups**(`log`: [`TrailLog`](#traillog), `scene`: [`Scene`](#scene), `catchups`: [`TrailCatchup`](#trailcatchup)[]): `void`

Defined in: [animate/trailLog.ts:270](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L270)

Commit the trailed marks' positions at the intermediate periods a multi-period
forward jump skipped, so the trail bends through them instead of drawing one
coarse straight segment. Shape/size/color come from the current scene node;
the caller supplies only the positions. Run BEFORE commitTrailScene so the
catch-up periods land in ascending time order, ahead of the destination.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `log` | [`TrailLog`](#traillog) |
| `scene` | [`Scene`](#scene) |
| `catchups` | [`TrailCatchup`](#trailcatchup)[] |

#### Returns

`void`

***

<a id="committrailscene"></a>

### commitTrailScene()

> **commitTrailScene**(`log`: [`TrailLog`](#traillog), `scene`: [`Scene`](#scene), `seq?`: `number`): `boolean`

Defined in: [animate/trailLog.ts:233](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L233)

Fold every trailed-persist node in a scene into the log (once per draw) at the
timeline value `seq`, pruning stale keys. Returns whether persistent trails
are ACTIVE this draw — true only when a `seq` is supplied (a single-period
timeline; the caller withholds it for range/brushing selections, which have
no single current time) and at least one persist node is present. When false,
a backend falls back to the plain ephemeral trail. `seq` orders the trail in
time: forward grows it, backward rewinds it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `log` | [`TrailLog`](#traillog) |
| `scene` | [`Scene`](#scene) |
| `seq?` | `number` |

#### Returns

`boolean`

***

<a id="cubicinout"></a>

### cubicInOut()

> **cubicInOut**(`t`: `number`): `number`

Defined in: [animate/interpolate.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/interpolate.ts#L30)

The default easing curve, identical to d3-transition's default (cubic in-out),
so Canvas frame interpolation matches SVG transition motion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | `number` | Normalized time in [0,1]. |

#### Returns

`number`

***

<a id="curvefor"></a>

### curveFor()

> **curveFor**(`name?`: `string`): `CurveFactory`

Defined in: [paths.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/render/src/paths.ts#L35)

Resolves a curve name to a d3-shape curve factory, defaulting to linear.
Both the SVG and Canvas backends share this so a curve looks identical on each.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name?` | `string` | The curve name from a LineNode/AreaNode. |

#### Returns

`CurveFactory`

***

<a id="diffchildren"></a>

### diffChildren()

> **diffChildren**(`prev`: [`SceneNode`](#scenenode)[], `next`: [`SceneNode`](#scenenode)[]): [`GroupDiff`](#groupdiff)

Defined in: [animate/diff.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L48)

Matches two sibling node lists by their stable `key`, classifying each into
enter/update/exit. This is the shared classification both backends rely on —
the SVG backend feeds it to a keyed d3 join; the Canvas backend feeds it to
interpolateScene.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prev` | [`SceneNode`](#scenenode)[] | The previously drawn children. |
| `next` | [`SceneNode`](#scenenode)[] | The target children. |

#### Returns

[`GroupDiff`](#groupdiff)

***

<a id="domtoscene"></a>

### domToScene()

> **domToScene**(`el`: `Element`, `keyPrefix?`: `string`): [`GroupNode`](#groupnode)

Defined in: [dom.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/render/src/dom.ts#L100)

Converts a rendered SVG subtree into a scene graph. This is a migration bridge:
components that haven't been natively ported to emit a scene (Axis, Legend, …)
can be snapshotted from their rendered DOM so they participate in the scene and
render through any backend (including Canvas), with parity guaranteed by being a
faithful copy. Natively-ported shapes should emit their own precise toScene().

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `el` | `Element` | *required* | The root SVG element to convert. |
| `keyPrefix` | `string` | `"dom"` | Prefix for synthesized keys on elements without a data-key. |

#### Returns

[`GroupNode`](#groupnode)

***

<a id="gradienttoken"></a>

### gradientToken()

> **gradientToken**(`g`: [`SceneGradient`](#scenegradient)): `string`

Defined in: [scene.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L80)

Encodes a [SceneGradient](#scenegradient) as a `gradient:<json>` `Paint.fill` token.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `g` | [`SceneGradient`](#scenegradient) |

#### Returns

`string`

***

<a id="interpolatenode"></a>

### interpolateNode()

> **interpolateNode**(`from`: [`SceneNode`](#scenenode), `to`: [`SceneNode`](#scenenode)): [`Interp`](#interp)\<[`SceneNode`](#scenenode)\>

Defined in: [animate/interpolate.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/interpolate.ts#L102)

Builds an interpolator between two nodes of the same type. When the types differ
(a rare key reuse across shape kinds) it snaps to the target. Group children are
not recursed here — interpolateScene handles nested groups.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | [`SceneNode`](#scenenode) | The starting node. |
| `to` | [`SceneNode`](#scenenode) | The target node. |

#### Returns

[`Interp`](#interp)\<[`SceneNode`](#scenenode)\>

***

<a id="interpolatescene"></a>

### interpolateScene()

> **interpolateScene**(`prev`: [`Scene`](#scene) \| `null`, `next`: [`Scene`](#scene), `log?`: [`TrailLog`](#traillog)): [`Interp`](#interp)\<[`Scene`](#scene)\>

Defined in: [animate/diff.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L138)

Builds a function that returns the interpolated scene at a given time, driving
the Canvas backend's requestAnimationFrame loop. Entering nodes grow/fade in,
exiting nodes shrink/fade out and are dropped at t === 1.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prev` | [`Scene`](#scene) \| `null` | The previously drawn scene, or null for the first frame. |
| `next` | [`Scene`](#scene) | The target scene. |
| `log?` | [`TrailLog`](#traillog) | - |

#### Returns

[`Interp`](#interp)\<[`Scene`](#scene)\>

***

<a id="ispersisttrail"></a>

### isPersistTrail()

> **isPersistTrail**(`node`: [`SceneNode`](#scenenode)): `boolean`

Defined in: [animate/trailLog.ts:219](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L219)

Whether a node opts into a persistent trail (a positive count or `true`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `node` | [`SceneNode`](#scenenode) |

#### Returns

`boolean`

***

<a id="linepath"></a>

### linePath()

> **linePath**(`node`: [`LineNode`](#linenode)): `string`

Defined in: [paths.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/render/src/paths.ts#L43)

Generates an SVG path string for a line node.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`LineNode`](#linenode) | The line node. |

#### Returns

`string`

***

<a id="parsegradient"></a>

### parseGradient()

> **parseGradient**(`fill?`: `string`): [`SceneGradient`](#scenegradient) \| `null`

Defined in: [scene.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L85)

Decodes a `gradient:<json>` token, or returns null if `fill` is not one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fill?` | `string` |

#### Returns

[`SceneGradient`](#scenegradient) \| `null`

***

<a id="patterntilesvg"></a>

### patternTileSvg()

> **patternTileSvg**(`token`: `string`): \{ `height`: `number`; `svg`: `string`; `width`: `number`; \} \| `null`

Defined in: [canvas/patternTile.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/patternTile.ts#L22)

Builds standalone SVG markup for one tile of a `pattern:<json>` texture
token, plus the tile's pixel dimensions.

textures.js only knows how to emit SVG `<pattern>`s, which a Canvas 2D
context cannot consume directly. The Canvas backend rasterizes this markup
to an offscreen canvas and wraps it in a repeating `CanvasPattern` — the
pixel-for-pixel equivalent of the SVG backend's `url(#…)` pattern fill.

The token format matches what `SvgRenderer` materializes (and what
`Shape.texture()` emits): `{texture: "<class>", …textureConfig}`.

Returns `null` for a malformed or unknown token. Pure aside from building a
detached SVG element via the ambient `document` (browser or jsdom); nothing
is mounted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |

#### Returns

\{ `height`: `number`; `svg`: `string`; `width`: `number`; \} \| `null`

***

<a id="persisttrailnode"></a>

### persistTrailNode()

> **persistTrailNode**(`log`: [`TrailLog`](#traillog), `key`: `string` \| `number`, `t`: `number`): [`SceneNode`](#scenenode) \| `null`

Defined in: [animate/trailLog.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L203)

Builds a mark's persistent-trail scene node (Canvas backend) at progress `t`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `log` | [`TrailLog`](#traillog) |
| `key` | `string` \| `number` |
| `t` | `number` |

#### Returns

[`SceneNode`](#scenenode) \| `null`

## Interfaces

<a id="areanode"></a>

### AreaNode

Defined in: [scene.ts:246](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L246)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-baseline"></a> `baseline` | \[`number`, `number`\][] | - | - | [scene.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L249) |
| <a id="property-curve"></a> `curve?` | `string` | - | - | [scene.ts:250](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L250) |
| <a id="property-datum"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-topline"></a> `topline` | \[`number`, `number`\][] | - | - | [scene.ts:248](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L248) |
| <a id="property-trail"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type"></a> `type` | `"area"` | - | - | [scene.ts:247](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L247) |
| <a id="property-z"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="ariaspec"></a>

### AriaSpec

Defined in: [scene.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L154)

AriaSpec
Accessibility metadata. The SVG backend applies these as role/aria-label
attributes natively; the Canvas backend mirrors them in a shadow tree.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-hidden"></a> `hidden?` | `boolean` | [scene.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L157) |
| <a id="property-label"></a> `label?` | `string` | [scene.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L156) |
| <a id="property-role"></a> `role?` | `string` | [scene.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L155) |

***

<a id="circlenode"></a>

### CircleNode

Defined in: [scene.ts:233](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L233)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-1"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-cx"></a> `cx` | `number` | - | - | [scene.ts:235](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L235) |
| <a id="property-cy"></a> `cy` | `number` | - | - | [scene.ts:236](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L236) |
| <a id="property-datum-1"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-1"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit-1"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-1"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-1"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-1"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-1"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-1"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-1"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-r"></a> `r` | `number` | - | - | [scene.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L237) |
| <a id="property-shapetype-1"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-1"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-1"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-1"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-1"></a> `type` | `"circle"` | - | - | [scene.ts:234](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L234) |
| <a id="property-z-1"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="drawoptions"></a>

### DrawOptions

Defined in: [Renderer.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L24)

DrawOptions
Per-frame options for a drawScene call. A duration of 0 (or omitted) commits
immediately; a positive duration animates from the previous scene.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-duration"></a> `duration?` | `number` | - | [Renderer.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L25) |
| <a id="property-ease"></a> `ease?` | (`t`: `number`) => `number` | Easing function mapping normalized time [0,1] → [0,1]; shared by both backends. | [Renderer.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L27) |
| <a id="property-onend"></a> `onEnd?` | () => `void` | - | [Renderer.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L30) |
| <a id="property-onframe"></a> `onFrame?` | (`t`: `number`) => `void` | Called on each committed frame (Canvas) or transition tick (SVG). | [Renderer.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L29) |
| <a id="property-sequence"></a> `sequence?` | `number` | Monotonic timeline value for this draw (e.g. the current period). Orders persistent motion trails in time: a higher value than the last draw grows the trail forward, a lower one rewinds it. Omit when there's no timeline. | [Renderer.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L36) |
| <a id="property-trailcatchup"></a> `trailCatchup?` | [`TrailCatchup`](#trailcatchup)[] | Positions of trailed marks at the intermediate periods a multi-period forward jump skipped, in ascending order, so a persistent trail bends through them instead of drawing one coarse straight segment. Committed before `sequence`. | [Renderer.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L43) |

***

<a id="fontspec"></a>

### FontSpec

Defined in: [scene.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L105)

FontSpec
Resolved font metrics for a TextNode. Text is laid out (wrapped, positioned)
during scene construction, so backends only paint pre-computed lines.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-anchor"></a> `anchor?` | `"start"` \| `"middle"` \| `"end"` | - | [scene.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L110) |
| <a id="property-baseline-1"></a> `baseline?` | `"middle"` \| `"alphabetic"` \| `"hanging"` | - | [scene.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L111) |
| <a id="property-dir"></a> `dir?` | `"ltr"` \| `"rtl"` | Writing direction; SVG maps this to the `dir` attribute. | [scene.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L113) |
| <a id="property-family"></a> `family?` | `string` | - | [scene.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L106) |
| <a id="property-size"></a> `size?` | `number` | - | [scene.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L107) |
| <a id="property-style"></a> `style?` | [`FontStyle`](#fontstyle) | - | [scene.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L109) |
| <a id="property-weight"></a> `weight?` | `string` \| `number` | - | [scene.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L108) |

***

<a id="groupdiff"></a>

### GroupDiff

Defined in: [animate/diff.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L34)

GroupDiff
The result of matching two child lists by key: nodes to add (enter), nodes
present in both (update, as [previous, next] pairs), and nodes to remove (exit).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-enter"></a> `enter` | [`SceneNode`](#scenenode)[] | [animate/diff.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L35) |
| <a id="property-exit"></a> `exit` | [`SceneNode`](#scenenode)[] | [animate/diff.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L37) |
| <a id="property-update"></a> `update` | \[[`SceneNode`](#scenenode), [`SceneNode`](#scenenode)\][] | [animate/diff.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L36) |

***

<a id="groupnode"></a>

### GroupNode

Defined in: [scene.ts:324](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L324)

A transform/clip container; mirrors the nested <g> structure of the SVG output.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-2"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-children"></a> `children` | [`SceneNode`](#scenenode)[] | - | - | [scene.ts:326](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L326) |
| <a id="property-clip"></a> `clip?` | [`ClipShape`](#clipshape) | - | - | [scene.ts:327](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L327) |
| <a id="property-datum-2"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-2"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit-2"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-2"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-2"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-2"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-2"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-2"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-2"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-2"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-2"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-2"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-2"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-2"></a> `type` | `"group"` | - | - | [scene.ts:325](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L325) |
| <a id="property-z-2"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="htmloverlaynode"></a>

### HtmlOverlayNode

Defined in: [scene.ts:349](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L349)

Embedded HTML at an absolute pixel position over the scene. The renderer
mounts the HTML in a sibling `<div>` (NOT inside the SVG) positioned via
CSS. Backends that can't host DOM (pure-Canvas-export, server-side
rendering) skip these nodes — chart logic that depends on HTML overlays
(zoom controls, attribution links, the Tooltip portal) must degrade
gracefully when picked up by a non-DOM backend.

The `html` field is rendered as HTML (innerHTML). Callers that need
user-supplied text MUST sanitize before assigning.

Serializability note: `onMount` is the documented escape from the
"scene is pure data" principle. Pure scene types use no functions;
HtmlOverlay is the explicit interactive surface and accepts a callback
for post-mount event wiring (e.g. zoom control buttons). Renderers call
it once after the host div is first appended, and again on each update
so consumers can re-bind handlers if they replace innerHTML. Consumers
are responsible for idempotent wiring (remove old listeners first).

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-3"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-classname"></a> `className?` | `string` | Optional CSS class names applied to the host <div>. | - | [scene.ts:362](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L362) |
| <a id="property-datum-3"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-events"></a> `events?` | `Record`\<`string`, `Partial`\<`Record`\<`string`, (`e`: `Event`) => `void`\>\>\> | Declarative event wiring — a record of CSS-selector → event-name → handler. The renderer attaches one listener per (selector, event) pair and dispatches by `event.target.closest(selector)` matching. Prefer this over `onMount` for click/hover/keyboard wiring: the declarative form is serializable, survives scene snapshots, and keeps closures off the scene primitive. Example: events: { ".zoom-in": {click: e => viz.zoomIn()}, ".zoom-out": {click: e => viz.zoomOut()}, } | - | [scene.ts:379](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L379) |
| <a id="property-gradientbounds-3"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-height"></a> `height?` | `number` | Optional explicit height (defaults to content-driven). | - | [scene.ts:358](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L358) |
| <a id="property-hit-3"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-html"></a> `html` | `string` | Raw HTML (innerHTML) for the overlay. Caller is responsible for sanitization. | - | [scene.ts:360](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L360) |
| <a id="property-id-3"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-3"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-3"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-3"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-3"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-onmount"></a> `onMount?` | (`el`: `HTMLDivElement`) => `void` | Optional callback fired ONCE after the overlay's host `<div>` is first created — AFTER `innerHTML` / `style` / `dimensions` are written so the consumer can `host.querySelector(...)` inside the callback. Prefer `events` over `onMount` when possible; this is the escape hatch for non-event setup (e.g. instantiating a third-party widget on the host element). | - | [scene.ts:391](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L391) |
| <a id="property-onupdate"></a> `onUpdate?` | (`el`: `HTMLDivElement`) => `void` | Optional callback fired on EVERY draw (including the first). Mirror of `onMount` for state that must reflect each render's data — typically reading `node.html` is enough and you don't need this. Use when listeners must rebind because their closures captured stale-by-design state. | - | [scene.ts:400](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L400) |
| <a id="property-paint-3"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-3"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-style-1"></a> `style?` | `Record`\<`string`, `string` \| `number`\> | Optional inline-style key/value record applied to the host <div>. | - | [scene.ts:364](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L364) |
| <a id="property-trail-3"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-3"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-3"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-3"></a> `type` | `"htmlOverlay"` | - | - | [scene.ts:350](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L350) |
| <a id="property-width"></a> `width?` | `number` | Optional explicit width (defaults to content-driven). | - | [scene.ts:356](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L356) |
| <a id="property-x"></a> `x` | `number` | Top-left x position in scene coordinates. | - | [scene.ts:352](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L352) |
| <a id="property-y"></a> `y` | `number` | Top-left y position in scene coordinates. | - | [scene.ts:354](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L354) |
| <a id="property-z-3"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="imagenode"></a>

### ImageNode

Defined in: [scene.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L259)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-4"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-datum-4"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-4"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-height-1"></a> `height` | `number` | - | - | [scene.ts:264](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L264) |
| <a id="property-hit-4"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-href"></a> `href` | `string` | - | - | [scene.ts:265](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L265) |
| <a id="property-id-4"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-4"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-4"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-4"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-4"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-4"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-4"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-4"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-4"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-4"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-4"></a> `type` | `"image"` | - | - | [scene.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L260) |
| <a id="property-width-1"></a> `width` | `number` | - | - | [scene.ts:263](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L263) |
| <a id="property-x-1"></a> `x` | `number` | - | - | [scene.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L261) |
| <a id="property-y-1"></a> `y` | `number` | - | - | [scene.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L262) |
| <a id="property-z-4"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="linenode"></a>

### LineNode

Defined in: [scene.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L240)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-5"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-curve-1"></a> `curve?` | `string` | - | - | [scene.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L243) |
| <a id="property-datum-5"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-5"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit-5"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-5"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-5"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-5"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-5"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-5"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-5"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-points"></a> `points` | \[`number`, `number`\][] | - | - | [scene.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L242) |
| <a id="property-shapetype-5"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-5"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-5"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-5"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-5"></a> `type` | `"line"` | - | - | [scene.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L241) |
| <a id="property-z-5"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="nodebase"></a>

### NodeBase

Defined in: [scene.ts:164](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L164)

NodeBase
Fields shared by every scene node.

#### Extended by

- [`RectNode`](#rectnode)
- [`CircleNode`](#circlenode)
- [`LineNode`](#linenode)
- [`AreaNode`](#areanode)
- [`PathNode`](#pathnode)
- [`ImageNode`](#imagenode)
- [`TextNode`](#textnode)
- [`GroupNode`](#groupnode)
- [`HtmlOverlayNode`](#htmloverlaynode)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aria-6"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-datum-6"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-6"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit-6"></a> `hit?` | [`HitShape`](#hitshape) | - | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-6"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-6"></a> `index?` | `number` | - | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-6"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-6"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-6"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-6"></a> `paint?` | [`Paint`](#paint) | - | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-6"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-6"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-6"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-6"></a> `transform?` | [`Transform`](#transform) | - | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-z-6"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="paint"></a>

### Paint

Defined in: [scene.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L17)

Paint
A fully-resolved paint description. No accessor functions survive into a scene —
every value here is a concrete primitive computed during scene construction,
which is what lets a backend paint without re-running data accessors.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fill"></a> `fill?` | `string` | Resolved color, or a serializable special-fill token a backend materializes: `pattern:<json>` for a textures.js texture, or `gradient:<json>` for a [SceneGradient](#scenegradient). Tokens keep the scene free of `url(#…)` references that only resolve against one SVG document. | [scene.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L24) |
| <a id="property-fillopacity"></a> `fillOpacity?` | `number` | - | [scene.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L25) |
| <a id="property-opacity"></a> `opacity?` | `number` | Node-level alpha. Hover/active dimming is expressed here, not via DOM surgery. | [scene.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L35) |
| <a id="property-shaperendering"></a> `shapeRendering?` | `string` | - | [scene.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L33) |
| <a id="property-stroke"></a> `stroke?` | `string` | - | [scene.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L26) |
| <a id="property-strokedasharray"></a> `strokeDasharray?` | `number`[] | Normalized to numbers (the SVG Shape stores this as a string). | [scene.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L30) |
| <a id="property-strokelinecap"></a> `strokeLinecap?` | `"butt"` \| `"round"` \| `"square"` | - | [scene.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L31) |
| <a id="property-strokeopacity"></a> `strokeOpacity?` | `number` | - | [scene.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L28) |
| <a id="property-strokewidth"></a> `strokeWidth?` | `number` | - | [scene.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L27) |
| <a id="property-vectoreffect"></a> `vectorEffect?` | `"none"` \| `"non-scaling-stroke"` | - | [scene.ts:32](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L32) |

***

<a id="pathnode"></a>

### PathNode

Defined in: [scene.ts:254](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L254)

Pre-serialized SVG path data (the Path shape, Geomap, d3-geo output).

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-7"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-d"></a> `d` | `string` | - | - | [scene.ts:256](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L256) |
| <a id="property-datum-7"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-7"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-hit-7"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-7"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-7"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-7"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-7"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-7"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-7"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-7"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-7"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-7"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-7"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-6"></a> `type` | `"path"` | - | - | [scene.ts:255](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L255) |
| <a id="property-z-7"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="pickresult"></a>

### PickResult

Defined in: [Renderer.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L61)

PickResult
The outcome of a hit-test: the topmost interactive node at a point.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-datum-8"></a> `datum?` | `DataPoint` | [Renderer.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L63) |
| <a id="property-index-8"></a> `index?` | `number` | [Renderer.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L64) |
| <a id="property-node"></a> `node` | [`SceneNode`](#scenenode) | [Renderer.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L62) |

***

<a id="rectnode"></a>

### RectNode

Defined in: [scene.ts:223](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L223)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-8"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-datum-9"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-gradientbounds-8"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-height-2"></a> `height` | `number` | - | - | [scene.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L228) |
| <a id="property-hit-8"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-8"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-9"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-8"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-8"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-8"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-paint-8"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-rx"></a> `rx?` | `number` | - | - | [scene.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L229) |
| <a id="property-ry"></a> `ry?` | `number` | - | - | [scene.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L230) |
| <a id="property-shapetype-8"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-8"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-8"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-8"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-7"></a> `type` | `"rect"` | - | - | [scene.ts:224](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L224) |
| <a id="property-width-2"></a> `width` | `number` | - | - | [scene.ts:227](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L227) |
| <a id="property-x-2"></a> `x` | `number` | - | - | [scene.ts:225](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L225) |
| <a id="property-y-2"></a> `y` | `number` | - | - | [scene.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L226) |
| <a id="property-z-8"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="renderer"></a>

### Renderer

Defined in: [Renderer.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L103)

Renderer
The pluggable backend contract. Chart logic emits a Scene; a Renderer realizes
it. The same Scene must produce equivalent output and equivalent pick() results
across backends — that equivalence is the parity guarantee of the architecture.

#### Methods

<a id="destroy-2"></a>

##### destroy()

> **destroy**(): `void`

Defined in: [Renderer.ts:143](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L143)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

<a id="drawscene-2"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [Renderer.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L128)

Reconcile the current output to `scene`, animating from the previously drawn
scene when `opts.duration` is positive. The single method that matters.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | [`Scene`](#scene) |
| `opts?` | [`DrawOptions`](#drawoptions) |

###### Returns

[`RenderHandle`](#renderhandle)

<a id="mount-2"></a>

##### mount()

> **mount**(`target`: [`RenderTarget`](#rendertarget)): `void`

Defined in: [Renderer.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L107)

Attach to a target element and prepare the drawing surface.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`RenderTarget`](#rendertarget) |

###### Returns

`void`

<a id="on-2"></a>

##### on()

> **on**(`handler`: (`event`: [`SceneEvent`](#sceneevent)) => `void`): () => `void`

Defined in: [Renderer.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L134)

Subscribe to pointer events on the surface. Returns an unsubscribe function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`event`: [`SceneEvent`](#sceneevent)) => `void` |

###### Returns

() => `void`

<a id="pick-2"></a>

##### pick()

> **pick**(`point`: \[`number`, `number`\]): [`PickResult`](#pickresult) \| `null`

Defined in: [Renderer.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L131)

Hit-test a point in surface-local coordinates. Returns the topmost interactive node.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `point` | \[`number`, `number`\] |

###### Returns

[`PickResult`](#pickresult) \| `null`

<a id="resize-2"></a>

##### resize()

> **resize**(`width`: `number`, `height`: `number`): `void`

Defined in: [Renderer.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L110)

Update the surface dimensions (and re-scale for HiDPI on Canvas).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `height` | `number` |

###### Returns

`void`

<a id="target-2"></a>

##### target()?

> `optional` **target**(): [`RenderTarget`](#rendertarget) \| `undefined`

Defined in: [Renderer.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L122)

Return the mount target the renderer is currently attached to.
Used by hosts that need to compare against their own DOM (e.g. to
decide whether to remount on container change) without reaching
into renderer-private fields.

Optional so that third-party Renderer implementations that predate
this method still satisfy the interface — callers must tolerate
`undefined` and fall back to a remount-on-change strategy.

###### Returns

[`RenderTarget`](#rendertarget) \| `undefined`

<a id="tocanvas-1"></a>

##### toCanvas()?

> `optional` **toCanvas**(): `HTMLCanvasElement`

Defined in: [Renderer.ts:140](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L140)

Rasterize the current surface to a canvas element.

###### Returns

`HTMLCanvasElement`

<a id="tosvgstring-2"></a>

##### toSVGString()?

> `optional` **toSVGString**(): `string`

Defined in: [Renderer.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L137)

Serialize the current scene to an SVG string (Canvas backends re-render via SVG).

###### Returns

`string`

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind-2"></a> `kind` | `readonly` | [`RendererKind`](#rendererkind) | [Renderer.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L104) |

***

<a id="renderhandle"></a>

### RenderHandle

Defined in: [Renderer.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L51)

RenderHandle
The result of a drawScene call. `finished` resolves when any animation completes,
letting callers (e.g. Viz.render) await a stable, painted state.

#### Methods

<a id="cancel"></a>

##### cancel()

> **cancel**(): `void`

Defined in: [Renderer.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L54)

Abort an in-flight animation, leaving the surface at its current frame.

###### Returns

`void`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-finished"></a> `finished` | `Promise`\<`void`\> | [Renderer.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L52) |

***

<a id="rendertarget"></a>

### RenderTarget

Defined in: [Renderer.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L11)

RenderTarget
Describes where a renderer should mount. The container is renderer-agnostic
(a plain element); the backend creates its own <svg> or <canvas> inside it.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-container"></a> `container` | `Element` | - | [Renderer.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L12) |
| <a id="property-height-3"></a> `height` | `number` | - | [Renderer.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L14) |
| <a id="property-pixelratio"></a> `pixelRatio?` | `number` | Device pixel ratio for HiDPI canvas rendering; defaults to window.devicePixelRatio. | [Renderer.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L16) |
| <a id="property-width-3"></a> `width` | `number` | - | [Renderer.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L13) |

***

<a id="scene"></a>

### Scene

Defined in: [scene.ts:424](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L424)

Scene
A complete, backend-agnostic description of one frame of a visualization.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-height-4"></a> `height` | `number` | - | [scene.ts:427](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L427) |
| <a id="property-meta"></a> `meta?` | `object` | - | [scene.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L428) |
| `meta.background?` | `string` | - | [scene.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L429) |
| `meta.pixelRatio?` | `number` | Device pixel ratio hint for HiDPI canvas rendering. | [scene.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L431) |
| <a id="property-root"></a> `root` | [`GroupNode`](#groupnode) | - | [scene.ts:425](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L425) |
| <a id="property-width-4"></a> `width` | `number` | - | [scene.ts:426](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L426) |

***

<a id="sceneevent"></a>

### SceneEvent

Defined in: [Renderer.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L84)

SceneEvent
A backend-neutral pointer event, carrying the local point and the picked node
(if any), so interaction handling is decoupled from DOM event targets.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-nativeevent"></a> `nativeEvent` | `Event` | [Renderer.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L88) |
| <a id="property-pick"></a> `pick` | [`PickResult`](#pickresult) \| `null` | [Renderer.ts:87](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L87) |
| <a id="property-point"></a> `point` | \[`number`, `number`\] | [Renderer.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L86) |
| <a id="property-type-8"></a> `type` | `string` | [Renderer.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L85) |

***

<a id="scenegradient"></a>

### SceneGradient

Defined in: [scene.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L62)

SceneGradient
A resolved, serializable gradient fill, encoded into `Paint.fill` as the
token `gradient:<json>` (the same scheme as the `pattern:<json>` texture
token). Coordinates are in objectBoundingBox units (0–1), so a backend
scales the gradient to the painted node's bounds: the SVG backend maps
them straight onto a `<linearGradient>` (whose default `gradientUnits` is
already objectBoundingBox); the Canvas backend multiplies them by the
node's bounding box to build a `CanvasGradient`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-from"></a> `from` | \[`number`, `number`\] | Start point — objectBoundingBox units (0–1), or absolute for userSpaceOnUse. | [scene.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L72) |
| <a id="property-stops"></a> `stops` | `object`[] | Color stops; `offset` in 0–1, sorted ascending. | [scene.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L76) |
| <a id="property-to"></a> `to` | \[`number`, `number`\] | End point — objectBoundingBox units (0–1), or absolute for userSpaceOnUse. | [scene.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L74) |
| <a id="property-type-9"></a> `type` | `"linear"` | - | [scene.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L63) |
| <a id="property-units"></a> `units?` | `"userSpaceOnUse"` | Coordinate space for `from`/`to`. Default (omitted) is objectBoundingBox (0–1, scaled to the node's bounds). `"userSpaceOnUse"` treats them as absolute scene coordinates — used by motion trails so the gradient stays put as the path's bounding box grows, instead of remapping (and snapping). | [scene.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L70) |

***

<a id="textline"></a>

### TextLine

Defined in: [scene.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L269)

A single laid-out line of text within a TextNode.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runs"></a> `runs?` | [`TextRun`](#textrun)[] | Optional inline runs with style overrides (bold/italic from HTML markup). | [scene.ts:275](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L275) |
| <a id="property-text"></a> `text` | `string` | - | [scene.ts:270](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L270) |
| <a id="property-width-5"></a> `width` | `number` | - | [scene.ts:273](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L273) |
| <a id="property-x-3"></a> `x` | `number` | - | [scene.ts:271](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L271) |
| <a id="property-y-3"></a> `y` | `number` | - | [scene.ts:272](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L272) |

***

<a id="textnode"></a>

### TextNode

Defined in: [scene.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L278)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-9"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-datum-10"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L174) |
| <a id="property-font"></a> `font` | [`FontSpec`](#fontspec) | - | - | [scene.ts:284](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L284) |
| <a id="property-gradientbounds-9"></a> `gradientBounds?` | `object` | Explicit bounding box for an objectBoundingBox gradient fill on a node the Canvas backend can't measure geometrically (a `path`). The SVG backend derives the box from the element automatically; Canvas reads this instead of parsing `d`. Used by motion-trail cones. | [`NodeBase`](#nodebase).[`gradientBounds`](#property-gradientbounds-6) | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.h` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.w` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.x` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| `gradientBounds.y` | `number` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-height-5"></a> `height?` | `number` | - | - | [scene.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L291) |
| <a id="property-hit-9"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-id-9"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L172) |
| <a id="property-index-10"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-interactiongroup-9"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L189) |
| <a id="property-interactive-9"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193) |
| <a id="property-key-9"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L166) |
| <a id="property-lines"></a> `lines` | [`TextLine`](#textline)[] | Pre-wrapped, pre-positioned lines — backends do not re-measure or re-wrap. | - | [scene.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L283) |
| <a id="property-paint-9"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |
| <a id="property-shapetype-9"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-trail-9"></a> `trail?` | `boolean` | Hint for the animate layer to draw a motion trail (a tapering cone that fades from the mark's color at its current position to transparent at its previous one) as it moves between frames — e.g. points sliding year-to-year on Timeline play. Honored for point (circle) and rect marks. | [`NodeBase`](#nodebase).[`trail`](#property-trail-6) | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-trailpersist-9"></a> `trailPersist?` | `number` \| `boolean` | How many past moves the trail keeps visible (a persistent trail). `0`/unset is the default ephemeral trail (only the current move, fading out on arrival). A number keeps that many step-segments, fading older ones to transparent; `true` keeps a long slowly-fading tail. The animate layer chains each segment's cone geometry and gradient so the path curves and fades continuously through the mark's history. | [`NodeBase`](#nodebase).[`trailPersist`](#property-trailpersist-6) | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-transform-9"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L191) |
| <a id="property-type-10"></a> `type` | `"text"` | - | - | [scene.ts:279](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L279) |
| <a id="property-width-6"></a> `width?` | `number` | Layout box width/height (the wrap box the lines were positioned in). Used only as a fallback to center a font-size transition's scale when a node has no laid-out lines. | - | [scene.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L290) |
| <a id="property-x-4"></a> `x` | `number` | - | - | [scene.ts:280](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L280) |
| <a id="property-y-4"></a> `y` | `number` | - | - | [scene.ts:281](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L281) |
| <a id="property-z-9"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |

***

<a id="textrun"></a>

### TextRun

Defined in: [scene.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L122)

TextRun
An inline span within a TextLine with optional per-run style overrides
(e.g. bold/italic produced by HTML markup in TextBox). Backends emit
nested <tspan>s for SVG or weight-aware paints for Canvas.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-style-2"></a> `style?` | `object` | [scene.ts:124](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L124) |
| `style.style?` | [`FontStyle`](#fontstyle) | [scene.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L126) |
| `style.weight?` | `string` \| `number` | [scene.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L125) |
| <a id="property-text-1"></a> `text` | `string` | [scene.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L123) |

***

<a id="trailcatchup"></a>

### TrailCatchup

Defined in: [animate/trailLog.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L258)

A skipped intermediate period and the trailed marks' positions there.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-positions"></a> `positions` | `object`[] | [animate/trailLog.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L260) |
| <a id="property-sequence-1"></a> `sequence` | `number` | [animate/trailLog.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/trailLog.ts#L259) |

***

<a id="transform"></a>

### Transform

Defined in: [scene.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L43)

Transform
A 2D affine transform, replacing the SVG transform string that
Shape._applyTransform builds today. Uniform scale only, matching Shape._scale.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-rotate"></a> `rotate?` | `number` | Rotation in degrees. | [scene.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L48) |
| <a id="property-rotateanchor"></a> `rotateAnchor?` | \[`number`, `number`\] | - | [scene.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L49) |
| <a id="property-scale"></a> `scale?` | `number` | - | [scene.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L46) |
| <a id="property-x-5"></a> `x?` | `number` | - | [scene.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L44) |
| <a id="property-y-5"></a> `y?` | `number` | - | [scene.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L45) |

## Type Aliases

<a id="clipshape"></a>

### ClipShape

> **ClipShape** = \{ `height`: `number`; `type`: `"rect"`; `width`: `number`; `x`: `number`; `y`: `number`; \} \| \{ `d`: `string`; `type`: `"path"`; \}

Defined in: [scene.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L135)

***

<a id="curvename"></a>

### CurveName

> **CurveName** = `string`

Defined in: [scene.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L9)

***

<a id="fontstyle"></a>

### FontStyle

> **FontStyle** = `"normal"` \| `"italic"`

Defined in: [scene.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L98)

***

<a id="hitshape"></a>

### HitShape

> **HitShape** = \{ `height`: `number`; `type`: `"rect"`; `width`: `number`; `x`: `number`; `y`: `number`; \} \| \{ `cx`: `number`; `cy`: `number`; `r`: `number`; `type`: `"circle"`; \} \| \{ `d`: `string`; `type`: `"path"`; \}

Defined in: [scene.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L144)

***

<a id="interp"></a>

### Interp

> **Interp**\<`T`\> = (`t`: `number`) => `T`

Defined in: [animate/interpolate.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/interpolate.ts#L23)

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `t` | `number` |

#### Returns

`T`

***

<a id="rendererkind"></a>

### RendererKind

> **RendererKind** = `"svg"` \| `"canvas"` \| `"webgl"`

Defined in: [Renderer.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L95)

***

<a id="sceneeventtype"></a>

### SceneEventType

> **SceneEventType** = `"click"` \| `"dblclick"` \| `"contextmenu"` \| `"mouseenter"` \| `"mouseleave"` \| `"mousemove"`

Defined in: [Renderer.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L71)

***

<a id="scenenode"></a>

### SceneNode

> **SceneNode** = [`RectNode`](#rectnode) \| [`CircleNode`](#circlenode) \| [`LineNode`](#linenode) \| [`AreaNode`](#areanode) \| [`PathNode`](#pathnode) \| [`ImageNode`](#imagenode) \| [`TextNode`](#textnode) \| [`GroupNode`](#groupnode) \| [`HtmlOverlayNode`](#htmloverlaynode)

Defined in: [scene.ts:409](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L409)
