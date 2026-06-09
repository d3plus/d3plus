# @d3plus/core

[![NPM version](https://img.shields.io/npm/v/@d3plus/core.svg)](https://www.npmjs.com/package/@d3plus/core)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=core)](https://codecov.io/gh/d3plus/d3plus/flags)

Data visualization made easy. A javascript library that extends the popular D3.js to enable fast and beautiful visualizations.

## Installing

If using npm, `npm install @d3plus/core`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/core).

```js
import {*} from "@d3plus/core";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/core"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Charts | Description |
| --- | --- |
| [`applyGeomapLayout`](#applygeomaplayout) |  |
| [`applyMatrixLayout`](#applymatrixlayout) |  |
| [`applyNetworkLayout`](#applynetworklayout) |  |
| [`applyPackLayout`](#applypacklayout) |  |
| [`applyPieLayout`](#applypielayout) |  |
| [`applyPriestleyLayout`](#applypriestleylayout) |  |
| [`applyRadarLayout`](#applyradarlayout) |  |
| [`applyRadialMatrixLayout`](#applyradialmatrixlayout) |  |
| [`applyRingsLayout`](#applyringslayout) |  |
| [`applySankeyLayout`](#applysankeylayout) |  |
| [`applyTreeLayout`](#applytreelayout) |  |
| [`applyTreemapLayout`](#applytreemaplayout) |  |
| [`AreaPlot`](#areaplot) | Creates an area plot based on an array of data. |
| [`backFeature`](#backfeature) | Converts `drawBack.ts` to a FeatureModule. Visible only when there are |
| [`BarChart`](#barchart) | Creates a bar chart based on an array of data. |
| [`BoxWhisker`](#boxwhisker) | Creates a simple box and whisker based on an array of data. |
| [`BumpChart`](#bumpchart) | Creates a bump chart based on an array of data. |
| [`colorScaleFeature`](#colorscalefeature) | Converts `drawColorScale.ts` to a FeatureModule. |
| [`Donut`](#donut) | Extends the Pie visualization to create a donut chart. |
| [`Geomap`](#geomap) | Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate  |
| [`geomapDef`](#geomapdef) |  |
| [`legendFeature`](#legendfeature) | Converts `drawLegend.ts` to a FeatureModule. |
| [`LinePlot`](#lineplot) | Creates a line plot based on an array of data. |
| [`Matrix`](#matrix) | Creates a simple rows/columns Matrix view of any dataset. |
| [`matrixDef`](#matrixdef) |  |
| [`Network`](#network) | Creates a network visualization based on a defined set of nodes and edges. |
| [`networkDef`](#networkdef) |  |
| [`Pack`](#pack) | Uses the d3 pack layout to create a Circle Packing chart based on an array of data. |
| [`packDef`](#packdef) |  |
| [`Pie`](#pie) | Uses the d3 pie layout to create SVG arcs based on an array of data. |
| [`pieDef`](#piedef) |  |
| [`Priestley`](#priestley) | Creates a Priestley timeline based on an array of data. |
| [`priestleyDef`](#priestleydef) |  |
| [`Radar`](#radar) | Creates a radar visualization based on an array of data. |
| [`radarDef`](#radardef) |  |
| [`RadialMatrix`](#radialmatrix) | Creates a radial layout of a rows/columns Matrix of any dataset. |
| [`radialMatrixDef`](#radialmatrixdef) |  |
| [`Rings`](#rings) | Creates a ring visualization based on a defined set of nodes and edges. |
| [`ringsDef`](#ringsdef) |  |
| [`Sankey`](#sankey) | Creates a Sankey visualization based on a defined set of nodes and links. |
| [`sankeyDef`](#sankeydef) |  |
| [`StackedArea`](#stackedarea) | Creates a stacked area plot based on an array of data. |
| [`subtitleFeature`](#subtitlefeature) | Converts `drawSubtitle.ts` to a FeatureModule. Mirrors titleFeature. |
| [`timelineFeature`](#timelinefeature) | Converts `drawTimeline.ts` to a FeatureModule. |
| [`titleFeature`](#titlefeature) | Title as a FeatureModule. Uses `_titleClass._textData()` for height |
| [`totalFeature`](#totalfeature) | Converts `drawTotal.ts` to a FeatureModule. Slightly different from title/ |
| [`Tree`](#tree) | Uses d3's tree layout to create a tidy tree chart based on an array of data. |
| [`treeDef`](#treedef) |  |
| [`Treemap`](#treemap) | Uses the d3 treemap layout to create SVG rectangles based on an array of data. |
| [`treemapDef`](#treemapdef) |  |

| Classes | Description |
| --- | --- |
| [`Area`](#area) | Creates SVG areas based on an array of data. |
| [`Axis`](#axis) | Creates an SVG scale based on an array of data. |
| [`AxisBottom`](#axisbottom) | Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functional |
| [`AxisLeft`](#axisleft) | Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all fun |
| [`AxisRight`](#axisright) | Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all fu |
| [`AxisTop`](#axistop) | Shorthand method for creating an axis where the ticks are drawn above the vertical domain path. Extends all functionalit |
| [`Bar`](#bar) | Creates SVG areas based on an array of data. |
| [`BaseClass`](#baseclass) | Provides shared configuration, event handling, and locale management inherited by all d3plus classes. |
| [`Box`](#box) | Creates SVG box based on an array of data. |
| [`Circle`](#circle) | Creates SVG circles based on an array of data. |
| [`ColorScale`](#colorscale) | Creates an SVG color scale based on an array of data. |
| [`Image`](#image) | Creates SVG images based on an array of data. |
| [`Legend`](#legend) | Creates an SVG legend based on an array of data. |
| [`Line`](#line) | Creates SVG lines based on an array of data. |
| [`Path`](#path) | Creates SVG Paths based on an array of data. |
| [`Plot`](#plot) | Creates an x/y plot based on an array of data. |
| [`Rect`](#rect) | Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-st |
| [`Shape`](#shape) | An abstracted class for generating shapes. |
| [`TextBox`](#textbox) | Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-tex |
| [`Timeline`](#timeline) | Creates an interactive timeline brush component for selecting time periods within a visualization. |
| [`Tooltip`](#tooltip) | Creates HTML tooltips in the body of a webpage. |
| [`Viz`](#viz) | Creates an x/y plot based on an array of data. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-sta |
| [`Whisker`](#whisker) | Creates SVG whisker based on an array of data. |

| Functions | Description |
| --- | --- |
| [`accessor`](#accessor) | Wraps an object key in a simple accessor function. |
| [`computeAxisLayout`](#computeaxislayout) |  |
| [`configPrep`](#configprep) | Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you m |
| [`constant`](#constant) | Wraps non-function variables in a simple return function. |
| [`createFluent`](#createfluent) | Build a fluent instance from a config schema. Every field in the schema |
| [`installFluent`](#installfluent) | Class-instance variant: mixes generated accessors onto an existing `this`, |
| [`measureAxis`](#measureaxis) | The standalone axis layout pass. Accepts any object satisfying the |
| [`plotEmit`](#plotemit) | EMIT phase of plotPaint. Takes the `PlotMeasureResult` from |
| [`plotPaint`](#plotpaint) | Plot paint phase as a free function — orchestrates the axis render + |
| [`renderAxes`](#renderaxes) | Render the production axes and solve the final ranges/offsets. |
| [`resolveSpec`](#resolvespec) | Snapshot every config key from a viz instance into a frozen spec. |
| [`runLayout`](#runlayout) | Runs each feature's `layout` in order, accumulating margin claims so that |
| [`runStages`](#runstages) | Run a stage pipeline and accumulate the partial outputs into one context. |
| [`runVizPipeline`](#runvizpipeline) |  |
| [`vizDraw`](#vizdraw) |  |
| [`vizDrawPure`](#vizdrawpure) |  |
| [`vizPostThresholdCtx`](#vizpostthresholdctx) |  |
| [`vizPreDraw`](#vizpredraw) |  |
| [`vizPreDrawPure`](#vizpredrawpure) |  |

| Variables | Description |
| --- | --- |
| [`RESET`](#reset) | String constant used to reset an individual config property. |

| Interfaces | Description |
| --- | --- |
| [`AreaConfig`](#areaconfig) | Area-specific config (curve, defined, dual-edge x/y). |
| [`AxisConfig`](#axisconfig) |  |
| [`AxisLayout`](#axislayout) | Pure-function entry point for axis layout. Given a fully configured |
| [`AxisLayoutResult`](#axislayoutresult) | Result of `measureAxis()`. Holds layout artifacts the paint phase of |
| [`BarConfig`](#barconfig) | Bar-specific config (Rect + start/end coords). |
| [`BaseShapeConfig`](#baseshapeconfig) | Common props inherited from `Shape` — every shape subclass accepts |
| [`BoxConfig`](#boxconfig) | Box-specific config (whisker + median + outliers; subset of Shape). |
| [`CircleConfig`](#circleconfig) | Circle-specific config (radius). |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`ImageConfig`](#imageconfig) | Image-specific config (url + dimensions). |
| [`LineConfig`](#lineconfig) | Line-specific config (curve + defined). |
| [`Margin`](#margin) | Margin object with all four sides. |
| [`Padding`](#padding) | Padding object with all four sides. |
| [`PathConfig`](#pathconfig) | Path-specific config (raw SVG path d string or generator). |
| [`PlotMeasureResult`](#plotmeasureresult) | Result of the MEASURE phase of plotPaint. Captures everything the EMIT |
| [`PlotPaintContext`](#plotpaintcontext) | Cross-phase locals threaded from `Plot._draw` (and its extracted pipeline |
| [`RectConfig`](#rectconfig) | Rect-specific config (width + height on top of base). |
| [`ShapeLike`](#shapelike) | Structural minimum a Shape (or shape-like component: TextBox, Axis) |
| [`TooltipConfig`](#tooltipconfig) |  |
| [`VizContext`](#vizcontext) | The shape of every field vizPreDraw + vizDraw can populate. Currently |
| [`VizInstance`](#vizinstance) | The structural contract free functions read/write on a chart instance. |
| [`VizLike`](#vizlike) | Structural minimum a Viz instance must satisfy for these helpers to |
| [`VizPreDrawResult`](#vizpredrawresult) |  |
| [`VizRenderer`](#vizrenderer) | A Renderer instance — see @d3plus/render. |
| [`WhiskerConfig`](#whiskerconfig) | Whisker-specific config. |

| Type Aliases | Description |
| --- | --- |
| [`AnyShapeConfig`](#anyshapeconfig) | Union of every shape config — useful for code that composes |
| [`ConstOrAccessor`](#constoraccessor) | A value that can either be a function (called per-datum) or a literal |
| [`D3Selection`](#d3selection) | D3-style selection (loose — d3-selection's types are too generic to repeat here). |
| [`ResolvedSpec`](#resolvedspec) | All user-settable configuration keys on a chart, frozen. |
| [`StringOrAccessor`](#stringoraccessor) | A value that can be a function, a string key (wrapped in `accessor`), |

## Classes

<a id="area"></a>

### Area

Defined in: [shapes/Area.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L24)

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config"></a>

##### config()

###### Call Signature

> **config**(): [`AreaConfig`](#areaconfig-1)

Defined in: [shapes/Area.ts:264](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L264)

Narrowed `.config()` for Area. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`AreaConfig`](#areaconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`AreaConfig`](#areaconfig-1)\>): `this`

Defined in: [shapes/Area.ts:265](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L265)

Narrowed `.config()` for Area. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`AreaConfig`](#areaconfig-1)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

<a id="x"></a>

##### x()

###### Call Signature

> **x**(): `AccessorFn`

Defined in: [shapes/Area.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L188)

The x position accessor. Also sets x0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **x**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L189)

The x position accessor. Also sets x0 to the same value.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="x0"></a>

##### x0()

###### Call Signature

> **x0**(): `AccessorFn`

Defined in: [shapes/Area.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L200)

The x0 (left edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L201)

The x0 (left edge) position accessor for the area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="x1"></a>

##### x1()

###### Call Signature

> **x1**(): `AccessorFn` \| `null`

Defined in: [shapes/Area.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L212)

The x1 (right edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Area.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L213)

The x1 (right edge) position accessor for the area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` \| `null` |

###### Returns

`this`

<a id="y"></a>

##### y()

###### Call Signature

> **y**(): `AccessorFn`

Defined in: [shapes/Area.ts:225](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L225)

The y position accessor. Also sets y0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **y**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L226)

The y position accessor. Also sets y0 to the same value.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="y0"></a>

##### y0()

###### Call Signature

> **y0**(): `AccessorFn`

Defined in: [shapes/Area.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L237)

The y0 (top edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L238)

The y0 (top edge) position accessor for the area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="y1"></a>

##### y1()

###### Call Signature

> **y1**(): `AccessorFn` \| `null`

Defined in: [shapes/Area.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L249)

The y1 (bottom edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Area.ts:250](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L250)

The y1 (bottom edge) position accessor for the area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` \| `null` |

###### Returns

`this`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="axis"></a>

### Axis

Defined in: [components/Axis/Axis.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L66)

Creates an SVG scale based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Extended by

- [`AxisBottom`](#axisbottom)
- [`AxisLeft`](#axisleft)
- [`AxisRight`](#axisright)
- [`AxisTop`](#axistop)
- [`Timeline`](#timeline)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="config-1"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-1"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

<a id="gridconfig"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="labelrotation"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

<a id="locale-1"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="measure"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

<a id="on-1"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="orient"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

<a id="outerbounds"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

<a id="parent-1"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-1"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Axis/Axis.ts:316](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L316)

Renders the current Axis to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-1"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

<a id="shapeconfig-1"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="titleconfig"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="toscene-1"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Axis/Axis.ts:308](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L308)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

<a id="translate-1"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks"></a> `_availableTicks` | `unknown`[] | - | - | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_configdefault-1"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale"></a> `_d3Scale` | `any` | - | - | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative"></a> `_d3ScaleNegative` | `any` | - | - | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-1"></a> `_data` | `any`[] | - | - | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata"></a> `_gridLineData?` | `object`[] | - | - | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-1"></a> `_group` | `Selection` | - | - | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_labelrotation"></a> `_labelRotation` | `boolean` \| *required* | - | - | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | - | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin"></a> `_margin` | `Record`\<`string`, `number`\> | - | - | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_position"></a> `_position` | `object` | - | - | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-1"></a> `_select` | `Selection` | - | - | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape"></a> `_tickShape?` | `any` | - | - | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickunit"></a> `_tickUnit` | `number` | - | - | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass"></a> `_titleClass` | [`TextBox`](#textbox) | - | - | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-1"></a> `_transition` | `Transition`\<`BaseType`\> | - | - | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | - | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-1"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks"></a> `_visibleTicks` | `unknown`[] | - | - | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-1"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-1"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="axisbottom"></a>

### AxisBottom

Defined in: [components/Axis/AxisBottom.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisBottom.ts#L6)

Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig-1"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-2"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

<a id="data-2"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-1"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

<a id="labelrotation-1"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-2"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

<a id="measure-1"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-2"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

<a id="orient-1"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-1"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-2"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

<a id="render-2"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Axis/Axis.ts:316](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L316)

Renders the current Axis to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`render`](#render-1)

<a id="select-2"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

<a id="shapeconfig-2"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-1"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-2"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Axis/Axis.ts:308](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L308)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

###### Inherited from

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-2"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks-1"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_configdefault-2"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale-1"></a> `_d3Scale` | `any` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative-1"></a> `_d3ScaleNegative` | `any` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-2"></a> `_data` | `any`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata-1"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-2"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_labelrotation-1"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale-1"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin-1"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds-1"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_position-1"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-2"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape-1"></a> `_tickShape?` | `any` | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickunit-1"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass-1"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-2"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat-1"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-2"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks-1"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-2"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-2"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="axisleft"></a>

### AxisLeft

Defined in: [components/Axis/AxisLeft.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisLeft.ts#L6)

Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig-2"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-3"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

<a id="data-3"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-2"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

<a id="labelrotation-2"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-3"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

<a id="measure-2"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-3"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

<a id="orient-2"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-2"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-3"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

<a id="render-3"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Axis/Axis.ts:316](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L316)

Renders the current Axis to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`render`](#render-1)

<a id="select-3"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

<a id="shapeconfig-3"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-2"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-3"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Axis/Axis.ts:308](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L308)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

###### Inherited from

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-3"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks-2"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_configdefault-3"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale-2"></a> `_d3Scale` | `any` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative-2"></a> `_d3ScaleNegative` | `any` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-3"></a> `_data` | `any`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata-2"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-3"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_labelrotation-2"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale-2"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin-2"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds-2"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_position-2"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-3"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape-2"></a> `_tickShape?` | `any` | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickunit-2"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass-2"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-3"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat-2"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-3"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks-2"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-3"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-3"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="axisright"></a>

### AxisRight

Defined in: [components/Axis/AxisRight.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisRight.ts#L6)

Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig-3"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-4"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

<a id="data-4"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-3"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

<a id="labelrotation-3"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-4"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

<a id="measure-3"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-4"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

<a id="orient-3"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-3"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-4"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

<a id="render-4"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Axis/Axis.ts:316](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L316)

Renders the current Axis to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`render`](#render-1)

<a id="select-4"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

<a id="shapeconfig-4"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-3"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-4"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Axis/Axis.ts:308](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L308)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

###### Inherited from

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-4"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks-3"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_configdefault-4"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale-3"></a> `_d3Scale` | `any` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative-3"></a> `_d3ScaleNegative` | `any` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-4"></a> `_data` | `any`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata-3"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-4"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_labelrotation-3"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale-3"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin-3"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds-3"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_position-3"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-4"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape-3"></a> `_tickShape?` | `any` | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickunit-3"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass-3"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-4"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat-3"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-4"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks-3"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-4"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-4"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="axistop"></a>

### AxisTop

Defined in: [components/Axis/AxisTop.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisTop.ts#L6)

Shorthand method for creating an axis where the ticks are drawn above the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig-4"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-5"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

<a id="data-5"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-4"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

<a id="labelrotation-4"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-5"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

<a id="measure-4"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-5"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Axis`](#axis).[`on`](#on-1)

<a id="orient-4"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-4"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-5"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

<a id="render-5"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Axis/Axis.ts:316](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L316)

Renders the current Axis to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`render`](#render-1)

<a id="select-5"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

<a id="shapeconfig-5"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-4"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-5"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Axis/Axis.ts:308](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L308)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

###### Inherited from

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-5"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks-4"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_configdefault-5"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale-4"></a> `_d3Scale` | `any` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative-4"></a> `_d3ScaleNegative` | `any` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-5"></a> `_data` | `any`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata-4"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-5"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_labelrotation-4"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale-4"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin-4"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds-4"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_position-4"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-5"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape-4"></a> `_tickShape?` | `any` | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickunit-4"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass-4"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-5"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat-4"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-5"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks-4"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-5"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-5"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="bar"></a>

### Bar

Defined in: [shapes/Bar.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L20)

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: `DataPoint`[]): `DataPoint`[]

Defined in: [shapes/Shape.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L113)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `DataPoint`[] | The raw data array to filter. |

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-1"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-1"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-6"></a>

##### config()

###### Call Signature

> **config**(): [`BarConfig`](#barconfig-7)

Defined in: [shapes/Bar.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L206)

Narrowed `.config()` for Bar. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BarConfig`](#barconfig-7)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`BarConfig`](#barconfig-7)\>): `this`

Defined in: [shapes/Bar.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L207)

Narrowed `.config()` for Bar. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`BarConfig`](#barconfig-7)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data-6"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-1"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-1"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig-1"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-6"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on-6"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent-6"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render-6"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select-6"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig-6"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort-1"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-1"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene-6"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-6"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

<a id="x0-1"></a>

##### x0()

###### Call Signature

> **x0**(): `AccessorFn`

Defined in: [shapes/Bar.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L154)

The x0 (left edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Bar.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L155)

The x0 (left edge) position accessor for each bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="x1-1"></a>

##### x1()

###### Call Signature

> **x1**(): `AccessorFn` \| `null`

Defined in: [shapes/Bar.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L166)

The x1 (right edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Bar.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L167)

The x1 (right edge) position accessor for each bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` \| `null` |

###### Returns

`this`

<a id="y0-1"></a>

##### y0()

###### Call Signature

> **y0**(): `AccessorFn`

Defined in: [shapes/Bar.ts:179](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L179)

The y0 (top edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Bar.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L180)

The y0 (top edge) position accessor for each bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` |

###### Returns

`this`

<a id="y1-1"></a>

##### y1()

###### Call Signature

> **y1**(): `AccessorFn` \| `null`

Defined in: [shapes/Bar.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L191)

The y1 (bottom edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Bar.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L192)

The y1 (bottom edge) position accessor for each bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `number` \| `AccessorFn` \| `null` |

###### Returns

`this`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-1"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-1"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-6"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-6"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-1"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-1"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-6"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-1"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-1"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-1"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-1"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-6"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-1"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-1"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-6"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-1"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-6"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-6"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-6"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="baseclass"></a>

### BaseClass

Defined in: [utils/BaseClass.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L67)

Provides shared configuration, event handling, and locale management inherited by all d3plus classes.

#### Extended by

- [`Axis`](#axis)
- [`ColorScale`](#colorscale)
- [`Legend`](#legend)
- [`TextBox`](#textbox)
- [`Tooltip`](#tooltip-1)
- [`Box`](#box)
- [`Shape`](#shape-1)
- [`Whisker`](#whisker)

#### Methods

<a id="config-7"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

<a id="locale-7"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

<a id="on-7"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

<a id="parent-7"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

<a id="shapeconfig-7"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

<a id="translate-7"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-_configdefault-7"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_uuid-7"></a> `_uuid` | `string` | - | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-7"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-7"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="box"></a>

### Box

Defined in: [shapes/Box.ts:255](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L255)

Creates SVG box based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-2"></a>

##### active()

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Box.ts:412](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L412)

The active highlight state for all sub-shapes in this Box.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="config-8"></a>

##### config()

###### Call Signature

> **config**(): [`BoxConfig`](#boxconfig-1)

Defined in: [shapes/Box.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L504)

Narrowed `.config()` for Box. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BoxConfig`](#boxconfig-1)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BoxConfig`](#boxconfig-1)\>): `this`

Defined in: [shapes/Box.ts:505](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L505)

Narrowed `.config()` for Box. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`BoxConfig`](#boxconfig-1)\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-7"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Box.ts:425](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L425)

The data array used to create shapes.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Box.ts:426](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L426)

The data array used to create shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="hover-2"></a>

##### hover()

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Box.ts:434](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L434)

The hover highlight state for all sub-shapes in this Box.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="locale-8"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="medianconfig"></a>

##### medianConfig()

###### Call Signature

> **medianConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Box.ts:447](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L447)

Configuration object for the median line.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **medianConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L448)

Configuration object for the median line.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="on-8"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="outlierconfig"></a>

##### outlierConfig()

###### Call Signature

> **outlierConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Box.ts:458](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L458)

Configuration object for each outlier point.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **outlierConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L459)

Configuration object for each outlier point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="parent-8"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="rectconfig"></a>

##### rectConfig()

###### Call Signature

> **rectConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Box.ts:469](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L469)

Configuration object for the rect shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L470)

Configuration object for the rect shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="render-7"></a>

##### render()

> **render**(): `this`

Defined in: [shapes/Box.ts:298](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L298)

Draws the Box.

###### Returns

`this`

<a id="select-7"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Box.ts:480](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L480)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Box.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L481)

The SVG container element for this visualization. 3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="shapeconfig-8"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-7"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Box.ts:391](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L391)

Compute-mode scene aggregation. When Box is rendered with
`renderMode("compute")`, the inner Rect/Whisker/Circle/etc.
shapes are mounted scene-only (no parent <g>); their `toScene()`
methods produce GroupNodes that we wrap into a single Box-level
group so collectComputed(boxInstance) yields the union.

###### Returns

`GroupNode`

<a id="translate-8"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

<a id="whiskerconfig"></a>

##### whiskerConfig()

###### Call Signature

> **whiskerConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Box.ts:491](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L491)

Configuration object for the whisker.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **whiskerConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:492](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L492)

