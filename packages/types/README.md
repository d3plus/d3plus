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
| [`AxisBottom`](#axisbottom) | Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functional |
| [`AxisLeft`](#axisleft) | Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all fun |
| [`AxisRight`](#axisright) | Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all fu |
| [`AxisTop`](#axistop) | Shorthand method for creating an axis where the ticks are drawn above the horizontal domain path. Extends all functional |
| [`Bar`](#bar) | Creates SVG bars based on an array of data. |
| [`BaseClass`](#baseclass) | Provides shared configuration, event handling, and locale management inherited by all d3plus classes. |
| [`Box`](#box) | Creates SVG box based on an array of data. |
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
| [`Whisker`](#whisker) | Creates SVG whisker based on an array of data. |

| Functions | Description |
| --- | --- |
| [`accessor`](#accessor) | Wraps an object key in a simple accessor function. |
| [`addToQueue`](#addtoqueue) | Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualiz |
| [`applyConfig`](#applyconfig) | Merges the supplied config objects over a fresh `{select: node}` target, |
| [`assign`](#assign) | A deeply recursive version of `Object.assign`. |
| [`attrize`](#attrize) | Applies each key/value in an object as an attr. |
| [`backgroundColor`](#backgroundcolor) | Given a DOM element, returns its background color by walking up the |
| [`ckmeans`](#ckmeans) | Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, |
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
| [`configWarnings`](#configwarnings) | Toggles the console warnings d3plus logs when a class receives a config |
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
| [`getSize`](#getsize) | Finds the available width and height for a specified HTMLElement, traversing it's parents until it finds something with  |
| [`hash`](#hash) | Stable hash that serializes functions by their source, so function-valued |
| [`inViewport`](#inviewport) | Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer. |
| [`isData`](#isdata) | Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid d |
| [`isObject`](#isobject) | Detects if a variable is a javascript Object. |
| [`largestRect`](#largestrect) | Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspe |
| [`linearConfidence`](#linearconfidence) | Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/S |
| [`linearPrediction`](#linearprediction) | Builds the prediction band for a new observation under a simple linear regression of `points`: `ŷ ± t·s·√(1 + 1/n + (x − |
| [`lineIntersection`](#lineintersection) | Finds the intersection point (if there is one) of the lines p1q1 and p2q2. |
| [`load`](#load) | Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function. |
| [`merge`](#merge) | Combines an Array of Objects together and returns a new Object. |
| [`negativeSpace`](#negativespace) | Finds the open, axis-aligned rectangles inside `bounds` that lie entirely |
| [`nest`](#nest) | Groups a flat array of data by one or more key accessors into nested {key, values} entries, one level per accessor. A ro |
| [`nestGroups`](#nestgroups) | Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy. |
| [`onFontsLoaded`](#onfontsloaded) | Registers a callback to run whenever the browser finishes loading a web font that d3plus has already measured text with  |
| [`parseSides`](#parsesides) | Converts a string of directional CSS shorthand values into an object with the values expanded. |
| [`path2polygon`](#path2polygon) | Transforms a path string into an Array of points, with no DOM involved. |
| [`pathBounds`](#pathbounds) | Computes the exact bounding box of an SVG path string with no DOM involved, |
| [`pointDistance`](#pointdistance) | Calculates the pixel distance between two points. |
| [`pointDistanceSquared`](#pointdistancesquared) | Returns the squared euclidean distance between two points. |
| [`pointRotate`](#pointrotate) | Rotates a point around a given origin. |
| [`polygonInside`](#polygoninside) | Checks if one polygon is inside another polygon. |
| [`polygonRayCast`](#polygonraycast) | Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on |
| [`polygonRotate`](#polygonrotate) | Rotates a polygon around a given origin. |
| [`regression`](#regression) | Fits a regression model to a set of `[x, y]` points. Points with non-finite values, or that fall outside a model's domai |
| [`rtl`](#rtl) | Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "r |
| [`saveElement`](#saveelement) | Downloads an HTML Element as a bitmap PNG image. |
| [`segmentBoxContains`](#segmentboxcontains) | Checks whether a point is inside the bounding box of a line segment. |
| [`segmentsIntersect`](#segmentsintersect) | Checks whether the line segments p1q1 && p2q2 intersect. |
| [`shapeEdgePoint`](#shapeedgepoint) | Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel dis |
| [`simplify`](#simplify) | Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplificatio |
| [`strip`](#strip) | Removes all non ASCII characters from a string. |
| [`studentTCdf`](#studenttcdf) | The cumulative distribution function of Student's t-distribution. |
| [`studentTQuantile`](#studenttquantile) | The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportio |
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
| [`locale`](#locale) | d3-time-format locale definitions (date and time patterns, period, day, and month names) keyed by locale code, used when |
| [`RESET`](#reset) | String constant used to reset an individual config property. |
| [`titleCaseLocale`](#titlecaselocale) | Per-language rules used by `titleCase`, keyed by two-letter language code plus a `default` fallback: the minor words kep |
| [`translateLocale`](#translatelocale) | Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, to |

| Interfaces | Description |
| --- | --- |
| [`AreaConfig`](#areaconfig) | Area-specific config (curve, defined, dual-edge x/y). |
| [`AxisConfig`](#axisconfig) |  |
| [`BarConfig`](#barconfig) | Bar-specific config (Rect + start/end coords). |
| [`BaseShapeConfig`](#baseshapeconfig) | Common props inherited from `Shape` — every shape subclass accepts |
| [`Bounds`](#bounds) | An axis-aligned box: top-left corner plus size. |
| [`BoxConfig`](#boxconfig) | Box-specific config (whisker + median + outliers; subset of Shape). |
| [`CircleConfig`](#circleconfig) | Circle-specific config (radius). |
| [`ColorCheck`](#colorcheck) | One computed check in a palette validation report. |
| [`ColorDefaults`](#colordefaults) |  |
| [`ColorRampOptions`](#colorrampoptions) | Options for colorRamp. |
| [`ColorScaleConfig`](#colorscaleconfig) |  |
| [`ColorValidateOptions`](#colorvalidateoptions) | Options for colorValidate. |
| [`ColorValidation`](#colorvalidation) | The result of validating a palette. `ok` is true when no check hard-fails. |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`D3plusInstance`](#d3plusinstance) | A minimal structural interface for the d3plus class instances that the |
| [`DataPoint`](#datapoint) | DataPoint |
| [`FormatLocaleDefinition`](#formatlocaledefinition) | formatLocale |
| [`ImageConfig`](#imageconfig) | Image-specific config (url + dimensions). |
| [`LegendConfig`](#legendconfig) |  |
| [`LineConfig`](#lineconfig) | Line-specific config (curve + defined). |
| [`Margin`](#margin) | Margin object with all four sides. |
| [`MergedDataPoint`](#mergeddatapoint) |  |
| [`NegativeSpaceOptions`](#negativespaceoptions) | Options for `negativeSpace`: padding, minimum box size, grid resolution, and extra boxes to avoid. |
| [`Padding`](#padding) | Padding object with all four sides. |
| [`PathConfig`](#pathconfig) | Path-specific config (raw SVG path d string or generator). |
| [`RectConfig`](#rectconfig) | Rect-specific config (width + height on top of base). |
| [`RegressionOptions`](#regressionoptions) |  |
| [`RegressionResult`](#regressionresult) |  |
| [`SizeLegendConfig`](#sizelegendconfig) |  |
| [`TextBoxConfig`](#textboxconfig) |  |
| [`TimelineConfig`](#timelineconfig) |  |
| [`TimeLocaleDefinition`](#timelocaledefinition) |  |
| [`TitleCaseRules`](#titlecaserules) |  |
| [`TooltipConfig`](#tooltipconfig) |  |
| [`TranslationStrings`](#translationstrings) |  |
| [`TrendLineConfig`](#trendlineconfig) |  |
| [`WhiskerConfig`](#whiskerconfig) | Whisker-specific config. |

| Type Aliases | Description |
| --- | --- |
| [`AnyShapeConfig`](#anyshapeconfig) | Union of every shape config — useful for code that composes |
| [`CheckState`](#checkstate) | The state of a single check. `warn` passes but obligates secondary encoding. |
| [`ColorDefaultsConfig`](#colordefaultsconfig) | `colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors. |
| [`ConstOrAccessor`](#constoraccessor) | A value that can either be a function (called per-datum) or a literal |
| [`D3plusConstructor`](#d3plusconstructor) | Constructor type for d3plus visualization, component, and shape classes. |
| [`D3Selection`](#d3selection) | D3-style selection — deliberately loose. d3-selection's element/datum |
| [`RegressionType`](#regressiontype) |  |
| [`StringOrAccessor`](#stringoraccessor) | A value that can be a function, a string key (wrapped in `accessor`), |

## Classes

<a id="area"></a>

### Area

Defined in: core/types/src/shapes/Area.d.ts:8

Creates SVG areas based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

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

#### Methods

<a id="barconfig"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/Axis/Axis.d.ts:85

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

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

Defined in: core/types/src/components/Axis/Axis.d.ts:80

Produces a backend-agnostic scene graph for this axis with no DOM dependency:
gridlines + domain bar emitted natively, tick marks/labels composed from the
tick Shape's toScene(), and the title from the title TextBox's toScene().

###### Returns

`GroupNode`

<a id="translate-1"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-1"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-1"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="axisbottom"></a>

### AxisBottom

Defined in: core/types/src/components/Axis/AxisBottom.d.ts:5

Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-1"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/Axis/Axis.d.ts:85

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

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

Defined in: core/types/src/components/Axis/Axis.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-2"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-2"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="axisleft"></a>

### AxisLeft

Defined in: core/types/src/components/Axis/AxisLeft.d.ts:5

Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-2"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/Axis/Axis.d.ts:85

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

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

Defined in: core/types/src/components/Axis/Axis.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-3"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-3"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="axisright"></a>

### AxisRight

Defined in: core/types/src/components/Axis/AxisRight.d.ts:5

Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-3"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/Axis/Axis.d.ts:85

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

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

Defined in: core/types/src/components/Axis/Axis.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-4"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-4"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="axistop"></a>

### AxisTop

Defined in: core/types/src/components/Axis/AxisTop.d.ts:5

Shorthand method for creating an axis where the ticks are drawn above the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-4"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/Axis/Axis.d.ts:85

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

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

Defined in: core/types/src/components/Axis/Axis.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-5"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-5"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="bar"></a>

### Bar

Defined in: core/types/src/shapes/Bar.d.ts:9

Creates SVG bars based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-1"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-6"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-6"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="baseclass"></a>

### BaseClass

Defined in: core/types/src/utils/BaseClass.d.ts:6

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-7"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-7"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="box"></a>

### Box

Defined in: core/types/src/shapes/Box.d.ts:12

Creates SVG box based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

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

<a id="colordefaults-8"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-8"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-8"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="circle"></a>

### Circle

Defined in: core/types/src/shapes/Circle.d.ts:8

Creates SVG circles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-3"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-9"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-9"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="colorscale"></a>

### ColorScale

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:13

Creates an SVG color scale based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="axisconfig-1"></a>

##### axisConfig()

###### Call Signature

> **axisConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:57

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **axisConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:58

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

A pass-through for the TextBox class used to style the labelMin and labelMax text.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:68

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

Configuration passed to the Legend that draws the scale when its values are rendered as discrete swatches instead of a continuous bar (for example a categorical or buckets scale), acting as a pass-through to that Legend's config method.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **legendConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:83

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

The ColorScale is constructed by combining an Axis for the ticks/labels and a Rect for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the Axis class used to display the text (axisConfig) and the Rect class used to draw the color breaks (rectConfig). This method acts as a pass-through to the config method of the Rect.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **rectConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/ColorScale/ColorScale.d.ts:94

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-10"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-10"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

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

Defined in: core/types/src/shapes/Image.d.ts:55

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Image.d.ts:56

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

Defined in: core/types/src/shapes/Image.d.ts:51

Compute-mode scene emission. Mirrors Shape.toScene's shape — a
keyed GroupNode wrapping per-datum ImageNodes. Used by chart
compositors (e.g. plotPaint) that need Image to participate in the
scene graph rather than emit d3-selection DOM.

###### Returns

`GroupNode`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-schema-11"></a> `schema` | `Record`\<`string`, `any`\> | core/types/src/shapes/Image.d.ts:19 |

***

<a id="legend"></a>

### Legend

Defined in: core/types/src/components/Legend/Legend.d.ts:10

Creates an SVG legend based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

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

<a id="colordefaults-11"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-11"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-12"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="line"></a>

### Line

Defined in: core/types/src/shapes/Line.d.ts:7

Creates SVG lines based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-5"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Line.d.ts:36

Narrowed `.config()` for Line. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`LineConfig`](#lineconfig-3)

###### Overrides

[`Shape`](#shape-1).[`config`](#config-17)

###### Call Signature

> **config**(`_`: `Partial`\<[`LineConfig`](#lineconfig-3)\>): `this`

Defined in: core/types/src/shapes/Line.d.ts:37

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

> **data**(): [`DataPoint`](#datapoint)[]

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-12"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-13"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="path"></a>

### Path

Defined in: core/types/src/shapes/Path.d.ts:7

Creates SVG Paths based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-6"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-13"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-14"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="plot"></a>

### Plot

Defined in: core/types/src/charts/Plot/index.d.ts:16

Creates an x/y plot based on an array of data.

#### Extends

- [`Viz`](#viz)

#### Methods

<a id="active-7"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:16

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:20

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

Defined in: core/types/src/charts/Plot/index.d.ts:119

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:24

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:28

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

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:32

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

Defined in: core/types/src/charts/Plot/index.d.ts:123

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:40

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

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`backConfig`](#backconfig-1)

<a id="backcontrolclassname"></a>

##### backControlClassName()

> **backControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:44

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

> **backControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:48

An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`backControlStyle`](#backcontrolstyle-1)

<a id="backgroundconfig"></a>

##### backgroundConfig()

> **backgroundConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:127

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

Defined in: core/types/src/charts/Plot/index.d.ts:131

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:52

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

[`Viz`](#viz).[`color`](#color-1)

<a id="colordefaults-14"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:56

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:60

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:72

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:64

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:68

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

Defined in: core/types/src/charts/Plot/index.d.ts:144

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

Defined in: core/types/src/charts/Plot/index.d.ts:148

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`config`](#config-22)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

> **crosshairConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:170

Paint for the shared tooltip's crosshair guide line (`stroke`,
`strokeWidth`, `strokeDasharray`, `strokeOpacity`, …). Merged into the
current config.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="data-14"></a>

##### data()

> **data**(`_?`: `string` \| [`DataPoint`](#datapoint)[] \| \{ `headers`: `Record`\<`string`, `string`\>; `url`: `string`; \}, `f?`: (`data`: [`DataPoint`](#datapoint)[]) => `Record`\<`string`, `unknown`\> \| [`DataPoint`](#datapoint)[]): [`Plot`](#plot) \| [`DataPoint`](#datapoint)[]

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:85

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

Defined in: core/types/src/charts/viz/Viz.d.ts:165

Tears down the visualization: disconnects the ResizeObserver, stops listening for web font loads, and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

###### Inherited from

[`Viz`](#viz).[`destroy`](#destroy-1)

<a id="detectresize"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:92

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:96

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:100

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:104

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:108

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

Defined in: core/types/src/charts/Plot/index.d.ts:152

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:112

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:116

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

Defined in: core/types/src/charts/Plot/index.d.ts:156

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:120

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:124

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:136

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:128

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:142

Accessor function, or a constant string applied to every data point's
label (unlike `value`/`nodeId`/etc., a string here is not treated as a
per-datum object key — pass a function for that).

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

Defined in: core/types/src/charts/Plot/index.d.ts:160

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

Defined in: core/types/src/charts/Plot/index.d.ts:164

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:146

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:150

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

> **legendFilterInvert**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:154

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:158

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

> **legendInsetConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:162

Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`legendInsetConfig`](#legendinsetconfig-1)

<a id="legendpadding"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:166

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:170

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:174

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

Defined in: core/types/src/charts/Plot/index.d.ts:193

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

Defined in: core/types/src/charts/Plot/index.d.ts:197

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:19

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:23

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:27

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:31

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`messageStyle`](#messagestyle-1)

<a id="minimapclassname"></a>

##### minimapClassName()

> **minimapClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:35

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

> **minimapLabelStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:39

An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`minimapLabelStyle`](#minimaplabelstyle-1)

<a id="minimapstyle"></a>

##### minimapStyle()

> **minimapStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:43

An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`minimapStyle`](#minimapstyle-1)

<a id="minimapviewportstyle"></a>

##### minimapViewportStyle()

> **minimapViewportStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:47

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`minimapViewportStyle`](#minimapviewportstyle-1)

<a id="minimapviewportstyleactive"></a>

##### minimapViewportStyleActive()

> **minimapViewportStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:51

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`minimapViewportStyleActive`](#minimapviewportstyleactive-1)

<a id="nodatahtml"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:55

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Viz`](#viz).[`parent`](#parent-21)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/charts/viz/Viz.d.ts:66

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

Defined in: core/types/src/charts/viz/Viz.d.ts:87

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Inherited from

[`Viz`](#viz).[`renderer`](#renderer-1)

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:88

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

Defined in: core/types/src/charts/viz/Viz.d.ts:95

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

Defined in: core/types/src/charts/viz/Viz.d.ts:96

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

Defined in: core/types/src/charts/viz/Viz.d.ts:104

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:63

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

> **searchAccessor**(`_?`: (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`): [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:76

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
| `_?` | (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` |

###### Returns

[`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

[`Viz`](#viz).[`searchAccessor`](#searchaccessor-1)

<a id="searchcontrolclassname"></a>

##### searchControlClassName()

> **searchControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:80

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

> **searchControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:84

An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`searchControlStyle`](#searchcontrolstyle-1)

<a id="searchcontrolstyleactive"></a>

##### searchControlStyleActive()

> **searchControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:88

An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`searchControlStyleActive`](#searchcontrolstyleactive-1)

<a id="searchcontrolstylehover"></a>

##### searchControlStyleHover()

> **searchControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:92

An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`searchControlStyleHover`](#searchcontrolstylehover-1)

<a id="select-14"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Plot`](#plot) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:96

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

> **shape**(`_?`: `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)): `string` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:100

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:104

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Viz`](#viz).[`shapeConfig`](#shapeconfig-22)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/charts/viz/VizBase.d.ts:105

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

Defined in: core/types/src/charts/Plot/index.d.ts:201

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:109

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

> **sizeLegendConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:113

Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`sizeLegendConfig`](#sizelegendconfig-2)

<a id="sizelegendposition"></a>

##### sizeLegendPosition()

> **sizeLegendPosition**(`_?`: `"right"` \| `"bottom"`): [`Plot`](#plot) \| `"right"` \| `"bottom"`

Defined in: core/types/src/charts/viz/VizBase.d.ts:117

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

Defined in: core/types/src/charts/Plot/index.d.ts:209

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

Defined in: core/types/src/charts/Plot/index.d.ts:224

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

> **subtitle**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:121

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:125

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

> **subtitlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:129

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:234

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:238

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

> **tableViewControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:242

An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyle`](#tableviewcontrolstyle-1)

<a id="tableviewcontrolstyleactive"></a>

##### tableViewControlStyleActive()

> **tableViewControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:246

An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyleActive`](#tableviewcontrolstyleactive-1)

<a id="tableviewcontrolstylehover"></a>

##### tableViewControlStyleHover()

> **tableViewControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:250

An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`tableViewControlStyleHover`](#tableviewcontrolstylehover-1)

<a id="tableviewpagesize"></a>

##### tableViewPageSize()

> **tableViewPageSize**(`_?`: `number` \| `false`): `number` \| `false` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:254

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

> **threshold**(`_?`: `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)): `number` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:133

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:138

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:142

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:146

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:150

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:154

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:158

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

> **title**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Plot`](#plot) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:162

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:166

Configuration object for the title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`titleConfig`](#titleconfig-9)

<a id="titlepadding"></a>

##### titlePadding()

> **titlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:170

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

Defined in: core/types/src/charts/viz/Viz.d.ts:81

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

> **tooltip**(`_?`: `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:174

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:178

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

Defined in: core/types/src/charts/Plot/index.d.ts:34

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

Defined in: core/types/src/charts/viz/Viz.d.ts:74

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

> **total**(`_?`: `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `string` \| `boolean` \| [`Plot`](#plot) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:182

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:186

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:190

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:194

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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

Defined in: core/types/src/charts/Plot/index.d.ts:174

Draws an automatic trend line fit to the plotted data: `true` (or `"linear"`) for a least-squares line, or one of `"exponential"`, `"logarithmic"`, `"power"`, or `"polynomial"`. By default each series gets its own line in its color; see `trendLineConfig` for grouping, a confidence band, and styling. On a chart with a discrete axis, the line runs along that axis, fitting categories by their order. Set to `false` (the default) to remove.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `TrendLineType` |

###### Returns

[`Plot`](#plot) \| `TrendLineType`

<a id="trendlineconfig"></a>

##### trendLineConfig()

> **trendLineConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/Plot/index.d.ts:189

Options for the trend lines drawn by `trendLine`, merged into the current config:
- `group`: `"series"` (default) fits one line per series, colored to match it; `"all"` fits a single line to every point.
- `order`: the polynomial degree when `trendLine` is `"polynomial"` (default `2`).
- `confidence`: draws a confidence band around a linear fit (default `false`).
- `confidenceLevel`: the band's confidence level (default `0.95`).
- `confidenceConfig`: Area shape config for the band (default `{fillOpacity: 0.15}`; fill defaults to the line color).
- `projection`: extends each line past the end of its data, by a number of steps at the data's own spacing (e.g. `5` more years), or to an end value with `{to: 2030}` (default `0`, off). The axis widens to fit, and a linear fit's band becomes a prediction interval that fans out over the projection. Hovering a projected step lists each series' projected value. Ignored on a category axis.
- `projectionConfig`: Line shape config for the projected stretch, over the line's own styles (default `{strokeDasharray: "2 4"}`).
- `tooltip`: shows the fitted equation and R² when hovering a line (default `true`).
- Any other key (`stroke`, `strokeWidth`, `strokeDasharray`, …) styles the Line shape.

Stacked charts always fit one line to the stack totals.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

<a id="x-1"></a>

##### x()

> **x**(`_?`: `PlotAccessorArg`): [`Plot`](#plot) \| `PlotAccessor`

Defined in: core/types/src/charts/Plot/index.d.ts:228

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

Defined in: core/types/src/charts/Plot/index.d.ts:232

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

Defined in: core/types/src/charts/Plot/index.d.ts:240

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

Defined in: core/types/src/charts/Plot/index.d.ts:236

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

Defined in: core/types/src/charts/Plot/index.d.ts:244

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

Defined in: core/types/src/charts/Plot/index.d.ts:248

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

Defined in: core/types/src/charts/Plot/index.d.ts:258

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

Defined in: core/types/src/charts/Plot/index.d.ts:254

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:198

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:202

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:206

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

###### Inherited from

[`Viz`](#viz).[`zoomBrushSelectionStyle`](#zoombrushselectionstyle-1)

<a id="zoomcontrolclassname"></a>

##### zoomControlClassName()

> **zoomControlClassName**(`_?`: `string`): `string` \| [`Plot`](#plot)

Defined in: core/types/src/charts/viz/VizBase.d.ts:210

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:214

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

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Plot`](#plot) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:218

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:222

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:226

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:230

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
| <a id="property-ctx-14"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Viz`](#viz).[`ctx`](#property-ctx-21) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-15"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Viz`](#viz).[`schema`](#property-schema-22) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="rect"></a>

### Rect

Defined in: core/types/src/shapes/Rect.d.ts:8

Creates SVG rectangles based on an array of data.

#### Extends

- [`Shape`](#shape-1)

#### Methods

<a id="active-8"></a>

##### active()

###### Call Signature

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`active`](#active-9)

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`activeStyle`](#activestyle-6)

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Inherited from

[`Shape`](#shape-1).[`data`](#data-16)

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`hover`](#hover-9)

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`hoverStyle`](#hoverstyle-6)

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`labelConfig`](#labelconfig-7)

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Shape`](#shape-1).[`parent`](#parent-16)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Inherited from

[`Shape`](#shape-1).[`select`](#select-16)

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Shape`](#shape-1).[`shapeConfig`](#shapeconfig-17)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Inherited from

[`Shape`](#shape-1).[`sort`](#sort-6)

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Shape`](#shape-1).[`textureDefault`](#texturedefault-6)

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-15"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Shape`](#shape-1).[`ctx`](#property-ctx-16) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-16"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Shape`](#shape-1).[`schema`](#property-schema-17) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="shape-1"></a>

### Shape

Defined in: core/types/src/shapes/Shape.d.ts:27

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

> **active**(): ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

Defined in: core/types/src/shapes/Shape.d.ts:116

The active callback function for highlighting shapes.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **active**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:117

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

Defined in: core/types/src/shapes/Shape.d.ts:121

The style to apply to active shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **activeStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:122

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/shapes/Shape.d.ts:163

Narrowed `.config()` for Shape. Inherited surface from
`BaseClass.config()`; the override exists only to surface per-shape
keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.

###### Returns

[`BaseShapeConfig`](#baseshapeconfig)

###### Overrides

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: `Partial`\<[`BaseShapeConfig`](#baseshapeconfig)\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:164

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

Defined in: core/types/src/shapes/Shape.d.ts:126

The data array used to create shapes. A shape will be drawn for each object in the array.

###### Returns

[`DataPoint`](#datapoint)[]

###### Call Signature

> **data**(`_`: [`DataPoint`](#datapoint)[]): `this`

Defined in: core/types/src/shapes/Shape.d.ts:127

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

Defined in: core/types/src/shapes/Shape.d.ts:131

The hover callback function for highlighting shapes on mouseover.

###### Returns

((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`

###### Call Signature

> **hover**(`_`: ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:132

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

Defined in: core/types/src/shapes/Shape.d.ts:136

The style to apply to hovered shapes.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **hoverStyle**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:137

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

Defined in: core/types/src/shapes/Shape.d.ts:141

A pass-through to the config method of the TextBox class used to create a shape's labels.

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **labelConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:142

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Shape.d.ts:112

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

Defined in: core/types/src/shapes/Shape.d.ts:146

The SVG container element as a d3 selector or DOM element.

###### Returns

`Selection`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement` \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:147

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Shape.d.ts:151

A comparator function used to sort shapes for layering order.

###### Returns

((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`

###### Call Signature

> **sort**(`_`: ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null`): `this`

Defined in: core/types/src/shapes/Shape.d.ts:152

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

Defined in: core/types/src/shapes/Shape.d.ts:156

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).

###### Returns

`Record`\<`string`, `unknown`\>

###### Call Signature

> **textureDefault**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/shapes/Shape.d.ts:157

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

Defined in: core/types/src/shapes/Shape.d.ts:111

Produces a backend-agnostic scene graph for this shape's data, reusing the
same accessors render() applies to the DOM. This is the migration seam toward
the @d3plus/render pluggable backends; it has no effect on render().

###### Returns

`GroupNode`

<a id="translate-16"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-16"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-17"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="sizelegend-1"></a>

### SizeLegend

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:43

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:58

Font settings for the value labels: `fontColor`, `fontFamily`, `fontSize`. Merged into the current settings.

###### Returns

`SizeLegendTextConfig`

###### Call Signature

> **labelConfig**(`_`: `SizeLegendTextConfig`): `this`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:59

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:85

Lays the legend out from the current config and returns the result
(circles, leader lines, labels, overall width/height). Pure: reads no
DOM, so a chart can measure the legend before it draws.

###### Returns

`SizeLegendLayout`

<a id="lineconfig-1"></a>

##### lineConfig()

###### Call Signature

> **lineConfig**(): `SizeLegendLineConfig`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:63

Paint for the leader lines: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. Merged into the current settings.

###### Returns

`SizeLegendLineConfig`

###### Call Signature

> **lineConfig**(`_`: `SizeLegendLineConfig`): `this`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:64

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:89

The width and height of the last layout, in pixels.

###### Returns

`object`

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `height` | `number` | core/types/src/components/SizeLegend/SizeLegend.d.ts:91 |
| `width` | `number` | core/types/src/components/SizeLegend/SizeLegend.d.ts:90 |

<a id="parent-17"></a>

##### parent()

###### Call Signature

> **parent**(): `unknown`

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:106

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:78

The container element for a standalone render, as a d3 selector or DOM element.

###### Returns

`Selection`\<`BaseType`, `unknown`, `null`, `undefined`\> \| `undefined`

###### Call Signature

> **select**(`_`: `string` \| `HTMLElement` \| `SVGElement`): `this`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:79

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:68

Paint for the circles: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. Merged into the current settings.

###### Returns

`SizeLegendShapeConfig`

###### Overrides

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: `SizeLegendShapeConfig`): `this`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:69

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:73

Font settings for the title: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. Merged into the current settings.

###### Returns

`SizeLegendTextConfig`

###### Call Signature

> **titleConfig**(`_`: `SizeLegendTextConfig`): `this`

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:74

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

Defined in: core/types/src/components/SizeLegend/SizeLegend.d.ts:99

Produces a backend-agnostic scene graph of the last layout, offset by the
optional transform.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `x?` | `number` | Horizontal offset of the legend's top-left corner. |
| `y?` | `number` | Vertical offset of the legend's top-left corner. |

###### Returns

`GroupNode`

<a id="translate-17"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-17"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-18"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="textbox"></a>

### TextBox

Defined in: core/types/src/components/TextBox.d.ts:43

Creates a wrapped text box for each point in an array of data.

#### Extends

- [`BaseClass`](#baseclass)

#### Methods

<a id="colordefaults-18"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

<a id="locale-18"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/components/TextBox.d.ts:68

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

<a id="shapeconfig-19"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/components/TextBox.d.ts:63

Produces a backend-agnostic scene graph for the text boxes, reusing the same
layout (_textData) and per-line positioning render() applies to the DOM.

###### Returns

`GroupNode`

<a id="translate-18"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-18"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-19"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="timeline"></a>

### Timeline

Defined in: core/types/src/components/Timeline/Timeline.d.ts:8

Creates an interactive timeline brush component for selecting time periods within a visualization.

#### Extends

- [`Axis`](#axis)

#### Methods

<a id="barconfig-6"></a>

##### barConfig()

###### Call Signature

> **barConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:89

Axis line style.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`barConfig`](#barconfig)

###### Call Signature

> **barConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:90

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

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`Axis`](#axis).[`config`](#config-1)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/components/Axis/Axis.d.ts:94

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.

###### Returns

`unknown`[]

###### Inherited from

[`Axis`](#axis).[`data`](#data-1)

###### Call Signature

> **data**(`_`: `unknown`[]): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:95

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

Defined in: core/types/src/components/Axis/Axis.d.ts:99

Grid config of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`gridConfig`](#gridconfig)

###### Call Signature

> **gridConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:100

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

Defined in: core/types/src/components/Axis/Axis.d.ts:104

Whether to rotate horizontal axis labels -90 degrees.

###### Returns

`boolean` \| `undefined`

###### Inherited from

[`Axis`](#axis).[`labelRotation`](#labelrotation)

###### Call Signature

> **labelRotation**(`_`: `boolean`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:105

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/components/Axis/Axis.d.ts:127

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

Defined in: core/types/src/components/Axis/Axis.d.ts:109

The orientation of the shape.

###### Returns

`string`

###### Inherited from

[`Axis`](#axis).[`orient`](#orient)

###### Call Signature

> **orient**(`_`: `string`): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:110

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

Defined in: core/types/src/components/Axis/Axis.d.ts:116

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`Axis`](#axis).[`parent`](#parent-1)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

<a id="render-19"></a>

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

<a id="select-19"></a>

##### select()

###### Call Signature

> **select**(): `Selection`

Defined in: core/types/src/components/Axis/Axis.d.ts:137

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

Defined in: core/types/src/components/Axis/Axis.d.ts:138

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

<a id="shapeconfig-20"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Axis/Axis.d.ts:142

Tick style of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`shapeConfig`](#shapeconfig-1)

###### Call Signature

> **shapeConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:143

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

Defined in: core/types/src/components/Axis/Axis.d.ts:147

Title configuration of the axis.

###### Returns

`Record`\<`string`, `unknown`\>

###### Inherited from

[`Axis`](#axis).[`titleConfig`](#titleconfig)

###### Call Signature

> **titleConfig**(`_`: `Record`\<`string`, `unknown`\>): `this`

Defined in: core/types/src/components/Axis/Axis.d.ts:148

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

<a id="translate-19"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-19"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`Axis`](#axis).[`ctx`](#property-ctx-1) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-20"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`Axis`](#axis).[`schema`](#property-schema-1) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="tooltip-1"></a>

### Tooltip

Defined in: core/types/src/components/Tooltip.d.ts:7

Creates HTML tooltips in the body of a webpage.

#### Extends

- [`BaseClass`](#baseclass)

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

<a id="colordefaults-20"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`config`](#config-7)

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

<a id="locale-20"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

> **position**(): (`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `HTMLElement` \| `number`[]

Defined in: core/types/src/components/Tooltip.d.ts:75

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Returns

(`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `HTMLElement` \| `number`[]

###### Example

```ts
function value(d) {
return [d.x, d.y];
}
```

###### Call Signature

> **position**(`_`: `string` \| `HTMLElement` \| `number`[] \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `HTMLElement` \| `number`[])): `this`

Defined in: core/types/src/components/Tooltip.d.ts:76

The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_` | `string` \| `HTMLElement` \| `number`[] \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `HTMLElement` \| `number`[]) |

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

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

> **tdStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Tooltip.d.ts:120

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

Defined in: core/types/src/components/Tooltip.d.ts:121

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

<a id="thstyle"></a>

##### thStyle()

###### Call Signature

> **thStyle**(): `Record`\<`string`, `unknown`\>

Defined in: core/types/src/components/Tooltip.d.ts:130

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

Defined in: core/types/src/components/Tooltip.d.ts:131

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

<a id="translate-20"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-20"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-21"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="viz"></a>

### Viz

Defined in: core/types/src/charts/viz/Viz.d.ts:9

The base class every d3plus chart extends. Owns the shared configuration surface (data, groupBy, size and color accessors, title, legend, tooltip, timeline, zoom, table view) and the render lifecycle that each chart type's definition plugs its layout into. Not used directly; see the chart classes (BarChart, Treemap, …).

#### Extends

- `default`

#### Extended by

- [`Plot`](#plot)

#### Methods

<a id="active-10"></a>

##### active()

> **active**(`_?`: `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:16

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:20

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:24

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:28

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

> **attributionStyle**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:32

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:40

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

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.backConfig`

<a id="backcontrolclassname-1"></a>

##### backControlClassName()

> **backControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:44

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

> **backControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:48

An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.backControlStyle`

<a id="color-1"></a>

##### color()

> **color**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:52

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)) |

###### Returns

`string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

###### Inherited from

`VizBase.color`

<a id="colordefaults-21"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

> **colorScale**(`_?`: `string` \| `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))): `string` \| `false` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint))

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:56

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:60

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:72

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:64

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:68

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

Defined in: core/types/src/utils/BaseClass.d.ts:28

Methods that correspond to the key/value pairs and returns this class.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.config`

###### Call Signature

> **config**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:29

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:85

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

Defined in: core/types/src/charts/viz/Viz.d.ts:165

Tears down the visualization: disconnects the ResizeObserver, stops listening for web font loads, and removes DOM event listeners. Call this when unmounting to avoid memory leaks.

###### Returns

`this`

<a id="detectresize-1"></a>

##### detectResize()

> **detectResize**(`_?`: `boolean`): `boolean` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:92

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:96

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:100

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:104

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:108

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:112

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:116

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:120

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:124

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:136

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:128

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:142

Accessor function, or a constant string applied to every data point's
label (unlike `value`/`nodeId`/etc., a string here is not treated as a
per-datum object key — pass a function for that).

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:146

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:150

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

> **legendFilterInvert**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:154

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:158

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

> **legendInsetConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:162

Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.legendInsetConfig`

<a id="legendpadding-1"></a>

##### legendPadding()

> **legendPadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:166

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:170

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

Defined in: core/types/src/charts/viz/VizBaseConfig.d.ts:174

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:19

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:23

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

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:27

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:31

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.messageStyle`

<a id="minimapclassname-1"></a>

##### minimapClassName()

> **minimapClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBase.d.ts:35

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

> **minimapLabelStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:39

An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.minimapLabelStyle`

<a id="minimapstyle-1"></a>

##### minimapStyle()

> **minimapStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:43

An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.minimapStyle`

<a id="minimapviewportstyle-1"></a>

##### minimapViewportStyle()

> **minimapViewportStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:47

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.minimapViewportStyle`

<a id="minimapviewportstyleactive-1"></a>

##### minimapViewportStyleActive()

> **minimapViewportStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:51

An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.minimapViewportStyleActive`

<a id="nodatahtml-1"></a>

##### noDataHTML()

> **noDataHTML**(`_?`: `string` \| ((`viz`: `VizBase`) => `string`)): `string` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:55

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:59

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

`VizBase.parent`

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/charts/viz/Viz.d.ts:66

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

Defined in: core/types/src/charts/viz/Viz.d.ts:87

Selects which @d3plus/render backend paints the visible output.
`"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
Boolean arguments both normalize to `"svg"`.

###### Returns

`"svg"` \| `"canvas"`

###### Call Signature

> **renderer**(`_`: `boolean` \| `"svg"` \| `"canvas"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:88

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

Defined in: core/types/src/charts/viz/Viz.d.ts:95

"full" runs the DOM enter/update/exit for every shape; "compute"
skips DOM work and only populates the scene data (`_textData`,
`_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
`renderScene` callers; users can also opt-in.

###### Returns

`"full"` \| `"compute"`

###### Call Signature

> **renderMode**(`_`: `"full"` \| `"compute"`): `this`

Defined in: core/types/src/charts/viz/Viz.d.ts:96

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

Defined in: core/types/src/charts/viz/Viz.d.ts:104

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:63

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

> **searchAccessor**(`_?`: (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`): [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:76

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
| `_?` | (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` |

###### Returns

[`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.searchAccessor`

<a id="searchcontrolclassname-1"></a>

##### searchControlClassName()

> **searchControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBase.d.ts:80

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

> **searchControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:84

An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.searchControlStyle`

<a id="searchcontrolstyleactive-1"></a>

##### searchControlStyleActive()

> **searchControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:88

An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.searchControlStyleActive`

<a id="searchcontrolstylehover-1"></a>

##### searchControlStyleHover()

> **searchControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:92

An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.searchControlStyleHover`

<a id="select-20"></a>

##### select()

> **select**(`_?`: `string` \| `HTMLElement`): [`Viz`](#viz) \| `Selection`\<`BaseType`, `unknown`, `null`, `undefined`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:96

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:100

Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`)

###### Inherited from

`VizBase.shape`

<a id="shapeconfig-22"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/charts/viz/VizBase.d.ts:104

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

`VizBase.shapeConfig`

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/charts/viz/VizBase.d.ts:105

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:109

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

> **sizeLegendConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:113

Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.sizeLegendConfig`

<a id="sizelegendposition-1"></a>

##### sizeLegendPosition()

> **sizeLegendPosition**(`_?`: `"right"` \| `"bottom"`): [`Viz`](#viz) \| `"right"` \| `"bottom"`

Defined in: core/types/src/charts/viz/VizBase.d.ts:117

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

> **subtitle**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:121

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:125

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

> **subtitlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:129

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:234

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:238

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

> **tableViewControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:242

An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.tableViewControlStyle`

<a id="tableviewcontrolstyleactive-1"></a>

##### tableViewControlStyleActive()

> **tableViewControlStyleActive**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:246

An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.tableViewControlStyleActive`

<a id="tableviewcontrolstylehover-1"></a>

##### tableViewControlStyleHover()

> **tableViewControlStyleHover**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:250

An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.tableViewControlStyleHover`

<a id="tableviewpagesize-1"></a>

##### tableViewPageSize()

> **tableViewPageSize**(`_?`: `number` \| `false`): `number` \| `false` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBase.d.ts:254

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

> **threshold**(`_?`: `number` \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)): `number` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:133

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:138

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:142

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:146

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:150

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:154

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:158

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

> **title**(`_?`: `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)): `string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:162

Accessor function or string for the visualization's title.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) |

###### Returns

`string` \| [`Viz`](#viz) \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`)

###### Inherited from

`VizBase.title`

<a id="titleconfig-9"></a>

##### titleConfig()

> **titleConfig**(`_?`: `Record`\<`string`, `unknown`\>): [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:166

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

> **titlePadding**(`_?`: `boolean` \| ((`viz`: `VizBase`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`viz`: `VizBase`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:170

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

Defined in: core/types/src/charts/viz/Viz.d.ts:81

Returns the underlying canvas element of the most recent render when the
canvas backend is active (`renderer("canvas")`), or `undefined` otherwise.
Server-side callers cast this to their native canvas to encode a raster
(see `@d3plus/ssr`).

###### Returns

`unknown`

<a id="tooltip-2"></a>

##### tooltip()

> **tooltip**(`_?`: `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)): `boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:174

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:178

Configuration object for the tooltip.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `Record`\<`string`, `unknown`\> |

###### Returns

[`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.tooltipConfig`

<a id="toscene-20"></a>

##### toScene()

> **toScene**(): `Scene`

Defined in: core/types/src/charts/viz/Viz.d.ts:29

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

Defined in: core/types/src/charts/viz/Viz.d.ts:74

Serializes the most recently rendered output to an SVG string. Returns
`""` if the chart has not been rendered yet. Both backends support this:
the SVG backend returns its live `<svg>`, the canvas backend re-renders the
retained scene through a throwaway SVG backend. Primarily used for
server-side rendering (see `@d3plus/ssr`).

###### Returns

`string`

<a id="total-1"></a>

##### total()

> **total**(`_?`: `string` \| `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)): `string` \| `boolean` \| [`Viz`](#viz) \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)

Defined in: core/types/src/charts/viz/VizBase.d.ts:182

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:186

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:190

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:194

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

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:198

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:202

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:206

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_?` | `false` \| `Record`\<`string`, `unknown`\> |

###### Returns

`false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

###### Inherited from

`VizBase.zoomBrushSelectionStyle`

<a id="zoomcontrolclassname-1"></a>

##### zoomControlClassName()

> **zoomControlClassName**(`_?`: `string`): `string` \| [`Viz`](#viz)

Defined in: core/types/src/charts/viz/VizBase.d.ts:210

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:214

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

> **zoomControlStyle**(`_?`: `false` \| `Record`\<`string`, `unknown`\>): `false` \| [`Viz`](#viz) \| `Record`\<`string`, `unknown`\>

Defined in: core/types/src/charts/viz/VizBase.d.ts:218

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:222

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:226

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.

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

Defined in: core/types/src/charts/viz/VizBase.d.ts:230

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
| <a id="property-ctx-21"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | `VizBase.ctx` | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-22"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | `VizBase.schema` | core/types/src/utils/BaseClass.d.ts:15 |

***

<a id="whisker"></a>

### Whisker

Defined in: core/types/src/shapes/Whisker.d.ts:12

Creates SVG whisker based on an array of data.

#### Extends

- [`BaseClass`](#baseclass)

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

<a id="colordefaults-22"></a>

##### colorDefaults()

###### Call Signature

> **colorDefaults**(): [`ColorDefaults`](#colordefaults-23)

Defined in: core/types/src/utils/BaseClass.d.ts:58

Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

###### Returns

[`ColorDefaults`](#colordefaults-23)

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

Defined in: core/types/src/utils/BaseClass.d.ts:59

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

<a id="lineconfig-2"></a>

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

<a id="locale-22"></a>

##### locale()

###### Call Signature

> **locale**(): `string`

Defined in: core/types/src/utils/BaseClass.d.ts:45

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

Defined in: core/types/src/utils/BaseClass.d.ts:46

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

Defined in: core/types/src/utils/BaseClass.d.ts:72

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

Defined in: core/types/src/utils/BaseClass.d.ts:73

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

Defined in: core/types/src/utils/BaseClass.d.ts:74

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

Defined in: core/types/src/utils/BaseClass.d.ts:75

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

Defined in: core/types/src/utils/BaseClass.d.ts:79

Parent config used by the wrapper.

###### Returns

`unknown`

###### Inherited from

[`BaseClass`](#baseclass).[`parent`](#parent-7)

###### Call Signature

> **parent**(`_`: `unknown`): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:80

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

Defined in: core/types/src/shapes/Whisker.d.ts:27

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

<a id="shapeconfig-23"></a>

##### shapeConfig()

###### Call Signature

> **shapeConfig**(): [`D3plusConfig`](#d3plusconfig)

Defined in: core/types/src/utils/BaseClass.d.ts:94

Configuration object with key/value pairs applied as method calls on each shape.

###### Returns

[`D3plusConfig`](#d3plusconfig)

###### Inherited from

[`BaseClass`](#baseclass).[`shapeConfig`](#shapeconfig-7)

###### Call Signature

> **shapeConfig**(`_`: [`D3plusConfig`](#d3plusconfig)): `this`

Defined in: core/types/src/utils/BaseClass.d.ts:95

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

Defined in: core/types/src/shapes/Whisker.d.ts:33

Compute-mode scene aggregation, mirroring Box.toScene(). Returns a
GroupNode containing the inner Line's scene children plus each
endpoint shape's scene children.

###### Returns

`GroupNode`

<a id="translate-22"></a>

##### translate()

###### Call Signature

> **translate**(): (`d`: `string`, `locale?`: `string`) => `string`

Defined in: core/types/src/utils/BaseClass.d.ts:89

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

Defined in: core/types/src/utils/BaseClass.d.ts:90

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
| <a id="property-ctx-22"></a> `ctx` | `Record`\<`string`, `unknown`\> | Chart-internal scratch (d3 layout instances, computed derived state). | [`BaseClass`](#baseclass).[`ctx`](#property-ctx-7) | core/types/src/utils/BaseClass.d.ts:17 |
| <a id="property-schema-23"></a> `schema` | `Record`\<`string`, `any`\> | Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is deliberate and load-bearing: `installFluent` coerces accessor/const fields into functions, so call sites invoke `schema.fill(d, i)` and index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes the pre-coercion user input). Typing it as a coerced `ResolvedSchema` interface is the only way to drop the `any`; until then it stays. | [`BaseClass`](#baseclass).[`schema`](#property-schema-7) | core/types/src/utils/BaseClass.d.ts:15 |

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

<a id="applyconfig"></a>

### applyConfig()

> **applyConfig**(`instance`: [`D3plusInstance`](#d3plusinstance), `node`: `Element`, ...`configs`: (`Record`\<`string`, `unknown`\> \| `undefined`)[]): [`D3plusInstance`](#d3plusinstance)

Defined in: dom/types/src/renderer.d.ts:25

Merges the supplied config objects over a fresh `{select: node}` target,
routes any `<field>` + `<field>Format` pairs to their loader methods, then
applies whatever remains via `instance.config()`. Shared by every d3plus
framework wrapper so this routing lives in exactly one place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `instance` | [`D3plusInstance`](#d3plusinstance) | A d3plus class instance. |
| `node` | `Element` | The DOM element the visualization renders into (its `select`). |
| ...`configs` | (`Record`\<`string`, `unknown`\> \| `undefined`)[] | One or more config objects, merged left-to-right (later objects win); `undefined`/`null` entries are ignored. |

#### Returns

[`D3plusInstance`](#d3plusinstance)

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

> **backgroundColor**(`elem`: `BaseType` \| `undefined`): `string`

Defined in: dom/types/src/backgroundColor.d.ts:7

Given a DOM element, returns its background color by walking up the
ancestor chain until a non-transparent background is found. Falls back
to "rgb(255, 255, 255)" (white) if every ancestor is transparent.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `BaseType` \| *required* | The DOM element to check. |

#### Returns

`string`

***

<a id="ckmeans"></a>

### ckmeans()

> **ckmeans**(`data`: `number`[], `nClusters`: `number`): `number`[][]

Defined in: math/types/src/ckmeans.d.ts:6

Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, minimizing within-group sum-of-squared-deviations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `number`[] | input data, as an array of number values |
| `nClusters` | `number` | number of desired classes. This cannot be greater than the number of values in the data array. |

#### Returns

`number`[][]

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

> **colorAssign**(`c`: `string` \| `boolean` \| `null` \| `undefined`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults-23)\>): `string`

Defined in: color/types/src/assign.d.ts:7

Assigns a color to a value using a predefined set of defaults.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` \| `boolean` \| `null` \| *required* | A valid CSS color string. |
| `u?` | `Partial`\<[`ColorDefaults`](#colordefaults-23)\> | An object containing overrides of the default colors. |

#### Returns

`string`

***

<a id="colorcontrast"></a>

### colorContrast()

> **colorContrast**(`c`: `string`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults-23)\>): `string`

Defined in: color/types/src/contrast.d.ts:7

Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on top of that provided color. The choice maximizes the WCAG 2.x contrast ratio against the background, so the more legible of the two text tokens always wins.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` | A valid CSS color string. |
| `u?` | `Partial`\<[`ColorDefaults`](#colordefaults-23)\> | An object containing overrides of the default colors. |

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

<a id="configwarnings"></a>

### configWarnings()

#### Call Signature

> **configWarnings**(): `boolean`

Defined in: core/types/src/utils/configWarnings.d.ts:11

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

Defined in: core/types/src/utils/configWarnings.d.ts:12

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

<a id="getsize"></a>

### getSize()

> **getSize**(`elem`: `HTMLElement`): \[`number` \| `undefined`, `number` \| `undefined`\]

Defined in: dom/types/src/getSize.d.ts:4

Finds the available width and height for a specified HTMLElement, traversing it's parents until it finds something with constrained dimensions. Falls back to the inner dimensions of the browser window if none is found.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `elem` | `HTMLElement` |

#### Returns

\[`number` \| `undefined`, `number` \| `undefined`\]

***

<a id="hash"></a>

### hash()

> **hash**(`val`: `unknown`): `string`

Defined in: dom/types/src/renderer.d.ts:34

Stable hash that serializes functions by their source, so function-valued
config props (accessors, formatters) still register as changed when their
body changes. Wrappers use this to diff config across a framework's render
cycles — two structurally identical config objects hash equal, so an
unchanged config skips a re-render.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `unknown` | Any config value. |

#### Returns

`string`

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

<a id="linearconfidence"></a>

### linearConfidence()

> **linearConfidence**(`points`: \[`number`, `number`\][], `level?`: `number`): ((`x`: `number`) => \[`number`, `number`\]) \| `null`

Defined in: math/types/src/linearConfidence.d.ts:6

Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/Sxx)`. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `points` | \[`number`, `number`\][] | An array of `[x, y]` pairs. |
| `level?` | `number` | The confidence level, between 0 and 1. Defaults to 0.95. |

#### Returns

((`x`: `number`) => \[`number`, `number`\]) \| `null`

***

<a id="linearprediction"></a>

### linearPrediction()

> **linearPrediction**(`points`: \[`number`, `number`\][], `level?`: `number`): ((`x`: `number`) => \[`number`, `number`\]) \| `null`

Defined in: math/types/src/linearPrediction.d.ts:6

Builds the prediction band for a new observation under a simple linear regression of `points`: `ŷ ± t·s·√(1 + 1/n + (x − x̄)²/Sxx)`. Wider than the confidence band of `linearConfidence`, since it covers the scatter of individual values as well as the uncertainty of the fitted line, which makes it the band to draw around a forecast. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `points` | \[`number`, `number`\][] | An array of `[x, y]` pairs. |
| `level?` | `number` | The confidence level, between 0 and 1. Defaults to 0.95. |

#### Returns

((`x`: `number`) => \[`number`, `number`\]) \| `null`

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

<a id="negativespace"></a>

### negativeSpace()

> **negativeSpace**(`bounds`: [`Bounds`](#bounds), `obstacles`: [`Bounds`](#bounds)[], `options?`: [`NegativeSpaceOptions`](#negativespaceoptions)): [`Bounds`](#bounds)[]

Defined in: math/types/src/negativeSpace.d.ts:34

Finds the open, axis-aligned rectangles inside `bounds` that lie entirely
outside the marks described by `obstacles`. The marks are treated as a single
solid region — the convex hull of every (padded) obstacle box — so a hole in
the middle of a ring of points is never returned, only the space around them.
Boxes in `options.exclude` are kept clear too, each on its own. Each
returned box is maximal (it cannot grow in any direction without leaving
`bounds` or touching the hull or an excluded box). Results are sorted largest area first, and the
output is deterministic for a given input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bounds` | [`Bounds`](#bounds) | The region to search, such as a chart's plot area. |
| `obstacles` | [`Bounds`](#bounds)[] | The bounding boxes of the marks drawn inside `bounds`. |
| `options?` | [`NegativeSpaceOptions`](#negativespaceoptions) | Padding and minimum-size options. |

#### Returns

[`Bounds`](#bounds)[]

***

<a id="nest"></a>

### nest()

> **nest**(`data`: [`DataPoint`](#datapoint)[], `keys`: `KeyAccessor` \| `KeyAccessor`[]): `NestEntry`[]

Defined in: data/types/src/nest.d.ts:12

Groups a flat array of data by one or more key accessors into nested {key, values} entries, one level per accessor. A row whose keys run out before the last level becomes a leaf at the depth where they stopped instead of leaving an empty level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The flat data array to nest. |
| `keys` | `KeyAccessor` \| `KeyAccessor`[] | One key accessor, or an array of them, one per nest level. |

#### Returns

`NestEntry`[]

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

<a id="onfontsloaded"></a>

### onFontsLoaded()

> **onFontsLoaded**(`callback`: () => `void`): () => `void`

Defined in: dom/types/src/fontLoading.d.ts:17

Registers a callback to run whenever the browser finishes loading a web font that d3plus has already measured text with — the moment any text laid out with that font's fallback becomes stale. Returns a function that removes the callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | () => `void` | The function to run after the font loads. |

#### Returns

() => `void`

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

Defined in: math/types/src/path2polygon.d.ts:10

Transforms a path string into an Array of points, with no DOM involved.
Straight segments contribute their endpoints; curves and arcs are flattened
into line segments no longer than `segmentLength`. Higher `segmentLength`
values lower computation time but yield more rigid curves.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | An SVG string path, commonly the "d" property of a <path> element. |
| `segmentLength?` | `number` | The maximum length of line segments when flattening curves. |

#### Returns

`Point`[]

***

<a id="pathbounds"></a>

### pathBounds()

> **pathBounds**(`d`: `string`): `object`

Defined in: math/types/src/pathBounds.d.ts:8

Computes the exact bounding box of an SVG path string with no DOM involved,
evaluating the true extrema of each Bézier and arc segment (not a sampled
approximation). Returns `{x, y, width, height}`, or a zero-size box at the
origin for an empty/unparseable path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `d` | `string` | An SVG path string (the `d` attribute of a `<path>`). |

#### Returns

`object`

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `height` | `number` | math/types/src/pathBounds.d.ts:12 |
| `width` | `number` | math/types/src/pathBounds.d.ts:11 |
| `x` | `number` | math/types/src/pathBounds.d.ts:9 |
| `y` | `number` | math/types/src/pathBounds.d.ts:10 |

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

Rotates a polygon around a given origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | The polygon to be rotated, which should be an Array of `[x, y]` values. |
| `alpha` | `number` | The angle in radians to rotate. |
| `origin?` | `Point` | The origin point of the rotation, which should be an `[x, y]` formatted Array. |

#### Returns

`Point`[]

***

<a id="regression"></a>

### regression()

> **regression**(`points`: \[`number`, `number`\][], `type?`: [`RegressionType`](#regressiontype), `options?`: [`RegressionOptions`](#regressionoptions)): [`RegressionResult`](#regressionresult) \| `null`

Defined in: math/types/src/regression.d.ts:32

Fits a regression model to a set of `[x, y]` points. Points with non-finite values, or that fall outside a model's domain (y ≤ 0 for exponential, x ≤ 0 for logarithmic, either for power), are ignored. Returns `null` when there are too few usable points or the x values do not vary.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `points` | \[`number`, `number`\][] | An array of `[x, y]` pairs. |
| `type?` | [`RegressionType`](#regressiontype) | The regression model: "linear", "exponential", "logarithmic", "power", or "polynomial". |
| `options?` | [`RegressionOptions`](#regressionoptions) | Additional options, such as the polynomial `order`. |

#### Returns

[`RegressionResult`](#regressionresult) \| `null`

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

> **saveElement**(`elem`: `HTMLElement` \| `SVGElement`, `options?`: `SaveElementOptions`, `renderOptions?`: `SaveElementRenderOptions`): `void`

Defined in: export/types/src/saveElement.d.ts:43

Downloads an HTML Element as a bitmap PNG image.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `HTMLElement` \| `SVGElement` | The DOM element or d3 selection to export. |
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

<a id="studenttcdf"></a>

### studentTCdf()

> **studentTCdf**(`t`: `number`, `df`: `number`): `number`

Defined in: math/types/src/studentTQuantile.d.ts:6

The cumulative distribution function of Student's t-distribution.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | `number` | The t statistic. |
| `df` | `number` | Degrees of freedom. |

#### Returns

`number`

***

<a id="studenttquantile"></a>

### studentTQuantile()

> **studentTQuantile**(`p`: `number`, `df`: `number`): `number`

Defined in: math/types/src/studentTQuantile.d.ts:12

The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportion `p` of the distribution lies.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `number` | A probability between 0 and 1 (e.g. 0.975 for a two-sided 95% interval). |
| `df` | `number` | Degrees of freedom (greater than 0). |

#### Returns

`number`

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

Defined in: dom/types/src/textWidth.d.ts:14

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

Defined in: dom/types/src/textWidth.d.ts:15

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

Defined in: text/types/src/textWrap.d.ts:39

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

Defined in: core/types/src/charts/BarChart/index.d.ts:10

Creates a bar chart based on an array of data. When stacked, each bar's
fraction of its stack total is available to tooltip accessors as `share`.

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

<a id="chord"></a>

### Chord

> `const` **Chord**: () => `any`

Defined in: core/types/src/charts/Chord/index.d.ts:18

Creates a Chord diagram based on a defined set of nodes and links.

#### Returns

`any`

***

<a id="colordefaults-24"></a>

### colorDefaults

> `const` **colorDefaults**: [`ColorDefaults`](#colordefaults-23)

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

<a id="histogram"></a>

### Histogram

> `const` **Histogram**: () => `any`

Defined in: core/types/src/charts/Histogram/index.d.ts:13

Creates a histogram from an array of raw observations: the `value` of each
row is binned along a linear x axis, and bar heights show each bin's
count (or density / relative frequency via `binNormalize`). Series set by
`groupBy` share bin edges and are stacked.

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

<a id="locale-23"></a>

### locale

> `const` **locale**: `Record`\<`string`, [`TimeLocaleDefinition`](#timelocaledefinition)\>

Defined in: locales/types/src/dictionaries/timeLocale.d.ts:41

d3-time-format locale definitions (date and time patterns, period, day, and month names) keyed by locale code, used when formatting dates on axes, timelines, and tooltips.

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

Defined in: core/types/src/charts/StackedArea/index.d.ts:10

Creates a stacked area plot based on an array of data. Each point's
fraction of its stack total is available to tooltip accessors as `share`.

#### Returns

`any`

***

<a id="titlecaselocale"></a>

### titleCaseLocale

> `const` **titleCaseLocale**: `Record`\<`string`, [`TitleCaseRules`](#titlecaserules)\>

Defined in: locales/types/src/dictionaries/titleCaseLocale.d.ts:28

Per-language rules used by `titleCase`, keyed by two-letter language code plus a `default` fallback: the minor words kept lowercase mid-title and the acronyms forced uppercase.

***

<a id="translatelocale"></a>

### translateLocale

> `const` **translateLocale**: `Record`\<`string`, [`TranslationStrings`](#translationstrings)\>

Defined in: locales/types/src/dictionaries/translateLocale.d.ts:46

Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as `en-US` or `es-ES`. Each entry maps the English string to its translation.

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

Defined in: core/types/src/shapes/shapeConfig.d.ts:159

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
| <a id="property-backgroundimagefit"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-curve"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:160 |
| <a id="property-data"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-defined"></a> `defined?` | (`d`: [`DataPoint`](#datapoint)) => `boolean` | Determines whether a data point is defined (a gap in the area when false). | - | core/types/src/shapes/shapeConfig.d.ts:162 |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-hitarea"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-vectoreffect"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-x"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-x0"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:163 |
| <a id="property-x1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:164 |
| <a id="property-y"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:131 |
| <a id="property-y0"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:165 |
| <a id="property-y1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:166 |

***

<a id="axisconfig-2"></a>

### AxisConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:12

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-barconfig"></a> `barConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:13 |
| <a id="property-domainticks"></a> `domainTicks?` | `boolean` | Whether the domain's min and max are always shown as ticks, even when they aren't among the scale's own "nice" tick values (the nearest nice tick is dropped when it would crowd them). Defaults to `true`; zooming turns it off so a rescaled axis shows only nice values. | core/types/src/utils/D3plusConfig.d.ts:50 |
| <a id="property-fixedsize"></a> `fixedSize?` | `number` | Exact size of the space that contains the axis tick labels and title. Labels that need more room overflow outward instead of moving the axis line; zooming pins a rescaled axis this way so it doesn't shift. | core/types/src/utils/D3plusConfig.d.ts:28 |
| <a id="property-grid"></a> `grid?` | `unknown`[] | Grid values of the axis. | core/types/src/utils/D3plusConfig.d.ts:15 |
| <a id="property-gridconfig"></a> `gridConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:16 |
| <a id="property-gridsize"></a> `gridSize?` | `number` | Grid size of the axis. | core/types/src/utils/D3plusConfig.d.ts:18 |
| <a id="property-label-1"></a> `label?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:19 |
| <a id="property-labeloffset"></a> `labelOffset?` | `number` \| `false` | - | core/types/src/utils/D3plusConfig.d.ts:22 |
| <a id="property-labels"></a> `labels?` | `unknown`[] | Visible tick labels of the axis. | core/types/src/utils/D3plusConfig.d.ts:21 |
| <a id="property-maxsize"></a> `maxSize?` | `number` | Maximum size allowed for the space that contains the axis tick labels and title. | core/types/src/utils/D3plusConfig.d.ts:30 |
| <a id="property-minsize"></a> `minSize?` | `number` | Minimum size alloted for the space that contains the axis tick labels and title. | core/types/src/utils/D3plusConfig.d.ts:32 |
| <a id="property-range"></a> `range?` | (`number` \| `undefined`)[] | Scale range (in pixels) of the axis. The given array must have 2 values, but one may be `undefined` to allow the default behavior for that value. | core/types/src/utils/D3plusConfig.d.ts:37 |
| <a id="property-scale-1"></a> `scale?` | `AxisScale` | Scale of the axis. | core/types/src/utils/D3plusConfig.d.ts:39 |
| <a id="property-tickformat"></a> `tickFormat?` | (`d`: `string` \| `number`) => `string` \| `number` | Tick formatter. | core/types/src/utils/D3plusConfig.d.ts:41 |
| <a id="property-ticks"></a> `ticks?` | `unknown`[] | Tick values of the axis. | core/types/src/utils/D3plusConfig.d.ts:43 |
| <a id="property-ticksize"></a> `tickSize?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:51 |
| <a id="property-timelocale"></a> `timeLocale?` | `Record`\<`string`, `unknown`\> | Defines a custom locale object to be used in time scales. Must include `dateTime`, `date`, `time`, `periods`, `days`, `shortDays`, `months`, and `shortMonths` (see [d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale)). | core/types/src/utils/D3plusConfig.d.ts:58 |
| <a id="property-title"></a> `title?` | `string` | Title of the axis. | core/types/src/utils/D3plusConfig.d.ts:60 |

***

<a id="barconfig-7"></a>

### BarConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:173

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
| <a id="property-backgroundimagefit-1"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`RectConfig`](#rectconfig-3).[`backgroundImageFit`](#property-backgroundimagefit-6) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-data-1"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`RectConfig`](#rectconfig-3).[`data`](#property-data-9) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-1"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`RectConfig`](#rectconfig-3).[`discrete`](#property-discrete-7) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-1"></a> `duration?` | `number` | Animation duration in ms. | [`RectConfig`](#rectconfig-3).[`duration`](#property-duration-8) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-1"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`RectConfig`](#rectconfig-3).[`fill`](#property-fill-6) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-1"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`RectConfig`](#rectconfig-3).[`fillOpacity`](#property-fillopacity-6) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-height"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`height`](#property-height-4) | core/types/src/shapes/shapeConfig.d.ts:139 |
| <a id="property-hitarea-1"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`RectConfig`](#rectconfig-3).[`hitArea`](#property-hitarea-6) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-1"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`RectConfig`](#rectconfig-3).[`hover`](#property-hover-8) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-1"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverOpacity`](#property-hoveropacity-6) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-1"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`RectConfig`](#rectconfig-3).[`hoverStyle`](#property-hoverstyle-6) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-1"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`RectConfig`](#rectconfig-3).[`id`](#property-id-7) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-2"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`RectConfig`](#rectconfig-3).[`label`](#property-label-8) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-1"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`RectConfig`](#rectconfig-3).[`labelBounds`](#property-labelbounds-6) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-1"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`RectConfig`](#rectconfig-3).[`labelConfig`](#property-labelconfig-6) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-1"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`RectConfig`](#rectconfig-3).[`on`](#property-on-8) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-1"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`RectConfig`](#rectconfig-3).[`opacity`](#property-opacity-7) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-1"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`RectConfig`](#rectconfig-3).[`pointerEvents`](#property-pointerevents-7) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode-1"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`RectConfig`](#rectconfig-3).[`renderMode`](#property-rendermode-6) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-1"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`RectConfig`](#rectconfig-3).[`role`](#property-role-6) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-1"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`RectConfig`](#rectconfig-3).[`rotate`](#property-rotate-6) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-1"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`rx`](#property-rx-6) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-1"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`RectConfig`](#rectconfig-3).[`ry`](#property-ry-6) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-2"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`RectConfig`](#rectconfig-3).[`scale`](#property-scale-8) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-1"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`RectConfig`](#rectconfig-3).[`select`](#property-select-8) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-1"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`RectConfig`](#rectconfig-3).[`shapeRendering`](#property-shaperendering-6) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-1"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`RectConfig`](#rectconfig-3).[`sort`](#property-sort-6) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-1"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`RectConfig`](#rectconfig-3).[`stroke`](#property-stroke-6) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-1"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`RectConfig`](#rectconfig-3).[`strokeDasharray`](#property-strokedasharray-6) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-1"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`RectConfig`](#rectconfig-3).[`strokeLinecap`](#property-strokelinecap-6) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-1"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`RectConfig`](#rectconfig-3).[`strokeOpacity`](#property-strokeopacity-6) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-1"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`RectConfig`](#rectconfig-3).[`strokeWidth`](#property-strokewidth-6) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-1"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`RectConfig`](#rectconfig-3).[`textAnchor`](#property-textanchor-6) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-1"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`RectConfig`](#rectconfig-3).[`texture`](#property-texture-6) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-1"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`RectConfig`](#rectconfig-3).[`textureDefault`](#property-texturedefault-6) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-trail"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the rect as it moves between frames. | [`RectConfig`](#rectconfig-3).[`trail`](#property-trail-2) | core/types/src/shapes/shapeConfig.d.ts:141 |
| <a id="property-trailpersist"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | [`RectConfig`](#rectconfig-3).[`trailPersist`](#property-trailpersist-2) | core/types/src/shapes/shapeConfig.d.ts:143 |
| <a id="property-vectoreffect-1"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`RectConfig`](#rectconfig-3).[`vectorEffect`](#property-vectoreffect-6) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-1"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`RectConfig`](#rectconfig-3).[`verticalAlign`](#property-verticalalign-6) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-width"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | [`RectConfig`](#rectconfig-3).[`width`](#property-width-4) | core/types/src/shapes/shapeConfig.d.ts:138 |
| <a id="property-x-1"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`RectConfig`](#rectconfig-3).[`x`](#property-x-10) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-x0-1"></a> `x0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:174 |
| <a id="property-x1-1"></a> `x1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:175 |
| <a id="property-y-1"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`RectConfig`](#rectconfig-3).[`y`](#property-y-10) | core/types/src/shapes/shapeConfig.d.ts:131 |
| <a id="property-y0-1"></a> `y0?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:176 |
| <a id="property-y1-1"></a> `y1?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> \| `null` | - | - | core/types/src/shapes/shapeConfig.d.ts:177 |

***

<a id="baseshapeconfig"></a>

### BaseShapeConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:42

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
| <a id="property-active-2"></a> `active?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently active. | core/types/src/shapes/shapeConfig.d.ts:46 |
| <a id="property-activeopacity-2"></a> `activeOpacity?` | `number` | Opacity applied to non-active data points (default ~0.25). | core/types/src/shapes/shapeConfig.d.ts:48 |
| <a id="property-activestyle-2"></a> `activeStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for active data points. | core/types/src/shapes/shapeConfig.d.ts:50 |
| <a id="property-arialabel-2"></a> `ariaLabel?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA label per datum (accessibility). | core/types/src/shapes/shapeConfig.d.ts:52 |
| <a id="property-backgroundimage-2"></a> `backgroundImage?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Optional background image per datum (url or accessor returning a url). | core/types/src/shapes/shapeConfig.d.ts:54 |
| <a id="property-backgroundimagefit-2"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-data-2"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-2"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-2"></a> `duration?` | `number` | Animation duration in ms. | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-2"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-2"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-hitarea-2"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-2"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-2"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-2"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-2"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-3"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-2"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-2"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-2"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-2"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-2"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode-2"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-2"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-2"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-2"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-2"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-3"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-2"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-2"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-2"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-2"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-2"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-2"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-2"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-2"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-2"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-2"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-2"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-vectoreffect-2"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-2"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-x-2"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-y-2"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | core/types/src/shapes/shapeConfig.d.ts:131 |

***

<a id="bounds"></a>

### Bounds

Defined in: math/types/src/negativeSpace.d.ts:2

An axis-aligned box: top-left corner plus size.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-height-1"></a> `height` | `number` | math/types/src/negativeSpace.d.ts:6 |
| <a id="property-width-1"></a> `width` | `number` | math/types/src/negativeSpace.d.ts:5 |
| <a id="property-x-3"></a> `x` | `number` | math/types/src/negativeSpace.d.ts:3 |
| <a id="property-y-3"></a> `y` | `number` | math/types/src/negativeSpace.d.ts:4 |

***

<a id="boxconfig-1"></a>

### BoxConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:195

Box-specific config (whisker + median + outliers; subset of Shape).

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-3"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:196 |
| <a id="property-medianconfig"></a> `medianConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:197 |
| <a id="property-orient"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Orientation: "vertical" or "horizontal". | core/types/src/shapes/shapeConfig.d.ts:199 |
| <a id="property-outlier"></a> `outlier?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Outlier accessor (per-datum predicate). | core/types/src/shapes/shapeConfig.d.ts:201 |
| <a id="property-outlierconfig"></a> `outlierConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:202 |
| <a id="property-rectconfig"></a> `rectConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:203 |
| <a id="property-rectwidth"></a> `rectWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:204 |
| <a id="property-select-3"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:205 |
| <a id="property-whiskerconfig"></a> `whiskerConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:206 |
| <a id="property-whiskermode"></a> `whiskerMode?` | `string` \| `number` \| (`string` \| `number`)[] | Whisker mode: single mode string/number or [low, high] pair. | core/types/src/shapes/shapeConfig.d.ts:208 |
| <a id="property-x-4"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:209 |
| <a id="property-y-4"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:210 |

***

<a id="circleconfig-1"></a>

### CircleConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:146

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
| <a id="property-backgroundimagefit-3"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-data-4"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-3"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-3"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-3"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-3"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-hitarea-3"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-3"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-3"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-3"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-3"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-4"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-3"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-3"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-3"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-3"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-3"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-r"></a> `r?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:147 |
| <a id="property-rendermode-3"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-3"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-3"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-3"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-3"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-4"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-4"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-3"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-3"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-3"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-3"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-3"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-3"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-3"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-3"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-3"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-3"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-trail-1"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the point as it moves between frames. | - | core/types/src/shapes/shapeConfig.d.ts:149 |
| <a id="property-trailpersist-1"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | - | core/types/src/shapes/shapeConfig.d.ts:151 |
| <a id="property-vectoreffect-3"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-3"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-x-5"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-y-5"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:131 |

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

<a id="colordefaults-23"></a>

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

Defined in: core/types/src/utils/D3plusConfig.d.ts:244

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bucketformat"></a> `bucketFormat?` | (`start`: `number`, `i`: `number`, `buckets`: `number`[], `values`: `number`[]) => `string` | Formats the label for each bucket in a bucket-type scale ("jenks", "quantile", …). Passed the bucket's start value, its index, the full bucket array, and every data value used to build the buckets. | core/types/src/utils/D3plusConfig.d.ts:255 |
| <a id="property-bucketjoiner"></a> `bucketJoiner?` | (`min`: `string`, `max`: `string`) => `string` | Given a bucket's minimum and maximum values, returns the full label. | core/types/src/utils/D3plusConfig.d.ts:257 |
| <a id="property-domain"></a> `domain?` | `number`[] | For a linear scale, the `[min, max]` values used by the color scale; values outside this range map to the nearest color. | core/types/src/utils/D3plusConfig.d.ts:249 |

***

<a id="colorvalidateoptions"></a>

### ColorValidateOptions

Defined in: color/types/src/validate.d.ts:15

Options for [colorValidate](#colorvalidate).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode?` | `"dark"` \| `"light"` | Surface mode — sets the lightness band and default surface. | color/types/src/validate.d.ts:17 |
| <a id="property-ordinal-1"></a> `ordinal?` | `boolean` | Validate as an ordered one-hue ramp instead of a categorical palette. | color/types/src/validate.d.ts:23 |
| <a id="property-pairs"></a> `pairs?` | `"all"` \| `"adjacent"` | `adjacent` (bars/lines/stacks) or `all` (scatter/bubble/maps). | color/types/src/validate.d.ts:21 |
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

Defined in: core/types/src/utils/D3plusConfig.d.ts:263

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-4"></a> `active?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | The active callback function for highlighting shapes. | core/types/src/utils/D3plusConfig.d.ts:269 |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | core/types/src/utils/D3plusConfig.d.ts:271 |
| <a id="property-ariahidden"></a> `ariaHidden?` | `boolean` | Hides the SVG from assistive technology when true (`aria-hidden`). | core/types/src/utils/D3plusConfig.d.ts:275 |
| <a id="property-attribution"></a> `attribution?` | `string` \| `boolean` | Text (rendered as HTML — any valid HTML string works, including anchor links) shown in the chart's bottom-right corner, most often a map tile credit. `false` (the default) shows nothing. A credit wider than half the chart area collapses to a small "ⓘ" badge that expands on hover, focus, or click. | core/types/src/utils/D3plusConfig.d.ts:283 |
| <a id="property-attributionicon"></a> `attributionIcon?` | `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`)) | Overrides the "ⓘ" badge a long attribution collapses to, which otherwise renders as an inline SVG. A string is used as the badge's raw HTML content; a mount function, `(el: HTMLElement) => void | (() => void)`, is called once with the badge's reserved element so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it — return a cleanup function if there's teardown to do. | core/types/src/utils/D3plusConfig.d.ts:293 |
| <a id="property-attributionstyle"></a> `attributionStyle?` | `Record`\<`string`, `unknown`\> | CSS key/value pairs used to style the attribution text. | core/types/src/utils/D3plusConfig.d.ts:295 |
| <a id="property-backcontrolclassname"></a> `backControlClassName?` | `string` | Additional CSS class name(s) applied to the back button, alongside the fixed `back-control` class. | core/types/src/utils/D3plusConfig.d.ts:297 |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:299 |
| <a id="property-baseline"></a> `baseline?` | `number` | The baseline for the x/y plot. | core/types/src/utils/D3plusConfig.d.ts:301 |
| <a id="property-cache"></a> `cache?` | `boolean` | Whether to cache the processed data between renders. | core/types/src/utils/D3plusConfig.d.ts:303 |
| <a id="property-colordefaults"></a> `colorDefaults?` | [`ColorDefaultsConfig`](#colordefaultsconfig) | Overrides for the default colors used for data fills and legible text (see `colorDefaults` in @d3plus/color). | core/types/src/utils/D3plusConfig.d.ts:305 |
| <a id="property-colorordinal"></a> `colorOrdinal?` | `boolean` | Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. | core/types/src/utils/D3plusConfig.d.ts:307 |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | core/types/src/utils/D3plusConfig.d.ts:309 |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | core/types/src/utils/D3plusConfig.d.ts:311 |
| `colorScaleConfig.axisConfig?` | [`AxisConfig`](#axisconfig-2) | - | core/types/src/utils/D3plusConfig.d.ts:312 |
| `colorScaleConfig.centered?` | `boolean` | - | core/types/src/utils/D3plusConfig.d.ts:313 |
| `colorScaleConfig.colorMax?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:317 |
| `colorScaleConfig.colorMid?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:316 |
| `colorScaleConfig.colorMin?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:315 |
| `colorScaleConfig.colors?` | `string`[] | - | core/types/src/utils/D3plusConfig.d.ts:314 |
| `colorScaleConfig.scale?` | `AxisScale` | - | core/types/src/utils/D3plusConfig.d.ts:318 |
| <a id="property-colorscalepadding"></a> `colorScalePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the color scale uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:321 |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` \| (() => false \| Position) | Position of the color scale, `false` to hide it, or an accessor returning either. | core/types/src/utils/D3plusConfig.d.ts:323 |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:325 |
| <a id="property-confidence"></a> `confidence?` | `false` \| \[`string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`), `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`)\] | The confidence interval as `[lower, upper]` bounds — each given as an accessor function or a static data key (e.g. `["lci", "hci"]`), or `false` to disable. | core/types/src/utils/D3plusConfig.d.ts:331 |
| <a id="property-crosshairconfig"></a> `crosshairConfig?` | `Record`\<`string`, `unknown`\> | Paint for the shared tooltip's crosshair guide line (`stroke`, `strokeWidth`, `strokeDasharray`, `strokeOpacity`, …). | core/types/src/utils/D3plusConfig.d.ts:339 |
| <a id="property-data-5"></a> `data?` | `string` \| [`DataPoint`](#datapoint)[] | Data array or URL string to load data from. | core/types/src/utils/D3plusConfig.d.ts:265 |
| <a id="property-datacutoff"></a> `dataCutoff?` | `number` | Maximum number of data points to render before downsampling. | core/types/src/utils/D3plusConfig.d.ts:341 |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | core/types/src/utils/D3plusConfig.d.ts:343 |
| <a id="property-discrete-4"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | core/types/src/utils/D3plusConfig.d.ts:345 |
| <a id="property-duration-4"></a> `duration?` | `number` | Default duration of transitions, in milliseconds. | core/types/src/utils/D3plusConfig.d.ts:347 |
| <a id="property-filter"></a> `filter?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) | Predicate filtering which data points are included, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:349 |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | core/types/src/utils/D3plusConfig.d.ts:351 |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) \| (`d`: [`DataPoint`](#datapoint)) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | core/types/src/utils/D3plusConfig.d.ts:353 |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:355 |
| <a id="property-height-2"></a> `height?` | `number` | Overall height of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:357 |
| <a id="property-hiddencolor"></a> `hiddenColor?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) | Color for legend shapes whose grouping is hidden (via legend click), or a `(datum, index)` accessor. | core/types/src/utils/D3plusConfig.d.ts:359 |
| <a id="property-hiddenopacity"></a> `hiddenOpacity?` | `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `number`) | Opacity for legend labels whose grouping is hidden (via legend click), or a `(datum, index)` accessor. | core/types/src/utils/D3plusConfig.d.ts:361 |
| <a id="property-highlight"></a> `highlight?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Persistently emphasizes matching marks (keep color) and grays the rest. | core/types/src/utils/D3plusConfig.d.ts:365 |
| <a id="property-hover-4"></a> `hover?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | The hover callback function for highlighting shapes on mouseover. | core/types/src/utils/D3plusConfig.d.ts:363 |
| <a id="property-label-5"></a> `label?` | `string` \| `false` \| `string`[] \| `AccessorFn` | Label accessor for shapes. | core/types/src/utils/D3plusConfig.d.ts:367 |
| <a id="property-legend"></a> `legend?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig), `arr`: [`DataPoint`](#datapoint)[]) => `boolean`) | Controls legend visibility. Pass `false` to hide it, `true` to always show it, or a `(config, data) => boolean` accessor to decide dynamically — the chart defaults use an accessor to auto-hide the legend when it would be redundant. | core/types/src/utils/D3plusConfig.d.ts:374 |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | core/types/src/utils/D3plusConfig.d.ts:376 |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | core/types/src/utils/D3plusConfig.d.ts:377 |
| `legendConfig.shape?` | `DataPointAccessor`\<`string`\> | Each item's swatch: `"Rect"` (a square), `"Circle"` (a dot), or `"Line"` (a dot with a short stroke through it). Defaults to the shape of the series it stands for: a dot for Circles, the line glyph for Lines, and a square for everything else. | core/types/src/utils/D3plusConfig.d.ts:384 |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:385 |
| <a id="property-legendfilterinvert"></a> `legendFilterInvert?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Inverts legend click behavior (click hides / shift-click solos, or the reverse), or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:388 |
| <a id="property-legendinset"></a> `legendInset?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig)) => `boolean`) | Whether one legend may be drawn inside the empty space around the chart's marks instead of in a margin (size legend first, then legend, then colorScale), or an accessor receiving the resolved config. Defaults to `true`. | core/types/src/utils/D3plusConfig.d.ts:394 |
| <a id="property-legendinsetconfig"></a> `legendInsetConfig?` | `object` | Style of the semi-transparent box behind a legend drawn inside the chart. | core/types/src/utils/D3plusConfig.d.ts:396 |
| `legendInsetConfig.fill?` | `string` | Box fill; defaults to the chart's background color. | core/types/src/utils/D3plusConfig.d.ts:398 |
| `legendInsetConfig.fillOpacity?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:399 |
| `legendInsetConfig.margin?` | `number` | Space between the box's edge and the legend inside it. | core/types/src/utils/D3plusConfig.d.ts:405 |
| `legendInsetConfig.padding?` | `number` | Space kept between the box and the chart's marks and edges. | core/types/src/utils/D3plusConfig.d.ts:407 |
| `legendInsetConfig.rx?` | `number` | Corner radius. | core/types/src/utils/D3plusConfig.d.ts:403 |
| `legendInsetConfig.stroke?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:400 |
| `legendInsetConfig.strokeWidth?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:401 |
| <a id="property-legendpadding"></a> `legendPadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the legend uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:410 |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` \| (() => `Position`) | Position of the legend, or an accessor returning it. | core/types/src/utils/D3plusConfig.d.ts:412 |
| <a id="property-legendsort"></a> `legendSort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort comparator for legend items. | core/types/src/utils/D3plusConfig.d.ts:414 |
| <a id="property-legendtooltip"></a> `legendTooltip?` | [`TooltipConfig`](#tooltipconfig-3) | Tooltip configuration for legend items. | core/types/src/utils/D3plusConfig.d.ts:416 |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | core/types/src/utils/D3plusConfig.d.ts:418 |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` \| ((`viz`: `VizBase`) => `string`) | Custom HTML content for the loading indicator, or a function receiving the viz instance. | core/types/src/utils/D3plusConfig.d.ts:422 |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | core/types/src/utils/D3plusConfig.d.ts:420 |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | core/types/src/utils/D3plusConfig.d.ts:267 |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | core/types/src/utils/D3plusConfig.d.ts:424 |
| <a id="property-minimap"></a> `minimap?` | `boolean` | Shows a small overview + draggable-viewport minimap underneath the zoom controls once the chart is zoomed in. On by default whenever `zoom` is enabled. | core/types/src/utils/D3plusConfig.d.ts:426 |
| <a id="property-minimapclassname"></a> `minimapClassName?` | `string` | Additional CSS class name(s) applied to the minimap, alongside its fixed `d3plus-minimap`/etc. classes. | core/types/src/utils/D3plusConfig.d.ts:428 |
| <a id="property-nodatahtml"></a> `noDataHTML?` | `string` \| ((`viz`: `VizBase`) => `string`) | Custom HTML content shown when no data is supplied, or a function receiving the viz instance. | core/types/src/utils/D3plusConfig.d.ts:430 |
| <a id="property-ocean"></a> `ocean?` | `string` \| \{ `dark`: `string`; `light`: `string`; \} | Ocean color for geomaps (any CSS value including 'transparent'), or a `{light, dark}` pair chosen by the chart's backdrop. Defaults to the default basemap's own water colors. | core/types/src/utils/D3plusConfig.d.ts:436 |
| <a id="property-on-5"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | core/types/src/utils/D3plusConfig.d.ts:441 |
| <a id="property-point"></a> `point?` | (`d`: [`DataPoint`](#datapoint)) => `number`[] | Coordinate accessor for point-based geomaps. | core/types/src/utils/D3plusConfig.d.ts:443 |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `number`) | Point size accessor for geomaps. | core/types/src/utils/D3plusConfig.d.ts:445 |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:449 |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:447 |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | core/types/src/utils/D3plusConfig.d.ts:451 |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | core/types/src/utils/D3plusConfig.d.ts:453 |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | core/types/src/utils/D3plusConfig.d.ts:455 |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:457 |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` \| `Window` | Scrollable container selector for tooltip positioning. | core/types/src/utils/D3plusConfig.d.ts:459 |
| <a id="property-search"></a> `search?` | `boolean` | Shows a top-left search button that expands into an input; typing highlights shapes whose label matches. On by default for every chart. | core/types/src/utils/D3plusConfig.d.ts:461 |
| <a id="property-searchaccessor"></a> `searchAccessor?` | (`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string` | Resolves the string the search box matches its typed term against, for a given datum. Defaults to the mark's resolved on-screen label. | core/types/src/utils/D3plusConfig.d.ts:463 |
| <a id="property-searchcontrolclassname"></a> `searchControlClassName?` | `string` | Additional CSS class name(s) applied to the search toggle button and input, alongside the fixed `search-control` classes. | core/types/src/utils/D3plusConfig.d.ts:465 |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | core/types/src/utils/D3plusConfig.d.ts:467 |
| `shapeConfig.duration?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:468 |
| <a id="property-shapesort"></a> `shapeSort?` | (`a`: `string`, `b`: `string`) => `number` | A [sort comparator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape class (e.g. "Circle", "Line") as its arguments. Shapes are drawn in groups by type, so this defines the layering order for all shapes of a given type. | core/types/src/utils/D3plusConfig.d.ts:477 |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | core/types/src/utils/D3plusConfig.d.ts:479 |
| <a id="property-sizelegend"></a> `sizeLegend?` | `boolean` \| ((`config`: [`D3plusConfig`](#d3plusconfig), `scale`: `SizeLegendScale`, `size`: `SizeLegendSize`) => `boolean`) | Controls size-legend visibility — the nested-circle key drawn in the bottom-right corner of charts that size their marks. Shown by default whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height; pass `true` to always show it, `false` to hide it, or a `(config, scale, size) => boolean` accessor. | core/types/src/utils/D3plusConfig.d.ts:488 |
| <a id="property-sizelegendconfig"></a> `sizeLegendConfig?` | [`SizeLegendConfig`](#sizelegendconfig-3) | Configuration for the size-legend component. | core/types/src/utils/D3plusConfig.d.ts:490 |
| <a id="property-sizelegendposition"></a> `sizeLegendPosition?` | `"right"` \| `"bottom"` | Which margin the size legend claims in the bottom-right corner: `"right"` (default) keeps the chart's full height, `"bottom"` its full width. | core/types/src/utils/D3plusConfig.d.ts:496 |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | core/types/src/utils/D3plusConfig.d.ts:498 |
| <a id="property-stackoffset"></a> `stackOffset?` | `string` \| ((`series`: `number`[][][], `order`: `number`[]) => `void`) | Vertical offset applied to stacked series. One of `"diverging"` (default — positive and negative values split around zero), `"none"`, `"expand"` (normalize each stack to 100%), `"silhouette"` (streamgraph), or `"wiggle"` (minimize slope changes); or a custom offset function. | core/types/src/utils/D3plusConfig.d.ts:505 |
| <a id="property-stackorder"></a> `stackOrder?` | `string` \| `string`[] \| \{ `order?`: `"ascending"` \| `"descending"`; `value`: `string` \| ((`d`: [`DataPoint`](#datapoint)) => `unknown`); \} \| ((`d`: [`DataPoint`](#datapoint)) => `unknown`) | Order of stacked series, from the bottom of the stack upward. Accepts a named order (`"descending"` [default] / `"ascending"` by summed value, `"key"` / `"keyReverse"` alphabetically, `"none"` / `"data"` for input order, or d3's `"insideOut"` / `"appearance"` / `"reverse"`), an Array of series keys for an explicit order, a value accessor, or a `{value, order}` config to rank series by an aggregate of any data field. | core/types/src/utils/D3plusConfig.d.ts:514 |
| <a id="property-subtitle"></a> `subtitle?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) | Subtitle text, or an accessor returning it. | core/types/src/utils/D3plusConfig.d.ts:519 |
| <a id="property-subtitlepadding"></a> `subtitlePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the subtitle uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:521 |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | core/types/src/utils/D3plusConfig.d.ts:523 |
| <a id="property-svgdesc"></a> `svgDesc?` | `string` | Accessible description applied to the root SVG (`<desc>`). | core/types/src/utils/D3plusConfig.d.ts:525 |
| <a id="property-svgtitle"></a> `svgTitle?` | `string` | Accessible title applied to the root SVG (`<title>`). | core/types/src/utils/D3plusConfig.d.ts:527 |
| <a id="property-tableview"></a> `tableView?` | `boolean` | Enables the top-left table-view toggle button, which swaps the chart for a static, scrollable `<table>` of its data. On by default for every chart. | core/types/src/utils/D3plusConfig.d.ts:529 |
| <a id="property-tableviewclassname"></a> `tableViewClassName?` | `string` | Additional CSS class name(s) applied to the `<table>` element rendered while in table view, alongside the fixed `d3plus-table-view-table` class. | core/types/src/utils/D3plusConfig.d.ts:531 |
| <a id="property-tableviewcontrolclassname"></a> `tableViewControlClassName?` | `string` | Additional CSS class name(s) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. | core/types/src/utils/D3plusConfig.d.ts:533 |
| <a id="property-tableviewcontrolstyle"></a> `tableViewControlStyle?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button. `false` removes all default styling. | core/types/src/utils/D3plusConfig.d.ts:535 |
| <a id="property-tableviewcontrolstyleactive"></a> `tableViewControlStyleActive?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button while active (showing the data table). `false` removes all default styling. | core/types/src/utils/D3plusConfig.d.ts:537 |
| <a id="property-tableviewcontrolstylehover"></a> `tableViewControlStyleHover?` | `false` \| `Record`\<`string`, `unknown`\> | CSS key/value pairs styling the table-view toggle button on hover. `false` removes all default styling. | core/types/src/utils/D3plusConfig.d.ts:539 |
| <a id="property-tableviewdownload"></a> `tableViewDownload?` | `boolean` | Whether the data table shows a "download CSV" button, exporting its full (sorted, unpaginated) rows. On by default. | core/types/src/utils/D3plusConfig.d.ts:541 |
| <a id="property-tableviewpagesize"></a> `tableViewPageSize?` | `number` \| `false` | Rows per page while in table view. `false` (or any non-positive number) disables pagination and shows every row on one page. | core/types/src/utils/D3plusConfig.d.ts:543 |
| <a id="property-tableviewsort"></a> `tableViewSort?` | `boolean` | Whether the data table's column headers are clickable to sort (toggling asc/desc). On by default. | core/types/src/utils/D3plusConfig.d.ts:545 |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | core/types/src/utils/D3plusConfig.d.ts:547 |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `string`) | Label for the threshold group, or a `(datum, index)` accessor. | core/types/src/utils/D3plusConfig.d.ts:549 |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | core/types/src/utils/D3plusConfig.d.ts:560 |
| <a id="property-tileurl"></a> `tileUrl?` | `string` \| \{ `dark`: `string`; `light`: `string`; \} | URL template for XYZ map tiles, with `{z}`, `{x}`, `{y}` (and optional `{s}` subdomain) placeholders — or a `{light, dark}` pair, chosen by the chart's backdrop. Defaults to Esri's Light Gray and Dark Gray Canvas. | core/types/src/utils/D3plusConfig.d.ts:555 |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | core/types/src/utils/D3plusConfig.d.ts:562 |
| <a id="property-timefilter"></a> `timeFilter?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) | Predicate filtering which time slices are shown, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:564 |
| <a id="property-timeline"></a> `timeline?` | `boolean` | Whether to show the timeline component. | core/types/src/utils/D3plusConfig.d.ts:566 |
| <a id="property-timelinepadding"></a> `timelinePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the timeline uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:568 |
| <a id="property-title-1"></a> `title?` | `string` \| ((`data`: [`DataPoint`](#datapoint)[]) => `string`) | Chart title or title accessor function. | core/types/src/utils/D3plusConfig.d.ts:570 |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | core/types/src/utils/D3plusConfig.d.ts:572 |
| <a id="property-titlepadding"></a> `titlePadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the title uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:574 |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) | Whether to show tooltips, or a `(datum, index)` accessor deciding per mark. | core/types/src/utils/D3plusConfig.d.ts:576 |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | [`TooltipConfig`](#tooltipconfig-3) | Configuration for the tooltip component. | core/types/src/utils/D3plusConfig.d.ts:578 |
| <a id="property-tooltipshared"></a> `tooltipShared?` | `boolean` | Whether hovering a Plot's plot area shows one tooltip listing every series' value at the nearest discrete-axis position, with a crosshair through it. Applies when a discrete axis is set and at least two series share that position. | core/types/src/utils/D3plusConfig.d.ts:585 |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | core/types/src/utils/D3plusConfig.d.ts:601 |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | core/types/src/utils/D3plusConfig.d.ts:603 |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | core/types/src/utils/D3plusConfig.d.ts:605 |
| <a id="property-totalpadding"></a> `totalPadding?` | `boolean` \| ((`viz`: `VizBase`) => `boolean`) | Whether the total uses the visualization's internal padding when positioning, or an accessor receiving the viz. | core/types/src/utils/D3plusConfig.d.ts:607 |
| <a id="property-trendline"></a> `trendLine?` | `boolean` \| `"linear"` \| `"exponential"` \| `"logarithmic"` \| `"power"` \| `"polynomial"` | Draws an automatic trend line fit to the plotted data: `true` (or `"linear"`) for a least-squares line, or `"exponential"`, `"logarithmic"`, `"power"`, or `"polynomial"`. `false` removes it. | core/types/src/utils/D3plusConfig.d.ts:591 |
| <a id="property-trendlineconfig"></a> `trendLineConfig?` | [`TrendLineConfig`](#trendlineconfig-1) | Options for the trend lines: `group` (`"series"` or `"all"`), the polynomial `order`, a `confidence` band with `confidenceLevel` and `confidenceConfig`, a `projection` into the future with `projectionConfig`, `tooltip`, and Line styles (`stroke`, `strokeWidth`, `strokeDasharray`, …). | core/types/src/utils/D3plusConfig.d.ts:599 |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | core/types/src/utils/D3plusConfig.d.ts:609 |
| <a id="property-width-2"></a> `width?` | `number` | Overall width of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:611 |
| <a id="property-x-6"></a> `x?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `unknown`) | Key, index, or accessor function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:613 |
| <a id="property-x2domain"></a> `x2Domain?` | (`number` \| `Date`)[] | The x2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:619 |
| <a id="property-x2sort"></a> `x2Sort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Defines a custom sorting comparator function for discrete x2 axes. | core/types/src/utils/D3plusConfig.d.ts:623 |
| <a id="property-xconfig"></a> `xConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the x-axis. | core/types/src/utils/D3plusConfig.d.ts:615 |
| <a id="property-xdomain"></a> `xDomain?` | (`number` \| `Date`)[] | The x domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:617 |
| <a id="property-xsort"></a> `xSort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:621 |
| <a id="property-y-6"></a> `y?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `unknown`) | Key, index, or accessor function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:625 |
| <a id="property-y2domain"></a> `y2Domain?` | (`number` \| `Date`)[] | The y2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:631 |
| <a id="property-y2sort"></a> `y2Sort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Defines a custom sorting comparator function for discrete y2 axes. | core/types/src/utils/D3plusConfig.d.ts:635 |
| <a id="property-yconfig"></a> `yConfig?` | [`AxisConfig`](#axisconfig-2) | Configuration for the y-axis. | core/types/src/utils/D3plusConfig.d.ts:627 |
| <a id="property-ydomain"></a> `yDomain?` | (`number` \| `Date`)[] | The y domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:629 |
| <a id="property-ysort"></a> `ySort?` | (`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number` | Custom sort function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:633 |
| <a id="property-zoom"></a> `zoom?` | `boolean` | Enables pan/zoom with zoom-control buttons. On by default for every chart. | core/types/src/utils/D3plusConfig.d.ts:637 |
| <a id="property-zoomcontrolclassname"></a> `zoomControlClassName?` | `string` | Additional CSS class name(s) applied to each zoom control button, alongside the fixed `zoom-control`/`zoom-in`/etc. classes. | core/types/src/utils/D3plusConfig.d.ts:639 |
| <a id="property-zoomcontrolicons"></a> `zoomControlIcons?` | `Partial`\<`Record`\<`"zoomIn"` \| `"zoomOut"` \| `"zoomReset"` \| `"zoomBrush"`, `string` \| ((`el`: `HTMLElement`) => `void` \| (() => `void`))\>\> | Overrides one or more of the four built-in zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline SVGs. Each value is either raw HTML — used as that button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it — return a cleanup function if there's teardown to do. | core/types/src/utils/D3plusConfig.d.ts:649 |
| <a id="property-zoomfactor"></a> `zoomFactor?` | `number` | Multiplier applied to programmatic zoom steps. | core/types/src/utils/D3plusConfig.d.ts:651 |
| <a id="property-zoommax"></a> `zoomMax?` | `number` | Maximum zoom scale factor. Defaults to the scale at which the smallest shape fills the chart area. | core/types/src/utils/D3plusConfig.d.ts:653 |
| <a id="property-zoompan"></a> `zoomPan?` | `boolean` | Whether panning (drag) is enabled while zoomed. | core/types/src/utils/D3plusConfig.d.ts:655 |
| <a id="property-zoomscroll"></a> `zoomScroll?` | `boolean` \| `"modifier"` | Whether the mouse wheel (and one-finger touch) zooms. `"modifier"` (the default) leaves page scrolling alone: only Ctrl/⌘ + wheel or a trackpad/two-finger pinch zooms, and one finger pans only once zoomed in. `true` zooms on any wheel; `false` never does. | core/types/src/utils/D3plusConfig.d.ts:662 |

***

<a id="d3plusinstance"></a>

### D3plusInstance

Defined in: dom/types/src/renderer.d.ts:7

A minimal structural interface for the d3plus class instances that the
framework wrappers drive. Every visualization, component, and shape exposes
`.config()`; charts additionally expose `.render()` and `.destroy()`, plus
loader methods (`data()`, `links()`, …) for their data-like fields.

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Methods

<a id="config-24"></a>

##### config()

> **config**(`c`: `Record`\<`string`, `unknown`\>): `unknown`

Defined in: dom/types/src/renderer.d.ts:8

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `c` | `Record`\<`string`, `unknown`\> |

###### Returns

`unknown`

<a id="destroy-2"></a>

##### destroy()?

> `optional` **destroy**(): `unknown`

Defined in: dom/types/src/renderer.d.ts:10

###### Returns

`unknown`

<a id="render-22"></a>

##### render()?

> `optional` **render**(`callback?`: () => `void`): `unknown`

Defined in: dom/types/src/renderer.d.ts:9

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback?` | () => `void` |

###### Returns

`unknown`

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

Defined in: core/types/src/shapes/shapeConfig.d.ts:180

Image-specific config (url + dimensions).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-6"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:181 |
| <a id="property-duration-5"></a> `duration?` | `number` | - | core/types/src/shapes/shapeConfig.d.ts:182 |
| <a id="property-height-3"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:183 |
| <a id="property-id-4"></a> `id?` | `AccessorFn` | - | core/types/src/shapes/shapeConfig.d.ts:184 |
| <a id="property-opacity-4"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:185 |
| <a id="property-pointerevents-4"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | core/types/src/shapes/shapeConfig.d.ts:186 |
| <a id="property-select-5"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:187 |
| <a id="property-url"></a> `url?` | `AccessorFn` | URL accessor returning the image src. | core/types/src/shapes/shapeConfig.d.ts:189 |
| <a id="property-width-3"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:190 |
| <a id="property-x-7"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:191 |
| <a id="property-y-7"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:192 |

***

<a id="legendconfig-4"></a>

### LegendConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:181

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active-5"></a> `active?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `boolean`) | The active method for all shapes. | core/types/src/utils/D3plusConfig.d.ts:183 |
| <a id="property-hover-5"></a> `hover?` | `false` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`) => `boolean`) | The hover method for all shapes. | core/types/src/utils/D3plusConfig.d.ts:185 |
| <a id="property-shape"></a> `shape?` | `Accessor`\<`string`\> | The shape type used for each legend entry. | core/types/src/utils/D3plusConfig.d.ts:187 |

***

<a id="lineconfig-3"></a>

### LineConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:154

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
| <a id="property-backgroundimagefit-4"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-curve-1"></a> `curve?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:155 |
| <a id="property-data-7"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-defined-1"></a> `defined?` | `AccessorFn` | - | - | core/types/src/shapes/shapeConfig.d.ts:156 |
| <a id="property-discrete-5"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-6"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-4"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-4"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-hitarea-4"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-6"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-4"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-4"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-5"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-6"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-4"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-4"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-6"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-5"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-5"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode-4"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-4"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-4"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-4"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-4"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-6"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-6"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-4"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-4"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-4"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-4"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-4"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-4"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-4"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-4"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-4"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-4"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-vectoreffect-4"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-4"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-x-8"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-y-8"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:131 |

***

<a id="margin"></a>

### Margin

Defined in: core/types/src/charts/viz/vizTypes.d.ts:37

Margin object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom"></a> `bottom` | `number` | core/types/src/charts/viz/vizTypes.d.ts:39 |
| <a id="property-left"></a> `left` | `number` | core/types/src/charts/viz/vizTypes.d.ts:40 |
| <a id="property-right"></a> `right` | `number` | core/types/src/charts/viz/vizTypes.d.ts:41 |
| <a id="property-top"></a> `top` | `number` | core/types/src/charts/viz/vizTypes.d.ts:38 |

***

<a id="mergeddatapoint"></a>

### MergedDataPoint

Defined in: data/types/src/merge.d.ts:4

#### Indexable

> \[`key`: `string`\]: `MergedValue`

***

<a id="negativespaceoptions"></a>

### NegativeSpaceOptions

Defined in: math/types/src/negativeSpace.d.ts:9

Options for `negativeSpace`: padding, minimum box size, grid resolution, and extra boxes to avoid.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-divisions"></a> `divisions?` | `number` | Number of evenly spaced grid lines added per axis, so the hull's diagonal edges are resolved finely. Default 48. | math/types/src/negativeSpace.d.ts:17 |
| <a id="property-exclude"></a> `exclude?` | [`Bounds`](#bounds)[] | Other boxes to keep clear of, each on its own rather than as part of the marks' hull (e.g. controls overlaid on the chart). | math/types/src/negativeSpace.d.ts:19 |
| <a id="property-minheight"></a> `minHeight?` | `number` | Smallest height a returned box may have. Default 1. | math/types/src/negativeSpace.d.ts:15 |
| <a id="property-minwidth"></a> `minWidth?` | `number` | Smallest width a returned box may have. Default 1. | math/types/src/negativeSpace.d.ts:13 |
| <a id="property-padding"></a> `padding?` | `number` | Space kept clear around every obstacle, in pixels. Default 0. | math/types/src/negativeSpace.d.ts:11 |

***

<a id="padding"></a>

### Padding

Defined in: core/types/src/charts/viz/vizTypes.d.ts:44

Padding object with all four sides.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bottom-1"></a> `bottom` | `number` | core/types/src/charts/viz/vizTypes.d.ts:46 |
| <a id="property-left-1"></a> `left` | `number` | core/types/src/charts/viz/vizTypes.d.ts:47 |
| <a id="property-right-1"></a> `right` | `number` | core/types/src/charts/viz/vizTypes.d.ts:48 |
| <a id="property-top-1"></a> `top` | `number` | core/types/src/charts/viz/vizTypes.d.ts:45 |

***

<a id="pathconfig-1"></a>

### PathConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:169

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
| <a id="property-backgroundimagefit-5"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-d"></a> `d?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:170 |
| <a id="property-data-8"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-6"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-7"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-5"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-5"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-hitarea-5"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-7"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-5"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-5"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-6"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-7"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-5"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-5"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-7"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-6"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-6"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode-5"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-5"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-5"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-5"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-5"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-7"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-7"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-5"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-5"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-5"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-5"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-5"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-5"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-5"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-5"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-5"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-5"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-vectoreffect-5"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-5"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-x-9"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-y-9"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:131 |

***

<a id="rectconfig-3"></a>

### RectConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:137

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
| <a id="property-backgroundimagefit-6"></a> `backgroundImageFit?` | [`ConstOrAccessor`](#constoraccessor)\<`"cover"` \| `"contain"`\> | How a `backgroundImage` fits its shape: `"cover"` (default) fills the shape's bounding box, cropping the overflow and clipping to the outline; `"contain"` fits the whole image, centered and fully visible, inside the shape's largest inscribed rectangle. | [`BaseShapeConfig`](#baseshapeconfig).[`backgroundImageFit`](#property-backgroundimagefit-2) | core/types/src/shapes/shapeConfig.d.ts:61 |
| <a id="property-data-9"></a> `data?` | [`DataPoint`](#datapoint)[] | Data array driving the shape. | [`BaseShapeConfig`](#baseshapeconfig).[`data`](#property-data-2) | core/types/src/shapes/shapeConfig.d.ts:44 |
| <a id="property-discrete-7"></a> `discrete?` | `"x"` \| `"y"` | Discrete-axis key ("x" | "y") for charts that flip layout per axis. | [`BaseShapeConfig`](#baseshapeconfig).[`discrete`](#property-discrete-2) | core/types/src/shapes/shapeConfig.d.ts:63 |
| <a id="property-duration-8"></a> `duration?` | `number` | Animation duration in ms. | [`BaseShapeConfig`](#baseshapeconfig).[`duration`](#property-duration-2) | core/types/src/shapes/shapeConfig.d.ts:65 |
| <a id="property-fill-6"></a> `fill?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Fill color or accessor returning one. | [`BaseShapeConfig`](#baseshapeconfig).[`fill`](#property-fill-2) | core/types/src/shapes/shapeConfig.d.ts:67 |
| <a id="property-fillopacity-6"></a> `fillOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Fill opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`fillOpacity`](#property-fillopacity-2) | core/types/src/shapes/shapeConfig.d.ts:69 |
| <a id="property-height-4"></a> `height?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:139 |
| <a id="property-hitarea-6"></a> `hitArea?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\>) | Hit-area shape: function returning bounds or static bounds. | [`BaseShapeConfig`](#baseshapeconfig).[`hitArea`](#property-hitarea-2) | core/types/src/shapes/shapeConfig.d.ts:77 |
| <a id="property-hover-8"></a> `hover?` | ((`d`: [`DataPoint`](#datapoint), `i`: `number`) => `boolean`) \| `null` | Predicate or null marking which data points are currently hovered. | [`BaseShapeConfig`](#baseshapeconfig).[`hover`](#property-hover-2) | core/types/src/shapes/shapeConfig.d.ts:71 |
| <a id="property-hoveropacity-6"></a> `hoverOpacity?` | `number` | Opacity applied to non-hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverOpacity`](#property-hoveropacity-2) | core/types/src/shapes/shapeConfig.d.ts:73 |
| <a id="property-hoverstyle-6"></a> `hoverStyle?` | `Record`\<`string`, `unknown`\> | Style overrides for hovered data points. | [`BaseShapeConfig`](#baseshapeconfig).[`hoverStyle`](#property-hoverstyle-2) | core/types/src/shapes/shapeConfig.d.ts:75 |
| <a id="property-id-7"></a> `id?` | `AccessorFn` | Unique-id accessor per datum (used for keyed enter/update/exit). | [`BaseShapeConfig`](#baseshapeconfig).[`id`](#property-id-2) | core/types/src/shapes/shapeConfig.d.ts:79 |
| <a id="property-label-8"></a> `label?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `false` \| `string`[]\> | Label text(s) per datum. False/undefined skips. | [`BaseShapeConfig`](#baseshapeconfig).[`label`](#property-label-3) | core/types/src/shapes/shapeConfig.d.ts:81 |
| <a id="property-labelbounds-6"></a> `labelBounds?` | `Record`\<`string`, `unknown`\> \| ((`d`: [`DataPoint`](#datapoint), `i`: `number`, `aes`: `unknown`) => `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]) | Label-bounds accessor (where to mount the label). | [`BaseShapeConfig`](#baseshapeconfig).[`labelBounds`](#property-labelbounds-2) | core/types/src/shapes/shapeConfig.d.ts:83 |
| <a id="property-labelconfig-6"></a> `labelConfig?` | `Record`\<`string`, `unknown`\> | Label TextBox config (font, padding, etc.). | [`BaseShapeConfig`](#baseshapeconfig).[`labelConfig`](#property-labelconfig-2) | core/types/src/shapes/shapeConfig.d.ts:85 |
| <a id="property-on-8"></a> `on?` | `Record`\<`string`, (...`args`: `unknown`[]) => `unknown`\> | Event handlers (Object.<event, handler>). | [`BaseShapeConfig`](#baseshapeconfig).[`on`](#property-on-2) | core/types/src/shapes/shapeConfig.d.ts:133 |
| <a id="property-opacity-7"></a> `opacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Overall opacity (0..1). | [`BaseShapeConfig`](#baseshapeconfig).[`opacity`](#property-opacity-2) | core/types/src/shapes/shapeConfig.d.ts:87 |
| <a id="property-pointerevents-7"></a> `pointerEvents?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `pointer-events` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`pointerEvents`](#property-pointerevents-2) | core/types/src/shapes/shapeConfig.d.ts:89 |
| <a id="property-rendermode-6"></a> `renderMode?` | `"full"` \| `"compute"` | "full" runs the DOM enter/update/exit; "compute" skips DOM. | [`BaseShapeConfig`](#baseshapeconfig).[`renderMode`](#property-rendermode-2) | core/types/src/shapes/shapeConfig.d.ts:101 |
| <a id="property-role-6"></a> `role?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | ARIA role per datum (accessibility). | [`BaseShapeConfig`](#baseshapeconfig).[`role`](#property-role-2) | core/types/src/shapes/shapeConfig.d.ts:91 |
| <a id="property-rotate-6"></a> `rotate?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Rotation in degrees per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`rotate`](#property-rotate-2) | core/types/src/shapes/shapeConfig.d.ts:93 |
| <a id="property-rx-6"></a> `rx?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`rx`](#property-rx-2) | core/types/src/shapes/shapeConfig.d.ts:95 |
| <a id="property-ry-6"></a> `ry?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. | [`BaseShapeConfig`](#baseshapeconfig).[`ry`](#property-ry-2) | core/types/src/shapes/shapeConfig.d.ts:97 |
| <a id="property-scale-8"></a> `scale?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Scale factor (1 = identity). | [`BaseShapeConfig`](#baseshapeconfig).[`scale`](#property-scale-3) | core/types/src/shapes/shapeConfig.d.ts:99 |
| <a id="property-select-8"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | Where to mount the shape's DOM (CSS selector, element, or null). | [`BaseShapeConfig`](#baseshapeconfig).[`select`](#property-select-2) | core/types/src/shapes/shapeConfig.d.ts:103 |
| <a id="property-shaperendering-6"></a> `shapeRendering?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `shape-rendering` attribute per datum. | [`BaseShapeConfig`](#baseshapeconfig).[`shapeRendering`](#property-shaperendering-2) | core/types/src/shapes/shapeConfig.d.ts:105 |
| <a id="property-sort-6"></a> `sort?` | ((`a`: [`DataPoint`](#datapoint), `b`: [`DataPoint`](#datapoint)) => `number`) \| `null` | d3-style sort comparator. | [`BaseShapeConfig`](#baseshapeconfig).[`sort`](#property-sort-2) | core/types/src/shapes/shapeConfig.d.ts:107 |
| <a id="property-stroke-6"></a> `stroke?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Stroke color. | [`BaseShapeConfig`](#baseshapeconfig).[`stroke`](#property-stroke-2) | core/types/src/shapes/shapeConfig.d.ts:109 |
| <a id="property-strokedasharray-6"></a> `strokeDasharray?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-dasharray`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeDasharray`](#property-strokedasharray-2) | core/types/src/shapes/shapeConfig.d.ts:111 |
| <a id="property-strokelinecap-6"></a> `strokeLinecap?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `stroke-linecap`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeLinecap`](#property-strokelinecap-2) | core/types/src/shapes/shapeConfig.d.ts:113 |
| <a id="property-strokeopacity-6"></a> `strokeOpacity?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | SVG `stroke-opacity`. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeOpacity`](#property-strokeopacity-2) | core/types/src/shapes/shapeConfig.d.ts:115 |
| <a id="property-strokewidth-6"></a> `strokeWidth?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Stroke width in pixels. | [`BaseShapeConfig`](#baseshapeconfig).[`strokeWidth`](#property-strokewidth-2) | core/types/src/shapes/shapeConfig.d.ts:117 |
| <a id="property-textanchor-6"></a> `textAnchor?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `text-anchor` for labels. | [`BaseShapeConfig`](#baseshapeconfig).[`textAnchor`](#property-textanchor-2) | core/types/src/shapes/shapeConfig.d.ts:119 |
| <a id="property-texture-6"></a> `texture?` | [`ConstOrAccessor`](#constoraccessor)\<`string` \| `Record`\<`string`, `unknown`\>\> | Texture (per textures.js) — name string or full config. | [`BaseShapeConfig`](#baseshapeconfig).[`texture`](#property-texture-2) | core/types/src/shapes/shapeConfig.d.ts:121 |
| <a id="property-texturedefault-6"></a> `textureDefault?` | `Record`\<`string`, `unknown`\> | Default texture config merged into the per-datum texture. | [`BaseShapeConfig`](#baseshapeconfig).[`textureDefault`](#property-texturedefault-2) | core/types/src/shapes/shapeConfig.d.ts:123 |
| <a id="property-trail-2"></a> `trail?` | `boolean` | Sweep a tapering motion trail behind the rect as it moves between frames. | - | core/types/src/shapes/shapeConfig.d.ts:141 |
| <a id="property-trailpersist-2"></a> `trailPersist?` | `number` \| `boolean` | Steps of trail history to keep (number), or `true` for a long fading tail. | - | core/types/src/shapes/shapeConfig.d.ts:143 |
| <a id="property-vectoreffect-6"></a> `vectorEffect?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | SVG `vector-effect` (e.g. "non-scaling-stroke"). | [`BaseShapeConfig`](#baseshapeconfig).[`vectorEffect`](#property-vectoreffect-2) | core/types/src/shapes/shapeConfig.d.ts:125 |
| <a id="property-verticalalign-6"></a> `verticalAlign?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | Label vertical-align ("top"/"middle"/"bottom"). | [`BaseShapeConfig`](#baseshapeconfig).[`verticalAlign`](#property-verticalalign-2) | core/types/src/shapes/shapeConfig.d.ts:127 |
| <a id="property-width-4"></a> `width?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | - | core/types/src/shapes/shapeConfig.d.ts:138 |
| <a id="property-x-10"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | X position. | [`BaseShapeConfig`](#baseshapeconfig).[`x`](#property-x-2) | core/types/src/shapes/shapeConfig.d.ts:129 |
| <a id="property-y-10"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Y position. | [`BaseShapeConfig`](#baseshapeconfig).[`y`](#property-y-2) | core/types/src/shapes/shapeConfig.d.ts:131 |

***

<a id="regressionoptions"></a>

### RegressionOptions

Defined in: math/types/src/regression.d.ts:22

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-order"></a> `order?` | `number` | The polynomial order (degree), used when `type` is "polynomial". Defaults to 2. | math/types/src/regression.d.ts:24 |

***

<a id="regressionresult"></a>

### RegressionResult

Defined in: math/types/src/regression.d.ts:2

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-coefficients"></a> `coefficients` | `number`[] | The fitted coefficients, in original units: - linear / polynomial: `[c0, c1, …]` for `y = c0 + c1·x + c2·x² …` - exponential: `[a, b]` for `y = a·e^(b·x)` - logarithmic: `[a, b]` for `y = a + b·ln(x)` - power: `[a, b]` for `y = a·x^b` | math/types/src/regression.d.ts:12 |
| <a id="property-extent"></a> `extent` | \[`number`, `number`\] | The smallest and largest x values used in the fit. | math/types/src/regression.d.ts:20 |
| <a id="property-n"></a> `n` | `number` | The number of points used in the fit. | math/types/src/regression.d.ts:18 |
| <a id="property-predict"></a> `predict` | (`x`: `number`) => `number` | Predicts y for a given x. | math/types/src/regression.d.ts:14 |
| <a id="property-r2"></a> `r2` | `number` | The coefficient of determination, measured in original y units. | math/types/src/regression.d.ts:16 |
| <a id="property-type"></a> `type` | [`RegressionType`](#regressiontype) | The type of regression that was fit. | math/types/src/regression.d.ts:4 |

***

<a id="sizelegendconfig-3"></a>

### SizeLegendConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:189

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-labelconfig-7"></a> `labelConfig?` | `SizeLegendTextConfig` | Value-label font: `fontColor`, `fontFamily`, `fontSize`. | core/types/src/utils/D3plusConfig.d.ts:205 |
| <a id="property-labelpadding"></a> `labelPadding?` | `number` | Gap between each leader line and its label, in pixels. | core/types/src/utils/D3plusConfig.d.ts:212 |
| <a id="property-lineconfig"></a> `lineConfig?` | `SizeLegendLineConfig` | Leader-line paint: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. | core/types/src/utils/D3plusConfig.d.ts:203 |
| <a id="property-linelength"></a> `lineLength?` | `number` | Length of the leader lines past the largest circle, in pixels. | core/types/src/utils/D3plusConfig.d.ts:210 |
| <a id="property-padding-1"></a> `padding?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:208 |
| <a id="property-shapeconfig-1"></a> `shapeConfig?` | `SizeLegendShapeConfig` | Circle paint: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. | core/types/src/utils/D3plusConfig.d.ts:201 |
| <a id="property-tickformat-1"></a> `tickFormat?` | (`value`: `number`) => `string` | Formats each value's label. Defaults to the locale's abbreviated number format. | core/types/src/utils/D3plusConfig.d.ts:197 |
| <a id="property-title-2"></a> `title?` | `string` | Title above the circles. Defaults to the `size` key when `size` is set to a string. | core/types/src/utils/D3plusConfig.d.ts:199 |
| <a id="property-titleconfig-1"></a> `titleConfig?` | `SizeLegendTextConfig` | Title font: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. | core/types/src/utils/D3plusConfig.d.ts:207 |
| <a id="property-values"></a> `values?` | `number` \| `number`[] \| ((`domain`: \[`number`, `number`\]) => `number`[]) | The values to draw circles for: an array of values, how many to pick from the size domain (default 3: its min, max, and a round middle), or a function receiving the `[min, max]` domain and returning values. | core/types/src/utils/D3plusConfig.d.ts:195 |

***

<a id="textboxconfig-1"></a>

### TextBoxConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:90

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ellipsis"></a> `ellipsis?` | (`text`: `string`, `line`: `number`) => `string` | Handles truncated lines, returning the new line value. Passed the line's text and number; by default appends an ellipsis to every line except a first word that cannot fit (which returns ""). | core/types/src/utils/D3plusConfig.d.ts:128 |
| <a id="property-fontcolor"></a> `fontColor?` | `Accessor`\<`string`\> | The font color as an accessor function or static string. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:94 |
| <a id="property-fontfamily"></a> `fontFamily?` | `Accessor`\<`string` \| `string`[]\> | The font-family to use: a font name, a comma-separated list of fallbacks, an array of fallbacks, or an accessor returning a string or array. The first available font on the client is used. | core/types/src/utils/D3plusConfig.d.ts:102 |
| <a id="property-fontmax"></a> `fontMax?` | `number` | The maximum font size in pixels, used when dynamically resizing fonts. | core/types/src/utils/D3plusConfig.d.ts:108 |
| <a id="property-fontmin"></a> `fontMin?` | `number` | The minimum font size in pixels, used when dynamically resizing fonts. | core/types/src/utils/D3plusConfig.d.ts:106 |
| <a id="property-fontopacity"></a> `fontOpacity?` | `Accessor`\<`number`\> | The font opacity as an accessor function or static number between 0 and 1. | core/types/src/utils/D3plusConfig.d.ts:112 |
| <a id="property-fontresize"></a> `fontResize?` | `Accessor`\<`boolean`\> | Toggles font resizing — a static boolean, or an accessor returning a boolean. | core/types/src/utils/D3plusConfig.d.ts:110 |
| <a id="property-fontsize"></a> `fontSize?` | `Accessor`\<`number`\> | The font size in pixels. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:96 |
| <a id="property-fontstroke"></a> `fontStroke?` | `Accessor`\<`string`\> | The font stroke color for the rendered text. | core/types/src/utils/D3plusConfig.d.ts:114 |
| <a id="property-fontstrokewidth"></a> `fontStrokeWidth?` | `Accessor`\<`number`\> | The font stroke width for the rendered text. | core/types/src/utils/D3plusConfig.d.ts:116 |
| <a id="property-fontweight"></a> `fontWeight?` | `Accessor`\<`string` \| `number`\> | The font weight. Inferred from the DOM selection by default. | core/types/src/utils/D3plusConfig.d.ts:104 |
| <a id="property-height-5"></a> `height?` | `Accessor`\<`number`\> | The height for each text box. | core/types/src/utils/D3plusConfig.d.ts:138 |
| <a id="property-lineheight"></a> `lineHeight?` | `Accessor`\<`number`\> | The line height, which is 1.2 times the font size by default. | core/types/src/utils/D3plusConfig.d.ts:118 |
| <a id="property-maxlines"></a> `maxLines?` | `Accessor`\<`number` \| `null`\> | Restricts the maximum number of lines to wrap onto; null (unlimited) by default. | core/types/src/utils/D3plusConfig.d.ts:120 |
| <a id="property-overflow"></a> `overflow?` | `Accessor`\<`boolean`\> | Whether text is allowed to overflow its bounding box. | core/types/src/utils/D3plusConfig.d.ts:122 |
| <a id="property-padding-2"></a> `padding?` | `Accessor`\<`string` \| `number`\> | The padding as a CSS shorthand string or number. Defaults to 0. | core/types/src/utils/D3plusConfig.d.ts:130 |
| <a id="property-rotateanchor"></a> `rotateAnchor?` | `Accessor`\<\[`number`, `number`\]\> | The anchor point around which to rotate the text box. | core/types/src/utils/D3plusConfig.d.ts:132 |
| <a id="property-split"></a> `split?` | (`text`: `string`) => `string`[] | The word split function: given a string, returns it split into an array of words. | core/types/src/utils/D3plusConfig.d.ts:134 |
| <a id="property-text"></a> `text?` | `Accessor`\<`string`\> | The text content for each box. | core/types/src/utils/D3plusConfig.d.ts:92 |
| <a id="property-width-5"></a> `width?` | `Accessor`\<`number`\> | The width for each text box. | core/types/src/utils/D3plusConfig.d.ts:136 |
| <a id="property-x-11"></a> `x?` | `Accessor`\<`number`\> | The x position (left edge) for each text box. | core/types/src/utils/D3plusConfig.d.ts:140 |
| <a id="property-y-11"></a> `y?` | `Accessor`\<`number`\> | The y position (top edge) for each text box. | core/types/src/utils/D3plusConfig.d.ts:142 |

***

<a id="timelineconfig-3"></a>

### TimelineConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:144

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-brushfilter"></a> `brushFilter?` | () => `boolean` | Brush event filter. | core/types/src/utils/D3plusConfig.d.ts:146 |
| <a id="property-brushmin"></a> `brushMin?` | `number` | The minimum number of ticks that can be highlighted when using "ticks" `buttonBehavior`. Helpful for x/y plots where selecting fewer than 2 time periods is undesirable. | core/types/src/utils/D3plusConfig.d.ts:152 |
| <a id="property-buttonalign"></a> `buttonAlign?` | `"start"` \| `"middle"` \| `"end"` | Toggles the horizontal alignment of the button timeline. | core/types/src/utils/D3plusConfig.d.ts:154 |
| <a id="property-buttonbehavior"></a> `buttonBehavior?` | `"auto"` \| `"buttons"` \| `"ticks"` | Toggles the style of the timeline. | core/types/src/utils/D3plusConfig.d.ts:156 |
| <a id="property-buttonheight"></a> `buttonHeight?` | `number` | Button height. | core/types/src/utils/D3plusConfig.d.ts:158 |
| <a id="property-buttonpadding"></a> `buttonPadding?` | `number` | Button padding. | core/types/src/utils/D3plusConfig.d.ts:160 |
| <a id="property-handleconfig"></a> `handleConfig?` | `Record`\<`string`, `unknown`\> | Handle style. | core/types/src/utils/D3plusConfig.d.ts:162 |
| <a id="property-handlesize"></a> `handleSize?` | `number` | Handle size. | core/types/src/utils/D3plusConfig.d.ts:164 |
| <a id="property-playbutton"></a> `playButton?` | `boolean` | Determines the visibility of the play button to the left of the timeline, which cycles through the available periods at a rate set by `playButtonInterval`. | core/types/src/utils/D3plusConfig.d.ts:169 |
| <a id="property-playbuttoninterval"></a> `playButtonInterval?` | `number` | The interval, in milliseconds, between periods when cycling via the play button. Used only when the chart's `duration` is 0 (no transition); otherwise playback steps once per `duration` so each step animates in full. | core/types/src/utils/D3plusConfig.d.ts:175 |
| <a id="property-selection"></a> `selection?` | `number` \| `false` \| `Date` \| (`number` \| `Date`)[] | The current selection. Defaults to the most recent period in the timeline. | core/types/src/utils/D3plusConfig.d.ts:177 |
| <a id="property-snapping"></a> `snapping?` | `boolean` | Toggles the snapping value. | core/types/src/utils/D3plusConfig.d.ts:179 |

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

Defined in: core/types/src/utils/D3plusConfig.d.ts:62

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-arrow"></a> `arrow?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The inner HTML content of the arrow element, empty by default. | core/types/src/utils/D3plusConfig.d.ts:64 |
| <a id="property-background"></a> `background?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The background color accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:66 |
| <a id="property-body"></a> `body?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | - | core/types/src/utils/D3plusConfig.d.ts:82 |
| <a id="property-border"></a> `border?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The border accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:68 |
| <a id="property-borderradius"></a> `borderRadius?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The border-radius accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:70 |
| <a id="property-footer"></a> `footer?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | The footer content accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:72 |
| <a id="property-maxwidth"></a> `maxWidth?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The max-width accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:74 |
| <a id="property-minwidth-1"></a> `minWidth?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The min-width accessor for each tooltip. | core/types/src/utils/D3plusConfig.d.ts:76 |
| <a id="property-offset"></a> `offset?` | `number` \| ((`d`: [`DataPoint`](#datapoint)) => `number`) | The pixel offset between the tooltip and its anchor point. | core/types/src/utils/D3plusConfig.d.ts:78 |
| <a id="property-padding-3"></a> `padding?` | `string` \| `number` \| ((`d`: [`DataPoint`](#datapoint)) => `string` \| `number`) | The inner padding of each tooltip. | core/types/src/utils/D3plusConfig.d.ts:80 |
| <a id="property-tbody"></a> `tbody?` | ((`d`: [`DataPoint`](#datapoint)) => \[`string`, `string`\][]) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`, `x?`: `object`) => `string`))[][] | - | core/types/src/utils/D3plusConfig.d.ts:86 |
| <a id="property-thead"></a> `thead?` | ((`d`: [`DataPoint`](#datapoint)) => \[`string`, `string`\][]) \| (`string` \| ((`d`: [`DataPoint`](#datapoint), `i?`: `number`, `x?`: `object`) => `string`))[][] | - | core/types/src/utils/D3plusConfig.d.ts:83 |
| <a id="property-title-3"></a> `title?` | `string` \| ((`d`: [`DataPoint`](#datapoint)) => `string`) | - | core/types/src/utils/D3plusConfig.d.ts:81 |

***

<a id="translationstrings"></a>

### TranslationStrings

Defined in: locales/types/src/dictionaries/translateLocale.d.ts:1

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-and"></a> `and` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:2 |
| <a id="property-back"></a> `Back` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:3 |
| <a id="property-brush-zoom"></a> `Brush Zoom` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:4 |
| <a id="property-clear"></a> `Clear` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:5 |
| <a id="property-click-to-expand"></a> `Click to Expand` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:6 |
| <a id="property-click-to-hide"></a> `Click to Hide` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:7 |
| <a id="property-click-to-highlight"></a> `Click to Highlight` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:8 |
| <a id="property-click-to-show"></a> `Click to Show` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:9 |
| <a id="property-click-to-show-all"></a> `Click to Show All` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:10 |
| <a id="property-count"></a> `Count` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:11 |
| <a id="property-density"></a> `Density` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:12 |
| <a id="property-download"></a> `Download` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:13 |
| <a id="property-equation"></a> `Equation` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:14 |
| <a id="property-exponential"></a> `Exponential` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:15 |
| <a id="property-linear"></a> `Linear` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:16 |
| <a id="property-loading-visualization"></a> `Loading Visualization` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:17 |
| <a id="property-logarithmic"></a> `Logarithmic` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:18 |
| <a id="property-match"></a> `Match` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:19 |
| <a id="property-matches"></a> `Matches` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:20 |
| <a id="property-more"></a> `more` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:21 |
| <a id="property-no-data-available"></a> `No Data Available` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:22 |
| <a id="property-no-matches"></a> `No Matches` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:23 |
| <a id="property-observations"></a> `Observations` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:24 |
| <a id="property-polynomial"></a> `Polynomial` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:25 |
| <a id="property-power"></a> `Power` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:26 |
| <a id="property-powered-by-d3plus"></a> `Powered by D3plus` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:27 |
| <a id="property-projected"></a> `Projected` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:28 |
| <a id="property-range-1"></a> `Range` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:29 |
| <a id="property-relative-frequency"></a> `Relative Frequency` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:30 |
| <a id="property-reset-zoom"></a> `Reset Zoom` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:31 |
| <a id="property-search-1"></a> `Search` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:32 |
| <a id="property-share"></a> `Share` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:33 |
| <a id="property-shiftclick-to-hide"></a> `Shift+Click to Hide` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:34 |
| <a id="property-shiftclick-to-highlight"></a> `Shift+Click to Highlight` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:35 |
| <a id="property-total"></a> `Total` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:36 |
| <a id="property-trend-line"></a> `Trend Line` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:37 |
| <a id="property-value-1"></a> `Value` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:38 |
| <a id="property-values-1"></a> `Values` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:39 |
| <a id="property-zoom-in"></a> `Zoom In` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:40 |
| <a id="property-zoom-out"></a> `Zoom Out` | `string` | locales/types/src/dictionaries/translateLocale.d.ts:41 |

***

<a id="trendlineconfig-1"></a>

### TrendLineConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:214

#### Indexable

> \[`key`: `string`\]: `unknown`

Other Line shape config.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence-1"></a> `confidence?` | `boolean` | Draws a confidence band around a linear fit. Defaults to `false`. | core/types/src/utils/D3plusConfig.d.ts:220 |
| <a id="property-confidenceconfig"></a> `confidenceConfig?` | `Record`\<`string`, `unknown`\> | Area shape config for the confidence band. Its fill defaults to the line color. | core/types/src/utils/D3plusConfig.d.ts:224 |
| <a id="property-confidencelevel"></a> `confidenceLevel?` | `number` | The confidence band's level, between 0 and 1. Defaults to 0.95. | core/types/src/utils/D3plusConfig.d.ts:222 |
| <a id="property-group"></a> `group?` | `"series"` \| `"all"` | `"series"` (default) fits one line per series, colored to match it; `"all"` fits one line to every point. Stacked charts always fit the stack totals. | core/types/src/utils/D3plusConfig.d.ts:216 |
| <a id="property-order-1"></a> `order?` | `number` | The polynomial degree when `trendLine` is `"polynomial"`. Defaults to 2. | core/types/src/utils/D3plusConfig.d.ts:218 |
| <a id="property-projection-1"></a> `projection?` | `number` \| \{ `to`: `string` \| `number` \| `Date`; \} | Extends each trend line past the end of its data: a number of steps (at the data's own spacing — the median gap between values, or the calendar interval of dates), or `{to}` an end value to step up to (a number, or on a time axis a Date or a parseable date such as a year). Widens the axis to fit. Ignored on a category axis. Defaults to `0` (off). | core/types/src/utils/D3plusConfig.d.ts:228 |
| <a id="property-projectionconfig"></a> `projectionConfig?` | `Record`\<`string`, `unknown`\> | Line shape config for the projected stretch, merged over the line's own styles. Defaults to `{strokeDasharray: "2 4"}`. | core/types/src/utils/D3plusConfig.d.ts:232 |
| <a id="property-stroke-7"></a> `stroke?` | `string` | Line color. Defaults to the series color (dark gray when `group` is `"all"`). | core/types/src/utils/D3plusConfig.d.ts:236 |
| <a id="property-strokedasharray-7"></a> `strokeDasharray?` | `string` | Line dash pattern. Defaults to `"6 4"`. | core/types/src/utils/D3plusConfig.d.ts:240 |
| <a id="property-strokewidth-7"></a> `strokeWidth?` | `number` | Line width in pixels. Defaults to 2. | core/types/src/utils/D3plusConfig.d.ts:238 |
| <a id="property-tooltip-1"></a> `tooltip?` | `boolean` | Shows the fitted equation, R², and observations when hovering a line. Defaults to `true`. | core/types/src/utils/D3plusConfig.d.ts:234 |

***

<a id="whiskerconfig-2"></a>

### WhiskerConfig

Defined in: core/types/src/shapes/shapeConfig.d.ts:214

Whisker-specific config.

#### Indexable

> \[`key`: `string`\]: `unknown`

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data-10"></a> `data?` | [`DataPoint`](#datapoint)[] | - | core/types/src/shapes/shapeConfig.d.ts:215 |
| <a id="property-endpoint"></a> `endpoint?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | End-cap shape name (e.g. "Rect"). | core/types/src/shapes/shapeConfig.d.ts:217 |
| <a id="property-endpointconfig"></a> `endpointConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:218 |
| <a id="property-length"></a> `length?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | Whisker length in pixels. | core/types/src/shapes/shapeConfig.d.ts:220 |
| <a id="property-lineconfig-1"></a> `lineConfig?` | `Record`\<`string`, `unknown`\> | - | core/types/src/shapes/shapeConfig.d.ts:221 |
| <a id="property-orient-1"></a> `orient?` | [`ConstOrAccessor`](#constoraccessor)\<`string`\> | - | core/types/src/shapes/shapeConfig.d.ts:222 |
| <a id="property-select-9"></a> `select?` | `string` \| `HTMLElement` \| `SVGElement` \| `null` | - | core/types/src/shapes/shapeConfig.d.ts:223 |
| <a id="property-x-12"></a> `x?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:224 |
| <a id="property-y-12"></a> `y?` | [`ConstOrAccessor`](#constoraccessor)\<`number`\> | - | core/types/src/shapes/shapeConfig.d.ts:225 |

## Type Aliases

<a id="anyshapeconfig"></a>

### AnyShapeConfig

> **AnyShapeConfig** = [`BaseShapeConfig`](#baseshapeconfig) \| [`RectConfig`](#rectconfig-3) \| [`CircleConfig`](#circleconfig-1) \| [`LineConfig`](#lineconfig-3) \| [`AreaConfig`](#areaconfig-1) \| [`PathConfig`](#pathconfig-1) \| [`BarConfig`](#barconfig-7) \| [`ImageConfig`](#imageconfig-1) \| [`BoxConfig`](#boxconfig-1) \| [`WhiskerConfig`](#whiskerconfig-2)

Defined in: core/types/src/shapes/shapeConfig.d.ts:233

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

<a id="colordefaultsconfig"></a>

### ColorDefaultsConfig

> **ColorDefaultsConfig** = `Partial`\<`Omit`\<[`ColorDefaults`](#colordefaults-23), `"scale"`\>\> & `object`

Defined in: core/types/src/utils/D3plusConfig.d.ts:260

`colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `scale?` | [`ColorDefaults`](#colordefaults-23)\[`"scale"`\] \| `string`[] | core/types/src/utils/D3plusConfig.d.ts:261 |

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

<a id="d3plusconstructor"></a>

### D3plusConstructor

> **D3plusConstructor** = (...`args`: `any`[]) => [`D3plusInstance`](#d3plusinstance)

Defined in: dom/types/src/renderer.d.ts:14

Constructor type for d3plus visualization, component, and shape classes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

#### Returns

[`D3plusInstance`](#d3plusinstance)

***

<a id="d3selection"></a>

### D3Selection

> **D3Selection** = `object`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:66

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:68

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:73

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

<a id="node"></a>

##### node()

> **node**(): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:67

###### Returns

`any`

<a id="on-23"></a>

##### on()

> **on**(`event`: `string`, `handler`: `any`): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:72

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:71

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `any` |

###### Returns

`any`

<a id="selectall"></a>

##### selectAll()

> **selectAll**(`selector`: `string`): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:70

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | `string` |

###### Returns

`any`

<a id="style"></a>

##### style()

> **style**(`name`: `string`, ...`args`: `any`[]): `any`

Defined in: core/types/src/charts/viz/vizTypes.d.ts:69

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

Defined in: core/types/src/charts/viz/vizTypes.d.ts:74

###### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

###### Returns

`any`

***

<a id="regressiontype"></a>

### RegressionType

> **RegressionType** = `"linear"` \| `"exponential"` \| `"logarithmic"` \| `"power"` \| `"polynomial"`

Defined in: math/types/src/regression.d.ts:1

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
