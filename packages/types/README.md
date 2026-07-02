# @d3plus/types

[![NPM version](https://img.shields.io/npm/v/@d3plus/types.svg)](https://www.npmjs.com/package/@d3plus/types)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=types)](https://codecov.io/gh/d3plus/d3plus/flags)

TypeScript type definitions for d3plus.

## Installing

If using npm, `npm install @d3plus/types`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/types).

```js
import {*} from "@d3plus/types";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/types"></script>
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
| [`BarChart`](#barchart) | Creates a bar chart based on an array of data. |
| [`BoxWhisker`](#boxwhisker) | Creates a simple box and whisker based on an array of data. |
| [`BumpChart`](#bumpchart) | Creates a bump chart based on an array of data. |
| [`Donut`](#donut) | Extends the Pie visualization to create a donut chart. |
| [`Geomap`](#geomap) | Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate  |
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
| [`StackedArea`](#stackedarea) | Creates a stacked area plot based on an array of data. |
| [`Tree`](#tree) | Uses d3's tree layout to create a tidy tree chart based on an array of data. |
| [`Treemap`](#treemap) | Uses the d3 treemap layout to create SVG rectangles based on an array of data. |

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
| [`addToQueue`](#addtoqueue) | Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualiz |
| [`assign`](#assign) | A deeply recursive version of `Object.assign`. |
| [`attrize`](#attrize) | Applies each key/value in an object as an attr. |
| [`backgroundColor`](#backgroundcolor) | Given a DOM element, returns its background color by walking up the |
| [`closest`](#closest) | Finds the closest numeric value in an array. |
| [`colorAdd`](#coloradd) | Adds two colors together. |
| [`colorAssign`](#colorassign) | Assigns a color to a value using a predefined set of defaults. |
| [`colorContrast`](#colorcontrast) | Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on to |
| [`colorLegible`](#colorlegible) | Darkens a color so that it will appear legible on a white background. |
| [`colorLighter`](#colorlighter) | Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon. |
| [`colorRamp`](#colorramp) | Builds an `n`-step single-hue ramp from a pale tint to the given base color, |
| [`colorSubtract`](#colorsubtract) | Subtracts one color from another. |
| [`colorValidate`](#colorvalidate) | Validates a chart color palette against the computable accessibility checks. |
| [`concat`](#concat) | Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat th |
| [`configPrep`](#configprep) | Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you m |
| [`constant`](#constant) | Wraps non-function variables in a simple return function. |
| [`date`](#date) | Parses numbers and strings into valid JavaScript Date objects, supporting years, quarters, months, and ISO 8601 formats. |
| [`elem`](#elem) | Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optiona |
| [`findLocale`](#findlocale) | Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US"). |
| [`fold`](#fold) | Given a JSON object where the data values and headers have been split into separate key lookups, this function will comb |
| [`fontFamilyStringify`](#fontfamilystringify) | Converts an Array of font-family names into a CSS font-family string. |
| [`format`](#format) |  |
| [`formatAbbreviate`](#formatabbreviate) | Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` t |
| [`formatDate`](#formatdate) | A default set of date formatters, which takes into account both the interval in between in each data point but also the  |
| [`formatDefaultLocale`](#formatdefaultlocale) | An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting t |
| [`inViewport`](#inviewport) | Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer. |
| [`isData`](#isdata) | Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid d |
| [`isObject`](#isobject) | Detects if a variable is a javascript Object. |
| [`largestRect`](#largestrect) | Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspe |
| [`lineIntersection`](#lineintersection) | Finds the intersection point (if there is one) of the lines p1q1 and p2q2. |
| [`load`](#load) | Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function. |
| [`merge`](#merge) | Combines an Array of Objects together and returns a new Object. |
| [`nestGroups`](#nestgroups) | Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy. |
| [`parseSides`](#parsesides) | Converts a string of directional CSS shorthand values into an object with the values expanded. |
| [`path2polygon`](#path2polygon) | Transforms a path string into an Array of points. |
| [`pointDistance`](#pointdistance) | Calculates the pixel distance between two points. |
| [`pointDistanceSquared`](#pointdistancesquared) | Returns the squared euclidean distance between two points. |
| [`pointRotate`](#pointrotate) | Rotates a point around a given origin. |
| [`polygonInside`](#polygoninside) | Checks if one polygon is inside another polygon. |
| [`polygonRayCast`](#polygonraycast) | Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on |
| [`polygonRotate`](#polygonrotate) | Rotates a point around a given origin. |
| [`rtl`](#rtl) | Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "r |
| [`saveElement`](#saveelement) | Downloads an HTML Element as a bitmap PNG image. |
| [`segmentBoxContains`](#segmentboxcontains) | Checks whether a point is inside the bounding box of a line segment. |
| [`segmentsIntersect`](#segmentsintersect) | Checks whether the line segments p1q1 && p2q2 intersect. |
| [`shapeEdgePoint`](#shapeedgepoint) | Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel dis |
| [`simplify`](#simplify) | Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplificatio |
| [`strip`](#strip) | Removes all non ASCII characters from a string. |
| [`stylize`](#stylize) | Applies each key/value in an object as a style. |
| [`textSplit`](#textsplit) | Splits a given sentence into an array of words. |
| [`textWidth`](#textwidth) | Given a text string, returns the predicted pixel width of the string when placed into DOM. |
| [`textWrap`](#textwrap) | Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text. |
| [`titleCase`](#titlecase) | Capitalizes each significant word of a phrase, normalizing case in both |
| [`unique`](#unique) | ES5 implementation to reduce an Array of values to unique instances. |

| Variables | Description |
| --- | --- |
| [`colorDefaults`](#colordefaults) | A set of default color values used when assigning colors based on data. |
| [`fontExists`](#fontexists) | Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false |
| [`fontFamily`](#fontfamily) | The default fallback font list used for all text labels as an Array of Strings. |
| [`formatLocale`](#formatlocale) |  |
| [`locale`](#locale) |  |
| [`RESET`](#reset) | String constant used to reset an individual config property. |
| [`titleCaseLocale`](#titlecaselocale) |  |
| [`translateLocale`](#translatelocale) |  |

| Interfaces | Description |
| --- | --- |
| [`AreaConfig`](#areaconfig) | Area-specific config (curve, defined, dual-edge x/y). |
| [`AxisConfig`](#axisconfig) |  |
| [`BarConfig`](#barconfig) | Bar-specific config (Rect + start/end coords). |
| [`BaseShapeConfig`](#baseshapeconfig) | Common props inherited from `Shape` — every shape subclass accepts |
| [`BoxConfig`](#boxconfig) | Box-specific config (whisker + median + outliers; subset of Shape). |
| [`CircleConfig`](#circleconfig) | Circle-specific config (radius). |
| [`ColorCheck`](#colorcheck) | One computed check in a palette validation report. |
| [`ColorDefaults`](#colordefaults) |  |
| [`ColorRampOptions`](#colorrampoptions) | Options for colorRamp. |
| [`ColorScaleConfig`](#colorscaleconfig) |  |
| [`ColorValidateOptions`](#colorvalidateoptions) | Options for colorValidate. |
| [`ColorValidation`](#colorvalidation) | The result of validating a palette. `ok` is true when no check hard-fails. |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`DataPoint`](#datapoint) | DataPoint |
| [`FormatLocaleDefinition`](#formatlocaledefinition) | formatLocale |
| [`ImageConfig`](#imageconfig) | Image-specific config (url + dimensions). |
| [`LegendConfig`](#legendconfig) |  |
| [`LineConfig`](#lineconfig) | Line-specific config (curve + defined). |
| [`Margin`](#margin) | Margin object with all four sides. |
| [`MergedDataPoint`](#mergeddatapoint) |  |
| [`Padding`](#padding) | Padding object with all four sides. |
| [`PathConfig`](#pathconfig) | Path-specific config (raw SVG path d string or generator). |
| [`RectConfig`](#rectconfig) | Rect-specific config (width + height on top of base). |
| [`TextBoxConfig`](#textboxconfig) |  |
| [`TimelineConfig`](#timelineconfig) |  |
| [`TimeLocaleDefinition`](#timelocaledefinition) |  |
| [`TitleCaseRules`](#titlecaserules) |  |
| [`TooltipConfig`](#tooltipconfig) |  |
| [`TranslationStrings`](#translationstrings) |  |
| [`WhiskerConfig`](#whiskerconfig) | Whisker-specific config. |

| Type Aliases | Description |
| --- | --- |
| [`AnyShapeConfig`](#anyshapeconfig) | Union of every shape config — useful for code that composes |
| [`CheckState`](#checkstate) | The state of a single check. `warn` passes but obligates secondary encoding. |
| [`ConstOrAccessor`](#constoraccessor) | A value that can either be a function (called per-datum) or a literal |
| [`D3Selection`](#d3selection) | D3-style selection — deliberately loose. d3-selection's element/datum |
| [`StringOrAccessor`](#stringoraccessor) | A value that can be a function, a string key (wrapped in `accessor`), |

## Classes

<a id="area"></a>

### Area

Defined in: core/types/src/shapes/Area.d.ts:8

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

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

Defined in: core/types/src/shapes/Area.d.ts:67

Narrowed `.config()` for Area. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`AreaConfig`](#areaconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`AreaConfig`](#areaconfig-1)\>): `this`

Defined in: core/types/src/shapes/Area.d.ts:68

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

Defined in: core/types/src/shapes/Area.d.ts:35

The x position accessor. Also sets x0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **x**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Area.d.ts:36

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

Defined in: core/types/src/shapes/Area.d.ts:40

The x0 (left edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Area.d.ts:41

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

Defined in: core/types/src/shapes/Area.d.ts:45

The x1 (right edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: core/types/src/shapes/Area.d.ts:46

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

Defined in: core/types/src/shapes/Area.d.ts:50

The y position accessor. Also sets y0 to the same value.

###### Returns

`AccessorFn`

###### Call Signature

> **y**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Area.d.ts:51

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

Defined in: core/types/src/shapes/Area.d.ts:55

The y0 (top edge) position accessor for the area.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Area.d.ts:56

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

Defined in: core/types/src/shapes/Area.d.ts:60

The y1 (bottom edge) position accessor for the area.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: core/types/src/shapes/Area.d.ts:61

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
| <a id="property-_activegroup"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Bar`](#bar).[`_transition`](#property-_transition-6) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="axis"></a>

### Axis

Defined in: core/types/src/components/Axis/Axis.d.ts:12

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Axis/Axis.d.ts:83

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

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

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Axis/Axis.d.ts:78

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

<a id="translate-1"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks"></a> `_availableTicks` | `unknown`[] | - | - | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_configdefault-1"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | - | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | - | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-1"></a> `_data` | `unknown`[] | - | - | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata"></a> `_gridLineData?` | `object`[] | - | - | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-1"></a> `_group` | `Selection` | - | - | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_labelrotation"></a> `_labelRotation` | `boolean` \| *required* | - | - | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | - | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint"></a> `_managesOwnScenePaint?` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin"></a> `_margin` | `Record`\<`string`, `number`\> | - | - | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_outerbounds"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_position"></a> `_position` | `object` | - | - | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-1"></a> `_sceneRenderer?` | `SvgRenderer` | - | - | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-1"></a> `_select` | `Selection` | - | - | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape"></a> `_tickShape?` | [`Shape`](#shape-1) | - | - | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickunit"></a> `_tickUnit` | `number` | - | - | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass"></a> `_titleClass` | [`TextBox`](#textbox) | - | - | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-1"></a> `_transition` | `Transition`\<`BaseType`\> | - | - | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | - | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-1"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks"></a> `_visibleTicks` | `unknown`[] | - | - | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-1"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-1"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="axisbottom"></a>

### AxisBottom

Defined in: core/types/src/components/Axis/AxisBottom.d.ts:5

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Axis/Axis.d.ts:83

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

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

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Axis/Axis.d.ts:78

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks-1"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_configdefault-2"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale-1"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative-1"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-2"></a> `_data` | `unknown`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata-1"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-2"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_labelrotation-1"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale-1"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint-1"></a> `_managesOwnScenePaint?` | `boolean` | - | [`Axis`](#axis).[`_managesOwnScenePaint`](#property-_managesownscenepaint) | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin-1"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_outerbounds-1"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_position-1"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-2"></a> `_sceneRenderer?` | `SvgRenderer` | - | [`Axis`](#axis).[`_sceneRenderer`](#property-_scenerenderer-1) | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-2"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape-1"></a> `_tickShape?` | [`Shape`](#shape-1) | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickunit-1"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass-1"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-2"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat-1"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-2"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks-1"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-2"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-2"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="axisleft"></a>

### AxisLeft

Defined in: core/types/src/components/Axis/AxisLeft.d.ts:5

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Axis/Axis.d.ts:83

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

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

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Axis/Axis.d.ts:78

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks-2"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_configdefault-3"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale-2"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative-2"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-3"></a> `_data` | `unknown`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata-2"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-3"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_labelrotation-2"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale-2"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint-2"></a> `_managesOwnScenePaint?` | `boolean` | - | [`Axis`](#axis).[`_managesOwnScenePaint`](#property-_managesownscenepaint) | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin-2"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_outerbounds-2"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_position-2"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-3"></a> `_sceneRenderer?` | `SvgRenderer` | - | [`Axis`](#axis).[`_sceneRenderer`](#property-_scenerenderer-1) | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-3"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape-2"></a> `_tickShape?` | [`Shape`](#shape-1) | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickunit-2"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass-2"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-3"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat-2"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-3"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks-2"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-3"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-3"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="axisright"></a>

### AxisRight

Defined in: core/types/src/components/Axis/AxisRight.d.ts:5

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Axis/Axis.d.ts:83

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

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

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Axis/Axis.d.ts:78

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks-3"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_configdefault-4"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale-3"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative-3"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-4"></a> `_data` | `unknown`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata-3"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-4"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_labelrotation-3"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale-3"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint-3"></a> `_managesOwnScenePaint?` | `boolean` | - | [`Axis`](#axis).[`_managesOwnScenePaint`](#property-_managesownscenepaint) | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin-3"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_outerbounds-3"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_position-3"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-4"></a> `_sceneRenderer?` | `SvgRenderer` | - | [`Axis`](#axis).[`_sceneRenderer`](#property-_scenerenderer-1) | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-4"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape-3"></a> `_tickShape?` | [`Shape`](#shape-1) | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickunit-3"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass-3"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-4"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat-3"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-4"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks-3"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-4"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-4"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="axistop"></a>

### AxisTop

Defined in: core/types/src/components/Axis/AxisTop.d.ts:5

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Axis/Axis.d.ts:83

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

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

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Axis/Axis.d.ts:78

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks-4"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_configdefault-5"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale-4"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative-4"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-5"></a> `_data` | `unknown`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata-4"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-5"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_labelrotation-4"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale-4"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint-4"></a> `_managesOwnScenePaint?` | `boolean` | - | [`Axis`](#axis).[`_managesOwnScenePaint`](#property-_managesownscenepaint) | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin-4"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_outerbounds-4"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_position-4"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-5"></a> `_sceneRenderer?` | `SvgRenderer` | - | [`Axis`](#axis).[`_sceneRenderer`](#property-_scenerenderer-1) | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-5"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape-4"></a> `_tickShape?` | [`Shape`](#shape-1) | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickunit-4"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass-4"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-5"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat-4"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-5"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks-4"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-5"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-5"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="bar"></a>

### Bar

Defined in: core/types/src/shapes/Bar.d.ts:9

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: [`DataPoint`](#datapoint)[]): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:39

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The raw data array to filter. |

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-1"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-1"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

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

Defined in: core/types/src/shapes/Bar.d.ts:82

Narrowed `.config()` for Bar. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BarConfig`](#barconfig-7)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`BarConfig`](#barconfig-7)\>): `this`

Defined in: core/types/src/shapes/Bar.d.ts:83

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-1"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-1"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-1"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

Defined in: core/types/src/shapes/Bar.d.ts:60

The x0 (left edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **x0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Bar.d.ts:61

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

Defined in: core/types/src/shapes/Bar.d.ts:65

The x1 (right edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **x1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: core/types/src/shapes/Bar.d.ts:66

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

Defined in: core/types/src/shapes/Bar.d.ts:70

The y0 (top edge) position accessor for each bar.

###### Returns

`AccessorFn`

###### Call Signature

> **y0**(`_`: `number` \| `AccessorFn`): `this`

Defined in: core/types/src/shapes/Bar.d.ts:71

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

Defined in: core/types/src/shapes/Bar.d.ts:75

The y1 (bottom edge) position accessor for each bar.

###### Returns

`AccessorFn` \| `null`

###### Call Signature

> **y1**(`_`: `number` \| `AccessorFn` \| `null`): `this`

Defined in: core/types/src/shapes/Bar.d.ts:76

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
| <a id="property-_activegroup-1"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-1"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-6"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-6"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-1"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-1"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-6"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-1"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-1"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-1"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-1"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-6"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-6"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-1"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-1"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-6"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-1"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-6"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-6"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-6"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="baseclass"></a>

### BaseClass

Defined in: core/types/src/utils/BaseClass.d.ts:5

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_configdefault-7"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_uuid-7"></a> `_uuid` | `string` | - | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-7"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-7"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="box"></a>

### Box

Defined in: core/types/src/shapes/Box.d.ts:12

Creates SVG box based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-2"></a>

##### active()

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: core/types/src/shapes/Box.d.ts:40

The active highlight state for all sub-shapes in this Box.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="config-8"></a>

##### config()

###### Call Signature

> **config**(): [`BoxConfig`](#boxconfig-1)

Defined in: core/types/src/shapes/Box.d.ts:80

Narrowed `.config()` for Box. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BoxConfig`](#boxconfig-1)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BoxConfig`](#boxconfig-1)\>): `this`

Defined in: core/types/src/shapes/Box.d.ts:81

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Box.d.ts:44

The data array used to create shapes.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Box.d.ts:45

The data array used to create shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="hover-2"></a>

##### hover()

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: core/types/src/shapes/Box.d.ts:49

The hover highlight state for all sub-shapes in this Box.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="locale-8"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/shapes/Box.d.ts:53

Configuration object for the median line.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **medianConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Box.d.ts:54

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/shapes/Box.d.ts:58

Configuration object for each outlier point.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **outlierConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Box.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Box.d.ts:63

Configuration object for the rect shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Box.d.ts:64

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

Defined in: core/types/src/shapes/Box.d.ts:28

Draws the Box.

###### Returns

`this`

<a id="select-7"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: core/types/src/shapes/Box.d.ts:68

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Box.d.ts:69

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/shapes/Box.d.ts:36

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

Defined in: core/types/src/shapes/Box.d.ts:73

Configuration object for the whisker.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **whiskerConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Box.d.ts:74

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
| <a id="property-_box"></a> `_box` | [`Rect`](#rect) | - | - | core/types/src/shapes/Box.d.ts:16 |
| <a id="property-_configdefault-8"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-7"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/shapes/Box.d.ts:14 |
| <a id="property-_median"></a> `_median` | [`Rect`](#rect) | - | - | core/types/src/shapes/Box.d.ts:17 |
| <a id="property-_select-7"></a> `_select` | `Selection` | - | - | core/types/src/shapes/Box.d.ts:15 |
| <a id="property-_uuid-8"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_whisker"></a> `_whisker` | [`Whisker`](#whisker) | - | - | core/types/src/shapes/Box.d.ts:18 |
| <a id="property-_whiskerendpoint"></a> `_whiskerEndpoint` | ([`Rect`](#rect) \| [`Circle`](#circle))[] | - | - | core/types/src/shapes/Box.d.ts:19 |
| <a id="property-ctx-8"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-8"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="circle"></a>

### Circle

Defined in: core/types/src/shapes/Circle.d.ts:8

Creates SVG circles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-1"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: [`DataPoint`](#datapoint)[]): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:39

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The raw data array to filter. |

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-3"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-2"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

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

Defined in: core/types/src/shapes/Circle.d.ts:36

Narrowed `.config()` for Circle. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`CircleConfig`](#circleconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`CircleConfig`](#circleconfig-1)\>): `this`

Defined in: core/types/src/shapes/Circle.d.ts:37

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-3"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-2"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-2"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_activegroup-2"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-2"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-9"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-8"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-2"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-2"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-7"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-2"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-2"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-2"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-2"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-7"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-8"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-2"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-2"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-7"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-2"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-9"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-9"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-9"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="colorscale"></a>

### ColorScale

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:13

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:57

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **axisConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:62

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:63

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="labelconfig-3"></a>

##### labelConfig()

###### Call Signature

> **labelConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:67

A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:68

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:77

Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMax**(`_`: `string`): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:78

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:72

Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).

###### Returns

`string` \| `undefined`

###### Call Signature

> **labelMin**(`_`: `string`): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:73

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:82

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **legendConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:83

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:93

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:94

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:39

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:98

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:99

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:53

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_axisclass"></a> `_axisClass` | [`Axis`](#axis) | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:16 |
| <a id="property-_axistest"></a> `_axisTest` | [`Axis`](#axis) | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:17 |
| <a id="property-_colorscale"></a> `_colorScale?` | `D3Scale`\<`string`\> | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:18 |
| <a id="property-_configdefault-10"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-9"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:19 |
| <a id="property-_gradientfill"></a> `_gradientFill?` | `string` | Smooth-gradient fill token (`gradient:<json>`), set by renderGradientStops. | - | core/types/src/components/ColorScale/ColorScale.d.ts:28 |
| <a id="property-_group-8"></a> `_group` | `Selection` | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:20 |
| <a id="property-_labelclass-3"></a> `_labelClass` | [`TextBox`](#textbox) | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:21 |
| <a id="property-_labelmax"></a> `_labelMax` | `string` \| *required* | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:23 |
| <a id="property-_labelmin"></a> `_labelMin` | `string` \| *required* | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:22 |
| <a id="property-_legendclass"></a> `_legendClass` | [`Legend`](#legend) | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:24 |
| <a id="property-_outerbounds-5"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:25 |
| <a id="property-_rectclass"></a> `_rectClass` | [`Rect`](#rect) | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:26 |
| <a id="property-_scenerenderer-8"></a> `_sceneRenderer?` | `SvgRenderer` | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:29 |
| <a id="property-_select-9"></a> `_select` | `Selection` | - | - | core/types/src/components/ColorScale/ColorScale.d.ts:15 |
| <a id="property-_uuid-10"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-10"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-10"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="image"></a>

### Image

Defined in: core/types/src/shapes/Image.d.ts:17

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

<a id="config-11"></a>

##### config()

###### Call Signature

> **config**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Image.d.ts:33

Get/set multiple config values at once. Mirrors the `BaseClass.config()`
contract used by the other shapes (and relied on by the React wrapper):
each patch key is routed through its matching fluent accessor (or
`data`/`select`), with unknown keys stored on `schema` verbatim.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **config**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Image.d.ts:34

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Image.d.ts:43

The data array used to create image shapes. An <image> tag will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Image.d.ts:44

The data array used to create image shapes. An <image> tag will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="render-10"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: core/types/src/shapes/Image.d.ts:39

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

Defined in: core/types/src/shapes/Image.d.ts:56

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Image.d.ts:57

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

Defined in: core/types/src/shapes/Image.d.ts:52

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
| <a id="property-_data-10"></a> `_data` | [`DataPoint`](#datapoint)[] | core/types/src/shapes/Image.d.ts:21 |
| <a id="property-_select-10"></a> `_select` | `Selection` | core/types/src/shapes/Image.d.ts:20 |
| <a id="property-schema-11"></a> `schema` | `Record`\<`string`, `any`\> | core/types/src/shapes/Image.d.ts:19 |

***

<a id="legend"></a>

### Legend

Defined in: core/types/src/components/Legend/Legend.d.ts:10

Creates an SVG legend based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-4"></a>

##### active()

> **active**(`_`: `unknown`): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:64

The active method for all shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

<a id="config-12"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/components/Legend/Legend.d.ts:68

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:69

The data array used to create shapes. A shape key will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="hover-4"></a>

##### hover()

> **hover**(`_`: `unknown`): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/components/Legend/Legend.d.ts:79

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Legend/Legend.d.ts:60

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

Defined in: core/types/src/components/Legend/Legend.d.ts:83

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:84

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

Defined in: core/types/src/components/Legend/Legend.d.ts:88

Methods that correspond to the key/value pairs for each shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:89

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

Defined in: core/types/src/components/Legend/Legend.d.ts:93

Title configuration of the legend.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Legend/Legend.d.ts:94

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

Defined in: core/types/src/components/Legend/Legend.d.ts:55

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_configdefault-11"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-11"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/components/Legend/Legend.d.ts:13 |
| <a id="property-_group-9"></a> `_group` | `Selection` | - | - | core/types/src/components/Legend/Legend.d.ts:19 |
| <a id="property-_linedata"></a> `_lineData` | `Record`\<`string`, `unknown`\>[] | - | - | core/types/src/components/Legend/Legend.d.ts:14 |
| <a id="property-_outerbounds-6"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | - | core/types/src/components/Legend/Legend.d.ts:15 |
| <a id="property-_rtl"></a> `_rtl` | `boolean` | - | - | core/types/src/components/Legend/Legend.d.ts:18 |
| <a id="property-_scenerenderer-9"></a> `_sceneRenderer?` | `SvgRenderer` | - | - | core/types/src/components/Legend/Legend.d.ts:26 |
| <a id="property-_select-11"></a> `_select` | `Selection` | - | - | core/types/src/components/Legend/Legend.d.ts:16 |
| <a id="property-_shapegroup"></a> `_shapeGroup` | `Selection` | - | - | core/types/src/components/Legend/Legend.d.ts:21 |
| <a id="property-_shapes"></a> `_shapes` | `unknown`[] | - | - | core/types/src/components/Legend/Legend.d.ts:17 |
| <a id="property-_titleclass-5"></a> `_titleClass` | [`TextBox`](#textbox) | - | - | core/types/src/components/Legend/Legend.d.ts:12 |
| <a id="property-_titlegroup"></a> `_titleGroup` | `Selection` | - | - | core/types/src/components/Legend/Legend.d.ts:20 |
| <a id="property-_titleheight"></a> `_titleHeight` | `number` | - | - | core/types/src/components/Legend/Legend.d.ts:22 |
| <a id="property-_titlewidth"></a> `_titleWidth` | `number` | - | - | core/types/src/components/Legend/Legend.d.ts:23 |
| <a id="property-_uuid-11"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_wraplines"></a> `_wrapLines` | (() => `void`) \| *required* | - | - | core/types/src/components/Legend/Legend.d.ts:24 |
| <a id="property-_wraprows"></a> `_wrapRows` | (() => `void`) \| *required* | - | - | core/types/src/components/Legend/Legend.d.ts:25 |
| <a id="property-ctx-11"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-12"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="line"></a>

### Line

Defined in: core/types/src/shapes/Line.d.ts:7

Creates SVG lines based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-5"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-3"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

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

> **config**(): [`LineConfig`](#lineconfig-2)

Defined in: core/types/src/shapes/Line.d.ts:36

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`LineConfig`](#lineconfig-2)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`LineConfig`](#lineconfig-2)\>): `this`

Defined in: core/types/src/shapes/Line.d.ts:37

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

[`Shape`](#shape-1).[`config`](#config-17)

<a id="data-12"></a>

##### data()

###### Call Signature

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-5"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-3"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-3"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_activegroup-3"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-3"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-12"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-12"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-3"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-3"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-10"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-3"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-4"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-3"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-3"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-10"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-12"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-3"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-3"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-8"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-3"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-12"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-12"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-13"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="path"></a>

### Path

Defined in: core/types/src/shapes/Path.d.ts:7

Creates SVG Paths based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-2"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: [`DataPoint`](#datapoint)[]): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:39

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The raw data array to filter. |

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-6"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-4"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

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

> **config**(): [`PathConfig`](#pathconfig-1)

Defined in: core/types/src/shapes/Path.d.ts:29

Narrowed `.config()` for Path. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`PathConfig`](#pathconfig-1)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`PathConfig`](#pathconfig-1)\>): `this`

Defined in: core/types/src/shapes/Path.d.ts:30

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-6"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-4"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-4"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_activegroup-4"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-4"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-13"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-13"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-4"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-4"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-11"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-4"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-5"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-4"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-4"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-11"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-13"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-4"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-4"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-9"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-4"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-13"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-13"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-14"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="plot"></a>

### Plot

Defined in: core/types/src/charts/Plot/index.d.ts:13

Creates an x/y plot based on an array of data.

#### Extends

- [`Viz`](#viz)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_drawscenetotarget"></a>

##### \_drawSceneToTarget()

> **\_drawSceneToTarget**(`durationOverride?`: `number`): `void`

Defined in: core/types/src/charts/viz/Viz.d.ts:85

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

> **\_paint**(`pCtx`: `PlotPaintContext`): `this`

Defined in: core/types/src/charts/Plot/index.d.ts:60

Paint phase: production axis rendering, shape buffer setup, and shape
emission with event handlers. Receives all cross-phase locals from
_draw via `pCtx` (so this method has zero coupling to _draw's local
scope beyond the explicit context).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `pCtx` | `PlotPaintContext` |

###### Returns

`this`

<a id="_schedulescenerepaint"></a>

##### \_scheduleSceneRepaint()

> **\_scheduleSceneRepaint**(): `void`

Defined in: core/types/src/charts/viz/Viz.d.ts:106

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

Defined in: core/types/src/charts/Plot/index.d.ts:46

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

> **active**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:15

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`active`](#active-10)

<a id="aggs"></a>

##### aggs()

> **aggs**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:19

Custom aggregation methods for each data key.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`aggs`](#aggs-1)

<a id="annotations"></a>

##### annotations()

> **annotations**(`_?`: `unknown`): [`Plot`](#plot) \| `unknown`[]

Defined in: core/types/src/charts/Plot/index.d.ts:66

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:23

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

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:27

Configuration object for the attribution style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`attributionStyle`](#attributionstyle-1)

<a id="axispersist"></a>

##### axisPersist()

> **axisPersist**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: core/types/src/charts/Plot/index.d.ts:70

Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Plot`](#plot)

<a id="backconfig"></a>

##### backConfig()

> **backConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:31

Configuration object for the back button.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`backConfig`](#backconfig-1)

<a id="backgroundconfig"></a>

##### backgroundConfig()

> **backgroundConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:74

A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="buffer"></a>

##### buffer()

> **buffer**(`_?`: `boolean` \| `Record`\<`string`, `boolean`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:78

Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| `Record`\<`string`, `boolean`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="color"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:35

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

[`Viz`](#viz).[`color`](#color-1)

<a id="colorscale-1"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:39

Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

[`Viz`](#viz).[`colorScale`](#colorscale-2)

<a id="colorscaleconfig-1"></a>

##### colorScaleConfig()

> **colorScaleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:43

A pass-through to the config method of ColorScale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`colorScaleConfig`](#colorscaleconfig-2)

<a id="colorscalemaxsize"></a>

##### colorScaleMaxSize()

> **colorScaleMaxSize**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:55

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:47

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:51

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

Defined in: core/types/src/charts/Plot/index.d.ts:91

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

> **confidenceConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:95

Configuration object for shapes rendered as confidence intervals.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="config-15"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`config`](#config-21)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`config`](#config-21)

<a id="data-14"></a>

##### data()

> **data**(`_?`: `string` \| [`DataPoint`](#datapoint)[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: [`DataPoint`](#datapoint)[]) => `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[]): [`Plot`](#plot) \| [`DataPoint`](#datapoint)[]

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:68

The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `_?` | `string` \| [`DataPoint`](#datapoint)[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \} | - |
| `f?` | (`data`: [`DataPoint`](#datapoint)[]) => `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[] | The data array or a URL string to load data from. |

###### Returns

[`Plot`](#plot) \| [`DataPoint`](#datapoint)[]

###### Inherited from

[`Viz`](#viz).[`data`](#data-20)

<a id="destroy"></a>

##### destroy()

> **destroy**(): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:110

Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`destroy`](#destroy-1)

<a id="detectresize"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:75

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:79

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:83

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:87

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

Defined in: core/types/src/charts/Plot/index.d.ts:99

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:91

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

> **downloadConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:95

Sets specific options of the saveElement function used when downloading the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`downloadConfig`](#downloadconfig-1)

<a id="downloadposition"></a>

##### downloadPosition()

> **downloadPosition**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:99

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:103

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

> **groupBy**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)))[]): [`Plot`](#plot) \| (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)[]

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:107

Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)))[] |

###### Returns

[`Plot`](#plot) \| (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)[]

###### Inherited from

[`Viz`](#viz).[`groupBy`](#groupby-1)

<a id="grouppadding"></a>

##### groupPadding()

> **groupPadding**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: core/types/src/charts/Plot/index.d.ts:103

The pixel space between groups of bars.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` |

###### Returns

`number` \| [`Plot`](#plot)

<a id="hiddencolor"></a>

##### hiddenColor()

> **hiddenColor**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:111

Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`hiddenColor`](#hiddencolor-1)

<a id="hiddenopacity"></a>

##### hiddenOpacity()

> **hiddenOpacity**(`_?`: `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `number` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:115

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`) |

###### Returns

`number` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

###### Inherited from

[`Viz`](#viz).[`hiddenOpacity`](#hiddenopacity-1)

<a id="highlight"></a>

##### highlight()

> **highlight**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `undefined`

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:127

Persistently emphasizes the data points matching the given predicate: the
matching marks keep their color while every other mark is de-emphasized to
a neutral gray (the "emphasis" form — highlight one series, gray the rest).
Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
standing state that survives pointer movement. Pass `false` to clear it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `undefined`

###### Inherited from

[`Viz`](#viz).[`highlight`](#highlight-1)

<a id="hover-7"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `this`

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:119

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`hover`](#hover-10)

<a id="label"></a>

##### label()

> **label**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:131

Accessor function or string key for the label of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`label`](#label-1)

<a id="labelconnectorconfig"></a>

##### labelConnectorConfig()

> **labelConnectorConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:107

The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="labelposition"></a>

##### labelPosition()

> **labelPosition**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/Plot/index.d.ts:111

The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

[`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

<a id="legend-1"></a>

##### legend()

> **legend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:135

Whether to display the legend.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`legend`](#legend-2)

<a id="legendconfig-2"></a>

##### legendConfig()

> **legendConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:139

Configuration object passed to the legend's config method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`legendConfig`](#legendconfig-3)

<a id="legendfilterinvert"></a>

##### legendFilterInvert()

> **legendFilterInvert**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:143

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:147

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:151

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

> **legendTooltip**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:155

Configuration object for the legend tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`legendTooltip`](#legendtooltip-1)

<a id="linemarkerconfig"></a>

##### lineMarkerConfig()

> **lineMarkerConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:115

Shape config for the Circle shapes drawn by the lineMarkers method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="linemarkers"></a>

##### lineMarkers()

> **lineMarkers**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: core/types/src/charts/Plot/index.d.ts:119

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:17

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:21

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

[`Viz`](#viz).[`locale`](#locale-20)

###### Call Signature

> **locale**(`_`: `string` \| `object`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

[`Viz`](#viz).[`locale`](#locale-20)

<a id="messagemask"></a>

##### messageMask()

> **messageMask**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:25

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

> **messageStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:29

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`messageStyle`](#messagestyle-1)

<a id="nodatahtml"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:33

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:37

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

[`Viz`](#viz).[`on`](#on-20)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

[`Viz`](#viz).[`on`](#on-20)

###### Call Signature

> **on**(`_`: `string`, `f`: (...`args`: `unknown`[]) => `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

[`Viz`](#viz).[`on`](#on-20)

###### Call Signature

> **on**(`_`: `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

[`Viz`](#viz).[`on`](#on-20)

<a id="parent-14"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Viz`](#viz).[`parent`](#parent-20)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`parent`](#parent-20)

<a id="render-14"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:48

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

Defined in: core/types/src/charts/viz/Viz.d.ts:54

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Inherited from

[`Viz`](#viz).[`renderer`](#renderer-1)

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:55

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

Defined in: core/types/src/charts/viz/Viz.d.ts:62

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

Defined in: core/types/src/charts/viz/Viz.d.ts:63

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

Defined in: core/types/src/charts/viz/Viz.d.ts:71

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:41

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:45

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

> **shape**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:49

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`shape`](#shape-2)

<a id="shapeconfig-14"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/charts/viz/VizBase.d.ts:53

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-21)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/charts/viz/VizBase.d.ts:54

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-21)

<a id="size"></a>

##### size()

> **size**(`_?`: `false` \| `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: core/types/src/charts/Plot/index.d.ts:123

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

Defined in: core/types/src/charts/Plot/index.d.ts:127

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

Defined in: core/types/src/charts/Plot/index.d.ts:131

Sets the stack order. If *value* is not specified, returns the current stack order function.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`series`: `number`[][]) => `number`[]) |

###### Returns

[`Plot`](#plot) \| ((`series`: `number`[][]) => `number`[])

<a id="subtitle"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:58

Accessor function or string for the visualization's subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

###### Inherited from

[`Viz`](#viz).[`subtitle`](#subtitle-1)

<a id="subtitleconfig"></a>

##### subtitleConfig()

> **subtitleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:62

Configuration object for the subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`subtitleConfig`](#subtitleconfig-1)

<a id="subtitlepadding"></a>

##### subtitlePadding()

> **subtitlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:66

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

> **threshold**(`_?`: `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)): `number` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:70

The threshold value for bucketing small data points together.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`) |

###### Returns

`number` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

###### Inherited from

[`Viz`](#viz).[`threshold`](#threshold-1)

<a id="thresholdkey"></a>

##### thresholdKey()

> **thresholdKey**(`key?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBase.d.ts:75

Accessor for the value used in the threshold algorithm.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) | The data key used to group values for thresholding. |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

[`Viz`](#viz).[`thresholdKey`](#thresholdkey-1)

<a id="thresholdname"></a>

##### thresholdName()

> **thresholdName**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:79

The label displayed for bucketed threshold items.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`thresholdName`](#thresholdname-1)

<a id="time"></a>

##### time()

> **time**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBase.d.ts:83

Accessor function or string key for the time dimension of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

[`Viz`](#viz).[`time`](#time-1)

<a id="timelineconfig"></a>

##### timelineConfig()

> **timelineConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:87

Configuration object for the timeline.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`timelineConfig`](#timelineconfig-2)

<a id="timelinedefault"></a>

##### timelineDefault()

> **timelineDefault**(`_?`: `string` \| `Date` \| (`string` \| `Date`)[]): [`Plot`](#plot) \| `Date`[]

Defined in: core/types/src/charts/viz/VizBase.d.ts:91

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:95

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

> **title**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:99

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) |

###### Returns

`string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

###### Inherited from

[`Viz`](#viz).[`title`](#title-1)

<a id="titleconfig-6"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:103

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`titleConfig`](#titleconfig-8)

<a id="titlepadding"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Plot`](#plot) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:107

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

> **tooltip**(`_?`: `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:111

Whether to display tooltips on hover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

###### Inherited from

[`Viz`](#viz).[`tooltip`](#tooltip-2)

<a id="tooltipconfig"></a>

##### tooltipConfig()

> **tooltipConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:115

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`tooltipConfig`](#tooltipconfig-2)

<a id="toscene-14"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: core/types/src/charts/Plot/index.d.ts:29

Composes the chart's scene graph: the native shape scenes from Viz.toScene
(bars/lines/areas + labels) plus snapshots of the rendered axes, so a Plot
renders fully — geometry and axes — through the @d3plus/render backends.

###### Returns

`Scene`

###### Overrides

[`Viz`](#viz).[`toScene`](#toscene-19)

<a id="total"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:119

Accessor function or string key for the total value displayed in the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`) |

###### Returns

`string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

###### Inherited from

[`Viz`](#viz).[`total`](#total-1)

<a id="totalconfig"></a>

##### totalConfig()

> **totalConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:123

Configuration object for the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`totalConfig`](#totalconfig-1)

<a id="totalformat"></a>

##### totalFormat()

> **totalFormat**(`_?`: (`d`: `number`) => `string`): [`Plot`](#plot) \| ((`d`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:127

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:131

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Plot`](#plot) \| (() => `boolean`)

###### Inherited from

[`Viz`](#viz).[`totalPadding`](#totalpadding-1)

<a id="translate-14"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

[`Viz`](#viz).[`translate`](#translate-20)

###### Call Signature

> **translate**(`_`: (`d`: `string`, `locale?`: `string`) => `string`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

[`Viz`](#viz).[`translate`](#translate-20)

<a id="x-1"></a>

##### x()

> **x**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: core/types/src/charts/Plot/index.d.ts:135

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

Defined in: core/types/src/charts/Plot/index.d.ts:139

Accessor function or string key for the secondary x-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="x2config"></a>

##### x2Config()

> **x2Config**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:147

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="xconfig"></a>

##### xConfig()

> **xConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:143

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="y-1"></a>

##### y()

> **y**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: core/types/src/charts/Plot/index.d.ts:151

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

Defined in: core/types/src/charts/Plot/index.d.ts:155

Accessor function or string key for the secondary y-axis value of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `PlotAccessorArg` |

###### Returns

[`Plot`](#plot) \| `PlotAccessor`

<a id="y2config"></a>

##### y2Config()

> **y2Config**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:165

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="yconfig"></a>

##### yConfig()

> **yConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:161

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

*Note:* If a "domain" array is passed to the y-axis config, it will be reversed.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="zoombrushhandlesize"></a>

##### zoomBrushHandleSize()

> **zoomBrushHandleSize**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:135

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

> **zoomBrushHandleStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:139

An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomBrushHandleStyle`](#zoombrushhandlestyle-1)

<a id="zoombrushselectionstyle"></a>

##### zoomBrushSelectionStyle()

> **zoomBrushSelectionStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:143

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomBrushSelectionStyle`](#zoombrushselectionstyle-1)

<a id="zoomcontrolstyle"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:147

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomControlStyle`](#zoomcontrolstyle-1)

<a id="zoomcontrolstyleactive"></a>

##### zoomControlStyleActive()

> **zoomControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:151

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomControlStyleActive`](#zoomcontrolstyleactive-1)

<a id="zoomcontrolstylehover"></a>

##### zoomControlStyleHover()

> **zoomControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:155

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomControlStyleHover`](#zoomcontrolstylehover-1)

<a id="zoompadding"></a>

##### zoomPadding()

> **zoomPadding**(`_?`: `number`): `number` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:159

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
| <a id="property-_configdefault-14"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Viz`](#viz).[`_configDefault`](#property-_configdefault-20) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_uuid-14"></a> `_uuid` | `string` | - | [`Viz`](#viz).[`_uuid`](#property-_uuid-20) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-14"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Viz`](#viz).[`ctx`](#property-ctx-20) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-15"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Viz`](#viz).[`schema`](#property-schema-21) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="rect"></a>

### Rect

Defined in: core/types/src/shapes/Rect.d.ts:8

Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.

#### Extends

- [`Shape`](#shape-1)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="_datafilter-3"></a>

##### \_dataFilter()?

> `optional` **\_dataFilter**(`data`: [`DataPoint`](#datapoint)[]): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:39

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The raw data array to filter. |

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`_dataFilter`](#_datafilter-4)

<a id="active-8"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

<a id="activestyle-5"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

<a id="config-16"></a>

##### config()

###### Call Signature

> **config**(): [`RectConfig`](#rectconfig-3)

Defined in: core/types/src/shapes/Rect.d.ts:36

Narrowed `.config()` for Rect. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`RectConfig`](#rectconfig-3)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`RectConfig`](#rectconfig-3)\>): `this`

Defined in: core/types/src/shapes/Rect.d.ts:37

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

<a id="hover-8"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

<a id="hoverstyle-5"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

<a id="texturedefault-5"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_activegroup-5"></a> `_activeGroup` | `Selection` | - | [`Shape`](#shape-1).[`_activeGroup`](#property-_activegroup-6) | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-5"></a> `_backgroundImageClass` | [`Image`](#image) | - | [`Shape`](#shape-1).[`_backgroundImageClass`](#property-_backgroundimageclass-6) | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-15"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Shape`](#shape-1).[`_configDefault`](#property-_configdefault-16) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-14"></a> `_data` | [`DataPoint`](#datapoint)[] | - | [`Shape`](#shape-1).[`_data`](#property-_data-15) | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-5"></a> `_enter` | `Selection` | - | [`Shape`](#shape-1).[`_enter`](#property-_enter-6) | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-5"></a> `_exit` | `Selection` | - | [`Shape`](#shape-1).[`_exit`](#property-_exit-6) | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-12"></a> `_group` | `Selection` | - | [`Shape`](#shape-1).[`_group`](#property-_group-13) | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-5"></a> `_hoverGroup` | `Selection` | - | [`Shape`](#shape-1).[`_hoverGroup`](#property-_hovergroup-6) | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-6"></a> `_labelClass` | [`TextBox`](#textbox) | - | [`Shape`](#shape-1).[`_labelClass`](#property-_labelclass-7) | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-5"></a> `_name` | `string` | - | [`Shape`](#shape-1).[`_name`](#property-_name-6) | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-5"></a> `_path` | `Record`\<`string`, `unknown`\> | - | [`Shape`](#shape-1).[`_path`](#property-_path-6) | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-12"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | [`Shape`](#shape-1).[`_sceneRenderer`](#property-_scenerenderer-13) | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-14"></a> `_select` | `Selection` | - | [`Shape`](#shape-1).[`_select`](#property-_select-15) | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-5"></a> `_tagName` | `string` | - | [`Shape`](#shape-1).[`_tagName`](#property-_tagname-6) | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-5"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | [`Shape`](#shape-1).[`_textureDefs`](#property-_texturedefs-6) | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-10"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Shape`](#shape-1).[`_transition`](#property-_transition-11) | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-5"></a> `_update` | `Selection` | - | [`Shape`](#shape-1).[`_update`](#property-_update-6) | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-15"></a> `_uuid` | `string` | - | [`Shape`](#shape-1).[`_uuid`](#property-_uuid-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-15"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-16"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="shape-1"></a>

### Shape

Defined in: core/types/src/shapes/Shape.d.ts:28

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

> `optional` **\_dataFilter**(`data`: [`DataPoint`](#datapoint)[]): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:39

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The raw data array to filter. |

###### Returns

[`DataPoint`](#datapoint)[]

<a id="active-9"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:118

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:119

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

<a id="activestyle-6"></a>

##### activeStyle()

###### Call Signature

> **activeStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:123

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:124

The style to apply to active shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="config-17"></a>

##### config()

###### Call Signature

> **config**(): [`BaseShapeConfig`](#baseshapeconfig)

Defined in: core/types/src/shapes/Shape.d.ts:165

Narrowed `.config()` for Shape. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BaseShapeConfig`](#baseshapeconfig)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BaseShapeConfig`](#baseshapeconfig)\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:166

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:128

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:129

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="hover-9"></a>

##### hover()

###### Call Signature

> **hover**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:133

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:134

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`this`

<a id="hoverstyle-6"></a>

##### hoverStyle()

###### Call Signature

> **hoverStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:138

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:139

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

Defined in: core/types/src/shapes/Shape.d.ts:143

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:144

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

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Shape.d.ts:114

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

Defined in: core/types/src/shapes/Shape.d.ts:148

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:149

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

> **sort**(): ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:153

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:154

A comparator function used to sort shapes for layering order.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` |

###### Returns

`this`

<a id="texturedefault-6"></a>

##### textureDefault()

###### Call Signature

> **textureDefault**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Shape.d.ts:158

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:159

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

Defined in: core/types/src/shapes/Shape.d.ts:113

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

<a id="translate-16"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_activegroup-6"></a> `_activeGroup` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:45 |
| <a id="property-_backgroundimageclass-6"></a> `_backgroundImageClass` | [`Image`](#image) | - | - | core/types/src/shapes/Shape.d.ts:30 |
| <a id="property-_configdefault-16"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-15"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/shapes/Shape.d.ts:31 |
| <a id="property-_enter-6"></a> `_enter` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:42 |
| <a id="property-_exit-6"></a> `_exit` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:43 |
| <a id="property-_group-13"></a> `_group` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:40 |
| <a id="property-_hovergroup-6"></a> `_hoverGroup` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:44 |
| <a id="property-_labelclass-7"></a> `_labelClass` | [`TextBox`](#textbox) | - | - | core/types/src/shapes/Shape.d.ts:32 |
| <a id="property-_name-6"></a> `_name` | `string` | - | - | core/types/src/shapes/Shape.d.ts:33 |
| <a id="property-_path-6"></a> `_path` | `Record`\<`string`, `unknown`\> | - | - | core/types/src/shapes/Shape.d.ts:46 |
| <a id="property-_scenerenderer-13"></a> `_sceneRenderer?` | `SvgRenderer` | SvgRenderer mounted by the standalone `render()` path; reused across redraws. | - | core/types/src/shapes/Shape.d.ts:48 |
| <a id="property-_select-15"></a> `_select` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:36 |
| <a id="property-_tagname-6"></a> `_tagName` | `string` | - | - | core/types/src/shapes/Shape.d.ts:34 |
| <a id="property-_texturedefs-6"></a> `_textureDefs` | `Record`\<`string`, `Record`\<`string`, `unknown`\>\> | - | - | core/types/src/shapes/Shape.d.ts:35 |
| <a id="property-_transition-11"></a> `_transition` | `Transition`\<`BaseType`\> | - | - | core/types/src/shapes/Shape.d.ts:37 |
| <a id="property-_update-6"></a> `_update` | `Selection` | - | - | core/types/src/shapes/Shape.d.ts:41 |
| <a id="property-_uuid-16"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-16"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-17"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="textbox"></a>

### TextBox

Defined in: core/types/src/components/TextBox.d.ts:43

Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="config-18"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/components/TextBox.d.ts:72

The data array used to draw text boxes. A text box will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/components/TextBox.d.ts:73

The data array used to draw text boxes. A text box will be drawn for each object in the array.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="html"></a>

##### html()

###### Call Signature

> **html**(): `false` \| `Record`\<`string`, `string`\>

Defined in: core/types/src/components/TextBox.d.ts:77

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Returns

`false` \| `Record`\<`string`, `string`\>

###### Call Signature

> **html**(`_`: `boolean` \| `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/TextBox.d.ts:78

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` \| `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-17"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

<a id="parent-17"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/TextBox.d.ts:68

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

Defined in: core/types/src/components/TextBox.d.ts:82

The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement`): `this`

Defined in: core/types/src/components/TextBox.d.ts:83

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/components/TextBox.d.ts:63

Produces a backend-agnostic scene graph for the text boxes, reusing the same
layout (_textData) and per-line positioning render() applies to the DOM.

###### Returns

`GroupNode`

<a id="translate-17"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_configdefault-17"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-16"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/components/TextBox.d.ts:46 |
| <a id="property-_select-16"></a> `_select` | `Selection` | - | - | core/types/src/components/TextBox.d.ts:45 |
| <a id="property-_uuid-17"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-17"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-18"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="timeline"></a>

### Timeline

Defined in: core/types/src/components/Timeline/Timeline.d.ts:8

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

Defined in: core/types/src/components/Axis/Axis.d.ts:87

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:88

Axis line style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

<a id="config-19"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

Defined in: core/types/src/components/Axis/Axis.d.ts:92

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:93

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

Defined in: core/types/src/components/Axis/Axis.d.ts:97

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:98

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:99

Handle style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **handleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Timeline/Timeline.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:102

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:103

Whether to rotate horizontal axis labels -90 degrees.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `boolean` |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

<a id="locale-18"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/components/Axis/Axis.d.ts:125

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

<a id="on-18"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: core/types/src/components/Timeline/Timeline.d.ts:104

Event listener for the specified brush event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.

###### Returns

`Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

###### Overrides

[`Axis`](#axis).[`on`](#on-1)

###### Call Signature

> **on**(`_`: `string`): ((...`args`: `unknown`[]) => `unknown`) \| `undefined`

Defined in: core/types/src/components/Timeline/Timeline.d.ts:105

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:106

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:107

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

Defined in: core/types/src/components/Axis/Axis.d.ts:107

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:108

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

Defined in: core/types/src/components/Axis/Axis.d.ts:114

Returns the outer bounds of the axis content. Must be called after rendering.

###### Returns

`Record`\<`string`, `number`\>

###### Example

```ts
{"width": 180, "height": 24, "x": 10, "y": 20}
```

###### Inherited from

[`Axis`](#axis).[`outerBounds`](#outerbounds)

<a id="parent-18"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:111

The config Object for the Rect class used to create the playButton.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **playButtonConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Timeline/Timeline.d.ts:112

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:135

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

Defined in: core/types/src/components/Axis/Axis.d.ts:136

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:116

Selection style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **selectionConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Timeline/Timeline.d.ts:117

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

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:140

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:141

Tick style of the axis.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

<a id="titleconfig-7"></a>

##### titleConfig()

###### Call Signature

> **titleConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:145

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:146

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

Defined in: core/types/src/components/Timeline/Timeline.d.ts:90

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

<a id="translate-18"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_availableticks-5"></a> `_availableTicks` | `unknown`[] | - | [`Axis`](#axis).[`_availableTicks`](#property-_availableticks) | core/types/src/components/Axis/Axis.d.ts:37 |
| <a id="property-_brush"></a> `_brush` | `BrushBehavior`\<`unknown`\> | - | - | core/types/src/components/Timeline/Timeline.d.ts:14 |
| <a id="property-_brushgroup"></a> `_brushGroup` | `Selection` | - | - | core/types/src/components/Timeline/Timeline.d.ts:15 |
| <a id="property-_buttonbehaviorcurrent"></a> `_buttonBehaviorCurrent` | `string` | - | - | core/types/src/components/Timeline/Timeline.d.ts:9 |
| <a id="property-_configdefault-18"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`Axis`](#axis).[`_configDefault`](#property-_configdefault-1) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_d3scale-5"></a> `_d3Scale` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3Scale`](#property-_d3scale) | core/types/src/components/Axis/Axis.d.ts:33 |
| <a id="property-_d3scalenegative-5"></a> `_d3ScaleNegative` | `D3Scale`\<`number`\> \| `null` | - | [`Axis`](#axis).[`_d3ScaleNegative`](#property-_d3scalenegative) | core/types/src/components/Axis/Axis.d.ts:34 |
| <a id="property-_data-17"></a> `_data` | `unknown`[] | - | [`Axis`](#axis).[`_data`](#property-_data-1) | core/types/src/components/Axis/Axis.d.ts:15 |
| <a id="property-_gridlinedata-5"></a> `_gridLineData?` | `object`[] | - | [`Axis`](#axis).[`_gridLineData`](#property-_gridlinedata) | core/types/src/components/Axis/Axis.d.ts:30 |
| <a id="property-_group-14"></a> `_group` | `Selection` | - | [`Axis`](#axis).[`_group`](#property-_group-1) | core/types/src/components/Axis/Axis.d.ts:35 |
| <a id="property-_hiddenhandles"></a> `_hiddenHandles` | `boolean` | - | - | core/types/src/components/Timeline/Timeline.d.ts:10 |
| <a id="property-_labelrotation-5"></a> `_labelRotation` | `boolean` \| *required* | - | [`Axis`](#axis).[`_labelRotation`](#property-_labelrotation) | core/types/src/components/Axis/Axis.d.ts:16 |
| <a id="property-_lastscale-5"></a> `_lastScale` | ((`d`: `unknown`) => `number`) \| *required* | - | [`Axis`](#axis).[`_lastScale`](#property-_lastscale) | core/types/src/components/Axis/Axis.d.ts:36 |
| <a id="property-_managesownscenepaint-5"></a> `_managesOwnScenePaint?` | `boolean` | - | [`Axis`](#axis).[`_managesOwnScenePaint`](#property-_managesownscenepaint) | core/types/src/components/Axis/Axis.d.ts:42 |
| <a id="property-_margin-5"></a> `_margin` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_margin`](#property-_margin) | core/types/src/components/Axis/Axis.d.ts:17 |
| <a id="property-_onplaytoggle"></a> `_onPlayToggle?` | () => `void` | - | - | core/types/src/components/Timeline/Timeline.d.ts:13 |
| <a id="property-_outerbounds-7"></a> `_outerBounds` | `Record`\<`string`, `number`\> | - | [`Axis`](#axis).[`_outerBounds`](#property-_outerbounds) | core/types/src/components/Axis/Axis.d.ts:18 |
| <a id="property-_paddingleft"></a> `_paddingLeft` | `number` | - | - | core/types/src/components/Timeline/Timeline.d.ts:16 |
| <a id="property-_playbuttonclass"></a> `_playButtonClass` | [`TextBox`](#textbox) | - | - | core/types/src/components/Timeline/Timeline.d.ts:11 |
| <a id="property-_playtimer"></a> `_playTimer` | `number` \| `false` | - | - | core/types/src/components/Timeline/Timeline.d.ts:12 |
| <a id="property-_position-5"></a> `_position` | `object` | - | [`Axis`](#axis).[`_position`](#property-_position) | core/types/src/components/Axis/Axis.d.ts:19 |
| `_position.height` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:22 |
| `_position.horizontal` | `boolean` | - | - | core/types/src/components/Axis/Axis.d.ts:20 |
| `_position.opposite` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:25 |
| `_position.width` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:21 |
| `_position.x` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:23 |
| `_position.y` | `string` | - | - | core/types/src/components/Axis/Axis.d.ts:24 |
| <a id="property-_scenerenderer-14"></a> `_sceneRenderer?` | `SvgRenderer` | - | [`Axis`](#axis).[`_sceneRenderer`](#property-_scenerenderer-1) | core/types/src/components/Axis/Axis.d.ts:41 |
| <a id="property-_select-17"></a> `_select` | `Selection` | - | [`Axis`](#axis).[`_select`](#property-_select-1) | core/types/src/components/Axis/Axis.d.ts:14 |
| <a id="property-_tickshape-5"></a> `_tickShape?` | [`Shape`](#shape-1) | - | [`Axis`](#axis).[`_tickShape`](#property-_tickshape) | core/types/src/components/Axis/Axis.d.ts:29 |
| <a id="property-_tickswidth"></a> `_ticksWidth` | `number` | - | - | core/types/src/components/Timeline/Timeline.d.ts:17 |
| <a id="property-_tickunit-5"></a> `_tickUnit` | `number` | - | [`Axis`](#axis).[`_tickUnit`](#property-_tickunit) | core/types/src/components/Axis/Axis.d.ts:27 |
| <a id="property-_titleclass-6"></a> `_titleClass` | [`TextBox`](#textbox) | - | [`Axis`](#axis).[`_titleClass`](#property-_titleclass) | core/types/src/components/Axis/Axis.d.ts:28 |
| <a id="property-_transition-12"></a> `_transition` | `Transition`\<`BaseType`\> | - | [`Axis`](#axis).[`_transition`](#property-_transition-1) | core/types/src/components/Axis/Axis.d.ts:39 |
| <a id="property-_userformat-5"></a> `_userFormat` | `false` \| ((`d`: `unknown`) => `string`) \| *required* | - | [`Axis`](#axis).[`_userFormat`](#property-_userformat) | core/types/src/components/Axis/Axis.d.ts:40 |
| <a id="property-_uuid-18"></a> `_uuid` | `string` | - | [`Axis`](#axis).[`_uuid`](#property-_uuid-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_visibleticks-5"></a> `_visibleTicks` | `unknown`[] | - | [`Axis`](#axis).[`_visibleTicks`](#property-_visibleticks) | core/types/src/components/Axis/Axis.d.ts:38 |
| <a id="property-ctx-18"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-19"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="tooltip-1"></a>

### Tooltip

Defined in: core/types/src/components/Tooltip.d.ts:7

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

Defined in: core/types/src/components/Tooltip.d.ts:39

CSS styles applied to the arrow element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **arrowStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:40

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

Defined in: core/types/src/components/Tooltip.d.ts:44

CSS styles applied to the body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **bodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:45

CSS styles applied to the body element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="config-20"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/components/Tooltip.d.ts:60

The data array used to create tooltips.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/components/Tooltip.d.ts:61

The data array used to create tooltips.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="footerstyle"></a>

##### footerStyle()

###### Call Signature

> **footerStyle**(): `Record`\<`string`, `string`\>

Defined in: core/types/src/components/Tooltip.d.ts:65

CSS styles applied to the footer element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **footerStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:66

CSS styles applied to the footer element.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="locale-19"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

> **parent**(): `HTMLElement` \| `undefined`

Defined in: core/types/src/components/Tooltip.d.ts:55

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

Defined in: core/types/src/components/Tooltip.d.ts:56

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

> **position**(): (`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `number`[] \| `HTMLElement`

Defined in: core/types/src/components/Tooltip.d.ts:75

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Returns

(`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `number`[] \| `HTMLElement`

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

###### Call Signature

> **position**(`_`: `string` \| `number`[] \| `HTMLElement` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `number`[] \| `HTMLElement`)): `this`

Defined in: core/types/src/components/Tooltip.d.ts:76

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `number`[] \| `HTMLElement` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `number`[] \| `HTMLElement`) |

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/components/Tooltip.d.ts:80

CSS styles applied to the table element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tableStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:81

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

Defined in: core/types/src/components/Tooltip.d.ts:85

CSS styles applied to the table body element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tbodyStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:86

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

Defined in: core/types/src/components/Tooltip.d.ts:115

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tdStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:116

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

Defined in: core/types/src/components/Tooltip.d.ts:90

CSS styles applied to the table head element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **theadStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:91

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

Defined in: core/types/src/components/Tooltip.d.ts:95

CSS styles applied to the title element.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **titleStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:96

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

Defined in: core/types/src/components/Tooltip.d.ts:100

Overall CSS styles applied to the tooltip container.

###### Returns

`Record`\<`string`, `string`\>

###### Call Signature

> **tooltipStyle**(`_`: `Record`\<`string`, `string`\>): `this`

Defined in: core/types/src/components/Tooltip.d.ts:101

Overall CSS styles applied to the tooltip container.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `string`\> |

###### Returns

`this`

<a id="translate-19"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

Defined in: core/types/src/components/Tooltip.d.ts:110

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

Defined in: core/types/src/components/Tooltip.d.ts:111

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
| <a id="property-_configdefault-19"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-18"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/components/Tooltip.d.ts:9 |
| <a id="property-_parentel"></a> `_parentEl?` | `HTMLElement` | v4: optional per-chart parent element (default: global #d3plus-portal). | - | core/types/src/components/Tooltip.d.ts:11 |
| <a id="property-_portalel"></a> `_portalEl?` | `HTMLElement` | v4: this Tooltip's own portal div (a `.d3plus-tooltip-portal` appended to `<body>`). Tracked per-instance so that charts each own a distinct portal — and so `parent()` switches only remove THIS instance's portal, not a sibling Tooltip's. | - | core/types/src/components/Tooltip.d.ts:18 |
| <a id="property-_tooltiprefs"></a> `_tooltipRefs` | `Record`\<`string`, \{ `arrowDistance`: `number`; `arrowEl`: `HTMLElement`; `arrowHeight`: `number`; `reference`: `VirtualElement` \| `HTMLElement`; `tooltip`: `HTMLElement`; \}\> | - | - | core/types/src/components/Tooltip.d.ts:19 |
| <a id="property-_uuid-19"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-19"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-20"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="viz"></a>

### Viz

Defined in: core/types/src/charts/viz/Viz.d.ts:7

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

Defined in: core/types/src/charts/viz/Viz.d.ts:85

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

Defined in: core/types/src/charts/viz/Viz.d.ts:106

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

> **active**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:15

The active callback function for highlighting shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

###### Inherited from

`VizBase.active`

<a id="aggs-1"></a>

##### aggs()

> **aggs**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:19

Custom aggregation methods for each data key.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.aggs`

<a id="attribution-1"></a>

##### attribution()

> **attribution**(`_?`: `string` \| `boolean`): `string` \| `boolean` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:23

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

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:27

Configuration object for the attribution style.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.attributionStyle`

<a id="backconfig-1"></a>

##### backConfig()

> **backConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:31

Configuration object for the back button.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.backConfig`

<a id="color-1"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:35

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

`VizBase.color`

<a id="colorscale-2"></a>

##### colorScale()

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:39

Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

`VizBase.colorScale`

<a id="colorscaleconfig-2"></a>

##### colorScaleConfig()

> **colorScaleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:43

A pass-through to the config method of ColorScale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.colorScaleConfig`

<a id="colorscalemaxsize-1"></a>

##### colorScaleMaxSize()

> **colorScaleMaxSize**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:55

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:47

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:51

Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| (() => `string` \| `boolean`) |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz) \| (() => `string` \| `boolean`)

###### Inherited from

`VizBase.colorScalePosition`

<a id="config-21"></a>

##### config()

###### Call Signature

> **config**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:27

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.config`

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:28

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

> **data**(`_?`: `string` \| [`DataPoint`](#datapoint)[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: [`DataPoint`](#datapoint)[]) => `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[]): [`Viz`](#viz) \| [`DataPoint`](#datapoint)[]

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:68

The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `_?` | `string` \| [`DataPoint`](#datapoint)[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \} | - |
| `f?` | (`data`: [`DataPoint`](#datapoint)[]) => `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[] | The data array or a URL string to load data from. |

###### Returns

[`Viz`](#viz) \| [`DataPoint`](#datapoint)[]

###### Inherited from

`VizBase.data`

<a id="destroy-1"></a>

##### destroy()

> **destroy**(): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:110

Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

<a id="detectresize-1"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:75

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:79

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:83

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:87

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:91

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

> **downloadConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:95

Sets specific options of the saveElement function used when downloading the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.downloadConfig`

<a id="downloadposition-1"></a>

##### downloadPosition()

> **downloadPosition**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:99

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:103

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

> **groupBy**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)))[]): [`Viz`](#viz) \| (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)[]

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:107

Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)))[] |

###### Returns

[`Viz`](#viz) \| (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)[]

###### Inherited from

`VizBase.groupBy`

<a id="hiddencolor-1"></a>

##### hiddenColor()

> **hiddenColor**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:111

Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.hiddenColor`

<a id="hiddenopacity-1"></a>

##### hiddenOpacity()

> **hiddenOpacity**(`_?`: `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `number` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:115

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`) |

###### Returns

`number` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

###### Inherited from

`VizBase.hiddenOpacity`

<a id="highlight-1"></a>

##### highlight()

> **highlight**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `undefined`

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:127

Persistently emphasizes the data points matching the given predicate: the
matching marks keep their color while every other mark is de-emphasized to
a neutral gray (the "emphasis" form — highlight one series, gray the rest).
Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
standing state that survives pointer movement. Pass `false` to clear it.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `undefined`

###### Inherited from

`VizBase.highlight`

<a id="hover-10"></a>

##### hover()

> **hover**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `this`

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:119

The hover callback function for highlighting shapes on mouseover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`this`

###### Inherited from

`VizBase.hover`

<a id="label-1"></a>

##### label()

> **label**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:131

Accessor function or string key for the label of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.label`

<a id="legend-2"></a>

##### legend()

> **legend**(`_?`: `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:135

Whether to display the legend.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`config`: `Record`\<`string`, `unknown`\>, `arr`: [`DataPoint`](#datapoint)[]) => `boolean`)

###### Inherited from

`VizBase.legend`

<a id="legendconfig-3"></a>

##### legendConfig()

> **legendConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:139

Configuration object passed to the legend's config method.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.legendConfig`

<a id="legendfilterinvert-1"></a>

##### legendFilterInvert()

> **legendFilterInvert**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:143

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:147

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:151

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

> **legendTooltip**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:155

Configuration object for the legend tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.legendTooltip`

<a id="loadinghtml-1"></a>

##### loadingHTML()

> **loadingHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:17

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:21

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.loadingMessage`

<a id="locale-20"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:25

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

> **messageStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:29

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.messageStyle`

<a id="nodatahtml-1"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:33

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:37

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` |

###### Returns

`boolean` \| [`Viz`](#viz)

###### Inherited from

`VizBase.noDataMessage`

<a id="on-20"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

<a id="parent-20"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

`VizBase.parent`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

Parent config used by the wrapper.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `unknown` |

###### Returns

`this`

###### Inherited from

`VizBase.parent`

<a id="render-19"></a>

##### render()

> **render**(`callback?`: () => `void`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:48

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

Defined in: core/types/src/charts/viz/Viz.d.ts:54

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:55

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

Defined in: core/types/src/charts/viz/Viz.d.ts:62

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Returns

`"full"` \| `"compute"`

###### Call Signature

> **renderMode**(`_`: `"full"` \| `"compute"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:63

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

Defined in: core/types/src/charts/viz/Viz.d.ts:71

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:41

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:45

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

> **shape**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:49

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.shape`

<a id="shapeconfig-21"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/charts/viz/VizBase.d.ts:53

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.shapeConfig`

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/charts/viz/VizBase.d.ts:54

Configuration object with key/value pairs applied as method calls on each shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`D3plusConfig`](#d3plusconfig) |

###### Returns

`this`

###### Inherited from

`VizBase.shapeConfig`

<a id="subtitle-1"></a>

##### subtitle()

> **subtitle**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:58

Accessor function or string for the visualization's subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

###### Inherited from

`VizBase.subtitle`

<a id="subtitleconfig-1"></a>

##### subtitleConfig()

> **subtitleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:62

Configuration object for the subtitle.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.subtitleConfig`

<a id="subtitlepadding-1"></a>

##### subtitlePadding()

> **subtitlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:66

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

> **threshold**(`_?`: `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)): `number` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:70

The threshold value for bucketing small data points together.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`) |

###### Returns

`number` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

###### Inherited from

`VizBase.threshold`

<a id="thresholdkey-1"></a>

##### thresholdKey()

> **thresholdKey**(`key?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBase.d.ts:75

Accessor for the value used in the threshold algorithm.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) | The data key used to group values for thresholding. |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

`VizBase.thresholdKey`

<a id="thresholdname-1"></a>

##### thresholdName()

> **thresholdName**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:79

The label displayed for bucketed threshold items.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.thresholdName`

<a id="time-1"></a>

##### time()

> **time**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBase.d.ts:83

Accessor function or string key for the time dimension of each data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

`VizBase.time`

<a id="timelineconfig-2"></a>

##### timelineConfig()

> **timelineConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:87

Configuration object for the timeline.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.timelineConfig`

<a id="timelinedefault-1"></a>

##### timelineDefault()

> **timelineDefault**(`_?`: `string` \| `Date` \| (`string` \| `Date`)[]): [`Viz`](#viz) \| `Date`[]

Defined in: core/types/src/charts/viz/VizBase.d.ts:91

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:95

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

> **title**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:99

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

###### Inherited from

`VizBase.title`

<a id="titleconfig-8"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:103

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.titleConfig`

<a id="titlepadding-1"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| (() => `boolean`)): `boolean` \| [`Viz`](#viz) \| (() => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:107

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

> **tooltip**(`_?`: `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:111

Whether to display tooltips on hover.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

###### Inherited from

`VizBase.tooltip`

<a id="tooltipconfig-2"></a>

##### tooltipConfig()

> **tooltipConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:115

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.tooltipConfig`

<a id="toscene-19"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: core/types/src/charts/viz/Viz.d.ts:27

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

> **total**(`_?`: `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:119

Accessor function or string key for the total value displayed in the visualization.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`) |

###### Returns

`string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

###### Inherited from

`VizBase.total`

<a id="totalconfig-1"></a>

##### totalConfig()

> **totalConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:123

Configuration object for the total bar.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.totalConfig`

<a id="totalformat-1"></a>

##### totalFormat()

> **totalFormat**(`_?`: (`d`: `number`) => `string`): [`Viz`](#viz) \| ((`d`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:127

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:131

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `boolean` \| (() => `boolean`) |

###### Returns

`boolean` \| [`Viz`](#viz) \| (() => `boolean`)

###### Inherited from

`VizBase.totalPadding`

<a id="translate-20"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:135

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

> **zoomBrushHandleStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:139

An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomBrushHandleStyle`

<a id="zoombrushselectionstyle-1"></a>

##### zoomBrushSelectionStyle()

> **zoomBrushSelectionStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:143

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomBrushSelectionStyle`

<a id="zoomcontrolstyle-1"></a>

##### zoomControlStyle()

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:147

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomControlStyle`

<a id="zoomcontrolstyleactive-1"></a>

##### zoomControlStyleActive()

> **zoomControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:151

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomControlStyleActive`

<a id="zoomcontrolstylehover-1"></a>

##### zoomControlStyleHover()

> **zoomControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:155

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomControlStyleHover`

<a id="zoompadding-1"></a>

##### zoomPadding()

> **zoomPadding**(`_?`: `number`): `number` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBase.d.ts:159

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
| <a id="property-_configdefault-20"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | `VizBase._configDefault` | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_uuid-20"></a> `_uuid` | `string` | - | `VizBase._uuid` | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-ctx-20"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | `VizBase.ctx` | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-21"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | `VizBase.schema` | core/types/src/utils/BaseClass.d.ts:14 |

***

<a id="whisker"></a>

### Whisker

Defined in: core/types/src/shapes/Whisker.d.ts:12

Creates SVG whisker based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="active-11"></a>

##### active()

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: core/types/src/shapes/Whisker.d.ts:37

The active highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="config-22"></a>

##### config()

###### Call Signature

> **config**(): [`WhiskerConfig`](#whiskerconfig-2)

Defined in: core/types/src/shapes/Whisker.d.ts:67

Narrowed `.config()` for Whisker. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`WhiskerConfig`](#whiskerconfig-2)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`WhiskerConfig`](#whiskerconfig-2)\>): `this`

Defined in: core/types/src/shapes/Whisker.d.ts:68

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Whisker.d.ts:41

The data array used to create shapes.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Whisker.d.ts:42

The data array used to create shapes.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | [`DataPoint`](#datapoint)[] |

###### Returns

`this`

<a id="endpointconfig"></a>

##### endpointConfig()

###### Call Signature

> **endpointConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Whisker.d.ts:46

Configuration object for each endpoint.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **endpointConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Whisker.d.ts:47

Configuration object for each endpoint.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="hover-11"></a>

##### hover()

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `void`

Defined in: core/types/src/shapes/Whisker.d.ts:51

The hover highlight state for all sub-shapes in this Whisker.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` |

###### Returns

`void`

<a id="lineconfig-1"></a>

##### lineConfig()

###### Call Signature

> **lineConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/shapes/Whisker.d.ts:55

Configuration object for the line shape.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **lineConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Whisker.d.ts:56

Configuration object for the line shape.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `Record`\<`string`, `unknown`\> |

###### Returns

`this`

<a id="locale-21"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:44

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

<a id="on-21"></a>

##### on()

###### Call Signature

> **on**(): `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\>

Defined in: core/types/src/utils/BaseClass.d.ts:58

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:60

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

Defined in: core/types/src/utils/BaseClass.d.ts:61

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

<a id="parent-21"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:65

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:66

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

Defined in: core/types/src/shapes/Whisker.d.ts:27

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

Defined in: core/types/src/shapes/Whisker.d.ts:60

The SVG container element for this visualization. 3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Whisker.d.ts:61

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

Defined in: core/types/src/utils/BaseClass.d.ts:80

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:81

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

Defined in: core/types/src/shapes/Whisker.d.ts:33

Compute-mode scene aggregation, mirroring Box.toScene(). Returns a
GroupNode containing the inner Line's scene children plus each
endpoint shape's scene children.

###### Returns

`GroupNode`

<a id="translate-21"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:76

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
| <a id="property-_configdefault-21"></a> `_configDefault?` | [`D3plusConfig`](#d3plusconfig) | - | [`BaseClass`](#baseclass).[`_configDefault`](#property-_configdefault-7) | core/types/src/utils/BaseClass.d.ts:18 |
| <a id="property-_data-19"></a> `_data` | [`DataPoint`](#datapoint)[] | - | - | core/types/src/shapes/Whisker.d.ts:14 |
| <a id="property-_line"></a> `_line` | [`Line`](#line) | - | - | core/types/src/shapes/Whisker.d.ts:16 |
| <a id="property-_select-18"></a> `_select` | `Selection` | - | - | core/types/src/shapes/Whisker.d.ts:15 |
| <a id="property-_uuid-21"></a> `_uuid` | `string` | - | [`BaseClass`](#baseclass).[`_uuid`](#property-_uuid-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-_whiskerendpoint-1"></a> `_whiskerEndpoint` | ([`Rect`](#rect) \| [`Circle`](#circle))[] | - | - | core/types/src/shapes/Whisker.d.ts:17 |
| <a id="property-ctx-21"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:16 |
| <a id="property-schema-22"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:14 |

## Functions

<a id="accessor"></a>

### accessor()

> **accessor**(`key`: `string`, `def?`: `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)): (`d`: [`DataPoint`](#datapoint)) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)

Defined in: core/types/src/utils/accessor.d.ts:13

Wraps an object key in a simple accessor function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be returned from each Object passed to the function. |
| `def?` | `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint) | A default value to be returned if the key is not present. |

#### Returns

(`d`: [`DataPoint`](#datapoint)) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)

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

<a id="addtoqueue"></a>

### addToQueue()

> **addToQueue**(`this`: `VizContext`, `_`: `string` \| `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[], `f`: `DataFormatter` \| `undefined`, `key`: `string`): `void`

Defined in: data/types/src/addToQueue.d.ts:20

Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `this` | `VizContext` | - |
| `_` | `string` \| `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[] | - |
| `f` | `DataFormatter` \| *required* | Optional formatter function applied to the loaded data. |
| `key` | `string` | The property name on the instance to store the loaded data. |

#### Returns

`void`

***

<a id="assign"></a>

### assign()

> **assign**(...`objects`: `Record`\<`string`, `unknown`\>[]): `Record`\<`string`, `unknown`\>

Defined in: dom/types/src/assign.d.ts:10

A deeply recursive version of `Object.assign`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`objects` | `Record`\<`string`, `unknown`\>[] | The source objects to merge into the target. |

#### Returns

`Record`\<`string`, `unknown`\>

#### Examples

```ts
assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}));
```

```ts
{id: "bar", deep: {group: "A", value: 20}}
```

***

<a id="attrize"></a>

### attrize()

> **attrize**(`e`: `Attrable`, `a?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>): `void`

Defined in: dom/types/src/attrize.d.ts:7

Applies each key/value in an object as an attr.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | `Attrable` | The d3 selection to apply attributes to. |
| `a?` | `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\> | An object of key/value attr pairs. |

#### Returns

`void`

***

<a id="backgroundcolor"></a>

### backgroundColor()

> **backgroundColor**(`elem`: `Element`): `string`

Defined in: dom/types/src/backgroundColor.d.ts:7

Given a DOM element, returns its background color by walking up the
ancestor chain until a non-transparent background is found. Falls back
to "rgb(255, 255, 255)" (white) if every ancestor is transparent.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `Element` | The DOM element to check. |

#### Returns

`string`

***

<a id="closest"></a>

### closest()

> **closest**(`n`: `number`, `arr?`: `number`[]): `number` \| `undefined`

Defined in: math/types/src/closest.d.ts:6

Finds the closest numeric value in an array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `n` | `number` | The number value to use when searching the array. |
| `arr?` | `number`[] | The array of values to test against. |

#### Returns

`number` \| `undefined`

***

<a id="coloradd"></a>

### colorAdd()

> **colorAdd**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: color/types/src/add.d.ts:8

Adds two colors together.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c1` | `string` | The first color, a valid CSS color string. |
| `c2` | `string` | The second color, also a valid CSS color string. |
| `o1?` | `number` | Value from 0 to 1 of the first color's opacity. |
| `o2?` | `number` | Value from 0 to 1 of the first color's opacity. |

#### Returns

`string`

***

<a id="colorassign"></a>

### colorAssign()

> **colorAssign**(`c`: `string` \| `boolean` \| `null` \| `undefined`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults)\>): `string`

Defined in: color/types/src/assign.d.ts:7

Assigns a color to a value using a predefined set of defaults.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` \| `boolean` \| `null` \| *required* | A valid CSS color string. |
| `u?` | `Partial`\<[`ColorDefaults`](#colordefaults)\> | An object containing overrides of the default colors. |

#### Returns

`string`

***

<a id="colorcontrast"></a>

### colorContrast()

> **colorContrast**(`c`: `string`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults)\>): `string`

Defined in: color/types/src/contrast.d.ts:7

Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on top of that provided color. The choice maximizes the WCAG 2.x contrast ratio against the background, so the more legible of the two text tokens always wins.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` | A valid CSS color string. |
| `u?` | `Partial`\<[`ColorDefaults`](#colordefaults)\> | An object containing overrides of the default colors. |

#### Returns

`string`

***

<a id="colorlegible"></a>

### colorLegible()

> **colorLegible**(`c`: `string`): `string`

Defined in: color/types/src/legible.d.ts:5

Darkens a color so that it will appear legible on a white background.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` | A valid CSS color string. |

#### Returns

`string`

***

<a id="colorlighter"></a>

### colorLighter()

> **colorLighter**(`c`: `string`, `i?`: `number`): `string`

Defined in: color/types/src/lighter.d.ts:6

Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` | A valid CSS color string. |
| `i?` | `number` | Strength of the lightening effect, from 0 to 1. |

#### Returns

`string`

***

<a id="colorramp"></a>

### colorRamp()

> **colorRamp**(`base`: `string`, `n`: `number`, `options?`: [`ColorRampOptions`](#colorrampoptions)): `string`[]

Defined in: color/types/src/ramp.d.ts:27

Builds an `n`-step single-hue ramp from a pale tint to the given base color,
stepped evenly in OKLab so each step looks equally far from the next.

This replaces lightening in HSL (which desaturates toward pure white and
shifts hue, so the pale end loses its identity and can render as white). In
OKLab the hue is held fixed and lightness/chroma taper together, so the ramp
reads as one hue getting lighter.

Returned lightest→darkest; the darkest step is the base color itself for a
continuous ramp.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base` | `string` | The saturated dark anchor of the ramp — a valid CSS color. |
| `n` | `number` | How many steps to produce. |
| `options?` | [`ColorRampOptions`](#colorrampoptions) | Ramp shaping options. |

#### Returns

`string`[]

***

<a id="colorsubtract"></a>

### colorSubtract()

> **colorSubtract**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: color/types/src/subtract.d.ts:8

Subtracts one color from another.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c1` | `string` | The base color, a valid CSS color string. |
| `c2` | `string` | The color to remove from the base color, also a valid CSS color string. |
| `o1?` | `number` | Value from 0 to 1 of the first color's opacity. |
| `o2?` | `number` | Value from 0 to 1 of the first color's opacity. |

#### Returns

`string`

***

<a id="colorvalidate"></a>

### colorValidate()

> **colorValidate**(`palette`: `string`[], `options?`: [`ColorValidateOptions`](#colorvalidateoptions)): [`ColorValidation`](#colorvalidation)

Defined in: color/types/src/validate.d.ts:30

Validates a chart color palette against the computable accessibility checks.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `palette` | `string`[] | An array of CSS color strings, in slot order. |
| `options?` | [`ColorValidateOptions`](#colorvalidateoptions) | Mode, surface, pair scope, and ordinal toggle. |

#### Returns

[`ColorValidation`](#colorvalidation)

***

<a id="concat"></a>

### concat()

> **concat**(`arrayOfArrays`: ([`DataPoint`](#datapoint)[] \| `Record`\<`string`, [`DataPoint`](#datapoint)[]\>)[], `data?`: `string`): [`DataPoint`](#datapoint)[]

Defined in: data/types/src/concat.d.ts:7

Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arrayOfArrays` | ([`DataPoint`](#datapoint)[] \| `Record`\<`string`, [`DataPoint`](#datapoint)[]\>)[] | Array of elements |
| `data?` | `string` | The key in each element that contains the sub-array to concatenate. |

#### Returns

[`DataPoint`](#datapoint)[]

***

<a id="configprep"></a>

### configPrep()

> **configPrep**(`this`: `VizContext`, `config?`: `ConfigObject`, `type?`: `string`, `nest?`: `string` \| `false`): `ConfigObject`

Defined in: core/types/src/utils/configPrep.d.ts:30

Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `this` | `VizContext` | - |
| `config?` | `ConfigObject` | The configuration object to parse. |
| `type?` | `string` | The event classifier to user for "on" events. For example, the default event type of "shape" will apply all events in the "on" config object with that key, like "click.shape" and "mouseleave.shape", in addition to any gloval events like "click" and "mouseleave". |
| `nest?` | `string` \| `false` | An optional nested key to bubble up to the parent config level. |

#### Returns

`ConfigObject`

***

<a id="constant"></a>

### constant()

> **constant**\<`T`\>(`value`: `T`): () => `T`

Defined in: core/types/src/utils/constant.d.ts:11

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

<a id="date"></a>

### date()

> **date**(`d`: `string` \| `number` \| `false` \| `undefined`): `false` \| `Date` \| `undefined`

Defined in: dom/types/src/date.d.ts:5

Parses numbers and strings into valid JavaScript Date objects, supporting years, quarters, months, and ISO 8601 formats.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `d` | `string` \| `number` \| `false` \| *required* | The date value to parse (number, string, or Date). |

#### Returns

`false` \| `Date` \| `undefined`

***

<a id="elem"></a>

### elem()

> **elem**(`selector`: `string`, `p?`: `ElemParams`): `Selection`

Defined in: dom/types/src/elem.d.ts:17

Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optional transitions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `selector` | `string` | A CSS selector string for the element tag and classes. |
| `p?` | `ElemParams` | Configuration object with enter, exit, update, and parent options. |

#### Returns

`Selection`

***

<a id="findlocale"></a>

### findLocale()

> **findLocale**(`locale`: `string`): `string`

Defined in: locales/types/src/findLocale.d.ts:5

Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US").

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `locale` | `string` | A 2-letter language code (e.g., "en", "fr"). |

#### Returns

`string`

***

<a id="fold"></a>

### fold()

> **fold**(`json`: `FoldableJSON`, `data?`: `string`, `headers?`: `string`): [`DataPoint`](#datapoint)[]

Defined in: data/types/src/fold.d.ts:11

Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | `FoldableJSON` | A JSON data Object with `data` and `headers` keys. |
| `data?` | `string` | The key in the JSON object that contains the data array. |
| `headers?` | `string` | The key used for the flat headers array inside of the JSON object. |

#### Returns

[`DataPoint`](#datapoint)[]

***

<a id="fontfamilystringify"></a>

### fontFamilyStringify()

> **fontFamilyStringify**(`family`: `string` \| `string`[]): `string`

Defined in: text/types/src/fontFamily.d.ts:10

Converts an Array of font-family names into a CSS font-family string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `family` | `string` \| `string`[] | A font family name or array of font family names. |

#### Returns

`string`

***

<a id="format"></a>

### format()

> **format**(`specifier`: `string`): `Formatter`

Defined in: format/types/src/format.d.ts:8

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `specifier` | `string` |

#### Returns

`Formatter`

***

<a id="formatabbreviate"></a>

### formatAbbreviate()

> **formatAbbreviate**(`n`: `string` \| `number`, `locale?`: `string` \| [`FormatLocaleDefinition`](#formatlocaledefinition), `precision?`: `string`): `string`

Defined in: format/types/src/formatAbbreviate.d.ts:8

Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `n` | `string` \| `number` | The number to be formatted. |
| `locale?` | `string` \| [`FormatLocaleDefinition`](#formatlocaledefinition) | The locale config to be used. If an object is provided, the function will format the numbers according to the object. The object must include `suffixes`, `delimiter` and `currency` properties. |
| `precision?` | `string` | Number of significant digits to display. |

#### Returns

`string`

***

<a id="formatdate"></a>

### formatDate()

> **formatDate**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter`): `string`

Defined in: format/types/src/formatDate.d.ts:8

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `d` | `Date` | The date to format. |
| `dataArray` | `Date`[] | The full array of ordered Date Objects. |
| `formatter?` | `DateFormatter` | Optional custom format string or function. |

#### Returns

`string`

***

<a id="formatdefaultlocale"></a>

### formatDefaultLocale()

> **formatDefaultLocale**(`definition`: `FormatLocaleDefinition`): `Record`\<`string`, `unknown`\>

Defined in: format/types/src/formatDefaultLocale.d.ts:6

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `definition` | `FormatLocaleDefinition` | The localization definition. |

#### Returns

`Record`\<`string`, `unknown`\>

***

<a id="inviewport"></a>

### inViewport()

> **inViewport**(`elem`: `Element`, `buffer?`: `number`): `boolean`

Defined in: dom/types/src/inViewport.d.ts:6

Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `Element` | The DOM element to check. |
| `buffer?` | `number` | Extra pixel margin around the viewport boundary. |

#### Returns

`boolean`

***

<a id="isdata"></a>

### isData()

> **isData**(`dataItem`: `unknown`): `boolean`

Defined in: data/types/src/isData.d.ts:5

Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dataItem` | `unknown` | The value to be tested |

#### Returns

`boolean`

***

<a id="isobject"></a>

### isObject()

> **isObject**(`item`: `unknown`): `boolean`

Defined in: dom/types/src/isObject.d.ts:5

Detects if a variable is a javascript Object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `unknown` | The value to test. |

#### Returns

`boolean`

***

<a id="largestrect"></a>

### largestRect()

> **largestRect**(`poly`: `Point`[], `options?`: `LargestRectOptions`): `LargestRectResult` \| `null`

Defined in: math/types/src/largestRect.d.ts:73

Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios.

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | An Array of points that represent a polygon. |
| `options?` | `LargestRectOptions` | An Object that allows for overriding various parameters of the algorithm. |

#### Returns

`LargestRectResult` \| `null`

#### Author

Daniel Smilkov [dsmilkov@gmail.com]

#### Default Value

```
{
angle: d3.range(-90, 95, 5),
cache: true,
maxAspectRatio: 15,
minAspectRatio: 1,
minHeight: 0,
minWidth: 0,
nTries: 20,
tolerance: 0.02,
verbose: false,
}
```

***

<a id="lineintersection"></a>

### lineIntersection()

> **lineIntersection**(`p1`: `Point`, `q1`: `Point`, `p2`: `Point`, `q2`: `Point`): `Point` \| `null`

Defined in: math/types/src/lineIntersection.d.ts:10

Finds the intersection point (if there is one) of the lines p1q1 and p2q2.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p1` | `Point` | The first point of the first line segment, which should always be an `[x, y]` formatted Array. |
| `q1` | `Point` | The second point of the first line segment, which should always be an `[x, y]` formatted Array. |
| `p2` | `Point` | The first point of the second line segment, which should always be an `[x, y]` formatted Array. |
| `q2` | `Point` | The second point of the second line segment, which should always be an `[x, y]` formatted Array. |

#### Returns

`Point` \| `null`

***

<a id="load"></a>

### load()

> **load**(`this`: `VizContext`, `path`: `string` \| [`DataPoint`](#datapoint)[] \| (`string` \| [`DataPoint`](#datapoint)[] \| `LoadRequestConfig`)[], `formatter?`: `DataFormatter`, `key?`: `string`, `callback?`: (`error`: `Error` \| `null` \| `undefined`, `data`: [`DataPoint`](#datapoint)[] \| [`DataPoint`](#datapoint)[][] \| `undefined`) => `void`): `void`

Defined in: data/types/src/load.d.ts:24

Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `this` | `VizContext` | - |
| `path` | `string` \| [`DataPoint`](#datapoint)[] \| (`string` \| [`DataPoint`](#datapoint)[] \| `LoadRequestConfig`)[] | The path to the file or url to be loaded. Also support array of paths strings. If an Array of objects is passed, the xhr request logic is skipped. |
| `formatter?` | `DataFormatter` | Optional function to transform the loaded data. |
| `key?` | `string` | The key in the `this` context to save the resulting data to. |
| `callback?` | (`error`: `Error` \| `null` \| `undefined`, `data`: [`DataPoint`](#datapoint)[] \| [`DataPoint`](#datapoint)[][] \| `undefined`) => `void` | Optional function called with the error and loaded data. |

#### Returns

`void`

***

<a id="merge"></a>

### merge()

> **merge**(`objects`: [`DataPoint`](#datapoint)[], `aggs?`: `Record`\<`string`, `AggregationFunction`\>): [`MergedDataPoint`](#mergeddatapoint)

Defined in: data/types/src/merge.d.ts:20

Combines an Array of Objects together and returns a new Object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `objects` | [`DataPoint`](#datapoint)[] | The Array of objects to be merged together. |
| `aggs?` | `Record`\<`string`, `AggregationFunction`\> | An object containing specific aggregation methods (functions) for each key type. By default, numbers are summed and strings are returned as an array of unique values. |

#### Returns

[`MergedDataPoint`](#mergeddatapoint)

#### Examples

```ts
merge([
{id: "foo", group: "A", value: 10, links: [1, 2]},
{id: "bar", group: "A", value: 20, links: [1, 3]}
]);
```

```ts
{id: ["bar", "foo"], group: "A", value: 30, links: [1, 2, 3]}
```

***

<a id="nestgroups"></a>

### nestGroups()

> **nestGroups**(`data`: [`DataPoint`](#datapoint)[], `fns`: `KeyAccessor`[]): `NestEntry`[]

Defined in: data/types/src/nest.d.ts:18

Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The flat data array to nest. |
| `fns` | `KeyAccessor`[] | An array of key accessor functions, one per nesting level. |

#### Returns

`NestEntry`[]

***

<a id="parsesides"></a>

### parseSides()

> **parseSides**(`sides`: `string` \| `number`): `ParsedSides`

Defined in: dom/types/src/parseSides.d.ts:11

Converts a string of directional CSS shorthand values into an object with the values expanded.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sides` | `string` \| `number` | The CSS shorthand string to expand. |

#### Returns

`ParsedSides`

***

<a id="path2polygon"></a>

### path2polygon()

> **path2polygon**(`path`: `string`, `segmentLength?`: `number`): `Point`[]

Defined in: math/types/src/path2polygon.d.ts:7

Transforms a path string into an Array of points.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | An SVG string path, commonly the "d" property of a <path> element. |
| `segmentLength?` | `number` | The length of line segments when converting curves line segments. Higher values lower computation time, but will result in curves that are more rigid. |

#### Returns

`Point`[]

***

<a id="pointdistance"></a>

### pointDistance()

> **pointDistance**(`p1`: `Point`, `p2`: `Point`): `number`

Defined in: math/types/src/pointDistance.d.ts:7

Calculates the pixel distance between two points.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p1` | `Point` | The first point, which should always be an `[x, y]` formatted Array. |
| `p2` | `Point` | The second point, which should always be an `[x, y]` formatted Array. |

#### Returns

`number`

***

<a id="pointdistancesquared"></a>

### pointDistanceSquared()

> **pointDistanceSquared**(`p1`: `Point`, `p2`: `Point`): `number`

Defined in: math/types/src/pointDistanceSquared.d.ts:7

Returns the squared euclidean distance between two points.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p1` | `Point` | The first point, which should always be an `[x, y]` formatted Array. |
| `p2` | `Point` | The second point, which should always be an `[x, y]` formatted Array. |

#### Returns

`number`

***

<a id="pointrotate"></a>

### pointRotate()

> **pointRotate**(`p`: `Point`, `alpha`: `number`, `origin?`: `Point`): `Point`

Defined in: math/types/src/pointRotate.d.ts:8

Rotates a point around a given origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `Point` | The point to be rotated, which should always be an `[x, y]` formatted Array. |
| `alpha` | `number` | The angle in radians to rotate. |
| `origin?` | `Point` | The origin point of the rotation, which should always be an `[x, y]` formatted Array. |

#### Returns

`Point`

***

<a id="polygoninside"></a>

### polygonInside()

> **polygonInside**(`polyA`: `Point`[], `polyB`: `Point`[]): `boolean`

Defined in: math/types/src/polygonInside.d.ts:7

Checks if one polygon is inside another polygon.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `polyA` | `Point`[] | An Array of `[x, y]` points to be used as the inner polygon, checking if it is inside polyA. |
| `polyB` | `Point`[] | An Array of `[x, y]` points to be used as the containing polygon. |

#### Returns

`boolean`

***

<a id="polygonraycast"></a>

### polygonRayCast()

> **polygonRayCast**(`poly`: `Point`[], `origin`: `Point`, `alpha?`: `number`): \[`Point` \| `null`, `Point` \| `null`\]

Defined in: math/types/src/polygonRayCast.d.ts:9

Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | The polygon to test against, which should be an `[x, y]` formatted Array. |
| `origin` | `Point` | The origin point of the ray to be cast, which should be an `[x, y]` formatted Array. |
| `alpha?` | `number` | The angle in radians of the ray. |

#### Returns

\[`Point` \| `null`, `Point` \| `null`\]

An array containing two values, the closest point on the left and the closest point on the right. If either point cannot be found, that value will be `null`.

***

<a id="polygonrotate"></a>

### polygonRotate()

> **polygonRotate**(`poly`: `Point`[], `alpha`: `number`, `origin?`: `Point`): `Point`[]

Defined in: math/types/src/polygonRotate.d.ts:8

Rotates a point around a given origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | The polygon to be rotated, which should be an Array of `[x, y]` values. |
| `alpha` | `number` | The angle in radians to rotate. |
| `origin?` | `Point` | The origin point of the rotation, which should be an `[x, y]` formatted Array. |

#### Returns

`Point`[]

***

<a id="rtl"></a>

### rtl()

> **rtl**(): `boolean`

Defined in: dom/types/src/rtl.d.ts:4

Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".

#### Returns

`boolean`

***

<a id="saveelement"></a>

### saveElement()

> **saveElement**(`elem`: `HTMLElement`, `options?`: `SaveElementOptions`, `renderOptions?`: `SaveElementRenderOptions`): `void`

Defined in: export/types/src/saveElement.d.ts:36

Downloads an HTML Element as a bitmap PNG image.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `HTMLElement` | The DOM element or d3 selection to export. |
| `options?` | `SaveElementOptions` | Additional options to specify. |
| `renderOptions?` | `SaveElementRenderOptions` | Custom options to be passed to the html-to-image function. |

#### Returns

`void`

***

<a id="segmentboxcontains"></a>

### segmentBoxContains()

> **segmentBoxContains**(`s1`: `Point`, `s2`: `Point`, `p`: `Point`): `boolean`

Defined in: math/types/src/segmentBoxContains.d.ts:8

Checks whether a point is inside the bounding box of a line segment.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `s1` | `Point` | The first point of the line segment to be used for the bounding box, which should always be an `[x, y]` formatted Array. |
| `s2` | `Point` | The second point of the line segment to be used for the bounding box, which should always be an `[x, y]` formatted Array. |
| `p` | `Point` | The point to be checked, which should always be an `[x, y]` formatted Array. |

#### Returns

`boolean`

***

<a id="segmentsintersect"></a>

### segmentsIntersect()

> **segmentsIntersect**(`p1`: `Point`, `q1`: `Point`, `p2`: `Point`, `q2`: `Point`): `boolean`

Defined in: math/types/src/segmentsIntersect.d.ts:9

Checks whether the line segments p1q1 && p2q2 intersect.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p1` | `Point` | The first point of the first line segment, which should always be an `[x, y]` formatted Array. |
| `q1` | `Point` | The second point of the first line segment, which should always be an `[x, y]` formatted Array. |
| `p2` | `Point` | The first point of the second line segment, which should always be an `[x, y]` formatted Array. |
| `q2` | `Point` | The second point of the second line segment, which should always be an `[x, y]` formatted Array. |

#### Returns

`boolean`

***

<a id="shapeedgepoint"></a>

### shapeEdgePoint()

> **shapeEdgePoint**(`angle`: `number`, `distance`: `number`, `shape?`: `string`): `Point` \| `null`

Defined in: math/types/src/shapeEdgePoint.d.ts:8

Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `angle` | `number` | The angle, in radians, of the offset point. |
| `distance` | `number` | The pixel distance away from the origin. |
| `shape?` | `string` | The shape type ("circle", "square", or "triangle"). |

#### Returns

`Point` \| `null`

***

<a id="simplify"></a>

### simplify()

> **simplify**(`poly`: `Point`[], `tolerance?`: `number`, `highestQuality?`: `boolean`): `Point`[]

Defined in: math/types/src/simplify.d.ts:9

Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | An Array of points that represent a polygon. |
| `tolerance?` | `number` | Affects the amount of simplification (in the same metric as the point coordinates). |
| `highestQuality?` | `boolean` | Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower. |

#### Returns

`Point`[]

#### Author

Vladimir Agafonkin

***

<a id="strip"></a>

### strip()

> **strip**(`value`: `string`, `spacer?`: `string`): `string`

Defined in: text/types/src/strip.d.ts:6

Removes all non ASCII characters from a string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The HTML string to strip. |
| `spacer?` | `string` | The character to replace whitespace with. |

#### Returns

`string`

***

<a id="stylize"></a>

### stylize()

> **stylize**(`e`: `Stylable`, `s?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>): `void`

Defined in: dom/types/src/stylize.d.ts:7

Applies each key/value in an object as a style.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | `Stylable` | The d3 selection to apply styles to. |
| `s?` | `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\> | An object of key/value style pairs. |

#### Returns

`void`

***

<a id="textsplit"></a>

### textSplit()

> **textSplit**(`sentence`: `string`): `string`[]

Defined in: text/types/src/textSplit.d.ts:5

Splits a given sentence into an array of words.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sentence` | `string` | The sentence to split into words. |

#### Returns

`string`[]

***

<a id="textwidth"></a>

### textWidth()

#### Call Signature

> **textWidth**(`text`: `string`, `style?`: `Record`\<`string`, `string` \| `number`\>): `number`

Defined in: dom/types/src/textWidth.d.ts:6

Given a text string, returns the predicted pixel width of the string when placed into DOM.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `text` | `string` | The text string to measure. |
| `style?` | `Record`\<`string`, `string` \| `number`\> | CSS style properties to apply when measuring. |

##### Returns

`number`

#### Call Signature

> **textWidth**(`text`: `string`[], `style?`: `Record`\<`string`, `string` \| `number`\>): `number`[]

Defined in: dom/types/src/textWidth.d.ts:7

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string`[] |
| `style?` | `Record`\<`string`, `string` \| `number`\> |

##### Returns

`number`[]

***

<a id="textwrap"></a>

### textWrap()

> **textWrap**(): `TextWrapGenerator`

Defined in: text/types/src/textWrap.d.ts:37

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.

#### Returns

`TextWrapGenerator`

***

<a id="titlecase"></a>

### titleCase()

> **titleCase**(`str`: `string` \| `undefined`, `locale?`: `string` \| [`TitleCaseRules`](#titlecaserules)): `string`

Defined in: text/types/src/titleCase.d.ts:14

Capitalizes each significant word of a phrase, normalizing case in both
directions: the locale's minor words (articles, short conjunctions/
prepositions) are forced lowercase in the middle and known acronyms are
forced uppercase — so "SOUTH BY SOUTHWEST" becomes "South by Southwest" and
"jack smith, ceo" becomes "Jack Smith, CEO". The first and last words are
always capitalized. The locale supplies the minor-word and acronym lists
(e.g. "le"/"de"/"par" for French); pass an explicit rules object for full
control, including `{style: "sentence"}` to capitalize only the first word.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `str` | `string` \| *required* | The string to capitalize. |
| `locale?` | `string` \| [`TitleCaseRules`](#titlecaserules) | A locale code (e.g. "en-US", "fr-FR") or an explicit rules object. Defaults to "en-US". |

#### Returns

`string`

***

<a id="unique"></a>

### unique()

> **unique**\<`T`\>(`arr`: `T`[], `accessor?`: (`d`: `T`) => `unknown`): `T`[]

Defined in: data/types/src/unique.d.ts:10

ES5 implementation to reduce an Array of values to unique instances.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arr` | `T`[] | The Array of objects to be filtered. |
| `accessor?` | (`d`: `T`) => `unknown` | An optional accessor function used to extract data points from an Array of Objects. |

#### Returns

`T`[]

#### Examples

```ts
unique(["apple", "banana", "apple"]);
```

```ts
["apple", "banana"]
```

## Variables

<a id="areaplot"></a>

### AreaPlot

> `const` **AreaPlot**: () => `any`

Defined in: core/types/src/charts/AreaPlot/index.d.ts:9

Creates an area plot based on an array of data.

#### Returns

`any`

***

<a id="barchart"></a>

### BarChart

> `const` **BarChart**: () => `any`

Defined in: core/types/src/charts/BarChart/index.d.ts:9

Creates a bar chart based on an array of data.

#### Returns

`any`

***

<a id="boxwhisker"></a>

### BoxWhisker

> `const` **BoxWhisker**: () => `any`

Defined in: core/types/src/charts/BoxWhisker/index.d.ts:10

Creates a simple box and whisker based on an array of data.

#### Returns

`any`

***

<a id="bumpchart"></a>

### BumpChart

> `const` **BumpChart**: () => `any`

Defined in: core/types/src/charts/BumpChart/index.d.ts:10

Creates a bump chart based on an array of data.

#### Returns

`any`

***

<a id="colordefaults-1"></a>

### colorDefaults

> `const` **colorDefaults**: [`ColorDefaults`](#colordefaults)

Defined in: color/types/src/defaults.d.ts:44

A set of default color values used when assigning colors based on data.

The categorical `scale` is CVD-checked: its first eight slots (the identity
tier) are open-color steps chosen to sit inside the OKLCH lightness band,
clear the chroma floor, and stay distinguishable under protanopia and
deuteranopia — validate them with `colorValidate`. The slot order is the
colorblind-safety mechanism and should not be reshuffled. Slots nine and up
are a lighter second ring of the same hues, for high-cardinality fallback
(past ~8 series, prefer grouping the tail into "Other").

`sequential` is the default single-hue anchor for magnitude ramps (blue).

#### Default Value

```
{
  dark: "#495057",
  light: "#f8f9fa",
  missing: "#ced4da",
  off: "#c92a2a",
  on: "#2b8a3e",
  sequential: "#1c7ed6",
  scale: d3.scaleOrdinal().range([
    "#4c6ef5", "#e67700", "#e03131",
    "#2f9e44", "#d9480f", "#ae3ec9",
    "#1098ad", "#d6336c", "#748ffc",
    "#ffd43b", "#ff8787", "#69db7c",
    "#ffa94d", "#da77f2", "#3bc9db",
    "#f783ac"
  ])
}
```

***

<a id="donut"></a>

### Donut

> `const` **Donut**: () => `any`

Defined in: core/types/src/charts/Donut/index.d.ts:12

Extends the Pie visualization to create a donut chart.

#### Returns

`any`

***

<a id="fontexists"></a>

### fontExists

> `const` **fontExists**: (`font`: `string` \| `string`[]) => `string` \| `false`

Defined in: dom/types/src/fontExists.d.ts:5

Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `font` | `string` \| `string`[] | Can be either a valid CSS font-family string (single or comma-separated names) or an Array of string names. |

#### Returns

`string` \| `false`

***

<a id="fontfamily-2"></a>

### fontFamily

> `const` **fontFamily**: `string`[]

Defined in: text/types/src/fontFamily.d.ts:5

The default fallback font list used for all text labels as an Array of Strings.

#### Default Value

`["Inter", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]`

***

<a id="formatlocale"></a>

### formatLocale

> `const` **formatLocale**: `Record`\<`string`, [`FormatLocaleDefinition`](#formatlocaledefinition)\>

Defined in: locales/types/src/dictionaries/formatLocale.d.ts:15

***

<a id="geomap"></a>

### Geomap

> `const` **Geomap**: () => `any`

Defined in: core/types/src/charts/Geomap/index.d.ts:13

Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points.

#### Returns

`any`

***

<a id="lineplot"></a>

### LinePlot

> `const` **LinePlot**: () => `any`

Defined in: core/types/src/charts/LinePlot/index.d.ts:9

Creates a line plot based on an array of data.

#### Returns

`any`

***

<a id="locale-22"></a>

### locale

> `const` **locale**: `Record`\<`string`, [`TimeLocaleDefinition`](#timelocaledefinition)\>

Defined in: locales/types/src/dictionaries/timeLocale.d.ts:38

***

<a id="matrix"></a>

### Matrix

> `const` **Matrix**: () => `any`

Defined in: core/types/src/charts/Matrix/index.d.ts:13

Creates a simple rows/columns Matrix view of any dataset.

#### Returns

`any`

***

<a id="network"></a>

### Network

> `const` **Network**: () => `any`

Defined in: core/types/src/charts/Network/index.d.ts:6

Creates a network visualization based on a defined set of nodes and edges.

#### Returns

`any`

***

<a id="pack"></a>

### Pack

> `const` **Pack**: () => `any`

Defined in: core/types/src/charts/Pack/index.d.ts:14

Uses the d3 pack layout to create a Circle Packing chart based on an array of data.

#### Returns

`any`

***

<a id="pie"></a>

### Pie

> `const` **Pie**: () => `any`

Defined in: core/types/src/charts/Pie/index.d.ts:13

Uses the d3 pie layout to create SVG arcs based on an array of data.

#### Returns

`any`

***

<a id="priestley"></a>

### Priestley

> `const` **Priestley**: () => `any`

Defined in: core/types/src/charts/Priestley/index.d.ts:13

Creates a Priestley timeline based on an array of data.

#### Returns

`any`

***

<a id="radar"></a>

### Radar

> `const` **Radar**: () => `any`

Defined in: core/types/src/charts/Radar/index.d.ts:13

Creates a radar visualization based on an array of data.

#### Returns

`any`

***

<a id="radialmatrix"></a>

### RadialMatrix

> `const` **RadialMatrix**: () => `any`

Defined in: core/types/src/charts/RadialMatrix/index.d.ts:13

Creates a radial layout of a rows/columns Matrix of any dataset.

#### Returns

`any`

***

<a id="reset"></a>

### RESET

> `const` **RESET**: `string`

Defined in: core/types/src/utils/RESET.d.ts:2

String constant used to reset an individual config property.

***

<a id="rings"></a>

### Rings

> `const` **Rings**: () => `any`

Defined in: core/types/src/charts/Rings/index.d.ts:14

Creates a ring visualization based on a defined set of nodes and edges.

#### Returns

`any`

***

<a id="sankey"></a>

### Sankey

> `const` **Sankey**: () => `any`

Defined in: core/types/src/charts/Sankey/index.d.ts:6

Creates a Sankey visualization based on a defined set of nodes and links.

#### Returns

`any`

***

<a id="stackedarea"></a>

### StackedArea

> `const` **StackedArea**: () => `any`

Defined in: core/types/src/charts/StackedArea/index.d.ts:9

Creates a stacked area plot based on an array of data.

#### Returns

`any`

***

<a id="titlecaselocale"></a>

### titleCaseLocale

> `const` **titleCaseLocale**: `Record`\<`string`, [`TitleCaseRules`](#titlecaserules)\>

Defined in: locales/types/src/dictionaries/titleCaseLocale.d.ts:25

***

<a id="translatelocale"></a>

### translateLocale

> `const` **translateLocale**: `Record`\<`string`, [`TranslationStrings`](#translationstrings)\>

Defined in: locales/types/src/dictionaries/translateLocale.d.ts:20

***

<a id="tree"></a>

### Tree

> `const` **Tree**: () => `any`

Defined in: core/types/src/charts/Tree/index.d.ts:13

Uses d3's tree layout to create a tidy tree chart based on an array of data.

#### Returns

`any`

***

<a id="treemap"></a>

### Treemap

> `const` **Treemap**: () => `any`

Defined in: core/types/src/charts/Treemap/index.d.ts:17

Uses the d3 treemap layout to create SVG rectangles based on an array of data.

#### Returns

`any`

## Interfaces

<a id="areaconfig-1"></a>

### AreaConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:144

Area-specific config (curve, defined, dual-edge x/y).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-curve"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:145 |
| <a id="property-data"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-defined"></a> `defined?` | (`d`: [`DataPoint`](#datapoint)) => `boolean` | Determines whether a data point is defined (a gap in the area when false). | - | core/types/src/shapes/shapeConfig.d.ts:147 |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-hitarea"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-x"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-x0"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:148 |
| <a id="property-x1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:149 |
| <a id="property-y"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:124 |
| <a id="property-y0"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:150 |
| <a id="property-y1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:151 |

***

<a id="axisconfig-2"></a>

### AxisConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:8

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-barconfig"></a> `barConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:9 |
| <a id="property-grid"></a> `grid?` | `unknown`[] | Grid values of the axis. | core/types/src/utils/D3plusConfig.d.ts:11 |
| <a id="property-gridconfig"></a> `gridConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:12 |
| <a id="property-gridsize"></a> `gridSize?` | `number` | Grid size of the axis. | core/types/src/utils/D3plusConfig.d.ts:14 |
| <a id="property-label-1"></a> `label?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:15 |
| <a id="property-labeloffset"></a> `labelOffset?` | `number` \| `false` | - | core/types/src/utils/D3plusConfig.d.ts:18 |
| <a id="property-labels"></a> `labels?` | `unknown`[] | Visible tick labels of the axis. | core/types/src/utils/D3plusConfig.d.ts:17 |
| <a id="property-maxsize"></a> `maxSize?` | `number` | Maximum size allowed for the space that contains the axis tick labels and title. | core/types/src/utils/D3plusConfig.d.ts:20 |
| <a id="property-minsize"></a> `minSize?` | `number` | Minimum size alloted for the space that contains the axis tick labels and title. | core/types/src/utils/D3plusConfig.d.ts:22 |
| <a id="property-range"></a> `range?` | (`number` \| `undefined`)[] | Scale range (in pixels) of the axis. The given array must have 2 values, but one may be `undefined` to allow the default behavior for that value. | core/types/src/utils/D3plusConfig.d.ts:27 |
| <a id="property-scale-1"></a> `scale?` | `AxisScale` | Scale of the axis. | core/types/src/utils/D3plusConfig.d.ts:29 |
| <a id="property-tickformat"></a> `tickFormat?` | (`d`: `string` \| `number`) => `string` \| `number` | Tick formatter. | core/types/src/utils/D3plusConfig.d.ts:31 |
| <a id="property-ticks"></a> `ticks?` | `unknown`[] | Tick values of the axis. | core/types/src/utils/D3plusConfig.d.ts:33 |
| <a id="property-ticksize"></a> `tickSize?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:34 |
| <a id="property-timelocale"></a> `timeLocale?` | `Record`\<`string`, `unknown`\> | Defines a custom locale object to be used in time scales. Must include `dateTime`, `date`, `time`, `periods`, `days`, `shortDays`, `months`, and `shortMonths` (see [d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale)). | core/types/src/utils/D3plusConfig.d.ts:41 |
| <a id="property-title"></a> `title?` | `string` | Title of the axis. | core/types/src/utils/D3plusConfig.d.ts:43 |

***

<a id="barconfig-7"></a>

### BarConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:158

Bar-specific config (Rect + start/end coords).

#### Extends

- [`RectConfig`](#rectconfig-3)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-1"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`RectConfig`](#rectconfig-3).[`active`](#property-active-8) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-1"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`RectConfig`](#rectconfig-3).[`activeOpacity`](#property-activeopacity-6) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-1"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`RectConfig`](#rectconfig-3).[`activeStyle`](#property-activestyle-6) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-1"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`ariaLabel`](#property-arialabel-6) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-1"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`RectConfig`](#rectconfig-3).[`backgroundImage`](#property-backgroundimage-6) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-data-1"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`RectConfig`](#rectconfig-3).[`data`](#property-data-9) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-1"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`RectConfig`](#rectconfig-3).[`discrete`](#property-discrete-7) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-1"></a> `duration?` | `number` | Animation duration in ms. | [`RectConfig`](#rectconfig-3).[`duration`](#property-duration-8) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-1"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`RectConfig`](#rectconfig-3).[`fill`](#property-fill-6) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-1"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`RectConfig`](#rectconfig-3).[`fillOpacity`](#property-fillopacity-6) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-height"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`height`](#property-height-3) | core/types/src/shapes/shapeConfig.d.ts:132 |
| <a id="property-hitarea-1"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`RectConfig`](#rectconfig-3).[`hitArea`](#property-hitarea-6) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-1"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`RectConfig`](#rectconfig-3).[`hover`](#property-hover-8) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-1"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverOpacity`](#property-hoveropacity-6) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-1"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverStyle`](#property-hoverstyle-6) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-1"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`RectConfig`](#rectconfig-3).[`id`](#property-id-7) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-2"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`RectConfig`](#rectconfig-3).[`label`](#property-label-8) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-1"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`RectConfig`](#rectconfig-3).[`labelBounds`](#property-labelbounds-6) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-1"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`RectConfig`](#rectconfig-3).[`labelConfig`](#property-labelconfig-6) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-1"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`RectConfig`](#rectconfig-3).[`on`](#property-on-8) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-1"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`RectConfig`](#rectconfig-3).[`opacity`](#property-opacity-7) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-1"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`RectConfig`](#rectconfig-3).[`pointerEvents`](#property-pointerevents-7) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode-1"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`RectConfig`](#rectconfig-3).[`renderMode`](#property-rendermode-6) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-1"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`role`](#property-role-6) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-1"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`RectConfig`](#rectconfig-3).[`rotate`](#property-rotate-6) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-1"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`rx`](#property-rx-6) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-1"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`ry`](#property-ry-6) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-2"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`RectConfig`](#rectconfig-3).[`scale`](#property-scale-8) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-1"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`RectConfig`](#rectconfig-3).[`select`](#property-select-8) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-1"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`RectConfig`](#rectconfig-3).[`shapeRendering`](#property-shaperendering-6) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-1"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`RectConfig`](#rectconfig-3).[`sort`](#property-sort-6) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-1"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`RectConfig`](#rectconfig-3).[`stroke`](#property-stroke-6) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-1"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`RectConfig`](#rectconfig-3).[`strokeDasharray`](#property-strokedasharray-6) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-1"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`RectConfig`](#rectconfig-3).[`strokeLinecap`](#property-strokelinecap-6) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-1"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`RectConfig`](#rectconfig-3).[`strokeOpacity`](#property-strokeopacity-6) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-1"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`RectConfig`](#rectconfig-3).[`strokeWidth`](#property-strokewidth-6) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-1"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`RectConfig`](#rectconfig-3).[`textAnchor`](#property-textanchor-6) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-1"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`RectConfig`](#rectconfig-3).[`texture`](#property-texture-6) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-1"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`RectConfig`](#rectconfig-3).[`textureDefault`](#property-texturedefault-6) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-1"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`RectConfig`](#rectconfig-3).[`vectorEffect`](#property-vectoreffect-6) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-1"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`RectConfig`](#rectconfig-3).[`verticalAlign`](#property-verticalalign-6) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-width"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`width`](#property-width-3) | core/types/src/shapes/shapeConfig.d.ts:131 |
| <a id="property-x-1"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`RectConfig`](#rectconfig-3).[`x`](#property-x-9) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-x0-1"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:159 |
| <a id="property-x1-1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:160 |
| <a id="property-y-1"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`RectConfig`](#rectconfig-3).[`y`](#property-y-9) | core/types/src/shapes/shapeConfig.d.ts:124 |
| <a id="property-y0-1"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:161 |
| <a id="property-y1-1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:162 |

***

<a id="baseshapeconfig"></a>

### BaseShapeConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:42

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
| <a id="property-active-2"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-2"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-2"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-2"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-2"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-data-2"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-2"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-2"></a> `duration?` | `number` | Animation duration in ms. | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-2"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-2"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-hitarea-2"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-2"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-2"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-2"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-2"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-3"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-2"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-2"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-2"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-2"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-2"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode-2"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-2"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-2"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-2"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-2"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-3"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-2"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-2"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-2"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-2"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-2"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-2"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-2"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-2"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-2"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-2"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-2"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-2"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-2"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-x-2"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-y-2"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | core/types/src/shapes/shapeConfig.d.ts:124 |

***

<a id="boxconfig-1"></a>

### BoxConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:180

Box-specific config (whisker + median + outliers; subset of Shape).

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-3"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:181 |
| <a id="property-medianconfig"></a> `medianConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:182 |
| <a id="property-orient"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Orientation: "vertical" or "horizontal". | core/types/src/shapes/shapeConfig.d.ts:184 |
| <a id="property-outlier"></a> `outlier?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Outlier accessor (per-datum predicate). | core/types/src/shapes/shapeConfig.d.ts:186 |
| <a id="property-outlierconfig"></a> `outlierConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:187 |
| <a id="property-rectconfig"></a> `rectConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:188 |
| <a id="property-rectwidth"></a> `rectWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:189 |
| <a id="property-select-3"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:190 |
| <a id="property-whiskerconfig"></a> `whiskerConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:191 |
| <a id="property-whiskermode"></a> `whiskerMode?` | `string` \| `number` \| (`string` \| `number`)[] | Whisker mode: single mode string/number or [low, high] pair. | core/types/src/shapes/shapeConfig.d.ts:193 |
| <a id="property-x-3"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:194 |
| <a id="property-y-3"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:195 |

***

<a id="circleconfig-1"></a>

### CircleConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:135

Circle-specific config (radius).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-3"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-3"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-3"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-3"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-3"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-data-4"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-3"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-3"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-3"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-3"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-hitarea-3"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-3"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-3"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-3"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-3"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-4"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-3"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-3"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-3"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-3"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-3"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-r"></a> `r?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:136 |
| <a id="property-rendermode-3"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-3"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-3"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-3"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-3"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-4"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-4"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-3"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-3"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-3"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-3"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-3"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-3"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-3"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-3"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-3"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-3"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-3"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-3"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-x-4"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-y-4"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:124 |

***

<a id="colorcheck"></a>

### ColorCheck

Defined in: color/types/src/validate.d.ts:4

One computed check in a palette validation report.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-detail"></a> `detail` | `string` | color/types/src/validate.d.ts:7 |
| <a id="property-name"></a> `name` | `string` | color/types/src/validate.d.ts:5 |
| <a id="property-state"></a> `state` | [`CheckState`](#checkstate) | color/types/src/validate.d.ts:6 |

***

<a id="colordefaults"></a>

### ColorDefaults

Defined in: color/types/src/defaults.d.ts:2

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-dark"></a> `dark` | `string` | color/types/src/defaults.d.ts:3 |
| <a id="property-light"></a> `light` | `string` | color/types/src/defaults.d.ts:4 |
| <a id="property-missing"></a> `missing` | `string` | color/types/src/defaults.d.ts:5 |
| <a id="property-off"></a> `off` | `string` | color/types/src/defaults.d.ts:6 |
| <a id="property-on-4"></a> `on` | `string` | color/types/src/defaults.d.ts:7 |
| <a id="property-scale-5"></a> `scale` | `ScaleOrdinal`\<`string`, `string`\> | color/types/src/defaults.d.ts:8 |
| <a id="property-sequential"></a> `sequential` | `string` | color/types/src/defaults.d.ts:9 |

***

<a id="colorrampoptions"></a>

### ColorRampOptions

Defined in: color/types/src/ramp.d.ts:2

Options for [colorRamp](#colorramp).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ordinal"></a> `ordinal?` | `boolean` | Build an ordered/ordinal ramp rather than a continuous sequential one. Ordinal ramps hold the palest step darker (so it still reads against the surface) and keep more chroma across the range, since every step is a discrete mark a reader must tell apart. Continuous ramps let the light end fade nearly into the surface (it means "near zero"). | color/types/src/ramp.d.ts:10 |

***

<a id="colorscaleconfig-3"></a>

### ColorScaleConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:168

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bucketformat"></a> `bucketFormat?` | (`start`: `number`, `i`: `number`, `buckets`: `number`[], `values`: `number`[]) => `string` | Formats the label for each bucket in a bucket-type scale ("jenks", "quantile", …). Passed the bucket's start value, its index, the full bucket array, and every data value used to build the buckets. | core/types/src/utils/D3plusConfig.d.ts:179 |
| <a id="property-bucketjoiner"></a> `bucketJoiner?` | (`min`: `string`, `max`: `string`) => `string` | Given a bucket's minimum and maximum values, returns the full label. | core/types/src/utils/D3plusConfig.d.ts:181 |
| <a id="property-domain"></a> `domain?` | `number`[] | For a linear scale, the `[min, max]` values used by the color scale; values outside this range map to the nearest color. | core/types/src/utils/D3plusConfig.d.ts:173 |

***

<a id="colorvalidateoptions"></a>

### ColorValidateOptions

Defined in: color/types/src/validate.d.ts:15

Options for [colorValidate](#colorvalidate).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode?` | `"light"` \| `"dark"` | Surface mode — sets the lightness band and default surface. | color/types/src/validate.d.ts:17 |
| <a id="property-ordinal-1"></a> `ordinal?` | `boolean` | Validate as an ordered one-hue ramp instead of a categorical palette. | color/types/src/validate.d.ts:23 |
| <a id="property-pairs"></a> `pairs?` | `"adjacent"` \| `"all"` | `adjacent` (bars/lines/stacks) or `all` (scatter/bubble/maps). | color/types/src/validate.d.ts:21 |
| <a id="property-surface"></a> `surface?` | `string` | Chart surface color the marks are drawn on. | color/types/src/validate.d.ts:19 |

***

<a id="colorvalidation"></a>

### ColorValidation

Defined in: color/types/src/validate.d.ts:10

The result of validating a palette. `ok` is true when no check hard-fails.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | [`ColorCheck`](#colorcheck)[] | color/types/src/validate.d.ts:12 |
| <a id="property-ok"></a> `ok` | `boolean` | color/types/src/validate.d.ts:11 |

***

<a id="d3plusconfig"></a>

### D3plusConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:183

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-4"></a> `active?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | The active callback function for highlighting shapes. | core/types/src/utils/D3plusConfig.d.ts:189 |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | core/types/src/utils/D3plusConfig.d.ts:191 |
| <a id="property-ariahidden"></a> `ariaHidden?` | `boolean` | Hides the SVG from assistive technology when true (`aria-hidden`). | core/types/src/utils/D3plusConfig.d.ts:195 |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:197 |
| <a id="property-baseline"></a> `baseline?` | `number` | The baseline for the x/y plot. | core/types/src/utils/D3plusConfig.d.ts:199 |
| <a id="property-cache"></a> `cache?` | `boolean` | Whether to cache the processed data between renders. | core/types/src/utils/D3plusConfig.d.ts:201 |
| <a id="property-colorordinal"></a> `colorOrdinal?` | `boolean` | Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. | core/types/src/utils/D3plusConfig.d.ts:203 |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | core/types/src/utils/D3plusConfig.d.ts:205 |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | core/types/src/utils/D3plusConfig.d.ts:207 |
| `colorScaleConfig.axisConfig?` | [`AxisConfig`](#axisconfig-2) | - | core/types/src/utils/D3plusConfig.d.ts:208 |
| `colorScaleConfig.centered?` | `boolean` | - | core/types/src/utils/D3plusConfig.d.ts:209 |
| `colorScaleConfig.colorMax?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:213 |
| `colorScaleConfig.colorMid?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:212 |
| `colorScaleConfig.colorMin?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:211 |
| `colorScaleConfig.colors?` | `string`[] | - | core/types/src/utils/D3plusConfig.d.ts:210 |
| `colorScaleConfig.scale?` | `AxisScale` | - | core/types/src/utils/D3plusConfig.d.ts:214 |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` | Position of the color scale, or false to hide it. | core/types/src/utils/D3plusConfig.d.ts:217 |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:219 |
| <a id="property-confidence"></a> `confidence?` | `false` \| \[`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`), `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)\] | The confidence interval as `[lower, upper]` bounds — each given as an accessor function or a static data key (e.g. `["lci", "hci"]`), or `false` to disable. | core/types/src/utils/D3plusConfig.d.ts:225 |
| <a id="property-data-5"></a> `data?` | `string` \| [`DataPoint`](#datapoint)[] | Data array or URL string to load data from. | core/types/src/utils/D3plusConfig.d.ts:185 |
| <a id="property-datacutoff"></a> `dataCutoff?` | `number` | Maximum number of data points to render before downsampling. | core/types/src/utils/D3plusConfig.d.ts:230 |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | core/types/src/utils/D3plusConfig.d.ts:232 |
| <a id="property-discrete-4"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | core/types/src/utils/D3plusConfig.d.ts:234 |
| <a id="property-duration-4"></a> `duration?` | `number` | Default duration of transitions, in milliseconds. | core/types/src/utils/D3plusConfig.d.ts:236 |
| <a id="property-filter"></a> `filter?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) | Predicate filtering which data points are included, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:238 |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | core/types/src/utils/D3plusConfig.d.ts:240 |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) \| (`d`: [`DataPoint`](#datapoint)) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | core/types/src/utils/D3plusConfig.d.ts:242 |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:244 |
| <a id="property-height-1"></a> `height?` | `number` | Overall height of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:246 |
| <a id="property-highlight"></a> `highlight?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Persistently emphasizes matching marks (keep color) and grays the rest. | core/types/src/utils/D3plusConfig.d.ts:250 |
| <a id="property-hover-4"></a> `hover?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | The hover callback function for highlighting shapes on mouseover. | core/types/src/utils/D3plusConfig.d.ts:248 |
| <a id="property-label-5"></a> `label?` | `string` \| `false` \| `string`[] \| `AccessorFn` | Label accessor for shapes. | core/types/src/utils/D3plusConfig.d.ts:252 |
| <a id="property-legend"></a> `legend?` | `boolean` | Whether to show the legend. | core/types/src/utils/D3plusConfig.d.ts:254 |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | core/types/src/utils/D3plusConfig.d.ts:256 |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | core/types/src/utils/D3plusConfig.d.ts:257 |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:258 |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` | Position of the legend. | core/types/src/utils/D3plusConfig.d.ts:261 |
| <a id="property-legendsort"></a> `legendSort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort comparator for legend items. | core/types/src/utils/D3plusConfig.d.ts:263 |
| <a id="property-legendtooltip"></a> `legendTooltip?` | [`TooltipConfig`](#tooltipconfig-3) | Tooltip configuration for legend items. | core/types/src/utils/D3plusConfig.d.ts:265 |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | core/types/src/utils/D3plusConfig.d.ts:267 |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` | Custom HTML content for the loading indicator. | core/types/src/utils/D3plusConfig.d.ts:271 |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | core/types/src/utils/D3plusConfig.d.ts:269 |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | core/types/src/utils/D3plusConfig.d.ts:187 |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | core/types/src/utils/D3plusConfig.d.ts:273 |
| <a id="property-ocean"></a> `ocean?` | `string` | Ocean color for geomaps (any CSS value including 'transparent'). | core/types/src/utils/D3plusConfig.d.ts:275 |
| <a id="property-on-5"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | core/types/src/utils/D3plusConfig.d.ts:277 |
| <a id="property-point"></a> `point?` | (`d`: [`DataPoint`](#datapoint)) => `number`[] | Coordinate accessor for point-based geomaps. | core/types/src/utils/D3plusConfig.d.ts:279 |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `number`) | Point size accessor for geomaps. | core/types/src/utils/D3plusConfig.d.ts:281 |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:285 |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:283 |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | core/types/src/utils/D3plusConfig.d.ts:287 |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | core/types/src/utils/D3plusConfig.d.ts:289 |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | core/types/src/utils/D3plusConfig.d.ts:291 |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:293 |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` \| `Window` | Scrollable container selector for tooltip positioning. | core/types/src/utils/D3plusConfig.d.ts:295 |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | core/types/src/utils/D3plusConfig.d.ts:297 |
| `shapeConfig.duration?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:298 |
| <a id="property-shapesort"></a> `shapeSort?` | (`a`: `string`, `b`: `string`) => `number` | A [sort comparator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape class (e.g. "Circle", "Line") as its arguments. Shapes are drawn in groups by type, so this defines the layering order for all shapes of a given type. | core/types/src/utils/D3plusConfig.d.ts:307 |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | core/types/src/utils/D3plusConfig.d.ts:309 |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | core/types/src/utils/D3plusConfig.d.ts:311 |
| <a id="property-stackorder"></a> `stackOrder?` | `string`[] | Custom order for stacked series. | core/types/src/utils/D3plusConfig.d.ts:313 |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | core/types/src/utils/D3plusConfig.d.ts:315 |
| <a id="property-svgdesc"></a> `svgDesc?` | `string` | Accessible description applied to the root SVG (`<desc>`). | core/types/src/utils/D3plusConfig.d.ts:317 |
| <a id="property-svgtitle"></a> `svgTitle?` | `string` | Accessible title applied to the root SVG (`<title>`). | core/types/src/utils/D3plusConfig.d.ts:319 |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | core/types/src/utils/D3plusConfig.d.ts:321 |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` | Label for the threshold group. | core/types/src/utils/D3plusConfig.d.ts:323 |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | core/types/src/utils/D3plusConfig.d.ts:327 |
| <a id="property-tileurl"></a> `tileUrl?` | `string` | URL to XYZ map tiles. | core/types/src/utils/D3plusConfig.d.ts:325 |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | core/types/src/utils/D3plusConfig.d.ts:329 |
| <a id="property-timefilter"></a> `timeFilter?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) | Predicate filtering which time slices are shown, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:331 |
| <a id="property-timeline"></a> `timeline?` | `boolean` | Whether to show the timeline component. | core/types/src/utils/D3plusConfig.d.ts:333 |
| <a id="property-title-1"></a> `title?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) | Chart title or title accessor function. | core/types/src/utils/D3plusConfig.d.ts:335 |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | core/types/src/utils/D3plusConfig.d.ts:337 |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` | Whether to show tooltips. | core/types/src/utils/D3plusConfig.d.ts:339 |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | [`TooltipConfig`](#tooltipconfig-3) | Configuration for the tooltip component. | core/types/src/utils/D3plusConfig.d.ts:341 |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | core/types/src/utils/D3plusConfig.d.ts:343 |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | core/types/src/utils/D3plusConfig.d.ts:345 |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | core/types/src/utils/D3plusConfig.d.ts:347 |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | core/types/src/utils/D3plusConfig.d.ts:349 |
| <a id="property-width-1"></a> `width?` | `number` | Overall width of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:351 |
| <a id="property-x-5"></a> `x?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `unknown`) | Key, index, or accessor function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:353 |
| <a id="property-x2domain"></a> `x2Domain?` | (`number` \| `Date`)[] | The x2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:359 |
| <a id="property-x2sort"></a> `x2Sort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Defines a custom sorting comparator function for discrete x2 axes. | core/types/src/utils/D3plusConfig.d.ts:363 |
| <a id="property-xconfig"></a> `xConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the x-axis. | core/types/src/utils/D3plusConfig.d.ts:355 |
| <a id="property-xdomain"></a> `xDomain?` | (`number` \| `Date`)[] | The x domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:357 |
| <a id="property-xsort"></a> `xSort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:361 |
| <a id="property-y-5"></a> `y?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `unknown`) | Key, index, or accessor function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:365 |
| <a id="property-y2domain"></a> `y2Domain?` | (`number` \| `Date`)[] | The y2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:371 |
| <a id="property-y2sort"></a> `y2Sort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Defines a custom sorting comparator function for discrete y2 axes. | core/types/src/utils/D3plusConfig.d.ts:375 |
| <a id="property-yconfig"></a> `yConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the y-axis. | core/types/src/utils/D3plusConfig.d.ts:367 |
| <a id="property-ydomain"></a> `yDomain?` | (`number` \| `Date`)[] | The y domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:369 |
| <a id="property-ysort"></a> `ySort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:373 |
| <a id="property-zoom"></a> `zoom?` | `boolean` | Set to false to disable zooming on Geomap and Network. | core/types/src/utils/D3plusConfig.d.ts:377 |
| <a id="property-zoomfactor"></a> `zoomFactor?` | `number` | Multiplier applied to programmatic zoom steps. | core/types/src/utils/D3plusConfig.d.ts:379 |
| <a id="property-zoommax"></a> `zoomMax?` | `number` | Maximum zoom scale factor. | core/types/src/utils/D3plusConfig.d.ts:381 |
| <a id="property-zoompan"></a> `zoomPan?` | `boolean` | Whether panning (drag) is enabled while zoomed. | core/types/src/utils/D3plusConfig.d.ts:383 |
| <a id="property-zoomscroll"></a> `zoomScroll?` | `boolean` | Whether scroll-wheel zooming is enabled. | core/types/src/utils/D3plusConfig.d.ts:385 |

***

<a id="datapoint"></a>

### DataPoint

Defined in: data/types/src/DataPoint.d.ts:5

DataPoint
Represents a single data point object used throughout d3plus visualizations.

#### Indexable

> \[`key`: `string`\]: `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)

***

<a id="formatlocaledefinition"></a>

### FormatLocaleDefinition

Defined in: locales/types/src/dictionaries/formatLocale.d.ts:5

**`Namespace`**

formatLocale
A set of default locale formatters used when assigning suffixes and currency in numbers.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-currency"></a> `currency` | \[`string`, `string`\] | locales/types/src/dictionaries/formatLocale.d.ts:13 |
| <a id="property-delimiters"></a> `delimiters` | `object` | locales/types/src/dictionaries/formatLocale.d.ts:9 |
| `delimiters.decimal` | `string` | locales/types/src/dictionaries/formatLocale.d.ts:11 |
| `delimiters.thousands` | `string` | locales/types/src/dictionaries/formatLocale.d.ts:10 |
| <a id="property-grouping"></a> `grouping` | `number`[] | locales/types/src/dictionaries/formatLocale.d.ts:8 |
| <a id="property-separator"></a> `separator?` | `string` | locales/types/src/dictionaries/formatLocale.d.ts:6 |
| <a id="property-suffixes"></a> `suffixes` | `string`[] | locales/types/src/dictionaries/formatLocale.d.ts:7 |

***

<a id="imageconfig-1"></a>

### ImageConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:165

Image-specific config (url + dimensions).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-6"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:166 |
| <a id="property-duration-5"></a> `duration?` | `number` | - | core/types/src/shapes/shapeConfig.d.ts:167 |
| <a id="property-height-2"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:168 |
| <a id="property-id-4"></a> `id?` | `AccessorFn` | - | core/types/src/shapes/shapeConfig.d.ts:169 |
| <a id="property-opacity-4"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:170 |
| <a id="property-pointerevents-4"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | core/types/src/shapes/shapeConfig.d.ts:171 |
| <a id="property-select-5"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:172 |
| <a id="property-url"></a> `url?` | `AccessorFn` | URL accessor returning the image src. | core/types/src/shapes/shapeConfig.d.ts:174 |
| <a id="property-width-2"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:175 |
| <a id="property-x-6"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:176 |
| <a id="property-y-6"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:177 |

***

<a id="legendconfig-4"></a>

### LegendConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:160

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-5"></a> `active?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `boolean`) | The active method for all shapes. | core/types/src/utils/D3plusConfig.d.ts:162 |
| <a id="property-hover-5"></a> `hover?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `boolean`) | The hover method for all shapes. | core/types/src/utils/D3plusConfig.d.ts:164 |
| <a id="property-shape"></a> `shape?` | `Accessor`\<`string`\> | The shape type used for each legend entry. | core/types/src/utils/D3plusConfig.d.ts:166 |

***

<a id="lineconfig-2"></a>

### LineConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:139

Line-specific config (curve + defined).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-6"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-4"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-4"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-4"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-4"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-curve-1"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:140 |
| <a id="property-data-7"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-defined-1"></a> `defined?` | `AccessorFn` | - | - | core/types/src/shapes/shapeConfig.d.ts:141 |
| <a id="property-discrete-5"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-6"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-4"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-4"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-hitarea-4"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-6"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-4"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-4"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-5"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-6"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-4"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-4"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-6"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-5"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-5"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode-4"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-4"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-4"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-4"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-4"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-6"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-6"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-4"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-4"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-4"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-4"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-4"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-4"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-4"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-4"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-4"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-4"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-4"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-4"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-x-7"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-y-7"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:124 |

***

<a id="margin"></a>

### Margin

Defined in: core/types/src/charts/viz/vizTypes.d.ts:31

Margin object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom"></a> `bottom` | `number` | core/types/src/charts/viz/vizTypes.d.ts:33 |
| <a id="property-left"></a> `left` | `number` | core/types/src/charts/viz/vizTypes.d.ts:34 |
| <a id="property-right"></a> `right` | `number` | core/types/src/charts/viz/vizTypes.d.ts:35 |
| <a id="property-top"></a> `top` | `number` | core/types/src/charts/viz/vizTypes.d.ts:32 |

***

<a id="mergeddatapoint"></a>

### MergedDataPoint

Defined in: data/types/src/merge.d.ts:4

#### Indexable

> \[`key`: `string`\]: `MergedValue`

***

<a id="padding"></a>

### Padding

Defined in: core/types/src/charts/viz/vizTypes.d.ts:38

Padding object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom-1"></a> `bottom` | `number` | core/types/src/charts/viz/vizTypes.d.ts:40 |
| <a id="property-left-1"></a> `left` | `number` | core/types/src/charts/viz/vizTypes.d.ts:41 |
| <a id="property-right-1"></a> `right` | `number` | core/types/src/charts/viz/vizTypes.d.ts:42 |
| <a id="property-top-1"></a> `top` | `number` | core/types/src/charts/viz/vizTypes.d.ts:39 |

***

<a id="pathconfig-1"></a>

### PathConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:154

Path-specific config (raw SVG path d string or generator).

#### Extends

- [`BaseShapeConfig`](#baseshapeconfig)

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active-7"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-5"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-5"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-5"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-5"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-d"></a> `d?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:155 |
| <a id="property-data-8"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-6"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-7"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-5"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-5"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-hitarea-5"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-7"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-5"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-5"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-6"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-7"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-5"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-5"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-7"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-6"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-6"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode-5"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-5"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-5"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-5"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-5"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-7"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-7"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-5"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-5"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-5"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-5"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-5"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-5"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-5"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-5"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-5"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-5"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-5"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-5"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-x-8"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-y-8"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:124 |

***

<a id="rectconfig-3"></a>

### RectConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:130

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
| <a id="property-active-8"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | [`BaseShapeConfig`](#baseshapeconfig).[`active`](#property-active-2) | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-6"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | [`BaseShapeConfig`](#baseshapeconfig).[`activeOpacity`](#property-activeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-6"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | [`BaseShapeConfig`](#baseshapeconfig).[`activeStyle`](#property-activestyle-2) | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-6"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`ariaLabel`](#property-arialabel-2) | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-6"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImage`](#property-backgroundimage-2) | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-data-9"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-7"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:56 |
| <a id="property-duration-8"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:58 |
| <a id="property-fill-6"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:60 |
| <a id="property-fillopacity-6"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:62 |
| <a id="property-height-3"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:132 |
| <a id="property-hitarea-6"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:70 |
| <a id="property-hover-8"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:64 |
| <a id="property-hoveropacity-6"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:66 |
| <a id="property-hoverstyle-6"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:68 |
| <a id="property-id-7"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:72 |
| <a id="property-label-8"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:74 |
| <a id="property-labelbounds-6"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:76 |
| <a id="property-labelconfig-6"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:78 |
| <a id="property-on-8"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:126 |
| <a id="property-opacity-7"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:80 |
| <a id="property-pointerevents-7"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:82 |
| <a id="property-rendermode-6"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:94 |
| <a id="property-role-6"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:84 |
| <a id="property-rotate-6"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:86 |
| <a id="property-rx-6"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:88 |
| <a id="property-ry-6"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:90 |
| <a id="property-scale-8"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:92 |
| <a id="property-select-8"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:96 |
| <a id="property-shaperendering-6"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:98 |
| <a id="property-sort-6"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:100 |
| <a id="property-stroke-6"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:102 |
| <a id="property-strokedasharray-6"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:104 |
| <a id="property-strokelinecap-6"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:106 |
| <a id="property-strokeopacity-6"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:108 |
| <a id="property-strokewidth-6"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:110 |
| <a id="property-textanchor-6"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:112 |
| <a id="property-texture-6"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:114 |
| <a id="property-texturedefault-6"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:116 |
| <a id="property-vectoreffect-6"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:118 |
| <a id="property-verticalalign-6"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:120 |
| <a id="property-width-3"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:131 |
| <a id="property-x-9"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:122 |
| <a id="property-y-9"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:124 |

***

<a id="textboxconfig-1"></a>

### TextBoxConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:73

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ellipsis"></a> `ellipsis?` | (`text`: `string`, `line`: `number`) => `string` | Handles truncated lines, returning the new line value. Passed the line's text and number; by default appends an ellipsis to every line except a first word that cannot fit (which returns ""). | core/types/src/utils/D3plusConfig.d.ts:111 |
| <a id="property-fontcolor"></a> `fontColor?` | `Accessor`\<`string`\> | The font color as an accessor function or static string. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:77 |
| <a id="property-fontfamily"></a> `fontFamily?` | `Accessor`\<`string` \| `string`[]\> | The font-family to use: a font name, a comma-separated list of fallbacks, an array of fallbacks, or an accessor returning a string or array. The first available font on the client is used. | core/types/src/utils/D3plusConfig.d.ts:85 |
| <a id="property-fontmax"></a> `fontMax?` | `number` | The maximum font size in pixels, used when dynamically resizing fonts. | core/types/src/utils/D3plusConfig.d.ts:91 |
| <a id="property-fontmin"></a> `fontMin?` | `number` | The minimum font size in pixels, used when dynamically resizing fonts. | core/types/src/utils/D3plusConfig.d.ts:89 |
| <a id="property-fontopacity"></a> `fontOpacity?` | `Accessor`\<`number`\> | The font opacity as an accessor function or static number between 0 and 1. | core/types/src/utils/D3plusConfig.d.ts:95 |
| <a id="property-fontresize"></a> `fontResize?` | `Accessor`\<`boolean`\> | Toggles font resizing — a static boolean, or an accessor returning a boolean. | core/types/src/utils/D3plusConfig.d.ts:93 |
| <a id="property-fontsize"></a> `fontSize?` | `Accessor`\<`number`\> | The font size in pixels. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:79 |
| <a id="property-fontstroke"></a> `fontStroke?` | `Accessor`\<`string`\> | The font stroke color for the rendered text. | core/types/src/utils/D3plusConfig.d.ts:97 |
| <a id="property-fontstrokewidth"></a> `fontStrokeWidth?` | `Accessor`\<`number`\> | The font stroke width for the rendered text. | core/types/src/utils/D3plusConfig.d.ts:99 |
| <a id="property-fontweight"></a> `fontWeight?` | `Accessor`\<`string` \| `number`\> | The font weight. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:87 |
| <a id="property-height-4"></a> `height?` | `Accessor`\<`number`\> | The height for each text box. | core/types/src/utils/D3plusConfig.d.ts:121 |
| <a id="property-lineheight"></a> `lineHeight?` | `Accessor`\<`number`\> | The line height, which is 1.2 times the font size by default. | core/types/src/utils/D3plusConfig.d.ts:101 |
| <a id="property-maxlines"></a> `maxLines?` | `Accessor`\<`number` \| `null`\> | Restricts the maximum number of lines to wrap onto; null (unlimited) by default. | core/types/src/utils/D3plusConfig.d.ts:103 |
| <a id="property-overflow"></a> `overflow?` | `Accessor`\<`boolean`\> | Whether text is allowed to overflow its bounding box. | core/types/src/utils/D3plusConfig.d.ts:105 |
| <a id="property-padding"></a> `padding?` | `Accessor`\<`string` \| `number`\> | The padding as a CSS shorthand string or number. Defaults to 0. | core/types/src/utils/D3plusConfig.d.ts:113 |
| <a id="property-rotateanchor"></a> `rotateAnchor?` | `Accessor`\<\[`number`, `number`\]\> | The anchor point around which to rotate the text box. | core/types/src/utils/D3plusConfig.d.ts:115 |
| <a id="property-split"></a> `split?` | (`text`: `string`) => `string`[] | The word split function: given a string, returns it split into an array of words. | core/types/src/utils/D3plusConfig.d.ts:117 |
| <a id="property-text"></a> `text?` | `Accessor`\<`string`\> | The text content for each box. | core/types/src/utils/D3plusConfig.d.ts:75 |
| <a id="property-width-4"></a> `width?` | `Accessor`\<`number`\> | The width for each text box. | core/types/src/utils/D3plusConfig.d.ts:119 |
| <a id="property-x-10"></a> `x?` | `Accessor`\<`number`\> | The x position (left edge) for each text box. | core/types/src/utils/D3plusConfig.d.ts:123 |
| <a id="property-y-10"></a> `y?` | `Accessor`\<`number`\> | The y position (top edge) for each text box. | core/types/src/utils/D3plusConfig.d.ts:125 |

***

<a id="timelineconfig-3"></a>

### TimelineConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:127

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-brushfilter"></a> `brushFilter?` | () => `boolean` | Brush event filter. | core/types/src/utils/D3plusConfig.d.ts:129 |
| <a id="property-brushmin"></a> `brushMin?` | `number` | The minimum number of ticks that can be highlighted when using "ticks" `buttonBehavior`. Helpful for x/y plots where selecting fewer than 2 time periods is undesirable. | core/types/src/utils/D3plusConfig.d.ts:135 |
| <a id="property-buttonalign"></a> `buttonAlign?` | `"start"` \| `"middle"` \| `"end"` | Toggles the horizontal alignment of the button timeline. | core/types/src/utils/D3plusConfig.d.ts:137 |
| <a id="property-buttonbehavior"></a> `buttonBehavior?` | `"auto"` \| `"buttons"` \| `"ticks"` | Toggles the style of the timeline. | core/types/src/utils/D3plusConfig.d.ts:139 |
| <a id="property-buttonheight"></a> `buttonHeight?` | `number` | Button height. | core/types/src/utils/D3plusConfig.d.ts:141 |
| <a id="property-buttonpadding"></a> `buttonPadding?` | `number` | Button padding. | core/types/src/utils/D3plusConfig.d.ts:143 |
| <a id="property-handleconfig"></a> `handleConfig?` | `Record`\<`string`, `unknown`\> | Handle style. | core/types/src/utils/D3plusConfig.d.ts:145 |
| <a id="property-handlesize"></a> `handleSize?` | `number` | Handle size. | core/types/src/utils/D3plusConfig.d.ts:147 |
| <a id="property-playbutton"></a> `playButton?` | `boolean` | Determines the visibility of the play button to the left of the timeline, which cycles through the available periods at a rate set by `playButtonInterval`. | core/types/src/utils/D3plusConfig.d.ts:152 |
| <a id="property-playbuttoninterval"></a> `playButtonInterval?` | `number` | The interval, in milliseconds, used when cycling through periods via the play button. | core/types/src/utils/D3plusConfig.d.ts:154 |
| <a id="property-selection"></a> `selection?` | `number` \| `false` \| `Date` \| (`number` \| `Date`)[] | The current selection. Defaults to the most recent period in the timeline. | core/types/src/utils/D3plusConfig.d.ts:156 |
| <a id="property-snapping"></a> `snapping?` | `boolean` | Toggles the snapping value. | core/types/src/utils/D3plusConfig.d.ts:158 |

***

<a id="timelocaledefinition"></a>

### TimeLocaleDefinition

Defined in: locales/types/src/dictionaries/timeLocale.d.ts:1

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-date"></a> `date` | `string` | locales/types/src/dictionaries/timeLocale.d.ts:3 |
| <a id="property-datetime"></a> `dateTime` | `string` | locales/types/src/dictionaries/timeLocale.d.ts:2 |
| <a id="property-days"></a> `days` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\] | locales/types/src/dictionaries/timeLocale.d.ts:7 |
| <a id="property-months"></a> `months` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | locales/types/src/dictionaries/timeLocale.d.ts:9 |
| <a id="property-periods"></a> `periods` | \[`string`, `string`\] | locales/types/src/dictionaries/timeLocale.d.ts:6 |
| <a id="property-quarter"></a> `quarter` | `string` | locales/types/src/dictionaries/timeLocale.d.ts:5 |
| <a id="property-shortdays"></a> `shortDays` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\] | locales/types/src/dictionaries/timeLocale.d.ts:8 |
| <a id="property-shortmonths"></a> `shortMonths` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | locales/types/src/dictionaries/timeLocale.d.ts:23 |
| <a id="property-time-1"></a> `time` | `string` | locales/types/src/dictionaries/timeLocale.d.ts:4 |

***

<a id="titlecaserules"></a>

### TitleCaseRules

Defined in: locales/types/src/dictionaries/titleCaseLocale.d.ts:1

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-acronyms"></a> `acronyms?` | `string`[] | Acronyms / initialisms emitted in the given canonical casing (matched case-insensitively, so "ceo" and "CEO" both become "CEO"). Mixed-case forms ("iOS", "GmbH", "PhD") are preserved as written. Plurals ("TVs") are derived automatically — so forms whose plural collides with a real word (e.g. "IDE" → "ides") are intentionally omitted. | locales/types/src/dictionaries/titleCaseLocale.d.ts:23 |
| <a id="property-lowercase"></a> `lowercase?` | `string`[] | Short function words (articles, conjunctions, prepositions, contractions) kept lowercase in the MIDDLE of a title. Matched case-insensitively and against the punctuation-stripped token, so "v" also covers "v." and "vs" covers "vs.". | locales/types/src/dictionaries/titleCaseLocale.d.ts:15 |
| <a id="property-style"></a> `style` | `"title"` \| `"sentence"` | "title" capitalizes each significant word, lowercasing the minor words in the middle (the English convention). "sentence" capitalizes only the first word. Acronyms are forced uppercase under both styles; the `lowercase` list is consulted only for "title". | locales/types/src/dictionaries/titleCaseLocale.d.ts:8 |

***

<a id="tooltipconfig-3"></a>

### TooltipConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:45

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-arrow"></a> `arrow?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The inner HTML content of the arrow element, empty by default. | core/types/src/utils/D3plusConfig.d.ts:47 |
| <a id="property-background"></a> `background?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The background color accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:49 |
| <a id="property-body"></a> `body?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | - | core/types/src/utils/D3plusConfig.d.ts:65 |
| <a id="property-border"></a> `border?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The border accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:51 |
| <a id="property-borderradius"></a> `borderRadius?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The border-radius accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:53 |
| <a id="property-footer"></a> `footer?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The footer content accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:55 |
| <a id="property-maxwidth"></a> `maxWidth?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The max-width accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:57 |
| <a id="property-minwidth"></a> `minWidth?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The min-width accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:59 |
| <a id="property-offset"></a> `offset?` | `number` \| ((`d`: [`DataPoint`](#datapoint)) => `number`) | The pixel offset between the tooltip and its anchor point. | core/types/src/utils/D3plusConfig.d.ts:61 |
| <a id="property-padding-1"></a> `padding?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The inner padding of each tooltip. | core/types/src/utils/D3plusConfig.d.ts:63 |
| <a id="property-tbody"></a> `tbody?` | ((`d`: [`DataPoint`](#datapoint)) => \[`string`, `string`\][]) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`, `x?`: `object`) => `string`))[][] | - | core/types/src/utils/D3plusConfig.d.ts:69 |
| <a id="property-thead"></a> `thead?` | ((`d`: [`DataPoint`](#datapoint)) => \[`string`, `string`\][]) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`, `x?`: `object`) => `string`))[][] | - | core/types/src/utils/D3plusConfig.d.ts:66 |
| <a id="property-title-2"></a> `title?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | - | core/types/src/utils/D3plusConfig.d.ts:64 |

***

<a id="translationstrings"></a>

### TranslationStrings

Defined in: locales/types/src/dictionaries/translateLocale.d.ts:1

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-and"></a> `and` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:2 |
| <a id="property-back"></a> `Back` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:3 |
| <a id="property-click-to-expand"></a> `Click to Expand` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:4 |
| <a id="property-click-to-hide"></a> `Click to Hide` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:5 |
| <a id="property-click-to-highlight"></a> `Click to Highlight` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:6 |
| <a id="property-click-to-show"></a> `Click to Show` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:7 |
| <a id="property-click-to-show-all"></a> `Click to Show All` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:8 |
| <a id="property-download"></a> `Download` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:9 |
| <a id="property-loading-visualization"></a> `Loading Visualization` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:10 |
| <a id="property-more"></a> `more` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:11 |
| <a id="property-no-data-available"></a> `No Data Available` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:12 |
| <a id="property-powered-by-d3plus"></a> `Powered by D3plus` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:13 |
| <a id="property-share"></a> `Share` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:14 |
| <a id="property-shiftclick-to-hide"></a> `Shift+Click to Hide` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:15 |
| <a id="property-shiftclick-to-highlight"></a> `Shift+Click to Highlight` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:16 |
| <a id="property-total"></a> `Total` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:17 |
| <a id="property-values"></a> `Values` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:18 |

***

<a id="whiskerconfig-2"></a>

### WhiskerConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:199

Whisker-specific config.

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-10"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:200 |
| <a id="property-endpoint"></a> `endpoint?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | End-cap shape name (e.g. "Rect"). | core/types/src/shapes/shapeConfig.d.ts:202 |
| <a id="property-endpointconfig"></a> `endpointConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:203 |
| <a id="property-length"></a> `length?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Whisker length in pixels. | core/types/src/shapes/shapeConfig.d.ts:205 |
| <a id="property-lineconfig"></a> `lineConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:206 |
| <a id="property-orient-1"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | core/types/src/shapes/shapeConfig.d.ts:207 |
| <a id="property-select-9"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:208 |
| <a id="property-x-11"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:209 |
| <a id="property-y-11"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:210 |

## Type Aliases

<a id="anyshapeconfig"></a>

### AnyShapeConfig

> **AnyShapeConfig** = [`BaseShapeConfig`](#baseshapeconfig) \| [`RectConfig`](#rectconfig-3) \| [`CircleConfig`](#circleconfig-1) \| [`LineConfig`](#lineconfig-2) \| [`AreaConfig`](#areaconfig-1) \| [`PathConfig`](#pathconfig-1) \| [`BarConfig`](#barconfig-7) \| [`ImageConfig`](#imageconfig-1) \| [`BoxConfig`](#boxconfig-1) \| [`WhiskerConfig`](#whiskerconfig-2)

Defined in: core/types/src/shapes/shapeConfig.d.ts:218

Union of every shape config — useful for code that composes
transient configs at runtime without knowing the shape ahead of
time (Plot's `shapeConfig`, axis decorators, etc.).

***

<a id="checkstate"></a>

### CheckState

> **CheckState** = `"pass"` \| `"warn"` \| `"fail"`

Defined in: color/types/src/validate.d.ts:2

The state of a single check. `warn` passes but obligates secondary encoding.

***

<a id="constoraccessor"></a>

### ConstOrAccessor

> **ConstOrAccessor**\<`T`\> = `T` \| `AccessorFn`

Defined in: core/types/src/shapes/shapeConfig.d.ts:32

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:51

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:53

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:58

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="node"></a>

##### node()

> **node**(): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:52

###### Returns

`any`

<a id="on-22"></a>

##### on()

> **on**(`event`: `string`, `handler`: `any`): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:57

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:56

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `any` |

###### Returns

`any`

<a id="selectall"></a>

##### selectAll()

> **selectAll**(`selector`: `string`): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:55

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

###### Returns

`any`

<a id="style"></a>

##### style()

> **style**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:54

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:59

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

Defined in: core/types/src/shapes/shapeConfig.d.ts:37

A value that can be a function, a string key (wrapped in `accessor`),
or a literal (wrapped in `constant`). Mirrors the "accessor" coerce.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