Configuration object for the whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_box"></a> `_box` | [`Rect`](#rect) | - | - | [shapes/Box.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L262) |
| <a id="property-_configdefault-8"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-7"></a> `_data` | `DataPoint`[] | - | - | [shapes/Box.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L260) |
| <a id="property-_median"></a> `_median` | [`Rect`](#rect) | - | - | [shapes/Box.ts:263](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L263) |
| <a id="property-_select-7"></a> `_select` | `Selection` | - | - | [shapes/Box.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L261) |
| <a id="property-_uuid-8"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_whisker"></a> `_whisker` | [`Whisker`](#whisker) | - | - | [shapes/Box.ts:264](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L264) |
| <a id="property-_whiskerendpoint"></a> `_whiskerEndpoint` | ([`Rect`](#rect) \| [`Circle`](#circle))[] | - | - | [shapes/Box.ts:265](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L265) |
| <a id="property-ctx-8"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-8"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="circle"></a>

### Circle

Defined in: [shapes/Circle.ts:19](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L19)

Creates SVG circles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-1"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: `DataPoint`[]): `DataPoint`[]

Defined in: [shapes/Shape.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L113)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `DataPoint`[] | The raw data array to filter. |

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-3"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-2"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-9"></a>

##### config()

###### Call Signature

> **config**(): [`CircleConfig`](#circleconfig-1)

Defined in: [shapes/Circle.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L77)

Narrowed `.config()` for Circle. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`CircleConfig`](#circleconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`CircleConfig`](#circleconfig-1)\>): `this`

Defined in: [shapes/Circle.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L78)

Narrowed `.config()` for Circle. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`CircleConfig`](#circleconfig-1)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data-8"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-3"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-2"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig-2"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-9"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on-9"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent-9"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render-8"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select-8"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig-9"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort-2"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-2"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene-8"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-9"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-2"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-2"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-9"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-8"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-2"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-2"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-7"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-2"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-2"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-2"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-2"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-8"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-2"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-2"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-7"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-2"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-9"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-9"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-9"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="colorscale"></a>

### ColorScale

Defined in: [components/ColorScale/ColorScale.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L59)

Creates an SVG color scale based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="axisconfig-1"></a>

##### axisConfig()

###### Call Signature

> **axisConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/ColorScale/ColorScale.ts:293](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L293)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **axisConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:294](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L294)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="config-10"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-9"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [components/ColorScale/ColorScale.ts:304](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L304)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/ColorScale/ColorScale.ts:305](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L305)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="labelconfig-3"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/ColorScale/ColorScale.ts:313](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L313)

A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:314](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L314)

A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="labelmax"></a>

##### labelMax()

###### Call Signature

> **labelMax**(): `string` \| `undefined`

Defined in: [components/ColorScale/ColorScale.ts:333](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L333)

Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMax**(`_`: `string`): `this`

Defined in: [components/ColorScale/ColorScale.ts:334](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L334)

Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

<a id="labelmin"></a>

##### labelMin()

###### Call Signature

> **labelMin**(): `string` \| `undefined`

Defined in: [components/ColorScale/ColorScale.ts:324](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L324)

Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMin**(`_`: `string`): `this`

Defined in: [components/ColorScale/ColorScale.ts:325](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L325)

Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

<a id="legendconfig"></a>

##### legendConfig()

###### Call Signature

> **legendConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/ColorScale/ColorScale.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L342)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **legendConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:343](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L343)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-10"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-10"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="outerbounds-5"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/ColorScale/ColorScale.ts:355](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L355)

Returns the outer bounds of the ColorScale content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

<a id="parent-10"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="rectconfig-1"></a>

##### rectConfig()

###### Call Signature

> **rectConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/ColorScale/ColorScale.ts:362](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L362)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:363](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L363)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="render-9"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/ColorScale/ColorScale.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L174)

Renders the current ColorScale to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-9"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/ColorScale/ColorScale.ts:373](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L373)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: [components/ColorScale/ColorScale.ts:374](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L374)

The SVG container element for this visualization. 3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` |

###### Returns

`this`

<a id="shapeconfig-10"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-9"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/ColorScale/ColorScale.ts:244](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L244)

Produces a backend-agnostic scene graph for this ColorScale with no DOM
dependency. The discrete variant (jenks/buckets/quantile) delegates to the
internal Legend's toScene(); the gradient variant composes the Rect, Axis,
and label TextBox scenes. The scaleGroup's translate (set by the chart's
colorScale feature on `g.d3plus-viz-colorScale`) is read off `_select` so
the content lands at its on-screen position.

A smooth (non-bucketed) gradient paints its Rect with a `gradient:<json>`
fill token (see renderGradientStops); the backend materializes it into a
`<linearGradient>` (SVG) or a CanvasGradient (Canvas). Bucketed gradients
and the discrete variant use concrete per-bucket fills.

###### Returns

`GroupNode`

<a id="translate-10"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_axisclass"></a> `_axisClass` | [`Axis`](#axis) | - | - | [components/ColorScale/ColorScale.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L65) |
| <a id="property-_axistest"></a> `_axisTest` | [`Axis`](#axis) | - | - | [components/ColorScale/ColorScale.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L66) |
| <a id="property-_colorscale"></a> `_colorScale` | `any` | - | - | [components/ColorScale/ColorScale.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L68) |
| <a id="property-_configdefault-10"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-9"></a> `_data` | `DataPoint`[] | - | - | [components/ColorScale/ColorScale.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L69) |
| <a id="property-_gradientfill"></a> `_gradientFill?` | `string` | Smooth-gradient fill token (`gradient:<json>`), set by renderGradientStops. | - | [components/ColorScale/ColorScale.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L78) |
| <a id="property-_group-8"></a> `_group` | `Selection` | - | - | [components/ColorScale/ColorScale.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L70) |
| <a id="property-_labelclass-3"></a> `_labelClass` | [`TextBox`](#textbox) | - | - | [components/ColorScale/ColorScale.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L71) |
| <a id="property-_labelmax"></a> `_labelMax` | `string` \| *required* | - | - | [components/ColorScale/ColorScale.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L73) |
| <a id="property-_labelmin"></a> `_labelMin` | `string` \| *required* | - | - | [components/ColorScale/ColorScale.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L72) |
| <a id="property-_legendclass"></a> `_legendClass` | [`Legend`](#legend) | - | - | [components/ColorScale/ColorScale.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L74) |
| <a id="property-_outerbounds-5"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | [components/ColorScale/ColorScale.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L75) |
| <a id="property-_rectclass"></a> `_rectClass` | [`Rect`](#rect) | - | - | [components/ColorScale/ColorScale.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L76) |
| <a id="property-_select-9"></a> `_select` | `Selection` | - | - | [components/ColorScale/ColorScale.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L64) |
| <a id="property-_uuid-10"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-10"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-10"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="image"></a>

### Image

Defined in: [shapes/Image.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L39)

Creates SVG images based on an array of data.

#### Examples

```ts
var data = {"url": "file.png", "width": "100", "height": "50"};
```

```ts
new Image().data([data]).render();
```

```ts
<image class="d3plus-Image" opacity="1" href="file.png" width="100" height="50" x="0" y="0"></image>
```

```ts
image().data([data])();
```

```ts
image().data([data])(function() { alert("draw complete!"); })
```

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="data-10"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Image.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L156)

The data array used to create image shapes. An <image> tag will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Image.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L157)

The data array used to create image shapes. An <image> tag will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="render-10"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Image.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L61)

Renders the current Image to the page. If a *callback* is specified, it will be called once the images are done drawing.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-10"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Image.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L193)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Image.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L194)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="toscene-10"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Image.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L169)

Compute-mode scene emission. Mirrors Shape.toScene's shape — a
keyed GroupNode wrapping per-datum ImageNodes. Used by chart
compositors (Shape._backgroundImageClass, plotPaint) that need
Image to participate in the scene graph rather than emit
d3-selection DOM.

###### Returns

`GroupNode`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-_data-10"></a> `_data` | `DataPoint`[] | [shapes/Image.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L47) |
| <a id="property-_select-10"></a> `_select` | `Selection` | [shapes/Image.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L46) |
| <a id="property-schema-11"></a> `schema` | `Record`\<`string`, `any`\> | [shapes/Image.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L45) |

***

<a id="legend"></a>

### Legend

Defined in: [components/Legend/Legend.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L43)

Creates an SVG legend based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-4"></a>

##### active()

> **active**(`_`: `unknown`): `this`

Defined in: [components/Legend/Legend.ts:235](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L235)

The active method for all shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

<a id="config-11"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-11"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [components/Legend/Legend.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L245)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/Legend/Legend.ts:246](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L246)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="hover-4"></a>

##### hover()

> **hover**(`_`: `unknown`): `this`

Defined in: [components/Legend/Legend.ts:254](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L254)

The hover method for all shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

<a id="locale-11"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-11"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="outerbounds-6"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Legend/Legend.ts:266](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L266)

Returns the outer bounds of the legend content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

<a id="parent-11"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-11"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Legend/Legend.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L194)

Renders the current Legend to the page.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-11"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Legend/Legend.ts:273](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L273)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `any`): `this`

Defined in: [components/Legend/Legend.ts:275](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L275)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any` |

###### Returns

`this`

<a id="shapeconfig-11"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Legend/Legend.ts:289](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L289)

Methods that correspond to the key/value pairs for each shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Legend/Legend.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L290)

Methods that correspond to the key/value pairs for each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="titleconfig-5"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Legend/Legend.ts:300](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L300)

Title configuration of the legend.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Legend/Legend.ts:301](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L301)

Title configuration of the legend.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="toscene-11"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Legend/Legend.ts:136](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L136)

Produces a backend-agnostic scene graph for this legend with no DOM dependency:
the title is composed from its TextBox.toScene(), and each swatch group is
composed from the stored Shape instances' toScene() (positions resolve through
the x/y accessors against this._lineData / this._outerBounds).

###### Returns

`GroupNode`

<a id="translate-11"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_configdefault-11"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-11"></a> `_data` | `DataPoint`[] | - | - | [components/Legend/Legend.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L49) |
| <a id="property-_group-9"></a> `_group` | `Selection` | - | - | [components/Legend/Legend.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L55) |
| <a id="property-_linedata"></a> `_lineData` | `Record`\<`string`, `unknown`\>[] | - | - | [components/Legend/Legend.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L50) |
| <a id="property-_outerbounds-6"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | [components/Legend/Legend.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L51) |
| <a id="property-_rtl"></a> `_rtl` | `boolean` | - | - | [components/Legend/Legend.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L54) |
| <a id="property-_select-11"></a> `_select` | `Selection` | - | - | [components/Legend/Legend.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L52) |
| <a id="property-_shapegroup"></a> `_shapeGroup` | `Selection` | - | - | [components/Legend/Legend.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L57) |
| <a id="property-_shapes"></a> `_shapes` | `unknown`[] | - | - | [components/Legend/Legend.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L53) |
| <a id="property-_titleclass-5"></a> `_titleClass` | [`TextBox`](#textbox) | - | - | [components/Legend/Legend.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L48) |
| <a id="property-_titlegroup"></a> `_titleGroup` | `Selection` | - | - | [components/Legend/Legend.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L56) |
| <a id="property-_titleheight"></a> `_titleHeight` | `number` | - | - | [components/Legend/Legend.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L58) |
| <a id="property-_titlewidth"></a> `_titleWidth` | `number` | - | - | [components/Legend/Legend.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L59) |
| <a id="property-_uuid-11"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_wraplines"></a> `_wrapLines` | (() => `void`) \| *required* | - | - | [components/Legend/Legend.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L60) |
| <a id="property-_wraprows"></a> `_wrapRows` | (() => `void`) \| *required* | - | - | [components/Legend/Legend.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L61) |
| <a id="property-ctx-11"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-12"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="line"></a>

### Line

Defined in: [shapes/Line.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L26)

Creates SVG lines based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-5"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-3"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-12"></a>

##### config()

###### Call Signature

> **config**(): [`LineConfig`](#lineconfig-2)

Defined in: [shapes/Line.ts:152](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L152)

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`LineConfig`](#lineconfig-2)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`LineConfig`](#lineconfig-2)\>): `this`

Defined in: [shapes/Line.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L153)

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`LineConfig`](#lineconfig-2)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data-12"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-5"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-3"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig-4"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-12"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on-12"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent-12"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render-12"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select-12"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig-12"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort-3"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-3"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene-12"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-12"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-3"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-3"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-12"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-12"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-3"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-3"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-10"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-3"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-4"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-3"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-3"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-12"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-3"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-3"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-8"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-3"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-12"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-12"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-13"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="path"></a>

### Path

Defined in: [shapes/Path.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Path.ts#L18)

Creates SVG Paths based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-2"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: `DataPoint`[]): `DataPoint`[]

Defined in: [shapes/Shape.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L113)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `DataPoint`[] | The raw data array to filter. |

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-6"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-4"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-13"></a>

##### config()

###### Call Signature

> **config**(): [`PathConfig`](#pathconfig-1)

Defined in: [shapes/Path.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Path.ts#L72)

Narrowed `.config()` for Path. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`PathConfig`](#pathconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`PathConfig`](#pathconfig-1)\>): `this`

Defined in: [shapes/Path.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Path.ts#L73)

Narrowed `.config()` for Path. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`PathConfig`](#pathconfig-1)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data-13"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-6"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-4"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig-5"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-13"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on-13"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent-13"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render-13"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select-13"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig-13"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort-4"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-4"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene-13"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-13"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-4"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-4"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-13"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-13"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-4"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-4"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-11"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-4"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-5"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-4"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-4"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-13"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-4"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-4"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-9"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-4"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-13"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-13"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-14"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="plot"></a>

### Plot

Defined in: [charts/Plot/index.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L81)

Creates an x/y plot based on an array of data.

#### Extends

- [`Viz`](#viz)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_drawscenetotarget"></a>

##### \_drawSceneToTarget()

> **\_drawSceneToTarget**(`durationOverride?`: `number`): `void`

Defined in: [charts/viz/Viz.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L283)

Renders this chart through the @d3plus/render pluggable backends. Called
automatically by `render()`. The compute pass draws into `this._select`
(an auto-created svg INSIDE the user's target div) — that svg is the
off-stage detached compute svg. SvgRenderer mounts to the user's target
div (the parent), as a sibling to the detached compute svg. The compute
svg's children get cleared so only the scene output is visible.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `durationOverride?` | `number` |

###### Returns

`void`

###### Inherited from

[`Viz`](#viz).[`_drawSceneToTarget`](#_drawscenetotarget-1)

<a id="_paint"></a>

##### \_paint()

> **\_paint**(`pCtx`: [`PlotPaintContext`](#plotpaintcontext)): [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:319](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L319)

Paint phase: production axis rendering, shape buffer setup, and shape
emission with event handlers. Receives all cross-phase locals from
_draw via `pCtx` (so this method has zero coupling to _draw's local
scope beyond the explicit context).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `pCtx` | [`PlotPaintContext`](#plotpaintcontext) |

###### Returns

[`Plot`](#plot)

<a id="_schedulescenerepaint"></a>

##### \_scheduleSceneRepaint()

> **\_scheduleSceneRepaint**(): `void`

Defined in: [charts/viz/Viz.ts:443](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L443)

Coalesces interaction-driven scene repaints (hover/active dimming) into a
single paint per animation frame. A fast pointer sweep across a dense
chart fires a hover transition per shape crossed; painting each one
synchronously rebuilt the whole scene back-to-back, saturating the main
thread (~200ms stalls) so the tooltip couldn't reposition and appeared
stuck at its last spot. Only the latest hover state is visible, so the
intermediate paints are wasted — collapse them to one rAF-scheduled draw.

###### Returns

`void`

###### Inherited from

[`Viz`](#viz).[`_scheduleSceneRepaint`](#_schedulescenerepaint-1)

<a id="_wireplotshapeevents"></a>

##### \_wirePlotShapeEvents()

> **\_wirePlotShapeEvents**(`shape`: `object`, `shapeKey`: `string`, `events`: `string`[]): `void`

Defined in: [charts/Plot/index.ts:288](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L288)

Wires user-registered `on()` event handlers onto a freshly-configured
shape instance. Splits the registered events into three buckets:
global (`"click"`), shape-scoped (`"click.shape"`), and
shape-class-scoped (`"click.Bar"` etc.). All three forward into
`this.schema.on[event](d.data, d.i, x, event)`. Extracted from
Plot._paint so the chart-level event wiring is in one place.

On the scene path (SvgRenderer/CanvasRenderer) these d3-selection
bindings don't fire — compute-mode shapes mount no per-shape DOM.
Pointer events are instead routed by `Viz._drawSceneToTarget`'s
renderer bridge: it hit-tests via `Renderer.pick`, reads the picked
node's stamped `shapeType`, and dispatches the matching global,
`.shape`, and shape-class-scoped (`.Bar`) handlers — the same three
buckets this method wires, so SVG and Canvas behave identically.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `shape` | \{ `on`: `unknown`; \} |
| `shape.on` |
| `shapeKey` | `string` |
| `events` | `string`[] |

###### Returns

`void`

<a id="active-7"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L23)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`active`](#active-10)

<a id="aggs"></a>

##### aggs()

> **aggs**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L42)

Custom aggregation methods for each data key.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`aggs`](#aggs-1)

<a id="annotations"></a>

##### annotations()

> **annotations**(`_?`: `unknown`): [`Plot`](#plot) \| `unknown`[]

Defined in: [charts/Plot/index.ts:334](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L334)

Allows drawing custom shapes to be used as annotations in the provided x/y plot. This method accepts custom config objects for the [Shape](http://d3plus.org/docs/#Shape) class, either a single config object or an array of config objects. Each config object requires an additional parameter, the "shape", which denotes which [Shape](http://d3plus.org/docs/#Shape) sub-class to use ([Rect](http://d3plus.org/docs/#Rect), [Line](http://d3plus.org/docs/#Line), etc).

Additionally, each config object can also contain an optional "layer" key, which defines whether the annotations will be displayed in "front" or in "back" of the primary visualization shapes. This value defaults to "back" if not present.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `unknown` |

###### Returns

[`Plot`](#plot) \| `unknown`[]

<a id="attribution"></a>

##### attribution()

> **attribution**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L53)

Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`attribution`](#attribution-1)

<a id="attributionstyle"></a>

##### attributionStyle()

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L62)

Configuration object for the attribution style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`attributionStyle`](#attributionstyle-1)

<a id="axispersist"></a>

##### axisPersist()

> **axisPersist**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:343](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L343)

Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

<a id="backconfig"></a>

##### backConfig()

> **backConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L73)

Configuration object for the back button.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`backConfig`](#backconfig-1)

<a id="backgroundconfig"></a>

##### backgroundConfig()

> **backgroundConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:352](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L352)

A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="buffer"></a>

##### buffer()

> **buffer**(`_?`: `boolean` \| `Record`\<`string`, `boolean`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:364](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L364)

Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| `Record`\<`string`, `boolean`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="color"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L84)

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

[`Viz`](#viz).[`color`](#color-1)

<a id="colorscale-1"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L102)

Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

[`Viz`](#viz).[`colorScale`](#colorscale-2)

<a id="colorscaleconfig-1"></a>

##### colorScaleConfig()

> **colorScaleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L121)

A pass-through to the config method of ColorScale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`colorScaleConfig`](#colorscaleconfig-2)

<a id="colorscalemaxsize"></a>

##### colorScaleMaxSize()

> **colorScaleMaxSize**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L156)

The maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`colorScaleMaxSize`](#colorscalemaxsize-1)

<a id="colorscalepadding"></a>

##### colorScalePadding()

> **colorScalePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L132)

Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`colorScalePadding`](#colorscalepadding-1)

<a id="colorscaleposition"></a>

##### colorScalePosition()

> **colorScalePosition**(`_?`: `string` \| `boolean` \| (() => `string` \| `boolean`)): `string` \| `boolean` \| [`Plot`](#plot) \| (() => `string` \| `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L144)

Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| (() => `string` \| `boolean`) |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot) \| (() => `string` \| `boolean`)

###### Inherited from

[`Viz`](#viz).[`colorScalePosition`](#colorscaleposition-1)

<a id="confidence"></a>

##### confidence()

> **confidence**(`_?`: `unknown`): `false` \| [`Plot`](#plot) \| \[`number`, `number`\]

Defined in: [charts/Plot/index.ts:392](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L392)

The confidence interval as an array of [lower, upper] bounds.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `unknown` |

###### Returns

`false` \| [`Plot`](#plot) \| \[`number`, `number`\]

###### Example

```ts
var data = {id: "alpha", value: 10, lci: 9, hci: 11};
...
// Accessor functions
.confidence([function(d) { return d.lci }, function(d) { return d.hci }])

// Or static keys
.confidence(["lci", "hci"])
```

<a id="confidenceconfig"></a>

##### confidenceConfig()

> **confidenceConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:409](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L409)

Configuration object for shapes rendered as confidence intervals.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="data-14"></a>

##### data()

> **data**(`_?`: `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[]): [`Plot`](#plot) \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L174)

The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `_?` | `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \} | - |
| `f?` | (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[] | The data array or a URL string to load data from. |

###### Returns

[`Plot`](#plot) \| `DataPoint`[]

###### Inherited from

[`Viz`](#viz).[`data`](#data-20)

<a id="destroy"></a>

##### destroy()

> **destroy**(): `this`

Defined in: [charts/viz/Viz.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L459)

Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`destroy`](#destroy-1)

<a id="detectresize"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L202)

If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectResize`](#detectresize-1)

<a id="detectresizedelay"></a>

##### detectResizeDelay()

> **detectResizeDelay**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L211)

When resizing the browser window, this is the millisecond delay to trigger the resize event.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectResizeDelay`](#detectresizedelay-1)

<a id="detectvisible"></a>

##### detectVisible()

> **detectVisible**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L220)

Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectVisible`](#detectvisible-1)

<a id="detectvisibleinterval"></a>

##### detectVisibleInterval()

> **detectVisibleInterval**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L229)

The interval, in milliseconds, for checking if the visualization is visible on the page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectVisibleInterval`](#detectvisibleinterval-1)

<a id="discretecutoff"></a>

##### discreteCutoff()

> **discreteCutoff**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:418](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L418)

When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

<a id="downloadbutton"></a>

##### downloadButton()

> **downloadButton**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L240)

Shows a button that allows for downloading the current visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`downloadButton`](#downloadbutton-1)

<a id="downloadconfig"></a>

##### downloadConfig()

> **downloadConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L249)

Sets specific options of the saveElement function used when downloading the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`downloadConfig`](#downloadconfig-1)

<a id="downloadposition"></a>

##### downloadPosition()

> **downloadPosition**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L258)

Defines which control group to add the download button into.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`downloadPosition`](#downloadposition-1)

<a id="fontfamily"></a>

##### fontFamily()

> **fontFamily**(`_?`: `string` \| `string`[]): `string` \| [`Plot`](#plot) \| `string`[]

Defined in: [charts/viz/VizBaseConfig.ts:270](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L270)

The font family used throughout the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `string`[] |

###### Returns

`string` \| [`Plot`](#plot) \| `string`[]

###### Inherited from

[`Viz`](#viz).[`fontFamily`](#fontfamily-1)

<a id="groupby"></a>

##### groupBy()

> **groupBy**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) \| (`string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`))[]): [`Plot`](#plot) \| (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:303](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L303)

Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) \| (`string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`))[] |

###### Returns

[`Plot`](#plot) \| (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`[]

###### Inherited from

[`Viz`](#viz).[`groupBy`](#groupby-1)

<a id="grouppadding"></a>

##### groupPadding()

> **groupPadding**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:427](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L427)

The pixel space between groups of bars.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

<a id="hiddencolor"></a>

##### hiddenColor()

> **hiddenColor**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L342)

Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`hiddenColor`](#hiddencolor-1)

<a id="hiddenopacity"></a>

##### hiddenOpacity()

> **hiddenOpacity**(`_?`: `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `number` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBaseConfig.ts:353](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L353)

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`number` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

[`Viz`](#viz).[`hiddenOpacity`](#hiddenopacity-1)

<a id="hover-7"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `this`

Defined in: [charts/viz/VizBaseConfig.ts:365](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L365)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`hover`](#hover-10)

<a id="label"></a>

##### label()

> **label**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:409](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L409)

Accessor function or string key for the label of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`label`](#label-1)

<a id="labelconnectorconfig"></a>

##### labelConnectorConfig()

> **labelConnectorConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:436](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L436)

The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="labelposition"></a>

##### labelPosition()

> **labelPosition**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/Plot/index.ts:446](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L446)

The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

[`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

<a id="legend-1"></a>

##### legend()

> **legend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L420)

Whether to display the legend.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legend`](#legend-2)

<a id="legendconfig-2"></a>

##### legendConfig()

> **legendConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:436](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L436)

Configuration object passed to the legend's config method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`legendConfig`](#legendconfig-3)

<a id="legendfilterinvert"></a>

##### legendFilterInvert()

> **legendFilterInvert**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:445](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L445)

Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legendFilterInvert`](#legendfilterinvert-1)

<a id="legendpadding"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:457](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L457)

Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legendPadding`](#legendpadding-1)

<a id="legendposition"></a>

##### legendPosition()

> **legendPosition**(`_?`: `string` \| (() => `string`)): `string` \| [`Plot`](#plot) \| (() => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:469](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L469)

Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| (() => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| (() => `string`)

###### Inherited from

[`Viz`](#viz).[`legendPosition`](#legendposition-1)

<a id="legendtooltip"></a>

##### legendTooltip()

> **legendTooltip**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L481)

Configuration object for the legend tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`legendTooltip`](#legendtooltip-1)

<a id="linemarkerconfig"></a>

##### lineMarkerConfig()

> **lineMarkerConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L460)

Shape config for the Circle shapes drawn by the lineMarkers method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="linemarkers"></a>

##### lineMarkers()

> **lineMarkers**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:469](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L469)

Draws circle markers on each vertex of a Line.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

<a id="loadinghtml"></a>

##### loadingHTML()

> **loadingHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L23)

The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`viz`: `VizBase`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

###### Inherited from

[`Viz`](#viz).[`loadingHTML`](#loadinghtml-1)

<a id="loadingmessage"></a>

##### loadingMessage()

> **loadingMessage**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L34)

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`loadingMessage`](#loadingmessage-1)

<a id="messagemask"></a>

##### messageMask()

> **messageMask**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L43)

The color of the mask displayed underneath the status message when loading AJAX requests and displaying errors. Set to `false` to turn off the mask completely.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`messageMask`](#messagemask-1)

<a id="messagestyle"></a>

##### messageStyle()

> **messageStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L52)

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`messageStyle`](#messagestyle-1)

<a id="nodatahtml"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L61)

The inner HTML of the status message displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`viz`: `VizBase`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

###### Inherited from

[`Viz`](#viz).[`noDataHTML`](#nodatahtml-1)

<a id="nodatamessage"></a>

##### noDataMessage()

> **noDataMessage**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L72)

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`noDataMessage`](#nodatamessage-1)

<a id="render-14"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [charts/viz/Viz.ts:222](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L222)

Draws the visualization given the specified configuration.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`render`](#render-19)

<a id="renderer"></a>

##### renderer()

###### Call Signature

> **renderer**(): `"svg"` \| `"canvas"`

Defined in: [charts/viz/Viz.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L231)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Inherited from

[`Viz`](#viz).[`renderer`](#renderer-1)

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: [charts/viz/Viz.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L232)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` \| `"svg"` \| `"canvas"` |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`renderer`](#renderer-1)

<a id="rendermode"></a>

##### renderMode()

###### Call Signature

> **renderMode**(): `"full"` \| `"compute"`

Defined in: [charts/viz/Viz.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L245)

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Returns

`"full"` \| `"compute"`

###### Inherited from

[`Viz`](#viz).[`renderMode`](#rendermode-1)

###### Call Signature

> **renderMode**(`_`: `"full"` \| `"compute"`): `this`

Defined in: [charts/viz/Viz.ts:246](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L246)

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `"full"` \| `"compute"` |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`renderMode`](#rendermode-1)

<a id="renderscene"></a>

##### renderScene()

> **renderScene**(`target`: `Element`, `opts?`: `object`): `Promise`\<\{ `renderer`: `Renderer`; `scene`: `Scene`; \}\>

Defined in: [charts/viz/Viz.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L260)

Public entry point that renders this chart through the @d3plus/render
pluggable backends. The compute pass happens via render() (in an svg
auto-created inside the target div); SvgRenderer/CanvasRenderer paints
the scene to the target. Returns `{renderer, scene}` so callers can
interact with the renderer (e.g. for picking) or read the scene data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `Element` |
| `opts?` | \{ `kind?`: `"svg"` \| `"canvas"`; \} |
| `opts.kind?` | `"svg"` \| `"canvas"` |

###### Returns

`Promise`\<\{ `renderer`: `Renderer`; `scene`: `Scene`; \}\>

###### Inherited from

[`Viz`](#viz).[`renderScene`](#renderscene-1)

<a id="scrollcontainer"></a>

##### scrollContainer()

> **scrollContainer**(`_?`: `string` \| `HTMLElement` \| `Window`): `string` \| [`Plot`](#plot) \| `HTMLElement` \| `Window`

Defined in: [charts/viz/VizBase.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L81)

If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` \| `Window` |

###### Returns

`string` \| [`Plot`](#plot) \| `HTMLElement` \| `Window`

###### Inherited from

[`Viz`](#viz).[`scrollContainer`](#scrollcontainer-1)

<a id="select-14"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Plot`](#plot) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: [charts/viz/VizBase.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L92)

The SVG container element as a d3 selector or DOM element. Defaults to `undefined`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` |

###### Returns

[`Plot`](#plot) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

###### Inherited from

[`Viz`](#viz).[`select`](#select-19)

<a id="shape"></a>

##### shape()

> **shape**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L101)

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`shape`](#shape-2)

<a id="shapeconfig-14"></a>

##### shapeConfig()

> **shapeConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L112)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-21)

<a id="size"></a>

##### size()

> **size**(`_?`: `false` \| `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:480](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L480)

Sets the size of bubbles to the given Number, data key, or function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="stackoffset"></a>

##### stackOffset()

> **stackOffset**(`_?`: `string` \| ((`series`: `number`[][], `order`: `number`[]) => `void`)): [`Plot`](#plot) \| ((`series`: `number`[][], `order`: `number`[]) => `void`)

Defined in: [charts/Plot/index.ts:494](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L494)

Sets the stack offset. If *value* is not specified, returns the current stack offset function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`series`: `number`[][], `order`: `number`[]) => `void`) |

###### Returns

[`Plot`](#plot) \| ((`series`: `number`[][], `order`: `number`[]) => `void`)

<a id="stackorder"></a>

##### stackOrder()

> **stackOrder**(`_?`: `string` \| ((`series`: `number`[][]) => `number`[])): [`Plot`](#plot) \| ((`series`: `number`[][]) => `number`[])

Defined in: [charts/Plot/index.ts:511](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L511)

Sets the stack order. If *value* is not specified, returns the current stack order function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`series`: `number`[][]) => `number`[]) |

###### Returns

[`Plot`](#plot) \| ((`series`: `number`[][]) => `number`[])

<a id="subtitle"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L121)

Accessor function or string for the visualization's subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: `DataPoint`[]) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

###### Inherited from

[`Viz`](#viz).[`subtitle`](#subtitle-1)

<a id="subtitleconfig"></a>

##### subtitleConfig()

> **subtitleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L132)

Configuration object for the subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`subtitleConfig`](#subtitleconfig-1)

<a id="subtitlepadding"></a>

##### subtitlePadding()

> **subtitlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L141)

Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`subtitlePadding`](#subtitlepadding-1)

<a id="threshold"></a>

##### threshold()

> **threshold**(`_?`: `number` \| ((`data`: `DataPoint`[]) => `number`)): `number` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `number`)

Defined in: [charts/viz/VizBase.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L156)

The threshold value for bucketing small data points together.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`data`: `DataPoint`[]) => `number`) |

###### Returns

`number` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `number`)

