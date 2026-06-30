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
| [`SvgRenderer`](#svgrenderer) | A Renderer backend that realizes a Scene as SVG, using a keyed enter/update/exit |

| Functions | Description |
| --- | --- |
| [`applyDeclarativeEvents`](#applydeclarativeevents) | Declarative event delegation for `HtmlOverlayNode.events`. Attaches |
| [`areaPath`](#areapath) | Generates an SVG path string for an area node. The topline and baseline share |
| [`collapse`](#collapse) | Produces the degenerate "zero" form of a node used as the start of an enter |
| [`cubicInOut`](#cubicinout) | The default easing curve, identical to d3-transition's default (cubic in-out), |
| [`curveFor`](#curvefor) | Resolves a curve name to a d3-shape curve factory, defaulting to linear. |
| [`diffChildren`](#diffchildren) | Matches two sibling node lists by their stable `key`, classifying each into |
| [`domToScene`](#domtoscene) | Converts a rendered SVG subtree into a scene graph. This is a migration bridge: |
| [`gradientToken`](#gradienttoken) | Encodes a SceneGradient as a `gradient:<json>` `Paint.fill` token. |
| [`interpolateNode`](#interpolatenode) | Builds an interpolator between two nodes of the same type. When the types differ |
| [`interpolateScene`](#interpolatescene) | Builds a function that returns the interpolated scene at a given time, driving |
| [`linePath`](#linepath) | Generates an SVG path string for a line node. |
| [`parseGradient`](#parsegradient) | Decodes a `gradient:<json>` token, or returns null if `fill` is not one. |
| [`patternTileSvg`](#patterntilesvg) | Builds standalone SVG markup for one tile of a `pattern:<json>` texture |

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

Defined in: [canvas/CanvasRenderer.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L49)

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

Defined in: [canvas/CanvasRenderer.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L556)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`destroy`](#destroy-2)

<a id="drawscene"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [canvas/CanvasRenderer.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L126)

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

Defined in: [canvas/CanvasRenderer.ts:91](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L91)

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

Defined in: [canvas/CanvasRenderer.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L472)

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

Defined in: [canvas/CanvasRenderer.ts:409](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L409)

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

Defined in: [canvas/CanvasRenderer.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L105)

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

Defined in: [canvas/CanvasRenderer.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L122)

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

Defined in: [canvas/CanvasRenderer.ts:552](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L552)

Rasterize the current surface to a canvas element.

###### Returns

`HTMLCanvasElement`

###### Implementation of

[`Renderer`](#renderer).[`toCanvas`](#tocanvas-1)

<a id="tosvgstring"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [canvas/CanvasRenderer.ts:541](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L541)

Re-renders the retained scene through the SVG backend to produce an SVG string.

###### Returns

`string`

###### Implementation of

[`Renderer`](#renderer).[`toSVGString`](#tosvgstring-2)

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"canvas"` | [canvas/CanvasRenderer.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/render/src/canvas/CanvasRenderer.ts#L50) |

***

<a id="svgrenderer"></a>

### SvgRenderer

Defined in: [svg/SvgRenderer.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L40)

A Renderer backend that realizes a Scene as SVG, using a keyed enter/update/exit
join with d3-transition. This is the parity target — the same mechanism the
existing Shape classes use, generalized to consume scene nodes.

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

Defined in: [svg/SvgRenderer.ts:548](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L548)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

###### Implementation of

[`Renderer`](#renderer).[`destroy`](#destroy-2)

<a id="drawscene-1"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [svg/SvgRenderer.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L111)

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

Defined in: [svg/SvgRenderer.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L71)

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

Defined in: [svg/SvgRenderer.ts:473](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L473)

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

Defined in: [svg/SvgRenderer.ts:445](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L445)

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

Defined in: [svg/SvgRenderer.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L94)

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

Defined in: [svg/SvgRenderer.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L107)

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

Defined in: [svg/SvgRenderer.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L544)

Serialize the current scene to an SVG string (Canvas backends re-render via SVG).

###### Returns

`string`

###### Implementation of

[`Renderer`](#renderer).[`toSVGString`](#tosvgstring-2)

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind-1"></a> `kind` | `readonly` | `"svg"` | [svg/SvgRenderer.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/render/src/svg/SvgRenderer.ts#L41) |

## Functions

<a id="applydeclarativeevents"></a>

### applyDeclarativeEvents()

> **applyDeclarativeEvents**(`host`: `HTMLElement`, `events`: `Record`\<`string`, `Partial`\<`Record`\<`string`, (`e`: `Event`) => `void`\>\>\> \| `undefined`): `void`

Defined in: [overlay.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/render/src/overlay.ts#L123)

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

Defined in: [animate/diff.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L24)

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

Defined in: [scene.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L73)

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

> **interpolateScene**(`prev`: [`Scene`](#scene) \| `null`, `next`: [`Scene`](#scene)): [`Interp`](#interp)\<[`Scene`](#scene)\>

Defined in: [animate/diff.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L90)

Builds a function that returns the interpolated scene at a given time, driving
the Canvas backend's requestAnimationFrame loop. Entering nodes grow/fade in,
exiting nodes shrink/fade out and are dropped at t === 1.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prev` | [`Scene`](#scene) \| `null` | The previously drawn scene, or null for the first frame. |
| `next` | [`Scene`](#scene) | The target scene. |

#### Returns

[`Interp`](#interp)\<[`Scene`](#scene)\>

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

Defined in: [scene.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L78)

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

## Interfaces

<a id="areanode"></a>

### AreaNode

Defined in: [scene.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L216)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-baseline"></a> `baseline` | \[`number`, `number`\][] | - | - | [scene.ts:219](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L219) |
| <a id="property-curve"></a> `curve?` | `string` | - | - | [scene.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L220) |
| <a id="property-datum"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-topline"></a> `topline` | \[`number`, `number`\][] | - | - | [scene.ts:218](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L218) |
| <a id="property-transform"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type"></a> `type` | `"area"` | - | - | [scene.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L217) |
| <a id="property-z"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="ariaspec"></a>

### AriaSpec

Defined in: [scene.ts:147](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L147)

AriaSpec
Accessibility metadata. The SVG backend applies these as role/aria-label
attributes natively; the Canvas backend mirrors them in a shadow tree.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-hidden"></a> `hidden?` | `boolean` | [scene.ts:150](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L150) |
| <a id="property-label"></a> `label?` | `string` | [scene.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L149) |
| <a id="property-role"></a> `role?` | `string` | [scene.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L148) |

***

<a id="circlenode"></a>

### CircleNode

Defined in: [scene.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L203)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-1"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-cx"></a> `cx` | `number` | - | - | [scene.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L205) |
| <a id="property-cy"></a> `cy` | `number` | - | - | [scene.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L206) |
| <a id="property-datum-1"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit-1"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-1"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-1"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-1"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-1"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-1"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-1"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-r"></a> `r` | `number` | - | - | [scene.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L207) |
| <a id="property-shapetype-1"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-1"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-1"></a> `type` | `"circle"` | - | - | [scene.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L204) |
| <a id="property-z-1"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="drawoptions"></a>

### DrawOptions

Defined in: [Renderer.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L23)

DrawOptions
Per-frame options for a drawScene call. A duration of 0 (or omitted) commits
immediately; a positive duration animates from the previous scene.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-duration"></a> `duration?` | `number` | - | [Renderer.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L24) |
| <a id="property-ease"></a> `ease?` | (`t`: `number`) => `number` | Easing function mapping normalized time [0,1] → [0,1]; shared by both backends. | [Renderer.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L26) |
| <a id="property-onend"></a> `onEnd?` | () => `void` | - | [Renderer.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L29) |
| <a id="property-onframe"></a> `onFrame?` | (`t`: `number`) => `void` | Called on each committed frame (Canvas) or transition tick (SVG). | [Renderer.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L28) |

***

<a id="fontspec"></a>

### FontSpec

Defined in: [scene.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L98)

FontSpec
Resolved font metrics for a TextNode. Text is laid out (wrapped, positioned)
during scene construction, so backends only paint pre-computed lines.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-anchor"></a> `anchor?` | `"start"` \| `"middle"` \| `"end"` | - | [scene.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L103) |
| <a id="property-baseline-1"></a> `baseline?` | `"middle"` \| `"alphabetic"` \| `"hanging"` | - | [scene.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L104) |
| <a id="property-dir"></a> `dir?` | `"ltr"` \| `"rtl"` | Writing direction; SVG maps this to the `dir` attribute. | [scene.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L106) |
| <a id="property-family"></a> `family?` | `string` | - | [scene.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L99) |
| <a id="property-size"></a> `size?` | `number` | - | [scene.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L100) |
| <a id="property-style"></a> `style?` | [`FontStyle`](#fontstyle) | - | [scene.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L102) |
| <a id="property-weight"></a> `weight?` | `string` \| `number` | - | [scene.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L101) |

***

<a id="groupdiff"></a>

### GroupDiff

Defined in: [animate/diff.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L10)

GroupDiff
The result of matching two child lists by key: nodes to add (enter), nodes
present in both (update, as [previous, next] pairs), and nodes to remove (exit).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-enter"></a> `enter` | [`SceneNode`](#scenenode)[] | [animate/diff.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L11) |
| <a id="property-exit"></a> `exit` | [`SceneNode`](#scenenode)[] | [animate/diff.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L13) |
| <a id="property-update"></a> `update` | \[[`SceneNode`](#scenenode), [`SceneNode`](#scenenode)\][] | [animate/diff.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/render/src/animate/diff.ts#L12) |

***

<a id="groupnode"></a>

### GroupNode

Defined in: [scene.ts:294](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L294)

A transform/clip container; mirrors the nested <g> structure of the SVG output.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-2"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-children"></a> `children` | [`SceneNode`](#scenenode)[] | - | - | [scene.ts:296](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L296) |
| <a id="property-clip"></a> `clip?` | [`ClipShape`](#clipshape) | - | - | [scene.ts:297](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L297) |
| <a id="property-datum-2"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit-2"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-2"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-2"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-2"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-2"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-2"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-2"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-2"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-2"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-2"></a> `type` | `"group"` | - | - | [scene.ts:295](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L295) |
| <a id="property-z-2"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="htmloverlaynode"></a>

### HtmlOverlayNode

Defined in: [scene.ts:319](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L319)

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
| <a id="property-aria-3"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-classname"></a> `className?` | `string` | Optional CSS class names applied to the host <div>. | - | [scene.ts:332](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L332) |
| <a id="property-datum-3"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-events"></a> `events?` | `Record`\<`string`, `Partial`\<`Record`\<`string`, (`e`: `Event`) => `void`\>\>\> | Declarative event wiring — a record of CSS-selector → event-name → handler. The renderer attaches one listener per (selector, event) pair and dispatches by `event.target.closest(selector)` matching. Prefer this over `onMount` for click/hover/keyboard wiring: the declarative form is serializable, survives scene snapshots, and keeps closures off the scene primitive. Example: events: { ".zoom-in": {click: e => viz.zoomIn()}, ".zoom-out": {click: e => viz.zoomOut()}, } | - | [scene.ts:349](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L349) |
| <a id="property-height"></a> `height?` | `number` | Optional explicit height (defaults to content-driven). | - | [scene.ts:328](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L328) |
| <a id="property-hit-3"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-html"></a> `html` | `string` | Raw HTML (innerHTML) for the overlay. Caller is responsible for sanitization. | - | [scene.ts:330](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L330) |
| <a id="property-id-3"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-3"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-3"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-3"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-3"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-onmount"></a> `onMount?` | (`el`: `HTMLDivElement`) => `void` | Optional callback fired ONCE after the overlay's host `<div>` is first created — AFTER `innerHTML` / `style` / `dimensions` are written so the consumer can `host.querySelector(...)` inside the callback. Prefer `events` over `onMount` when possible; this is the escape hatch for non-event setup (e.g. instantiating a third-party widget on the host element). | - | [scene.ts:361](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L361) |
| <a id="property-onupdate"></a> `onUpdate?` | (`el`: `HTMLDivElement`) => `void` | Optional callback fired on EVERY draw (including the first). Mirror of `onMount` for state that must reflect each render's data — typically reading `node.html` is enough and you don't need this. Use when listeners must rebind because their closures captured stale-by-design state. | - | [scene.ts:370](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L370) |
| <a id="property-paint-3"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-3"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-style-1"></a> `style?` | `Record`\<`string`, `string` \| `number`\> | Optional inline-style key/value record applied to the host <div>. | - | [scene.ts:334](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L334) |
| <a id="property-transform-3"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-3"></a> `type` | `"htmlOverlay"` | - | - | [scene.ts:320](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L320) |
| <a id="property-width"></a> `width?` | `number` | Optional explicit width (defaults to content-driven). | - | [scene.ts:326](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L326) |
| <a id="property-x"></a> `x` | `number` | Top-left x position in scene coordinates. | - | [scene.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L322) |
| <a id="property-y"></a> `y` | `number` | Top-left y position in scene coordinates. | - | [scene.ts:324](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L324) |
| <a id="property-z-3"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="imagenode"></a>

### ImageNode

Defined in: [scene.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L229)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-4"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-datum-4"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-height-1"></a> `height` | `number` | - | - | [scene.ts:234](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L234) |
| <a id="property-hit-4"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-href"></a> `href` | `string` | - | - | [scene.ts:235](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L235) |
| <a id="property-id-4"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-4"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-4"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-4"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-4"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-4"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-4"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-4"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-4"></a> `type` | `"image"` | - | - | [scene.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L230) |
| <a id="property-width-1"></a> `width` | `number` | - | - | [scene.ts:233](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L233) |
| <a id="property-x-1"></a> `x` | `number` | - | - | [scene.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L231) |
| <a id="property-y-1"></a> `y` | `number` | - | - | [scene.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L232) |
| <a id="property-z-4"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="linenode"></a>

### LineNode

Defined in: [scene.ts:210](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L210)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-5"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-curve-1"></a> `curve?` | `string` | - | - | [scene.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L213) |
| <a id="property-datum-5"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit-5"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-5"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-5"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-5"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-5"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-5"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-5"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-points"></a> `points` | \[`number`, `number`\][] | - | - | [scene.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L212) |
| <a id="property-shapetype-5"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-5"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-5"></a> `type` | `"line"` | - | - | [scene.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L211) |
| <a id="property-z-5"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="nodebase"></a>

### NodeBase

Defined in: [scene.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L157)

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
| <a id="property-aria-6"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-datum-6"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit-6"></a> `hit?` | [`HitShape`](#hitshape) | - | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-6"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-6"></a> `index?` | `number` | - | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-6"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-6"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-6"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-6"></a> `paint?` | [`Paint`](#paint) | - | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-6"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-6"></a> `transform?` | [`Transform`](#transform) | - | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-z-6"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

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

Defined in: [scene.ts:224](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L224)

Pre-serialized SVG path data (the Path shape, Geomap, d3-geo output).

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-7"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-d"></a> `d` | `string` | - | - | [scene.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L226) |
| <a id="property-datum-7"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-hit-7"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-7"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-7"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-7"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-7"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-7"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-7"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-7"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-7"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-6"></a> `type` | `"path"` | - | - | [scene.ts:225](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L225) |
| <a id="property-z-7"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="pickresult"></a>

### PickResult

Defined in: [Renderer.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L47)

PickResult
The outcome of a hit-test: the topmost interactive node at a point.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-datum-8"></a> `datum?` | `DataPoint` | [Renderer.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L49) |
| <a id="property-index-8"></a> `index?` | `number` | [Renderer.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L50) |
| <a id="property-node"></a> `node` | [`SceneNode`](#scenenode) | [Renderer.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L48) |

***

<a id="rectnode"></a>

### RectNode

Defined in: [scene.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L193)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-8"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-datum-9"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-height-2"></a> `height` | `number` | - | - | [scene.ts:198](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L198) |
| <a id="property-hit-8"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-8"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-9"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-8"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-8"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-8"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-paint-8"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-rx"></a> `rx?` | `number` | - | - | [scene.ts:199](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L199) |
| <a id="property-ry"></a> `ry?` | `number` | - | - | [scene.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L200) |
| <a id="property-shapetype-8"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-8"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-7"></a> `type` | `"rect"` | - | - | [scene.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L194) |
| <a id="property-width-2"></a> `width` | `number` | - | - | [scene.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L197) |
| <a id="property-x-2"></a> `x` | `number` | - | - | [scene.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L195) |
| <a id="property-y-2"></a> `y` | `number` | - | - | [scene.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L196) |
| <a id="property-z-8"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="renderer"></a>

### Renderer

Defined in: [Renderer.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L89)

Renderer
The pluggable backend contract. Chart logic emits a Scene; a Renderer realizes
it. The same Scene must produce equivalent output and equivalent pick() results
across backends — that equivalence is the parity guarantee of the architecture.

#### Methods

<a id="destroy-2"></a>

##### destroy()

> **destroy**(): `void`

Defined in: [Renderer.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L129)

Tear down listeners, observers, and the drawing surface.

###### Returns

`void`

<a id="drawscene-2"></a>

##### drawScene()

> **drawScene**(`scene`: [`Scene`](#scene), `opts?`: [`DrawOptions`](#drawoptions)): [`RenderHandle`](#renderhandle)

Defined in: [Renderer.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L114)

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

Defined in: [Renderer.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L93)

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

Defined in: [Renderer.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L120)

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

Defined in: [Renderer.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L117)

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

Defined in: [Renderer.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L96)

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

Defined in: [Renderer.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L108)

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

Defined in: [Renderer.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L126)

Rasterize the current surface to a canvas element.

###### Returns

`HTMLCanvasElement`

<a id="tosvgstring-2"></a>

##### toSVGString()?

> `optional` **toSVGString**(): `string`

Defined in: [Renderer.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L123)

Serialize the current scene to an SVG string (Canvas backends re-render via SVG).

###### Returns

`string`

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind-2"></a> `kind` | `readonly` | [`RendererKind`](#rendererkind) | [Renderer.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L90) |

***

<a id="renderhandle"></a>

### RenderHandle

Defined in: [Renderer.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L37)

RenderHandle
The result of a drawScene call. `finished` resolves when any animation completes,
letting callers (e.g. Viz.render) await a stable, painted state.

#### Methods

<a id="cancel"></a>

##### cancel()

> **cancel**(): `void`

Defined in: [Renderer.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L40)

Abort an in-flight animation, leaving the surface at its current frame.

###### Returns

`void`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-finished"></a> `finished` | `Promise`\<`void`\> | [Renderer.ts:38](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L38) |

***

<a id="rendertarget"></a>

### RenderTarget

Defined in: [Renderer.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L10)

RenderTarget
Describes where a renderer should mount. The container is renderer-agnostic
(a plain element); the backend creates its own <svg> or <canvas> inside it.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-container"></a> `container` | `Element` | - | [Renderer.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L11) |
| <a id="property-height-3"></a> `height` | `number` | - | [Renderer.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L13) |
| <a id="property-pixelratio"></a> `pixelRatio?` | `number` | Device pixel ratio for HiDPI canvas rendering; defaults to window.devicePixelRatio. | [Renderer.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L15) |
| <a id="property-width-3"></a> `width` | `number` | - | [Renderer.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L12) |

***

<a id="scene"></a>

### Scene

Defined in: [scene.ts:394](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L394)

Scene
A complete, backend-agnostic description of one frame of a visualization.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-height-4"></a> `height` | `number` | - | [scene.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L397) |
| <a id="property-meta"></a> `meta?` | `object` | - | [scene.ts:398](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L398) |
| `meta.background?` | `string` | - | [scene.ts:399](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L399) |
| `meta.pixelRatio?` | `number` | Device pixel ratio hint for HiDPI canvas rendering. | [scene.ts:401](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L401) |
| <a id="property-root"></a> `root` | [`GroupNode`](#groupnode) | - | [scene.ts:395](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L395) |
| <a id="property-width-4"></a> `width` | `number` | - | [scene.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L396) |

***

<a id="sceneevent"></a>

### SceneEvent

Defined in: [Renderer.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L70)

SceneEvent
A backend-neutral pointer event, carrying the local point and the picked node
(if any), so interaction handling is decoupled from DOM event targets.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-nativeevent"></a> `nativeEvent` | `Event` | [Renderer.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L74) |
| <a id="property-pick"></a> `pick` | [`PickResult`](#pickresult) \| `null` | [Renderer.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L73) |
| <a id="property-point"></a> `point` | \[`number`, `number`\] | [Renderer.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L72) |
| <a id="property-type-8"></a> `type` | `string` | [Renderer.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L71) |

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
| <a id="property-from"></a> `from` | \[`number`, `number`\] | Start point in objectBoundingBox units (0–1). | [scene.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L65) |
| <a id="property-stops"></a> `stops` | `object`[] | Color stops; `offset` in 0–1, sorted ascending. | [scene.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L69) |
| <a id="property-to"></a> `to` | \[`number`, `number`\] | End point in objectBoundingBox units (0–1). | [scene.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L67) |
| <a id="property-type-9"></a> `type` | `"linear"` | - | [scene.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L63) |

***

<a id="textline"></a>

### TextLine

Defined in: [scene.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L239)

A single laid-out line of text within a TextNode.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runs"></a> `runs?` | [`TextRun`](#textrun)[] | Optional inline runs with style overrides (bold/italic from HTML markup). | [scene.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L245) |
| <a id="property-text"></a> `text` | `string` | - | [scene.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L240) |
| <a id="property-width-5"></a> `width` | `number` | - | [scene.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L243) |
| <a id="property-x-3"></a> `x` | `number` | - | [scene.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L241) |
| <a id="property-y-3"></a> `y` | `number` | - | [scene.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L242) |

***

<a id="textnode"></a>

### TextNode

Defined in: [scene.ts:248](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L248)

NodeBase
Fields shared by every scene node.

#### Extends

- [`NodeBase`](#nodebase)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aria-9"></a> `aria?` | [`AriaSpec`](#ariaspec) | - | [`NodeBase`](#nodebase).[`aria`](#property-aria-6) | [scene.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L188) |
| <a id="property-datum-10"></a> `datum?` | `DataPoint` | The original (unwrapped) datum, carried for interaction callbacks — not for drawing. | [`NodeBase`](#nodebase).[`datum`](#property-datum-6) | [scene.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L167) |
| <a id="property-font"></a> `font` | [`FontSpec`](#fontspec) | - | - | [scene.ts:254](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L254) |
| <a id="property-height-5"></a> `height?` | `number` | - | - | [scene.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L261) |
| <a id="property-hit-9"></a> `hit?` | [`HitShape`](#hitshape) | - | [`NodeBase`](#nodebase).[`hit`](#property-hit-6) | [scene.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L187) |
| <a id="property-id-9"></a> `id?` | `string` | An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct from `key` (a renderer-only identity for diffing) so callers can address a mounted element from outside the scene graph. | [`NodeBase`](#nodebase).[`id`](#property-id-6) | [scene.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L165) |
| <a id="property-index-10"></a> `index?` | `number` | - | [`NodeBase`](#nodebase).[`index`](#property-index-6) | [scene.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L168) |
| <a id="property-interactiongroup-9"></a> `interactionGroup?` | `string` | The chart-level interactive component this node belongs to ("legend"), stamped by Viz.toScene so the pointer bridge can route component-scoped handlers on every backend — including Canvas, where there is no per-shape DOM to walk. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`interactionGroup`](#property-interactiongroup-6) | [scene.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L182) |
| <a id="property-interactive-9"></a> `interactive?` | `boolean` | When false, the node is ignored by hit-testing (= SVG pointer-events: none). | [`NodeBase`](#nodebase).[`interactive`](#property-interactive-6) | [scene.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L186) |
| <a id="property-key-9"></a> `key` | `string` \| `number` | Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). | [`NodeBase`](#nodebase).[`key`](#property-key-6) | [scene.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L159) |
| <a id="property-lines"></a> `lines` | [`TextLine`](#textline)[] | Pre-wrapped, pre-positioned lines — backends do not re-measure or re-wrap. | - | [scene.ts:253](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L253) |
| <a id="property-paint-9"></a> `paint?` | [`Paint`](#paint) | - | [`NodeBase`](#nodebase).[`paint`](#property-paint-6) | [scene.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L183) |
| <a id="property-shapetype-9"></a> `shapeType?` | `string` | The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …), carried so pointer handlers can route shape-class-scoped events (`"click.Bar"`) without reconstructing the source shape. Interaction metadata only — backends never read it for drawing. | [`NodeBase`](#nodebase).[`shapeType`](#property-shapetype-6) | [scene.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L175) |
| <a id="property-transform-9"></a> `transform?` | [`Transform`](#transform) | - | [`NodeBase`](#nodebase).[`transform`](#property-transform-6) | [scene.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L184) |
| <a id="property-type-10"></a> `type` | `"text"` | - | - | [scene.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L249) |
| <a id="property-width-6"></a> `width?` | `number` | Layout box width/height (the wrap box the lines were positioned in). Used only as a fallback to center a font-size transition's scale when a node has no laid-out lines. | - | [scene.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L260) |
| <a id="property-x-4"></a> `x` | `number` | - | - | [scene.ts:250](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L250) |
| <a id="property-y-4"></a> `y` | `number` | - | - | [scene.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L251) |
| <a id="property-z-9"></a> `z?` | `number` | Z-order within the parent group; stable sort key replacing DOM append order. | [`NodeBase`](#nodebase).[`z`](#property-z-6) | [scene.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L190) |

***

<a id="textrun"></a>

### TextRun

Defined in: [scene.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L115)

TextRun
An inline span within a TextLine with optional per-run style overrides
(e.g. bold/italic produced by HTML markup in TextBox). Backends emit
nested <tspan>s for SVG or weight-aware paints for Canvas.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-style-2"></a> `style?` | `object` | [scene.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L117) |
| `style.style?` | [`FontStyle`](#fontstyle) | [scene.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L119) |
| `style.weight?` | `string` \| `number` | [scene.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L118) |
| <a id="property-text-1"></a> `text` | `string` | [scene.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L116) |

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

Defined in: [scene.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L128)

***

<a id="curvename"></a>

### CurveName

> **CurveName** = `string`

Defined in: [scene.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L9)

***

<a id="fontstyle"></a>

### FontStyle

> **FontStyle** = `"normal"` \| `"italic"`

Defined in: [scene.ts:91](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L91)

***

<a id="hitshape"></a>

### HitShape

> **HitShape** = \{ `height`: `number`; `type`: `"rect"`; `width`: `number`; `x`: `number`; `y`: `number`; \} \| \{ `cx`: `number`; `cy`: `number`; `r`: `number`; `type`: `"circle"`; \} \| \{ `d`: `string`; `type`: `"path"`; \}

Defined in: [scene.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L137)

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

Defined in: [Renderer.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L81)

***

<a id="sceneeventtype"></a>

### SceneEventType

> **SceneEventType** = `"click"` \| `"dblclick"` \| `"contextmenu"` \| `"mouseenter"` \| `"mouseleave"` \| `"mousemove"`

Defined in: [Renderer.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/render/src/Renderer.ts#L57)

***

<a id="scenenode"></a>

### SceneNode

> **SceneNode** = [`RectNode`](#rectnode) \| [`CircleNode`](#circlenode) \| [`LineNode`](#linenode) \| [`AreaNode`](#areanode) \| [`PathNode`](#pathnode) \| [`ImageNode`](#imagenode) \| [`TextNode`](#textnode) \| [`GroupNode`](#groupnode) \| [`HtmlOverlayNode`](#htmloverlaynode)

Defined in: [scene.ts:379](https://github.com/d3plus/d3plus/blob/main/packages/render/src/scene.ts#L379)
