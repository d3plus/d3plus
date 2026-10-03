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
| [`AreaPlot`](#areaplot) | Creates an area plot based on an array of data. |
| [`BarChart`](#barchart) | Creates a bar chart based on an array of data. When stacked, each bar's |
| [`BoxWhisker`](#boxwhisker) | Creates a simple box and whisker based on an array of data. |
| [`BumpChart`](#bumpchart) | Creates a bump chart based on an array of data. |
| [`Chord`](#chord) | Creates a Chord diagram based on a defined set of nodes and links. |
| [`Donut`](#donut) | Extends the Pie visualization to create a donut chart. |
| [`Geomap`](#geomap) | Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate  |
| [`Histogram`](#histogram) | Creates a histogram from an array of raw observations: the `value` of each |
| [`LinePlot`](#lineplot) | Creates a line plot based on an array of data. |
| [`Matrix`](#matrix) | Creates a simple rows/columns Matrix view of any dataset. |
| [`Network`](#network) | Creates a network visualization based on a defined set of nodes and edges. |
| [`Pack`](#pack) | Uses the d3 pack layout to create a Circle Packing chart based on an array of data. |
| [`Pie`](#pie) | Uses the d3 pie layout to create SVG arcs based on an array of data. |
| [`Priestley`](#priestley) | Creates a Priestley timeline based on an array of data. |
| [`Radar`](#radar) | Creates a radar visualization based on an array of data. |
| [`RadialMatrix`](#radialmatrix) | Creates a radial layout of a rows/columns Matrix of any dataset. |
| [`Rings`](#rings) | Creates a ring visualization based on a defined set of nodes and edges. |
| [`Sankey`](#sankey) | Creates a Sankey visualization based on a defined set of nodes and links. |
| [`StackedArea`](#stackedarea) | Creates a stacked area plot based on an array of data. Each point's |
| [`Tree`](#tree) | Uses d3's tree layout to create a tidy tree chart based on an array of data. |
| [`Treemap`](#treemap) | Uses the d3 treemap layout to create SVG rectangles based on an array of data. |

| Classes | Description |
| --- | --- |
| [`Area`](#area) | Creates SVG areas based on an array of data. |
| [`Axis`](#axis) | Creates an SVG scale based on an array of data. |
| [`AxisBottom`](#axisbottom) | Axis preset whose ticks are drawn below the horizontal domain path. Accepts everything the base Axis class does. |
| [`AxisLeft`](#axisleft) | Axis preset whose ticks are drawn to the left of the vertical domain path. Accepts everything the base Axis class does. |
| [`AxisRight`](#axisright) | Axis preset whose ticks are drawn to the right of the vertical domain path. Accepts everything the base Axis class does. |
| [`AxisTop`](#axistop) | Axis preset whose ticks are drawn above the horizontal domain path. Accepts everything the base Axis class does. |
| [`Bar`](#bar) | Creates SVG bars based on an array of data. |
| [`BaseClass`](#baseclass) | Provides shared configuration, event handling, and locale management inherited by all d3plus classes. |
| [`Box`](#box) | Creates SVG box-and-whisker plots based on an array of data, one per group of values. |
| [`Circle`](#circle) | Creates SVG circles based on an array of data. |
| [`ColorScale`](#colorscale) | Creates an SVG color scale based on an array of data. |
| [`Image`](#image) | Creates SVG images based on an array of data. |
| [`Legend`](#legend) | Creates an SVG legend based on an array of data. |
| [`Line`](#line) | Creates SVG lines based on an array of data. |
| [`Path`](#path) | Creates SVG Paths based on an array of data. |
| [`Plot`](#plot) | Creates an x/y plot based on an array of data. |
| [`Rect`](#rect) | Creates SVG rectangles based on an array of data. |
| [`Shape`](#shape) | An abstracted class for generating shapes. |
| [`SizeLegend`](#sizelegend) | A nested-circle legend for a size scale: concentric circles sharing a |
| [`TextBox`](#textbox) | Creates a wrapped text box for each point in an array of data. |
| [`Timeline`](#timeline) | Creates an interactive timeline brush component for selecting time periods within a visualization. |
| [`Tooltip`](#tooltip) | Creates HTML tooltips in the body of a webpage. |
| [`Viz`](#viz) | The base class every d3plus chart extends. Owns the shared configuration surface (data, groupBy, size and color accessor |
| [`Whisker`](#whisker) | Creates SVG whiskers based on an array of data: a line from each point in a given direction, capped with an endpoint sha |

| Functions | Description |
| --- | --- |
| [`accessor`](#accessor) | Wraps an object key in a simple accessor function. |
| [`configPrep`](#configprep) | Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you m |
| [`configWarnings`](#configwarnings) | Toggles the console warnings d3plus logs when a class receives a config |
| [`constant`](#constant) | Wraps non-function variables in a simple return function. |

| Variables | Description |
| --- | --- |
| [`RESET`](#reset) | String constant used to reset an individual config property. |

| Interfaces | Description |
| --- | --- |
| [`AreaConfig`](#areaconfig) | Area-specific config (curve, defined, dual-edge x/y). |
| [`AxisConfig`](#axisconfig) |  |
| [`BarConfig`](#barconfig) | Bar-specific config (Rect + start/end coords). |
| [`BaseShapeConfig`](#baseshapeconfig) | Common props inherited from `Shape` — every shape subclass accepts |
| [`BoxConfig`](#boxconfig) | Box-specific config (whisker + median + outliers; subset of Shape). |
| [`CircleConfig`](#circleconfig) | Circle-specific config (radius). |
| [`ColorScaleConfig`](#colorscaleconfig) |  |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`ImageConfig`](#imageconfig) | Image-specific config (url + dimensions). |
| [`LegendConfig`](#legendconfig) |  |
| [`LineConfig`](#lineconfig) | Line-specific config (curve + defined). |
| [`Margin`](#margin) | Margin object with all four sides. |
| [`Padding`](#padding) | Padding object with all four sides. |
| [`PathConfig`](#pathconfig) | Path-specific config (raw SVG path d string or generator). |
| [`RectConfig`](#rectconfig) | Rect-specific config (width + height on top of base). |
| [`SizeLegendConfig`](#sizelegendconfig) |  |
| [`TextBoxConfig`](#textboxconfig) |  |
| [`TimelineConfig`](#timelineconfig) |  |
| [`TooltipConfig`](#tooltipconfig) |  |
| [`TrendLineConfig`](#trendlineconfig) |  |
| [`WhiskerConfig`](#whiskerconfig) | Whisker-specific config. |

| Type Aliases | Description |
| --- | --- |
| [`AnyShapeConfig`](#anyshapeconfig) | Union of every shape config — useful for code that composes |
| [`ColorDefaultsConfig`](#colordefaultsconfig) | `colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors. |
| [`ConstOrAccessor`](#constoraccessor) | A value that can either be a function (called per-datum) or a literal |
| [`D3Selection`](#d3selection) | D3-style selection — deliberately loose. d3-selection's element/datum |
| [`StringOrAccessor`](#stringoraccessor) | A value that can be a function, a string key (wrapped in `accessor`), |

## Classes

<a id="area"></a>

### Area

Defined in: [shapes/Area.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L25)

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config"></a>

##### config()

###### Call Signature

> **config**(): [`AreaConfig`](#areaconfig-1)

Defined in: [shapes/Area.ts:268](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L268)

Narrowed `.config()` for Area. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`AreaConfig`](#areaconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`AreaConfig`](#areaconfig-1)\>): `this`

Defined in: [shapes/Area.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L269)

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

<a id="x"></a>

##### x()

###### Call Signature

> **x**(): `AccessorFn`

Defined in: [shapes/Area.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L192)

The x position accessor. Also sets x0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **x**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L193)

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

Defined in: [shapes/Area.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L204)

The x0 (left edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:205](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L205)

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

Defined in: [shapes/Area.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L216)

The x1 (right edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Area.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L217)

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

Defined in: [shapes/Area.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L229)

The y position accessor. Also sets y0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **y**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L230)

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

Defined in: [shapes/Area.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L241)

The y0 (top edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Area.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L242)

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

Defined in: [shapes/Area.ts:253](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L253)

The y1 (bottom edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Area.ts:254](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Area.ts#L254)

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
| <a id="property-ctx"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="axis"></a>

### Axis

Defined in: [components/Axis/Axis.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L71)

Creates an SVG scale based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Extended by

- [`AxisBottom`](#axisbottom)
- [`AxisLeft`](#axisleft)
- [`AxisRight`](#axisright)
- [`AxisTop`](#axistop)
- [`Timeline`](#timeline)

#### Methods

<a id="barconfig"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="colordefaults-1"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-1"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

<a id="gridconfig"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

<a id="on-1"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

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

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Axis/Axis.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L329)

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

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="titleconfig"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

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

Defined in: [components/Axis/Axis.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L321)

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

<a id="translate-1"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-1"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-1"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="axisbottom"></a>

### AxisBottom

Defined in: [components/Axis/AxisBottom.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisBottom.ts#L6)

Axis preset whose ticks are drawn below the horizontal domain path. Accepts everything the base Axis class does.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-1"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="colordefaults-2"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

<a id="config-2"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-1"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-2"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

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

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Axis/Axis.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L329)

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

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-1"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

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

Defined in: [components/Axis/Axis.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L321)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-2"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-2"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="axisleft"></a>

### AxisLeft

Defined in: [components/Axis/AxisLeft.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisLeft.ts#L6)

Axis preset whose ticks are drawn to the left of the vertical domain path. Accepts everything the base Axis class does.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-2"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="colordefaults-3"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

<a id="config-3"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-2"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-3"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

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

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Axis/Axis.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L329)

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

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-2"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

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

Defined in: [components/Axis/Axis.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L321)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-3"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-3"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="axisright"></a>

### AxisRight

Defined in: [components/Axis/AxisRight.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisRight.ts#L6)

Axis preset whose ticks are drawn to the right of the vertical domain path. Accepts everything the base Axis class does.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-3"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="colordefaults-4"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

<a id="config-4"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-3"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-4"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

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

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Axis/Axis.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L329)

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

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-3"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

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

Defined in: [components/Axis/Axis.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L321)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-4"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-4"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="axistop"></a>

### AxisTop

Defined in: [components/Axis/AxisTop.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/AxisTop.ts#L6)

Axis preset whose ticks are drawn above the horizontal domain path. Accepts everything the base Axis class does.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-4"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="colordefaults-5"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

<a id="config-5"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-4"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-5"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

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

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Axis/Axis.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L329)

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

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-4"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

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

Defined in: [components/Axis/Axis.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L321)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-5"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-5"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="bar"></a>

### Bar

Defined in: [shapes/Bar.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L22)

Creates SVG bars based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-1"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults-6"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config-6"></a>

##### config()

###### Call Signature

> **config**(): [`BarConfig`](#barconfig-7)

Defined in: [shapes/Bar.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L207)

Narrowed `.config()` for Bar. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BarConfig`](#barconfig-7)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`BarConfig`](#barconfig-7)\>): `this`

Defined in: [shapes/Bar.ts:208](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L208)

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-6"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on-6"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent-6"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render-6"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

<a id="x0-1"></a>

##### x0()

###### Call Signature

> **x0**(): `AccessorFn`

Defined in: [shapes/Bar.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L155)

The x0 (left edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Bar.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L156)

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

Defined in: [shapes/Bar.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L167)

The x1 (right edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Bar.ts:168](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L168)

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

Defined in: [shapes/Bar.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L180)

The y0 (top edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: [shapes/Bar.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L181)

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

Defined in: [shapes/Bar.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L192)

The y1 (bottom edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: [shapes/Bar.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Bar.ts#L193)

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
| <a id="property-ctx-6"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-6"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="baseclass"></a>

### BaseClass

Defined in: [utils/BaseClass.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L89)

Provides shared configuration, event handling, and locale management inherited by all d3plus classes.

#### Extended by

- [`Axis`](#axis)
- [`ColorScale`](#colorscale)
- [`Legend`](#legend)
- [`SizeLegend`](#sizelegend-1)
- [`TextBox`](#textbox)
- [`Tooltip`](#tooltip-1)
- [`Box`](#box)
- [`Shape`](#shape-1)
- [`Whisker`](#whisker)

#### Methods

<a id="colordefaults-7"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

<a id="config-7"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-7"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-7"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="box"></a>

### Box

Defined in: [shapes/Box.ts:253](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L253)

Creates SVG box-and-whisker plots based on an array of data, one per group of values.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="active-2"></a>

##### active()

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Box.ts:406](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L406)

The active highlight state for all sub-shapes in this Box.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="colordefaults-8"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-8"></a>

##### config()

###### Call Signature

> **config**(): [`BoxConfig`](#boxconfig-1)

Defined in: [shapes/Box.ts:498](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L498)

Narrowed `.config()` for Box. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BoxConfig`](#boxconfig-1)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BoxConfig`](#boxconfig-1)\>): `this`

Defined in: [shapes/Box.ts:499](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L499)

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

Defined in: [shapes/Box.ts:419](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L419)

The data array used to create shapes.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Box.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L420)

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

Defined in: [shapes/Box.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L428)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [shapes/Box.ts:441](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L441)

Configuration object for the median line.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **medianConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:442](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L442)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [shapes/Box.ts:452](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L452)

Configuration object for each outlier point.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **outlierConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:453](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L453)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [shapes/Box.ts:463](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L463)

Configuration object for the rect shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:464](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L464)

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

Defined in: [shapes/Box.ts:296](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L296)

Draws the Box.

###### Returns

`this`

<a id="select-7"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Box.ts:474](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L474)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Box.ts:475](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L475)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Box.ts:385](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L385)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

Defined in: [shapes/Box.ts:485](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L485)

Configuration object for the whisker.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **whiskerConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Box.ts:486](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Box.ts#L486)

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
| <a id="property-ctx-8"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-8"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="circle"></a>

### Circle

Defined in: [shapes/Circle.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L31)

Creates SVG circles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-3"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults-9"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config-9"></a>

##### config()

###### Call Signature

> **config**(): [`CircleConfig`](#circleconfig-1)

Defined in: [shapes/Circle.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L103)

Narrowed `.config()` for Circle. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`CircleConfig`](#circleconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`CircleConfig`](#circleconfig-1)\>): `this`

Defined in: [shapes/Circle.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Circle.ts#L104)

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-8"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on-9"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent-9"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render-8"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-9"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-9"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="colorscale"></a>

### ColorScale

Defined in: [components/ColorScale/ColorScale.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L64)

Creates an SVG color scale based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="axisconfig-1"></a>

##### axisConfig()

###### Call Signature

> **axisConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/ColorScale/ColorScale.ts:301](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L301)

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **axisConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:302](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L302)

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="colordefaults-10"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-10"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

Defined in: [components/ColorScale/ColorScale.ts:312](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L312)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/ColorScale/ColorScale.ts:313](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L313)

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

Defined in: [components/ColorScale/ColorScale.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L321)

A pass-through for the TextBox class used to style the labelMin and labelMax text.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L322)

A pass-through for the TextBox class used to style the labelMin and labelMax text.

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

Defined in: [components/ColorScale/ColorScale.ts:341](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L341)

Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMax**(`_`: `string`): `this`

Defined in: [components/ColorScale/ColorScale.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L342)

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

Defined in: [components/ColorScale/ColorScale.ts:332](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L332)

Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMin**(`_`: `string`): `this`

Defined in: [components/ColorScale/ColorScale.ts:333](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L333)

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

Defined in: [components/ColorScale/ColorScale.ts:350](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L350)

Configuration passed to the Legend that draws the scale when its values are rendered as discrete swatches instead of a continuous bar (for example a categorical or buckets scale), acting as a pass-through to that Legend's config method.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **legendConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:351](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L351)

Configuration passed to the Legend that draws the scale when its values are rendered as discrete swatches instead of a continuous bar (for example a categorical or buckets scale), acting as a pass-through to that Legend's config method.

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/ColorScale/ColorScale.ts:363](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L363)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/ColorScale/ColorScale.ts:370](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L370)

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Rect.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/ColorScale/ColorScale.ts:371](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L371)

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Rect.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="render-9"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/ColorScale/ColorScale.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L181)

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

Defined in: [components/ColorScale/ColorScale.ts:381](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L381)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: [components/ColorScale/ColorScale.ts:382](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L382)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [components/ColorScale/ColorScale.ts:252](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/ColorScale/ColorScale.ts#L252)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-10"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-10"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

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

#### Methods

<a id="config-11"></a>

##### config()

###### Call Signature

> **config**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Image.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L63)

Get/set multiple config values at once. Mirrors the `BaseClass.config()`
contract used by the other shapes (and relied on by the React wrapper):
each patch key is routed through its matching fluent accessor (or
`data`/`select`), with unknown keys stored on `schema` verbatim.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **config**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Image.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L64)

Get/set multiple config values at once. Mirrors the `BaseClass.config()`
contract used by the other shapes (and relied on by the React wrapper):
each patch key is routed through its matching fluent accessor (or
`data`/`select`), with unknown keys stored on `schema` verbatim.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="data-10"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Image.ts:176](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L176)

The data array used to create image shapes. An <image> tag will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Image.ts:177](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L177)

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

Defined in: [shapes/Image.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L82)

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

Defined in: [shapes/Image.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L212)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Image.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L213)

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

Defined in: [shapes/Image.ts:188](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L188)

Compute-mode scene emission. Mirrors Shape.toScene's shape — a
keyed GroupNode wrapping per-datum ImageNodes. Used by chart
compositors (e.g. plotPaint) that need Image to participate in the
scene graph rather than emit d3-selection DOM.

###### Returns

`GroupNode`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-schema-11"></a> `schema` | `Record`\<`string`, `any`\> | [shapes/Image.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Image.ts#L45) |

***

<a id="legend"></a>

### Legend

Defined in: [components/Legend/Legend.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L45)

Creates an SVG legend based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="active-4"></a>

##### active()

> **active**(`_`: `unknown`): `this`

Defined in: [components/Legend/Legend.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L241)

The active method for all shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

<a id="colordefaults-11"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-12"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

Defined in: [components/Legend/Legend.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L251)

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/Legend/Legend.ts:252](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L252)

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

Defined in: [components/Legend/Legend.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L260)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [components/Legend/Legend.ts:272](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L272)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Legend/Legend.ts:199](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L199)

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

Defined in: [components/Legend/Legend.ts:279](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L279)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [components/Legend/Legend.ts:280](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L280)

The SVG container element as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="shapeconfig-11"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Legend/Legend.ts:293](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L293)

Methods that correspond to the key/value pairs for each shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Legend/Legend.ts:294](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L294)

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

Defined in: [components/Legend/Legend.ts:304](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L304)

Title configuration of the legend.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Legend/Legend.ts:305](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L305)

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

Defined in: [components/Legend/Legend.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Legend/Legend.ts#L141)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-11"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-12"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="line"></a>

### Line

Defined in: [shapes/Line.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L27)

Creates SVG lines based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-5"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults-12"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config-13"></a>

##### config()

###### Call Signature

> **config**(): [`LineConfig`](#lineconfig-3)

Defined in: [shapes/Line.ts:152](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L152)

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`LineConfig`](#lineconfig-3)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`LineConfig`](#lineconfig-3)\>): `this`

Defined in: [shapes/Line.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Line.ts#L153)

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Partial`\<[`LineConfig`](#lineconfig-3)\> |

###### Returns

`this`

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-12"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on-12"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent-12"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render-12"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-12"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-13"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="path"></a>

### Path

Defined in: [shapes/Path.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Path.ts#L18)

Creates SVG Paths based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-6"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults-13"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config-14"></a>

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

[`Shape`](#shape-1).[`config`](#config-17)

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-13"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

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

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on-13"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent-13"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render-13"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

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

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-13"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-14"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="plot"></a>

### Plot

Defined in: [charts/Plot/index.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L94)

Creates an x/y plot based on an array of data.

#### Extends

- [`Viz`](#viz)

#### Methods

<a id="active-7"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L29)

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

Defined in: [charts/viz/VizBaseConfig.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L48)

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

Defined in: [charts/Plot/index.ts:469](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L469)

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

Defined in: [charts/viz/VizBaseConfig.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L57)

Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`attribution`](#attribution-1)

<a id="attributionicon"></a>

##### attributionIcon()

> **attributionIcon**(`_?`: `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`))): `string` \| [`Plot`](#plot) \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) \| `undefined`

Defined in: [charts/viz/VizBaseConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L66)

Overrides the "ⓘ" icon a long attribution collapses to (see `attribution`), which otherwise renders as an inline SVG. Accepts an HTML string — used as the toggle button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it. A returned cleanup function runs right before that slot is discarded, which happens whenever the credit's markup regenerates (its text or theme changes), not just once per chart.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) \| `undefined`

###### Inherited from

[`Viz`](#viz).[`attributionIcon`](#attributionicon-1)

<a id="attributionstyle"></a>

##### attributionStyle()

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L80)

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

Defined in: [charts/Plot/index.ts:478](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L478)

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

Defined in: [charts/viz/VizBaseConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L95)

Configuration object for the back button. Superseded by
`.backControlStyle()`/`.backControlClassName()` for the button's
appearance (it renders as a real `<button>`, like the zoom/search
controls, not a configurable text node) — kept for backwards
compatibility, but no longer affects how the button looks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`backConfig`](#backconfig-1)

<a id="backcontrolclassname"></a>

##### backControlClassName()

> **backControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L104)

An additional CSS class name (or space-separated list of class names) applied to the back button, alongside its fixed `back-control` class. Setting this automatically disables d3plus's built-in inline `backControlStyle` default (as long as you haven't already customized it yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`backControlClassName`](#backcontrolclassname-1)

<a id="backcontrolstyle"></a>

##### backControlStyle()

> **backControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L113)

An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`backControlStyle`](#backcontrolstyle-1)

<a id="backgroundconfig"></a>

##### backgroundConfig()

> **backgroundConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:487](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L487)

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

Defined in: [charts/Plot/index.ts:496](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L496)

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

Defined in: [charts/viz/VizBaseConfig.ts:124](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L124)

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

[`Viz`](#viz).[`color`](#color-1)

<a id="colordefaults-14"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Viz`](#viz).[`colorDefaults`](#colordefaults-21)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Viz`](#viz).[`colorDefaults`](#colordefaults-21)

<a id="colorscale-1"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L142)

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

Defined in: [charts/viz/VizBaseConfig.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L161)

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

Defined in: [charts/viz/VizBaseConfig.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L196)

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

> **colorScalePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L172)

Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`colorScalePadding`](#colorscalepadding-1)

<a id="colorscaleposition"></a>

##### colorScalePosition()

> **colorScalePosition**(`_?`: `string` \| `boolean` \| (() => `string` \| `boolean`)): `string` \| `boolean` \| [`Plot`](#plot) \| (() => `string` \| `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L184)

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

Defined in: [charts/Plot/index.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L524)

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

Defined in: [charts/Plot/index.ts:541](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L541)

Configuration object for shapes rendered as confidence intervals.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="config-15"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`config`](#config-22)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`config`](#config-22)

<a id="crosshairconfig"></a>

##### crosshairConfig()

> **crosshairConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:592](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L592)

Paint for the shared tooltip's crosshair guide line (`stroke`,
`strokeWidth`, `strokeDasharray`, `strokeOpacity`, …). Merged into the
current config.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="data-14"></a>

##### data()

> **data**(`_?`: `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[]): [`Plot`](#plot) \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L214)

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

Defined in: [charts/viz/Viz.ts:723](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L723)

Tears down the visualization: disconnects the ResizeObserver, stops listening for web font loads, and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`destroy`](#destroy-1)

<a id="detectresize"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L242)

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

Defined in: [charts/viz/VizBaseConfig.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L251)

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

Defined in: [charts/viz/VizBaseConfig.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L260)

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

Defined in: [charts/viz/VizBaseConfig.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L269)

The interval, in milliseconds, for checking if the visualization is visible on the page. When `detectVisible` defers a render until the visualization scrolls into view, this is also how long it must stay in view before it renders, so visualizations scrolled past quickly are never drawn.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectVisibleInterval`](#detectvisibleinterval-1)

<a id="detectvisibleunload"></a>

##### detectVisibleUnload()

> **detectVisibleUnload**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L278)

When `true` (the default) and `detectVisible` is enabled, the Viz releases its DOM and scene while it is scrolled out of view and redraws when it returns, keeping the page light when there are many visualizations. Data and configuration are retained; interaction state such as zoom or selection is not, so set this to `false` to keep it. With `detectVisible` enabled, each chart's `<svg>` is also given `content-visibility: auto`, so the browser skips rendering its contents while it is far off-screen (this matters most when this is `false` and charts are kept). For a larger saving you can also apply `content-visibility: auto` and a `contain-intrinsic-size` to the container element yourself; that adds paint containment to an element you own, so it is not done automatically. Requires `IntersectionObserver`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`detectVisibleUnload`](#detectvisibleunload-1)

<a id="discretecutoff"></a>

##### discreteCutoff()

> **discreteCutoff**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:550](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L550)

When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

<a id="fontfamily"></a>

##### fontFamily()

> **fontFamily**(`_?`: `string` \| `string`[]): `string` \| [`Plot`](#plot) \| `string`[]

Defined in: [charts/viz/VizBaseConfig.ts:287](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L287)

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

Defined in: [charts/viz/VizBaseConfig.ts:320](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L320)

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

Defined in: [charts/Plot/index.ts:559](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L559)

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

Defined in: [charts/viz/VizBaseConfig.ts:357](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L357)

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

Defined in: [charts/viz/VizBaseConfig.ts:368](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L368)

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`number` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

[`Viz`](#viz).[`hiddenOpacity`](#hiddenopacity-1)

<a id="highlight"></a>

##### highlight()

> **highlight**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `undefined`

Defined in: [charts/viz/VizBaseConfig.ts:438](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L438)

Persistently emphasizes the data points matching the given predicate: the
matching marks keep their color while every other mark is de-emphasized to
a neutral gray (the "emphasis" form — highlight one series, gray the rest).
Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
standing state that survives pointer movement. Pass `false` to clear it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `undefined`

###### Inherited from

[`Viz`](#viz).[`highlight`](#highlight-1)

<a id="hover-7"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `this`

Defined in: [charts/viz/VizBaseConfig.ts:380](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L380)

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

Defined in: [charts/viz/VizBaseConfig.ts:454](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L454)

Accessor function, or a constant string applied to every data point's
label (unlike `value`/`nodeId`/etc., a string here is not treated as a
per-datum object key — pass a function for that).

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

Defined in: [charts/Plot/index.ts:568](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L568)

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

Defined in: [charts/Plot/index.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L578)

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

Defined in: [charts/viz/VizBaseConfig.ts:465](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L465)

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

Defined in: [charts/viz/VizBaseConfig.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L481)

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

> **legendFilterInvert**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:490](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L490)

Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legendFilterInvert`](#legendfilterinvert-1)

<a id="legendinset"></a>

##### legendInset()

> **legendInset**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:502](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L502)

Whether the chart may draw one of its legends inside the empty space around its marks instead of in a margin, for charts that leave room (Plot, Network, Pack, Pie, Rings, Tree, and Geomap). After the chart lays out, the size legend is tried first, then the legend, then the colorScale; the first that fits is drawn over a semi-transparent box (see `legendInsetConfig`), and any others keep their margins. Space enclosed by the marks, like the middle of a ring of points, is never used. A legend or colorScale whose position was set explicitly stays in that margin. Defaults to `true`; also accepts a function that receives the resolved chart config and returns a boolean.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legendInset`](#legendinset-1)

<a id="legendinsetconfig"></a>

##### legendInsetConfig()

> **legendInsetConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBaseConfig.ts:513](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L513)

Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`legendInsetConfig`](#legendinsetconfig-1)

<a id="legendpadding"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:522](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L522)

Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legendPadding`](#legendpadding-1)

<a id="legendposition"></a>

##### legendPosition()

> **legendPosition**(`_?`: `string` \| (() => `string`)): `string` \| [`Plot`](#plot) \| (() => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:534](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L534)

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

Defined in: [charts/viz/VizBaseConfig.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L544)

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

Defined in: [charts/Plot/index.ts:628](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L628)

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

Defined in: [charts/Plot/index.ts:637](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L637)

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

Defined in: [charts/viz/VizBase.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L27)

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

Defined in: [charts/viz/VizBase.ts:38](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L38)

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`loadingMessage`](#loadingmessage-1)

<a id="locale-14"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Viz`](#viz).[`locale`](#locale-21)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Viz`](#viz).[`locale`](#locale-21)

<a id="messagemask"></a>

##### messageMask()

> **messageMask**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L47)

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

Defined in: [charts/viz/VizBase.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L56)

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`messageStyle`](#messagestyle-1)

<a id="minimapclassname"></a>

##### minimapClassName()

> **minimapClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L65)

An additional CSS class name (or space-separated list of class names) applied to the minimap's outer box, viewport box, and zoom-level label, alongside their fixed `d3plus-minimap` / `d3plus-minimap-viewport` / `d3plus-minimap-label` classes. Setting this automatically disables d3plus's built-in inline `minimapStyle`/`minimapViewportStyle`/`minimapViewportStyleActive`/`minimapLabelStyle` defaults (as long as you haven't already customized them yourself), so a host page's own styling applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`minimapClassName`](#minimapclassname-1)

<a id="minimaplabelstyle"></a>

##### minimapLabelStyle()

> **minimapLabelStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L74)

An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`minimapLabelStyle`](#minimaplabelstyle-1)

<a id="minimapstyle"></a>

##### minimapStyle()

> **minimapStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L85)

An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`minimapStyle`](#minimapstyle-1)

<a id="minimapviewportstyle"></a>

##### minimapViewportStyle()

> **minimapViewportStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L96)

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`minimapViewportStyle`](#minimapviewportstyle-1)

<a id="minimapviewportstyleactive"></a>

##### minimapViewportStyleActive()

> **minimapViewportStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L107)

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`minimapViewportStyleActive`](#minimapviewportstyleactive-1)

<a id="nodatahtml"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L118)

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

Defined in: [charts/viz/VizBase.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L129)

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`noDataMessage`](#nodatamessage-1)

<a id="on-14"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Viz`](#viz).[`on`](#on-21)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Viz`](#viz).[`on`](#on-21)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Viz`](#viz).[`on`](#on-21)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Viz`](#viz).[`on`](#on-21)

<a id="parent-14"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Viz`](#viz).[`parent`](#parent-21)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`parent`](#parent-21)

<a id="render-14"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [charts/viz/Viz.ts:289](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L289)

Draws the visualization given the specified configuration.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`render`](#render-20)

<a id="renderer"></a>

##### renderer()

###### Call Signature

> **renderer**(): `"svg"` \| `"canvas"`

Defined in: [charts/viz/Viz.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L321)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Inherited from

[`Viz`](#viz).[`renderer`](#renderer-1)

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: [charts/viz/Viz.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L322)

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

Defined in: [charts/viz/Viz.ts:335](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L335)

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

Defined in: [charts/viz/Viz.ts:336](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L336)

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

Defined in: [charts/viz/Viz.ts:350](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L350)

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

Defined in: [charts/viz/VizBase.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L138)

If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` \| `Window` |

###### Returns

`string` \| [`Plot`](#plot) \| `HTMLElement` \| `Window`

###### Inherited from

[`Viz`](#viz).[`scrollContainer`](#scrollcontainer-1)

<a id="searchaccessor"></a>

##### searchAccessor()

> **searchAccessor**(`_?`: (`d`: `DataPoint`, `i`: `number`) => `string`): [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:158](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L158)

Resolves the string the search box matches its typed term against, for
a given datum. Defaults to the mark's resolved on-screen label
(`viz._drawLabel`) — the same text the user reads on the chart.
Override it to match against something else instead, e.g. a data
field that isn't shown as the label.

This is checked alongside, not instead of, every level of the datum's
own groupBy hierarchy — searching a leaf's label also matches its
ancestor group's cell/legend entry, and vice versa, regardless of
this accessor's override.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | (`d`: `DataPoint`, `i`: `number`) => `string` |

###### Returns

[`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`searchAccessor`](#searchaccessor-1)

<a id="searchcontrolclassname"></a>

##### searchControlClassName()

> **searchControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L169)

An additional CSS class name (or space-separated list of class names) applied to the search toggle button and input, alongside their fixed `search-control` classes. Setting this automatically disables d3plus's built-in inline `searchControlStyle`/`searchControlStyleActive`/`searchControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`searchControlClassName`](#searchcontrolclassname-1)

<a id="searchcontrolstyle"></a>

##### searchControlStyle()

> **searchControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:178](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L178)

An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`searchControlStyle`](#searchcontrolstyle-1)

<a id="searchcontrolstyleactive"></a>

##### searchControlStyleActive()

> **searchControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L189)

An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`searchControlStyleActive`](#searchcontrolstyleactive-1)

<a id="searchcontrolstylehover"></a>

##### searchControlStyleHover()

> **searchControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L200)

An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`searchControlStyleHover`](#searchcontrolstylehover-1)

<a id="select-14"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Plot`](#plot) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: [charts/viz/VizBase.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L211)

The SVG container element as a d3 selector or DOM element. Defaults to `undefined`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` |

###### Returns

[`Plot`](#plot) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

###### Inherited from

[`Viz`](#viz).[`select`](#select-20)

<a id="shape"></a>

##### shape()

> **shape**(`_?`: `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L220)

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

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [charts/viz/VizBase.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L231)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-22)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [charts/viz/VizBase.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L232)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-22)

<a id="size"></a>

##### size()

> **size**(`_?`: `false` \| `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:646](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L646)

Sets the size of bubbles to the given Number, data key, or function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="sizelegend"></a>

##### sizeLegend()

> **sizeLegend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L243)

Whether to display the size legend: a nested-circle key, in the chart's bottom-right corner, for charts that size their marks with a `size` accessor (bubble plots, Geomap points via `pointSize`, Network, Rings). By default it shows whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height. Pass `true` to always show it, `false` to hide it, or a function that receives the resolved chart config, the radius scale, and the legend's measured `{width, height, availableWidth, availableHeight}`, and returns a boolean.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`sizeLegend`](#sizelegend-2)

<a id="sizelegendconfig"></a>

##### sizeLegendConfig()

> **sizeLegendConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L259)

Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`sizeLegendConfig`](#sizelegendconfig-2)

<a id="sizelegendposition"></a>

##### sizeLegendPosition()

> **sizeLegendPosition**(`_?`: `"right"` \| `"bottom"`): [`Plot`](#plot) \| `"right"` \| `"bottom"`

Defined in: [charts/viz/VizBase.ts:268](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L268)

Which margin the size legend claims in the chart's bottom-right corner. `"right"` (the default) widens the right margin, so the chart keeps its full height and the legend sits at the bottom of the right column, below any right-side legend or colorScale. `"bottom"` deepens the bottom margin instead, so the chart keeps its full width and any bottom legend or colorScale narrows to sit beside it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `"right"` \| `"bottom"` |

###### Returns

[`Plot`](#plot) \| `"right"` \| `"bottom"`

###### Inherited from

[`Viz`](#viz).[`sizeLegendPosition`](#sizelegendposition-1)

<a id="stackoffset"></a>

##### stackOffset()

> **stackOffset**(`_?`: `string` \| `StackOffsetFn`): [`Plot`](#plot) \| `StackOffsetFn`

Defined in: [charts/Plot/index.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L660)

Sets the vertical offset applied to stacked series. Accepts a named
offset — `"diverging"` (default), `"none"`, `"expand"`, `"silhouette"`,
or `"wiggle"` — or a custom offset function. Unknown names warn and fall
back to `"diverging"`. If *value* is not specified, returns the current
stack offset function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `StackOffsetFn` |

###### Returns

[`Plot`](#plot) \| `StackOffsetFn`

<a id="stackorder"></a>

##### stackOrder()

> **stackOrder**(`_?`: `StackOrderInput`): [`Plot`](#plot) \| `string`[] \| `StackOrderFn`

Defined in: [charts/Plot/index.ts:680](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L680)

Sets the order of stacked series, from the bottom of the stack upward.
Accepts:
- a named order: `"descending"` (default) / `"ascending"` by summed
  value, `"key"` / `"keyReverse"` alphabetically by series key,
  `"none"` / `"data"` for input order, or d3's `"insideOut"`,
  `"appearance"`, `"reverse"`;
- an Array of series keys for an explicit order;
- a value accessor, or a `{value, order}` config, to rank series by an
  aggregate of any data field.

Unknown named strings warn and fall back to `"descending"`. If *value*
is not specified, returns the current stack order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `StackOrderInput` |

###### Returns

[`Plot`](#plot) \| `string`[] \| `StackOrderFn`

<a id="subtitle"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L277)

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

Defined in: [charts/viz/VizBase.ts:288](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L288)

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

> **subtitlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:297](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L297)

Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`subtitlePadding`](#subtitlepadding-1)

<a id="tableviewclassname"></a>

##### tableViewClassName()

> **tableViewClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:620](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L620)

An additional CSS class name (or space-separated list of class names) applied to the `<table>` element the table-view toggle renders, alongside the fixed `d3plus-table-view-table` class. Lets a host page style the data table with its own table styling (Tailwind, Bootstrap, a design system) via descendant selectors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewClassName`](#tableviewclassname-1)

<a id="tableviewcontrolclassname"></a>

##### tableViewControlClassName()

> **tableViewControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:629](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L629)

An additional CSS class name (or space-separated list of class names) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. Setting this automatically disables d3plus's built-in inline `tableViewControlStyle`/`tableViewControlStyleActive`/`tableViewControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewControlClassName`](#tableviewcontrolclassname-1)

<a id="tableviewcontrolstyle"></a>

##### tableViewControlStyle()

> **tableViewControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L638)

An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyle`](#tableviewcontrolstyle-1)

<a id="tableviewcontrolstyleactive"></a>

##### tableViewControlStyleActive()

> **tableViewControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L649)

An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyleActive`](#tableviewcontrolstyleactive-1)

<a id="tableviewcontrolstylehover"></a>

##### tableViewControlStyleHover()

> **tableViewControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L660)

An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyleHover`](#tableviewcontrolstylehover-1)

<a id="tableviewpagesize"></a>

##### tableViewPageSize()

> **tableViewPageSize**(`_?`: `number` \| `false`): `number` \| `false` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L671)

The number of data-table rows shown per page while in table view. Set to `false` (or any non-positive number) to disable pagination and show every row on one page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| `false` |

###### Returns

`number` \| `false` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`tableViewPageSize`](#tableviewpagesize-1)

<a id="threshold"></a>

##### threshold()

> **threshold**(`_?`: `number` \| ((`data`: `DataPoint`[]) => `number`)): `number` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `number`)

Defined in: [charts/viz/VizBase.ts:309](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L309)

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

Defined in: [charts/viz/VizBase.ts:326](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L326)

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

Defined in: [charts/viz/VizBase.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L342)

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

Defined in: [charts/viz/VizBase.ts:354](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L354)

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

Defined in: [charts/viz/VizBase.ts:399](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L399)

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

Defined in: [charts/viz/VizBase.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L408)

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

> **timelinePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L421)

Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`timelinePadding`](#timelinepadding-1)

<a id="title"></a>

##### title()

> **title**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:433](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L433)

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

Defined in: [charts/viz/VizBase.ts:444](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L444)

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`titleConfig`](#titleconfig-9)

<a id="titlepadding"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:453](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L453)

Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`titlePadding`](#titlepadding-1)

<a id="tocanvas"></a>

##### toCanvas()

> **toCanvas**(): `unknown`

Defined in: [charts/viz/Viz.ts:310](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L310)

Returns the underlying canvas element of the most recent render when the
canvas backend is active (`renderer("canvas")`), or `undefined` otherwise.
Server-side callers cast this to their native canvas to encode a raster
(see `@d3plus/ssr`).

###### Returns

`unknown`

###### Inherited from

[`Viz`](#viz).[`toCanvas`](#tocanvas-1)

<a id="tooltip"></a>

##### tooltip()

> **tooltip**(`_?`: `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:464](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L464)

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

Defined in: [charts/viz/VizBase.ts:475](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L475)

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

Defined in: [charts/Plot/index.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L258)

Composes the chart's scene graph: the native shape scenes from Viz.toScene
(bars/lines/areas + labels) plus snapshots of the rendered axes, so a Plot
renders fully — geometry and axes — through the @d3plus/render backends.

###### Returns

`Scene`

###### Overrides

[`Viz`](#viz).[`toScene`](#toscene-20)

<a id="tosvgstring"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [charts/viz/Viz.ts:300](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L300)

Serializes the most recently rendered output to an SVG string. Returns
`""` if the chart has not been rendered yet. Both backends support this:
the SVG backend returns its live `<svg>`, the canvas backend re-renders the
retained scene through a throwaway SVG backend. Primarily used for
server-side rendering (see `@d3plus/ssr`).

###### Returns

`string`

###### Inherited from

[`Viz`](#viz).[`toSVGString`](#tosvgstring-1)

<a id="total"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBase.ts:484](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L484)

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

Defined in: [charts/viz/VizBase.ts:498](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L498)

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

Defined in: [charts/viz/VizBase.ts:507](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L507)

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

> **totalPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:516](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L516)

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`totalPadding`](#totalpadding-1)

<a id="translate-14"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Viz`](#viz).[`translate`](#translate-21)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Viz`](#viz).[`translate`](#translate-21)

<a id="trendline"></a>

##### trendLine()

> **trendLine**(`_?`: `TrendLineType`): [`Plot`](#plot) \| `TrendLineType`

Defined in: [charts/Plot/index.ts:601](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L601)

Draws an automatic trend line fit to the plotted data: `true` (or `"linear"`) for a least-squares line, or one of `"exponential"`, `"logarithmic"`, `"power"`, or `"polynomial"`. By default each series gets its own line in its color; see `trendLineConfig` for grouping, a confidence band, and styling. On a chart with a discrete axis, the line runs along that axis, fitting categories by their order. Set to `false` (the default) to remove.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `TrendLineType` |

###### Returns

[`Plot`](#plot) \| `TrendLineType`

<a id="trendlineconfig"></a>

##### trendLineConfig()

> **trendLineConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/Plot/index.ts:619](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L619)

Options for the trend lines drawn by `trendLine`, merged into the current config:
- `group`: `"series"` (default) fits one line per series, colored to match it; `"all"` fits a single line to every point.
- `order`: the polynomial degree when `trendLine` is `"polynomial"` (default `2`).
- `confidence`: draws a confidence band around a linear fit (default `false`).
- `confidenceLevel`: the band's confidence level (default `0.95`).
- `confidenceConfig`: Area shape config for the band (default `{fillOpacity: 0.15}`; fill defaults to the line color).
- `tooltip`: shows the fitted equation and R² when hovering a line (default `true`).
- Any other key (`stroke`, `strokeWidth`, `strokeDasharray`, …) styles the Line shape.

Stacked charts always fit one line to the stack totals.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

<a id="x-1"></a>

##### x()

> **x**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: [charts/Plot/index.ts:689](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L689)

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

Defined in: [charts/Plot/index.ts:703](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L703)

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

Defined in: [charts/Plot/index.ts:726](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L726)

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

Defined in: [charts/Plot/index.ts:717](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L717)

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

Defined in: [charts/Plot/index.ts:735](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L735)

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

Defined in: [charts/Plot/index.ts:749](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L749)

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

Defined in: [charts/Plot/index.ts:778](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L778)

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

Defined in: [charts/Plot/index.ts:765](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Plot/index.ts#L765)

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

Defined in: [charts/viz/VizBase.ts:527](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L527)

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

Defined in: [charts/viz/VizBase.ts:536](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L536)

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

Defined in: [charts/viz/VizBase.ts:547](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L547)

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomBrushSelectionStyle`](#zoombrushselectionstyle-1)

<a id="zoomcontrolclassname"></a>

##### zoomControlClassName()

> **zoomControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:558](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L558)

An additional CSS class name (or space-separated list of class names) applied to each zoom control button, alongside the fixed `zoom-control` / `zoom-in` / `zoom-out` / `zoom-reset` / `zoom-brush` classes. Setting this automatically disables d3plus's built-in inline `zoomControlStyle`/`zoomControlStyleActive`/`zoomControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomControlClassName`](#zoomcontrolclassname-1)

<a id="zoomcontrolicons"></a>

##### zoomControlIcons()

> **zoomControlIcons**(`_?`: `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\>): [`Plot`](#plot) \| `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> \| `undefined`

Defined in: [charts/viz/VizBase.ts:567](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L567)

Overrides one or more of the four built-in zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline SVGs. Each value is either an HTML string — used as the button's content in place of the built-in icon — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot (a 12x12px element) so you can mount anything imperative into it: a React tree (`createRoot(el).render(<Icon/>)`), a Vue app, a canvas sprite, a brand `<img>`. Return a cleanup function from the mount function if there's teardown to do; it runs right before that slot is discarded — which happens whenever the whole button panel's markup regenerates (a `.locale(...)` change, a `zoomControlClassName` change, or the brush toggle switching), not just once per chart.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> |

###### Returns

[`Plot`](#plot) \| `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> \| `undefined`

###### Inherited from

[`Viz`](#viz).[`zoomControlIcons`](#zoomcontrolicons-1)

<a id="zoomcontrolstyle"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Plot`](#plot)

Defined in: [charts/viz/VizBase.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L578)

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L589)

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:600](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L600)

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:611](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L611)

A pixel value to be used to pad all sides of a zoomed area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

###### Inherited from

[`Viz`](#viz).[`zoomPadding`](#zoompadding-1)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-14"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Viz`](#viz).[`ctx`](#property-ctx-21) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-15"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Viz`](#viz).[`schema`](#property-schema-22) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="rect"></a>

### Rect

Defined in: [shapes/Rect.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L29)

Creates SVG rectangles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-8"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="colordefaults-15"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Shape`](#shape-1).[`colorDefaults`](#colordefaults-16)

<a id="config-16"></a>

##### config()

###### Call Signature

> **config**(): [`RectConfig`](#rectconfig-3)

Defined in: [shapes/Rect.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L106)

Narrowed `.config()` for Rect. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`RectConfig`](#rectconfig-3)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`RectConfig`](#rectconfig-3)\>): `this`

Defined in: [shapes/Rect.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Rect.ts#L107)

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-15"></a>

##### data()

###### Call Signature

> **data**(): `DataPoint`[]

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

<a id="locale-15"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

[`Shape`](#shape-1).[`locale`](#locale-16)

<a id="on-15"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

[`Shape`](#shape-1).[`on`](#on-16)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

[`Shape`](#shape-1).[`on`](#on-16)

<a id="parent-15"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

<a id="render-15"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

###### Inherited from

[`Shape`](#shape-1).[`toScene`](#toscene-16)

<a id="translate-15"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

[`Shape`](#shape-1).[`translate`](#translate-16)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-15"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-16"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="shape-1"></a>

### Shape

Defined in: [shapes/Shape.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L110)

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

#### Methods

<a id="active-9"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

Defined in: [shapes/Shape.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L632)

The active callback function for highlighting shapes.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L633)

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

Defined in: [shapes/Shape.ts:647](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L647)

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L648)

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="colordefaults-16"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-17"></a>

##### config()

###### Call Signature

> **config**(): [`BaseShapeConfig`](#baseshapeconfig)

Defined in: [shapes/Shape.ts:742](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L742)

Narrowed `.config()` for Shape. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BaseShapeConfig`](#baseshapeconfig)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BaseShapeConfig`](#baseshapeconfig)\>): `this`

Defined in: [shapes/Shape.ts:743](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L743)

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

Defined in: [shapes/Shape.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L659)

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Shape.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L660)

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

Defined in: [shapes/Shape.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L668)

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **hover**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: [shapes/Shape.ts:669](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L669)

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

Defined in: [shapes/Shape.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L682)

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:683](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L683)

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

Defined in: [shapes/Shape.ts:693](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L693)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L694)

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-16"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [shapes/Shape.ts:524](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L524)

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

Defined in: [shapes/Shape.ts:704](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L704)

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Shape.ts:705](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L705)

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

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [shapes/Shape.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L715)

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`

###### Call Signature

> **sort**(`_`: ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null`): `this`

Defined in: [shapes/Shape.ts:716](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L716)

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

Defined in: [shapes/Shape.ts:728](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L728)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Shape.ts:729](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L729)

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

Defined in: [shapes/Shape.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Shape.ts#L421)

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

<a id="translate-16"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-16"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-17"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="sizelegend-1"></a>

### SizeLegend

Defined in: [components/SizeLegend/SizeLegend.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L71)

A nested-circle legend for a size scale: concentric circles sharing a
bottom tangent, each labeled with the value its radius encodes.

Charts that size marks by a `size` accessor (bubble plots, Geomap points,
Network, Rings) draw one automatically in their bottom-right corner (see
`sizeLegend` and `sizeLegendConfig` on the chart). On its own, give it
any d3 continuous scale that maps values to pixel radii.

#### Example

```ts
new SizeLegend()
.scale(d3.scaleSqrt().domain([0, 1000]).range([2, 30]))
.title("Population")
.select("#container")
.render();
```

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="colordefaults-17"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-18"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

<a id="labelconfig-8"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `SizeLegendTextConfig`

Defined in: [components/SizeLegend/SizeLegend.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L105)

Font settings for the value labels: `fontColor`, `fontFamily`, `fontSize`. Merged into the current settings.

###### Returns

`SizeLegendTextConfig`

###### Call Signature

> **labelConfig**(`_`: `SizeLegendTextConfig`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L106)

Font settings for the value labels: `fontColor`, `fontFamily`, `fontSize`. Merged into the current settings.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `SizeLegendTextConfig` |

###### Returns

`this`

<a id="layout"></a>

##### layout()

> **layout**(): `SizeLegendLayout`

Defined in: [components/SizeLegend/SizeLegend.ts:164](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L164)

Lays the legend out from the current config and returns the result
(circles, leader lines, labels, overall width/height). Pure: reads no
DOM, so a chart can measure the legend before it draws.

###### Returns

`SizeLegendLayout`

<a id="lineconfig-1"></a>

##### lineConfig()

###### Call Signature

> **lineConfig**(): `SizeLegendLineConfig`

Defined in: [components/SizeLegend/SizeLegend.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L116)

Paint for the leader lines: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. Merged into the current settings.

###### Returns

`SizeLegendLineConfig`

###### Call Signature

> **lineConfig**(`_`: `SizeLegendLineConfig`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L117)

Paint for the leader lines: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. Merged into the current settings.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `SizeLegendLineConfig` |

###### Returns

`this`

<a id="locale-17"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

<a id="on-17"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

<a id="outerbounds-7"></a>

##### outerBounds()

> **outerBounds**(): `object`

Defined in: [components/SizeLegend/SizeLegend.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L192)

The width and height of the last layout, in pixels.

###### Returns

`object`

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `height` | `number` | [components/SizeLegend/SizeLegend.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L192) |
| `width` | `number` | [components/SizeLegend/SizeLegend.ts:192](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L192) |

<a id="parent-17"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

> **render**(`callback?`: () => `void`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L277)

Renders the legend. Standalone, it paints into the `select` container
(sized to the legend); inside a chart (`renderMode("compute")`) it only
lays out, and the chart composes `toScene()`.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-17"></a>

##### select()

###### Call Signature

> **select**(): `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\> \| `undefined`

Defined in: [components/SizeLegend/SizeLegend.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L149)

The container element for a standalone render, as a d3 selector or DOM element.

###### Returns

`Selection`\<`BaseType`, `unknown`, `null`, `undefined`\> \| `undefined`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:150](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L150)

The container element for a standalone render, as a d3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` |

###### Returns

`this`

<a id="shapeconfig-18"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `SizeLegendShapeConfig`

Defined in: [components/SizeLegend/SizeLegend.ts:127](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L127)

Paint for the circles: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. Merged into the current settings.

###### Returns

`SizeLegendShapeConfig`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `SizeLegendShapeConfig`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L128)

Paint for the circles: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. Merged into the current settings.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `SizeLegendShapeConfig` |

###### Returns

`this`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="titleconfig-7"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `SizeLegendTextConfig`

Defined in: [components/SizeLegend/SizeLegend.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L138)

Font settings for the title: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. Merged into the current settings.

###### Returns

`SizeLegendTextConfig`

###### Call Signature

> **titleConfig**(`_`: `SizeLegendTextConfig`): `this`

Defined in: [components/SizeLegend/SizeLegend.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L139)

Font settings for the title: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. Merged into the current settings.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `SizeLegendTextConfig` |

###### Returns

`this`

<a id="toscene-17"></a>

##### toScene()

> **toScene**(`x?`: `number`, `y?`: `number`): `GroupNode`

Defined in: [components/SizeLegend/SizeLegend.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/SizeLegend/SizeLegend.ts#L202)

Produces a backend-agnostic scene graph of the last layout, offset by the
optional transform.

###### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `x` | `number` | `0` | Horizontal offset of the legend's top-left corner. |
| `y` | `number` | `0` | Vertical offset of the legend's top-left corner. |

###### Returns

`GroupNode`

<a id="translate-17"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-17"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-18"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="textbox"></a>

### TextBox

Defined in: [components/TextBox.ts:411](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L411)

Creates a wrapped text box for each point in an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="colordefaults-18"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-19"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

Defined in: [components/TextBox.ts:587](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L587)

The data array used to draw text boxes. A text box will be drawn for each object in the array.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/TextBox.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L588)

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

Defined in: [components/TextBox.ts:596](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L596)

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Returns

`false` \| `Record`\<`string`, `string`\>

###### Call Signature

> **html**(`_`: `boolean` \| `Record`\<`string`, `string`\>): `this`

Defined in: [components/TextBox.ts:597](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L597)

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` \| `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-18"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-18"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/TextBox.ts:513](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L513)

Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-18"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/TextBox.ts:609](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L609)

The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: [components/TextBox.ts:610](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L610)

The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` |

###### Returns

`this`

<a id="shapeconfig-19"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-18"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/TextBox.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/TextBox.ts#L448)

Produces a backend-agnostic scene graph for the text boxes, reusing the same
layout (_textData) and per-line positioning render() applies to the DOM.

###### Returns

`GroupNode`

<a id="translate-18"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-18"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-19"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="timeline"></a>

### Timeline

Defined in: [components/Timeline/Timeline.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L44)

Creates an interactive timeline brush component for selecting time periods within a visualization.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-6"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L428)

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:429](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L429)

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="colordefaults-19"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`Axis`](#axis).[`colorDefaults`](#colordefaults-1)

<a id="config-20"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

> **data**(): `unknown`[]

Defined in: [components/Axis/Axis.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L439)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: [components/Axis/Axis.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L440)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown`[] |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

<a id="gridconfig-5"></a>

##### gridConfig()

###### Call Signature

> **gridConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L448)

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L449)

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

Defined in: [components/Timeline/Timeline.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L616)

Handle style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **handleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:617](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L617)

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

Defined in: [components/Axis/Axis.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L459)

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: [components/Axis/Axis.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L460)

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-19"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

Defined in: [components/Axis/Axis.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L515)

Runs the layout pass only — scale construction, tick selection, label
textWrap, and outerBounds — with **no DOM access**. After it returns,
`outerBounds()` / `_d3Scale` / `_getPosition()` are populated exactly as
they would be after a full `render()`, but no `<svg>`, `<g>`, tick shapes,
or label TextBoxes are created. Answers "how much room will this axis
need?" without rendering; Plot uses it to size its test-axes. Delegates to
the standalone `measureAxis(axis)` in axisLayout.ts, so callers can run
layout without owning an Axis instance.

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`measure`](#measure)

<a id="on-19"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [components/Timeline/Timeline.ts:628](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L628)

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [components/Timeline/Timeline.ts:629](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L629)

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

Defined in: [components/Timeline/Timeline.ts:630](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L630)

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

Defined in: [components/Timeline/Timeline.ts:631](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L631)

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

Defined in: [components/Axis/Axis.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L470)

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: [components/Axis/Axis.ts:471](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L471)

The orientation of the shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

<a id="outerbounds-8"></a>

##### outerBounds()

> **outerBounds**(): `Record`\<`string`, `number`\>

Defined in: [components/Axis/Axis.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L501)

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-19"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

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

Defined in: [components/Timeline/Timeline.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L648)

The config Object for the Rect class used to create the playButton.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **playButtonConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L649)

The config Object for the Rect class used to create the playButton.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="render-19"></a>

##### render()

> **render**(`callback?`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [components/Timeline/Timeline.ts:573](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L573)

Draws the timeline.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (...`args`: `unknown`[]) => `unknown` | Optional callback invoked after rendering completes. |

###### Returns

`this`

###### Overrides

[`Axis`](#axis).[`render`](#render-1)

<a id="select-19"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [components/Axis/Axis.ts:529](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L529)

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

Defined in: [components/Axis/Axis.ts:530](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L530)

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

Defined in: [components/Timeline/Timeline.ts:659](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L659)

Selection style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **selectionConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Timeline/Timeline.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L660)

Selection style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="shapeconfig-20"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L544)

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:545](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L545)

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-8"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Axis/Axis.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L555)

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Axis/Axis.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Axis/Axis.ts#L556)

Title configuration of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

<a id="toscene-19"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [components/Timeline/Timeline.ts:555](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Timeline/Timeline.ts#L555)

Extends the native Axis scene with the Timeline-specific play-button
TextBox.

The brush selection + handles are NOT composed here: d3-brush owns its
own DOM (mounted in `g.brushGroup` and styled by `_brushStyle`), which the
Viz lifts above the scene so it paints on top of the timeline ticks. That
DOM brush is the sole brush visual and interaction layer — drawing a
second copy from the scene only duplicated it at the wrong height (the
full outer bounds rather than the tick band), so the overlay no longer
lined up with the timeline.

###### Returns

`GroupNode`

###### Overrides

[`Axis`](#axis).[`toScene`](#toscene-1)

<a id="translate-19"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-19"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-20"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="tooltip-1"></a>

### Tooltip

Defined in: [components/Tooltip.ts:314](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L314)

Creates HTML tooltips in the body of a webpage.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="arrowstyle"></a>

##### arrowStyle()

###### Call Signature

> **arrowStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L448)

CSS styles applied to the arrow element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **arrowStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:449](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L449)

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

Defined in: [components/Tooltip.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L459)

CSS styles applied to the body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **bodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:460](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L460)

CSS styles applied to the body element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="colordefaults-20"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-21"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

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

Defined in: [components/Tooltip.ts:496](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L496)

The data array used to create tooltips.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [components/Tooltip.ts:497](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L497)

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

Defined in: [components/Tooltip.ts:505](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L505)

CSS styles applied to the footer element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **footerStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:506](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L506)

CSS styles applied to the footer element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-20"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

<a id="on-20"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

<a id="parent-20"></a>

##### parent()

###### Call Signature

> **parent**(): `HTMLElement` \| `undefined`

Defined in: [components/Tooltip.ts:476](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L476)

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

Defined in: [components/Tooltip.ts:477](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L477)

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

> **position**(): (`d`: `DataPoint`, `i?`: `number`) => `HTMLElement` \| `number`[]

Defined in: [components/Tooltip.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L521)

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Returns

(`d`: `DataPoint`, `i?`: `number`) => `HTMLElement` \| `number`[]

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

###### Call Signature

> **position**(`_`: `string` \| `HTMLElement` \| `number`[] \| ((`d`: `DataPoint`, `i?`: `number`) => `HTMLElement` \| `number`[])): `this`

Defined in: [components/Tooltip.ts:522](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L522)

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `number`[] \| ((`d`: `DataPoint`, `i?`: `number`) => `HTMLElement` \| `number`[]) |

###### Returns

`this`

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

<a id="shapeconfig-21"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

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

Defined in: [components/Tooltip.ts:556](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L556)

CSS styles applied to the table element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tableStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:557](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L557)

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

Defined in: [components/Tooltip.ts:567](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L567)

CSS styles applied to the table body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tbodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:568](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L568)

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

> **tdStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Tooltip.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L632)

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>. Values may be `(d, i)` functions, where `i` is the cell's column index.

###### Returns

`Record`\<`string`, `unknown`\>

###### Example

```ts
{
"text-align": (d, i) => i ? "right" : "left"
}
```

###### Call Signature

> **tdStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Tooltip.ts:633](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L633)

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>. Values may be `(d, i)` functions, where `i` is the cell's column index.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Example

```ts
{
"text-align": (d, i) => i ? "right" : "left"
}
```

<a id="theadstyle"></a>

##### theadStyle()

###### Call Signature

> **theadStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L578)

CSS styles applied to the table head element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **theadStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:579](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L579)

CSS styles applied to the table head element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="thstyle"></a>

##### thStyle()

###### Call Signature

> **thStyle**(): `Record`\<`string`, `unknown`\>

Defined in: [components/Tooltip.ts:648](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L648)

An object with CSS keys and values to be applied to all <th> elements inside of the <thead>. Values may be `(d, i)` functions, where `i` is the cell's column index.

###### Returns

`Record`\<`string`, `unknown`\>

###### Example

```ts
{
"text-align": (d, i) => i ? "right" : "left"
}
```

###### Call Signature

> **thStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [components/Tooltip.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L649)

An object with CSS keys and values to be applied to all <th> elements inside of the <thead>. Values may be `(d, i)` functions, where `i` is the cell's column index.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Example

```ts
{
"text-align": (d, i) => i ? "right" : "left"
}
```

<a id="titlestyle"></a>

##### titleStyle()

###### Call Signature

> **titleStyle**(): `Record`\<`string`, `string`\>

Defined in: [components/Tooltip.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L589)

CSS styles applied to the title element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **titleStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:590](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L590)

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

Defined in: [components/Tooltip.ts:600](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L600)

Overall CSS styles applied to the tooltip container.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tooltipStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: [components/Tooltip.ts:601](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L601)

Overall CSS styles applied to the tooltip container.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="translate-20"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

Defined in: [components/Tooltip.ts:616](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L616)

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

Defined in: [components/Tooltip.ts:617](https://github.com/d3plus/d3plus/blob/main/packages/core/src/components/Tooltip.ts#L617)

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
| <a id="property-ctx-20"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-21"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="viz"></a>

### Viz

Defined in: [charts/viz/Viz.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L56)

The base class every d3plus chart extends. Owns the shared configuration surface (data, groupBy, size and color accessors, title, legend, tooltip, timeline, zoom, table view) and the render lifecycle that each chart type's definition plugs its layout into. Not used directly; see the chart classes (BarChart, Treemap, …).

#### Extends

- `default`

#### Extended by

- [`Plot`](#plot)

#### Methods

<a id="active-10"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L29)

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

Defined in: [charts/viz/VizBaseConfig.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L48)

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

Defined in: [charts/viz/VizBaseConfig.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L57)

Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.attribution`

<a id="attributionicon-1"></a>

##### attributionIcon()

> **attributionIcon**(`_?`: `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`))): `string` \| [`Viz`](#viz) \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) \| `undefined`

Defined in: [charts/viz/VizBaseConfig.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L66)

Overrides the "ⓘ" icon a long attribution collapses to (see `attribution`), which otherwise renders as an inline SVG. Accepts an HTML string — used as the toggle button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it. A returned cleanup function runs right before that slot is discarded, which happens whenever the credit's markup regenerates (its text or theme changes), not just once per chart.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) \| `undefined`

###### Inherited from

`VizBase.attributionIcon`

<a id="attributionstyle-1"></a>

##### attributionStyle()

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L80)

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

Defined in: [charts/viz/VizBaseConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L95)

Configuration object for the back button. Superseded by
`.backControlStyle()`/`.backControlClassName()` for the button's
appearance (it renders as a real `<button>`, like the zoom/search
controls, not a configurable text node) — kept for backwards
compatibility, but no longer affects how the button looks.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.backConfig`

<a id="backcontrolclassname-1"></a>

##### backControlClassName()

> **backControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L104)

An additional CSS class name (or space-separated list of class names) applied to the back button, alongside its fixed `back-control` class. Setting this automatically disables d3plus's built-in inline `backControlStyle` default (as long as you haven't already customized it yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.backControlClassName`

<a id="backcontrolstyle-1"></a>

##### backControlStyle()

> **backControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L113)

An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.backControlStyle`

<a id="color-1"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:124](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L124)

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

###### Inherited from

`VizBase.color`

<a id="colordefaults-21"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

`VizBase.colorDefaults`

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

`VizBase.colorDefaults`

<a id="colorscale-2"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string` \| `number` \| `boolean` \| `DataPoint`)

Defined in: [charts/viz/VizBaseConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L142)

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

Defined in: [charts/viz/VizBaseConfig.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L161)

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

Defined in: [charts/viz/VizBaseConfig.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L196)

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

> **colorScalePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L172)

Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.colorScalePadding`

<a id="colorscaleposition-1"></a>

##### colorScalePosition()

> **colorScalePosition**(`_?`: `string` \| `boolean` \| (() => `string` \| `boolean`)): `string` \| `boolean` \| [`Viz`](#viz) \| (() => `string` \| `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L184)

Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| (() => `string` \| `boolean`) |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz) \| (() => `string` \| `boolean`)

###### Inherited from

`VizBase.colorScalePosition`

<a id="config-22"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L131)

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.config`

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:132](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L132)

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

`VizBase.config`

<a id="data-20"></a>

##### data()

> **data**(`_?`: `string` \| `DataPoint`[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: `DataPoint`[]) => `Record`\<`string`, `unknown`\> \| `DataPoint`[]): [`Viz`](#viz) \| `DataPoint`[]

Defined in: [charts/viz/VizBaseConfig.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L214)

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

Defined in: [charts/viz/Viz.ts:723](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L723)

Tears down the visualization: disconnects the ResizeObserver, stops listening for web font loads, and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

<a id="detectresize-1"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:242](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L242)

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

Defined in: [charts/viz/VizBaseConfig.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L251)

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

Defined in: [charts/viz/VizBaseConfig.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L260)

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

Defined in: [charts/viz/VizBaseConfig.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L269)

The interval, in milliseconds, for checking if the visualization is visible on the page. When `detectVisible` defers a render until the visualization scrolls into view, this is also how long it must stay in view before it renders, so visualizations scrolled past quickly are never drawn.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectVisibleInterval`

<a id="detectvisibleunload-1"></a>

##### detectVisibleUnload()

> **detectVisibleUnload**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L278)

When `true` (the default) and `detectVisible` is enabled, the Viz releases its DOM and scene while it is scrolled out of view and redraws when it returns, keeping the page light when there are many visualizations. Data and configuration are retained; interaction state such as zoom or selection is not, so set this to `false` to keep it. With `detectVisible` enabled, each chart's `<svg>` is also given `content-visibility: auto`, so the browser skips rendering its contents while it is far off-screen (this matters most when this is `false` and charts are kept). For a larger saving you can also apply `content-visibility: auto` and a `contain-intrinsic-size` to the container element yourself; that adds paint containment to an element you own, so it is not done automatically. Requires `IntersectionObserver`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.detectVisibleUnload`

<a id="fontfamily-1"></a>

##### fontFamily()

> **fontFamily**(`_?`: `string` \| `string`[]): `string` \| [`Viz`](#viz) \| `string`[]

Defined in: [charts/viz/VizBaseConfig.ts:287](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L287)

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

Defined in: [charts/viz/VizBaseConfig.ts:320](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L320)

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

Defined in: [charts/viz/VizBaseConfig.ts:357](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L357)

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

Defined in: [charts/viz/VizBaseConfig.ts:368](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L368)

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) |

###### Returns

`number` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

###### Inherited from

`VizBase.hiddenOpacity`

<a id="highlight-1"></a>

##### highlight()

> **highlight**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `undefined`

Defined in: [charts/viz/VizBaseConfig.ts:438](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L438)

Persistently emphasizes the data points matching the given predicate: the
matching marks keep their color while every other mark is de-emphasized to
a neutral gray (the "emphasis" form — highlight one series, gray the rest).
Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
standing state that survives pointer movement. Pass `false` to clear it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `undefined`

###### Inherited from

`VizBase.highlight`

<a id="hover-10"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `this`

Defined in: [charts/viz/VizBaseConfig.ts:380](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L380)

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

Defined in: [charts/viz/VizBaseConfig.ts:454](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L454)

Accessor function, or a constant string applied to every data point's
label (unlike `value`/`nodeId`/etc., a string here is not treated as a
per-datum object key — pass a function for that).

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

Defined in: [charts/viz/VizBaseConfig.ts:465](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L465)

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

Defined in: [charts/viz/VizBaseConfig.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L481)

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

> **legendFilterInvert**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:490](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L490)

Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.legendFilterInvert`

<a id="legendinset-1"></a>

##### legendInset()

> **legendInset**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:502](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L502)

Whether the chart may draw one of its legends inside the empty space around its marks instead of in a margin, for charts that leave room (Plot, Network, Pack, Pie, Rings, Tree, and Geomap). After the chart lays out, the size legend is tried first, then the legend, then the colorScale; the first that fits is drawn over a semi-transparent box (see `legendInsetConfig`), and any others keep their margins. Space enclosed by the marks, like the middle of a ring of points, is never used. A legend or colorScale whose position was set explicitly stays in that margin. Defaults to `true`; also accepts a function that receives the resolved chart config and returns a boolean.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>) => `boolean`)

###### Inherited from

`VizBase.legendInset`

<a id="legendinsetconfig-1"></a>

##### legendInsetConfig()

> **legendInsetConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBaseConfig.ts:513](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L513)

Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.legendInsetConfig`

<a id="legendpadding-1"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBaseConfig.ts:522](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L522)

Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.legendPadding`

<a id="legendposition-1"></a>

##### legendPosition()

> **legendPosition**(`_?`: `string` \| (() => `string`)): `string` \| [`Viz`](#viz) \| (() => `string`)

Defined in: [charts/viz/VizBaseConfig.ts:534](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L534)

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

Defined in: [charts/viz/VizBaseConfig.ts:544](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBaseConfig.ts#L544)

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

Defined in: [charts/viz/VizBase.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L27)

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

Defined in: [charts/viz/VizBase.ts:38](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L38)

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.loadingMessage`

<a id="locale-21"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

`VizBase.locale`

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

`VizBase.locale`

<a id="messagemask-1"></a>

##### messageMask()

> **messageMask**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L47)

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

Defined in: [charts/viz/VizBase.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L56)

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.messageStyle`

<a id="minimapclassname-1"></a>

##### minimapClassName()

> **minimapClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L65)

An additional CSS class name (or space-separated list of class names) applied to the minimap's outer box, viewport box, and zoom-level label, alongside their fixed `d3plus-minimap` / `d3plus-minimap-viewport` / `d3plus-minimap-label` classes. Setting this automatically disables d3plus's built-in inline `minimapStyle`/`minimapViewportStyle`/`minimapViewportStyleActive`/`minimapLabelStyle` defaults (as long as you haven't already customized them yourself), so a host page's own styling applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.minimapClassName`

<a id="minimaplabelstyle-1"></a>

##### minimapLabelStyle()

> **minimapLabelStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L74)

An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.minimapLabelStyle`

<a id="minimapstyle-1"></a>

##### minimapStyle()

> **minimapStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L85)

An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.minimapStyle`

<a id="minimapviewportstyle-1"></a>

##### minimapViewportStyle()

> **minimapViewportStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L96)

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.minimapViewportStyle`

<a id="minimapviewportstyleactive-1"></a>

##### minimapViewportStyleActive()

> **minimapViewportStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:107](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L107)

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.minimapViewportStyleActive`

<a id="nodatahtml-1"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: [charts/viz/VizBase.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L118)

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

Defined in: [charts/viz/VizBase.ts:129](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L129)

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.noDataMessage`

<a id="on-21"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

`VizBase.on`

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

`VizBase.on`

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

`VizBase.on`

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

`VizBase.on`

<a id="parent-21"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

`VizBase.parent`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

`VizBase.parent`

<a id="render-20"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [charts/viz/Viz.ts:289](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L289)

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

Defined in: [charts/viz/Viz.ts:321](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L321)

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: [charts/viz/Viz.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L322)

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

Defined in: [charts/viz/Viz.ts:335](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L335)

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Returns

`"full"` \| `"compute"`

###### Call Signature

> **renderMode**(`_`: `"full"` \| `"compute"`): `this`

Defined in: [charts/viz/Viz.ts:336](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L336)

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

Defined in: [charts/viz/Viz.ts:350](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L350)

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

Defined in: [charts/viz/VizBase.ts:138](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L138)

If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `HTMLElement` \| `Window` |

###### Returns

`string` \| [`Viz`](#viz) \| `HTMLElement` \| `Window`

###### Inherited from

`VizBase.scrollContainer`

<a id="searchaccessor-1"></a>

##### searchAccessor()

> **searchAccessor**(`_?`: (`d`: `DataPoint`, `i`: `number`) => `string`): [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

Defined in: [charts/viz/VizBase.ts:158](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L158)

Resolves the string the search box matches its typed term against, for
a given datum. Defaults to the mark's resolved on-screen label
(`viz._drawLabel`) — the same text the user reads on the chart.
Override it to match against something else instead, e.g. a data
field that isn't shown as the label.

This is checked alongside, not instead of, every level of the datum's
own groupBy hierarchy — searching a leaf's label also matches its
ancestor group's cell/legend entry, and vice versa, regardless of
this accessor's override.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | (`d`: `DataPoint`, `i`: `number`) => `string` |

###### Returns

[`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.searchAccessor`

<a id="searchcontrolclassname-1"></a>

##### searchControlClassName()

> **searchControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L169)

An additional CSS class name (or space-separated list of class names) applied to the search toggle button and input, alongside their fixed `search-control` classes. Setting this automatically disables d3plus's built-in inline `searchControlStyle`/`searchControlStyleActive`/`searchControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.searchControlClassName`

<a id="searchcontrolstyle-1"></a>

##### searchControlStyle()

> **searchControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:178](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L178)

An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.searchControlStyle`

<a id="searchcontrolstyleactive-1"></a>

##### searchControlStyleActive()

> **searchControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L189)

An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.searchControlStyleActive`

<a id="searchcontrolstylehover-1"></a>

##### searchControlStyleHover()

> **searchControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:200](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L200)

An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.searchControlStyleHover`

<a id="select-20"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Viz`](#viz) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: [charts/viz/VizBase.ts:211](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L211)

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

Defined in: [charts/viz/VizBase.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L220)

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `string`)

###### Inherited from

`VizBase.shape`

<a id="shapeconfig-22"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [charts/viz/VizBase.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L231)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.shapeConfig`

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [charts/viz/VizBase.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L232)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

`VizBase.shapeConfig`

<a id="sizelegend-2"></a>

##### sizeLegend()

> **sizeLegend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L243)

Whether to display the size legend: a nested-circle key, in the chart's bottom-right corner, for charts that size their marks with a `size` accessor (bubble plots, Geomap points via `pointSize`, Network, Rings). By default it shows whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height. Pass `true` to always show it, `false` to hide it, or a function that receives the resolved chart config, the radius scale, and the legend's measured `{width, height, availableWidth, availableHeight}`, and returns a boolean.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`)

###### Inherited from

`VizBase.sizeLegend`

<a id="sizelegendconfig-2"></a>

##### sizeLegendConfig()

> **sizeLegendConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L259)

Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.sizeLegendConfig`

<a id="sizelegendposition-1"></a>

##### sizeLegendPosition()

> **sizeLegendPosition**(`_?`: `"right"` \| `"bottom"`): [`Viz`](#viz) \| `"right"` \| `"bottom"`

Defined in: [charts/viz/VizBase.ts:268](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L268)

Which margin the size legend claims in the chart's bottom-right corner. `"right"` (the default) widens the right margin, so the chart keeps its full height and the legend sits at the bottom of the right column, below any right-side legend or colorScale. `"bottom"` deepens the bottom margin instead, so the chart keeps its full width and any bottom legend or colorScale narrows to sit beside it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `"right"` \| `"bottom"` |

###### Returns

[`Viz`](#viz) \| `"right"` \| `"bottom"`

###### Inherited from

`VizBase.sizeLegendPosition`

<a id="subtitle-1"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L277)

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

Defined in: [charts/viz/VizBase.ts:288](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L288)

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

> **subtitlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:297](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L297)

Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.subtitlePadding`

<a id="tableviewclassname-1"></a>

##### tableViewClassName()

> **tableViewClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:620](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L620)

An additional CSS class name (or space-separated list of class names) applied to the `<table>` element the table-view toggle renders, alongside the fixed `d3plus-table-view-table` class. Lets a host page style the data table with its own table styling (Tailwind, Bootstrap, a design system) via descendant selectors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewClassName`

<a id="tableviewcontrolclassname-1"></a>

##### tableViewControlClassName()

> **tableViewControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:629](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L629)

An additional CSS class name (or space-separated list of class names) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. Setting this automatically disables d3plus's built-in inline `tableViewControlStyle`/`tableViewControlStyleActive`/`tableViewControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewControlClassName`

<a id="tableviewcontrolstyle-1"></a>

##### tableViewControlStyle()

> **tableViewControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L638)

An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewControlStyle`

<a id="tableviewcontrolstyleactive-1"></a>

##### tableViewControlStyleActive()

> **tableViewControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:649](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L649)

An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewControlStyleActive`

<a id="tableviewcontrolstylehover-1"></a>

##### tableViewControlStyleHover()

> **tableViewControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L660)

An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewControlStyleHover`

<a id="tableviewpagesize-1"></a>

##### tableViewPageSize()

> **tableViewPageSize**(`_?`: `number` \| `false`): `number` \| `false` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:671](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L671)

The number of data-table rows shown per page while in table view. Set to `false` (or any non-positive number) to disable pagination and show every row on one page.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| `false` |

###### Returns

`number` \| `false` \| [`Viz`](#viz)

###### Inherited from

`VizBase.tableViewPageSize`

<a id="threshold-1"></a>

##### threshold()

> **threshold**(`_?`: `number` \| ((`data`: `DataPoint`[]) => `number`)): `number` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `number`)

Defined in: [charts/viz/VizBase.ts:309](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L309)

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

Defined in: [charts/viz/VizBase.ts:326](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L326)

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

Defined in: [charts/viz/VizBase.ts:342](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L342)

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

Defined in: [charts/viz/VizBase.ts:354](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L354)

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

Defined in: [charts/viz/VizBase.ts:399](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L399)

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

Defined in: [charts/viz/VizBase.ts:408](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L408)

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

> **timelinePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:421](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L421)

Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.timelinePadding`

<a id="title-1"></a>

##### title()

> **title**(`_?`: `string` \| ((`data`: `DataPoint`[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

Defined in: [charts/viz/VizBase.ts:433](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L433)

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: `DataPoint`[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: `DataPoint`[]) => `string`)

###### Inherited from

`VizBase.title`

<a id="titleconfig-9"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:444](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L444)

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

> **titlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:453](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L453)

Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.titlePadding`

<a id="tocanvas-1"></a>

##### toCanvas()

> **toCanvas**(): `unknown`

Defined in: [charts/viz/Viz.ts:310](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L310)

Returns the underlying canvas element of the most recent render when the
canvas backend is active (`renderer("canvas")`), or `undefined` otherwise.
Server-side callers cast this to their native canvas to encode a raster
(see `@d3plus/ssr`).

###### Returns

`unknown`

<a id="tooltip-2"></a>

##### tooltip()

> **tooltip**(`_?`: `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:464](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L464)

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

Defined in: [charts/viz/VizBase.ts:475](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L475)

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

`Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.tooltipConfig`

<a id="toscene-20"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: [charts/viz/Viz.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L85)

Composes a backend-agnostic scene graph from the shapes/features produced
by the most recent render. Combines:
- `_chartScene` (cells from `chartDef.emit`, or `Plot._paint` for the
  paint-driven Plot family) wrapped in viz-chart-cells
- `_shapes` (still used by some charts) — each shape's toScene
- chart-level components (Legend/ColorScale/Timeline) via their toScene
- `_featurePanels` (from FeatureModule layouts) wrapped in viz-features

###### Returns

`Scene`

<a id="tosvgstring-1"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [charts/viz/Viz.ts:300](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/Viz.ts#L300)

Serializes the most recently rendered output to an SVG string. Returns
`""` if the chart has not been rendered yet. Both backends support this:
the SVG backend returns its live `<svg>`, the canvas backend re-renders the
retained scene through a throwaway SVG backend. Primarily used for
server-side rendering (see `@d3plus/ssr`).

###### Returns

`string`

<a id="total-1"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)): `string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: `DataPoint`, `i`: `number`) => `number`)

Defined in: [charts/viz/VizBase.ts:484](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L484)

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

Defined in: [charts/viz/VizBase.ts:498](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L498)

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

Defined in: [charts/viz/VizBase.ts:507](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L507)

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

> **totalPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: [charts/viz/VizBase.ts:516](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L516)

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

###### Inherited from

`VizBase.totalPadding`

<a id="translate-21"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

`VizBase.translate`

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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

`VizBase.translate`

<a id="zoombrushhandlesize-1"></a>

##### zoomBrushHandleSize()

> **zoomBrushHandleSize**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:527](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L527)

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

Defined in: [charts/viz/VizBase.ts:536](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L536)

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

Defined in: [charts/viz/VizBase.ts:547](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L547)

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomBrushSelectionStyle`

<a id="zoomcontrolclassname-1"></a>

##### zoomControlClassName()

> **zoomControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:558](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L558)

An additional CSS class name (or space-separated list of class names) applied to each zoom control button, alongside the fixed `zoom-control` / `zoom-in` / `zoom-out` / `zoom-reset` / `zoom-brush` classes. Setting this automatically disables d3plus's built-in inline `zoomControlStyle`/`zoomControlStyleActive`/`zoomControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` |

###### Returns

`string` \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomControlClassName`

<a id="zoomcontrolicons-1"></a>

##### zoomControlIcons()

> **zoomControlIcons**(`_?`: `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\>): [`Viz`](#viz) \| `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> \| `undefined`

Defined in: [charts/viz/VizBase.ts:567](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L567)

Overrides one or more of the four built-in zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline SVGs. Each value is either an HTML string — used as the button's content in place of the built-in icon — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot (a 12x12px element) so you can mount anything imperative into it: a React tree (`createRoot(el).render(<Icon/>)`), a Vue app, a canvas sprite, a brand `<img>`. Return a cleanup function from the mount function if there's teardown to do; it runs right before that slot is discarded — which happens whenever the whole button panel's markup regenerates (a `.locale(...)` change, a `zoomControlClassName` change, or the brush toggle switching), not just once per chart.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> |

###### Returns

[`Viz`](#viz) \| `Partial`\<`Record`\<`ZoomControlIconKey`, `ZoomControlIconValue`\>\> \| `undefined`

###### Inherited from

`VizBase.zoomControlIcons`

<a id="zoomcontrolstyle-1"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| `Record`\<`string`, `unknown`\> \| [`Viz`](#viz)

Defined in: [charts/viz/VizBase.ts:578](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L578)

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:589](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L589)

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:600](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L600)

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: [charts/viz/VizBase.ts:611](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/VizBase.ts#L611)

A pixel value to be used to pad all sides of a zoomed area.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Viz`](#viz)

###### Inherited from

`VizBase.zoomPadding`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ctx-21"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | `VizBase.ctx` | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-22"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | `VizBase.schema` | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

***

<a id="whisker"></a>

### Whisker

Defined in: [shapes/Whisker.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L37)

Creates SVG whiskers based on an array of data: a line from each point in a given direction, capped with an endpoint shape.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="active-11"></a>

##### active()

> **active**(`_`: ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: [shapes/Whisker.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L196)

The active highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="colordefaults-22"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): `ColorDefaults`

Defined in: [utils/BaseClass.ts:213](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L213)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

`ColorDefaults`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

###### Call Signature

> **colorDefaults**(`_`: [`ColorDefaultsConfig`](#colordefaultsconfig)): `this`

Defined in: [utils/BaseClass.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L214)

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`ColorDefaultsConfig`](#colordefaultsconfig) |

###### Returns

`this`

###### Example

```ts
new Treemap()
.colorDefaults({
dark: "#222",
light: "#fff",
scale: ["#1b9e77", "#d95f02", "#7570b3"]
})
```

###### Inherited from

[`BaseClass`](#baseclass).[`colorDefaults`](#colordefaults-7)

<a id="config-23"></a>

##### config()

###### Call Signature

> **config**(): [`WhiskerConfig`](#whiskerconfig-2)

Defined in: [shapes/Whisker.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L262)

Narrowed `.config()` for Whisker. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`WhiskerConfig`](#whiskerconfig-2)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`WhiskerConfig`](#whiskerconfig-2)\>): `this`

Defined in: [shapes/Whisker.ts:263](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L263)

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

Defined in: [shapes/Whisker.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L207)

The data array used to create shapes.

###### Returns

`DataPoint`[]

###### Call Signature

> **data**(`_`: `DataPoint`[]): `this`

Defined in: [shapes/Whisker.ts:208](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L208)

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

Defined in: [shapes/Whisker.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L216)

Configuration object for each endpoint.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **endpointConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Whisker.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L217)

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

Defined in: [shapes/Whisker.ts:227](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L227)

The hover highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="lineconfig-2"></a>

##### lineConfig()

###### Call Signature

> **lineConfig**(): `Record`\<`string`, `unknown`\>

Defined in: [shapes/Whisker.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L238)

Configuration object for the line shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **lineConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: [shapes/Whisker.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L239)

Configuration object for the line shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-22"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: [utils/BaseClass.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L194)

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

Defined in: [utils/BaseClass.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L195)

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

<a id="on-22"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: [utils/BaseClass.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L237)

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

Defined in: [utils/BaseClass.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L238)

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

Defined in: [utils/BaseClass.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L239)

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

Defined in: [utils/BaseClass.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L240)

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

<a id="parent-22"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: [utils/BaseClass.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L261)

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: [utils/BaseClass.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L262)

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

<a id="render-21"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: [shapes/Whisker.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L63)

Draws the whisker.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | () => `void` | Optional callback invoked after rendering completes. |

###### Returns

`this`

<a id="select-21"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: [shapes/Whisker.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L249)

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: [shapes/Whisker.ts:250](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L250)

The SVG container element for this visualization. 3 selector or DOM element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `SVGElement` \| `null` |

###### Returns

`this`

<a id="shapeconfig-23"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: [utils/BaseClass.ts:290](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L290)

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: [utils/BaseClass.ts:291](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L291)

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

<a id="toscene-21"></a>

##### toScene()

> **toScene**(): `GroupNode`

Defined in: [shapes/Whisker.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/Whisker.ts#L181)

Compute-mode scene aggregation, mirroring Box.toScene(). Returns a
GroupNode containing the inner Line's scene children plus each
endpoint shape's scene children.

###### Returns

`GroupNode`

<a id="translate-22"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: [utils/BaseClass.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L277)

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

Defined in: [utils/BaseClass.ts:278](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L278)

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
| <a id="property-ctx-22"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | [utils/BaseClass.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L101) |
| <a id="property-schema-23"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | [utils/BaseClass.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/BaseClass.ts#L99) |

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

<a id="configprep"></a>

### configPrep()

> **configPrep**(`this`: `VizContext`, `config?`: `ConfigObject`, `type?`: `string`, `nest?`: `string` \| `false`): `ConfigObject`

Defined in: [utils/configPrep.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/configPrep.ts#L47)

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

<a id="configwarnings"></a>

### configWarnings()

#### Call Signature

> **configWarnings**(): `boolean`

Defined in: [utils/configWarnings.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/configWarnings.ts#L15)

Toggles the console warnings d3plus logs when a class receives a config
property it does not support (like a misspelled key passed to `.config()`
or `shapeConfig`). Warnings are on by default and the setting applies to
every chart on the page. With no argument, returns the current setting.

##### Returns

`boolean`

##### Example

```ts
import {configWarnings} from "@d3plus/core";
configWarnings(false);
```

#### Call Signature

> **configWarnings**(`_`: `boolean`): `void`

Defined in: [utils/configWarnings.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/configWarnings.ts#L16)

Toggles the console warnings d3plus logs when a class receives a config
property it does not support (like a misspelled key passed to `.config()`
or `shapeConfig`). Warnings are on by default and the setting applies to
every chart on the page. With no argument, returns the current setting.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

##### Returns

`void`

##### Example

```ts
import {configWarnings} from "@d3plus/core";
configWarnings(false);
```

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

## Variables

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

<a id="barchart"></a>

### BarChart

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `baseline` | `0` |
| `discrete` | `"x"` |
| `shape` | `"Bar"` |
| `tooltipConfig` | — |
| `legend` | — |


Defined in: [charts/BarChart/index.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/BarChart/index.ts#L56)

Creates a bar chart based on an array of data. When stacked, each bar's
fraction of its stack total is available to tooltip accessors as `share`.

***

<a id="boxwhisker"></a>

### BoxWhisker

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `discrete` | `"x"` |
| `shape` | `"Box"` |
| `tooltipShared` | `false` |
| `tooltipConfig` | — |


Defined in: [charts/BoxWhisker/index.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/BoxWhisker/index.ts#L50)

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

<a id="chord"></a>

### Chord

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `arcThickness` | `20` |
| `arrows` | `false` |
| `arrowSize` | — |
| `chordOpacity` | `0.6` |
| `directed` | `true` |
| `links` | `accessor(…)` |
| `linksSource` | `"source"` |
| `linksTarget` | `"target"` |
| `noDataMessage` | `false` |
| `nodes` | `accessor(…)` |
| `nodeId` | `accessor(…)` |
| `padAngle` | — |
| `padPixel` | `2` |
| `value` | `1` |
| `shape` | `"Path"` |
| `shapeConfig` | — |
| `tooltipConfig` | — |


Defined in: [charts/Chord/index.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Chord/index.ts#L191)

Creates a Chord diagram based on a defined set of nodes and links.

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
| `ocean` | — |
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


Defined in: [charts/Geomap/index.ts:491](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Geomap/index.ts#L491)

Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points.

***

<a id="histogram"></a>

### Histogram

Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `baseline` | `0` |
| `binThresholds` | — |
| `binDomain` | — |
| `binWidth` | — |
| `binNormalize` | `"count"` |
| `discrete` | `"x"` |
| `shape` | `"Bar"` |
| `stacked` | `true` |
| `tooltipConfig` | — |
| `value` | `keyedAccessor(…)` |


Defined in: [charts/Histogram/index.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Histogram/index.ts#L190)

Creates a histogram from an array of raw observations: the `value` of each
row is binned along a linear x axis, and bar heights show each bin's
count (or density / relative frequency via `binNormalize`). Series set by
`groupBy` share bin edges and are stacked.

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


Defined in: [charts/Matrix/index.ts:105](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Matrix/index.ts#L105)

Creates a simple rows/columns Matrix view of any dataset.

***

<a id="network"></a>

### Network

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `arrows` | `false` |
| `arrowSize` | — |
| `links` | `[]` |
| `linkSize` | `1` |
| `linkSizeMin` | `1` |
| `linkSizeScale` | `"sqrt"` |
| `noDataMessage` | `false` |
| `nodeGroupBy` | `[]` |
| `tooltipConfig` | — |
| `nodes` | `[]` |
| `sizeMax` | — |
| `sizeMin` | `5` |
| `sizeScale` | `"sqrt"` |
| `shape` | `"Circle"` |
| `shapeConfig` | — |


Defined in: [charts/Network/index.ts:363](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Network/index.ts#L363)

Creates a network visualization based on a defined set of nodes and edges.

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


Defined in: [charts/Pack/index.ts:172](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pack/index.ts#L172)

Uses the d3 pack layout to create a Circle Packing chart based on an array of data.

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


Defined in: [charts/Pie/index.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Pie/index.ts#L167)

Uses the d3 pie layout to create SVG arcs based on an array of data.

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


Defined in: [charts/Radar/index.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Radar/index.ts#L96)

Creates a radar visualization based on an array of data.

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


Defined in: [charts/RadialMatrix/index.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/RadialMatrix/index.ts#L149)

Creates a radial layout of a rows/columns Matrix of any dataset.

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
| `arrows` | `false` |
| `arrowSize` | — |
| `center` | — |
| `tooltipConfig` | — |
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


Defined in: [charts/Rings/index.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Rings/index.ts#L231)

Creates a ring visualization based on a defined set of nodes and edges.

***

<a id="sankey"></a>

### Sankey

Extends [`Viz`](#viz) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `arrows` | `false` |
| `arrowSize` | — |
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


Defined in: [charts/Sankey/index.ts:219](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Sankey/index.ts#L219)

Creates a Sankey visualization based on a defined set of nodes and links.

***

<a id="stackedarea"></a>

### StackedArea

Extends [`AreaPlot`](#areaplot) — accepts all of its configuration. Adds or overrides these defaults:

| Method | Default |
| --- | --- |
| `stacked` | `true` |
| `tooltipConfig` | — |


Defined in: [charts/StackedArea/index.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/StackedArea/index.ts#L28)

Creates a stacked area plot based on an array of data. Each point's
fraction of its stack total is available to tooltip accessors as `share`.

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


Defined in: [charts/Tree/index.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Tree/index.ts#L100)

Uses d3's tree layout to create a tidy tree chart based on an array of data.

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


Defined in: [charts/Treemap/index.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/Treemap/index.ts#L183)

Uses the d3 treemap layout to create SVG rectangles based on an array of data.

## Interfaces

<a id="areaconfig-1"></a>

### AreaConfig

Defined in: [shapes/shapeConfig.ts:190](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L190)

Area-specific config (curve, defined, dual-edge x/y).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-curve"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L191) |
| <a id="property-data"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-defined"></a> `defined?` | (`d`: `DataPoint`) => `boolean` | Determines whether a data point is defined (a gap in the area when false). | - | [shapes/shapeConfig.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L193) |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hitarea"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-vectoreffect"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-x"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-x0"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:194](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L194) |
| <a id="property-x1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:195](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L195) |
| <a id="property-y"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |
| <a id="property-y0"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L196) |
| <a id="property-y1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:197](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L197) |

***

<a id="axisconfig-2"></a>

### AxisConfig

Defined in: [utils/D3plusConfig.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L51)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-barconfig"></a> `barConfig?` | `Record`\<`string`, `string` \| `number`\> | - | [utils/D3plusConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L52) |
| <a id="property-domainticks"></a> `domainTicks?` | `boolean` | Whether the domain's min and max are always shown as ticks, even when they aren't among the scale's own "nice" tick values (the nearest nice tick is dropped when it would crowd them). Defaults to `true`; zooming turns it off so a rescaled axis shows only nice values. | [utils/D3plusConfig.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L89) |
| <a id="property-fixedsize"></a> `fixedSize?` | `number` | Exact size of the space that contains the axis tick labels and title. Labels that need more room overflow outward instead of moving the axis line; zooming pins a rescaled axis this way so it doesn't shift. | [utils/D3plusConfig.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L67) |
| <a id="property-grid"></a> `grid?` | `unknown`[] | Grid values of the axis. | [utils/D3plusConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L54) |
| <a id="property-gridconfig"></a> `gridConfig?` | `Record`\<`string`, `string` \| `number`\> | - | [utils/D3plusConfig.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L55) |
| <a id="property-gridsize"></a> `gridSize?` | `number` | Grid size of the axis. | [utils/D3plusConfig.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L57) |
| <a id="property-label-1"></a> `label?` | `string` | - | [utils/D3plusConfig.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L58) |
| <a id="property-labeloffset"></a> `labelOffset?` | `number` \| `false` | - | [utils/D3plusConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L61) |
| <a id="property-labels"></a> `labels?` | `unknown`[] | Visible tick labels of the axis. | [utils/D3plusConfig.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L60) |
| <a id="property-maxsize"></a> `maxSize?` | `number` | Maximum size allowed for the space that contains the axis tick labels and title. | [utils/D3plusConfig.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L69) |
| <a id="property-minsize"></a> `minSize?` | `number` | Minimum size alloted for the space that contains the axis tick labels and title. | [utils/D3plusConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L71) |
| <a id="property-range"></a> `range?` | (`number` \| `undefined`)[] | Scale range (in pixels) of the axis. The given array must have 2 values, but one may be `undefined` to allow the default behavior for that value. | [utils/D3plusConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L76) |
| <a id="property-scale-1"></a> `scale?` | `AxisScale` | Scale of the axis. | [utils/D3plusConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L78) |
| <a id="property-tickformat"></a> `tickFormat?` | (`d`: `string` \| `number`) => `string` \| `number` | Tick formatter. | [utils/D3plusConfig.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L80) |
| <a id="property-ticks"></a> `ticks?` | `unknown`[] | Tick values of the axis. | [utils/D3plusConfig.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L82) |
| <a id="property-ticksize"></a> `tickSize?` | `number` | - | [utils/D3plusConfig.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L90) |
| <a id="property-timelocale"></a> `timeLocale?` | `Record`\<`string`, `unknown`\> | Defines a custom locale object to be used in time scales. Must include `dateTime`, `date`, `time`, `periods`, `days`, `shortDays`, `months`, and `shortMonths` (see [d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale)). | [utils/D3plusConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L97) |
| <a id="property-title"></a> `title?` | `string` | Title of the axis. | [utils/D3plusConfig.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L99) |

***

<a id="barconfig-7"></a>

### BarConfig

Defined in: [shapes/shapeConfig.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L206)

Bar-specific config (Rect + start/end coords).

#### Extends

- [`RectConfig`](#rectconfig-3)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-1"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`RectConfig`](#rectconfig-3).[`active`](#property-active-8) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-1"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`RectConfig`](#rectconfig-3).[`activeOpacity`](#property-activeopacity-6) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-1"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`RectConfig`](#rectconfig-3).[`activeStyle`](#property-activestyle-6) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-1"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`ariaLabel`](#property-arialabel-6) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-1"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`RectConfig`](#rectconfig-3).[`backgroundImage`](#property-backgroundimage-6) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-1"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`RectConfig`](#rectconfig-3).[`backgroundImageFit`](#property-backgroundimagefit-6) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-data-1"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`RectConfig`](#rectconfig-3).[`data`](#property-data-9) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-discrete-1"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`RectConfig`](#rectconfig-3).[`discrete`](#property-discrete-7) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-1"></a> `duration?` | `number` | Animation duration in ms. | [`RectConfig`](#rectconfig-3).[`duration`](#property-duration-8) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-1"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`RectConfig`](#rectconfig-3).[`fill`](#property-fill-6) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-1"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`RectConfig`](#rectconfig-3).[`fillOpacity`](#property-fillopacity-6) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-height"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`height`](#property-height-3) | [shapes/shapeConfig.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L167) |
| <a id="property-hitarea-1"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`RectConfig`](#rectconfig-3).[`hitArea`](#property-hitarea-6) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-1"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`RectConfig`](#rectconfig-3).[`hover`](#property-hover-8) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-1"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverOpacity`](#property-hoveropacity-6) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-1"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverStyle`](#property-hoverstyle-6) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-1"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`RectConfig`](#rectconfig-3).[`id`](#property-id-7) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-2"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`RectConfig`](#rectconfig-3).[`label`](#property-label-8) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-1"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`RectConfig`](#rectconfig-3).[`labelBounds`](#property-labelbounds-6) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-1"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`RectConfig`](#rectconfig-3).[`labelConfig`](#property-labelconfig-6) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-1"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`RectConfig`](#rectconfig-3).[`on`](#property-on-7) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-1"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`RectConfig`](#rectconfig-3).[`opacity`](#property-opacity-7) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-1"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`RectConfig`](#rectconfig-3).[`pointerEvents`](#property-pointerevents-7) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode-1"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`RectConfig`](#rectconfig-3).[`renderMode`](#property-rendermode-6) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-1"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`role`](#property-role-6) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-1"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`RectConfig`](#rectconfig-3).[`rotate`](#property-rotate-6) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-1"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`rx`](#property-rx-6) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-1"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`ry`](#property-ry-6) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-2"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`RectConfig`](#rectconfig-3).[`scale`](#property-scale-7) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-1"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`RectConfig`](#rectconfig-3).[`select`](#property-select-8) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-1"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`RectConfig`](#rectconfig-3).[`shapeRendering`](#property-shaperendering-6) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-1"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`RectConfig`](#rectconfig-3).[`sort`](#property-sort-6) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-1"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`RectConfig`](#rectconfig-3).[`stroke`](#property-stroke-6) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-1"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`RectConfig`](#rectconfig-3).[`strokeDasharray`](#property-strokedasharray-6) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-1"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`RectConfig`](#rectconfig-3).[`strokeLinecap`](#property-strokelinecap-6) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-1"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`RectConfig`](#rectconfig-3).[`strokeOpacity`](#property-strokeopacity-6) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-1"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`RectConfig`](#rectconfig-3).[`strokeWidth`](#property-strokewidth-6) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-1"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`RectConfig`](#rectconfig-3).[`textAnchor`](#property-textanchor-6) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-1"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`RectConfig`](#rectconfig-3).[`texture`](#property-texture-6) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-1"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`RectConfig`](#rectconfig-3).[`textureDefault`](#property-texturedefault-6) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-trail"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the rect as it moves between frames. | [`RectConfig`](#rectconfig-3).[`trail`](#property-trail-2) | [shapes/shapeConfig.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L169) |
| <a id="property-trailpersist"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | [`RectConfig`](#rectconfig-3).[`trailPersist`](#property-trailpersist-2) | [shapes/shapeConfig.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L171) |
| <a id="property-vectoreffect-1"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`RectConfig`](#rectconfig-3).[`vectorEffect`](#property-vectoreffect-6) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-1"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`RectConfig`](#rectconfig-3).[`verticalAlign`](#property-verticalalign-6) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-width"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`width`](#property-width-3) | [shapes/shapeConfig.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L166) |
| <a id="property-x-1"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`RectConfig`](#rectconfig-3).[`x`](#property-x-9) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-x0-1"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:207](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L207) |
| <a id="property-x1-1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:208](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L208) |
| <a id="property-y-1"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`RectConfig`](#rectconfig-3).[`y`](#property-y-9) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |
| <a id="property-y0-1"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:209](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L209) |
| <a id="property-y1-1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | [shapes/shapeConfig.ts:210](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L210) |

***

<a id="baseshapeconfig"></a>

### BaseShapeConfig

Defined in: [shapes/shapeConfig.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L47)

Common props inherited from `Shape` — every shape subclass accepts
these via `.config(...)` regardless of geometry.

#### Extended by

- [`AreaConfig`](#areaconfig-1)
- [`CircleConfig`](#circleconfig-1)
- [`LineConfig`](#lineconfig-3)
- [`PathConfig`](#pathconfig-1)
- [`RectConfig`](#rectconfig-3)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-2"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-2"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-2"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-2"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-2"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-2"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-data-2"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-discrete-2"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-2"></a> `duration?` | `number` | Animation duration in ms. | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-2"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-2"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hitarea-2"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-2"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-2"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-2"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-2"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-3"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-2"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-2"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-2"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-2"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-2"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode-2"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-2"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-2"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-2"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-2"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-3"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-2"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-2"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-2"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-2"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-2"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-2"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-2"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-2"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-2"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-2"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-2"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-vectoreffect-2"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-2"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-x-2"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-y-2"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |

***

<a id="boxconfig-1"></a>

### BoxConfig

Defined in: [shapes/shapeConfig.ts:230](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L230)

Box-specific config (whisker + median + outliers; subset of Shape).

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-3"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L231) |
| <a id="property-medianconfig"></a> `medianConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:232](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L232) |
| <a id="property-orient"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Orientation: "vertical" or "horizontal". | [shapes/shapeConfig.ts:234](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L234) |
| <a id="property-outlier"></a> `outlier?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Outlier accessor (per-datum predicate). | [shapes/shapeConfig.ts:236](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L236) |
| <a id="property-outlierconfig"></a> `outlierConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:237](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L237) |
| <a id="property-rectconfig"></a> `rectConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L238) |
| <a id="property-rectwidth"></a> `rectWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:239](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L239) |
| <a id="property-select-3"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L240) |
| <a id="property-whiskerconfig"></a> `whiskerConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:241](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L241) |
| <a id="property-whiskermode"></a> `whiskerMode?` | `string` \| `number` \| (`string` \| `number`)[] | Whisker mode: single mode string/number or [low, high] pair. | [shapes/shapeConfig.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L243) |
| <a id="property-x-3"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:244](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L244) |
| <a id="property-y-3"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:245](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L245) |

***

<a id="circleconfig-1"></a>

### CircleConfig

Defined in: [shapes/shapeConfig.ts:175](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L175)

Circle-specific config (radius).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-3"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-3"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-3"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-3"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-3"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-3"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-data-4"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-discrete-3"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-3"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-3"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-3"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hitarea-3"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-3"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-3"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-3"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-3"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-4"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-3"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-3"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-3"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-3"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-3"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-r"></a> `r?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:176](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L176) |
| <a id="property-rendermode-3"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-3"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-3"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-3"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-3"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-4"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-4"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-3"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-3"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-3"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-3"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-3"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-3"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-3"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-3"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-3"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-3"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-trail-1"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the point as it moves between frames. | - | [shapes/shapeConfig.ts:178](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L178) |
| <a id="property-trailpersist-1"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | - | [shapes/shapeConfig.ts:180](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L180) |
| <a id="property-vectoreffect-3"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-3"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-x-4"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-y-4"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |

***

<a id="colorscaleconfig-3"></a>

### ColorScaleConfig

Defined in: [utils/D3plusConfig.ts:292](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L292)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bucketformat"></a> `bucketFormat?` | (`start`: `number`, `i`: `number`, `buckets`: `number`[], `values`: `number`[]) => `string` | Formats the label for each bucket in a bucket-type scale ("jenks", "quantile", …). Passed the bucket's start value, its index, the full bucket array, and every data value used to build the buckets. | [utils/D3plusConfig.ts:303](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L303) |
| <a id="property-bucketjoiner"></a> `bucketJoiner?` | (`min`: `string`, `max`: `string`) => `string` | Given a bucket's minimum and maximum values, returns the full label. | [utils/D3plusConfig.ts:310](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L310) |
| <a id="property-domain"></a> `domain?` | `number`[] | For a linear scale, the `[min, max]` values used by the color scale; values outside this range map to the nearest color. | [utils/D3plusConfig.ts:297](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L297) |

***

<a id="d3plusconfig"></a>

### D3plusConfig

Defined in: [utils/D3plusConfig.ts:318](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L318)

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-4"></a> `active?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | The active callback function for highlighting shapes. | [utils/D3plusConfig.ts:325](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L325) |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | [utils/D3plusConfig.ts:327](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L327) |
| <a id="property-ariahidden"></a> `ariaHidden?` | `boolean` | Hides the SVG from assistive technology when true (`aria-hidden`). | [utils/D3plusConfig.ts:329](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L329) |
| <a id="property-attribution"></a> `attribution?` | `string` \| `boolean` | Text (rendered as HTML — any valid HTML string works, including anchor links) shown in the chart's bottom-right corner, most often a map tile credit. `false` (the default) shows nothing. A credit wider than half the chart area collapses to a small "ⓘ" badge that expands on hover, focus, or click. | [utils/D3plusConfig.ts:337](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L337) |
| <a id="property-attributionicon"></a> `attributionIcon?` | `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) | Overrides the "ⓘ" badge a long attribution collapses to, which otherwise renders as an inline SVG. A string is used as the badge's raw HTML content; a mount function, `(el: HTMLElement) => void | (() => void)`, is called once with the badge's reserved element so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it — return a cleanup function if there's teardown to do. | [utils/D3plusConfig.ts:347](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L347) |
| <a id="property-attributionstyle"></a> `attributionStyle?` | `Record`\<`string`, `unknown`\> | CSS key/value pairs used to style the attribution text. | [utils/D3plusConfig.ts:349](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L349) |
| <a id="property-backcontrolclassname"></a> `backControlClassName?` | `string` | Additional CSS class name(s) applied to the back button, alongside the fixed `back-control` class. | [utils/D3plusConfig.ts:351](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L351) |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | [utils/D3plusConfig.ts:353](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L353) |
| <a id="property-baseline"></a> `baseline?` | `number` | The baseline for the x/y plot. | [utils/D3plusConfig.ts:355](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L355) |
| <a id="property-cache"></a> `cache?` | `boolean` | Whether to cache the processed data between renders. | [utils/D3plusConfig.ts:357](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L357) |
| <a id="property-colordefaults"></a> `colorDefaults?` | [`ColorDefaultsConfig`](#colordefaultsconfig) | Overrides for the default colors used for data fills and legible text (see `colorDefaults` in @d3plus/color). | [utils/D3plusConfig.ts:359](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L359) |
| <a id="property-colorordinal"></a> `colorOrdinal?` | `boolean` | Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. | [utils/D3plusConfig.ts:361](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L361) |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | [utils/D3plusConfig.ts:363](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L363) |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | [utils/D3plusConfig.ts:365](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L365) |
| `colorScaleConfig.axisConfig?` | [`AxisConfig`](#axisconfig-2) | - | [utils/D3plusConfig.ts:366](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L366) |
| `colorScaleConfig.centered?` | `boolean` | - | [utils/D3plusConfig.ts:367](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L367) |
| `colorScaleConfig.colorMax?` | `string` | - | [utils/D3plusConfig.ts:371](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L371) |
| `colorScaleConfig.colorMid?` | `string` | - | [utils/D3plusConfig.ts:370](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L370) |
| `colorScaleConfig.colorMin?` | `string` | - | [utils/D3plusConfig.ts:369](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L369) |
| `colorScaleConfig.colors?` | `string`[] | - | [utils/D3plusConfig.ts:368](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L368) |
| `colorScaleConfig.scale?` | `AxisScale` | - | [utils/D3plusConfig.ts:372](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L372) |
| <a id="property-colorscalepadding"></a> `colorScalePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the color scale uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:375](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L375) |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` \| (() => false \| Position) | Position of the color scale, `false` to hide it, or an accessor returning either. | [utils/D3plusConfig.ts:377](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L377) |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | [utils/D3plusConfig.ts:379](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L379) |
| <a id="property-confidence"></a> `confidence?` | `false` \| \[`string` \| ((`d`: `DataPoint`, `i`: `number`) => `number`), `string` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)\] | The confidence interval as `[lower, upper]` bounds — each given as an accessor function or a static data key (e.g. `["lci", "hci"]`), or `false` to disable. | [utils/D3plusConfig.ts:385](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L385) |
| <a id="property-crosshairconfig"></a> `crosshairConfig?` | `Record`\<`string`, `unknown`\> | Paint for the shared tooltip's crosshair guide line (`stroke`, `strokeWidth`, `strokeDasharray`, `strokeOpacity`, …). | [utils/D3plusConfig.ts:395](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L395) |
| <a id="property-data-5"></a> `data?` | `string` \| `DataPoint`[] | Data array or URL string to load data from. | [utils/D3plusConfig.ts:320](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L320) |
| <a id="property-datacutoff"></a> `dataCutoff?` | `number` | Maximum number of data points to render before downsampling. | [utils/D3plusConfig.ts:397](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L397) |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | [utils/D3plusConfig.ts:399](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L399) |
| <a id="property-discrete-4"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | [utils/D3plusConfig.ts:401](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L401) |
| <a id="property-duration-4"></a> `duration?` | `number` | Default duration of transitions, in milliseconds. | [utils/D3plusConfig.ts:403](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L403) |
| <a id="property-filter"></a> `filter?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | Predicate filtering which data points are included, or false to disable. | [utils/D3plusConfig.ts:405](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L405) |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | [utils/D3plusConfig.ts:407](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L407) |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: `DataPoint`) => `string` \| `number`) \| (`d`: `DataPoint`) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | [utils/D3plusConfig.ts:412](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L412) |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | [utils/D3plusConfig.ts:418](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L418) |
| <a id="property-height-1"></a> `height?` | `number` | Overall height of the visualization in pixels. | [utils/D3plusConfig.ts:420](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L420) |
| <a id="property-hiddencolor"></a> `hiddenColor?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) | Color for legend shapes whose grouping is hidden (via legend click), or a `(datum, index)` accessor. | [utils/D3plusConfig.ts:422](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L422) |
| <a id="property-hiddenopacity"></a> `hiddenOpacity?` | `number` \| ((`d`: `DataPoint`, `i`: `number`) => `number`) | Opacity for legend labels whose grouping is hidden (via legend click), or a `(datum, index)` accessor. | [utils/D3plusConfig.ts:424](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L424) |
| <a id="property-highlight"></a> `highlight?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Persistently emphasizes matching marks (keep color) and grays the rest. | [utils/D3plusConfig.ts:428](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L428) |
| <a id="property-hover-4"></a> `hover?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | The hover callback function for highlighting shapes on mouseover. | [utils/D3plusConfig.ts:426](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L426) |
| <a id="property-label-5"></a> `label?` | `string` \| `false` \| `string`[] \| `AccessorFn` | Label accessor for shapes. | [utils/D3plusConfig.ts:430](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L430) |
| <a id="property-legend"></a> `legend?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig), `arr`: `DataPoint`[]) => `boolean`) | Controls legend visibility. Pass `false` to hide it, `true` to always show it, or a `(config, data) => boolean` accessor to decide dynamically — the chart defaults use an accessor to auto-hide the legend when it would be redundant. | [utils/D3plusConfig.ts:437](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L437) |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | [utils/D3plusConfig.ts:439](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L439) |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | [utils/D3plusConfig.ts:440](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L440) |
| `legendConfig.shape?` | `DataPointAccessor`\<`string`\> | Each item's swatch: `"Rect"` (a square), `"Circle"` (a dot), or `"Line"` (a dot with a short stroke through it). Defaults to the shape of the series it stands for: a dot for Circles, the line glyph for Lines, and a square for everything else. | [utils/D3plusConfig.ts:447](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L447) |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | [utils/D3plusConfig.ts:448](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L448) |
| <a id="property-legendfilterinvert"></a> `legendFilterInvert?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Inverts legend click behavior (click hides / shift-click solos, or the reverse), or an accessor receiving the viz. | [utils/D3plusConfig.ts:451](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L451) |
| <a id="property-legendinset"></a> `legendInset?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig)) => `boolean`) | Whether one legend may be drawn inside the empty space around the chart's marks instead of in a margin (size legend first, then legend, then colorScale), or an accessor receiving the resolved config. Defaults to `true`. | [utils/D3plusConfig.ts:457](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L457) |
| <a id="property-legendinsetconfig"></a> `legendInsetConfig?` | `object` | Style of the semi-transparent box behind a legend drawn inside the chart. | [utils/D3plusConfig.ts:459](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L459) |
| `legendInsetConfig.fill?` | `string` | Box fill; defaults to the chart's background color. | [utils/D3plusConfig.ts:461](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L461) |
| `legendInsetConfig.fillOpacity?` | `number` | - | [utils/D3plusConfig.ts:462](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L462) |
| `legendInsetConfig.margin?` | `number` | Space between the box's edge and the legend inside it. | [utils/D3plusConfig.ts:468](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L468) |
| `legendInsetConfig.padding?` | `number` | Space kept between the box and the chart's marks and edges. | [utils/D3plusConfig.ts:470](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L470) |
| `legendInsetConfig.rx?` | `number` | Corner radius. | [utils/D3plusConfig.ts:466](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L466) |
| `legendInsetConfig.stroke?` | `string` | - | [utils/D3plusConfig.ts:463](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L463) |
| `legendInsetConfig.strokeWidth?` | `number` | - | [utils/D3plusConfig.ts:464](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L464) |
| <a id="property-legendpadding"></a> `legendPadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the legend uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:473](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L473) |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` \| (() => `Position`) | Position of the legend, or an accessor returning it. | [utils/D3plusConfig.ts:475](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L475) |
| <a id="property-legendsort"></a> `legendSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort comparator for legend items. | [utils/D3plusConfig.ts:477](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L477) |
| <a id="property-legendtooltip"></a> `legendTooltip?` | [`TooltipConfig`](#tooltipconfig-3) | Tooltip configuration for legend items. | [utils/D3plusConfig.ts:479](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L479) |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | [utils/D3plusConfig.ts:481](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L481) |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` \| ((`viz`: `VizBase`) => `string`) | Custom HTML content for the loading indicator, or a function receiving the viz instance. | [utils/D3plusConfig.ts:485](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L485) |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | [utils/D3plusConfig.ts:483](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L483) |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | [utils/D3plusConfig.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L322) |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | [utils/D3plusConfig.ts:487](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L487) |
| <a id="property-minimap"></a> `minimap?` | `boolean` | Shows a small overview + draggable-viewport minimap underneath the zoom controls once the chart is zoomed in. On by default whenever `zoom` is enabled. | [utils/D3plusConfig.ts:489](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L489) |
| <a id="property-minimapclassname"></a> `minimapClassName?` | `string` | Additional CSS class name(s) applied to the minimap, alongside its fixed `d3plus-minimap`/etc. classes. | [utils/D3plusConfig.ts:491](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L491) |
| <a id="property-nodatahtml"></a> `noDataHTML?` | `string` \| ((`viz`: `VizBase`) => `string`) | Custom HTML content shown when no data is supplied, or a function receiving the viz instance. | [utils/D3plusConfig.ts:493](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L493) |
| <a id="property-ocean"></a> `ocean?` | `string` \| \{ `dark`: `string`; `light`: `string`; \} | Ocean color for geomaps (any CSS value including 'transparent'), or a `{light, dark}` pair chosen by the chart's backdrop. Defaults to the default basemap's own water colors. | [utils/D3plusConfig.ts:499](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L499) |
| <a id="property-on-4"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | [utils/D3plusConfig.ts:501](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L501) |
| <a id="property-point"></a> `point?` | (`d`: `DataPoint`) => `number`[] | Coordinate accessor for point-based geomaps. | [utils/D3plusConfig.ts:503](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L503) |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: `DataPoint`) => `number`) | Point size accessor for geomaps. | [utils/D3plusConfig.ts:505](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L505) |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | [utils/D3plusConfig.ts:509](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L509) |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | [utils/D3plusConfig.ts:507](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L507) |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | [utils/D3plusConfig.ts:511](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L511) |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | [utils/D3plusConfig.ts:513](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L513) |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | [utils/D3plusConfig.ts:515](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L515) |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | [utils/D3plusConfig.ts:517](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L517) |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` \| `Window` | Scrollable container selector for tooltip positioning. | [utils/D3plusConfig.ts:519](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L519) |
| <a id="property-search"></a> `search?` | `boolean` | Shows a top-left search button that expands into an input; typing highlights shapes whose label matches. On by default for every chart. | [utils/D3plusConfig.ts:521](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L521) |
| <a id="property-searchaccessor"></a> `searchAccessor?` | (`d`: `DataPoint`, `i`: `number`) => `string` | Resolves the string the search box matches its typed term against, for a given datum. Defaults to the mark's resolved on-screen label. | [utils/D3plusConfig.ts:523](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L523) |
| <a id="property-searchcontrolclassname"></a> `searchControlClassName?` | `string` | Additional CSS class name(s) applied to the search toggle button and input, alongside the fixed `search-control` classes. | [utils/D3plusConfig.ts:525](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L525) |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | [utils/D3plusConfig.ts:527](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L527) |
| `shapeConfig.duration?` | `number` | - | [utils/D3plusConfig.ts:528](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L528) |
| <a id="property-shapesort"></a> `shapeSort?` | (`a`: `string`, `b`: `string`) => `number` | A [sort comparator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape class (e.g. "Circle", "Line") as its arguments. Shapes are drawn in groups by type, so this defines the layering order for all shapes of a given type. | [utils/D3plusConfig.ts:537](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L537) |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | [utils/D3plusConfig.ts:539](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L539) |
| <a id="property-sizelegend"></a> `sizeLegend?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig), `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`) | Controls size-legend visibility — the nested-circle key drawn in the bottom-right corner of charts that size their marks. Shown by default whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height; pass `true` to always show it, `false` to hide it, or a `(config, scale, size) => boolean` accessor. | [utils/D3plusConfig.ts:548](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L548) |
| <a id="property-sizelegendconfig"></a> `sizeLegendConfig?` | [`SizeLegendConfig`](#sizelegendconfig-3) | Configuration for the size-legend component. | [utils/D3plusConfig.ts:552](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L552) |
| <a id="property-sizelegendposition"></a> `sizeLegendPosition?` | `"right"` \| `"bottom"` | Which margin the size legend claims in the bottom-right corner: `"right"` (default) keeps the chart's full height, `"bottom"` its full width. | [utils/D3plusConfig.ts:558](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L558) |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | [utils/D3plusConfig.ts:560](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L560) |
| <a id="property-stackoffset"></a> `stackOffset?` | `string` \| ((`series`: `number`[][][], `order`: `number`[]) => `void`) | Vertical offset applied to stacked series. One of `"diverging"` (default — positive and negative values split around zero), `"none"`, `"expand"` (normalize each stack to 100%), `"silhouette"` (streamgraph), or `"wiggle"` (minimize slope changes); or a custom offset function. | [utils/D3plusConfig.ts:567](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L567) |
| <a id="property-stackorder"></a> `stackOrder?` | `string` \| `string`[] \| \{ `order?`: `"ascending"` \| `"descending"`; `value`: `string` \| ((`d`: `DataPoint`) => `unknown`); \} \| ((`d`: `DataPoint`) => `unknown`) | Order of stacked series, from the bottom of the stack upward. Accepts a named order (`"descending"` [default] / `"ascending"` by summed value, `"key"` / `"keyReverse"` alphabetically, `"none"` / `"data"` for input order, or d3's `"insideOut"` / `"appearance"` / `"reverse"`), an Array of series keys for an explicit order, a value accessor, or a `{value, order}` config to rank series by an aggregate of any data field. | [utils/D3plusConfig.ts:576](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L576) |
| <a id="property-subtitle"></a> `subtitle?` | `string` \| ((`data`: `DataPoint`[]) => `string`) | Subtitle text, or an accessor returning it. | [utils/D3plusConfig.ts:582](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L582) |
| <a id="property-subtitlepadding"></a> `subtitlePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the subtitle uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:584](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L584) |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | [utils/D3plusConfig.ts:586](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L586) |
| <a id="property-svgdesc"></a> `svgDesc?` | `string` | Accessible description applied to the root SVG (`<desc>`). | [utils/D3plusConfig.ts:588](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L588) |
| <a id="property-svgtitle"></a> `svgTitle?` | `string` | Accessible title applied to the root SVG (`<title>`). | [utils/D3plusConfig.ts:590](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L590) |
| <a id="property-tableview"></a> `tableView?` | `boolean` | Enables the top-left table-view toggle button, which swaps the chart for a static, scrollable `<table>` of its data. On by default for every chart. | [utils/D3plusConfig.ts:592](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L592) |
| <a id="property-tableviewclassname"></a> `tableViewClassName?` | `string` | Additional CSS class name(s) applied to the `<table>` element rendered while in table view, alongside the fixed `d3plus-table-view-table` class. | [utils/D3plusConfig.ts:594](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L594) |
| <a id="property-tableviewcontrolclassname"></a> `tableViewControlClassName?` | `string` | Additional CSS class name(s) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. | [utils/D3plusConfig.ts:596](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L596) |
| <a id="property-tableviewcontrolstyle"></a> `tableViewControlStyle?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button. `false` removes all default styling. | [utils/D3plusConfig.ts:598](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L598) |
| <a id="property-tableviewcontrolstyleactive"></a> `tableViewControlStyleActive?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button while active (showing the data table). `false` removes all default styling. | [utils/D3plusConfig.ts:600](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L600) |
| <a id="property-tableviewcontrolstylehover"></a> `tableViewControlStyleHover?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button on hover. `false` removes all default styling. | [utils/D3plusConfig.ts:602](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L602) |
| <a id="property-tableviewdownload"></a> `tableViewDownload?` | `boolean` | Whether the data table shows a "download CSV" button, exporting its full (sorted, unpaginated) rows. On by default. | [utils/D3plusConfig.ts:604](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L604) |
| <a id="property-tableviewpagesize"></a> `tableViewPageSize?` | `number` \| `false` | Rows per page while in table view. `false` (or any non-positive number) disables pagination and shows every row on one page. | [utils/D3plusConfig.ts:606](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L606) |
| <a id="property-tableviewsort"></a> `tableViewSort?` | `boolean` | Whether the data table's column headers are clickable to sort (toggling asc/desc). On by default. | [utils/D3plusConfig.ts:608](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L608) |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | [utils/D3plusConfig.ts:610](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L610) |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` \| ((`d`: `DataPoint`, `i`: `number`) => `string`) | Label for the threshold group, or a `(datum, index)` accessor. | [utils/D3plusConfig.ts:612](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L612) |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | [utils/D3plusConfig.ts:620](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L620) |
| <a id="property-tileurl"></a> `tileUrl?` | `string` \| \{ `dark`: `string`; `light`: `string`; \} | URL template for XYZ map tiles, with `{z}`, `{x}`, `{y}` (and optional `{s}` subdomain) placeholders — or a `{light, dark}` pair, chosen by the chart's backdrop. Defaults to Esri's Light Gray and Dark Gray Canvas. | [utils/D3plusConfig.ts:618](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L618) |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | [utils/D3plusConfig.ts:622](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L622) |
| <a id="property-timefilter"></a> `timeFilter?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | Predicate filtering which time slices are shown, or false to disable. | [utils/D3plusConfig.ts:624](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L624) |
| <a id="property-timeline"></a> `timeline?` | `boolean` | Whether to show the timeline component. | [utils/D3plusConfig.ts:626](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L626) |
| <a id="property-timelinepadding"></a> `timelinePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the timeline uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:628](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L628) |
| <a id="property-title-1"></a> `title?` | `string` \| ((`data`: `DataPoint`[]) => `string`) | Chart title or title accessor function. | [utils/D3plusConfig.ts:630](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L630) |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | [utils/D3plusConfig.ts:632](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L632) |
| <a id="property-titlepadding"></a> `titlePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the title uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:634](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L634) |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | Whether to show tooltips, or a `(datum, index)` accessor deciding per mark. | [utils/D3plusConfig.ts:636](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L636) |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | [`TooltipConfig`](#tooltipconfig-3) | Configuration for the tooltip component. | [utils/D3plusConfig.ts:638](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L638) |
| <a id="property-tooltipshared"></a> `tooltipShared?` | `boolean` | Whether hovering a Plot's plot area shows one tooltip listing every series' value at the nearest discrete-axis position, with a crosshair through it. Applies when a discrete axis is set and at least two series share that position. | [utils/D3plusConfig.ts:645](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L645) |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | [utils/D3plusConfig.ts:660](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L660) |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | [utils/D3plusConfig.ts:662](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L662) |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | [utils/D3plusConfig.ts:664](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L664) |
| <a id="property-totalpadding"></a> `totalPadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the total uses the visualization's internal padding when positioning, or an accessor receiving the viz. | [utils/D3plusConfig.ts:666](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L666) |
| <a id="property-trendline"></a> `trendLine?` | `boolean` \| `"linear"` \| `"exponential"` \| `"logarithmic"` \| `"power"` \| `"polynomial"` | Draws an automatic trend line fit to the plotted data: `true` (or `"linear"`) for a least-squares line, or `"exponential"`, `"logarithmic"`, `"power"`, or `"polynomial"`. `false` removes it. | [utils/D3plusConfig.ts:651](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L651) |
| <a id="property-trendlineconfig"></a> `trendLineConfig?` | [`TrendLineConfig`](#trendlineconfig-1) | Options for the trend lines: `group` (`"series"` or `"all"`), the polynomial `order`, a `confidence` band with `confidenceLevel` and `confidenceConfig`, `tooltip`, and Line styles (`stroke`, `strokeWidth`, `strokeDasharray`, …). | [utils/D3plusConfig.ts:658](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L658) |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | [utils/D3plusConfig.ts:668](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L668) |
| <a id="property-width-1"></a> `width?` | `number` | Overall width of the visualization in pixels. | [utils/D3plusConfig.ts:670](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L670) |
| <a id="property-x-5"></a> `x?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for x-axis values. | [utils/D3plusConfig.ts:672](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L672) |
| <a id="property-x2domain"></a> `x2Domain?` | (`number` \| `Date`)[] | The x2 domain as an array. If either value is undefined, it is calculated from the data. | [utils/D3plusConfig.ts:678](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L678) |
| <a id="property-x2sort"></a> `x2Sort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Defines a custom sorting comparator function for discrete x2 axes. | [utils/D3plusConfig.ts:682](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L682) |
| <a id="property-xconfig"></a> `xConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the x-axis. | [utils/D3plusConfig.ts:674](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L674) |
| <a id="property-xdomain"></a> `xDomain?` | (`number` \| `Date`)[] | The x domain as an array. If either value is undefined, it is calculated from the data. | [utils/D3plusConfig.ts:676](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L676) |
| <a id="property-xsort"></a> `xSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for x-axis values. | [utils/D3plusConfig.ts:680](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L680) |
| <a id="property-y-5"></a> `y?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for y-axis values. | [utils/D3plusConfig.ts:684](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L684) |
| <a id="property-y2domain"></a> `y2Domain?` | (`number` \| `Date`)[] | The y2 domain as an array. If either value is undefined, it is calculated from the data. | [utils/D3plusConfig.ts:690](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L690) |
| <a id="property-y2sort"></a> `y2Sort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Defines a custom sorting comparator function for discrete y2 axes. | [utils/D3plusConfig.ts:694](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L694) |
| <a id="property-yconfig"></a> `yConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the y-axis. | [utils/D3plusConfig.ts:686](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L686) |
| <a id="property-ydomain"></a> `yDomain?` | (`number` \| `Date`)[] | The y domain as an array. If either value is undefined, it is calculated from the data. | [utils/D3plusConfig.ts:688](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L688) |
| <a id="property-ysort"></a> `ySort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for y-axis values. | [utils/D3plusConfig.ts:692](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L692) |
| <a id="property-zoom"></a> `zoom?` | `boolean` | Enables pan/zoom with zoom-control buttons. On by default for every chart. | [utils/D3plusConfig.ts:696](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L696) |
| <a id="property-zoomcontrolclassname"></a> `zoomControlClassName?` | `string` | Additional CSS class name(s) applied to each zoom control button, alongside the fixed `zoom-control`/`zoom-in`/etc. classes. | [utils/D3plusConfig.ts:698](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L698) |
| <a id="property-zoomcontrolicons"></a> `zoomControlIcons?` | `Partial`\<`Record`\<`"zoomIn"` \| `"zoomOut"` \| `"zoomReset"` \| `"zoomBrush"`, `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`))\>\> | Overrides one or more of the four built-in zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline SVGs. Each value is either raw HTML — used as that button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it — return a cleanup function if there's teardown to do. | [utils/D3plusConfig.ts:708](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L708) |
| <a id="property-zoomfactor"></a> `zoomFactor?` | `number` | Multiplier applied to programmatic zoom steps. | [utils/D3plusConfig.ts:715](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L715) |
| <a id="property-zoommax"></a> `zoomMax?` | `number` | Maximum zoom scale factor. Defaults to the scale at which the smallest shape fills the chart area. | [utils/D3plusConfig.ts:717](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L717) |
| <a id="property-zoompan"></a> `zoomPan?` | `boolean` | Whether panning (drag) is enabled while zoomed. | [utils/D3plusConfig.ts:719](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L719) |
| <a id="property-zoomscroll"></a> `zoomScroll?` | `boolean` \| `"modifier"` | Whether the mouse wheel (and one-finger touch) zooms. `"modifier"` (the default) leaves page scrolling alone: only Ctrl/⌘ + wheel or a trackpad/two-finger pinch zooms, and one finger pans only once zoomed in. `true` zooms on any wheel; `false` never does. | [utils/D3plusConfig.ts:726](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L726) |

***

<a id="imageconfig-1"></a>

### ImageConfig

Defined in: [shapes/shapeConfig.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L214)

Image-specific config (url + dimensions).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-6"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:215](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L215) |
| <a id="property-duration-5"></a> `duration?` | `number` | - | [shapes/shapeConfig.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L216) |
| <a id="property-height-2"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:217](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L217) |
| <a id="property-id-4"></a> `id?` | `AccessorFn` | - | [shapes/shapeConfig.ts:218](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L218) |
| <a id="property-opacity-4"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:219](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L219) |
| <a id="property-pointerevents-4"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | [shapes/shapeConfig.ts:220](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L220) |
| <a id="property-select-5"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:221](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L221) |
| <a id="property-url"></a> `url?` | `AccessorFn` | URL accessor returning the image src. | [shapes/shapeConfig.ts:223](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L223) |
| <a id="property-width-2"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:224](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L224) |
| <a id="property-x-6"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:225](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L225) |
| <a id="property-y-6"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:226](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L226) |

***

<a id="legendconfig-4"></a>

### LegendConfig

Defined in: [utils/D3plusConfig.ts:234](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L234)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-5"></a> `active?` | `false` \| ((`d`: `DataPoint`, `i?`: `number`) => `boolean`) | The active method for all shapes. | [utils/D3plusConfig.ts:236](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L236) |
| <a id="property-hover-5"></a> `hover?` | `false` \| ((`d`: `DataPoint`, `i?`: `number`) => `boolean`) | The hover method for all shapes. | [utils/D3plusConfig.ts:238](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L238) |
| <a id="property-shape"></a> `shape?` | `Accessor`\<`string`\> | The shape type used for each legend entry. | [utils/D3plusConfig.ts:240](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L240) |

***

<a id="lineconfig-3"></a>

### LineConfig

Defined in: [shapes/shapeConfig.ts:184](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L184)

Line-specific config (curve + defined).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-6"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-4"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-4"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-4"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-4"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-4"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-curve-1"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:185](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L185) |
| <a id="property-data-7"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-defined-1"></a> `defined?` | `AccessorFn` | - | - | [shapes/shapeConfig.ts:186](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L186) |
| <a id="property-discrete-5"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-6"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-4"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-4"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hitarea-4"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-6"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-4"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-4"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-5"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-6"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-4"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-4"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-5"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-5"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-5"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode-4"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-4"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-4"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-4"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-4"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-5"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-6"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-4"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-4"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-4"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-4"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-4"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-4"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-4"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-4"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-4"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-4"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-vectoreffect-4"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-4"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-x-7"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-y-7"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |

***

<a id="margin"></a>

### Margin

Defined in: [charts/viz/vizTypes.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L52)

Margin object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom"></a> `bottom` | `number` | [charts/viz/vizTypes.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L54) |
| <a id="property-left"></a> `left` | `number` | [charts/viz/vizTypes.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L55) |
| <a id="property-right"></a> `right` | `number` | [charts/viz/vizTypes.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L56) |
| <a id="property-top"></a> `top` | `number` | [charts/viz/vizTypes.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L53) |

***

<a id="padding"></a>

### Padding

Defined in: [charts/viz/vizTypes.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L60)

Padding object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom-1"></a> `bottom` | `number` | [charts/viz/vizTypes.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L62) |
| <a id="property-left-1"></a> `left` | `number` | [charts/viz/vizTypes.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L63) |
| <a id="property-right-1"></a> `right` | `number` | [charts/viz/vizTypes.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L64) |
| <a id="property-top-1"></a> `top` | `number` | [charts/viz/vizTypes.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L61) |

***

<a id="pathconfig-1"></a>

### PathConfig

Defined in: [shapes/shapeConfig.ts:201](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L201)

Path-specific config (raw SVG path d string or generator).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-7"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-5"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-5"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-5"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-5"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-5"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-d"></a> `d?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | [shapes/shapeConfig.ts:202](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L202) |
| <a id="property-data-8"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-discrete-6"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-7"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-5"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-5"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-hitarea-5"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-7"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-5"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-5"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-6"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-7"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-5"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-5"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-6"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-6"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-6"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode-5"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-5"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-5"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-5"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-5"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-6"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-7"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-5"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-5"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-5"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-5"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-5"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-5"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-5"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-5"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-5"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-5"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-vectoreffect-5"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-5"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-x-8"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-y-8"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |

***

<a id="rectconfig-3"></a>

### RectConfig

Defined in: [shapes/shapeConfig.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L165)

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
| <a id="property-active-8"></a> `active?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | [shapes/shapeConfig.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L52) |
| <a id="property-activeopacity-6"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | [shapes/shapeConfig.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L54) |
| <a id="property-activestyle-6"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | [shapes/shapeConfig.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L56) |
| <a id="property-arialabel-6"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | [shapes/shapeConfig.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L59) |
| <a id="property-backgroundimage-6"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | [shapes/shapeConfig.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L61) |
| <a id="property-backgroundimagefit-6"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | [shapes/shapeConfig.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L68) |
| <a id="property-data-9"></a> `data?` | `DataPoint`[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | [shapes/shapeConfig.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L49) |
| <a id="property-discrete-7"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | [shapes/shapeConfig.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L71) |
| <a id="property-duration-8"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | [shapes/shapeConfig.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L73) |
| <a id="property-fill-6"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | [shapes/shapeConfig.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L76) |
| <a id="property-fillopacity-6"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | [shapes/shapeConfig.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L78) |
| <a id="property-height-3"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L167) |
| <a id="property-hitarea-6"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | [shapes/shapeConfig.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L88) |
| <a id="property-hover-8"></a> `hover?` | ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | [shapes/shapeConfig.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L81) |
| <a id="property-hoveropacity-6"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | [shapes/shapeConfig.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L83) |
| <a id="property-hoverstyle-6"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | [shapes/shapeConfig.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L85) |
| <a id="property-id-7"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | [shapes/shapeConfig.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L93) |
| <a id="property-label-8"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | [shapes/shapeConfig.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L95) |
| <a id="property-labelbounds-6"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: `DataPoint`, `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | [shapes/shapeConfig.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L97) |
| <a id="property-labelconfig-6"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | [shapes/shapeConfig.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L101) |
| <a id="property-on-7"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | [shapes/shapeConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L159) |
| <a id="property-opacity-7"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | [shapes/shapeConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L104) |
| <a id="property-pointerevents-7"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | [shapes/shapeConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L106) |
| <a id="property-rendermode-6"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | [shapes/shapeConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L120) |
| <a id="property-role-6"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | [shapes/shapeConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L108) |
| <a id="property-rotate-6"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | [shapes/shapeConfig.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L111) |
| <a id="property-rx-6"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | [shapes/shapeConfig.ts:113](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L113) |
| <a id="property-ry-6"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | [shapes/shapeConfig.ts:115](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L115) |
| <a id="property-scale-7"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | [shapes/shapeConfig.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L117) |
| <a id="property-select-8"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | [shapes/shapeConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L122) |
| <a id="property-shaperendering-6"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | [shapes/shapeConfig.ts:125](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L125) |
| <a id="property-sort-6"></a> `sort?` | ((`a`: `DataPoint`, `b`: `DataPoint`) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | [shapes/shapeConfig.ts:128](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L128) |
| <a id="property-stroke-6"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | [shapes/shapeConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L131) |
| <a id="property-strokedasharray-6"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | [shapes/shapeConfig.ts:133](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L133) |
| <a id="property-strokelinecap-6"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | [shapes/shapeConfig.ts:135](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L135) |
| <a id="property-strokeopacity-6"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | [shapes/shapeConfig.ts:137](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L137) |
| <a id="property-strokewidth-6"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | [shapes/shapeConfig.ts:139](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L139) |
| <a id="property-textanchor-6"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | [shapes/shapeConfig.ts:142](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L142) |
| <a id="property-texture-6"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | [shapes/shapeConfig.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L144) |
| <a id="property-texturedefault-6"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | [shapes/shapeConfig.ts:146](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L146) |
| <a id="property-trail-2"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the rect as it moves between frames. | - | [shapes/shapeConfig.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L169) |
| <a id="property-trailpersist-2"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | - | [shapes/shapeConfig.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L171) |
| <a id="property-vectoreffect-6"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | [shapes/shapeConfig.ts:149](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L149) |
| <a id="property-verticalalign-6"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | [shapes/shapeConfig.ts:151](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L151) |
| <a id="property-width-3"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | [shapes/shapeConfig.ts:166](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L166) |
| <a id="property-x-9"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | [shapes/shapeConfig.ts:154](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L154) |
| <a id="property-y-9"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | [shapes/shapeConfig.ts:156](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L156) |

***

<a id="sizelegendconfig-3"></a>

### SizeLegendConfig

Defined in: [utils/D3plusConfig.ts:243](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L243)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-labelconfig-7"></a> `labelConfig?` | `SizeLegendTextConfig` | Value-label font: `fontColor`, `fontFamily`, `fontSize`. | [utils/D3plusConfig.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L259) |
| <a id="property-labelpadding"></a> `labelPadding?` | `number` | Gap between each leader line and its label, in pixels. | [utils/D3plusConfig.ts:266](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L266) |
| <a id="property-lineconfig"></a> `lineConfig?` | `SizeLegendLineConfig` | Leader-line paint: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. | [utils/D3plusConfig.ts:257](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L257) |
| <a id="property-linelength"></a> `lineLength?` | `number` | Length of the leader lines past the largest circle, in pixels. | [utils/D3plusConfig.ts:264](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L264) |
| <a id="property-padding"></a> `padding?` | `number` | - | [utils/D3plusConfig.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L262) |
| <a id="property-shapeconfig-1"></a> `shapeConfig?` | `SizeLegendShapeConfig` | Circle paint: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. | [utils/D3plusConfig.ts:255](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L255) |
| <a id="property-tickformat-1"></a> `tickFormat?` | (`value`: `number`) => `string` | Formats each value's label. Defaults to the locale's abbreviated number format. | [utils/D3plusConfig.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L251) |
| <a id="property-title-2"></a> `title?` | `string` | Title above the circles. Defaults to the `size` key when `size` is set to a string. | [utils/D3plusConfig.ts:253](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L253) |
| <a id="property-titleconfig-1"></a> `titleConfig?` | `SizeLegendTextConfig` | Title font: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. | [utils/D3plusConfig.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L261) |
| <a id="property-values"></a> `values?` | `number` \| `number`[] \| ((`domain`: \[`number`, `number`\]) => `number`[]) | The values to draw circles for: an array of values, how many to pick from the size domain (default 3: its min, max, and a round middle), or a function receiving the `[min, max]` domain and returning values. | [utils/D3plusConfig.ts:249](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L249) |

***

<a id="textboxconfig-1"></a>

### TextBoxConfig

Defined in: [utils/D3plusConfig.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L141)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ellipsis"></a> `ellipsis?` | (`text`: `string`, `line`: `number`) => `string` | Handles truncated lines, returning the new line value. Passed the line's text and number; by default appends an ellipsis to every line except a first word that cannot fit (which returns ""). | [utils/D3plusConfig.ts:179](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L179) |
| <a id="property-fontcolor"></a> `fontColor?` | `Accessor`\<`string`\> | The font color as an accessor function or static string. Inferred from the DOM selection by default. | [utils/D3plusConfig.ts:145](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L145) |
| <a id="property-fontfamily"></a> `fontFamily?` | `Accessor`\<`string` \| `string`[]\> | The font-family to use: a font name, a comma-separated list of fallbacks, an array of fallbacks, or an accessor returning a string or array. The first available font on the client is used. | [utils/D3plusConfig.ts:153](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L153) |
| <a id="property-fontmax"></a> `fontMax?` | `number` | The maximum font size in pixels, used when dynamically resizing fonts. | [utils/D3plusConfig.ts:159](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L159) |
| <a id="property-fontmin"></a> `fontMin?` | `number` | The minimum font size in pixels, used when dynamically resizing fonts. | [utils/D3plusConfig.ts:157](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L157) |
| <a id="property-fontopacity"></a> `fontOpacity?` | `Accessor`\<`number`\> | The font opacity as an accessor function or static number between 0 and 1. | [utils/D3plusConfig.ts:163](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L163) |
| <a id="property-fontresize"></a> `fontResize?` | `Accessor`\<`boolean`\> | Toggles font resizing — a static boolean, or an accessor returning a boolean. | [utils/D3plusConfig.ts:161](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L161) |
| <a id="property-fontsize"></a> `fontSize?` | `Accessor`\<`number`\> | The font size in pixels. Inferred from the DOM selection by default. | [utils/D3plusConfig.ts:147](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L147) |
| <a id="property-fontstroke"></a> `fontStroke?` | `Accessor`\<`string`\> | The font stroke color for the rendered text. | [utils/D3plusConfig.ts:165](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L165) |
| <a id="property-fontstrokewidth"></a> `fontStrokeWidth?` | `Accessor`\<`number`\> | The font stroke width for the rendered text. | [utils/D3plusConfig.ts:167](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L167) |
| <a id="property-fontweight"></a> `fontWeight?` | `Accessor`\<`string` \| `number`\> | The font weight. Inferred from the DOM selection by default. | [utils/D3plusConfig.ts:155](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L155) |
| <a id="property-height-4"></a> `height?` | `Accessor`\<`number`\> | The height for each text box. | [utils/D3plusConfig.ts:189](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L189) |
| <a id="property-lineheight"></a> `lineHeight?` | `Accessor`\<`number`\> | The line height, which is 1.2 times the font size by default. | [utils/D3plusConfig.ts:169](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L169) |
| <a id="property-maxlines"></a> `maxLines?` | `Accessor`\<`number` \| `null`\> | Restricts the maximum number of lines to wrap onto; null (unlimited) by default. | [utils/D3plusConfig.ts:171](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L171) |
| <a id="property-overflow"></a> `overflow?` | `Accessor`\<`boolean`\> | Whether text is allowed to overflow its bounding box. | [utils/D3plusConfig.ts:173](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L173) |
| <a id="property-padding-1"></a> `padding?` | `Accessor`\<`string` \| `number`\> | The padding as a CSS shorthand string or number. Defaults to 0. | [utils/D3plusConfig.ts:181](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L181) |
| <a id="property-rotateanchor"></a> `rotateAnchor?` | `Accessor`\<\[`number`, `number`\]\> | The anchor point around which to rotate the text box. | [utils/D3plusConfig.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L183) |
| <a id="property-split"></a> `split?` | (`text`: `string`) => `string`[] | The word split function: given a string, returns it split into an array of words. | [utils/D3plusConfig.ts:185](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L185) |
| <a id="property-text"></a> `text?` | `Accessor`\<`string`\> | The text content for each box. | [utils/D3plusConfig.ts:143](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L143) |
| <a id="property-width-4"></a> `width?` | `Accessor`\<`number`\> | The width for each text box. | [utils/D3plusConfig.ts:187](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L187) |
| <a id="property-x-10"></a> `x?` | `Accessor`\<`number`\> | The x position (left edge) for each text box. | [utils/D3plusConfig.ts:191](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L191) |
| <a id="property-y-10"></a> `y?` | `Accessor`\<`number`\> | The y position (top edge) for each text box. | [utils/D3plusConfig.ts:193](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L193) |

***

<a id="timelineconfig-3"></a>

### TimelineConfig

Defined in: [utils/D3plusConfig.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L196)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-brushfilter"></a> `brushFilter?` | () => `boolean` | Brush event filter. | [utils/D3plusConfig.ts:198](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L198) |
| <a id="property-brushmin"></a> `brushMin?` | `number` | The minimum number of ticks that can be highlighted when using "ticks" `buttonBehavior`. Helpful for x/y plots where selecting fewer than 2 time periods is undesirable. | [utils/D3plusConfig.ts:204](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L204) |
| <a id="property-buttonalign"></a> `buttonAlign?` | `"middle"` \| `"end"` \| `"start"` | Toggles the horizontal alignment of the button timeline. | [utils/D3plusConfig.ts:206](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L206) |
| <a id="property-buttonbehavior"></a> `buttonBehavior?` | `"auto"` \| `"buttons"` \| `"ticks"` | Toggles the style of the timeline. | [utils/D3plusConfig.ts:208](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L208) |
| <a id="property-buttonheight"></a> `buttonHeight?` | `number` | Button height. | [utils/D3plusConfig.ts:210](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L210) |
| <a id="property-buttonpadding"></a> `buttonPadding?` | `number` | Button padding. | [utils/D3plusConfig.ts:212](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L212) |
| <a id="property-handleconfig"></a> `handleConfig?` | `Record`\<`string`, `unknown`\> | Handle style. | [utils/D3plusConfig.ts:214](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L214) |
| <a id="property-handlesize"></a> `handleSize?` | `number` | Handle size. | [utils/D3plusConfig.ts:216](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L216) |
| <a id="property-playbutton"></a> `playButton?` | `boolean` | Determines the visibility of the play button to the left of the timeline, which cycles through the available periods at a rate set by `playButtonInterval`. | [utils/D3plusConfig.ts:221](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L221) |
| <a id="property-playbuttoninterval"></a> `playButtonInterval?` | `number` | The interval, in milliseconds, between periods when cycling via the play button. Used only when the chart's `duration` is 0 (no transition); otherwise playback steps once per `duration` so each step animates in full. | [utils/D3plusConfig.ts:227](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L227) |
| <a id="property-selection"></a> `selection?` | `number` \| `false` \| `Date` \| (`number` \| `Date`)[] | The current selection. Defaults to the most recent period in the timeline. | [utils/D3plusConfig.ts:229](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L229) |
| <a id="property-snapping"></a> `snapping?` | `boolean` | Toggles the snapping value. | [utils/D3plusConfig.ts:231](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L231) |

***

<a id="tooltipconfig-3"></a>

### TooltipConfig

Defined in: [utils/D3plusConfig.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L102)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-arrow"></a> `arrow?` | `string` \| ((`d`: `DataPoint`) => `string`) | The inner HTML content of the arrow element, empty by default. | [utils/D3plusConfig.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L104) |
| <a id="property-background"></a> `background?` | `string` \| ((`d`: `DataPoint`) => `string`) | The background color accessor for each tooltip. | [utils/D3plusConfig.ts:106](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L106) |
| <a id="property-body"></a> `body?` | `string` \| ((`d`: `DataPoint`) => `string`) | - | [utils/D3plusConfig.ts:122](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L122) |
| <a id="property-border"></a> `border?` | `string` \| ((`d`: `DataPoint`) => `string`) | The border accessor for each tooltip. | [utils/D3plusConfig.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L108) |
| <a id="property-borderradius"></a> `borderRadius?` | `string` \| ((`d`: `DataPoint`) => `string`) | The border-radius accessor for each tooltip. | [utils/D3plusConfig.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L110) |
| <a id="property-footer"></a> `footer?` | `string` \| ((`d`: `DataPoint`) => `string`) | The footer content accessor for each tooltip. | [utils/D3plusConfig.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L112) |
| <a id="property-maxwidth"></a> `maxWidth?` | `string` \| `number` \| ((`d`: `DataPoint`) => `string` \| `number`) | The max-width accessor for each tooltip. | [utils/D3plusConfig.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L114) |
| <a id="property-minwidth"></a> `minWidth?` | `string` \| `number` \| ((`d`: `DataPoint`) => `string` \| `number`) | The min-width accessor for each tooltip. | [utils/D3plusConfig.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L116) |
| <a id="property-offset"></a> `offset?` | `number` \| ((`d`: `DataPoint`) => `number`) | The pixel offset between the tooltip and its anchor point. | [utils/D3plusConfig.ts:118](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L118) |
| <a id="property-padding-2"></a> `padding?` | `string` \| `number` \| ((`d`: `DataPoint`) => `string` \| `number`) | The inner padding of each tooltip. | [utils/D3plusConfig.ts:120](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L120) |
| <a id="property-tbody"></a> `tbody?` | ((`d`: `DataPoint`) => \[`string`, `string`\][]) \| (`string` \| ((`d`: `DataPoint`, `i?`: `number`, `x?`: `object`) => `string`))[][] | - | [utils/D3plusConfig.ts:131](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L131) |
| <a id="property-thead"></a> `thead?` | ((`d`: `DataPoint`) => \[`string`, `string`\][]) \| (`string` \| ((`d`: `DataPoint`, `i?`: `number`, `x?`: `object`) => `string`))[][] | - | [utils/D3plusConfig.ts:123](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L123) |
| <a id="property-title-3"></a> `title?` | `string` \| ((`d`: `DataPoint`) => `string`) | - | [utils/D3plusConfig.ts:121](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L121) |

***

<a id="trendlineconfig-1"></a>

### TrendLineConfig

Defined in: [utils/D3plusConfig.ts:269](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L269)

#### Indexable

> \[`key`: `string`\]: `unknown`

Other Line shape config.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence-1"></a> `confidence?` | `boolean` | Draws a confidence band around a linear fit. Defaults to `false`. | [utils/D3plusConfig.ts:275](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L275) |
| <a id="property-confidenceconfig"></a> `confidenceConfig?` | `Record`\<`string`, `unknown`\> | Area shape config for the confidence band. Its fill defaults to the line color. | [utils/D3plusConfig.ts:279](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L279) |
| <a id="property-confidencelevel"></a> `confidenceLevel?` | `number` | The confidence band's level, between 0 and 1. Defaults to 0.95. | [utils/D3plusConfig.ts:277](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L277) |
| <a id="property-group"></a> `group?` | `"series"` \| `"all"` | `"series"` (default) fits one line per series, colored to match it; `"all"` fits one line to every point. Stacked charts always fit the stack totals. | [utils/D3plusConfig.ts:271](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L271) |
| <a id="property-order"></a> `order?` | `number` | The polynomial degree when `trendLine` is `"polynomial"`. Defaults to 2. | [utils/D3plusConfig.ts:273](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L273) |
| <a id="property-stroke-7"></a> `stroke?` | `string` | Line color. Defaults to the series color (dark gray when `group` is `"all"`). | [utils/D3plusConfig.ts:283](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L283) |
| <a id="property-strokedasharray-7"></a> `strokeDasharray?` | `string` | Line dash pattern. Defaults to `"6 4"`. | [utils/D3plusConfig.ts:287](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L287) |
| <a id="property-strokewidth-7"></a> `strokeWidth?` | `number` | Line width in pixels. Defaults to 2. | [utils/D3plusConfig.ts:285](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L285) |
| <a id="property-tooltip-1"></a> `tooltip?` | `boolean` | Shows the fitted equation, R², and observations when hovering a line. Defaults to `true`. | [utils/D3plusConfig.ts:281](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L281) |

***

<a id="whiskerconfig-2"></a>

### WhiskerConfig

Defined in: [shapes/shapeConfig.ts:251](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L251)

Whisker-specific config.

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-10"></a> `data?` | `DataPoint`[] | - | [shapes/shapeConfig.ts:252](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L252) |
| <a id="property-endpoint"></a> `endpoint?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | End-cap shape name (e.g. "Rect"). | [shapes/shapeConfig.ts:254](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L254) |
| <a id="property-endpointconfig"></a> `endpointConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:255](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L255) |
| <a id="property-length"></a> `length?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Whisker length in pixels. | [shapes/shapeConfig.ts:257](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L257) |
| <a id="property-lineconfig-1"></a> `lineConfig?` | `Record`\<`string`, `unknown`\> | - | [shapes/shapeConfig.ts:258](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L258) |
| <a id="property-orient-1"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | [shapes/shapeConfig.ts:259](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L259) |
| <a id="property-select-9"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | [shapes/shapeConfig.ts:260](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L260) |
| <a id="property-x-11"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:261](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L261) |
| <a id="property-y-11"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [shapes/shapeConfig.ts:262](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L262) |

## Type Aliases

<a id="anyshapeconfig"></a>

### AnyShapeConfig

> **AnyShapeConfig** = [`BaseShapeConfig`](#baseshapeconfig) \| [`RectConfig`](#rectconfig-3) \| [`CircleConfig`](#circleconfig-1) \| [`LineConfig`](#lineconfig-3) \| [`AreaConfig`](#areaconfig-1) \| [`PathConfig`](#pathconfig-1) \| [`BarConfig`](#barconfig-7) \| [`ImageConfig`](#imageconfig-1) \| [`BoxConfig`](#boxconfig-1) \| [`WhiskerConfig`](#whiskerconfig-2)

Defined in: [shapes/shapeConfig.ts:272](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L272)

Union of every shape config — useful for code that composes
transient configs at runtime without knowing the shape ahead of
time (Plot's `shapeConfig`, axis decorators, etc.).

***

<a id="colordefaultsconfig"></a>

### ColorDefaultsConfig

> **ColorDefaultsConfig** = `Partial`\<`Omit`\<`ColorDefaults`, `"scale"`\>\> & `object`

Defined in: [utils/D3plusConfig.ts:314](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L314)

`colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `scale?` | `ColorDefaults`\[`"scale"`\] \| `string`[] | [utils/D3plusConfig.ts:315](https://github.com/d3plus/d3plus/blob/main/packages/core/src/utils/D3plusConfig.ts#L315) |

***

<a id="constoraccessor"></a>

### ConstOrAccessor

> **ConstOrAccessor**\<`T`\> = `T` \| `AccessorFn`

Defined in: [shapes/shapeConfig.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L35)

A value that can either be a function (called per-datum) or a literal
that wraps as `constant(_)`. Mirrors the runtime "const" coerce.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

***

<a id="d3selection"></a>

### D3Selection

> **D3Selection** = `object`

Defined in: [charts/viz/vizTypes.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L85)

D3-style selection — deliberately loose. d3-selection's element/datum
generics are invariant, so a single typed alias can't accept every
`select(...)` result the chart code assigns to `_select`/`_container`/etc.;
the `any` methods + index signature are the escape hatch (same rationale as
the per-class fluent-accessor index signatures).

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="attr"></a>

##### attr()

> **attr**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:87](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L87)

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

Defined in: [charts/viz/vizTypes.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L92)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="node"></a>

##### node()

> **node**(): `any`

Defined in: [charts/viz/vizTypes.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L86)

###### Returns

`any`

<a id="on-23"></a>

##### on()

> **on**(`event`: `string`, `handler`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:91](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L91)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |
| `handler` | `any` |

###### Returns

`any`

<a id="select-22"></a>

##### select()

> **select**(`selector`: `any`): `any`

Defined in: [charts/viz/vizTypes.ts:90](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L90)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `any` |

###### Returns

`any`

<a id="selectall"></a>

##### selectAll()

> **selectAll**(`selector`: `string`): `any`

Defined in: [charts/viz/vizTypes.ts:89](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L89)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

###### Returns

`any`

<a id="style"></a>

##### style()

> **style**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: [charts/viz/vizTypes.ts:88](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L88)

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

Defined in: [charts/viz/vizTypes.ts:93](https://github.com/d3plus/d3plus/blob/main/packages/core/src/charts/viz/vizTypes.ts#L93)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

***

<a id="stringoraccessor"></a>

### StringOrAccessor

> **StringOrAccessor**\<`T`\> = `T` \| `string` \| `AccessorFn`

Defined in: [shapes/shapeConfig.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/core/src/shapes/shapeConfig.ts#L41)

A value that can be a function, a string key (wrapped in `accessor`),
or a literal (wrapped in `constant`). Mirrors the "accessor" coerce.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