###### Inherited from

[`Viz`](#viz).[`threshold`](#threshold-1)

<a id="thresholdkey"></a>

##### thresholdKey()

> **thresholdKey**(`key?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBase.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L173)

Accessor for the value used in the threshold algorithm.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) | The data key used to group values for thresholding. |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

[`Viz`](#viz).[`thresholdKey`](#thresholdkey-1)

<a id="thresholdname"></a>

##### thresholdName()

> **thresholdName**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L189)

The label displayed for bucketed threshold items.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`thresholdName`](#thresholdname-1)

<a id="time"></a>

##### time()

> **time**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBase.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L201)

Accessor function or string key for the time dimension of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

[`Viz`](#viz).[`time`](#time-1)

<a id="timelineconfig"></a>

##### timelineConfig()

> **timelineConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L249)

Configuration object for the timeline.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`timelineConfig`](#timelineconfig-2)

<a id="timelinedefault"></a>

##### timelineDefault()

> **timelineDefault**(`_?`: `string` \| `Date` \| (`string` \| `Date`)[]): [`Plot`](#plot) \| `Date`[]

Defined in: [charts/viz/VizBase.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L258)

The starting time or range for the timeline. Can be a single Date/String, or an Array of 2 values representing the min and max.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `Date` \| (`string` \| `Date`)[] |

###### Returns

[`Plot`](#plot) \| `Date`[]

###### Inherited from

[`Viz`](#viz).[`timelineDefault`](#timelinedefault-1)

<a id="timelinepadding"></a>

##### timelinePadding()

> **timelinePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:271](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L271)

Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`timelinePadding`](#timelinepadding-1)

<a id="title"></a>

##### title()

> **title**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L283)

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: `DataPoint`[]) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

###### Inherited from

[`Viz`](#viz).[`title`](#title-1)

<a id="titleconfig-6"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:294](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L294)

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`titleConfig`](#titleconfig-8)

<a id="titlepadding"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:303](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L303)

Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`titlePadding`](#titlepadding-1)

<a id="tooltip"></a>

##### tooltip()

> **tooltip**(`_?`: `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:314](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L314)

Whether to display tooltips on hover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`tooltip`](#tooltip-2)

<a id="tooltipconfig"></a>

##### tooltipConfig()

> **tooltipConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:325](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L325)

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tooltipConfig`](#tooltipconfig-2)

<a id="toscene-14"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: [charts/Plot/index.ts:236](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L236)

Composes the chart's scene graph: the native shape scenes from Viz.toScene
(bars/lines/areas + labels) plus snapshots of the rendered axes, so a Plot
renders fully — geometry and axes — through the @d3plus/render backends.

###### Returns

`Scene`

###### Overrides

[`Viz`](#viz).[`toScene`](#toscene-19)

<a id="total"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBase.ts:334](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L334)

Accessor function or string key for the total value displayed in the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

[`Viz`](#viz).[`total`](#total-1)

<a id="totalconfig"></a>

##### totalConfig()

> **totalConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:348](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L348)

Configuration object for the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`totalConfig`](#totalconfig-1)

<a id="totalformat"></a>

##### totalFormat()

> **totalFormat**(`_?`: (`d`: `number`) => `string`): [`Plot`](#plot) \| ((`d`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:357](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L357)

Formatter function for the value in the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | (`d`: `number`) => `string` |

###### Returns

[`Plot`](#plot) \| ((`d`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`totalFormat`](#totalformat-1)

<a id="totalpadding"></a>

##### totalPadding()

> **totalPadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:366](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L366)

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`totalPadding`](#totalpadding-1)

<a id="x-1"></a>

##### x()

> **x**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L532)

Accessor function or string key for the x-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="x2"></a>

##### x2()

> **x2**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:546](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L546)

Accessor function or string key for the secondary x-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="x2config"></a>

##### x2Config()

> **x2Config**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:571](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L571)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="xconfig"></a>

##### xConfig()

> **xConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:560](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L560)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="y-1"></a>

##### y()

> **y**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:585](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L585)

Accessor function or string key for the y-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="y2"></a>

##### y2()

> **y2**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:599](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L599)

Accessor function or string key for the secondary y-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="y2config"></a>

##### y2Config()

> **y2Config**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:630](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L630)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="yconfig"></a>

##### yConfig()

> **yConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L615)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

*Note:* If a "domain" array is passed to the y-axis config, it will be reversed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="zoombrushhandlesize"></a>

##### zoomBrushHandleSize()

> **zoomBrushHandleSize**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:380](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L380)

The pixel stroke-width of the zoom brush area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomBrushHandleSize`](#zoombrushhandlesize-1)

<a id="zoombrushhandlestyle"></a>

##### zoomBrushHandleStyle()

> **zoomBrushHandleStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:389](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L389)

An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomBrushHandleStyle`](#zoombrushhandlestyle-1)

<a id="zoombrushselectionstyle"></a>

##### zoomBrushSelectionStyle()

> **zoomBrushSelectionStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:400](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L400)

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomBrushSelectionStyle`](#zoombrushselectionstyle-1)

<a id="zoomcontrolstyle"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:411](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L411)

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomControlStyle`](#zoomcontrolstyle-1)

<a id="zoomcontrolstyleactive"></a>

##### zoomControlStyleActive()

> **zoomControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:422](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L422)

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomControlStyleActive`](#zoomcontrolstyleactive-1)

<a id="zoomcontrolstylehover"></a>

##### zoomControlStyleHover()

> **zoomControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:433](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L433)

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomControlStyleHover`](#zoomcontrolstylehover-1)

<a id="zoompadding"></a>

##### zoomPadding()

> **zoomPadding**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L448)

A pixel value to be used to pad all sides of a zoomed area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomPadding`](#zoompadding-1)

***

<a id="rect"></a>

### Rect

Defined in: [shapes/Rect.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L18)

Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-3"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: `DataPoint`[]): `DataPoint`[]

Defined in: [shapes/Shape.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L113)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `DataPoint`[] | The raw data array to filter. |

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-8"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-5"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-14"></a>

##### config()

###### Call Signature

> **config**(): [`RectConfig`](#rectconfig-3)

Defined in: [shapes/Rect.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L94)

Narrowed `.config()` for Rect. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`RectConfig`](#rectconfig-3)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

###### Call Signature

> **config**(`_`: `Partial`\<[`RectConfig`](#rectconfig-3)\>): `this`

Defined in: [shapes/Rect.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L95)

Narrowed `.config()` for Rect. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`RectConfig`](#rectconfig-3)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-15)

<a id="data-15"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-8"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-5"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

<a id="labelconfig-6"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-14"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Shape`](#shape-1).[`locale`](#locale-15)

<a id="on-14"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`Shape`](#shape-1).[`on`](#on-15)

<a id="parent-14"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-15)

<a id="render-15"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`render`](#render-16)

<a id="select-15"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

<a id="shapeconfig-15"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

<a id="sort-5"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-5"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

<a id="toscene-15"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-14"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Shape`](#shape-1).[`translate`](#translate-15)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-5"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-5"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-14"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-15) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-14"></a> `_data` | `DataPoint`[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-5"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-5"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-12"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-5"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-6"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-5"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-5"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-14"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-5"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-5"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-10"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-5"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-14"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-15) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-14"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-15) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-15"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Shape`](#shape-1).[`schema`](#property-schema-16) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="shape-1"></a>

### Shape

Defined in: [shapes/Shape.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L98)

An abstracted class for generating shapes.

#### Extends

- [`BaseClass`](#baseclass)

#### Extended by

- [`Area`](#area)
- [`Bar`](#bar)
- [`Circle`](#circle)
- [`Line`](#line)
- [`Path`](#path)
- [`Rect`](#rect)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-4"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: `DataPoint`[]): `DataPoint`[]

Defined in: [shapes/Shape.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L113)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `DataPoint`[] | The raw data array to filter. |

###### Returns

`DataPoint`[]

<a id="active-9"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L588)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L589)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

<a id="activestyle-6"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:603](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L603)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L604)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="config-15"></a>

##### config()

###### Call Signature

> **config**(): [`BaseShapeConfig`](#baseshapeconfig)

Defined in: [shapes/Shape.ts:698](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L698)

Narrowed `.config()` for Shape. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BaseShapeConfig`](#baseshapeconfig)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BaseShapeConfig`](#baseshapeconfig)\>): `this`

Defined in: [shapes/Shape.ts:699](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L699)

Narrowed `.config()` for Shape. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`BaseShapeConfig`](#baseshapeconfig)\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-16"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L615)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L616)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="hover-9"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L624)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L625)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

<a id="hoverstyle-6"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L638)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:639](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L639)

The style to apply to hovered shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="labelconfig-7"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L649)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:650](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L650)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-15"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-15"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="parent-15"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-16"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L482)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`this`

<a id="select-16"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:661](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L661)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="shapeconfig-17"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="sort-6"></a>

##### sort()

###### Call Signature

> **sort**(): ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

Defined in: [shapes/Shape.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L671)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L672)

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` |

###### Returns

`this`

<a id="texturedefault-6"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Shape.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L684)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:685](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L685)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="toscene-16"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Shape.ts:402](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L402)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

<a id="translate-15"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_activegroup-6"></a> `_activeGroup` | `Selection` | - | - | [shapes/Shape.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L119) |
| <a id="property-_backgroundimageclass-6"></a> `_backgroundImageClass` | [`Image`](#image) | - | - | [shapes/Shape.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L104) |
| <a id="property-_configdefault-15"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-15"></a> `_data` | `DataPoint`[] | - | - | [shapes/Shape.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L105) |
| <a id="property-_enter-6"></a> `_enter` | `Selection` | - | - | [shapes/Shape.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L116) |
| <a id="property-_exit-6"></a> `_exit` | `Selection` | - | - | [shapes/Shape.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L117) |
| <a id="property-_group-13"></a> `_group` | `Selection` | - | - | [shapes/Shape.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L114) |
| <a id="property-_hovergroup-6"></a> `_hoverGroup` | `Selection` | - | - | [shapes/Shape.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L118) |
| <a id="property-_labelclass-7"></a> `_labelClass` | [`TextBox`](#textbox) | - | - | [shapes/Shape.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L106) |
| <a id="property-_name-6"></a> `_name` | `string` | - | - | [shapes/Shape.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L107) |
| <a id="property-_path-6"></a> `_path` | `Record`\<`string`, `unknown`\> | - | - | [shapes/Shape.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L120) |
| <a id="property-_select-15"></a> `_select` | `Selection` | - | - | [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110) |
| <a id="property-_tagname-6"></a> `_tagName` | `string` | - | - | [shapes/Shape.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L108) |
| <a id="property-_texturedefs-6"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | - | [shapes/Shape.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L109) |
| <a id="property-_transition-11"></a> `_transition` | `Transition`\<`BaseType`\> | - | - | [shapes/Shape.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L111) |
| <a id="property-_update-6"></a> `_update` | `Selection` | - | - | [shapes/Shape.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L115) |
| <a id="property-_uuid-15"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-15"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-16"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="textbox"></a>

### TextBox

Defined in: [components/TextBox.ts:407](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L407)

Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="config-16"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-17"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [components/TextBox.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L556)

The data array used to draw text boxes. A text box will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/TextBox.ts:557](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L557)

The data array used to draw text boxes. A text box will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="html"></a>

##### html()

###### Call Signature

> **html**(): `false` \| `Record`\<`string`, `string`\>

Defined in: [components/TextBox.ts:565](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L565)

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Returns

`false` \| `Record`\<`string`, `string`\>

###### Call Signature

> **html**(`_`: `boolean` \| `Record`\<`string`, `string`\>): `this`

Defined in: [components/TextBox.ts:566](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L566)

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` \| `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-16"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-16"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="parent-16"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-17"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/TextBox.ts:507](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L507)

Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-17"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/TextBox.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L578)

The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: [components/TextBox.ts:579](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L579)

The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` |

###### Returns

`this`

<a id="shapeconfig-18"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-17"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/TextBox.ts:444](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L444)

Produces a backend-agnostic scene graph for the text boxes, reusing the same
layout (_textData) and per-line positioning render() applies to the DOM.

###### Returns

`GroupNode`

<a id="translate-16"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_configdefault-16"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-16"></a> `_data` | `DataPoint`[] | - | - | [components/TextBox.ts:413](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L413) |
| <a id="property-_select-16"></a> `_select` | `Selection` | - | - | [components/TextBox.ts:412](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L412) |
| <a id="property-_uuid-16"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-16"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-17"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="timeline"></a>

### Timeline

Defined in: [components/Timeline/Timeline.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L42)

Creates an interactive timeline brush component for selecting time periods within a visualization.

#### Extends

- [`Axis`](#axis)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="barconfig-6"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:396](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L396)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L397)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-17"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

<a id="data-18"></a>

##### data()

###### Call Signature

> **data**(): `any`[]

Defined in: [components/Axis/Axis.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L408)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`any`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `any`[]): `this`

Defined in: [components/Axis/Axis.ts:410](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L410)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `any`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-5"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L419)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L420)

Grid config of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

<a id="handleconfig"></a>

##### handleConfig()

###### Call Signature

> **handleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Timeline/Timeline.ts:450](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L450)

Handle style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **handleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:451](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L451)

Handle style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="labelrotation-5"></a>

##### labelRotation()

###### Call Signature

> **labelRotation**(): `boolean` \| `undefined`

Defined in: [components/Axis/Axis.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L430)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:431](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L431)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-17"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`Axis`](#axis).[`locale`](#locale-1)

<a id="measure-5"></a>

##### measure()

> **measure**(): `this`

Defined in: [components/Axis/Axis.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L489)

Phase-E: runs the layout pass only — scale construction, tick selection,
label textWrap, and outerBounds — with **no DOM access**. After it
returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
tick shapes, or label TextBoxes are created.

This is the v4 path for "how much room will this axis need?" without
the temp-DOM dance — see `Plot._draw`'s test-axes for the production
caller. Internally it delegates to the standalone `measureAxis(axis)`
function in axisLayout.ts; the free function shape means Plot (and
future callers) can run layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-17"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [components/Timeline/Timeline.ts:462](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L462)

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [components/Timeline/Timeline.ts:463](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L463)

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Timeline/Timeline.ts:464](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L464)

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:465](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L465)

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

<a id="orient-5"></a>

##### orient()

###### Call Signature

> **orient**(): `string`

Defined in: [components/Axis/Axis.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L441)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L442)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-7"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:472](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L472)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-17"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

<a id="playbuttonconfig"></a>

##### playButtonConfig()

###### Call Signature

> **playButtonConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Timeline/Timeline.ts:482](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L482)

The config Object for the Rect class used to create the playButton.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **playButtonConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:483](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L483)

The config Object for the Rect class used to create the playButton.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="render-18"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Timeline/Timeline.ts:427](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L427)

Draws the timeline.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Overrides

[`Axis`](#axis).[`render`](#render-1)

<a id="select-18"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L503)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Returns

`Selection`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Axis/Axis.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L504)

The SVG container element as a d3 selector or DOM element.

Passing `null` or `undefined` deliberately leaves the axis unmounted
— `renderMode("compute")` plus `select(null)` produces a
scene-only axis (no detached SVG fallback). This is the formal
contract callers in `plotPaint` use to compute axis layout without
mounting DOM.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`select`](#select-1)

<a id="selectionconfig"></a>

##### selectionConfig()

###### Call Signature

> **selectionConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Timeline/Timeline.ts:493](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L493)

Selection style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **selectionConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:494](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L494)

Selection style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="shapeconfig-19"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `any`\>

Defined in: [components/Axis/Axis.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L519)

Tick style of the axis.

###### Returns

`Record`\<`string`, `any`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `any`\>): `this`

Defined in: [components/Axis/Axis.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L521)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `any`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-7"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:532](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L532)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:533](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L533)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-18"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Timeline/Timeline.ts:355](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L355)

Extends the native Axis scene with the Timeline-specific brush selection
overlay (snapshotted, since d3-brush manages its DOM directly) and the
play-button TextBox (native).

###### Returns

`GroupNode`

###### Overrides

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-17"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`Axis`](#axis).[`translate`](#translate-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_availableticks-5"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | [components/Axis/Axis.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L98) |
| <a id="property-_brush"></a> `_brush` | `any` | - | - | [components/Timeline/Timeline.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L48) |
| <a id="property-_brushgroup"></a> `_brushGroup` | `any` | - | - | [components/Timeline/Timeline.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L50) |
| <a id="property-_buttonbehaviorcurrent"></a> `_buttonBehaviorCurrent` | `string` | - | - | [components/Timeline/Timeline.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L43) |
| <a id="property-_configdefault-17"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_d3scale-5"></a> `_d3Scale` | `any` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | [components/Axis/Axis.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L93) |
| <a id="property-_d3scalenegative-5"></a> `_d3ScaleNegative` | `any` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | [components/Axis/Axis.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L95) |
| <a id="property-_data-17"></a> `_data` | `any`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | [components/Axis/Axis.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L73) |
| <a id="property-_gridlinedata-5"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | [components/Axis/Axis.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L90) |
| <a id="property-_group-14"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | [components/Axis/Axis.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L96) |
| <a id="property-_hiddenhandles"></a> `_hiddenHandles` | `boolean` | - | - | [components/Timeline/Timeline.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L44) |
| <a id="property-_labelrotation-5"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | [components/Axis/Axis.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L74) |
| <a id="property-_lastscale-5"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | [components/Axis/Axis.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L97) |
| <a id="property-_margin-5"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | [components/Axis/Axis.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L75) |
| <a id="property-_outerbounds-7"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | [components/Axis/Axis.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L76) |
| <a id="property-_paddingleft"></a> `_paddingLeft` | `number` | - | - | [components/Timeline/Timeline.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L51) |
| <a id="property-_playbuttonclass"></a> `_playButtonClass` | [`TextBox`](#textbox) | - | - | [components/Timeline/Timeline.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L45) |
| <a id="property-_playtimer"></a> `_playTimer` | `number` \| `false` | - | - | [components/Timeline/Timeline.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L46) |
| <a id="property-_position-5"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | [components/Axis/Axis.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L77) |
| `_position.height` | `string` | - | - | [components/Axis/Axis.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L80) |
| `_position.horizontal` | `boolean` | - | - | [components/Axis/Axis.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L78) |
| `_position.opposite` | `string` | - | - | [components/Axis/Axis.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L83) |
| `_position.width` | `string` | - | - | [components/Axis/Axis.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L79) |
| `_position.x` | `string` | - | - | [components/Axis/Axis.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L81) |
| `_position.y` | `string` | - | - | [components/Axis/Axis.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L82) |
| <a id="property-_select-17"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71) |
| <a id="property-_tickshape-5"></a> `_tickShape?` | `any` | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | [components/Axis/Axis.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L89) |
| <a id="property-_tickswidth"></a> `_ticksWidth` | `number` | - | - | [components/Timeline/Timeline.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L52) |
| <a id="property-_tickunit-5"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | [components/Axis/Axis.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L85) |
| <a id="property-_titleclass-6"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | [components/Axis/Axis.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L86) |
| <a id="property-_transition-12"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | [components/Axis/Axis.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L100) |
| <a id="property-_userformat-5"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | [components/Axis/Axis.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L101) |
| <a id="property-_uuid-17"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_visibleticks-5"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | [components/Axis/Axis.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L99) |
| <a id="property-ctx-17"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-18"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="tooltip-1"></a>

### Tooltip

Defined in: [components/Tooltip.ts:313](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L313)

Creates HTML tooltips in the body of a webpage.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="arrowstyle"></a>

##### arrowStyle()

###### Call Signature

> **arrowStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:445](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L445)

CSS styles applied to the arrow element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **arrowStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:446](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L446)

CSS styles applied to the arrow element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="bodystyle"></a>

##### bodyStyle()

###### Call Signature

> **bodyStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:456](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L456)

CSS styles applied to the body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **bodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:457](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L457)

CSS styles applied to the body element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="config-18"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L103)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L104)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-19"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [components/Tooltip.ts:494](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L494)

The data array used to create tooltips.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/Tooltip.ts:495](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L495)

The data array used to create tooltips.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="footerstyle"></a>

##### footerStyle()

###### Call Signature

> **footerStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L503)

CSS styles applied to the footer element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **footerStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:504](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L504)

CSS styles applied to the footer element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-18"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-18"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="parent-18"></a>

##### parent()

###### Call Signature

> **parent**(): `HTMLElement` \| `undefined`

Defined in: [components/Tooltip.ts:473](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L473)

Parent element that scopes the tooltip's portal. Default (unset) uses
the global `<div id="d3plus-portal">` appended to `<body>`. When set,
tooltips mount inside a `.d3plus-tooltip-portal` child of the given
element instead — so multiple charts on a page don't fight over the
global portal, and tooltips destroy cleanly when the chart goes away.

Viz auto-sets this when rendering: chart.tooltipClass.parent(chart._select.node().parentNode).

###### Returns

`HTMLElement` \| `undefined`

###### Overrides

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `HTMLElement` \| `null` \| `undefined`): `this`

Defined in: [components/Tooltip.ts:474](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L474)

Parent element that scopes the tooltip's portal. Default (unset) uses
the global `<div id="d3plus-portal">` appended to `<body>`. When set,
tooltips mount inside a `.d3plus-tooltip-portal` child of the given
element instead — so multiple charts on a page don't fight over the
global portal, and tooltips destroy cleanly when the chart goes away.

Viz auto-sets this when rendering: chart.tooltipClass.parent(chart._select.node().parentNode).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `HTMLElement` \| `null` \| *required* |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="position"></a>

##### position()

###### Call Signature

> **position**(): (`d`: `DataPoint`, `i?`: `number`) => `number`[] \| `HTMLElement`

Defined in: [components/Tooltip.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L519)

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Returns

(`d`: `DataPoint`, `i?`: `number`) => `number`[] \| `HTMLElement`

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

###### Call Signature

> **position**(`_`: `string` \| `number`[] \| `HTMLElement` \| ((`d`: `DataPoint`, `i?`: `number`) => `number`[] \| `HTMLElement`)): `this`

Defined in: [components/Tooltip.ts:520](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L520)

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `number`[] \| `HTMLElement` \| ((`d`: `DataPoint`, `i?`: `number`) => `number`[] \| `HTMLElement`) |

###### Returns

`this`

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

<a id="shapeconfig-20"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="tablestyle"></a>

##### tableStyle()

###### Call Signature

> **tableStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:554](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L554)

CSS styles applied to the table element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tableStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L555)

CSS styles applied to the table element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="tbodystyle"></a>

##### tbodyStyle()

###### Call Signature

> **tbodyStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:565](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L565)

CSS styles applied to the table body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tbodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:566](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L566)

CSS styles applied to the table body element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="tdstyle"></a>

##### tdStyle()

###### Call Signature

> **tdStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:625](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L625)

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tdStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:626](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L626)

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="theadstyle"></a>

##### theadStyle()

###### Call Signature

> **theadStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:576](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L576)

CSS styles applied to the table head element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **theadStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:577](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L577)

CSS styles applied to the table head element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="titlestyle"></a>

##### titleStyle()

###### Call Signature

> **titleStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:587](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L587)

CSS styles applied to the title element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **titleStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L588)

CSS styles applied to the title element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="tooltipstyle"></a>

##### tooltipStyle()

###### Call Signature

> **tooltipStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:598](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L598)

Overall CSS styles applied to the tooltip container.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tooltipStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:599](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L599)

Overall CSS styles applied to the tooltip container.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="translate-18"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

<a id="trstyle"></a>

##### trStyle()

###### Call Signature

> **trStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Tooltip.ts:614](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L614)

An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.

###### Returns

`Record`\<`string`, `unknown`\>

###### Example

```ts
{
"border-top": "1px solid rgba(0, 0, 0, 0.1)"
}
```

###### Call Signature

> **trStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Tooltip.ts:615](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L615)

An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Example

```ts
{
"border-top": "1px solid rgba(0, 0, 0, 0.1)"
}
```

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_configdefault-18"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-18"></a> `_data` | `DataPoint`[] | - | - | [components/Tooltip.ts:318](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L318) |
| <a id="property-_parentel"></a> `_parentEl?` | `HTMLElement` | v4: optional per-chart parent element (default: global #d3plus-portal). | - | [components/Tooltip.ts:320](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L320) |
| <a id="property-_portalel"></a> `_portalEl?` | `HTMLElement` | v4: this Tooltip's own portal div (a `.d3plus-tooltip-portal` child of `_parentEl`). Tracked per-instance so that two Tooltips sharing a parent each own a distinct portal — and so `parent()` switches only remove THIS instance's portal, not a sibling Tooltip's. | - | [components/Tooltip.ts:327](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L327) |
| <a id="property-_tooltiprefs"></a> `_tooltipRefs` | `Record`\<`string`, \{ `arrowDistance`: `number`; `arrowEl`: `HTMLElement`; `arrowHeight`: `number`; `reference`: `VirtualElement` \| `HTMLElement`; `tooltip`: `HTMLElement`; \}\> | - | - | [components/Tooltip.ts:328](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L328) |
| <a id="property-_uuid-18"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-ctx-18"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-19"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

***

<a id="viz"></a>

### Viz

Defined in: [charts/viz/Viz.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L47)

Creates an x/y plot based on an array of data. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.

#### Extends

- `default`

#### Extended by

- [`Plot`](#plot)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_drawscenetotarget-1"></a>

##### \_drawSceneToTarget()

> **\_drawSceneToTarget**(`durationOverride?`: `number`): `void`

Defined in: [charts/viz/Viz.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L283)

Renders this chart through the @d3plus/render pluggable backends. Called
automatically by `render()`. The compute pass draws into `this._select`
(an auto-created svg INSIDE the user's target div) — that svg is the
off-stage detached compute svg. SvgRenderer mounts to the user's target
div (the parent), as a sibling to the detached compute svg. The compute
svg's children get cleared so only the scene output is visible.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `durationOverride?` | `number` |

###### Returns

`void`

<a id="_schedulescenerepaint-1"></a>

##### \_scheduleSceneRepaint()

> **\_scheduleSceneRepaint**(): `void`

Defined in: [charts/viz/Viz.ts:443](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L443)

Coalesces interaction-driven scene repaints (hover/active dimming) into a
single paint per animation frame. A fast pointer sweep across a dense
chart fires a hover transition per shape crossed; painting each one
synchronously rebuilt the whole scene back-to-back, saturating the main
thread (~200ms stalls) so the tooltip couldn't reposition and appeared
stuck at its last spot. Only the latest hover state is visible, so the
intermediate paints are wasted — collapse them to one rAF-scheduled draw.

###### Returns

`void`

<a id="active-10"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L23)

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

###### Inherited from

`VizBase.active`

<a id="aggs-1"></a>

##### aggs()

> **aggs**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L42)

Custom aggregation methods for each data key.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.aggs`

<a id="attribution-1"></a>

##### attribution()

> **attribution**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L53)

Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.attribution`

<a id="attributionstyle-1"></a>

##### attributionStyle()

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L62)

Configuration object for the attribution style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.attributionStyle`

<a id="backconfig-1"></a>

##### backConfig()

> **backConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L73)

Configuration object for the back button.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.backConfig`

<a id="color-1"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L84)

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

`VizBase.color`

<a id="colorscale-2"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L102)

Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

`VizBase.colorScale`

<a id="colorscaleconfig-2"></a>

##### colorScaleConfig()

> **colorScaleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L121)

A pass-through to the config method of ColorScale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.colorScaleConfig`

<a id="colorscalemaxsize-1"></a>

##### colorScaleMaxSize()

> **colorScaleMaxSize**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L156)

The maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.colorScaleMaxSize`

<a id="colorscalepadding-1"></a>

##### colorScalePadding()

> **colorScalePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L132)

Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.colorScalePadding`

<a id="colorscaleposition-1"></a>

##### colorScalePosition()

> **colorScalePosition**(`_?`: `string` \| `boolean` \| (() => `string` \| `boolean`)): `string` \| `boolean` \| [`Viz`](#viz) \| (() => `string` \| `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L144)

Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| (() => `string` \| `boolean`) |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz) \| (() => `string` \| `boolean`)

###### Inherited from

`VizBase.colorScalePosition`

<a id="data-20"></a>

##### data()

> **data**(`_?`: `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[]): [`Viz`](#viz) \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L174)

The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `_?` | `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \} | - |
| `f?` | (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[] | The data array or a URL string to load data from. |

###### Returns

[`Viz`](#viz) \| `DataPoint`[]

###### Inherited from

`VizBase.data`

<a id="destroy-1"></a>

##### destroy()

> **destroy**(): `this`

Defined in: [charts/viz/Viz.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L459)

Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

<a id="detectresize-1"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L202)

If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectResize`

<a id="detectresizedelay-1"></a>

##### detectResizeDelay()

> **detectResizeDelay**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L211)

When resizing the browser window, this is the millisecond delay to trigger the resize event.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectResizeDelay`

<a id="detectvisible-1"></a>

##### detectVisible()

> **detectVisible**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L220)

Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectVisible`

<a id="detectvisibleinterval-1"></a>

##### detectVisibleInterval()

> **detectVisibleInterval**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L229)

The interval, in milliseconds, for checking if the visualization is visible on the page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectVisibleInterval`

<a id="downloadbutton-1"></a>

##### downloadButton()

> **downloadButton**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L240)

Shows a button that allows for downloading the current visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.downloadButton`

<a id="downloadconfig-1"></a>

##### downloadConfig()

> **downloadConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L249)

Sets specific options of the saveElement function used when downloading the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.downloadConfig`

<a id="downloadposition-1"></a>

##### downloadPosition()

> **downloadPosition**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L258)

Defines which control group to add the download button into.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.downloadPosition`

<a id="fontfamily-1"></a>

##### fontFamily()

> **fontFamily**(`_?`: `string` \| `string`[]): `string` \| [`Viz`](#viz) \| `string`[]

Defined in: [charts/viz/VizBaseConfig.ts:270](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L270)

The font family used throughout the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `string`[] |

###### Returns

`string` \| [`Viz`](#viz) \| `string`[]

###### Inherited from

`VizBase.fontFamily`

<a id="groupby-1"></a>

##### groupBy()

> **groupBy**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) \| (`string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`))[]): [`Viz`](#viz) \| (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:303](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L303)

Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) \| (`string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`))[] |

###### Returns

[`Viz`](#viz) \| (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`[]

###### Inherited from

`VizBase.groupBy`

<a id="hiddencolor-1"></a>

##### hiddenColor()

> **hiddenColor**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L342)

Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.hiddenColor`

<a id="hiddenopacity-1"></a>

##### hiddenOpacity()

> **hiddenOpacity**(`_?`: `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `number` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBaseConfig.ts:353](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L353)

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`number` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

`VizBase.hiddenOpacity`

<a id="hover-10"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `this`

Defined in: [charts/viz/VizBaseConfig.ts:365](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L365)

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`this`

###### Inherited from

`VizBase.hover`

<a id="label-1"></a>

##### label()

> **label**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:409](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L409)

Accessor function or string key for the label of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.label`

<a id="legend-2"></a>

##### legend()

> **legend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L420)

Whether to display the legend.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: `DataPoint`[]) => `boolean`)

###### Inherited from

`VizBase.legend`

<a id="legendconfig-3"></a>

##### legendConfig()

> **legendConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:436](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L436)

Configuration object passed to the legend's config method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.legendConfig`

<a id="legendfilterinvert-1"></a>

##### legendFilterInvert()

> **legendFilterInvert**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:445](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L445)

Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.legendFilterInvert`

<a id="legendpadding-1"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:457](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L457)

Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.legendPadding`

<a id="legendposition-1"></a>

##### legendPosition()

> **legendPosition**(`_?`: `string` \| (() => `string`)): `string` \| [`Viz`](#viz) \| (() => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:469](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L469)

Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| (() => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| (() => `string`)

###### Inherited from

`VizBase.legendPosition`

<a id="legendtooltip-1"></a>

##### legendTooltip()

> **legendTooltip**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L481)

Configuration object for the legend tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.legendTooltip`

<a id="loadinghtml-1"></a>

##### loadingHTML()

> **loadingHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L23)

The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`viz`: `VizBase`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

###### Inherited from

`VizBase.loadingHTML`

<a id="loadingmessage-1"></a>

##### loadingMessage()

> **loadingMessage**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L34)

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.loadingMessage`

<a id="messagemask-1"></a>

##### messageMask()

> **messageMask**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L43)

The color of the mask displayed underneath the status message when loading AJAX requests and displaying errors. Set to `false` to turn off the mask completely.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.messageMask`

<a id="messagestyle-1"></a>

##### messageStyle()

> **messageStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L52)

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.messageStyle`

<a id="nodatahtml-1"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L61)

The inner HTML of the status message displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`viz`: `VizBase`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

###### Inherited from

`VizBase.noDataHTML`

<a id="nodatamessage-1"></a>

##### noDataMessage()

> **noDataMessage**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L72)

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.noDataMessage`

<a id="render-19"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [charts/viz/Viz.ts:222](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L222)

Draws the visualization given the specified configuration.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="renderer-1"></a>

##### renderer()

###### Call Signature

> **renderer**(): `"svg"` \| `"canvas"`

Defined in: [charts/viz/Viz.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L231)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: [charts/viz/Viz.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L232)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` \| `"svg"` \| `"canvas"` |

###### Returns

`this`

<a id="rendermode-1"></a>

##### renderMode()

###### Call Signature

> **renderMode**(): `"full"` \| `"compute"`

Defined in: [charts/viz/Viz.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L245)

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Returns

`"full"` \| `"compute"`

###### Call Signature

> **renderMode**(`_`: `"full"` \| `"compute"`): `this`

Defined in: [charts/viz/Viz.ts:246](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L246)

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `"full"` \| `"compute"` |

###### Returns

`this`

<a id="renderscene-1"></a>

##### renderScene()

> **renderScene**(`target`: `Element`, `opts?`: `object`): `Promise`\<\{ `renderer`: `Renderer`; `scene`: `Scene`; \}\>

Defined in: [charts/viz/Viz.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L260)

Public entry point that renders this chart through the @d3plus/render
pluggable backends. The compute pass happens via render() (in an svg
auto-created inside the target div); SvgRenderer/CanvasRenderer paints
the scene to the target. Returns `{renderer, scene}` so callers can
interact with the renderer (e.g. for picking) or read the scene data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `Element` |
| `opts?` | \{ `kind?`: `"svg"` \| `"canvas"`; \} |
| `opts.kind?` | `"svg"` \| `"canvas"` |

###### Returns

`Promise`\<\{ `renderer`: `Renderer`; `scene`: `Scene`; \}\>

<a id="scrollcontainer-1"></a>

##### scrollContainer()

> **scrollContainer**(`_?`: `string` \| `HTMLElement` \| `Window`): `string` \| [`Viz`](#viz) \| `HTMLElement` \| `Window`

Defined in: [charts/viz/VizBase.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L81)

If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` \| `Window` |

###### Returns

`string` \| [`Viz`](#viz) \| `HTMLElement` \| `Window`

###### Inherited from

`VizBase.scrollContainer`

<a id="select-19"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Viz`](#viz) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: [charts/viz/VizBase.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L92)

The SVG container element as a d3 selector or DOM element. Defaults to `undefined`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` |

###### Returns

[`Viz`](#viz) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

###### Inherited from

`VizBase.select`

<a id="shape-2"></a>

##### shape()

> **shape**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L101)

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.shape`

<a id="shapeconfig-21"></a>

##### shapeConfig()

> **shapeConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L112)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.shapeConfig`

<a id="subtitle-1"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L121)

Accessor function or string for the visualization's subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: `DataPoint`[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

###### Inherited from

`VizBase.subtitle`

<a id="subtitleconfig-1"></a>

##### subtitleConfig()

> **subtitleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L132)

Configuration object for the subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.subtitleConfig`

<a id="subtitlepadding-1"></a>

##### subtitlePadding()

> **subtitlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L141)

Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.subtitlePadding`

<a id="threshold-1"></a>

##### threshold()

> **threshold**(`_?`: `number` \| ((`data`: `DataPoint`[]) => `number`)): `number` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `number`)

Defined in: [charts/viz/VizBase.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L156)

The threshold value for bucketing small data points together.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`data`: `DataPoint`[]) => `number`) |

###### Returns

`number` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `number`)

###### Inherited from

`VizBase.threshold`

<a id="thresholdkey-1"></a>

##### thresholdKey()

> **thresholdKey**(`key?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBase.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L173)

Accessor for the value used in the threshold algorithm.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) | The data key used to group values for thresholding. |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

`VizBase.thresholdKey`

<a id="thresholdname-1"></a>

##### thresholdName()

> **thresholdName**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L189)

The label displayed for bucketed threshold items.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.thresholdName`

<a id="time-1"></a>

##### time()

> **time**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBase.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L201)

Accessor function or string key for the time dimension of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

`VizBase.time`

<a id="timelineconfig-2"></a>

##### timelineConfig()

> **timelineConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L249)

Configuration object for the timeline.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.timelineConfig`

<a id="timelinedefault-1"></a>

##### timelineDefault()

> **timelineDefault**(`_?`: `string` \| `Date` \| (`string` \| `Date`)[]): [`Viz`](#viz) \| `Date`[]

Defined in: [charts/viz/VizBase.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L258)

The starting time or range for the timeline. Can be a single Date/String, or an Array of 2 values representing the min and max.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `Date` \| (`string` \| `Date`)[] |

###### Returns

[`Viz`](#viz) \| `Date`[]

###### Inherited from

`VizBase.timelineDefault`

<a id="timelinepadding-1"></a>

##### timelinePadding()

> **timelinePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:271](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L271)

Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.timelinePadding`

<a id="title-1"></a>

##### title()

> **title**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L283)

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: `DataPoint`[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

###### Inherited from

`VizBase.title`

<a id="titleconfig-8"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:294](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L294)

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.titleConfig`

<a id="titlepadding-1"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:303](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L303)

Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.titlePadding`

<a id="tooltip-2"></a>

##### tooltip()

> **tooltip**(`_?`: `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:314](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L314)

Whether to display tooltips on hover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

###### Inherited from

`VizBase.tooltip`

<a id="tooltipconfig-2"></a>

##### tooltipConfig()

> **tooltipConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:325](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L325)

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.tooltipConfig`

<a id="toscene-19"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: [charts/viz/Viz.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L75)

Composes a backend-agnostic scene graph from the shapes/features produced
by the most recent render. Combines:
- `_chartScene` (cells from `chartDef.emit`, or `Plot._paint` for the
  paint-driven Plot family) wrapped in viz-chart-cells
- `_shapes` (still used by some charts) — each shape's toScene
- chart-level components (Legend/ColorScale/Timeline) via their toScene
- `_featurePanels` (from FeatureModule layouts) wrapped in viz-features

###### Returns

`Scene`

<a id="total-1"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBase.ts:334](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L334)

Accessor function or string key for the total value displayed in the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

`VizBase.total`

<a id="totalconfig-1"></a>

##### totalConfig()

> **totalConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:348](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L348)

Configuration object for the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.totalConfig`

<a id="totalformat-1"></a>

##### totalFormat()

> **totalFormat**(`_?`: (`d`: `number`) => `string`): [`Viz`](#viz) \| ((`d`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:357](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L357)

Formatter function for the value in the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | (`d`: `number`) => `string` |

###### Returns

[`Viz`](#viz) \| ((`d`: `number`) => `string`)

###### Inherited from

`VizBase.totalFormat`

<a id="totalpadding-1"></a>

##### totalPadding()

> **totalPadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: [charts/viz/VizBase.ts:366](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L366)

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.totalPadding`

<a id="zoombrushhandlesize-1"></a>

##### zoomBrushHandleSize()

> **zoomBrushHandleSize**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:380](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L380)

The pixel stroke-width of the zoom brush area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomBrushHandleSize`

<a id="zoombrushhandlestyle-1"></a>

##### zoomBrushHandleStyle()

> **zoomBrushHandleStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:389](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L389)

An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomBrushHandleStyle`

<a id="zoombrushselectionstyle-1"></a>

##### zoomBrushSelectionStyle()

> **zoomBrushSelectionStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:400](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L400)

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomBrushSelectionStyle`

<a id="zoomcontrolstyle-1"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:411](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L411)

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomControlStyle`

<a id="zoomcontrolstyleactive-1"></a>

##### zoomControlStyleActive()

> **zoomControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:422](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L422)

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomControlStyleActive`

<a id="zoomcontrolstylehover-1"></a>

##### zoomControlStyleHover()

> **zoomControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:433](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L433)

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomControlStyleHover`

<a id="zoompadding-1"></a>

##### zoomPadding()

> **zoomPadding**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L448)

A pixel value to be used to pad all sides of a zoomed area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomPadding`

***

<a id="whisker"></a>

### Whisker

Defined in: [shapes/Whisker.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L34)

Creates SVG whisker based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-11"></a>

##### active()

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Whisker.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L195)

The active highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="config-19"></a>

##### config()

###### Call Signature

> **config**(): [`WhiskerConfig`](#whiskerconfig-2)

Defined in: [shapes/Whisker.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L261)

Narrowed `.config()` for Whisker. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`WhiskerConfig`](#whiskerconfig-2)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`WhiskerConfig`](#whiskerconfig-2)\>): `this`

Defined in: [shapes/Whisker.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L262)

Narrowed `.config()` for Whisker. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`WhiskerConfig`](#whiskerconfig-2)\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="data-21"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Whisker.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L206)

The data array used to create shapes.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Whisker.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L207)

The data array used to create shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `DataPoint`[] |

###### Returns

`this`

<a id="endpointconfig"></a>

##### endpointConfig()

###### Call Signature

> **endpointConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Whisker.ts:215](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L215)

Configuration object for each endpoint.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **endpointConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Whisker.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L216)

Configuration object for each endpoint.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="hover-11"></a>

##### hover()

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Whisker.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L226)

The hover highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="lineconfig-1"></a>

##### lineConfig()

###### Call Signature

> **lineConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Whisker.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L237)

Configuration object for the line shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **lineConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Whisker.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L238)

Configuration object for the line shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-19"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L168)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Returns

`string`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L169)

The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `object` |

###### Returns

`this`

###### Example

```ts
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```

###### Inherited from

[`BaseClass`](#baseclass).[`locale`](#locale-7)

<a id="on-19"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L188)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L189)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

((...`args`: `unknown`[]) => `unknown`) \| `undefined`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L190)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |
| `f` | (...`args`: `unknown`[]) => `unknown` |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L191)

Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> |

###### Returns

`this`

###### Example

```ts
new Plot
.on("click.Shape", function(d) {
console.log("data for shape clicked:", d);
})
.on("click.Legend", function(d) {
console.log("data for legend clicked:", d);
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`on`](#on-7)

<a id="parent-19"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L212)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-20"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Whisker.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L60)

Draws the whisker.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-20"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Whisker.ts:248](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L248)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Whisker.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L249)

The SVG container element for this visualization. 3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="shapeconfig-22"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L241)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L242)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-20"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Whisker.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L180)

Compute-mode scene aggregation, mirroring Box.toScene(). Returns a
GroupNode containing the inner Line's scene children plus each
endpoint shape's scene children.

###### Returns

`GroupNode`

<a id="translate-19"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L228)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Returns

(`d`: `string`, `locale?`: `string`) => `string`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L229)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | (`d`: `string`, `locale?`: `string`) => `string` |

###### Returns

`this`

###### Example

```ts
.translate(function(d) {
return d === "Back" ? "Get outta here" : d;
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`translate`](#translate-7)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_configdefault-19"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | [utils/BaseClass.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L77) |
| <a id="property-_data-19"></a> `_data` | `DataPoint`[] | - | - | [shapes/Whisker.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L39) |
| <a id="property-_line"></a> `_line` | [`Line`](#line) | - | - | [shapes/Whisker.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L41) |
| <a id="property-_select-18"></a> `_select` | `Selection` | - | - | [shapes/Whisker.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L40) |
| <a id="property-_uuid-19"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | [utils/BaseClass.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L76) |
| <a id="property-_whiskerendpoint-1"></a> `_whiskerEndpoint` | ([`Rect`](#rect) \| [`Circle`](#circle))[] | - | - | [shapes/Whisker.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L42) |
| <a id="property-ctx-19"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L74) |
| <a id="property-schema-20"></a> `schema` | `Record`\<`string`, `any`\> | User-set values from fluent accessors (`.sum(...)`, `.x(...)`, …). | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L72) |

## Functions

<a id="accessor"></a>

### accessor()

> **accessor**(`key`: `string`, `def?`: `string` \| `number` \| `boolean` \| `DataPoint`): (`d`: `DataPoint`) => `string` \| `number` \| `boolean` \| `DataPoint`

Defined in: [utils/accessor.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/accessor.ts#L14)

Wraps an object key in a simple accessor function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be returned from each Object passed to the function. |
| `def?` | `string` \| `number` \| `boolean` \| `DataPoint` | A default value to be returned if the key is not present. |

#### Returns

(`d`: `DataPoint`) => `string` \| `number` \| `boolean` \| `DataPoint`

#### Examples

```ts
accessor("id");
```

```ts
function(d) {
return d["id"];
}
```

***

<a id="computeaxislayout"></a>

### computeAxisLayout()

> **computeAxisLayout**(`axis`: `any`): [`AxisLayout`](#axislayout)

Defined in: [components/Axis/Axis.ts:579](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L579)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `axis` | `any` |

#### Returns

[`AxisLayout`](#axislayout)

***

<a id="configprep"></a>

### configPrep()

> **configPrep**(`this`: `VizContext`, `config?`: `ConfigObject`, `type?`: `string`, `nest?`: `string` \| `false`): `ConfigObject`

Defined in: [utils/configPrep.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/configPrep.ts#L46)

Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `this` | `VizContext` | *required* | - |
| `config` | `ConfigObject` | `...` | The configuration object to parse. |
| `type` | `string` | `"shape"` | The event classifier to user for "on" events. For example, the default event type of "shape" will apply all events in the "on" config object with that key, like "click.shape" and "mouseleave.shape", in addition to any gloval events like "click" and "mouseleave". |
| `nest` | `string` \| `false` | `false` | An optional nested key to bubble up to the parent config level. |

#### Returns

`ConfigObject`

***

<a id="constant"></a>

### constant()

> **constant**\<`T`\>(`value`: `T`): () => `T`

Defined in: [utils/constant.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/constant.ts#L11)

Wraps non-function variables in a simple return function.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to wrap in a return function. |

#### Returns

() => `T`

#### Examples

```ts
constant(42);
```

```ts
function() {
return 42;
}
```

***

<a id="createfluent"></a>

### createFluent()

> **createFluent**\<`C`\>(`schema`: `ConfigField`[], `defaults?`: `Partial`\<`C`\>): `FluentInstance`\<`C`\> & `Record`\<`string`, (`value?`: `unknown`) => `unknown`\>

Defined in: [fluent.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/fluent.ts#L105)

Build a fluent instance from a config schema. Every field in the schema
becomes a `(value?) => value | this` accessor on the returned object,
identical in shape to d3plus's hand-written `arguments.length`-overloaded
methods — but generated.

The returned instance also exposes `config()` for getting/setting in one
shot, matching the `BaseClass.config()` contract.

#### Type Parameters

| Type Parameter |
| ------ |
| `C` *extends* `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `ConfigField`[] | The config fields the chart supports. |
| `defaults` | `Partial`\<`C`\> | Seed values (applied with the schema's coercions). |

#### Returns

`FluentInstance`\<`C`\> & `Record`\<`string`, (`value?`: `unknown`) => `unknown`\>

***

<a id="installfluent"></a>

### installFluent()

> **installFluent**(`target`: `any`, `schema`: `ConfigField`[], `defaults?`: `Record`\<`string`, `unknown`\>): `void`

Defined in: [fluent.ts:163](https://github.com/d3plus/d3plus/blob/main/packages/core/src/fluent.ts#L163)

Class-instance variant: mixes generated accessors onto an existing `this`,
storing each field as `this.schema.<key>`. A chart class inherits its
accessor surface from a `ChartDefinition`'s schema, and the rest of the
chart body reads the same values through `this.schema.<key>`.

Seeds `this.schema.<key>` from `defaults` (with the same coercion) only if
the field isn't already set — so an `extends Viz` chain that already wrote
`this.schema.sum = constant(...)` in `Viz`'s constructor is respected.

Methods are installed on the target's **prototype**, once per key (skipped
if the prototype already owns that method). This is load-bearing for
`BaseClass.config()` reflection — its `getAllMethods(Object.getPrototypeOf(this))`
only sees prototype methods, so per-instance methods would be invisible to
it (causing the React wrapper's hash() to miss user-set values like
`.padAngle(0.05)`). The methods close over the schema and read/write
`this.schema.<key>`, so per-instance state is preserved.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | `any` | Object to install methods on (typically a class instance). |
| `schema` | `ConfigField`[] | Same field schema `createFluent` consumes. |
| `defaults` | `Record`\<`string`, `unknown`\> | Default values (applied to `this.schema.<key>` when unset). |

#### Returns

`void`

***

<a id="measureaxis"></a>

### measureAxis()

> **measureAxis**(`axis`: `any`): [`AxisLayoutResult`](#axislayoutresult)

Defined in: [components/Axis/axisLayout.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L67)

The standalone axis layout pass. Accepts any object satisfying the
Axis-instance shape (the production `Axis` class is the canonical input).
Pure compute — no DOM, no rendering. Mutates the input to set
`_d3Scale`/`_outerBounds`/`_margin`/etc. for callers that read those off
the instance afterward.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `axis` | `any` |

#### Returns

[`AxisLayoutResult`](#axislayoutresult)

***

<a id="plotemit"></a>

### plotEmit()

> **plotEmit**(`viz`: [`VizInstance`](#vizinstance), `pCtx`: [`PlotPaintContext`](#plotpaintcontext), `mCtx`: [`PlotMeasureResult`](#plotmeasureresult)): `SceneNode`[]

Defined in: [charts/features/plotPaint.ts:463](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L463)

EMIT phase of plotPaint. Takes the `PlotMeasureResult` from
`renderAxes` and produces ALL the scene nodes: background rect,
connector lines, back/front annotations, the main shape loop, line
markers, and the deferred axis scenes (drained from the queue).
Returns the flat `SceneNode[]` array that the caller (`Plot._paint`)
merges into `_chartScene`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |
| `pCtx` | [`PlotPaintContext`](#plotpaintcontext) |
| `mCtx` | [`PlotMeasureResult`](#plotmeasureresult) |

#### Returns

`SceneNode`[]

***

<a id="plotpaint"></a>

### plotPaint()

> **plotPaint**(`viz`: [`VizInstance`](#vizinstance), `pCtx`: [`PlotPaintContext`](#plotpaintcontext)): `SceneNode`[]

Defined in: [charts/features/plotPaint.ts:511](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L511)

Plot paint phase as a free function — orchestrates the axis render +
EMIT.

`renderAxes` (in `./axes.js`) renders the production axes, solves the
final ranges/offsets, and sets `viz._xFunc`/`viz._yFunc`; `plotEmit`
then produces the scene nodes (background rect → connectors → back
annotations → shape loop → line markers → front annotations → axis
scenes). `Plot._paint` is a thin shim that concats the returned nodes
onto `viz._chartScene`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) | The Plot instance (or any subclass: BarChart, LinePlot, …). |
| `pCtx` | [`PlotPaintContext`](#plotpaintcontext) | Cross-phase locals produced by `Plot._draw`. |

#### Returns

`SceneNode`[]

***

<a id="renderaxes"></a>

### renderAxes()

> **renderAxes**(`viz`: [`VizInstance`](#vizinstance), `pCtx`: [`PlotPaintContext`](#plotpaintcontext)): [`PlotMeasureResult`](#plotmeasureresult)

Defined in: [charts/features/axes.ts:613](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/axes.ts#L613)

Render the production axes and solve the final ranges/offsets.

Reads `pCtx`, runs each production-mode axis through
`renderMode("compute").select(null).render()`, computes the final
`xRange`/`yRange` + offsets, sets `viz._xFunc` / `viz._yFunc` accessors,
bumps the line labels, and queues axis scenes for the emit phase.
Returns everything `plotEmit` needs to consume.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |
| `pCtx` | [`PlotPaintContext`](#plotpaintcontext) |

#### Returns

[`PlotMeasureResult`](#plotmeasureresult)

***

<a id="resolvespec"></a>

### resolveSpec()

> **resolveSpec**(`viz`: `any`): [`ResolvedSpec`](#resolvedspec)

Defined in: [charts/pipeline/resolveSpec.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/resolveSpec.ts#L53)

Snapshot every config key from a viz instance into a frozen spec.

Reads the same keys `BaseClass.config()` reflects — strips the `_`
prefix from every instance field whose name matches a method on the
prototype (the v3/v4 config-method-is-also-the-storage-slot pattern).
Returns a frozen object so consumers can't accidentally mutate it
upstream of the chart.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | `any` |

#### Returns

[`ResolvedSpec`](#resolvedspec)

***

<a id="runlayout"></a>

### runLayout()

> **runLayout**(`ctx`: `VizContext`, `features`: `FeatureModule`[], `baseMargin?`: `Required`\<`MarginClaim`\>): `LayoutResult`

Defined in: [charts/features/features.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L142)

Runs each feature's `layout` in order, accumulating margin claims so that
later features see the space already taken by earlier ones. The order of
`features` is the layout order — this is how implicit `this._margin +=`
side effects become *explicit* data flow.

Today's order in `Viz._draw` (`drawTitle`, `drawSubtitle`, `drawTotal`,
`drawBack`, `drawAttribution`, `drawColorScale`, `drawLegend`,
`drawTimeline`) should be ported verbatim as the default sequence — port
the math first, then improve.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | `VizContext` |
| `features` | `FeatureModule`[] |
| `baseMargin` | `Required`\<`MarginClaim`\> |

#### Returns

`LayoutResult`

***

<a id="runstages"></a>

### runStages()

> **runStages**(`initial`: `VizContext`, `stages`: `TransformStage`[]): `VizContext`

Defined in: [charts/pipeline/stages.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/stages.ts#L148)

Run a stage pipeline and accumulate the partial outputs into one context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `initial` | `VizContext` |
| `stages` | `TransformStage`[] |

#### Returns

`VizContext`

***

<a id="runvizpipeline"></a>

### runVizPipeline()

> **runVizPipeline**(`viz`: [`VizInstance`](#vizinstance)): `void`

Defined in: [charts/pipeline/runVizPipeline.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/runVizPipeline.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |

#### Returns

`void`

***

<a id="vizdraw"></a>

### vizDraw()

> **vizDraw**(`viz`: [`VizInstance`](#vizinstance)): `void`

Defined in: [charts/pipeline/vizDraw.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizDraw.ts#L29)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |

#### Returns

`void`

***

<a id="vizdrawpure"></a>

### vizDrawPure()

> **vizDrawPure**(`viz`: [`VizInstance`](#vizinstance), `_prevCtx?`: `Partial`\<[`VizContext`](#vizcontext)\>): `Partial`\<`VizDrawCtx`\>

Defined in: [charts/pipeline/vizDrawPure.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizDrawPure.ts#L59)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |
| `_prevCtx` | `Partial`\<[`VizContext`](#vizcontext)\> |

#### Returns

`Partial`\<`VizDrawCtx`\>

***

<a id="vizpostthresholdctx"></a>

### vizPostThresholdCtx()

> **vizPostThresholdCtx**(`viz`: [`VizInstance`](#vizinstance), `filteredData`: `DataPoint`[], `id`: (`d`: `DataPoint`, `i`: `number`) => `any`): `object`

Defined in: [charts/pipeline/vizPreDrawPure.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L321)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |
| `filteredData` | `DataPoint`[] |
| `id` | (`d`: `DataPoint`, `i`: `number`) => `any` |

#### Returns

`object`

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `hoverOverride?` | `object` | [charts/pipeline/vizPreDrawPure.ts:326](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L326) |
| `hoverOverride.duration` | `number` | [charts/pipeline/vizPreDrawPure.ts:328](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L328) |
| `hoverOverride.hoverOpacity` | `number` | [charts/pipeline/vizPreDrawPure.ts:327](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L327) |
| `hoverOverride.restoreOriginals?` | `boolean` | [charts/pipeline/vizPreDrawPure.ts:330](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L330) |
| `hoverOverride.stashOriginals?` | `boolean` | [charts/pipeline/vizPreDrawPure.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L329) |
| `noDataMessage` | `boolean` | [charts/pipeline/vizPreDrawPure.ts:332](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L332) |

***

<a id="vizpredraw"></a>

### vizPreDraw()

> **vizPreDraw**(`viz`: [`VizInstance`](#vizinstance)): `void`

Defined in: [charts/pipeline/vizPreDraw.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDraw.ts#L26)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |

#### Returns

`void`

***

<a id="vizpredrawpure"></a>

### vizPreDrawPure()

> **vizPreDrawPure**(`viz`: [`VizInstance`](#vizinstance), `_prevCtx?`: `Partial`\<[`VizContext`](#vizcontext)\>): [`VizPreDrawResult`](#vizpredrawresult)

Defined in: [charts/pipeline/vizPreDrawPure.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L269)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `viz` | [`VizInstance`](#vizinstance) |
| `_prevCtx` | `Partial`\<[`VizContext`](#vizcontext)\> |

#### Returns

[`VizPreDrawResult`](#vizpredrawresult)

## Variables

<a id="applygeomaplayout"></a>

### applyGeomapLayout

> `const` **applyGeomapLayout**: `TransformStage`

Defined in: [charts/Geomap/applyLayout.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Geomap/applyLayout.ts#L153)

***

<a id="applymatrixlayout"></a>

### applyMatrixLayout

> `const` **applyMatrixLayout**: `TransformStage`

Defined in: [charts/Matrix/applyLayout.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Matrix/applyLayout.ts#L31)

***

<a id="applynetworklayout"></a>

### applyNetworkLayout

> `const` **applyNetworkLayout**: `TransformStage`

Defined in: [charts/Network/applyLayout.ts:328](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Network/applyLayout.ts#L328)

***

<a id="applypacklayout"></a>

### applyPackLayout

> `const` **applyPackLayout**: `TransformStage`

Defined in: [charts/Pack/applyLayout.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pack/applyLayout.ts#L22)

***

<a id="applypielayout"></a>

### applyPieLayout

> `const` **applyPieLayout**: `TransformStage`

Defined in: [charts/Pie/applyLayout.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pie/applyLayout.ts#L16)

***

<a id="applypriestleylayout"></a>

### applyPriestleyLayout

> `const` **applyPriestleyLayout**: `TransformStage`

Defined in: [charts/Priestley/applyLayout.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Priestley/applyLayout.ts#L122)

***

<a id="applyradarlayout"></a>

### applyRadarLayout

> `const` **applyRadarLayout**: `TransformStage`

Defined in: [charts/Radar/applyLayout.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Radar/applyLayout.ts#L161)

***

<a id="applyradialmatrixlayout"></a>

### applyRadialMatrixLayout

> `const` **applyRadialMatrixLayout**: `TransformStage`

Defined in: [charts/RadialMatrix/applyLayout.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/RadialMatrix/applyLayout.ts#L83)

***

<a id="applyringslayout"></a>

### applyRingsLayout

> `const` **applyRingsLayout**: `TransformStage`

Defined in: [charts/Rings/applyLayout.ts:550](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Rings/applyLayout.ts#L550)

***

<a id="applysankeylayout"></a>

### applySankeyLayout

> `const` **applySankeyLayout**: `TransformStage`

Defined in: [charts/Sankey/applyLayout.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Sankey/applyLayout.ts#L48)

***

<a id="applytreelayout"></a>

### applyTreeLayout

> `const` **applyTreeLayout**: `TransformStage`

Defined in: [charts/Tree/applyLayout.ts:272](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Tree/applyLayout.ts#L272)

***

<a id="applytreemaplayout"></a>

### applyTreemapLayout

> `const` **applyTreemapLayout**: `TransformStage`

Defined in: [charts/Treemap/applyLayout.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Treemap/applyLayout.ts#L24)

***

<a id="areaplot"></a>

### AreaPlot

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `baseline` | `0` |
| `discrete` | `"x"` |
| `shape` | `"Area"` |


Defined in: [charts/AreaPlot/index.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/AreaPlot/index.ts#L28)

Creates an area plot based on an array of data.

***

<a id="backfeature"></a>

### backFeature

> `const` **backFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:319](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L319)

Converts `drawBack.ts` to a FeatureModule. Visible only when there are
drill-down history entries; emits a "← Back" TextNode at the chart's
top-left and claims its line height + padding × 2 from `margin.top`.

***

<a id="barchart"></a>

### BarChart

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `baseline` | `0` |
| `discrete` | `"x"` |
| `shape` | `"Bar"` |
| `legend` | — |


Defined in: [charts/BarChart/index.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/BarChart/index.ts#L50)

Creates a bar chart based on an array of data.

***

<a id="boxwhisker"></a>

### BoxWhisker

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `discrete` | `"x"` |
| `shape` | `"Box"` |
| `tooltipConfig` | — |


Defined in: [charts/BoxWhisker/index.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/BoxWhisker/index.ts#L49)

Creates a simple box and whisker based on an array of data.

***

<a id="bumpchart"></a>

### BumpChart

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `discrete` | `"x"` |
| `shape` | `"Line"` |


Defined in: [charts/BumpChart/index.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/BumpChart/index.ts#L75)

Creates a bump chart based on an array of data.

***

<a id="colorscalefeature"></a>

### colorScaleFeature

> `const` **colorScaleFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:487](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L487)

Converts `drawColorScale.ts` to a FeatureModule.

Visible only when `_colorScale` is truthy and `_colorScalePosition` resolves
to a side. Renders the chart's `_colorScaleClass` ColorScale instance and
claims margin along its position side.

***

<a id="donut"></a>

### Donut

Extends [`Pie`](#pie) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `padPixel` | `2` |
| `innerRadius` | — |


Defined in: [charts/Donut/index.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Donut/index.ts#L42)

Extends the Pie visualization to create a donut chart.

***

<a id="geomap"></a>

### Geomap

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `fitObject` | `false` |
| `noDataMessage` | `false` |
| `ocean` | `"#d4dadc"` |
| `point` | `accessor(…)` |
| `pointSize` | `1` |
| `pointSizeMax` | `10` |
| `pointSizeMin` | `5` |
| `pointSizeScale` | `"linear"` |
| `projection` | — |
| `projectionPadding` | `parseSides(…)` |
| `shape` | `"Circle"` |
| `topojson` | `false` |
| `topojsonFill` | `"#f5f5f3"` |
| `topojsonFilter` | — |
| `topojsonId` | `accessor(…)` |
| `shapeConfig` | — |


Defined in: [charts/Geomap/index.ts:401](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Geomap/index.ts#L401)

Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points.

***

<a id="geomapdef"></a>

### geomapDef

> `const` **geomapDef**: `ChartDefinition`

Defined in: [charts/Geomap/index.ts:289](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Geomap/index.ts#L289)

***

<a id="legendfeature"></a>

### legendFeature

> `const` **legendFeature**: `FeatureModule`

Defined in: [charts/features/featuresLegend.ts:218](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/featuresLegend.ts#L218)

Converts `drawLegend.ts` to a FeatureModule.

Layout responsibility: roll filtered data up by paint attributes, configure
+ render the chart's `_legendClass` Legend instance (compute mode — Legend
contributes to the scene via its `toScene()` collected on Viz.toScene),
and return the margin claim corresponding to its outerBounds + padding.
No panel SceneNode is emitted — Legend is a component, not a panel; the
scene composition for Legend happens via Viz.toScene's `components` array.

***

<a id="lineplot"></a>

### LinePlot

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `discrete` | `"x"` |
| `shape` | `"Line"` |


Defined in: [charts/LinePlot/index.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/LinePlot/index.ts#L27)

Creates a line plot based on an array of data.

***

<a id="matrix"></a>

### Matrix

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `cellPadding` | `2` |
| `column` | `accessor(…)` |
| `row` | `accessor(…)` |
| `columnList` | — |
| `rowList` | — |
| `columnSort` | — |
| `rowSort` | — |
| `rowConfig` | `{…}` |
| `columnConfig` | `{…}` |
| `label` | — |


Defined in: [charts/Matrix/index.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Matrix/index.ts#L99)

Creates a simple rows/columns Matrix view of any dataset.

***

<a id="matrixdef"></a>

### matrixDef

> `const` **matrixDef**: `ChartDefinition`

Defined in: [charts/Matrix/index.ts:38](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Matrix/index.ts#L38)

***

<a id="network"></a>

### Network

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `links` | `[]` |
| `linkSize` | `1` |
| `linkSizeMin` | `1` |
| `linkSizeScale` | `"sqrt"` |
| `noDataMessage` | `false` |
| `nodeGroupBy` | `[]` |
| `nodes` | `[]` |
| `sizeMax` | — |
| `sizeMin` | `5` |
| `sizeScale` | `"sqrt"` |
| `shape` | `"Circle"` |
| `shapeConfig` | — |


Defined in: [charts/Network/index.ts:339](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Network/index.ts#L339)

Creates a network visualization based on a defined set of nodes and edges.

***

<a id="networkdef"></a>

### networkDef

> `const` **networkDef**: `ChartDefinition`

Defined in: [charts/Network/index.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Network/index.ts#L261)

***

<a id="pack"></a>

### Pack

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `layoutPadding` | `1` |
| `sort` | — |
| `sum` | `accessor(…)` |
| `packOpacity` | `0.25` |
| `shape` | `"Circle"` |
| `shapeConfig` | — |
| `legend` | — |
| `on` | — |


Defined in: [charts/Pack/index.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pack/index.ts#L161)

Uses the d3 pack layout to create a Circle Packing chart based on an array of data.

***

<a id="packdef"></a>

### packDef

> `const` **packDef**: `ChartDefinition`

Defined in: [charts/Pack/index.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pack/index.ts#L30)

***

<a id="pie"></a>

### Pie

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `innerRadius` | `0` |
| `padAngle` | — |
| `padPixel` | `0` |
| `value` | `accessor(…)` |
| `sort` | — |
| `legendSort` | — |
| `shapeConfig` | — |
| `tooltipConfig` | — |
| `legend` | — |


Defined in: [charts/Pie/index.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pie/index.ts#L106)

Uses the d3 pie layout to create SVG arcs based on an array of data.

***

<a id="piedef"></a>

### pieDef

> `const` **pieDef**: `DataDrivenChartDefinition`

Defined in: [charts/Pie/index.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pie/index.ts#L24)

***

<a id="priestley"></a>

### Priestley

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `paddingInner` | `0.05` |
| `paddingOuter` | `0.05` |
| `axisConfig` | `{…}` |
| `end` | `accessor(…)` |
| `start` | `accessor(…)` |
| `shapeConfig` | — |


Defined in: [charts/Priestley/index.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Priestley/index.ts#L89)

Creates a Priestley timeline based on an array of data.

***

<a id="priestleydef"></a>

### priestleyDef

> `const` **priestleyDef**: `ChartDefinition`

Defined in: [charts/Priestley/index.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Priestley/index.ts#L22)

***

<a id="radar"></a>

### Radar

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `discrete` | `"metric"` |
| `levels` | `6` |
| `metric` | `accessor(…)` |
| `outerPadding` | `100` |
| `shape` | `"Path"` |
| `value` | `accessor(…)` |
| `axisConfig` | — |


Defined in: [charts/Radar/index.ts:87](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Radar/index.ts#L87)

Creates a radar visualization based on an array of data.

***

<a id="radardef"></a>

### radarDef

> `const` **radarDef**: `ChartDefinition`

Defined in: [charts/Radar/index.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Radar/index.ts#L23)

***

<a id="radialmatrix"></a>

### RadialMatrix

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `cellPadding` | `2` |
| `column` | `accessor(…)` |
| `row` | `accessor(…)` |
| `columnList` | — |
| `rowList` | — |
| `columnSort` | — |
| `rowSort` | — |
| `innerRadius` | — |
| `columnConfig` | — |
| `label` | — |


Defined in: [charts/RadialMatrix/index.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/RadialMatrix/index.ts#L132)

Creates a radial layout of a rows/columns Matrix of any dataset.

***

<a id="radialmatrixdef"></a>

### radialMatrixDef

> `const` **radialMatrixDef**: `ChartDefinition`

Defined in: [charts/RadialMatrix/index.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/RadialMatrix/index.ts#L36)

***

<a id="reset"></a>

### RESET

> `const` **RESET**: `string` = `"D3PLUS-COMMON-RESET"`

Defined in: [utils/RESET.ts:2](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/RESET.ts#L2)

String constant used to reset an individual config property.

***

<a id="rings"></a>

### Rings

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `center` | — |
| `links` | `[]` |
| `linkSize` | `1` |
| `linkSizeMin` | `1` |
| `linkSizeScale` | `"sqrt"` |
| `noDataMessage` | `false` |
| `nodes` | `[]` |
| `sizeMax` | — |
| `sizeMin` | `5` |
| `sizeScale` | `"sqrt"` |
| `shape` | `"Circle"` |
| `shapeConfig` | — |


Defined in: [charts/Rings/index.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Rings/index.ts#L171)

Creates a ring visualization based on a defined set of nodes and edges.

***

<a id="ringsdef"></a>

### ringsDef

> `const` **ringsDef**: `ChartDefinition`

Defined in: [charts/Rings/index.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Rings/index.ts#L24)

***

<a id="sankey"></a>

### Sankey

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `iterations` | `6` |
| `links` | `accessor(…)` |
| `linkSort` | — |
| `linksSource` | `"source"` |
| `linksTarget` | `"target"` |
| `noDataMessage` | `false` |
| `nodes` | `accessor(…)` |
| `nodeAlign` | — |
| `nodeId` | `accessor(…)` |
| `nodePadding` | `8` |
| `nodeSort` | — |
| `nodeWidth` | `30` |
| `value` | `1` |
| `shape` | `"Rect"` |
| `shapeConfig` | — |
| `tooltipConfig` | — |


Defined in: [charts/Sankey/index.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Sankey/index.ts#L217)

Creates a Sankey visualization based on a defined set of nodes and links.

***

<a id="sankeydef"></a>

### sankeyDef

> `const` **sankeyDef**: `ChartDefinition`

Defined in: [charts/Sankey/index.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Sankey/index.ts#L37)

***

<a id="stackedarea"></a>

### StackedArea

Extends [`AreaPlot`](#areaplot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `stacked` | `true` |


Defined in: [charts/StackedArea/index.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/StackedArea/index.ts#L25)

Creates a stacked area plot based on an array of data.

***

<a id="subtitlefeature"></a>

### subtitleFeature

> `const` **subtitleFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:301](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L301)

Converts `drawSubtitle.ts` to a FeatureModule. Mirrors titleFeature.

***

<a id="timelinefeature"></a>

### timelineFeature

> `const` **timelineFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:398](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L398)

Converts `drawTimeline.ts` to a FeatureModule.

Visible only when `_time` is set, `_timeline` is truthy, and there is more
than one distinct tick. Renders the chart's `_timelineClass` Timeline
instance (compute mode — scene comes from Timeline.toScene via Viz.toScene's
components collection) and claims `margin.bottom` from its outerBounds.

***

<a id="titlefeature"></a>

### titleFeature

> `const` **titleFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:287](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L287)

Title as a FeatureModule. Uses `_titleClass._textData()` for height
(pure compute, no DOM) and returns the margin claim explicitly.

***

<a id="totalfeature"></a>

### totalFeature

> `const` **totalFeature**: `FeatureModule`

Defined in: [charts/features/features.ts:634](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/features.ts#L634)

Converts `drawTotal.ts` to a FeatureModule. Slightly different from title/
subtitle: the text comes from `sum()` over the filtered data when `_total`
is a function, or from `sum(data.map(_size))` when `_total === true`.

***

<a id="tree"></a>

### Tree

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `orient` | `"vertical"` |
| `separation` | — |
| `shape` | `"Circle"` |
| `shapeConfig` | — |
| `tooltipConfig` | — |
| `legendTooltip` | — |


Defined in: [charts/Tree/index.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Tree/index.ts#L98)

Uses d3's tree layout to create a tidy tree chart based on an array of data.

***

<a id="treedef"></a>

### treeDef

> `const` **treeDef**: `ChartDefinition`

Defined in: [charts/Tree/index.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Tree/index.ts#L26)

***

<a id="treemap"></a>

### Treemap

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `layoutPadding` | `1` |
| `sort` | — |
| `sum` | `accessor(…)` |
| `tile` | — |
| `shapeConfig` | — |
| `tooltipConfig` | — |
| `legendTooltip` | — |
| `legendSort` | — |
| `legend` | — |


Defined in: [charts/Treemap/index.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Treemap/index.ts#L161)

Uses the d3 treemap layout to create SVG rectangles based on an array of data.

***

<a id="treemapdef"></a>

### treemapDef

> `const` **treemapDef**: `ChartDefinition`

Defined in: [charts/Treemap/index.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Treemap/index.ts#L59)

## Interfaces

<a id="areaconfig-1"></a>

### AreaConfig

Defined in: [shapes/shapeConfig.ts:177](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L177)

Area-specific config (curve, defined, dual-edge x/y).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-curve"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:178](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L178) |
| <a id="property-data"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-defined"></a> `defined?` | (`d`: `DataPoint`) => `boolean` | - | - | [shapes/shapeConfig.ts:179](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L179) |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-hitarea"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-x"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-x0"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L180) |
| <a id="property-x1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L181) |
| <a id="property-y"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-y0"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L182) |
| <a id="property-y1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L183) |

***

<a id="axisconfig-2"></a>

### AxisConfig

Defined in: [utils/D3plusConfig.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L40)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-barconfig"></a> `barConfig?` | `Record`\<`string`, `string` \| `number`\> | [utils/D3plusConfig.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L41) |
| <a id="property-gridconfig"></a> `gridConfig?` | `Record`\<`string`, `string` \| `number`\> | [utils/D3plusConfig.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L42) |
| <a id="property-label-1"></a> `label?` | `string` | [utils/D3plusConfig.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L43) |
| <a id="property-labeloffset"></a> `labelOffset?` | `number` \| `false` | [utils/D3plusConfig.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L45) |
| <a id="property-labels"></a> `labels?` | `unknown`[] | [utils/D3plusConfig.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L44) |
| <a id="property-maxsize"></a> `maxSize?` | `number` | [utils/D3plusConfig.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L46) |
| <a id="property-scale-1"></a> `scale?` | `AxisScale` | [utils/D3plusConfig.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L47) |
| <a id="property-tickformat"></a> `tickFormat?` | (`d`: `string` \| `number`) => `string` \| `number` | [utils/D3plusConfig.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L48) |
| <a id="property-ticks"></a> `ticks?` | `unknown`[] | [utils/D3plusConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L49) |
| <a id="property-ticksize"></a> `tickSize?` | `number` | [utils/D3plusConfig.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L50) |
| <a id="property-title"></a> `title?` | `string` | [utils/D3plusConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L51) |

***

<a id="axislayout"></a>

### AxisLayout

Defined in: [components/Axis/Axis.ts:566](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L566)

Pure-function entry point for axis layout. Given a fully configured
`Axis` instance, runs the layout pass (no DOM) and returns a fresh result
bag — bounds, the d3 scale(s), a `getPosition` projector, plus the
laid-out tick state.

Callers who don't want to manage an Axis instance long-term can build
one on the fly, call this, and discard:

```ts
const axis = new AxisBottom()
  .domain([0, 100])
  .width(800).height(400)
  .data(data)
  .config(userAxisConfig);
const layout = computeAxisLayout(axis);
// layout.bounds, layout.getPosition, layout.d3Scale all populated.
```

This is the "no temp DOM, no test svg" path Plot's `_xTest`/`_yTest`
consume — see Plot._draw. Internally this is a thin wrapper over
`axis.measure()` returning a frozen snapshot of the laid-out state.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-availableticks"></a> `availableTicks` | `unknown`[] | [components/Axis/Axis.ts:573](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L573) |
| <a id="property-bounds"></a> `bounds` | `Record`\<`string`, `number`\> | [components/Axis/Axis.ts:567](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L567) |
| <a id="property-d3scale"></a> `d3Scale` | `any` | [components/Axis/Axis.ts:569](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L569) |
| <a id="property-d3scalenegative"></a> `d3ScaleNegative` | `any` | [components/Axis/Axis.ts:571](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L571) |
| <a id="property-getposition"></a> `getPosition` | (`d`: `unknown`) => `number` | [components/Axis/Axis.ts:572](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L572) |
| <a id="property-margin"></a> `margin` | `Record`\<`string`, `number`\> | [components/Axis/Axis.ts:575](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L575) |
| <a id="property-visibleticks"></a> `visibleTicks` | `unknown`[] | [components/Axis/Axis.ts:574](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L574) |

***

<a id="axislayoutresult"></a>

### AxisLayoutResult

Defined in: [components/Axis/axisLayout.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L47)

Result of `measureAxis()`. Holds layout artifacts the paint phase of
`Axis.render()` (and any caller that wants to construct a paint loop)
needs to consume. Most layout state also mutates onto the input `axis`
(`_d3Scale`, `_outerBounds`, `_margin`, etc.) so instance methods and
callers reading those slots stay in sync.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bounds-1"></a> `bounds` | `Record`\<`string`, `number`\> | [components/Axis/axisLayout.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L57) |
| <a id="property-hbuff"></a> `hBuff` | `number` | [components/Axis/axisLayout.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L53) |
| <a id="property-labelheight"></a> `labelHeight` | `number` | [components/Axis/axisLayout.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L56) |
| <a id="property-labels-1"></a> `labels` | `any`[] | [components/Axis/axisLayout.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L49) |
| <a id="property-range"></a> `range` | `number`[] | [components/Axis/axisLayout.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L50) |
| <a id="property-textdata"></a> `textData` | `any`[] | [components/Axis/axisLayout.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L51) |
| <a id="property-tickformat-1"></a> `tickFormat` | (`d`: `any`) => `string` | [components/Axis/axisLayout.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L52) |
| <a id="property-tickget"></a> `tickGet` | (`d`: `any`, `i?`: `number`) => `any` | [components/Axis/axisLayout.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L55) |
| <a id="property-ticks-1"></a> `ticks` | `any`[] | [components/Axis/axisLayout.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L48) |
| <a id="property-wbuff"></a> `wBuff` | `number` | [components/Axis/axisLayout.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/axisLayout.ts#L54) |

***

<a id="barconfig-7"></a>

### BarConfig

Defined in: [shapes/shapeConfig.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L192)

Bar-specific config (Rect + start/end coords).

#### Extends

- [`RectConfig`](#rectconfig-3)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-1"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`RectConfig`](#rectconfig-3).[`active`](#property-active-6) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-1"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`RectConfig`](#rectconfig-3).[`activeOpacity`](#property-activeopacity-6) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-1"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`RectConfig`](#rectconfig-3).[`activeStyle`](#property-activestyle-6) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-1"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`ariaLabel`](#property-arialabel-6) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-1"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`RectConfig`](#rectconfig-3).[`backgroundImage`](#property-backgroundimage-6) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-data-1"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`RectConfig`](#rectconfig-3).[`data`](#property-data-10) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-discrete-1"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`RectConfig`](#rectconfig-3).[`discrete`](#property-discrete-7) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-1"></a> `duration?` | `number` | Animation duration in ms. | [`RectConfig`](#rectconfig-3).[`duration`](#property-duration-8) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-1"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`RectConfig`](#rectconfig-3).[`fill`](#property-fill-6) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-1"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`RectConfig`](#rectconfig-3).[`fillOpacity`](#property-fillopacity-6) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-height"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`height`](#property-height-3) | [shapes/shapeConfig.ts:162](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L162) |
| <a id="property-hitarea-1"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`RectConfig`](#rectconfig-3).[`hitArea`](#property-hitarea-6) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-1"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`RectConfig`](#rectconfig-3).[`hover`](#property-hover-6) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-1"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverOpacity`](#property-hoveropacity-6) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-1"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverStyle`](#property-hoverstyle-6) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-1"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`RectConfig`](#rectconfig-3).[`id`](#property-id-7) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-2"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`RectConfig`](#rectconfig-3).[`label`](#property-label-8) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-1"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`RectConfig`](#rectconfig-3).[`labelBounds`](#property-labelbounds-6) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-1"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`RectConfig`](#rectconfig-3).[`labelConfig`](#property-labelconfig-6) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-1"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`RectConfig`](#rectconfig-3).[`on`](#property-on-7) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-1"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`RectConfig`](#rectconfig-3).[`opacity`](#property-opacity-7) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-1"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`RectConfig`](#rectconfig-3).[`pointerEvents`](#property-pointerevents-7) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode-1"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`RectConfig`](#rectconfig-3).[`renderMode`](#property-rendermode-6) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-1"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`role`](#property-role-6) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-1"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`RectConfig`](#rectconfig-3).[`rotate`](#property-rotate-6) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-1"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`rx`](#property-rx-6) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-1"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`ry`](#property-ry-6) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-2"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`RectConfig`](#rectconfig-3).[`scale`](#property-scale-7) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-1"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`RectConfig`](#rectconfig-3).[`select`](#property-select-8) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-1"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`RectConfig`](#rectconfig-3).[`shapeRendering`](#property-shaperendering-6) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-1"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`RectConfig`](#rectconfig-3).[`sort`](#property-sort-6) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-1"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`RectConfig`](#rectconfig-3).[`stroke`](#property-stroke-6) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-1"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`RectConfig`](#rectconfig-3).[`strokeDasharray`](#property-strokedasharray-6) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-1"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`RectConfig`](#rectconfig-3).[`strokeLinecap`](#property-strokelinecap-6) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-1"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`RectConfig`](#rectconfig-3).[`strokeOpacity`](#property-strokeopacity-6) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-1"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`RectConfig`](#rectconfig-3).[`strokeWidth`](#property-strokewidth-6) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-1"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`RectConfig`](#rectconfig-3).[`textAnchor`](#property-textanchor-6) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-1"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`RectConfig`](#rectconfig-3).[`texture`](#property-texture-6) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-1"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`RectConfig`](#rectconfig-3).[`textureDefault`](#property-texturedefault-6) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-1"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`RectConfig`](#rectconfig-3).[`vectorEffect`](#property-vectoreffect-6) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-1"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`RectConfig`](#rectconfig-3).[`verticalAlign`](#property-verticalalign-6) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-width"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`width`](#property-width-3) | [shapes/shapeConfig.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L161) |
| <a id="property-x-1"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`RectConfig`](#rectconfig-3).[`x`](#property-x-11) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-x0-1"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L193) |
| <a id="property-x1-1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L194) |
| <a id="property-y-1"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`RectConfig`](#rectconfig-3).[`y`](#property-y-11) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-y0-1"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L195) |
| <a id="property-y1-1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L196) |

***

<a id="baseshapeconfig"></a>

### BaseShapeConfig

Defined in: [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49)

Common props inherited from `Shape` — every shape subclass accepts
these via `.config(...)` regardless of geometry.

#### Extended by

- [`AreaConfig`](#areaconfig-1)
- [`CircleConfig`](#circleconfig-1)
- [`LineConfig`](#lineconfig-2)
- [`PathConfig`](#pathconfig-1)
- [`RectConfig`](#rectconfig-3)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-2"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-2"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-2"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-2"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-2"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-data-2"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-discrete-2"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-2"></a> `duration?` | `number` | Animation duration in ms. | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-2"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-2"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-hitarea-2"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-2"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-2"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-2"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-2"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-3"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-2"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-2"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-2"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-2"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-2"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode-2"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-2"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-2"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-2"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-2"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-3"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-2"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-2"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-2"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-2"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-2"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-2"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-2"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-2"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-2"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-2"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-2"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-2"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-2"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-x-2"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-y-2"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |

***

<a id="boxconfig-1"></a>

### BoxConfig

Defined in: [shapes/shapeConfig.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L216)

Box-specific config (whisker + median + outliers; subset of Shape).

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-3"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L217) |
| <a id="property-medianconfig"></a> `medianConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:218](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L218) |
| <a id="property-orient"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Orientation: "vertical" or "horizontal". | [shapes/shapeConfig.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L220) |
| <a id="property-outlier"></a> `outlier?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Outlier accessor (per-datum predicate). | [shapes/shapeConfig.ts:222](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L222) |
| <a id="property-outlierconfig"></a> `outlierConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:223](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L223) |
| <a id="property-rectconfig"></a> `rectConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:224](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L224) |
| <a id="property-rectwidth"></a> `rectWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:225](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L225) |
| <a id="property-select-3"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L226) |
| <a id="property-whiskerconfig"></a> `whiskerConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:227](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L227) |
| <a id="property-whiskermode"></a> `whiskerMode?` | `string` \| `number` \| (`string` \| `number`)[] | Whisker mode: single mode string/number or [low, high] pair. | [shapes/shapeConfig.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L229) |
| <a id="property-x-3"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L230) |
| <a id="property-y-3"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L231) |

***

<a id="circleconfig-1"></a>

### CircleConfig

Defined in: [shapes/shapeConfig.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L166)

Circle-specific config (radius).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-3"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-3"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-3"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-3"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-3"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-data-4"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-discrete-3"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-3"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-3"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-3"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-hitarea-3"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-3"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-3"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-3"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-3"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-4"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-3"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-3"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-3"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-3"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-3"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-r"></a> `r?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L167) |
| <a id="property-rendermode-3"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-3"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-3"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-3"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-3"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-4"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-4"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-3"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-3"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-3"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-3"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-3"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-3"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-3"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-3"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-3"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-3"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-3"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-3"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-x-4"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-y-4"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |

***

<a id="d3plusconfig"></a>

### D3plusConfig

Defined in: [utils/D3plusConfig.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L75)

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | [utils/D3plusConfig.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L82) |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | [utils/D3plusConfig.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L84) |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | [utils/D3plusConfig.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L86) |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | [utils/D3plusConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L88) |
| `colorScaleConfig.axisConfig?` | [`AxisConfig`](#axisconfig-2) | - | [utils/D3plusConfig.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L89) |
| `colorScaleConfig.centered?` | `boolean` | - | [utils/D3plusConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L90) |
| `colorScaleConfig.colorMax?` | `string` | - | [utils/D3plusConfig.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L94) |
| `colorScaleConfig.colorMid?` | `string` | - | [utils/D3plusConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L93) |
| `colorScaleConfig.colorMin?` | `string` | - | [utils/D3plusConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L92) |
| `colorScaleConfig.colors?` | `string`[] | - | [utils/D3plusConfig.ts:91](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L91) |
| `colorScaleConfig.scale?` | `AxisScale` | - | [utils/D3plusConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L95) |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` | Position of the color scale, or false to hide it. | [utils/D3plusConfig.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L98) |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | [utils/D3plusConfig.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L100) |
| <a id="property-data-5"></a> `data?` | `string` \| `DataPoint`[] | Data array or URL string to load data from. | [utils/D3plusConfig.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L77) |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | [utils/D3plusConfig.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L102) |
| <a id="property-discrete-4"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | [utils/D3plusConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L104) |
| <a id="property-duration-4"></a> `duration?` | `number` | Default duration of transitions, in milliseconds. | [utils/D3plusConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L106) |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | [utils/D3plusConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L108) |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: `DataPoint`) => `string` \| `number`) \| (`d`: `DataPoint`) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | [utils/D3plusConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L113) |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | [utils/D3plusConfig.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L119) |
| <a id="property-label-5"></a> `label?` | `string` \| `false` \| `string`[] \| `AccessorFn` | Label accessor for shapes. | [utils/D3plusConfig.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L121) |
| <a id="property-legend"></a> `legend?` | `boolean` | Whether to show the legend. | [utils/D3plusConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L123) |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | [utils/D3plusConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L125) |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | [utils/D3plusConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L126) |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | [utils/D3plusConfig.ts:127](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L127) |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` | Position of the legend. | [utils/D3plusConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L130) |
| <a id="property-legendtooltip"></a> `legendTooltip?` | [`TooltipConfig`](#tooltipconfig-3) | Tooltip configuration for legend items. | [utils/D3plusConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L132) |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | [utils/D3plusConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L134) |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` | Custom HTML content for the loading indicator. | [utils/D3plusConfig.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L138) |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | [utils/D3plusConfig.ts:136](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L136) |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | [utils/D3plusConfig.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L79) |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | [utils/D3plusConfig.ts:140](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L140) |
| <a id="property-ocean"></a> `ocean?` | `string` | Ocean color for geomaps (any CSS value including 'transparent'). | [utils/D3plusConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L142) |
| <a id="property-on-4"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | [utils/D3plusConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L144) |
| <a id="property-point"></a> `point?` | (`d`: `DataPoint`) => `number`[] | Coordinate accessor for point-based geomaps. | [utils/D3plusConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L146) |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: `DataPoint`) => `number`) | Point size accessor for geomaps. | [utils/D3plusConfig.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L148) |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | [utils/D3plusConfig.ts:152](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L152) |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | [utils/D3plusConfig.ts:150](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L150) |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | [utils/D3plusConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L154) |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | [utils/D3plusConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L156) |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | [utils/D3plusConfig.ts:158](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L158) |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | [utils/D3plusConfig.ts:160](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L160) |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` \| `Window` | Scrollable container selector for tooltip positioning. | [utils/D3plusConfig.ts:162](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L162) |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | [utils/D3plusConfig.ts:164](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L164) |
| `shapeConfig.duration?` | `number` | - | [utils/D3plusConfig.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L165) |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | [utils/D3plusConfig.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L169) |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | [utils/D3plusConfig.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L171) |
| <a id="property-stackorder"></a> `stackOrder?` | `string`[] | Custom order for stacked series. | [utils/D3plusConfig.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L173) |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | [utils/D3plusConfig.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L175) |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | [utils/D3plusConfig.ts:177](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L177) |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` | Label for the threshold group. | [utils/D3plusConfig.ts:179](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L179) |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | [utils/D3plusConfig.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L183) |
| <a id="property-tileurl"></a> `tileUrl?` | `string` | URL to XYZ map tiles. | [utils/D3plusConfig.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L181) |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | [utils/D3plusConfig.ts:185](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L185) |
| <a id="property-title-1"></a> `title?` | `string` \| ((`data`: `DataPoint`[]) => `string`) | Chart title or title accessor function. | [utils/D3plusConfig.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L187) |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | [utils/D3plusConfig.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L189) |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` | Whether to show tooltips. | [utils/D3plusConfig.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L191) |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | [`TooltipConfig`](#tooltipconfig-3) | Configuration for the tooltip component. | [utils/D3plusConfig.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L193) |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | [utils/D3plusConfig.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L195) |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | [utils/D3plusConfig.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L197) |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | [utils/D3plusConfig.ts:199](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L199) |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | [utils/D3plusConfig.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L201) |
| <a id="property-x-5"></a> `x?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for x-axis values. | [utils/D3plusConfig.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L203) |
| <a id="property-xconfig"></a> `xConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the x-axis. | [utils/D3plusConfig.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L205) |
| <a id="property-xsort"></a> `xSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for x-axis values. | [utils/D3plusConfig.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L207) |
| <a id="property-y-5"></a> `y?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for y-axis values. | [utils/D3plusConfig.ts:209](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L209) |
| <a id="property-yconfig"></a> `yConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the y-axis. | [utils/D3plusConfig.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L211) |
| <a id="property-ysort"></a> `ySort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for y-axis values. | [utils/D3plusConfig.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L213) |
| <a id="property-zoom"></a> `zoom?` | `boolean` | Set to false to disable zooming on Geomap and Network. | [utils/D3plusConfig.ts:215](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L215) |

***

<a id="imageconfig"></a>

### ImageConfig

Defined in: [shapes/shapeConfig.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L200)

Image-specific config (url + dimensions).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-6"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L201) |
| <a id="property-duration-5"></a> `duration?` | `number` | - | [shapes/shapeConfig.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L202) |
| <a id="property-height-1"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L203) |
| <a id="property-id-4"></a> `id?` | `AccessorFn` | - | [shapes/shapeConfig.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L204) |
| <a id="property-opacity-4"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L205) |
| <a id="property-pointerevents-4"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | [shapes/shapeConfig.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L206) |
| <a id="property-select-5"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L207) |
| <a id="property-url"></a> `url?` | `AccessorFn` | URL accessor returning the image src. | [shapes/shapeConfig.ts:209](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L209) |
| <a id="property-width-1"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:210](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L210) |
| <a id="property-x-6"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L211) |
| <a id="property-y-6"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L212) |

***

<a id="lineconfig-2"></a>

### LineConfig

Defined in: [shapes/shapeConfig.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L171)

Line-specific config (curve + defined).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-4"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-4"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-4"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-4"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-4"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-curve-1"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L172) |
| <a id="property-data-7"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-defined-1"></a> `defined?` | `AccessorFn` | - | - | [shapes/shapeConfig.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L173) |
| <a id="property-discrete-5"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-6"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-4"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-4"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-hitarea-4"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-4"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-4"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-4"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-5"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-6"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-4"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-4"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-5"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-5"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-5"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode-4"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-4"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-4"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-4"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-4"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-5"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-6"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-4"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-4"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-4"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-4"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-4"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-4"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-4"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-4"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-4"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-4"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-4"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-4"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-x-7"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-y-7"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |

***

<a id="margin"></a>

### Margin

Defined in: [charts/viz/vizTypes.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L33)

Margin object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom"></a> `bottom` | `number` | [charts/viz/vizTypes.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L35) |
| <a id="property-left"></a> `left` | `number` | [charts/viz/vizTypes.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L36) |
| <a id="property-right"></a> `right` | `number` | [charts/viz/vizTypes.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L37) |
| <a id="property-top"></a> `top` | `number` | [charts/viz/vizTypes.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L34) |

***

<a id="padding"></a>

### Padding

Defined in: [charts/viz/vizTypes.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L41)

Padding object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom-1"></a> `bottom` | `number` | [charts/viz/vizTypes.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L43) |
| <a id="property-left-1"></a> `left` | `number` | [charts/viz/vizTypes.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L44) |
| <a id="property-right-1"></a> `right` | `number` | [charts/viz/vizTypes.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L45) |
| <a id="property-top-1"></a> `top` | `number` | [charts/viz/vizTypes.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L42) |

***

<a id="pathconfig-1"></a>

### PathConfig

Defined in: [shapes/shapeConfig.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L187)

Path-specific config (raw SVG path d string or generator).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-5"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-5"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-5"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-5"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-5"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-d"></a> `d?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L188) |
| <a id="property-data-8"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-discrete-6"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-7"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-5"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-5"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-hitarea-5"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-5"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-5"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-5"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-6"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-7"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-5"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-5"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-6"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-6"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-6"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode-5"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-5"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-5"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-5"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-5"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-6"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-7"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-5"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-5"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-5"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-5"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-5"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-5"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-5"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-5"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-5"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-5"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-5"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-5"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-x-8"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-y-8"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |

***

<a id="plotmeasureresult"></a>

### PlotMeasureResult

Defined in: [charts/features/plotPaint.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L194)

Result of the MEASURE phase of plotPaint. Captures everything the EMIT
phase needs to know that was computed/reassigned during measure:
  - `x`/`y`: the production-axis accessor closures (reassigned by
    measure onto `viz._xFunc`/`viz._yFunc`).
  - `xRange`/`yRange`: recomputed from the production axes' outer
    bounds.
  - `xOffsetLeft`/`xOffsetRight`/`yWidth`/`y2Width`/`yBounds`/`y2Bounds`:
    production-axis bounds (the pCtx values were throwaway test-axis
    measurements; these are the real ones).
  - `axisSceneQueue`: deferred axis scenes, populated during measure
    and drained at the END of emit (so axes layer above shapes).
  - `yOffset`: half the x-axis bar stroke width — used to nudge
    annotation and shape y0/y1 baselines so shapes don't visually
    overlap the axis stroke.
  - `labelPositions`: map of line-label id → bumped y position
    (computed from `labelWidths`); read by the line-label
    `labelBounds` config in emit.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-axisscenequeue"></a> `axisSceneQueue` | `object`[] | [charts/features/plotPaint.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L205) |
| <a id="property-labelpositions"></a> `labelPositions` | `Record`\<`string`, `number`\> | [charts/features/plotPaint.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L207) |
| <a id="property-x-9"></a> `x` | `PlotAxisFn` | [charts/features/plotPaint.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L195) |
| <a id="property-xoffsetleft"></a> `xOffsetLeft` | `number` | [charts/features/plotPaint.ts:199](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L199) |
| <a id="property-xoffsetright"></a> `xOffsetRight` | `number` | [charts/features/plotPaint.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L200) |
| <a id="property-xrange"></a> `xRange` | `number`[] | [charts/features/plotPaint.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L197) |
| <a id="property-y-9"></a> `y` | `PlotAxisFn` | [charts/features/plotPaint.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L196) |
| <a id="property-y2bounds"></a> `y2Bounds` | `object` | [charts/features/plotPaint.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L204) |
| `y2Bounds.height` | `number` | [charts/features/plotPaint.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L204) |
| `y2Bounds.width` | `number` | [charts/features/plotPaint.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L204) |
| `y2Bounds.x` | `number` | [charts/features/plotPaint.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L204) |
| `y2Bounds.y` | `number` | [charts/features/plotPaint.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L204) |
| <a id="property-y2width"></a> `y2Width` | `number` \| *required* | [charts/features/plotPaint.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L202) |
| <a id="property-ybounds"></a> `yBounds` | `object` | [charts/features/plotPaint.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L203) |
| `yBounds.height` | `number` | [charts/features/plotPaint.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L203) |
| `yBounds.width` | `number` | [charts/features/plotPaint.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L203) |
| `yBounds.x` | `number` | [charts/features/plotPaint.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L203) |
| `yBounds.y` | `number` | [charts/features/plotPaint.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L203) |
| <a id="property-yoffset"></a> `yOffset` | `number` | [charts/features/plotPaint.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L206) |
| <a id="property-yrange"></a> `yRange` | `number`[] | [charts/features/plotPaint.ts:198](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L198) |
| <a id="property-ywidth"></a> `yWidth` | `number` \| *required* | [charts/features/plotPaint.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L201) |

***

<a id="plotpaintcontext"></a>

### PlotPaintContext

Defined in: [charts/features/plotPaint.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L102)

Cross-phase locals threaded from `Plot._draw` (and its extracted pipeline
stages) into `plotPaint` — the contract any consumer of `plotPaint` must
supply.

Grouped by what populates them:
  - **Data + domain** (formatPlotData / computePlotInitialDomains):
    `data`, `shapeData`, `axisData`, `domains`, `discreteKeys`,
    `stackData`, `stackKeys`, `xData/yData/x2Data/y2Data`,
    `xDomain/yDomain/x2Domain/y2Domain`.
  - **Accessors + scales** (computePlotScales):
    `x`, `y`, `x2`, `y2`, `xScale`/`yScale`/`x2Scale`/`y2Scale`,
    `xConfigScale`/`yConfigScale`/`x2ConfigScale`/`y2ConfigScale`.
    `x` and `y` are reassigned during paint (`viz._xFunc = x = ...`).
  - **Axis configs + visibility** (preparePlotAxisLayout):
    `defaultConfig`, `defaultX2Config`, `defaultY2Config`,
    `showX`, `showY`, `x2Exists`, `y2Exists`, `xC`, `yC`.
  - **Axis measurements** (preparePlotAxisLayout + measurePlotLineLabels):
    `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks`, `labelWidths`, `largestLabel`,
    `xRangeMax`, `xTest`/`yTest`/`x2Test`/`y2Test` (transient axis
    instances), `xTestRange`/`x2TestRange`.
  - **Layout offsets + viewport** (preparePlotAxisLayout):
    `yBounds`/`yWidth`/`xOffsetLeft`/`y2Bounds`/`y2Width`/`xOffsetRight`
    (REASSIGNED by paint from production axes), `xHeight`, `x2Height`,
    `topOffset`, `height`, `width`, `horizontalMargin`, `verticalMargin`.
  - **Paint plumbing** (Plot._draw): `opp`, `barLabels`,
    `showLineLabels`, `stackGroup`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-axisdata"></a> `axisData` | `DataPoint`[] | [charts/features/plotPaint.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L106) |
| <a id="property-barlabels"></a> `barLabels` | `string`[] | [charts/features/plotPaint.ts:170](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L170) |
| <a id="property-data-9"></a> `data` | `DataPoint`[] | [charts/features/plotPaint.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L104) |
| <a id="property-defaultconfig"></a> `defaultConfig` | `Record`\<`string`, `unknown`\> | [charts/features/plotPaint.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L131) |
| <a id="property-defaultx2config"></a> `defaultX2Config` | `Record`\<`string`, `unknown`\> | [charts/features/plotPaint.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L132) |
| <a id="property-defaulty2config"></a> `defaultY2Config` | `Record`\<`string`, `unknown`\> | [charts/features/plotPaint.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L133) |
| <a id="property-discretekeys"></a> `discreteKeys` | `unknown`[] | [charts/features/plotPaint.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L108) |
| <a id="property-domains"></a> `domains` | `Record`\<`string`, `number`[]\> | [charts/features/plotPaint.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L107) |
| <a id="property-height-2"></a> `height` | `number` | [charts/features/plotPaint.ts:164](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L164) |
| <a id="property-horizontalmargin"></a> `horizontalMargin` | `number` | [charts/features/plotPaint.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L166) |
| <a id="property-labelwidths"></a> `labelWidths` | `LabelWidth`[] | [charts/features/plotPaint.ts:145](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L145) |
| <a id="property-largestlabel"></a> `largestLabel` | `number` | [charts/features/plotPaint.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L146) |
| <a id="property-opp"></a> `opp` | `"x"` \| `"y"` \| *required* | [charts/features/plotPaint.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L169) |
| <a id="property-shapedata"></a> `shapeData` | \[`string`, `DataPoint`[]\][] | [charts/features/plotPaint.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L105) |
| <a id="property-showlinelabels"></a> `showLineLabels` | `boolean` | [charts/features/plotPaint.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L171) |
| <a id="property-showx"></a> `showX` | `boolean` | [charts/features/plotPaint.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L134) |
| <a id="property-showy"></a> `showY` | `boolean` | [charts/features/plotPaint.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L135) |
| <a id="property-stackdata"></a> `stackData` | `number`[][][] | [charts/features/plotPaint.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L109) |
| <a id="property-stackgroup"></a> `stackGroup` | `unknown` | [charts/features/plotPaint.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L172) |
| <a id="property-stackkeys"></a> `stackKeys` | `unknown`[] | [charts/features/plotPaint.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L110) |
| <a id="property-topoffset"></a> `topOffset` | `number` | [charts/features/plotPaint.ts:163](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L163) |
| <a id="property-verticalmargin"></a> `verticalMargin` | `number` | [charts/features/plotPaint.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L167) |
| <a id="property-width-2"></a> `width` | `number` | [charts/features/plotPaint.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L165) |
| <a id="property-x-10"></a> `x` | `PlotAxisFn` | [charts/features/plotPaint.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L120) |
| <a id="property-x2"></a> `x2` | `PlotAxisFn` | [charts/features/plotPaint.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L122) |
| <a id="property-x2configscale"></a> `x2ConfigScale` | `string` | [charts/features/plotPaint.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L128) |
| <a id="property-x2data"></a> `x2Data` | `unknown`[] | [charts/features/plotPaint.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L113) |
| <a id="property-x2domain"></a> `x2Domain` | `number`[] | [charts/features/plotPaint.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L117) |
| <a id="property-x2exists"></a> `x2Exists` | `boolean` | [charts/features/plotPaint.ts:136](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L136) |
| <a id="property-x2height"></a> `x2Height` | `number` | [charts/features/plotPaint.ts:162](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L162) |
| <a id="property-x2test"></a> `x2Test` | [`Axis`](#axis) | [charts/features/plotPaint.ts:150](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L150) |
| <a id="property-x2testrange"></a> `x2TestRange` | `number`[] | [charts/features/plotPaint.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L153) |
| <a id="property-x2ticks"></a> `x2Ticks` | `unknown`[] | [charts/features/plotPaint.ts:143](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L143) |
| <a id="property-xc"></a> `xC` | `Record`\<`string`, `unknown`\> | [charts/features/plotPaint.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L138) |
| <a id="property-xconfigscale"></a> `xConfigScale` | `string` | [charts/features/plotPaint.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L126) |
| <a id="property-xdata"></a> `xData` | `unknown`[] | [charts/features/plotPaint.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L111) |
| <a id="property-xdomain"></a> `xDomain` | `number`[] | [charts/features/plotPaint.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L115) |
| <a id="property-xheight"></a> `xHeight` | `number` | [charts/features/plotPaint.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L161) |
| <a id="property-xoffsetleft-1"></a> `xOffsetLeft` | `number` | [charts/features/plotPaint.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L159) |
| <a id="property-xoffsetright-1"></a> `xOffsetRight` | `number` | [charts/features/plotPaint.ts:160](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L160) |
| <a id="property-xrangemax"></a> `xRangeMax` | `number` | [charts/features/plotPaint.ts:147](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L147) |
| <a id="property-xscale"></a> `xScale` | `string` | [charts/features/plotPaint.ts:124](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L124) |
| <a id="property-xtest"></a> `xTest` | [`Axis`](#axis) | [charts/features/plotPaint.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L148) |
| <a id="property-xtestrange"></a> `xTestRange` | `number`[] | [charts/features/plotPaint.ts:152](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L152) |
| <a id="property-xticks"></a> `xTicks` | `unknown`[] | [charts/features/plotPaint.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L141) |
| <a id="property-y-10"></a> `y` | `PlotAxisFn` | [charts/features/plotPaint.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L121) |
| <a id="property-y2"></a> `y2` | `PlotAxisFn` | [charts/features/plotPaint.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L123) |
| <a id="property-y2bounds-1"></a> `y2Bounds` | `object` | [charts/features/plotPaint.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L156) |
| `y2Bounds.height` | `number` | [charts/features/plotPaint.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L156) |
| `y2Bounds.width` | `number` | [charts/features/plotPaint.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L156) |
| `y2Bounds.x` | `number` | [charts/features/plotPaint.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L156) |
| `y2Bounds.y` | `number` | [charts/features/plotPaint.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L156) |
| <a id="property-y2configscale"></a> `y2ConfigScale` | `string` | [charts/features/plotPaint.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L129) |
| <a id="property-y2data"></a> `y2Data` | `unknown`[] | [charts/features/plotPaint.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L114) |
| <a id="property-y2domain"></a> `y2Domain` | `number`[] | [charts/features/plotPaint.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L118) |
| <a id="property-y2exists"></a> `y2Exists` | `boolean` | [charts/features/plotPaint.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L137) |
| <a id="property-y2test"></a> `y2Test` | [`Axis`](#axis) | [charts/features/plotPaint.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L151) |
| <a id="property-y2ticks"></a> `y2Ticks` | `unknown`[] | [charts/features/plotPaint.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L144) |
| <a id="property-y2width-1"></a> `y2Width` | `number` \| *required* | [charts/features/plotPaint.ts:158](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L158) |
| <a id="property-ybounds-1"></a> `yBounds` | `object` | [charts/features/plotPaint.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L155) |
| `yBounds.height` | `number` | [charts/features/plotPaint.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L155) |
| `yBounds.width` | `number` | [charts/features/plotPaint.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L155) |
| `yBounds.x` | `number` | [charts/features/plotPaint.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L155) |
| `yBounds.y` | `number` | [charts/features/plotPaint.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L155) |
| <a id="property-yc"></a> `yC` | `Record`\<`string`, `unknown`\> | [charts/features/plotPaint.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L139) |
| <a id="property-yconfigscale"></a> `yConfigScale` | `string` | [charts/features/plotPaint.ts:127](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L127) |
| <a id="property-ydata"></a> `yData` | `unknown`[] | [charts/features/plotPaint.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L112) |
| <a id="property-ydomain"></a> `yDomain` | `number`[] | [charts/features/plotPaint.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L116) |
| <a id="property-yscale"></a> `yScale` | `string` | [charts/features/plotPaint.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L125) |
| <a id="property-ytest"></a> `yTest` | [`Axis`](#axis) | [charts/features/plotPaint.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L149) |
| <a id="property-yticks"></a> `yTicks` | `unknown`[] | [charts/features/plotPaint.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L142) |
| <a id="property-ywidth-1"></a> `yWidth` | `number` \| *required* | [charts/features/plotPaint.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/plotPaint.ts#L157) |

***

<a id="rectconfig-3"></a>

### RectConfig

Defined in: [shapes/shapeConfig.ts:160](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L160)

Rect-specific config (width + height on top of base).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Extended by

- [`BarConfig`](#barconfig-7)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-6"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activeopacity-6"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-activestyle-6"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L58) |
| <a id="property-arialabel-6"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimage-6"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L63) |
| <a id="property-data-10"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L51) |
| <a id="property-discrete-7"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L66) |
| <a id="property-duration-8"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-fill-6"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-fillopacity-6"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-height-3"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:162](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L162) |
| <a id="property-hitarea-6"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hover-6"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-hoveropacity-6"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hoverstyle-6"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L80) |
| <a id="property-id-7"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-label-8"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L90) |
| <a id="property-labelbounds-6"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L92) |
| <a id="property-labelconfig-6"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L96) |
| <a id="property-on-7"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-opacity-7"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L99) |
| <a id="property-pointerevents-7"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-rendermode-6"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-role-6"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L103) |
| <a id="property-rotate-6"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rx-6"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-ry-6"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L110) |
| <a id="property-scale-7"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L112) |
| <a id="property-select-8"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-shaperendering-6"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-sort-6"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L123) |
| <a id="property-stroke-6"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L126) |
| <a id="property-strokedasharray-6"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-strokelinecap-6"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L130) |
| <a id="property-strokeopacity-6"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L132) |
| <a id="property-strokewidth-6"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L134) |
| <a id="property-textanchor-6"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-texture-6"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-texturedefault-6"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L141) |
| <a id="property-vectoreffect-6"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-verticalalign-6"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-width-3"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L161) |
| <a id="property-x-11"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-y-11"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |

***

<a id="shapelike"></a>

### ShapeLike

Defined in: [charts/features/emitHelpers.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L47)

Structural minimum a Shape (or shape-like component: TextBox, Axis)
must satisfy for the helpers below to work with it. Captures only the
members the helpers touch — `render()`, optional `toScene()`, and an
optional inner `_labelClass` with its own `toScene()`.

Replaces the previous `shape: any` parameter on `collectComputed` and
`absorbShapeIntoChartScene` — both helpers consume the same surface
regardless of whether the actual instance is a `Shape` subclass, a
`TextBox`, an `Axis`, or anything else that exposes these members.

#### Methods

<a id="render-21"></a>

##### render()

> **render**(): `unknown`

Defined in: [charts/features/emitHelpers.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L48)

###### Returns

`unknown`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-_labelclass-8"></a> `_labelClass?` | `object` | [charts/features/emitHelpers.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L50) |
| `_labelClass.toScene?` | () => `GroupNode` \| `null` \| *required* | [charts/features/emitHelpers.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L51) |
| <a id="property-toscene"></a> `toScene?` | () => `GroupNode` \| `null` \| *required* | [charts/features/emitHelpers.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L49) |

***

<a id="tooltipconfig-3"></a>

### TooltipConfig

Defined in: [utils/D3plusConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L54)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-body"></a> `body?` | `string` \| ((`d`: `DataPoint`) => `string`) | [utils/D3plusConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L56) |
| <a id="property-tbody"></a> `tbody?` | ((`d`: `DataPoint`) => \[`string`, `string`\][]) \| (`string` \| ((`d`: `DataPoint`, `i?`: `number`, `x?`: `object`) => `string`))[][] | [utils/D3plusConfig.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L65) |
| <a id="property-thead"></a> `thead?` | ((`d`: `DataPoint`) => \[`string`, `string`\][]) \| (`string` \| ((`d`: `DataPoint`, `i?`: `number`, `x?`: `object`) => `string`))[][] | [utils/D3plusConfig.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L57) |
| <a id="property-title-2"></a> `title?` | `string` \| ((`d`: `DataPoint`) => `string`) | [utils/D3plusConfig.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L55) |

***

<a id="vizcontext"></a>

### VizContext

Defined in: [charts/pipeline/vizContext.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L34)

The shape of every field vizPreDraw + vizDraw can populate. Currently
permissive (any) for the closure-typed helpers (_id, _ids, _drawLabel,
_thresholdName, _thresholdData). As subclasses formalize their typed
contexts, this can tighten.

#### Extends

- `Record`\<`string`, `any`\>

#### Indexable

> \[`key`: `string`\]: `any`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drawdepth"></a> `drawDepth?` | `number` | Effective draw depth (capped to groupBy.length - 1). | [charts/pipeline/vizContext.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L36) |
| <a id="property-drawlabel"></a> `drawLabel?` | (`d`: `DataPoint`, `i`: `number`, `depth?`: `number`) => `string` | Human-readable label-per-datum accessor (handles aggregation labels). | [charts/pipeline/vizContext.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L43) |
| <a id="property-filtereddata"></a> `filteredData?` | `DataPoint`[] | Data after filter + timeFilter + threshold are applied. | [charts/pipeline/vizContext.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L45) |
| <a id="property-id-8"></a> `id?` | (`d`: `DataPoint`, `i`: `number`) => `any` | Unique-id-per-datum accessor (depth-scoped). | [charts/pipeline/vizContext.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L39) |
| <a id="property-ids"></a> `ids?` | (`d`: `DataPoint`, `i`: `number`) => `string`[] | Array-of-ids-per-datum accessor. | [charts/pipeline/vizContext.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L41) |
| <a id="property-legenddata"></a> `legendData?` | `DataPoint`[] | Per-id rank order used by legend + treemap label sorting. | [charts/pipeline/vizContext.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L47) |
| <a id="property-nodatamessage"></a> `noDataMessage?` | `boolean` | Whether a "no data" message should currently be visible. | [charts/pipeline/vizContext.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L49) |

***

<a id="vizinstance"></a>

### VizInstance

Defined in: [charts/viz/vizTypes.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L75)

The structural contract free functions read/write on a chart instance.
Class instances satisfy it via their `[key: string]: any` signature;
chart-specific extensions (TreeViz, PieViz, etc.) add stash slots.

#### Methods

<a id="_draw"></a>

##### \_draw()

> **\_draw**(`callback?`: () => `void`): `void`

Defined in: [charts/viz/vizTypes.ts:228](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L228)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`void`

<a id="_drawscenetotarget-2"></a>

##### \_drawSceneToTarget()

> **\_drawSceneToTarget**(`durationOverride?`: `number`): `void`

Defined in: [charts/viz/vizTypes.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L229)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `durationOverride?` | `number` |

###### Returns

`void`

<a id="_predraw"></a>

##### \_preDraw()

> **\_preDraw**(): `void`

Defined in: [charts/viz/vizTypes.ts:227](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L227)

###### Returns

`void`

<a id="_schedulescenerepaint-2"></a>

##### \_scheduleSceneRepaint()

> **\_scheduleSceneRepaint**(): `void`

Defined in: [charts/viz/vizTypes.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L230)

###### Returns

`void`

<a id="_thresholdfunction"></a>

##### \_thresholdFunction()?

> `optional` **\_thresholdFunction**(`data`: `DataPoint`[], `tree?`: `any`): `DataPoint`[]

Defined in: [charts/viz/vizTypes.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L232)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `DataPoint`[] |
| `tree?` | `any` |

###### Returns

`DataPoint`[]

<a id="active-12"></a>

##### active()?

> `optional` **active**(`_?`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:235](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L235)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `any` |

###### Returns

`any`

<a id="config-20"></a>

##### config()?

> `optional` **config**(`_?`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:234](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L234)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `any` |

###### Returns

`any`

<a id="hover-12"></a>

##### hover()?

> `optional` **hover**(`_?`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:236](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L236)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `any` |

###### Returns

`any`

<a id="toscene-21"></a>

##### toScene()?

> `optional` **toScene**(): `any`

Defined in: [charts/viz/vizTypes.ts:233](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L233)

###### Returns

`any`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-_active"></a> `_active?` | `false` \| ((`d`: `DataPoint`, `i?`: `number`) => `boolean`) | - | [charts/viz/vizTypes.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L154) |
| <a id="property-_aggs"></a> `_aggs` | `Record`\<`string`, (`leaves`: `DataPoint`[]) => `unknown`\> | - | [charts/viz/vizTypes.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L104) |
| <a id="property-_annotations"></a> `_annotations?` | `any`[] | - | [charts/viz/vizTypes.ts:178](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L178) |
| <a id="property-_attribution"></a> `_attribution?` | `string` \| `false` | - | [charts/viz/vizTypes.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L206) |
| <a id="property-_attributionstyle"></a> `_attributionStyle?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L207) |
| <a id="property-_axisconfig"></a> `_axisConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L135) |
| <a id="property-_axispersist"></a> `_axisPersist?` | `boolean` | - | [charts/viz/vizTypes.ts:179](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L179) |
| <a id="property-_backclass"></a> `_backClass?` | `any` | - | [charts/viz/vizTypes.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L195) |
| <a id="property-_backconfig"></a> `_backConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L132) |
| <a id="property-_backgroundconfig"></a> `_backgroundConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L128) |
| <a id="property-_barpadding"></a> `_barPadding?` | `number` | - | [charts/viz/vizTypes.ts:176](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L176) |
| <a id="property-_baseline"></a> `_baseline?` | `number` | - | [charts/viz/vizTypes.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L169) |
| <a id="property-_brushing"></a> `_brushing?` | `boolean` | - | [charts/viz/vizTypes.ts:160](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L160) |
| <a id="property-_buffer"></a> `_buffer?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L187) |
| <a id="property-_chartscene"></a> `_chartScene?` | `SceneNode`[] | - | [charts/viz/vizTypes.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L138) |
| <a id="property-_charttransform"></a> `_chartTransform?` | `Transform` | - | [charts/viz/vizTypes.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L139) |
| <a id="property-_colorscale-1"></a> `_colorScale?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) | - | [charts/viz/vizTypes.ts:203](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L203) |
| <a id="property-_colorscaleclass"></a> `_colorScaleClass?` | `any` | - | [charts/viz/vizTypes.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L191) |
| <a id="property-_colorscaleconfig"></a> `_colorScaleConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:130](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L130) |
| <a id="property-_colorscaleposition"></a> `_colorScalePosition?` | (`config`: `any`) => `string` \| `false` | - | [charts/viz/vizTypes.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L202) |
| <a id="property-_confidence"></a> `_confidence?` | `false` \| \[`number`, `number`\] | - | [charts/viz/vizTypes.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L173) |
| <a id="property-_confidenceconfig"></a> `_confidenceConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L183) |
| <a id="property-_container"></a> `_container?` | [`D3Selection`](#d3selection) | - | [charts/viz/vizTypes.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L212) |
| <a id="property-_data-20"></a> `_data` | `DataPoint`[] | - | [charts/viz/vizTypes.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L89) |
| <a id="property-_datacutoff"></a> `_dataCutoff` | `number` | - | [charts/viz/vizTypes.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L159) |
| <a id="property-_depth"></a> `_depth?` | `number` | - | [charts/viz/vizTypes.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L101) |
| <a id="property-_discrete"></a> `_discrete?` | `"x"` \| `"y"` | - | [charts/viz/vizTypes.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L103) |
| <a id="property-_discretecutoff"></a> `_discreteCutoff?` | `number` | - | [charts/viz/vizTypes.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L186) |
| <a id="property-_drawdepth"></a> `_drawDepth` | `number` | - | [charts/viz/vizTypes.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L102) |
| <a id="property-_drawlabel"></a> `_drawLabel` | (`d`: `DataPoint`, `i`: `number`, `depth?`: `number`) => `string` | - | [charts/viz/vizTypes.ts:109](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L109) |
| <a id="property-_duration"></a> `_duration` | `number` | - | [charts/viz/vizTypes.ts:150](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L150) |
| <a id="property-_featurepanels"></a> `_featurePanels?` | `SceneNode`[] | - | [charts/viz/vizTypes.ts:140](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L140) |
| <a id="property-_filter"></a> `_filter?` | (`d`: `DataPoint`, `i`: `number`) => `boolean` | - | [charts/viz/vizTypes.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L95) |
| <a id="property-_filtereddata"></a> `_filteredData` | `DataPoint`[] | - | [charts/viz/vizTypes.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L90) |
| <a id="property-_focus"></a> `_focus?` | `string` \| `number` | - | [charts/viz/vizTypes.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L153) |
| <a id="property-_formatteddata"></a> `_formattedData?` | `DataPoint`[] | - | [charts/viz/vizTypes.ts:91](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L91) |
| <a id="property-_groupby"></a> `_groupBy` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`[] | - | [charts/viz/vizTypes.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L100) |
| <a id="property-_grouppadding"></a> `_groupPadding?` | `number` | - | [charts/viz/vizTypes.ts:177](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L177) |
| <a id="property-_height"></a> `_height` | `number` | - | [charts/viz/vizTypes.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L84) |
| <a id="property-_hidden"></a> `_hidden` | (`string` \| `number`)[] | - | [charts/viz/vizTypes.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L93) |
| <a id="property-_hover"></a> `_hover?` | `false` \| ((`d`: `DataPoint`, `i?`: `number`) => `boolean`) | - | [charts/viz/vizTypes.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L155) |
| <a id="property-_hoverdatum"></a> `_hoverDatum?` | `DataPoint` \| `null` | - | [charts/viz/vizTypes.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L156) |
| <a id="property-_id"></a> `_id` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` | - | [charts/viz/vizTypes.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L107) |
| <a id="property-_ids"></a> `_ids` | (`d`: `DataPoint`, `i`: `number`) => `string`[] | - | [charts/viz/vizTypes.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L108) |
| <a id="property-_label"></a> `_label?` | (`d`: `DataPoint`, `i`: `number`) => `string` | - | [charts/viz/vizTypes.ts:119](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L119) |
| <a id="property-_labelconnectorconfig"></a> `_labelConnectorConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L181) |
| <a id="property-_labelposition"></a> `_labelPosition?` | (`d`: `DataPoint`, `i`: `number`) => `"auto"` \| `"inside"` \| `"outside"` | - | [charts/viz/vizTypes.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L180) |
| <a id="property-_legend"></a> `_legend?` | `boolean` \| ((`config`: `any`, `data`: `DataPoint`[]) => `boolean`) | - | [charts/viz/vizTypes.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L200) |
| <a id="property-_legendclass-1"></a> `_legendClass?` | `any` | - | [charts/viz/vizTypes.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L190) |
| <a id="property-_legendconfig"></a> `_legendConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L129) |
| <a id="property-_legenddata"></a> `_legendData` | `DataPoint`[] | - | [charts/viz/vizTypes.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L92) |
| <a id="property-_legenddepth"></a> `_legendDepth?` | `number` | - | [charts/viz/vizTypes.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L201) |
| <a id="property-_legendposition"></a> `_legendPosition?` | (`config`: `any`) => `string` \| `false` | - | [charts/viz/vizTypes.ts:199](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L199) |
| <a id="property-_legendsort"></a> `_legendSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | - | [charts/viz/vizTypes.ts:198](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L198) |
| <a id="property-_linelabels"></a> `_lineLabels?` | `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | - | [charts/viz/vizTypes.ts:174](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L174) |
| <a id="property-_linemarkerconfig"></a> `_lineMarkerConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:182](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L182) |
| <a id="property-_linemarkers"></a> `_lineMarkers?` | `boolean` | - | [charts/viz/vizTypes.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L175) |
| <a id="property-_margin-6"></a> `_margin` | [`Margin`](#margin) | - | [charts/viz/vizTypes.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L85) |
| <a id="property-_messageclass"></a> `_messageClass?` | `any` | - | [charts/viz/vizTypes.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L196) |
| <a id="property-_nodatamessage"></a> `_noDataMessage?` | `string` \| `false` \| ((`config`: `any`) => `string`) | - | [charts/viz/vizTypes.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L97) |
| <a id="property-_padding"></a> `_padding` | [`Padding`](#padding) | - | [charts/viz/vizTypes.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L86) |
| <a id="property-_previousannotations"></a> `_previousAnnotations?` | `Record`\<`string`, `string`[]\> | - | [charts/viz/vizTypes.ts:143](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L143) |
| <a id="property-_previousshapes"></a> `_previousShapes?` | `string`[] | - | [charts/viz/vizTypes.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L142) |
| <a id="property-_renderer"></a> `_renderer?` | `"svg"` \| `"canvas"` | - | [charts/viz/vizTypes.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L151) |
| <a id="property-_rendermode"></a> `_renderMode?` | `"full"` \| `"compute"` | - | [charts/viz/vizTypes.ts:152](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L152) |
| <a id="property-_rendertiles"></a> `_renderTiles?` | (`transform?`: `any`, `duration?`: `number`) => `void` | - | [charts/viz/vizTypes.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L220) |
| <a id="property-_scenerenderer"></a> `_sceneRenderer?` | [`VizRenderer`](#vizrenderer-1) | - | [charts/viz/vizTypes.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L149) |
| <a id="property-_scenerepaintraf"></a> `_sceneRepaintRAF?` | `number` | - | [charts/viz/vizTypes.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L231) |
| <a id="property-_scenetarget"></a> `_sceneTarget?` | `Element` | - | [charts/viz/vizTypes.ts:148](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L148) |
| <a id="property-_select-19"></a> `_select?` | [`D3Selection`](#d3selection) | - | [charts/viz/vizTypes.ts:147](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L147) |
| <a id="property-_shape"></a> `_shape` | (`d`: `DataPoint`, `i`: `number`) => `string` | - | [charts/viz/vizTypes.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L114) |
| <a id="property-_shapes-1"></a> `_shapes?` | `any`[] | - | [charts/viz/vizTypes.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L141) |
| <a id="property-_size"></a> `_size?` | (`d`: `DataPoint`, `i`: `number`) => `number` | - | [charts/viz/vizTypes.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L115) |
| <a id="property-_solo"></a> `_solo` | (`string` \| `number`)[] | - | [charts/viz/vizTypes.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L94) |
| <a id="property-_sort"></a> `_sort?` | ((`a`: `any`, `b`: `any`) => `number`) \| `null` | - | [charts/viz/vizTypes.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L118) |
| <a id="property-_stacked"></a> `_stacked?` | `boolean` | - | [charts/viz/vizTypes.ts:170](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L170) |
| <a id="property-_stackoffset"></a> `_stackOffset?` | (`series`: `any`[], `order`: `any`) => `void` | - | [charts/viz/vizTypes.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L171) |
| <a id="property-_stackorder"></a> `_stackOrder?` | (`series`: `any`[]) => `number`[] | - | [charts/viz/vizTypes.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L172) |
| <a id="property-_subtitle"></a> `_subtitle?` | `string` \| `false` \| ((`data`: `DataPoint`[]) => `string` \| `false`) | - | [charts/viz/vizTypes.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L205) |
| <a id="property-_subtitleclass"></a> `_subtitleClass?` | `any` | - | [charts/viz/vizTypes.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L194) |
| <a id="property-_subtitleconfig"></a> `_subtitleConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:134](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L134) |
| <a id="property-_sum"></a> `_sum?` | (`d`: `DataPoint`, `i`: `number`) => `number` | - | [charts/viz/vizTypes.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L121) |
| <a id="property-_thresholdname"></a> `_thresholdName?` | (`d`: `DataPoint`, `i`: `number`) => `string` | - | [charts/viz/vizTypes.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L120) |
| <a id="property-_tilegen"></a> `_tileGen?` | `any` | - | [charts/viz/vizTypes.ts:215](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L215) |
| <a id="property-_tilegroup"></a> `_tileGroup?` | [`D3Selection`](#d3selection) | - | [charts/viz/vizTypes.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L214) |
| <a id="property-_time"></a> `_time?` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `Date` | - | [charts/viz/vizTypes.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L117) |
| <a id="property-_timefilter"></a> `_timeFilter?` | (`d`: `DataPoint`, `i`: `number`) => `boolean` | - | [charts/viz/vizTypes.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L96) |
| <a id="property-_timeline"></a> `_timeline?` | `boolean` | - | [charts/viz/vizTypes.ts:208](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L208) |
| <a id="property-_timelineclass"></a> `_timelineClass?` | `any` | - | [charts/viz/vizTypes.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L192) |
| <a id="property-_timelineconfig"></a> `_timelineConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L131) |
| <a id="property-_title"></a> `_title?` | `string` \| `false` \| ((`data`: `DataPoint`[]) => `string` \| `false`) | - | [charts/viz/vizTypes.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L204) |
| <a id="property-_titleclass-7"></a> `_titleClass?` | `any` | - | [charts/viz/vizTypes.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L193) |
| <a id="property-_titleconfig"></a> `_titleConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L133) |
| <a id="property-_tooltipclass"></a> `_tooltipClass?` | `any` | - | [charts/viz/vizTypes.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L197) |
| <a id="property-_total"></a> `_total?` | `boolean` \| ((`d`: `DataPoint`[], `i`: `number`) => `number`) | - | [charts/viz/vizTypes.ts:209](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L209) |
| <a id="property-_userduration"></a> `_userDuration?` | `number` | - | [charts/viz/vizTypes.ts:158](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L158) |
| <a id="property-_userhover"></a> `_userHover?` | `number` | - | [charts/viz/vizTypes.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L157) |
| <a id="property-_uuid-20"></a> `_uuid` | `string` | - | [charts/viz/vizTypes.ts:224](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L224) |
| <a id="property-_value"></a> `_value?` | (`d`: `DataPoint`, `i`: `number`) => `number` | - | [charts/viz/vizTypes.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L116) |
| <a id="property-_width"></a> `_width` | `number` | - | [charts/viz/vizTypes.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L83) |
| <a id="property-_wireplotshapeevents"></a> `_wirePlotShapeEvents?` | (`shape`: `any`, `shapeKey`: `string`, `events`: `string`[]) => `void` | - | [charts/viz/vizTypes.ts:221](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L221) |
| <a id="property-_x"></a> `_x?` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `Date` | - | [charts/viz/vizTypes.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L110) |
| <a id="property-_x2"></a> `_x2?` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `Date` | - | [charts/viz/vizTypes.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L112) |
| <a id="property-_x2axis"></a> `_x2Axis?` | `any` | - | [charts/viz/vizTypes.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L165) |
| <a id="property-_x2config"></a> `_x2Config?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:126](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L126) |
| <a id="property-_xaxis"></a> `_xAxis?` | `any` | - | [charts/viz/vizTypes.ts:163](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L163) |
| <a id="property-_xconfig"></a> `_xConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:124](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L124) |
| <a id="property-_xcutoff"></a> `_xCutoff?` | `number` | - | [charts/viz/vizTypes.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L184) |
| <a id="property-_xfunc"></a> `_xFunc?` | (`d`: `any`, `axis?`: `string`) => `number` | - | [charts/viz/vizTypes.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L167) |
| <a id="property-_y"></a> `_y?` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `Date` | - | [charts/viz/vizTypes.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L111) |
| <a id="property-_y2"></a> `_y2?` | (`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `Date` | - | [charts/viz/vizTypes.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L113) |
| <a id="property-_y2axis"></a> `_y2Axis?` | `any` | - | [charts/viz/vizTypes.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L166) |
| <a id="property-_y2config"></a> `_y2Config?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:127](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L127) |
| <a id="property-_yaxis"></a> `_yAxis?` | `any` | - | [charts/viz/vizTypes.ts:164](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L164) |
| <a id="property-_yconfig"></a> `_yConfig?` | `Record`\<`string`, `any`\> | - | [charts/viz/vizTypes.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L125) |
| <a id="property-_ycutoff"></a> `_yCutoff?` | `number` | - | [charts/viz/vizTypes.ts:185](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L185) |
| <a id="property-_yfunc"></a> `_yFunc?` | (`d`: `any`, `axis?`: `string`) => `number` | - | [charts/viz/vizTypes.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L168) |
| <a id="property-_zoombehavior"></a> `_zoomBehavior?` | `any` | - | [charts/viz/vizTypes.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L216) |
| <a id="property-_zoombrush"></a> `_zoomBrush?` | `any` | - | [charts/viz/vizTypes.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L217) |
| <a id="property-_zoomgroup"></a> `_zoomGroup?` | [`D3Selection`](#d3selection) | - | [charts/viz/vizTypes.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L213) |
| <a id="property-_zoomset"></a> `_zoomSet?` | `boolean` | - | [charts/viz/vizTypes.ts:218](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L218) |
| <a id="property-_zoomtobounds"></a> `_zoomToBounds?` | (`bounds`: `number`[][] \| `null`, `duration?`: `number`) => `void` | - | [charts/viz/vizTypes.ts:219](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L219) |
| <a id="property-_zoomtransform"></a> `_zoomTransform?` | `Transform` | - | [charts/viz/vizTypes.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L144) |
| <a id="property-ctx-20"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [charts/viz/vizTypes.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L80) |
| <a id="property-schema-21"></a> `schema` | `Record`\<`string`, `any`\> | User-set config from fluent accessors (`.sum(...)`, `.x(...)`, …). | [charts/viz/vizTypes.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L78) |

***

<a id="vizlike"></a>

### VizLike

Defined in: [charts/features/emitHelpers.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L61)

Structural minimum a Viz instance must satisfy for these helpers to
work. Each chart subclass has many more fields; the helpers only need
`_chartScene` (mutated by `absorbShapeIntoChartScene`) and
`schema.shapeConfig` (read by `shapeConfigFor`'s default-config branch).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-_chartscene-1"></a> `_chartScene?` | `SceneNode`[] | [charts/features/emitHelpers.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L62) |
| <a id="property-schema-22"></a> `schema` | `Record`\<`string`, `unknown`\> | [charts/features/emitHelpers.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/features/emitHelpers.ts#L63) |

***

<a id="vizpredrawresult"></a>

### VizPreDrawResult

Defined in: [charts/pipeline/vizPreDrawPure.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L64)

#### Extends

- `Partial`\<[`VizContext`](#vizcontext)\>

#### Indexable

> \[`key`: `string`\]: `any`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_thresholdtree"></a> `_thresholdTree?` | `any` | Internal: d3-array rollup tree, consumed by the shim's threshold step. | - | [charts/pipeline/vizPreDrawPure.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L66) |
| <a id="property-computedtimefilter"></a> `computedTimeFilter?` | `TimeFilterFn` | Internal: synthesized time-filter for the shim to back-assign. | - | [charts/pipeline/vizPreDrawPure.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizPreDrawPure.ts#L68) |
| <a id="property-drawdepth-1"></a> `drawDepth?` | `number` | Effective draw depth (capped to groupBy.length - 1). | [`VizContext`](#vizcontext).[`drawDepth`](#property-drawdepth) | [charts/pipeline/vizContext.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L36) |
| <a id="property-drawlabel-1"></a> `drawLabel?` | (`d`: `DataPoint`, `i`: `number`, `depth?`: `number`) => `string` | Human-readable label-per-datum accessor (handles aggregation labels). | `Partial.drawLabel` | [charts/pipeline/vizContext.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L43) |
| <a id="property-filtereddata-1"></a> `filteredData?` | `DataPoint`[] | Data after filter + timeFilter + threshold are applied. | [`VizContext`](#vizcontext).[`filteredData`](#property-filtereddata) | [charts/pipeline/vizContext.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L45) |
| <a id="property-id-9"></a> `id?` | (`d`: `DataPoint`, `i`: `number`) => `any` | Unique-id-per-datum accessor (depth-scoped). | `Partial.id` | [charts/pipeline/vizContext.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L39) |
| <a id="property-ids-1"></a> `ids?` | (`d`: `DataPoint`, `i`: `number`) => `string`[] | Array-of-ids-per-datum accessor. | `Partial.ids` | [charts/pipeline/vizContext.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L41) |
| <a id="property-legenddata-1"></a> `legendData?` | `DataPoint`[] | Per-id rank order used by legend + treemap label sorting. | [`VizContext`](#vizcontext).[`legendData`](#property-legenddata) | [charts/pipeline/vizContext.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L47) |
| <a id="property-nodatamessage-1"></a> `noDataMessage?` | `boolean` | Whether a "no data" message should currently be visible. | [`VizContext`](#vizcontext).[`noDataMessage`](#property-nodatamessage) | [charts/pipeline/vizContext.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/vizContext.ts#L49) |

***

<a id="vizrenderer-1"></a>

### VizRenderer

Defined in: [charts/viz/vizTypes.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L62)

A Renderer instance — see @d3plus/render.

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="destroy-2"></a>

##### destroy()

> **destroy**(): `void`

Defined in: [charts/viz/vizTypes.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L65)

###### Returns

`void`

<a id="drawscene"></a>

##### drawScene()

> **drawScene**(`scene`: `any`, `opts?`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L66)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | `any` |
| `opts?` | `any` |

###### Returns

`any`

<a id="target"></a>

##### target()

> **target**(): \{ `container`: `Element`; `height`: `number`; `width`: `number`; \} \| `undefined`

Defined in: [charts/viz/vizTypes.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L64)

###### Returns

\{ `container`: `Element`; `height`: `number`; `width`: `number`; \} \| `undefined`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `"svg"` \| `"canvas"` | [charts/viz/vizTypes.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L63) |

***

<a id="whiskerconfig-2"></a>

### WhiskerConfig

Defined in: [shapes/shapeConfig.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L237)

Whisker-specific config.

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-11"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L238) |
| <a id="property-endpoint"></a> `endpoint?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | End-cap shape name (e.g. "Rect"). | [shapes/shapeConfig.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L240) |
| <a id="property-endpointconfig"></a> `endpointConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L241) |
| <a id="property-length"></a> `length?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Whisker length in pixels. | [shapes/shapeConfig.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L243) |
| <a id="property-lineconfig"></a> `lineConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:244](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L244) |
| <a id="property-orient-1"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | [shapes/shapeConfig.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L245) |
| <a id="property-select-9"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:246](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L246) |
| <a id="property-x-12"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:247](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L247) |
| <a id="property-y-12"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:248](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L248) |

## Type Aliases

<a id="anyshapeconfig"></a>

### AnyShapeConfig

> **AnyShapeConfig** = [`BaseShapeConfig`](#baseshapeconfig) \| [`RectConfig`](#rectconfig-3) \| [`CircleConfig`](#circleconfig-1) \| [`LineConfig`](#lineconfig-2) \| [`AreaConfig`](#areaconfig-1) \| [`PathConfig`](#pathconfig-1) \| [`BarConfig`](#barconfig-7) \| [`ImageConfig`](#imageconfig) \| [`BoxConfig`](#boxconfig-1) \| [`WhiskerConfig`](#whiskerconfig-2)

Defined in: [shapes/shapeConfig.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L258)

Union of every shape config — useful for code that composes
transient configs at runtime without knowing the shape ahead of
time (Plot's `shapeConfig`, axis decorators, etc.).

***

<a id="constoraccessor"></a>

### ConstOrAccessor

> **ConstOrAccessor**\<`T`\> = `T` \| `AccessorFn`

Defined in: [shapes/shapeConfig.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L36)

A value that can either be a function (called per-datum) or a literal
that wraps as `constant(_)`. Mirrors the runtime "const" coerce.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

***

<a id="d3selection"></a>

### D3Selection

> **D3Selection** = `object`

Defined in: [charts/viz/vizTypes.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L49)

D3-style selection (loose — d3-selection's types are too generic to repeat here).

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="attr"></a>

##### attr()

> **attr**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L51)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="call"></a>

##### call()

> **call**(...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L56)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="node"></a>

##### node()

> **node**(): `any`

Defined in: [charts/viz/vizTypes.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L50)

###### Returns

`any`

<a id="on-20"></a>

##### on()

> **on**(`event`: `string`, `handler`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L55)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |
| `handler` | `any` |

###### Returns

`any`

<a id="select-21"></a>

##### select()

> **select**(`selector`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L54)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `any` |

###### Returns

`any`

<a id="selectall"></a>

##### selectAll()

> **selectAll**(`selector`: `string`): `any`

Defined in: [charts/viz/vizTypes.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L53)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

###### Returns

`any`

<a id="style"></a>

##### style()

> **style**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L52)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="transition"></a>

##### transition()

> **transition**(...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L57)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

***

<a id="resolvedspec"></a>

### ResolvedSpec

> **ResolvedSpec** = `Readonly`\<`Record`\<`string`, `any`\>\>

Defined in: [charts/pipeline/resolveSpec.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/pipeline/resolveSpec.ts#L42)

All user-settable configuration keys on a chart, frozen.

Generated by stripping the `_` prefix from every Viz/Plot/chart-subclass
instance field that has a matching accessor method. Accessor reflection
is handled by `BaseClass.config()`; this type is the static shape.

Extends `Record<string, unknown>` for incremental migration — chart
subclasses add their own fields and the existing `installFluent`-
installed accessors don't yet have static type info. As schemas gain
types, this can narrow to per-field unions.

***

<a id="stringoraccessor"></a>

### StringOrAccessor

> **StringOrAccessor**\<`T`\> = `T` \| `string` \| `AccessorFn`

Defined in: [shapes/shapeConfig.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L43)

A value that can be a function, a string key (wrapped in `accessor`),
or a literal (wrapped in `constant`). Mirrors the "accessor" coerce.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |
