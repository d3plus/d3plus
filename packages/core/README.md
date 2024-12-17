# @d3plus/core

Data visualization made easy. A javascript library that extends the popular D3.js to enable fast and beautiful visualizations.

## Installing

If using npm, `npm install @d3plus/core`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/@d3plus/core/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/core@3).

```js
import modules from "@d3plus/core";
```

@d3plus/core can be loaded as a standalone library or bundled as part of [D3plus](https://github.com/d3plus/d3plus). ES modules, AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3plus` global is exported:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/core@3"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/). These examples are powered by the [d3plus-storybook](https://github.com/d3plus/d3plus-storybook/) repo, and PRs are always welcome. :beers:

## API Reference

##### 
* [AreaPlot](#AreaPlot)
* [BarChart](#BarChart)
* [BoxWhisker](#BoxWhisker)
* [BumpChart](#BumpChart)
* [Donut](#Donut)
* [Geomap](#Geomap)
* [LinePlot](#LinePlot)
* [Matrix](#Matrix)
* [Network](#Network)
* [Pack](#Pack)
* [Pie](#Pie)
* [Plot](#Plot)
* [Priestley](#Priestley)
* [Radar](#Radar)
* [RadialMatrix](#RadialMatrix)
* [Rings](#Rings)
* [Sankey](#Sankey)
* [StackedArea](#StackedArea)
* [Tree](#Tree)
* [Treemap](#Treemap)
* [Viz](#Viz)
* [Axis](#Axis)
* [AxisBottom](#AxisBottom)
* [AxisLeft](#AxisLeft)
* [AxisRight](#AxisRight)
* [AxisTop](#AxisTop)
* [ColorScale](#ColorScale)
* [Legend](#Legend)
* [Timeline](#Timeline)
* [Tooltip](#Tooltip)
* [Area](#Area)
* [Bar](#Bar)
* [Box](#Box)
* [Circle](#Circle)
* [Image](#Image)
* [Line](#Line)
* [Path](#Path)
* [Rect](#Rect)
* [Shape](#Shape)
* [Whisker](#Whisker)
* [TextBox](#TextBox)
* [BaseClass](#BaseClass) - An abstract class that contains some global methods and functionality.

##### 
* [defaultPadding](#defaultPadding) - Default padding logic that will return false if the screen is less than 600 pixels wide.
* [listify](#listify) - Turns an array of values into a list string.
* [_thresholdFunction](#_thresholdFunction) - Applies the threshold algorithm according to the type of chart used.
* [colorAdd](#colorAdd) - Adds two colors together.
* [colorAssign](#colorAssign) - Assigns a color to a value using a predefined set of defaults.
* [colorContrast](#colorContrast) - A set of default color values used when assigning colors based on data.
* [colorLegible](#colorLegible) - Darkens a color so that it will appear legible on a white background.
* [colorLighter](#colorLighter) - Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.
* [colorSubtract](#colorSubtract) - Subtracts one color from another.
* [generateReference](#generateReference) - Creates a reference element for popper.
* [isData](#isData) - Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.
* [dataConcat](#dataConcat) - Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.
* [dataFold](#dataFold) - Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.
* [isData](#isData) - Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.
* [dataLoad](#dataLoad) - Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.
* [merge](#merge) - Combines an Array of Objects together and returns a new Object.
* [assign](#assign) - A deeply recursive version of `Object.assign`.
* [attrize](#attrize) - Applies each key/value in an object as an attr.
* [date](#date) - Parses numbers and strings to valid Javascript Date objects.
* [elem](#elem) - Manages the enter/update/exit pattern for a single DOM element.
* [fontExists](#fontExists) - Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.
* [isObject](#isObject) - Detects if a variable is a javascript Object.
* [parseSides](#parseSides) - Converts a string of directional CSS shorthand values into an object with the values expanded.
* [prefix](#prefix) - Returns the appropriate CSS vendor prefix, given the current browser.
* [rtl](#rtl) - Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".
* [stylize](#stylize) - Applies each key/value in an object as a style.
* [htmlDecode](#htmlDecode) - Strips HTML and "un-escapes" escape characters.
* [textWidth](#textWidth) - Given a text string, returns the predicted pixel width of the string when placed into DOM.
* [format](#format) - An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.

The new specifier strings added by d3plus-format are:
 - `.3~a` - abbreviated decimal notation with a numeric suffix (ie. "k", "M", "B", etc). This is an alias of the `formatAbbreviate` function.
* [formatAbbreviate](#formatAbbreviate) - Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).
* [formatDate](#formatDate) - A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.
* [formatDefaultLocale](#formatDefaultLocale) - An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.
* [closest](#closest) - Finds the closest numeric value in an array.
* [largestRect](#largestRect) - An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.
* [lineIntersection](#lineIntersection) - Finds the intersection point (if there is one) of the lines p1q1 and p2q2.
* [path2polygon](#path2polygon) - Transforms a path string into an Array of points.
* [pointDistance](#pointDistance) - Calculates the pixel distance between two points.
* [pointDistanceSquared](#pointDistanceSquared) - Returns the squared euclidean distance between two points.
* [pointRotate](#pointRotate) - Rotates a point around a given origin.
* [polygonInside](#polygonInside) - Checks if one polygon is inside another polygon.
* [polygonRayCast](#polygonRayCast) - Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.
* [polygonRotate](#polygonRotate) - Rotates a point around a given origin.
* [segmentBoxContains](#segmentBoxContains) - Checks whether a point is inside the bounding box of a line segment.
* [segmentsIntersect](#segmentsIntersect) - Checks whether the line segments p1q1 && p2q2 intersect.
* [shapeEdgePoint](#shapeEdgePoint) - Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.
* [largestRect](#largestRect) - Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).
* [stringify](#stringify) - Coerces value into a String.
* [strip](#strip) - Removes all non ASCII characters from a string.
* [textSplit](#textSplit) - Splits a given sentence into an array of words.
* [textWrap](#textWrap) - Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.
* [titleCase](#titleCase) - Capitalizes the first letter of each word in a phrase/sentence.
* [trim](#trim) - Cross-browser implementation of [trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim).
* [trimLeft](#trimLeft) - Cross-browser implementation of [trimLeft](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft).
* [trimRight](#trimRight) - Cross-browser implementation of [trimRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimRight).
* [accessor](#accessor) - Wraps an object key in a simple accessor function.
* [configPrep](#configPrep) - Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.
* [constant](#constant) - Wraps non-function variables in a simple return function.
* [unique](#unique) - ES5 implementation to reduce an Array of values to unique instances.
* [uuid](#uuid) - Returns a unique identifier.

##### 
* [colorDefaults](#colorDefaults) - A set of default color values used when assigning colors based on data.

| Name | Default | Description |
|---|---|---|
| dark | "#555555" | Used in the [contrast](#contrast) function when the color given is very light. |
| light | "#f7f7f7" | Used in the [contrast](#contrast) function when the color given is very dark. |
| missing | "#cccccc" | Used in the [assign](#assign) function when the value passed is `null` or `undefined`. |
| off | "#C44536" | Used in the [assign](#assign) function when the value passed is `false`. |
| on | "#6A994E" | Used in the [assign](#assign) function when the value passed is `true`. |
| scale | "#4281A4", "#F6AE2D", "#C44536", "#2A9D8F", "#6A994E", "#CEB54A", "#5E548E", "#C08497", "#99582A", "#8C8C99", "#1D3557", "#D08C60", "#6D2E46", "#8BB19C", "#52796F", "#5E60CE", "#985277", "#5C374C" | An ordinal scale used in the [assign](#assign) function for non-valid color strings and numbers. |
* [formatLocale](#formatLocale) - A set of default locale formatters used when assigning suffixes and currency in numbers.

| Name | Default | Description |
|---|---|---|
| separator | "" | Separation between the number with the suffix. |
| suffixes | [] | List of suffixes used to format numbers. |
| grouping | [3] | The array of group sizes, |
| delimiters | {thousands: ",", decimal: "."} | Decimal and group separators. |
| currency | ["$", ""] | The currency prefix and suffix. |

##### 
* [RESET](#RESET) - String constant used to reset an individual config property.

##### 
* [LargestRect](#LargestRect) - The returned Object of the largestRect function.

---

<a name="AreaPlot"></a>
#### **AreaPlot** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/AreaPlot.js#L5)


This is a global class, and extends all of the methods and functionality of [<code>Plot</code>](#Plot).


<a name="new_AreaPlot_new" href="#new_AreaPlot_new">#</a> new **AreaPlot**()

Creates an area plot based on an array of data.



the equivalent of calling:

```js
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Area")
```

---

<a name="BarChart"></a>
#### **BarChart** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/BarChart.js#L5)


This is a global class, and extends all of the methods and functionality of [<code>Plot</code>](#Plot).


<a name="new_BarChart_new" href="#new_BarChart_new">#</a> new **BarChart**()

Creates a bar chart based on an array of data.



the equivalent of calling:

```js
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Bar")
```

---

<a name="BoxWhisker"></a>
#### **BoxWhisker** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/BoxWhisker.js#L6)


This is a global class, and extends all of the methods and functionality of [<code>Plot</code>](#Plot).


<a name="new_BoxWhisker_new" href="#new_BoxWhisker_new">#</a> new **BoxWhisker**()

Creates a simple box and whisker based on an array of data.



the equivalent of calling:

```js
new d3plus.Plot()
  .discrete("x")
  .shape("Box")
```

---

<a name="BumpChart"></a>
#### **BumpChart** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/BumpChart.js#L5)


This is a global class, and extends all of the methods and functionality of [<code>Plot</code>](#Plot).


<a name="new_BumpChart_new" href="#new_BumpChart_new">#</a> new **BumpChart**()

Creates a bump chart based on an array of data.



the equivalent of calling:

```js
new d3plus.Plot()
  .discrete("x")
  .shape("Line")
  .x("x")
  .y2(d => this._y(d))
  .yConfig({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const startData = data.filter(d => d.x === xDomain[0]);
      const d = startData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .y2Config({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const endData = data.filter(d => d.x === xDomain[xDomain.length - 1]);
      const d = endData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .ySort((a, b) => b.y - a.y)
  .y2Sort((a, b) => b.y - a.y)
```

---

<a name="Donut"></a>
#### **Donut** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Donut.js#L4)


This is a global class, and extends all of the methods and functionality of [<code>Pie</code>](#Pie).


<a name="new_Donut_new" href="#new_Donut_new">#</a> new **Donut**()

Extends the Pie visualization to create a donut chart.




---

<a name="Geomap"></a>
#### **Geomap** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L46)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Geomap](#Geomap) ⇐ [<code>Viz</code>](#Viz)
    * [new Geomap()](#new_Geomap_new)
    * [.fitFilter([*value*])](#Geomap.fitFilter) ↩︎
    * [.fitKey(*value*)](#Geomap.fitKey) ↩︎
    * [.fitObject(*data*, [*formatter*])](#Geomap.fitObject) ↩︎
    * [.ocean([*value*])](#Geomap.ocean) ↩︎
    * [.point([*value*])](#Geomap.point) ↩︎
    * [.pointSize([*value*])](#Geomap.pointSize) ↩︎
    * [.pointSizeMax([*value*])](#Geomap.pointSizeMax) ↩︎
    * [.pointSizeMin([*value*])](#Geomap.pointSizeMin) ↩︎
    * [.projection(*projection*)](#Geomap.projection) ↩︎
    * [.projectionPadding([*value*])](#Geomap.projectionPadding) ↩︎
    * [.projectionRotate([*value*])](#Geomap.projectionRotate) ↩︎
    * [.tiles([*value*])](#Geomap.tiles) ↩︎
    * [.tileUrl([url])](#Geomap.tileUrl) ↩︎
    * [.topojson(*data*, [*formatter*])](#Geomap.topojson) ↩︎
    * [.topojsonFill(*value*)](#Geomap.topojsonFill) ↩︎
    * [.topojsonFilter([*value*])](#Geomap.topojsonFilter) ↩︎
    * [.topojsonKey(*value*)](#Geomap.topojsonKey) ↩︎
    * [.topojsonId(*value*)](#Geomap.topojsonId) ↩︎


<a name="new_Geomap_new" href="#new_Geomap_new">#</a> new **Geomap**()

Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points. See [this example](https://d3plus.org/examples/d3plus-geomap/getting-started/) for help getting started.





<a name="Geomap.fitFilter" href="#Geomap.fitFilter">#</a> Geomap.**fitFilter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L408)

Topojson files sometimes include small geographies that negatively impact how the library determines the default zoom level (for example, a small island or territory far off the coast that is barely visible to the eye). The fitFilter method can be used to remove specific geographies from the logic used to determine the zooming.

The *value* passed can be a single id to remove, an array of ids, or a filter function. Take a look at the [Choropleth Example](http://d3plus.org/examples/d3plus-geomap/getting-started/) to see it in action.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.fitKey" href="#Geomap.fitKey">#</a> Geomap.**fitKey**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L426)

If the topojson being used to determine the zoom fit (either the main [topojson](#Geomap.topojson) object or the [fitObject](#Geomap.fitObject)) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use for the zoom fit.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.fitObject" href="#Geomap.fitObject">#</a> Geomap.**fitObject**(*data*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L444)

The topojson to be used for the initial projection [fit extent](https://github.com/d3/d3-geo#projection_fitExtent). The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function needs to return the final Topojson *Object*.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *data* | <code>Object</code> \| <code>String</code> | = `undefined` |
| [*formatter*] | <code>function</code> |  |



<a name="Geomap.ocean" href="#Geomap.ocean">#</a> Geomap.**ocean**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L467)

The color visible behind any shapes drawn on the map projection. By default, a color value matching the color used in the map tiles is used to help mask the loading time needed to render the tiles. Any value CSS color value may be used, including hexidecimal, rgb, rgba, and color strings like `"blue"` and `"transparent"`.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.point" href="#Geomap.point">#</a> Geomap.**point**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L477)

The accessor to be used when detecting coordinate points in the objects passed to the [data](https://d3plus.org/docs/#Viz.data) method. Values are expected to be in the format `[longitude, latitude]`, which is in-line with d3's expected coordinate mapping.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.pointSize" href="#Geomap.pointSize">#</a> Geomap.**pointSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L487)

The accessor or static value to be used for sizing coordinate points.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.pointSizeMax" href="#Geomap.pointSizeMax">#</a> Geomap.**pointSizeMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L497)

The maximum pixel radius used in the scale for sizing coordinate points.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.pointSizeMin" href="#Geomap.pointSizeMin">#</a> Geomap.**pointSizeMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L507)

The minimum pixel radius used in the scale for sizing coordinate points.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.projection" href="#Geomap.projection">#</a> Geomap.**projection**(*projection*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L517)

Sets the map projection used when displaying topojson and coordinate points. All of the projections exported from [d3-geo](https://github.com/d3/d3-geo#projections), [d3-geo-projection](https://github.com/d3/d3-geo-projection#api-reference), and [d3-composite-projections](http://geoexamples.com/d3-composite-projections/) are accepted, whether as the string name (ie. "geoMercator") or the generator function itself. Map tiles are only usable when the projection is set to Mercator (which is also the default value).


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.projectionPadding" href="#Geomap.projectionPadding">#</a> Geomap.**projectionPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L528)

The outer padding between the edge of the visualization and the shapes drawn. The value passed can be either a single number to be used on all sides, or a CSS string pattern (ie. `"20px 0 10px"`).


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.projectionRotate" href="#Geomap.projectionRotate">#</a> Geomap.**projectionRotate**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L538)

An array that corresponds to the value passed to the projection's [rotate](https://github.com/d3/d3-geo#projection_rotate) function. Use this method to shift the centerpoint of a map.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.tiles" href="#Geomap.tiles">#</a> Geomap.**tiles**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L556)

Toggles the visibility of the map tiles.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.tileUrl" href="#Geomap.tileUrl">#</a> Geomap.**tileUrl**([url]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L573)

By default, d3plus uses the `light_all` style provided by [CARTO](https://carto.com/location-data-services/basemaps/) for it's map tiles. The [tileUrl](https://d3plus.org/docs/#Geomap.tileUrl) method changes the base URL used for fetching the tiles, as long as the string passed contains `{x}`, `{y}`, and `{z}` variables enclosed in curly brackets for the zoom logic to load the correct tiles.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.topojson" href="#Geomap.topojson">#</a> Geomap.**topojson**(*data*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L592)

The topojson to be used for drawing geographical paths. The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final Topojson *Obejct*.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *data* | <code>Object</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Geomap.topojsonFill" href="#Geomap.topojsonFill">#</a> Geomap.**topojsonFill**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L615)

The function is used to set default color of the map.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.topojsonFilter" href="#Geomap.topojsonFilter">#</a> Geomap.**topojsonFilter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L625)

If the [topojson](#Geomap.topojson) being used contains boundaries that should not be shown, this method can be used to filter them out of the final output. The *value* passed can be a single id to remove, an array of ids, or a filter function.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.topojsonKey" href="#Geomap.topojsonKey">#</a> Geomap.**topojsonKey**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L643)

If the [topojson](#Geomap.topojson) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.


<a name="Geomap.topojsonId" href="#Geomap.topojsonId">#</a> Geomap.**topojsonId**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Geomap.js#L658)

The accessor used to map each topojson geometry to it's corresponding [data](https://d3plus.org/docs/#Viz.data) point.


This is a static method of [<code>Geomap</code>](#Geomap), and is chainable with other methods of this Class.

---

<a name="LinePlot"></a>
#### **LinePlot** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/LinePlot.js#L5)


This is a global class, and extends all of the methods and functionality of [<code>Plot</code>](#Plot).


<a name="new_LinePlot_new" href="#new_LinePlot_new">#</a> new **LinePlot**()

Creates a line plot based on an array of data.



the equivalent of calling:

```js
new d3plus.Plot()
  .discrete("x")
  .shape("Line")
```

---

<a name="Matrix"></a>
#### **Matrix** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L22)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Matrix](#Matrix) ⇐ [<code>Viz</code>](#Viz)
    * [new Matrix()](#new_Matrix_new)
    * [.cellPadding([*value*])](#Matrix.cellPadding)
    * [.column([*value*])](#Matrix.column)
    * [.columnConfig(*value*)](#Matrix.columnConfig) ↩︎
    * [.columnList([*value*])](#Matrix.columnList)
    * [.columnSort([*value*])](#Matrix.columnSort)
    * [.row([*value*])](#Matrix.row)
    * [.rowConfig(*value*)](#Matrix.rowConfig) ↩︎
    * [.rowList([*value*])](#Matrix.rowList)
    * [.rowSort([*value*])](#Matrix.rowSort)


<a name="new_Matrix_new" href="#new_Matrix_new">#</a> new **Matrix**()

Creates a simple rows/columns Matrix view of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/getting-started/) for help getting started using the Matrix class.





<a name="Matrix.cellPadding" href="#Matrix.cellPadding">#</a> Matrix.**cellPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L169)

The pixel padding in between each cell.


This is a static method of [<code>Matrix</code>](#Matrix).


<a name="Matrix.column" href="#Matrix.column">#</a> Matrix.**column**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L182)

Determines which key in your data should be used for each column in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's column value.


This is a static method of [<code>Matrix</code>](#Matrix).


```js
function column(d) {
  return d.name;
}
```


<a name="Matrix.columnConfig" href="#Matrix.columnConfig">#</a> Matrix.**columnConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L192)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the column labels.


This is a static method of [<code>Matrix</code>](#Matrix), and is chainable with other methods of this Class.


<a name="Matrix.columnList" href="#Matrix.columnList">#</a> Matrix.**columnList**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L201)

A manual list of IDs to be used for columns.


This is a static method of [<code>Matrix</code>](#Matrix).


<a name="Matrix.columnSort" href="#Matrix.columnSort">#</a> Matrix.**columnSort**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L214)

A sort comparator function that is run on the unique set of column values.


This is a static method of [<code>Matrix</code>](#Matrix).


```js
function column(a, b) {
  return a.localeCompare(b);
}
```


<a name="Matrix.row" href="#Matrix.row">#</a> Matrix.**row**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L227)

Determines which key in your data should be used for each row in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's row value.


This is a static method of [<code>Matrix</code>](#Matrix).


```js
function row(d) {
  return d.name;
}
```


<a name="Matrix.rowConfig" href="#Matrix.rowConfig">#</a> Matrix.**rowConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L237)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the row labels.


This is a static method of [<code>Matrix</code>](#Matrix), and is chainable with other methods of this Class.


<a name="Matrix.rowList" href="#Matrix.rowList">#</a> Matrix.**rowList**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L246)

A manual list of IDs to be used for rows.


This is a static method of [<code>Matrix</code>](#Matrix).


<a name="Matrix.rowSort" href="#Matrix.rowSort">#</a> Matrix.**rowSort**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Matrix.js#L259)

A sort comparator function that is run on the unique set of row values.


This is a static method of [<code>Matrix</code>](#Matrix).


```js
function row(a, b) {
  return a.localeCompare(b);
}
```

---

<a name="Network"></a>
#### **Network** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L23)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Network](#Network) ⇐ [<code>Viz</code>](#Viz)
    * [new Network()](#new_Network_new)
    * [.hover([*value*])](#Network.hover) ↩︎
    * [.links(*links*, [*formatter*])](#Network.links) ↩︎
    * [.linkSize([*value*])](#Network.linkSize) ↩︎
    * [.linkSizeMin([*value*])](#Network.linkSizeMin) ↩︎
    * [.linkSizeScale([*value*])](#Network.linkSizeScale) ↩︎
    * [.nodeGroupBy([*value*])](#Network.nodeGroupBy) ↩︎
    * [.nodes(*nodes*, [*formatter*])](#Network.nodes) ↩︎
    * [.size([*value*])](#Network.size) ↩︎
    * [.sizeMax([*value*])](#Network.sizeMax) ↩︎
    * [.sizeMin([*value*])](#Network.sizeMin) ↩︎
    * [.sizeScale([*value*])](#Network.sizeScale) ↩︎
    * [.x([*value*])](#Network.x) ↩︎
    * [.y([*value*])](#Network.y) ↩︎
    * [.linkSize([*value*])](#Network.linkSize) ↩︎
    * [.linkSizeMin([*value*])](#Network.linkSizeMin) ↩︎
    * [.linkSizeScale([*value*])](#Network.linkSizeScale) ↩︎


<a name="new_Network_new" href="#new_Network_new">#</a> new **Network**()

Creates a network visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/getting-started/) for help getting started using the Network class.





<a name="Network.hover" href="#Network.hover">#</a> Network.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L487)

If *value* is specified, sets the hover method to the specified function and returns the current class instance.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.links" href="#Network.links">#</a> Network.**links**(*links*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L510)

A predefined *Array* of edges that connect each object passed to the [node](#Network.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *links* | <code>Array</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Network.linkSize" href="#Network.linkSize">#</a> Network.**linkSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L524)

Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.linkSizeMin" href="#Network.linkSizeMin">#</a> Network.**linkSizeMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L534)

Defines the minimum pixel stroke width used in link sizing.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.linkSizeScale" href="#Network.linkSizeScale">#</a> Network.**linkSizeScale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L544)

Sets the specific type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.nodeGroupBy" href="#Network.nodeGroupBy">#</a> Network.**nodeGroupBy**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L554)

If *value* is specified, sets the node group accessor(s) to the specified string, function, or array of values and returns the current class instance. This method overrides the default .groupBy() function from being used with the data passed to .nodes(). If *value* is not specified, returns the current node group accessor.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.nodes" href="#Network.nodes">#</a> Network.**nodes**(*nodes*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L580)

The list of nodes to be used for drawing the network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *nodes* | <code>Array</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Network.size" href="#Network.size">#</a> Network.**size**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L594)

If *value* is specified, sets the size accessor to the specified function or data key and returns the current class instance. If *value* is not specified, returns the current size accessor.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.sizeMax" href="#Network.sizeMax">#</a> Network.**sizeMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L604)

Defines the maximum pixel radius used in size scaling. By default, the maximum size is determined by half the distance of the two closest nodes.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.sizeMin" href="#Network.sizeMin">#</a> Network.**sizeMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L614)

Defines the minimum pixel radius used in size scaling.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.sizeScale" href="#Network.sizeScale">#</a> Network.**sizeScale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L624)

Sets the specific type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of nodes in the network.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.x" href="#Network.x">#</a> Network.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L634)

If *value* is specified, sets the x accessor to the specified function or string matching a key in the data and returns the current class instance. The data passed to .data() takes priority over the .nodes() data array. If *value* is not specified, returns the current x accessor. By default, the x and y positions are determined dynamically based on default force layout properties.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.y" href="#Network.y">#</a> Network.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Network.js#L652)

If *value* is specified, sets the y accessor to the specified function or string matching a key in the data and returns the current class instance. The data passed to .data() takes priority over the .nodes() data array. If *value* is not specified, returns the current y accessor. By default, the x and y positions are determined dynamically based on default force layout properties.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.linkSize" href="#Network.linkSize">#</a> Network.**linkSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L529)

Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.linkSizeMin" href="#Network.linkSizeMin">#</a> Network.**linkSizeMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L539)

Defines the minimum pixel stroke width used in link sizing.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.


<a name="Network.linkSizeScale" href="#Network.linkSizeScale">#</a> Network.**linkSizeScale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L549)

Sets the specific type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.


This is a static method of [<code>Network</code>](#Network), and is chainable with other methods of this Class.

---

<a name="Pack"></a>
#### **Pack** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L22)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Pack](#Pack) ⇐ [<code>Viz</code>](#Viz)
    * [new Pack()](#new_Pack_new)
    * [.hover([*value*])](#Pack.hover) ↩︎
    * [.layoutPadding([*value*])](#Pack.layoutPadding)
    * [.packOpacity([*value*])](#Pack.packOpacity)
    * [.sort([*comparator*])](#Pack.sort)
    * [.sum([*value*])](#Pack.sum)


<a name="new_Pack_new" href="#new_Pack_new">#</a> new **Pack**()

Uses the [d3 pack layout](https://github.com/d3/d3-hierarchy#pack) to creates Circle Packing chart based on an array of data.





<a name="Pack.hover" href="#Pack.hover">#</a> Pack.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L142)

If *value* is specified, sets the hover method to the specified function and returns the current class instance.


This is a static method of [<code>Pack</code>](#Pack), and is chainable with other methods of this Class.


<a name="Pack.layoutPadding" href="#Pack.layoutPadding">#</a> Pack.**layoutPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L155)

If *value* is specified, sets the opacity accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current pack opacity accessor.


This is a static method of [<code>Pack</code>](#Pack).


<a name="Pack.packOpacity" href="#Pack.packOpacity">#</a> Pack.**packOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L164)

If *value* is specified, sets the padding accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current pack opacity accessor.


This is a static method of [<code>Pack</code>](#Pack).


<a name="Pack.sort" href="#Pack.sort">#</a> Pack.**sort**([*comparator*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L177)

If *comparator* is specified, sets the sort order for the pack using the specified comparator function. If *comparator* is not specified, returns the current group sort order, which defaults to descending order by the associated input data's numeric value attribute.


This is a static method of [<code>Pack</code>](#Pack).


```js
function comparator(a, b) {
  return b.value - a.value;
}
```


<a name="Pack.sum" href="#Pack.sum">#</a> Pack.**sum**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pack.js#L191)

If *value* is specified, sets the sum accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current sum accessor.


This is a static method of [<code>Pack</code>](#Pack).


```js
function sum(d) {
  return d.sum;
}
```

---

<a name="Pie"></a>
#### **Pie** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L9)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Pie](#Pie) ⇐ [<code>Viz</code>](#Viz)
    * [new Pie()](#new_Pie_new)
    * [.innerRadius([*value*])](#Pie.innerRadius)
    * [.padAngle([*value*])](#Pie.padAngle)
    * [.padPixel([*value*])](#Pie.padPixel)
    * [.sort([*comparator*])](#Pie.sort)
    * [.value(*value*)](#Pie.value)


<a name="new_Pie_new" href="#new_Pie_new">#</a> new **Pie**()

Uses the [d3 pie layout](https://github.com/d3/d3-shape#pies) to creates SVG arcs based on an array of data.





<a name="Pie.innerRadius" href="#Pie.innerRadius">#</a> Pie.**innerRadius**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L101)

If *value* is specified, sets the inner radius accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current inner radius accessor.


This is a static method of [<code>Pie</code>](#Pie).


<a name="Pie.padAngle" href="#Pie.padAngle">#</a> Pie.**padAngle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L110)

If *value* is specified, sets the arc padding to the specified radian value and returns the current class instance. If *value* is not specified, returns the current radian padding.


This is a static method of [<code>Pie</code>](#Pie).


<a name="Pie.padPixel" href="#Pie.padPixel">#</a> Pie.**padPixel**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L119)

If *value* is specified, sets the arc padding to the specified pixel value and returns the current class instance. If *value* is not specified, returns the current pixel padding.


This is a static method of [<code>Pie</code>](#Pie).


<a name="Pie.sort" href="#Pie.sort">#</a> Pie.**sort**([*comparator*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L132)

If *comparator* is specified, sets the sort order for the pie slices using the specified comparator function. If *comparator* is not specified, returns the current sort order, which defaults to descending order by the associated input data's numeric value attribute.


This is a static method of [<code>Pie</code>](#Pie).


```js
function comparator(a, b) {
  return b.value - a.value;
}
```


<a name="Pie.value" href="#Pie.value">#</a> Pie.**value**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Pie.js#L145)

If *value* is specified, sets the value accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current value accessor.


This is a static method of [<code>Pie</code>](#Pie).


```js
function value(d) {
  return d.value;
}
```

---

<a name="Plot"></a>
#### **Plot** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L128)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Plot](#Plot) ⇐ [<code>Viz</code>](#Viz)
    * [new Plot()](#new_Plot_new)
    * [.annotations(*annotations*)](#Plot.annotations) ↩︎
    * [.axisPersist([*value*])](#Plot.axisPersist) ↩︎
    * [.backgroundConfig([*value*])](#Plot.backgroundConfig) ↩︎
    * [.barPadding(*value*)](#Plot.barPadding) ↩︎
    * [.baseline(*value*)](#Plot.baseline) ↩︎
    * [.buffer([*value*])](#Plot.buffer) ↩︎
    * [.confidence(*value*)](#Plot.confidence) ↩︎
    * [.confidenceConfig([*value*])](#Plot.confidenceConfig) ↩︎
    * [.discrete(*value*)](#Plot.discrete) ↩︎
    * [.discreteCutoff(*value*)](#Plot.discreteCutoff) ↩︎
    * [.groupPadding([*value*])](#Plot.groupPadding) ↩︎
    * [.labelConnectorConfig([*value*])](#Plot.labelConnectorConfig) ↩︎
    * [.lineLabels([*value*])](#Plot.lineLabels) ↩︎
    * [.lineMarkerConfig(*value*)](#Plot.lineMarkerConfig) ↩︎
    * [.lineMarkers([*value*])](#Plot.lineMarkers) ↩︎
    * [.shapeSort(*value*)](#Plot.shapeSort) ↩︎
    * [.size(*value*)](#Plot.size) ↩︎
    * [.sizeMax(*value*)](#Plot.sizeMax) ↩︎
    * [.sizeMin(*value*)](#Plot.sizeMin) ↩︎
    * [.sizeScale(*value*)](#Plot.sizeScale) ↩︎
    * [.stacked(*value*)](#Plot.stacked) ↩︎
    * [.stackOffset(*value*)](#Plot.stackOffset) ↩︎
    * [.stackOrder(*value*)](#Plot.stackOrder) ↩︎
    * [.x(*value*)](#Plot.x) ↩︎
    * [.x2(*value*)](#Plot.x2) ↩︎
    * [.xConfig(*value*)](#Plot.xConfig) ↩︎
    * [.xCutoff(*value*)](#Plot.xCutoff) ↩︎
    * [.x2Config(*value*)](#Plot.x2Config) ↩︎
    * [.xDomain(*value*)](#Plot.xDomain) ↩︎
    * [.x2Domain(*value*)](#Plot.x2Domain) ↩︎
    * [.xSort(*value*)](#Plot.xSort) ↩︎
    * [.x2Sort(*value*)](#Plot.x2Sort) ↩︎
    * [.y(*value*)](#Plot.y) ↩︎
    * [.y2(*value*)](#Plot.y2) ↩︎
    * [.yConfig(*value*)](#Plot.yConfig) ↩︎
    * [.yCutoff(*value*)](#Plot.yCutoff) ↩︎
    * [.y2Config(*value*)](#Plot.y2Config) ↩︎
    * [.yDomain(*value*)](#Plot.yDomain) ↩︎
    * [.y2Domain(*value*)](#Plot.y2Domain) ↩︎
    * [.ySort(*value*)](#Plot.ySort) ↩︎
    * [.y2Sort(*value*)](#Plot.y2Sort) ↩︎


<a name="new_Plot_new" href="#new_Plot_new">#</a> new **Plot**()

Creates an x/y plot based on an array of data.





<a name="Plot.annotations" href="#Plot.annotations">#</a> Plot.**annotations**(*annotations*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1479)

Allows drawing custom shapes to be used as annotations in the provided x/y plot. This method accepts custom config objects for the [Shape](http://d3plus.org/docs/#Shape) class, either a single config object or an array of config objects. Each config object requires an additional parameter, the "shape", which denotes which [Shape](http://d3plus.org/docs/#Shape) sub-class to use ([Rect](http://d3plus.org/docs/#Rect), [Line](http://d3plus.org/docs/#Line), etc).

Additionally, each config object can also contain an optional "layer" key, which defines whether the annotations will be displayed in "front" or in "back" of the primary visualization shapes. This value defaults to "back" if not present.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.axisPersist" href="#Plot.axisPersist">#</a> Plot.**axisPersist**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1489)

Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.backgroundConfig" href="#Plot.backgroundConfig">#</a> Plot.**backgroundConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1499)

A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.barPadding" href="#Plot.barPadding">#</a> Plot.**barPadding**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1509)

Sets the pixel space between each bar in a group of bars.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.baseline" href="#Plot.baseline">#</a> Plot.**baseline**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1519)

Sets the baseline for the x/y plot. If *value* is not specified, returns the current baseline.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.buffer" href="#Plot.buffer">#</a> Plot.**buffer**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1529)

Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.confidence" href="#Plot.confidence">#</a> Plot.**confidence**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1558)

Sets the confidence to the specified array of lower and upper bounds.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.
Can be called with accessor functions or static keys:

```js
       var data = {id: "alpha", value: 10, lci: 9, hci: 11};
       ...
       // Accessor functions
       .confidence([function(d) { return d.lci }, function(d) { return d.hci }])

       // Or static keys
       .confidence(["lci", "hci"])
```


<a name="Plot.confidenceConfig" href="#Plot.confidenceConfig">#</a> Plot.**confidenceConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1577)

If *value* is specified, sets the config method for each shape rendered as a confidence interval and returns the current class instance.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.discrete" href="#Plot.discrete">#</a> Plot.**discrete**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1587)

Sets the discrete axis to the specified string. If *value* is not specified, returns the current discrete axis.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.discreteCutoff" href="#Plot.discreteCutoff">#</a> Plot.**discreteCutoff**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1597)

When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.groupPadding" href="#Plot.groupPadding">#</a> Plot.**groupPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1607)

Sets the pixel space between groups of bars.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.labelConnectorConfig" href="#Plot.labelConnectorConfig">#</a> Plot.**labelConnectorConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1617)

The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.lineLabels" href="#Plot.lineLabels">#</a> Plot.**lineLabels**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1637)

Draws labels on the right side of any Line shapes that are drawn on the plot.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.lineMarkerConfig" href="#Plot.lineMarkerConfig">#</a> Plot.**lineMarkerConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1647)

Shape config for the Circle shapes drawn by the lineMarkers method.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.lineMarkers" href="#Plot.lineMarkers">#</a> Plot.**lineMarkers**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1657)

Draws circle markers on each vertex of a Line.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.shapeSort" href="#Plot.shapeSort">#</a> Plot.**shapeSort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1667)

A JavaScript [sort comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape Class (ie. "Circle", "Line", etc) as it's comparator arguments. Shapes are drawn in groups based on their type, so you are defining the layering order for all shapes of said type.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.size" href="#Plot.size">#</a> Plot.**size**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1677)

Sets the size of bubbles to the given Number, data key, or function.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.sizeMax" href="#Plot.sizeMax">#</a> Plot.**sizeMax**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1687)

Sets the size scale maximum to the specified number.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.sizeMin" href="#Plot.sizeMin">#</a> Plot.**sizeMin**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1697)

Sets the size scale minimum to the specified number.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.sizeScale" href="#Plot.sizeScale">#</a> Plot.**sizeScale**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1707)

Sets the size scale to the specified string.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.stacked" href="#Plot.stacked">#</a> Plot.**stacked**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1717)

If *value* is specified, toggles shape stacking. If *value* is not specified, returns the current stack value.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.stackOffset" href="#Plot.stackOffset">#</a> Plot.**stackOffset**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1727)

Sets the stack offset. If *value* is not specified, returns the current stack offset function.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.stackOrder" href="#Plot.stackOrder">#</a> Plot.**stackOrder**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1737)

Sets the stack order. If *value* is not specified, returns the current stack order function.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.x" href="#Plot.x">#</a> Plot.**x**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1752)

Sets the x accessor to the specified function or number. If *value* is not specified, returns the current x accessor.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.x2" href="#Plot.x2">#</a> Plot.**x2**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1770)

Sets the x2 accessor to the specified function or number. If *value* is not specified, returns the current x2 accessor.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.xConfig" href="#Plot.xConfig">#</a> Plot.**xConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1788)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.xCutoff" href="#Plot.xCutoff">#</a> Plot.**xCutoff**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1798)

When the width of the chart is less than or equal to this pixel value, and the x-axis is not the discrete axis, it will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.x2Config" href="#Plot.x2Config">#</a> Plot.**x2Config**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1808)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.xDomain" href="#Plot.xDomain">#</a> Plot.**xDomain**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1818)

Sets the x domain to the specified array. If *value* is not specified, returns the current x domain. Additionally, if either value of the array is undefined, it will be calculated from the data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.x2Domain" href="#Plot.x2Domain">#</a> Plot.**x2Domain**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1828)

Sets the x2 domain to the specified array. If *value* is not specified, returns the current x2 domain. Additionally, if either value of the array is undefined, it will be calculated from the data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.xSort" href="#Plot.xSort">#</a> Plot.**xSort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1838)

Defines a custom sorting comparitor function to be used for discrete x axes.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.x2Sort" href="#Plot.x2Sort">#</a> Plot.**x2Sort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1848)

Defines a custom sorting comparitor function to be used for discrete x2 axes.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.y" href="#Plot.y">#</a> Plot.**y**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1858)

Sets the y accessor to the specified function or number. If *value* is not specified, returns the current y accessor.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.y2" href="#Plot.y2">#</a> Plot.**y2**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1876)

Sets the y2 accessor to the specified function or number. If *value* is not specified, returns the current y2 accessor.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.yConfig" href="#Plot.yConfig">#</a> Plot.**yConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1896)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
Note:* If a "domain" array is passed to the y-axis config, it will be reversed.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.yCutoff" href="#Plot.yCutoff">#</a> Plot.**yCutoff**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1911)

When the height of the chart is less than or equal to this pixel value, and the y-axis is not the discrete axis, it will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.y2Config" href="#Plot.y2Config">#</a> Plot.**y2Config**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1921)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.yDomain" href="#Plot.yDomain">#</a> Plot.**yDomain**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1936)

Sets the y domain to the specified array. If *value* is not specified, returns the current y domain. Additionally, if either value of the array is undefined, it will be calculated from the data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.y2Domain" href="#Plot.y2Domain">#</a> Plot.**y2Domain**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1946)

Sets the y2 domain to the specified array. If *value* is not specified, returns the current y2 domain. Additionally, if either value of the array is undefined, it will be calculated from the data.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.ySort" href="#Plot.ySort">#</a> Plot.**ySort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1956)

Defines a custom sorting comparitor function to be used for discrete y axes.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.


<a name="Plot.y2Sort" href="#Plot.y2Sort">#</a> Plot.**y2Sort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1966)

Defines a custom sorting comparitor function to be used for discrete y2 axes.


This is a static method of [<code>Plot</code>](#Plot), and is chainable with other methods of this Class.

---

<a name="Priestley"></a>
#### **Priestley** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L12)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Priestley](#Priestley) ⇐ [<code>Viz</code>](#Viz)
    * [new Priestley()](#new_Priestley_new)
    * [.axisConfig([*value*])](#Priestley.axisConfig) ↩︎
    * [.end([*value*])](#Priestley.end) ↩︎
    * [.paddingInner([*value*])](#Priestley.paddingInner) ↩︎
    * [.paddingOuter([*value*])](#Priestley.paddingOuter) ↩︎
    * [.start([*value*])](#Priestley.start) ↩︎


<a name="new_Priestley_new" href="#new_Priestley_new">#</a> new **Priestley**()

Creates a priestley timeline based on an array of data.





<a name="Priestley.axisConfig" href="#Priestley.axisConfig">#</a> Priestley.**axisConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L144)

If *value* is specified, sets the config method for the axis and returns the current class instance. If *value* is not specified, returns the current axis configuration.


This is a static method of [<code>Priestley</code>](#Priestley), and is chainable with other methods of this Class.


<a name="Priestley.end" href="#Priestley.end">#</a> Priestley.**end**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L154)

If *value* is specified, sets the end accessor to the specified function or key and returns the current class instance. If *value* is not specified, returns the current end accessor.


This is a static method of [<code>Priestley</code>](#Priestley), and is chainable with other methods of this Class.


<a name="Priestley.paddingInner" href="#Priestley.paddingInner">#</a> Priestley.**paddingInner**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L172)

Sets the [paddingInner](https://github.com/d3/d3-scale#band_paddingInner) value of the underlining [Band Scale](https://github.com/d3/d3-scale#band-scales) used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space in between each rectangle.


This is a static method of [<code>Priestley</code>](#Priestley), and is chainable with other methods of this Class.


<a name="Priestley.paddingOuter" href="#Priestley.paddingOuter">#</a> Priestley.**paddingOuter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L182)

Sets the [paddingOuter](https://github.com/d3/d3-scale#band_paddingOuter) value of the underlining [Band Scale](https://github.com/d3/d3-scale#band-scales) used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space around the outer rectangles.


This is a static method of [<code>Priestley</code>](#Priestley), and is chainable with other methods of this Class.


<a name="Priestley.start" href="#Priestley.start">#</a> Priestley.**start**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Priestley.js#L192)

If *value* is specified, sets the start accessor to the specified function or key and returns the current class instance. If *value* is not specified, returns the current start accessor.


This is a static method of [<code>Priestley</code>](#Priestley), and is chainable with other methods of this Class.

---

<a name="Radar"></a>
#### **Radar** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Radar.js#L14)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Radar](#Radar) ⇐ [<code>Viz</code>](#Viz)
    * [new Radar()](#new_Radar_new)
    * [.axisConfig(*value*)](#Radar.axisConfig) ↩︎
    * [.metric(*value*)](#Radar.metric) ↩︎
    * [.outerPadding([*value*])](#Radar.outerPadding) ↩︎
    * [.value(*value*)](#Radar.value)


<a name="new_Radar_new" href="#new_Radar_new">#</a> new **Radar**()

Creates a radar visualization based on an array of data.





<a name="Radar.axisConfig" href="#Radar.axisConfig">#</a> Radar.**axisConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Radar.js#L239)

Sets the config method used for the radial spokes, circles, and labels.


This is a static method of [<code>Radar</code>](#Radar), and is chainable with other methods of this Class.


<a name="Radar.metric" href="#Radar.metric">#</a> Radar.**metric**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Radar.js#L249)

Defines the value used as axis. If *value* is specified, sets the accessor to the specified metric function. If *value* is not specified, returns the current metric accessor.


This is a static method of [<code>Radar</code>](#Radar), and is chainable with other methods of this Class.


<a name="Radar.outerPadding" href="#Radar.outerPadding">#</a> Radar.**outerPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Radar.js#L259)

Determines how much pixel spaces to give the outer labels.


This is a static method of [<code>Radar</code>](#Radar), and is chainable with other methods of this Class.


<a name="Radar.value" href="#Radar.value">#</a> Radar.**value**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Radar.js#L272)

If *value* is specified, sets the value accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current value accessor.


This is a static method of [<code>Radar</code>](#Radar).


```js
function value(d) {
  return d.value;
}
```

---

<a name="RadialMatrix"></a>
#### **RadialMatrix** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L14)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [RadialMatrix](#RadialMatrix) ⇐ [<code>Viz</code>](#Viz)
    * [new RadialMatrix()](#new_RadialMatrix_new)
    * [.cellPadding([*value*])](#RadialMatrix.cellPadding)
    * [.column([*value*])](#RadialMatrix.column)
    * [.columnConfig(*value*)](#RadialMatrix.columnConfig) ↩︎
    * [.columnList([*value*])](#RadialMatrix.columnList)
    * [.columnSort([*value*])](#RadialMatrix.columnSort)
    * [.innerRadius([*value*])](#RadialMatrix.innerRadius)
    * [.row([*value*])](#RadialMatrix.row)
    * [.rowList([*value*])](#RadialMatrix.rowList)
    * [.rowSort([*value*])](#RadialMatrix.rowSort)


<a name="new_RadialMatrix_new" href="#new_RadialMatrix_new">#</a> new **RadialMatrix**()

Creates a radial layout of a rows/columns Matrix of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/radial-matrix/) for help getting started using the Matrix class.





<a name="RadialMatrix.cellPadding" href="#RadialMatrix.cellPadding">#</a> RadialMatrix.**cellPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L170)

The pixel padding in between each cell.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


<a name="RadialMatrix.column" href="#RadialMatrix.column">#</a> RadialMatrix.**column**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L183)

Determines which key in your data should be used for each column in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's column value.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


```js
function column(d) {
  return d.name;
}
```


<a name="RadialMatrix.columnConfig" href="#RadialMatrix.columnConfig">#</a> RadialMatrix.**columnConfig**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L193)

A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the column labels.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix), and is chainable with other methods of this Class.


<a name="RadialMatrix.columnList" href="#RadialMatrix.columnList">#</a> RadialMatrix.**columnList**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L202)

A manual list of IDs to be used for columns.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


<a name="RadialMatrix.columnSort" href="#RadialMatrix.columnSort">#</a> RadialMatrix.**columnSort**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L215)

A sort comparator function that is run on the unique set of column values.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


```js
function column(a, b) {
  return a.localeCompare(b);
}
```


<a name="RadialMatrix.innerRadius" href="#RadialMatrix.innerRadius">#</a> RadialMatrix.**innerRadius**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L228)

The radius (in pixels) for the inner donut hole of the diagram. Can either be a static Number, or an accessor function that receives the outer radius as it's only argument.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


```js
function(outerRadius) {
  return outerRadius / 5;
}
```


<a name="RadialMatrix.row" href="#RadialMatrix.row">#</a> RadialMatrix.**row**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L241)

Determines which key in your data should be used for each row in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's row value.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


```js
function row(d) {
  return d.name;
}
```


<a name="RadialMatrix.rowList" href="#RadialMatrix.rowList">#</a> RadialMatrix.**rowList**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L250)

A manual list of IDs to be used for rows.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


<a name="RadialMatrix.rowSort" href="#RadialMatrix.rowSort">#</a> RadialMatrix.**rowSort**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/RadialMatrix.js#L263)

A sort comparator function that is run on the unique set of row values.


This is a static method of [<code>RadialMatrix</code>](#RadialMatrix).


```js
function row(a, b) {
  return a.localeCompare(b);
}
```

---

<a name="Rings"></a>
#### **Rings** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L13)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Rings](#Rings) ⇐ [<code>Viz</code>](#Viz)
    * [new Rings()](#new_Rings_new)
    * [.center(_)](#Rings.center) ↩︎
    * [.hover([*value*])](#Rings.hover) ↩︎
    * [.links(*links*, [*formatter*])](#Rings.links) ↩︎
    * [.nodeGroupBy([*value*])](#Rings.nodeGroupBy) ↩︎
    * [.nodes(*nodes*, [*formatter*])](#Rings.nodes) ↩︎
    * [.size([*value*])](#Rings.size) ↩︎
    * [.sizeMax([*value*])](#Rings.sizeMax) ↩︎
    * [.sizeMin([*value*])](#Rings.sizeMin) ↩︎
    * [.sizeScale([*value*])](#Rings.sizeScale) ↩︎


<a name="new_Rings_new" href="#new_Rings_new">#</a> new **Rings**()

Creates a ring visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/simple-rings/) for help getting started using the Rings class.





<a name="Rings.center" href="#Rings.center">#</a> Rings.**center**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L484)

Sets the center node to be the node with the given id.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.hover" href="#Rings.hover">#</a> Rings.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L494)

If *value* is specified, sets the hover method to the specified function and returns the current class instance.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.links" href="#Rings.links">#</a> Rings.**links**(*links*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L515)

A predefined *Array* of edges that connect each object passed to the [node](#Rings.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *links* | <code>Array</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Rings.nodeGroupBy" href="#Rings.nodeGroupBy">#</a> Rings.**nodeGroupBy**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L559)

If *value* is specified, sets the node group accessor(s) to the specified string, function, or array of values and returns the current class instance. This method overrides the default .groupBy() function from being used with the data passed to .nodes(). If *value* is not specified, returns the current node group accessor.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.nodes" href="#Rings.nodes">#</a> Rings.**nodes**(*nodes*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L585)

The list of nodes to be used for drawing the rings network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *nodes* | <code>Array</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Rings.size" href="#Rings.size">#</a> Rings.**size**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L599)

If *value* is specified, sets the size accessor to the specified function or data key and returns the current class instance. If *value* is not specified, returns the current size accessor.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.sizeMax" href="#Rings.sizeMax">#</a> Rings.**sizeMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L609)

If *value* is specified, sets the size scale maximum to the specified number and returns the current class instance. If *value* is not specified, returns the current size scale maximum. By default, the maximum size is determined by half the distance of the two closest nodes.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.sizeMin" href="#Rings.sizeMin">#</a> Rings.**sizeMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L619)

If *value* is specified, sets the size scale minimum to the specified number and returns the current class instance. If *value* is not specified, returns the current size scale minimum.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.


<a name="Rings.sizeScale" href="#Rings.sizeScale">#</a> Rings.**sizeScale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Rings.js#L629)

If *value* is specified, sets the size scale to the specified string and returns the current class instance. If *value* is not specified, returns the current size scale.


This is a static method of [<code>Rings</code>](#Rings), and is chainable with other methods of this Class.

---

<a name="Sankey"></a>
#### **Sankey** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L25)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Sankey](#Sankey) ⇐ [<code>Viz</code>](#Viz)
    * [new Sankey()](#new_Sankey_new)
    * [.hover([*value*])](#Sankey.hover) ↩︎
    * [.links(*links*)](#Sankey.links) ↩︎
    * [.linksSource([*value*])](#Sankey.linksSource) ↩︎
    * [.linksTarget([*value*])](#Sankey.linksTarget) ↩︎
    * [.nodeAlign([*value*])](#Sankey.nodeAlign) ↩︎
    * [.nodeId([*value*])](#Sankey.nodeId) ↩︎
    * [.nodes(*nodes*)](#Sankey.nodes) ↩︎
    * [.nodePadding([*value*])](#Sankey.nodePadding) ↩︎
    * [.nodeWidth([*value*])](#Sankey.nodeWidth) ↩︎
    * [.value(*value*)](#Sankey.value)


<a name="new_Sankey_new" href="#new_Sankey_new">#</a> new **Sankey**()

Creates a sankey visualization based on a defined set of nodes and links. [Click here](http://d3plus.org/examples/d3plus-network/sankey-diagram/) for help getting started using the Sankey class.





<a name="Sankey.hover" href="#Sankey.hover">#</a> Sankey.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L215)

If *value* is specified, sets the hover method to the specified function and returns the current class instance.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.links" href="#Sankey.links">#</a> Sankey.**links**(*links*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L232)

A predefined *Array* of edges that connect each object passed to the [node](#Sankey.node) method. The `source` and `target` keys in each link need to map to the nodes in one of one way:
1. A *String* value matching the `id` of the node.

The value passed should be an *Array* of data. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.linksSource" href="#Sankey.linksSource">#</a> Sankey.**linksSource**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L246)

The key inside of each link Object that references the source node.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.linksTarget" href="#Sankey.linksTarget">#</a> Sankey.**linksTarget**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L256)

The key inside of each link Object that references the target node.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.nodeAlign" href="#Sankey.nodeAlign">#</a> Sankey.**nodeAlign**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L266)

Sets the nodeAlign property of the sankey layout, which can either be "left", "right", "center", or "justify".


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.nodeId" href="#Sankey.nodeId">#</a> Sankey.**nodeId**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L278)

If *value* is specified, sets the node id accessor(s) to the specified array of values and returns the current class instance. If *value* is not specified, returns the current node group accessor.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.nodes" href="#Sankey.nodes">#</a> Sankey.**nodes**(*nodes*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L292)

The list of nodes to be used for drawing the network. The value passed must be an *Array* of data.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.nodePadding" href="#Sankey.nodePadding">#</a> Sankey.**nodePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L306)

If *value* is specified, sets the padding of the node and returns the current class instance. If *value* is not specified, returns the current nodePadding. By default, the nodePadding size is 8.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.nodeWidth" href="#Sankey.nodeWidth">#</a> Sankey.**nodeWidth**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L317)

If *value* is specified, sets the width of the node and returns the current class instance. If *value* is not specified, returns the current nodeWidth. By default, the nodeWidth size is 30.


This is a static method of [<code>Sankey</code>](#Sankey), and is chainable with other methods of this Class.


<a name="Sankey.value" href="#Sankey.value">#</a> Sankey.**value**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Sankey.js#L330)

If *value* is specified, sets the width of the links and returns the current class instance. If *value* is not specified, returns the current value accessor.


This is a static method of [<code>Sankey</code>](#Sankey).


```js
function value(d) {
  return d.value;
}
```

---

<a name="StackedArea"></a>
#### **StackedArea** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/StackedArea.js#L3)


This is a global class, and extends all of the methods and functionality of [<code>Area</code>](#Area).


<a name="new_StackedArea_new" href="#new_StackedArea_new">#</a> new **StackedArea**()

Creates a stacked area plot based on an array of data.



the equivalent of calling:

```js
new d3plus.AreaPlot()
  .stacked(true)
```

---

<a name="Tree"></a>
#### **Tree** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Tree.js#L12)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Tree](#Tree) ⇐ [<code>Viz</code>](#Viz)
    * [new Tree()](#new_Tree_new)
    * [.orient([*value*])](#Tree.orient)
    * [.separation([*value*])](#Tree.separation)


<a name="new_Tree_new" href="#new_Tree_new">#</a> new **Tree**()

Uses d3's [tree layout](https://github.com/d3/d3-hierarchy#tree) to create a tidy tree chart based on an array of data.





<a name="Tree.orient" href="#Tree.orient">#</a> Tree.**orient**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Tree.js#L210)

If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.


This is a static method of [<code>Tree</code>](#Tree).


<a name="Tree.separation" href="#Tree.separation">#</a> Tree.**separation**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Tree.js#L226)

If *value* is specified, sets the separation accessor to the specified function. If *value* is not specified, returns the current separation accessor.

From the [d3-hierarchy documentation](https://github.com/d3/d3-hierarchy#tree_separation):
> The separation accessor is used to separate neighboring nodes. The separation function is passed two nodes a and b, and must return the desired separation. The nodes are typically siblings, though the nodes may be more distantly related if the layout decides to place such nodes adjacent.


This is a static method of [<code>Tree</code>](#Tree).


```js
function separation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
```

---

<a name="Treemap"></a>
#### **Treemap** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Treemap.js#L14)


This is a global class, and extends all of the methods and functionality of [<code>Viz</code>](#Viz).


* [Treemap](#Treemap) ⇐ [<code>Viz</code>](#Viz)
    * [new Treemap()](#new_Treemap_new)
    * [.layoutPadding([*value*])](#Treemap.layoutPadding)
    * [.sort([*comparator*])](#Treemap.sort)
    * [.sum([*value*])](#Treemap.sum)
    * [.tile([*value*])](#Treemap.tile)


<a name="new_Treemap_new" href="#new_Treemap_new">#</a> new **Treemap**()

Uses the [d3 treemap layout](https://github.com/mbostock/d3/wiki/Treemap-Layout) to creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-hierarchy/getting-started/) for help getting started using the treemap generator.





<a name="Treemap.layoutPadding" href="#Treemap.layoutPadding">#</a> Treemap.**layoutPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Treemap.js#L255)

If *value* is specified, sets the inner and outer padding accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current padding accessor.


This is a static method of [<code>Treemap</code>](#Treemap).


<a name="Treemap.sort" href="#Treemap.sort">#</a> Treemap.**sort**([*comparator*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Treemap.js#L268)

If *comparator* is specified, sets the sort order for the treemap using the specified comparator function. If *comparator* is not specified, returns the current group sort order, which defaults to descending order by the associated input data's numeric value attribute.


This is a static method of [<code>Treemap</code>](#Treemap).


```js
function comparator(a, b) {
  return b.value - a.value;
}
```


<a name="Treemap.sum" href="#Treemap.sum">#</a> Treemap.**sum**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Treemap.js#L281)

If *value* is specified, sets the sum accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current sum accessor.


This is a static method of [<code>Treemap</code>](#Treemap).


```js
function sum(d) {
  return d.sum;
}
```


<a name="Treemap.tile" href="#Treemap.tile">#</a> Treemap.**tile**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Treemap.js#L297)

Sets the tiling method used when calcuating the size and position of the rectangles.

Can either be a string referring to a d3-hierarchy [tiling method](https://github.com/d3/d3-hierarchy#treemap-tiling), or a custom function in the same format.


This is a static method of [<code>Treemap</code>](#Treemap).

---

<a name="Viz"></a>
#### **Viz** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L77)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Viz](#Viz) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Viz()](#new_Viz_new)
    * [.labelPosition([*value*])](#Viz.labelPosition) ↩︎
    * [.render([*callback*])](#Viz.render) ↩︎
    * [.active([*value*])](#Viz.active) ↩︎
    * [.aggs([*value*])](#Viz.aggs) ↩︎
    * [.ariaHidden([*value*])](#Viz.ariaHidden) ↩︎
    * [.attribution(*value*)](#Viz.attribution) ↩︎
    * [.attributionStyle([*value*])](#Viz.attributionStyle) ↩︎
    * [.backConfig([*value*])](#Viz.backConfig) ↩︎
    * [.cache([*value*])](#Viz.cache) ↩︎
    * [.color([*value*])](#Viz.color) ↩︎
    * [.colorScale([*value*])](#Viz.colorScale) ↩︎
    * [.colorScaleConfig([*value*])](#Viz.colorScaleConfig) ↩︎
    * [.colorScalePadding([*value*])](#Viz.colorScalePadding) ↩︎
    * [.colorScalePosition([*value*])](#Viz.colorScalePosition) ↩︎
    * [.colorScaleMaxSize([*value*])](#Viz.colorScaleMaxSize) ↩︎
    * [.data(*data*, [*formatter*])](#Viz.data) ↩︎
    * [.dataCutoff([*value*])](#Viz.dataCutoff) ↩︎
    * [.depth([*value*])](#Viz.depth) ↩︎
    * [.detectResize(*value*)](#Viz.detectResize) ↩︎
    * [.detectResizeDelay(*value*)](#Viz.detectResizeDelay) ↩︎
    * [.detectVisible(*value*)](#Viz.detectVisible) ↩︎
    * [.detectVisibleInterval(*value*)](#Viz.detectVisibleInterval) ↩︎
    * [.discrete([*value*])](#Viz.discrete) ↩︎
    * [.downloadButton([*value*])](#Viz.downloadButton) ↩︎
    * [.downloadConfig([*value*])](#Viz.downloadConfig) ↩︎
    * [.downloadPosition([*value*])](#Viz.downloadPosition) ↩︎
    * [.duration([*ms*])](#Viz.duration) ↩︎
    * [.filter([*value*])](#Viz.filter) ↩︎
    * [.groupBy([*value*])](#Viz.groupBy) ↩︎
    * [.height([*value*])](#Viz.height) ↩︎
    * [.hiddenColor([*value*])](#Viz.hiddenColor) ↩︎
    * [.hiddenOpacity([*value*])](#Viz.hiddenOpacity) ↩︎
    * [.hover([*value*])](#Viz.hover) ↩︎
    * [.label([*value*])](#Viz.label) ↩︎
    * [.legend([*value*])](#Viz.legend) ↩︎
    * [.legendConfig([*value*])](#Viz.legendConfig) ↩︎
    * [.legendFilterInvert([*value*])](#Viz.legendFilterInvert) ↩︎
    * [.legendPadding([*value*])](#Viz.legendPadding) ↩︎
    * [.legendPosition([*value*])](#Viz.legendPosition) ↩︎
    * [.legendSort(*value*)](#Viz.legendSort) ↩︎
    * [.legendTooltip([*value*])](#Viz.legendTooltip) ↩︎
    * [.loadingHTML([*value*])](#Viz.loadingHTML) ↩︎
    * [.loadingMessage([*value*])](#Viz.loadingMessage) ↩︎
    * [.messageMask([*value*])](#Viz.messageMask) ↩︎
    * [.messageStyle([*value*])](#Viz.messageStyle) ↩︎
    * [.noDataHTML([*value*])](#Viz.noDataHTML) ↩︎
    * [.noDataMessage([*value*])](#Viz.noDataMessage) ↩︎
    * [.resizeContainer(*selector*)](#Viz.resizeContainer) ↩︎
    * [.scrollContainer(*selector*)](#Viz.scrollContainer) ↩︎
    * [.select([*selector*])](#Viz.select) ↩︎
    * [.shape([*value*])](#Viz.shape) ↩︎
    * [.shapeConfig([*value*])](#Viz.shapeConfig) ↩︎
    * [.subtitle([*value*])](#Viz.subtitle) ↩︎
    * [.subtitleConfig([*value*])](#Viz.subtitleConfig) ↩︎
    * [.subtitlePadding([*value*])](#Viz.subtitlePadding) ↩︎
    * [.svgDesc([*value*])](#Viz.svgDesc) ↩︎
    * [.svgTitle([*value*])](#Viz.svgTitle) ↩︎
    * [.threshold([value])](#Viz.threshold) ↩︎
    * [.thresholdKey([value])](#Viz.thresholdKey) ↩︎
    * [.thresholdName([value])](#Viz.thresholdName) ↩︎
    * [.time([*value*])](#Viz.time) ↩︎
    * [.timeFilter([*value*])](#Viz.timeFilter) ↩︎
    * [.timeline([*value*])](#Viz.timeline) ↩︎
    * [.timelineConfig([*value*])](#Viz.timelineConfig) ↩︎
    * [.timelineDefault([*value*])](#Viz.timelineDefault) ↩︎
    * [.timelinePadding([*value*])](#Viz.timelinePadding) ↩︎
    * [.title([*value*])](#Viz.title) ↩︎
    * [.titleConfig([*value*])](#Viz.titleConfig) ↩︎
    * [.titlePadding([*value*])](#Viz.titlePadding) ↩︎
    * [.tooltip([*value*])](#Viz.tooltip) ↩︎
    * [.tooltipConfig([*value*])](#Viz.tooltipConfig) ↩︎
    * [.total([*value*])](#Viz.total) ↩︎
    * [.totalConfig([*value*])](#Viz.totalConfig) ↩︎
    * [.totalFormat(*value*)](#Viz.totalFormat) ↩︎
    * [.totalPadding([*value*])](#Viz.totalPadding) ↩︎
    * [.width([*value*])](#Viz.width) ↩︎
    * [.zoom(*value*)](#Viz.zoom) ↩︎
    * [.zoomBrushHandleSize(*value*)](#Viz.zoomBrushHandleSize) ↩︎
    * [.zoomBrushHandleStyle(*value*)](#Viz.zoomBrushHandleStyle) ↩︎
    * [.zoomBrushSelectionStyle(*value*)](#Viz.zoomBrushSelectionStyle) ↩︎
    * [.zoomControlStyle(*value*)](#Viz.zoomControlStyle) ↩︎
    * [.zoomControlStyleActive(*value*)](#Viz.zoomControlStyleActive) ↩︎
    * [.zoomControlStyleHover(*value*)](#Viz.zoomControlStyleHover) ↩︎
    * [.zoomFactor(*value*)](#Viz.zoomFactor) ↩︎
    * [.zoomMax(*value*)](#Viz.zoomMax) ↩︎
    * [.zoomPan(*value*)](#Viz.zoomPan) ↩︎
    * [.zoomPadding(*value*)](#Viz.zoomPadding) ↩︎
    * [.zoomScroll([*value*])](#Viz.zoomScroll) ↩︎
    * [.parent([*value*])](#Viz.parent) ↩︎
    * [.shapeConfig([*value*])](#Viz.shapeConfig) ↩︎


<a name="new_Viz_new" href="#new_Viz_new">#</a> new **Viz**()

Creates an x/y plot based on an array of data. If *data* is specified, immediately draws the tree map based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#treemap.data) method. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.





<a name="Viz.labelPosition" href="#Viz.labelPosition">#</a> Viz.**labelPosition**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Plot.js#L1627)

The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.render" href="#Viz.render">#</a> Viz.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L552)

Draws the visualization given the specified configuration.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.active" href="#Viz.active">#</a> Viz.**active**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L755)

If *value* is specified, sets the active method to the specified function and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.aggs" href="#Viz.aggs">#</a> Viz.**aggs**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L773)

If *value* is specified, sets the aggregation method for each key in the object and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.ariaHidden" href="#Viz.ariaHidden">#</a> Viz.**ariaHidden**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L783)

Sets the "aria-hidden" attribute of the containing SVG element. The default value is "false", but it you need to hide the SVG from screen readers set this property to "true".


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.attribution" href="#Viz.attribution">#</a> Viz.**attribution**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L793)

Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.attributionStyle" href="#Viz.attributionStyle">#</a> Viz.**attributionStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L803)

If *value* is specified, sets the config method for the back button and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.backConfig" href="#Viz.backConfig">#</a> Viz.**backConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L813)

If *value* is specified, sets the config method for the back button and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.cache" href="#Viz.cache">#</a> Viz.**cache**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L823)

Enables a lru cache that stores up to 5 previously loaded files/URLs. Helpful when constantly writing over the data array with a URL in the render function of a react component.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.color" href="#Viz.color">#</a> Viz.**color**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L833)

Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.colorScale" href="#Viz.colorScale">#</a> Viz.**colorScale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L843)

Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.colorScaleConfig" href="#Viz.colorScaleConfig">#</a> Viz.**colorScaleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L853)

A pass-through to the config method of ColorScale.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.colorScalePadding" href="#Viz.colorScalePadding">#</a> Viz.**colorScalePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L863)

Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.colorScalePosition" href="#Viz.colorScalePosition">#</a> Viz.**colorScalePosition**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L873)

Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.colorScaleMaxSize" href="#Viz.colorScaleMaxSize">#</a> Viz.**colorScaleMaxSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L883)

Sets the maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.data" href="#Viz.data">#</a> Viz.**data**(*data*, [*formatter*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L902)

Sets the primary data array to be used when drawing the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

If *data* is not specified, this method returns the current primary data array, which defaults to an empty array (`[]`);


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.

| Param | Type | Description |
| --- | --- | --- |
| *data* | <code>Array</code> \| <code>String</code> | = [] |
| [*formatter*] | <code>function</code> |  |



<a name="Viz.dataCutoff" href="#Viz.dataCutoff">#</a> Viz.**dataCutoff**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L923)

If the number of visible data points exceeds this number, the default hover behavior will be disabled (helpful for very large visualizations bogging down the DOM with opacity updates).


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.depth" href="#Viz.depth">#</a> Viz.**depth**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L933)

If *value* is specified, sets the depth to the specified number and returns the current class instance. The *value* should correspond with an index in the [groupBy](#groupBy) array.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.detectResize" href="#Viz.detectResize">#</a> Viz.**detectResize**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L943)

If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.detectResizeDelay" href="#Viz.detectResizeDelay">#</a> Viz.**detectResizeDelay**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L953)

When resizing the browser window, this is the millisecond delay to trigger the resize event.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.detectVisible" href="#Viz.detectVisible">#</a> Viz.**detectVisible**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L963)

Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.detectVisibleInterval" href="#Viz.detectVisibleInterval">#</a> Viz.**detectVisibleInterval**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L973)

The interval, in milliseconds, for checking if the visualization is visible on the page.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.discrete" href="#Viz.discrete">#</a> Viz.**discrete**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L983)

If *value* is specified, sets the discrete accessor to the specified method name (usually an axis) and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.downloadButton" href="#Viz.downloadButton">#</a> Viz.**downloadButton**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L993)

Shows a button that allows for downloading the current visualization.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.downloadConfig" href="#Viz.downloadConfig">#</a> Viz.**downloadConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1003)

Sets specific options of the saveElement function used when downloading the visualization.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.downloadPosition" href="#Viz.downloadPosition">#</a> Viz.**downloadPosition**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1013)

Defines which control group to add the download button into.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.duration" href="#Viz.duration">#</a> Viz.**duration**([*ms*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1023)

If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.filter" href="#Viz.filter">#</a> Viz.**filter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1033)

If *value* is specified, sets the filter to the specified function and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.groupBy" href="#Viz.groupBy">#</a> Viz.**groupBy**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1047)

If *value* is specified, sets the group accessor(s) to the specified string, function, or array of values and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


```js
function value(d) {
  return d.id;
}
```


<a name="Viz.height" href="#Viz.height">#</a> Viz.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1071)

If *value* is specified, sets the overall height to the specified number and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.hiddenColor" href="#Viz.hiddenColor">#</a> Viz.**hiddenColor**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1081)

Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.hiddenOpacity" href="#Viz.hiddenOpacity">#</a> Viz.**hiddenOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1091)

Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.hover" href="#Viz.hover">#</a> Viz.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1101)

If *value* is specified, sets the hover method to the specified function and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.label" href="#Viz.label">#</a> Viz.**label**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1139)

If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legend" href="#Viz.legend">#</a> Viz.**legend**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1149)

If *value* is specified, toggles the legend based on the specified boolean and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendConfig" href="#Viz.legendConfig">#</a> Viz.**legendConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1159)

If *value* is specified, the object is passed to the legend's config method.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendFilterInvert" href="#Viz.legendFilterInvert">#</a> Viz.**legendFilterInvert**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1169)

Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendPadding" href="#Viz.legendPadding">#</a> Viz.**legendPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1179)

Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendPosition" href="#Viz.legendPosition">#</a> Viz.**legendPosition**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1189)

Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendSort" href="#Viz.legendSort">#</a> Viz.**legendSort**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1199)

A JavaScript [sort comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) used to sort the legend.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.legendTooltip" href="#Viz.legendTooltip">#</a> Viz.**legendTooltip**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1209)

If *value* is specified, sets the config method for the legend tooltip and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.loadingHTML" href="#Viz.loadingHTML">#</a> Viz.**loadingHTML**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1219)

Sets the inner HTML of the status message that is displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.loadingMessage" href="#Viz.loadingMessage">#</a> Viz.**loadingMessage**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1229)

Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.messageMask" href="#Viz.messageMask">#</a> Viz.**messageMask**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1239)

Sets the color of the mask used underneath the status message that is displayed when loading AJAX requests and displaying errors. Additionally, `false` will turn off the mask completely.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.messageStyle" href="#Viz.messageStyle">#</a> Viz.**messageStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1249)

Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.noDataHTML" href="#Viz.noDataHTML">#</a> Viz.**noDataHTML**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1259)

Sets the inner HTML of the status message that is displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.noDataMessage" href="#Viz.noDataMessage">#</a> Viz.**noDataMessage**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1269)

Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.resizeContainer" href="#Viz.resizeContainer">#</a> Viz.**resizeContainer**(*selector*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1279)

If using resize detection, this method allow a custom override of the element to which the resize detection function gets attached.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.scrollContainer" href="#Viz.scrollContainer">#</a> Viz.**scrollContainer**(*selector*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1289)

If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.select" href="#Viz.select">#</a> Viz.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1299)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element, which is `undefined` by default.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.shape" href="#Viz.shape">#</a> Viz.**shape**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1309)

If *value* is specified, sets the shape accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.shapeConfig" href="#Viz.shapeConfig">#</a> Viz.**shapeConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1319)

If *value* is specified, sets the config method for each shape and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.subtitle" href="#Viz.subtitle">#</a> Viz.**subtitle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1329)

If *value* is specified, sets the subtitle accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.subtitleConfig" href="#Viz.subtitleConfig">#</a> Viz.**subtitleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1339)

If *value* is specified, sets the config method for the subtitle and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.subtitlePadding" href="#Viz.subtitlePadding">#</a> Viz.**subtitlePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1349)

Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.svgDesc" href="#Viz.svgDesc">#</a> Viz.**svgDesc**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1359)

If *value* is specified, sets the description accessor to the specified string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.svgTitle" href="#Viz.svgTitle">#</a> Viz.**svgTitle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1369)

If *value* is specified, sets the title accessor to the specified string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.threshold" href="#Viz.threshold">#</a> Viz.**threshold**([value]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1379)

If *value* is specified, sets the threshold for buckets to the specified function or string, and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.thresholdKey" href="#Viz.thresholdKey">#</a> Viz.**thresholdKey**([value]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1398)

If *value* is specified, sets the accesor for the value used in the threshold algorithm, and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.thresholdName" href="#Viz.thresholdName">#</a> Viz.**thresholdName**([value]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1417)

If *value* is specified, sets the label for the bucket item, and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.time" href="#Viz.time">#</a> Viz.**time**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1427)

If *value* is specified, sets the time accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.timeFilter" href="#Viz.timeFilter">#</a> Viz.**timeFilter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1457)

If *value* is specified, sets the time filter to the specified function and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.timeline" href="#Viz.timeline">#</a> Viz.**timeline**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1467)

If *value* is specified, toggles the timeline based on the specified boolean and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.timelineConfig" href="#Viz.timelineConfig">#</a> Viz.**timelineConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1477)

If *value* is specified, sets the config method for the timeline and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.timelineDefault" href="#Viz.timelineDefault">#</a> Viz.**timelineDefault**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1487)

Sets the starting time or range for the timeline. The value provided can either be a single Date/String, or an Array of 2 values representing the min and max.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.timelinePadding" href="#Viz.timelinePadding">#</a> Viz.**timelinePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1502)

Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.title" href="#Viz.title">#</a> Viz.**title**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1512)

If *value* is specified, sets the title accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.titleConfig" href="#Viz.titleConfig">#</a> Viz.**titleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1522)

If *value* is specified, sets the config method for the title and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.titlePadding" href="#Viz.titlePadding">#</a> Viz.**titlePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1532)

Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.tooltip" href="#Viz.tooltip">#</a> Viz.**tooltip**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1542)

If *value* is specified, toggles the tooltip based on the specified boolean and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.tooltipConfig" href="#Viz.tooltipConfig">#</a> Viz.**tooltipConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1552)

If *value* is specified, sets the config method for the tooltip and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.total" href="#Viz.total">#</a> Viz.**total**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1562)

If *value* is specified, sets the total accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.totalConfig" href="#Viz.totalConfig">#</a> Viz.**totalConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1578)

If *value* is specified, sets the config method for the total and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.totalFormat" href="#Viz.totalFormat">#</a> Viz.**totalFormat**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1588)

Formatter function for the value in the total bar.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.totalPadding" href="#Viz.totalPadding">#</a> Viz.**totalPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1598)

Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.width" href="#Viz.width">#</a> Viz.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1608)

If *value* is specified, sets the overallwidth to the specified number and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoom" href="#Viz.zoom">#</a> Viz.**zoom**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1618)

Toggles the ability to zoom/pan the visualization. Certain parameters for zooming are required to be hooked up on a visualization by visualization basis.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomBrushHandleSize" href="#Viz.zoomBrushHandleSize">#</a> Viz.**zoomBrushHandleSize**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1628)

The pixel stroke-width of the zoom brush area.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomBrushHandleStyle" href="#Viz.zoomBrushHandleStyle">#</a> Viz.**zoomBrushHandleStyle**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1638)

An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomBrushSelectionStyle" href="#Viz.zoomBrushSelectionStyle">#</a> Viz.**zoomBrushSelectionStyle**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1648)

An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomControlStyle" href="#Viz.zoomControlStyle">#</a> Viz.**zoomControlStyle**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1658)

An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomControlStyleActive" href="#Viz.zoomControlStyleActive">#</a> Viz.**zoomControlStyleActive**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1668)

An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomControlStyleHover" href="#Viz.zoomControlStyleHover">#</a> Viz.**zoomControlStyleHover**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1678)

An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomFactor" href="#Viz.zoomFactor">#</a> Viz.**zoomFactor**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1688)

The multiplier that is used in with the control buttons when zooming in and out.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomMax" href="#Viz.zoomMax">#</a> Viz.**zoomMax**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1698)

If *value* is specified, sets the max zoom scale to the specified number and returns the current class instance. If *value* is not specified, returns the current max zoom scale.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomPan" href="#Viz.zoomPan">#</a> Viz.**zoomPan**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1708)

If *value* is specified, toggles panning to the specified boolean and returns the current class instance. If *value* is not specified, returns the current panning value.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomPadding" href="#Viz.zoomPadding">#</a> Viz.**zoomPadding**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1718)

A pixel value to be used to pad all sides of a zoomed area.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.zoomScroll" href="#Viz.zoomScroll">#</a> Viz.**zoomScroll**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L1728)

If *value* is specified, toggles scroll zooming to the specified boolean and returns the current class instance. If *value* is not specified, returns the current scroll zooming value.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.parent" href="#Viz.parent">#</a> Viz.**parent**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L156)

If *value* is specified, sets the parent config used by the wrapper and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.


<a name="Viz.shapeConfig" href="#Viz.shapeConfig">#</a> Viz.**shapeConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L180)

If *value* is specified, sets the config method for each shape and returns the current class instance.


This is a static method of [<code>Viz</code>](#Viz), and is chainable with other methods of this Class.

---

<a name="Axis"></a>
#### **Axis** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L135)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Axis](#Axis) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Axis()](#new_Axis_new)
    * [.render([*callback*])](#Axis.render) ↩︎
    * [.align([*value*])](#Axis.align) ↩︎
    * [.barConfig([*value*])](#Axis.barConfig) ↩︎
    * [.data([*value*])](#Axis.data) ↩︎
    * [.domain([*value*])](#Axis.domain) ↩︎
    * [.duration([*value*])](#Axis.duration) ↩︎
    * [.grid([*value*])](#Axis.grid) ↩︎
    * [.gridConfig([*value*])](#Axis.gridConfig) ↩︎
    * [.gridLog([*value*])](#Axis.gridLog) ↩︎
    * [.gridSize([*value*])](#Axis.gridSize) ↩︎
    * [.height([*value*])](#Axis.height) ↩︎
    * [.labels([*value*])](#Axis.labels) ↩︎
    * [.labelOffset([*value*])](#Axis.labelOffset) ↩︎
    * [.labelRotation([*value*])](#Axis.labelRotation) ↩︎
    * [.maxSize(_)](#Axis.maxSize) ↩︎
    * [.minSize(_)](#Axis.minSize) ↩︎
    * [.orient([*orient*])](#Axis.orient) ↩︎
    * [.outerBounds()](#Axis.outerBounds)
    * [.padding([*value*])](#Axis.padding) ↩︎
    * [.paddingInner([*value*])](#Axis.paddingInner) ↩︎
    * [.paddingOuter([*value*])](#Axis.paddingOuter) ↩︎
    * [.range([*value*])](#Axis.range) ↩︎
    * [.rounding([*value*])](#Axis.rounding) ↩︎
    * [.roundingInsideMinPrefix([*value*])](#Axis.roundingInsideMinPrefix) ↩︎
    * [.roundingInsideMinSuffix([*value*])](#Axis.roundingInsideMinSuffix) ↩︎
    * [.roundingInsideMaxPrefix([*value*])](#Axis.roundingInsideMaxPrefix) ↩︎
    * [.roundingInsideMaxSuffix([*value*])](#Axis.roundingInsideMaxSuffix) ↩︎
    * [.scale([*value*])](#Axis.scale) ↩︎
    * [.scalePadding([*value*])](#Axis.scalePadding) ↩︎
    * [.select([*selector*])](#Axis.select) ↩︎
    * [.shape([*value*])](#Axis.shape) ↩︎
    * [.shapeConfig([*value*])](#Axis.shapeConfig) ↩︎
    * [.tickFormat([*value*])](#Axis.tickFormat) ↩︎
    * [.ticks([*value*])](#Axis.ticks) ↩︎
    * [.tickSize([*value*])](#Axis.tickSize) ↩︎
    * [.tickSuffix([*value*])](#Axis.tickSuffix) ↩︎
    * [.timeLocale([*value*])](#Axis.timeLocale) ↩︎
    * [.title([*value*])](#Axis.title) ↩︎
    * [.titleConfig([*value*])](#Axis.titleConfig) ↩︎
    * [.width([*value*])](#Axis.width) ↩︎


<a name="new_Axis_new" href="#new_Axis_new">#</a> new **Axis**()

Creates an SVG scale based on an array of data.





<a name="Axis.render" href="#Axis.render">#</a> Axis.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L363)

Renders the current Axis to the page. If a *callback* is specified, it will be called once the legend is done drawing.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.align" href="#Axis.align">#</a> Axis.**align**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1023)

If *value* is specified, sets the horizontal alignment to the specified value and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.barConfig" href="#Axis.barConfig">#</a> Axis.**barConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1033)

If *value* is specified, sets the axis line style and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.data" href="#Axis.data">#</a> Axis.**data**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1043)

An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.domain" href="#Axis.domain">#</a> Axis.**domain**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1053)

If *value* is specified, sets the scale domain of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.duration" href="#Axis.duration">#</a> Axis.**duration**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1063)

If *value* is specified, sets the transition duration of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.grid" href="#Axis.grid">#</a> Axis.**grid**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1073)

If *value* is specified, sets the grid values of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.gridConfig" href="#Axis.gridConfig">#</a> Axis.**gridConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1083)

If *value* is specified, sets the grid config of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.gridLog" href="#Axis.gridLog">#</a> Axis.**gridLog**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1093)

If *value* is specified, sets the grid behavior of the axis when scale is logarithmic and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.gridSize" href="#Axis.gridSize">#</a> Axis.**gridSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1103)

If *value* is specified, sets the grid size of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.height" href="#Axis.height">#</a> Axis.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1113)

If *value* is specified, sets the overall height of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.labels" href="#Axis.labels">#</a> Axis.**labels**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1123)

If *value* is specified, sets the visible tick labels of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.labelOffset" href="#Axis.labelOffset">#</a> Axis.**labelOffset**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1133)

If *value* is specified, sets whether offsets will be used to position some labels further away from the axis in order to allow space for the text.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.labelRotation" href="#Axis.labelRotation">#</a> Axis.**labelRotation**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1143)

If *value* is specified, sets whether whether horizontal axis labels are rotated -90 degrees.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.maxSize" href="#Axis.maxSize">#</a> Axis.**maxSize**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1153)

If *value* is specified, sets the maximum size allowed for the space that contains the axis tick labels and title.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.minSize" href="#Axis.minSize">#</a> Axis.**minSize**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1163)

If *value* is specified, sets the minimum size alloted for the space that contains the axis tick labels and title.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.orient" href="#Axis.orient">#</a> Axis.**orient**([*orient*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1173)

If *orient* is specified, sets the orientation of the shape and returns the current class instance. If *orient* is not specified, returns the current orientation.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.outerBounds" href="#Axis.outerBounds">#</a> Axis.**outerBounds**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1200)

If called after the elements have been drawn to DOM, will returns the outer bounds of the axis content.


This is a static method of [<code>Axis</code>](#Axis).


```js
{"width": 180, "height": 24, "x": 10, "y": 20}
```


<a name="Axis.padding" href="#Axis.padding">#</a> Axis.**padding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1210)

If *value* is specified, sets the padding between each tick label to the specified number and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.paddingInner" href="#Axis.paddingInner">#</a> Axis.**paddingInner**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1220)

If *value* is specified, sets the inner padding of band scale to the specified number and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.paddingOuter" href="#Axis.paddingOuter">#</a> Axis.**paddingOuter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1230)

If *value* is specified, sets the outer padding of band scales to the specified number and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.range" href="#Axis.range">#</a> Axis.**range**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1240)

If *value* is specified, sets the scale range (in pixels) of the axis and returns the current class instance. The given array must have 2 values, but one may be `undefined` to allow the default behavior for that value.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.rounding" href="#Axis.rounding">#</a> Axis.**rounding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1250)

Sets the rounding method, so that more evenly spaced ticks appear at the extents of the scale. Can be set to "none" (default), "outside", or "inside".


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.roundingInsideMinPrefix" href="#Axis.roundingInsideMinPrefix">#</a> Axis.**roundingInsideMinPrefix**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1260)

Sets the prefix used for the minimum value of "inside" rounding scales.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.roundingInsideMinSuffix" href="#Axis.roundingInsideMinSuffix">#</a> Axis.**roundingInsideMinSuffix**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1270)

Sets the suffix used for the minimum value of "inside" rounding scales.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.roundingInsideMaxPrefix" href="#Axis.roundingInsideMaxPrefix">#</a> Axis.**roundingInsideMaxPrefix**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1280)

Sets the prefix used for the maximum value of "inside" rounding scales.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.roundingInsideMaxSuffix" href="#Axis.roundingInsideMaxSuffix">#</a> Axis.**roundingInsideMaxSuffix**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1290)

Sets the suffix used for the maximum value of "inside" rounding scales.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.scale" href="#Axis.scale">#</a> Axis.**scale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1300)

If *value* is specified, sets the scale of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.scalePadding" href="#Axis.scalePadding">#</a> Axis.**scalePadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1310)

Sets the "padding" property of the scale, often used in point scales.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.select" href="#Axis.select">#</a> Axis.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1320)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.shape" href="#Axis.shape">#</a> Axis.**shape**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1330)

If *value* is specified, sets the tick shape constructor and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.shapeConfig" href="#Axis.shapeConfig">#</a> Axis.**shapeConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1340)

If *value* is specified, sets the tick style of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.tickFormat" href="#Axis.tickFormat">#</a> Axis.**tickFormat**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1350)

If *value* is specified, sets the tick formatter and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.ticks" href="#Axis.ticks">#</a> Axis.**ticks**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1360)

If *value* is specified, sets the tick values of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.tickSize" href="#Axis.tickSize">#</a> Axis.**tickSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1370)

If *value* is specified, sets the tick size of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.tickSuffix" href="#Axis.tickSuffix">#</a> Axis.**tickSuffix**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1380)

Sets the behavior of the abbreviations when you are using linear scale. This method accepts two options: "normal" (uses formatAbbreviate to determinate the abbreviation) and "smallest" (uses suffix from the smallest tick as reference in every tick).


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.timeLocale" href="#Axis.timeLocale">#</a> Axis.**timeLocale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1390)

Defines a custom locale object to be used in time scale. This object must include the following properties: dateTime, date, time, periods, days, shortDays, months, shortMonths. For more information, you can revise [d3p.d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale).


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.title" href="#Axis.title">#</a> Axis.**title**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1400)

If *value* is specified, sets the title of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.titleConfig" href="#Axis.titleConfig">#</a> Axis.**titleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1410)

If *value* is specified, sets the title configuration of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.


<a name="Axis.width" href="#Axis.width">#</a> Axis.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Axis.js#L1420)

If *value* is specified, sets the overall width of the axis and returns the current class instance.


This is a static method of [<code>Axis</code>](#Axis), and is chainable with other methods of this Class.

---

<a name="AxisBottom"></a>
#### **AxisBottom** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/AxisBottom.js#L3)


This is a global class, and extends all of the methods and functionality of [<code>Axis</code>](#Axis).


<a name="new_AxisBottom_new" href="#new_AxisBottom_new">#</a> new **AxisBottom**()

Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.




---

<a name="AxisLeft"></a>
#### **AxisLeft** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/AxisLeft.js#L3)


This is a global class, and extends all of the methods and functionality of [<code>Axis</code>](#Axis).


<a name="new_AxisLeft_new" href="#new_AxisLeft_new">#</a> new **AxisLeft**()

Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.




---

<a name="AxisRight"></a>
#### **AxisRight** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/AxisRight.js#L3)


This is a global class, and extends all of the methods and functionality of [<code>Axis</code>](#Axis).


<a name="new_AxisRight_new" href="#new_AxisRight_new">#</a> new **AxisRight**()

Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.




---

<a name="AxisTop"></a>
#### **AxisTop** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/AxisTop.js#L3)


This is a global class, and extends all of the methods and functionality of [<code>Axis</code>](#Axis).


<a name="new_AxisTop_new" href="#new_AxisTop_new">#</a> new **AxisTop**()

Shorthand method for creating an axis where the ticks are drawn above the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.




---

<a name="ColorScale"></a>
#### **ColorScale** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L19)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [ColorScale](#ColorScale) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new ColorScale()](#new_ColorScale_new)
    * [.render([*callback*])](#ColorScale.render) ↩︎
    * [.axisConfig([*value*])](#ColorScale.axisConfig) ↩︎
    * [.align([*value*])](#ColorScale.align) ↩︎
    * [.buckets([*value*])](#ColorScale.buckets) ↩︎
    * [.bucketAxis([*value*])](#ColorScale.bucketAxis) ↩︎
    * [.bucketFormat([*value*])](#ColorScale.bucketFormat) ↩︎
    * [.bucketJoiner([*value*])](#ColorScale.bucketJoiner) ↩︎
    * [.centered([*value*])](#ColorScale.centered) ↩︎
    * [.color([*value*])](#ColorScale.color) ↩︎
    * [.colorMax([*value*])](#ColorScale.colorMax) ↩︎
    * [.colorMid([*value*])](#ColorScale.colorMid) ↩︎
    * [.colorMin([*value*])](#ColorScale.colorMin) ↩︎
    * [.data([*data*])](#ColorScale.data) ↩︎
    * [.domain([*value*])](#ColorScale.domain) ↩︎
    * [.duration([*value*])](#ColorScale.duration) ↩︎
    * [.height([*value*])](#ColorScale.height) ↩︎
    * [.labelConfig([*value*])](#ColorScale.labelConfig) ↩︎
    * [.labelMin([*value*])](#ColorScale.labelMin) ↩︎
    * [.labelMax([*value*])](#ColorScale.labelMax) ↩︎
    * [.legendConfig([*value*])](#ColorScale.legendConfig) ↩︎
    * [.midpoint([*value*])](#ColorScale.midpoint) ↩︎
    * [.orient([*value*])](#ColorScale.orient) ↩︎
    * [.outerBounds()](#ColorScale.outerBounds)
    * [.padding([*value*])](#ColorScale.padding) ↩︎
    * [.rectConfig([*value*])](#ColorScale.rectConfig) ↩︎
    * [.scale([*value*])](#ColorScale.scale) ↩︎
    * [.select([*selector*])](#ColorScale.select) ↩︎
    * [.size([*value*])](#ColorScale.size) ↩︎
    * [.value([*value*])](#ColorScale.value) ↩︎
    * [.width([*value*])](#ColorScale.width) ↩︎


<a name="new_ColorScale_new" href="#new_ColorScale_new">#</a> new **ColorScale**()

Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.





<a name="ColorScale.render" href="#ColorScale.render">#</a> ColorScale.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L116)

Renders the current ColorScale to the page. If a *callback* is specified, it will be called once the ColorScale is done drawing.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.axisConfig" href="#ColorScale.axisConfig">#</a> ColorScale.**axisConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L537)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.align" href="#ColorScale.align">#</a> ColorScale.**align**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L547)

If *value* is specified, sets the horizontal alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current horizontal alignment.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.buckets" href="#ColorScale.buckets">#</a> ColorScale.**buckets**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L557)

The number of discrete buckets to create in a bucketed color scale. Will be overridden by any custom Array of colors passed to the `color` method. Optionally, users can supply an Array of values used to separate buckets, such as `[0, 10, 25, 50, 90]` for a percentage scale. This value would create 4 buckets, with each value representing the break point between each bucket (so 5 values makes 4 buckets).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.bucketAxis" href="#ColorScale.bucketAxis">#</a> ColorScale.**bucketAxis**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L567)

Determines whether or not to use an Axis to display bucket scales (both "buckets" and "jenks"). When set to `false`, bucketed scales will use the `Legend` class to display squares for each range of data. When set to `true`, bucketed scales will be displayed on an `Axis`, similar to "linear" scales.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.bucketFormat" href="#ColorScale.bucketFormat">#</a> ColorScale.**bucketFormat**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L577)

A function for formatting the labels associated to each bucket in a bucket-type scale ("jenks", "quantile", etc). The function is passed four arguments: the start value of the current bucket, it's index in the full Array of buckets, the full Array of buckets, and an Array of every value present in the data used to construct the buckets. Keep in mind that the end value for the bucket is not actually the next bucket in the list, but includes every value up until that next bucket value (less than, but not equal to). By default, d3plus will make the end value slightly less than it's current value, so that it does not overlap with the start label for the next bucket.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.bucketJoiner" href="#ColorScale.bucketJoiner">#</a> ColorScale.**bucketJoiner**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L587)

A function that receives the minimum and maximum values of a bucket, and is expected to return the full label.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.centered" href="#ColorScale.centered">#</a> ColorScale.**centered**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L598)

Determines whether or not to display a midpoint centered Axis. Does not apply to quantile scales.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.color" href="#ColorScale.color">#</a> ColorScale.**color**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L608)

Overrides the default internal logic of `colorMin`, `colorMid`, and `colorMax` to only use just this specified color. If a single color is given as a String, then the scale is interpolated by lightening that color. Otherwise, the function expects an Array of color values to be used in order for the scale.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.colorMax" href="#ColorScale.colorMax">#</a> ColorScale.**colorMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L618)

Defines the color to be used for numbers greater than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.colorMid" href="#ColorScale.colorMid">#</a> ColorScale.**colorMid**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L628)

Defines the color to be used for the midpoint of a diverging scale, based on the current value of the `midpoint` method (defaults to `0`). Colors in between this value and the values of `colorMin` and `colorMax` will be interpolated, unless a custom Array of colors has been specified using the `color` method.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.colorMin" href="#ColorScale.colorMin">#</a> ColorScale.**colorMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L638)

Defines the color to be used for numbers less than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.data" href="#ColorScale.data">#</a> ColorScale.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L648)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape key will be drawn for each object in the array.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.domain" href="#ColorScale.domain">#</a> ColorScale.**domain**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L658)

In a linear scale, this Array of 2 values defines the min and max values used in the color scale. Any values outside of this range will be mapped to the nearest color value.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.duration" href="#ColorScale.duration">#</a> ColorScale.**duration**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L668)

If *value* is specified, sets the transition duration of the ColorScale and returns the current class instance. If *value* is not specified, returns the current duration.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.height" href="#ColorScale.height">#</a> ColorScale.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L678)

If *value* is specified, sets the overall height of the ColorScale and returns the current class instance. If *value* is not specified, returns the current height value.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.labelConfig" href="#ColorScale.labelConfig">#</a> ColorScale.**labelConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L688)

A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.labelMin" href="#ColorScale.labelMin">#</a> ColorScale.**labelMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L698)

Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.labelMax" href="#ColorScale.labelMax">#</a> ColorScale.**labelMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L708)

Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.legendConfig" href="#ColorScale.legendConfig">#</a> ColorScale.**legendConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L718)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.midpoint" href="#ColorScale.midpoint">#</a> ColorScale.**midpoint**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L728)

The number value to be used as the anchor for `colorMid`, and defines the center point of the diverging color scale.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.orient" href="#ColorScale.orient">#</a> ColorScale.**orient**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L738)

Sets the flow of the items inside the ColorScale. If no value is passed, the current flow will be returned.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.outerBounds" href="#ColorScale.outerBounds">#</a> ColorScale.**outerBounds**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L748)

If called after the elements have been drawn to DOM, will returns the outer bounds of the ColorScale content.


This is a static method of [<code>ColorScale</code>](#ColorScale).


```js
{"width": 180, "height": 24, "x": 10, "y": 20}
```


<a name="ColorScale.padding" href="#ColorScale.padding">#</a> ColorScale.**padding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L758)

If *value* is specified, sets the padding between each key to the specified number and returns the current class instance. If *value* is not specified, returns the current padding value.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.rectConfig" href="#ColorScale.rectConfig">#</a> ColorScale.**rectConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L768)

The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.scale" href="#ColorScale.scale">#</a> ColorScale.**scale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L778)

If *value* is specified, sets the scale of the ColorScale and returns the current class instance. If *value* is not specified, returns the current scale value.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.select" href="#ColorScale.select">#</a> ColorScale.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L788)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.size" href="#ColorScale.size">#</a> ColorScale.**size**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L798)

The height of horizontal color scales, and width when positioned vertical.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


<a name="ColorScale.value" href="#ColorScale.value">#</a> ColorScale.**value**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L812)

If *value* is specified, sets the value accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current value accessor.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.


```js
function value(d) {
  return d.value;
}
```


<a name="ColorScale.width" href="#ColorScale.width">#</a> ColorScale.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/ColorScale.js#L822)

If *value* is specified, sets the overall width of the ColorScale and returns the current class instance. If *value* is not specified, returns the current width value.


This is a static method of [<code>ColorScale</code>](#ColorScale), and is chainable with other methods of this Class.

---

<a name="Legend"></a>
#### **Legend** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L13)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Legend](#Legend) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Legend()](#new_Legend_new)
    * [.render([*callback*])](#Legend.render) ↩︎
    * [.active([*value*])](#Legend.active) ↩︎
    * [.align([*value*])](#Legend.align) ↩︎
    * [.data([*data*])](#Legend.data) ↩︎
    * [.direction([*value*])](#Legend.direction) ↩︎
    * [.duration([*value*])](#Legend.duration) ↩︎
    * [.height([*value*])](#Legend.height) ↩︎
    * [.hover([*value*])](#Legend.hover) ↩︎
    * [.id([*value*])](#Legend.id) ↩︎
    * [.label([*value*])](#Legend.label) ↩︎
    * [.outerBounds()](#Legend.outerBounds)
    * [.padding([*value*])](#Legend.padding) ↩︎
    * [.select([*selector*])](#Legend.select) ↩︎
    * [.shape([*value*])](#Legend.shape) ↩︎
    * [.shapeConfig([*config*])](#Legend.shapeConfig) ↩︎
    * [.title([*value*])](#Legend.title) ↩︎
    * [.titleConfig([*value*])](#Legend.titleConfig) ↩︎
    * [.verticalAlign([*value*])](#Legend.verticalAlign) ↩︎
    * [.width([*value*])](#Legend.width) ↩︎


<a name="new_Legend_new" href="#new_Legend_new">#</a> new **Legend**()

Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.





<a name="Legend.render" href="#Legend.render">#</a> Legend.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L120)

Renders the current Legend to the page. If a *callback* is specified, it will be called once the legend is done drawing.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.active" href="#Legend.active">#</a> Legend.**active**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L379)

If *value* is specified, sets the active method for all shapes to the specified function and returns the current class instance. If *value* is not specified, returns the current active method.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.align" href="#Legend.align">#</a> Legend.**align**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L390)

If *value* is specified, sets the horizontal alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current horizontal alignment.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.data" href="#Legend.data">#</a> Legend.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L400)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape key will be drawn for each object in the array.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.direction" href="#Legend.direction">#</a> Legend.**direction**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L410)

Sets the flow of the items inside the legend. If no value is passed, the current flow will be returned.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.duration" href="#Legend.duration">#</a> Legend.**duration**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L420)

If *value* is specified, sets the transition duration of the legend and returns the current class instance. If *value* is not specified, returns the current duration.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.height" href="#Legend.height">#</a> Legend.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L430)

If *value* is specified, sets the overall height of the legend and returns the current class instance. If *value* is not specified, returns the current height value.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.hover" href="#Legend.hover">#</a> Legend.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L440)

If *value* is specified, sets the hover method for all shapes to the specified function and returns the current class instance. If *value* is not specified, returns the current hover method.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.id" href="#Legend.id">#</a> Legend.**id**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L455)

If *value* is specified, sets the id accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current id accessor.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


```js
function value(d) {
  return d.id;
}
```


<a name="Legend.label" href="#Legend.label">#</a> Legend.**label**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L465)

If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current label accessor, which is the [id](#shape.id) accessor by default.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.outerBounds" href="#Legend.outerBounds">#</a> Legend.**outerBounds**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L475)

If called after the elements have been drawn to DOM, will returns the outer bounds of the legend content.


This is a static method of [<code>Legend</code>](#Legend).


```js
{"width": 180, "height": 24, "x": 10, "y": 20}
```


<a name="Legend.padding" href="#Legend.padding">#</a> Legend.**padding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L485)

If *value* is specified, sets the padding between each key to the specified number and returns the current class instance. If *value* is not specified, returns the current padding value.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.select" href="#Legend.select">#</a> Legend.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L495)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.shape" href="#Legend.shape">#</a> Legend.**shape**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L510)

If *value* is specified, sets the shape accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current shape accessor.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.shapeConfig" href="#Legend.shapeConfig">#</a> Legend.**shapeConfig**([*config*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L520)

If *config* is specified, sets the methods that correspond to the key/value pairs for each shape and returns the current class instance. If *config* is not specified, returns the current shape configuration.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.title" href="#Legend.title">#</a> Legend.**title**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L530)

If *value* is specified, sets the title of the legend and returns the current class instance. If *value* is not specified, returns the current title.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.titleConfig" href="#Legend.titleConfig">#</a> Legend.**titleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L540)

If *value* is specified, sets the title configuration of the legend and returns the current class instance. If *value* is not specified, returns the current title configuration.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.verticalAlign" href="#Legend.verticalAlign">#</a> Legend.**verticalAlign**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L550)

If *value* is specified, sets the vertical alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current vertical alignment.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.


<a name="Legend.width" href="#Legend.width">#</a> Legend.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Legend.js#L560)

If *value* is specified, sets the overall width of the legend and returns the current class instance. If *value* is not specified, returns the current width value.


This is a static method of [<code>Legend</code>](#Legend), and is chainable with other methods of this Class.

---

<a name="Timeline"></a>
#### **Timeline** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L17)


This is a global class, and extends all of the methods and functionality of [<code>Axis</code>](#Axis).


* [Timeline](#Timeline) ⇐ [<code>Axis</code>](#Axis)
    * [.render([*callback*])](#Timeline.render) ↩︎
    * [.buttonPadding([*value*])](#Timeline.buttonPadding) ↩︎
    * [.brushing([*value*])](#Timeline.brushing) ↩︎
    * [.brushFilter([*value*])](#Timeline.brushFilter) ↩︎
    * [.brushMin([*value*])](#Timeline.brushMin) ↩︎
    * [.buttonAlign([*value*])](#Timeline.buttonAlign) ↩︎
    * [.buttonBehavior([*value*])](#Timeline.buttonBehavior) ↩︎
    * [.buttonHeight([*value*])](#Timeline.buttonHeight) ↩︎
    * [.handleConfig([*value*])](#Timeline.handleConfig) ↩︎
    * [.handleSize([*value*])](#Timeline.handleSize) ↩︎
    * [.on([*typename*], [*listener*])](#Timeline.on) ↩︎
    * [.playButton([*value*])](#Timeline.playButton) ↩︎
    * [.playButtonConfig([*value*])](#Timeline.playButtonConfig) ↩︎
    * [.playButtonInterval([*value*])](#Timeline.playButtonInterval) ↩︎
    * [.selectionConfig([*value*])](#Timeline.selectionConfig) ↩︎
    * [.selection([*value*])](#Timeline.selection) ↩︎
    * [.snapping([*value*])](#Timeline.snapping) ↩︎


<a name="Timeline.render" href="#Timeline.render">#</a> Timeline.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L376)

Draws the timeline.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.buttonPadding" href="#Timeline.buttonPadding">#</a> Timeline.**buttonPadding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L526)

If *value* is specified, sets the button padding and returns the current class instance. If *value* is not specified, returns the current button padding.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.brushing" href="#Timeline.brushing">#</a> Timeline.**brushing**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L536)

If *value* is specified, toggles the brushing value and returns the current class instance. If *value* is not specified, returns the current brushing value.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.brushFilter" href="#Timeline.brushFilter">#</a> Timeline.**brushFilter**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L550)

If *value* is specified, sets the brush event filter and returns the current class instance. If *value* is not specified, returns the current brush event filter.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


```js
function() {
  return !event.button && event.detail < 2;
}
```


<a name="Timeline.brushMin" href="#Timeline.brushMin">#</a> Timeline.**brushMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L560)

Sets the minimum number of "ticks" to allow to be highlighted when using "ticks" buttonBehavior. Helpful when using x/y plots where you don't want the user to select less than 2 time periods. Value passed can either be a static Number, or a function that is expected to return a Number.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.buttonAlign" href="#Timeline.buttonAlign">#</a> Timeline.**buttonAlign**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L570)

If *value* is specified, toggles the horizontal alignment of the button timeline. Accepted values are `"start"`, `"middle"` and `"end"`. If *value* is not specified, returns the current button value.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.buttonBehavior" href="#Timeline.buttonBehavior">#</a> Timeline.**buttonBehavior**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L580)

If *value* is specified, toggles the style of the timeline. Accepted values are `"auto"`, `"buttons"` and `"ticks"`. If *value* is not specified, returns the current button value.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.buttonHeight" href="#Timeline.buttonHeight">#</a> Timeline.**buttonHeight**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L590)

If *value* is specified, sets the button height and returns the current class instance. If *value* is not specified, returns the current button height.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.handleConfig" href="#Timeline.handleConfig">#</a> Timeline.**handleConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L600)

If *value* is specified, sets the handle style and returns the current class instance. If *value* is not specified, returns the current handle style.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.handleSize" href="#Timeline.handleSize">#</a> Timeline.**handleSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L610)

If *value* is specified, sets the handle size and returns the current class instance. If *value* is not specified, returns the current handle size.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.on" href="#Timeline.on">#</a> Timeline.**on**([*typename*], [*listener*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L621)

Adds or removes a *listener* for the specified brush event *typename*. If a *listener* is not specified, returns the currently-assigned listener for the specified event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.

| Param | Type |
| --- | --- |
| [*typename*] | <code>String</code> \| <code>Object</code> | 
| [*listener*] | <code>function</code> | 



<a name="Timeline.playButton" href="#Timeline.playButton">#</a> Timeline.**playButton**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L631)

Determines the visibility of the play button to the left the of timeline, which will cycle through the available periods at a rate defined by the playButtonInterval method.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.playButtonConfig" href="#Timeline.playButtonConfig">#</a> Timeline.**playButtonConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L641)

The config Object for the Rect class used to create the playButton.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.playButtonInterval" href="#Timeline.playButtonInterval">#</a> Timeline.**playButtonInterval**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L651)

The value, in milliseconds, to use when cycling through the available time periods when the user clicks the playButton.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.selectionConfig" href="#Timeline.selectionConfig">#</a> Timeline.**selectionConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L661)

If *value* is specified, sets the selection style and returns the current class instance. If *value* is not specified, returns the current selection style.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.selection" href="#Timeline.selection">#</a> Timeline.**selection**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L671)

If *value* is specified, sets the selection and returns the current class instance. If *value* is not specified, returns the current selection. Defaults to the most recent year in the timeline.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.


<a name="Timeline.snapping" href="#Timeline.snapping">#</a> Timeline.**snapping**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Timeline.js#L681)

If *value* is specified, toggles the snapping value and returns the current class instance. If *value* is not specified, returns the current snapping value.


This is a static method of [<code>Timeline</code>](#Timeline), and is chainable with other methods of this Class.

---

<a name="Tooltip"></a>
#### **Tooltip** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L24)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Tooltip](#Tooltip) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Tooltip()](#new_Tooltip_new)
    * [.arrow([*value*])](#Tooltip.arrow)
    * [.arrowStyle([*value*])](#Tooltip.arrowStyle)
    * [.background([*value*])](#Tooltip.background)
    * [.body([*value*])](#Tooltip.body)
    * [.bodyStyle([*value*])](#Tooltip.bodyStyle)
    * [.border([*value*])](#Tooltip.border)
    * [.borderRadius([*value*])](#Tooltip.borderRadius)
    * [.className([*value*])](#Tooltip.className)
    * [.data([*data*])](#Tooltip.data)
    * [.footer([*value*])](#Tooltip.footer)
    * [.footerStyle([*value*])](#Tooltip.footerStyle)
    * [.height([*value*])](#Tooltip.height)
    * [.id([*value*])](#Tooltip.id)
    * [.offset([*value*])](#Tooltip.offset)
    * [.padding([*value*])](#Tooltip.padding)
    * [.pointerEvents([*value*])](#Tooltip.pointerEvents)
    * [.position([*value*])](#Tooltip.position)
    * [.tableStyle([*value*])](#Tooltip.tableStyle)
    * [.tbody([*value*])](#Tooltip.tbody)
    * [.tbodyStyle([*value*])](#Tooltip.tbodyStyle)
    * [.thead([*value*])](#Tooltip.thead)
    * [.theadStyle([*value*])](#Tooltip.theadStyle)
    * [.title([*value*])](#Tooltip.title)
    * [.titleStyle([*value*])](#Tooltip.titleStyle)
    * [.trStyle([*value*])](#Tooltip.trStyle)
    * [.tdStyle([*value*])](#Tooltip.tdStyle)
    * [.width([*value*])](#Tooltip.width)


<a name="new_Tooltip_new" href="#new_Tooltip_new">#</a> new **Tooltip**()

Creates HTML tooltips in the body of a webpage.





<a name="Tooltip.arrow" href="#Tooltip.arrow">#</a> Tooltip.**arrow**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L337)

Sets the inner HTML content of the arrow element, which by default is empty.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
   function value(d) {
  return d.arrow || "";
}
```


<a name="Tooltip.arrowStyle" href="#Tooltip.arrowStyle">#</a> Tooltip.**arrowStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L354)

If *value* is specified, sets the arrow styles to the specified values and returns this generator. If *value* is not specified, returns the current arrow styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
   {
     "content": "",
     "border-width": "10px",
     "border-style": "solid",
     "border-color": "rgba(255, 255, 255, 0.75) transparent transparent transparent",
     "position": "absolute"
   }
```


<a name="Tooltip.background" href="#Tooltip.background">#</a> Tooltip.**background**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L363)

If *value* is specified, sets the background accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current background accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.body" href="#Tooltip.body">#</a> Tooltip.**body**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L376)

If *value* is specified, sets the body accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current body accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
function value(d) {
  return d.body || "";
}
```


<a name="Tooltip.bodyStyle" href="#Tooltip.bodyStyle">#</a> Tooltip.**bodyStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L391)

If *value* is specified, sets the body styles to the specified values and returns this generator. If *value* is not specified, returns the current body styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "font-family": "'Roboto', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "12px",
  "font-weight": "400"
}
```


<a name="Tooltip.border" href="#Tooltip.border">#</a> Tooltip.**border**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L400)

If *value* is specified, sets the border accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current border accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.borderRadius" href="#Tooltip.borderRadius">#</a> Tooltip.**borderRadius**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L409)

If *value* is specified, sets the border-radius accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current border-radius accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.className" href="#Tooltip.className">#</a> Tooltip.**className**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L418)

If *value* is specified, sets the class name to the specified string and returns this generator. If *value* is not specified, returns the current class name.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.data" href="#Tooltip.data">#</a> Tooltip.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L427)

If *data* is specified, sets the data array to the specified array and returns this generator. If *data* is not specified, returns the current data array.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.footer" href="#Tooltip.footer">#</a> Tooltip.**footer**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L440)

If *value* is specified, sets the footer accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current footer accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
function value(d) {
  return d.footer || "";
}
```


<a name="Tooltip.footerStyle" href="#Tooltip.footerStyle">#</a> Tooltip.**footerStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L455)

If *value* is specified, sets the footer styles to the specified values and returns this generator. If *value* is not specified, returns the current footer styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "font-family": "'Roboto', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "12px",
  "font-weight": "400"
}
```


<a name="Tooltip.height" href="#Tooltip.height">#</a> Tooltip.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L464)

If *value* is specified, sets the height accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current height accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.id" href="#Tooltip.id">#</a> Tooltip.**id**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L477)

If *value* is specified, sets the id accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current id accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
function value(d, i) {
  return d.id || "" + i;
}
```


<a name="Tooltip.offset" href="#Tooltip.offset">#</a> Tooltip.**offset**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L486)

If *value* is specified, sets the offset accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current offset accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.padding" href="#Tooltip.padding">#</a> Tooltip.**padding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L495)

If *value* is specified, sets the padding accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current padding accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.pointerEvents" href="#Tooltip.pointerEvents">#</a> Tooltip.**pointerEvents**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L504)

If *value* is specified, sets the pointer-events accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current pointer-events accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.position" href="#Tooltip.position">#</a> Tooltip.**position**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L517)

If *value* is specified, sets the position accessor to the specified function or array and returns this generator. If *value* is not specified, returns the current position accessor. If *value* is an HTMLElement, anchors the Tooltip to that HTMLElement. If *value* is a selection string, anchors the Tooltip to the HTMLElement selected by that string. Otherwise, coordinate points must be in reference to the client viewport, not the overall page.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
   function value(d) {
    return [d.x, d.y];
  }
```


<a name="Tooltip.tableStyle" href="#Tooltip.tableStyle">#</a> Tooltip.**tableStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L532)

If *value* is specified, sets the table styles to the specified values and returns this generator. If *value* is not specified, returns the current table styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "border-collapse": "collapse",
  "border-spacing": "0",
  "width": "100%"
}
```


<a name="Tooltip.tbody" href="#Tooltip.tbody">#</a> Tooltip.**tbody**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L541)

If *value* is specified, sets the contents of the table body to the specified array of functions or strings and returns this generator. If *value* is not specified, returns the current table body data.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.tbodyStyle" href="#Tooltip.tbodyStyle">#</a> Tooltip.**tbodyStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L557)

If *value* is specified, sets the table body styles to the specified values and returns this generator. If *value* is not specified, returns the current table body styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "font-family": "'Roboto', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
```


<a name="Tooltip.thead" href="#Tooltip.thead">#</a> Tooltip.**thead**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L566)

If *value* is specified, sets the contents of the table head to the specified array of functions or strings and returns this generator. If *value* is not specified, returns the current table head data.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.theadStyle" href="#Tooltip.theadStyle">#</a> Tooltip.**theadStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L582)

If *value* is specified, sets the table head styles to the specified values and returns this generator. If *value* is not specified, returns the current table head styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "font-family": "'Roboto', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
```


<a name="Tooltip.title" href="#Tooltip.title">#</a> Tooltip.**title**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L595)

If *value* is specified, sets the title accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current title accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default accessor

```js
function value(d) {
  return d.title || "";
}
```


<a name="Tooltip.titleStyle" href="#Tooltip.titleStyle">#</a> Tooltip.**titleStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L611)

If *value* is specified, sets the title styles to the specified values and returns this generator. If *value* is not specified, returns the current title styles.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
{
  "font-family": "'Roboto', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "14px",
  "font-weight": "600",
  "padding-bottom": "5px"
}
```


<a name="Tooltip.trStyle" href="#Tooltip.trStyle">#</a> Tooltip.**trStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L624)

An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.


This is a static method of [<code>Tooltip</code>](#Tooltip).
default styles

```js
  {
    "border-top": "1px solid rgba(0, 0, 0, 0.1)"
  }
```


<a name="Tooltip.tdStyle" href="#Tooltip.tdStyle">#</a> Tooltip.**tdStyle**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L633)

An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.


This is a static method of [<code>Tooltip</code>](#Tooltip).


<a name="Tooltip.width" href="#Tooltip.width">#</a> Tooltip.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L642)

If *value* is specified, sets the width accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current width accessor.


This is a static method of [<code>Tooltip</code>](#Tooltip).

---

<a name="Area"></a>
#### **Area** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L13)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Area](#Area) ⇐ [<code>Shape</code>](#Shape)
    * [new Area()](#new_Area_new)
    * [.render([*callback*])](#Area.render) ↩︎
    * [.curve([*value*])](#Area.curve) ↩︎
    * [.defined([*value*])](#Area.defined) ↩︎
    * [.x([*value*])](#Area.x) ↩︎
    * [.x0([*value*])](#Area.x0) ↩︎
    * [.x1([*value*])](#Area.x1) ↩︎
    * [.y([*value*])](#Area.y) ↩︎
    * [.y0([*value*])](#Area.y0) ↩︎
    * [.y1([*value*])](#Area.y1) ↩︎


<a name="new_Area_new" href="#new_Area_new">#</a> new **Area**()

Creates SVG areas based on an array of data.





<a name="Area.render" href="#Area.render">#</a> Area.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L114)

Draws the area polygons.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.curve" href="#Area.curve">#</a> Area.**curve**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L167)

If *value* is specified, sets the area curve to the specified string and returns the current class instance. If *value* is not specified, returns the current area curve.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.defined" href="#Area.defined">#</a> Area.**defined**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L177)

If *value* is specified, sets the defined accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current defined accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.x" href="#Area.x">#</a> Area.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L187)

If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.x0" href="#Area.x0">#</a> Area.**x0**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L200)

If *value* is specified, sets the x0 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x0 accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.x1" href="#Area.x1">#</a> Area.**x1**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L213)

If *value* is specified, sets the x1 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x1 accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.y" href="#Area.y">#</a> Area.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L223)

If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.y0" href="#Area.y0">#</a> Area.**y0**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L236)

If *value* is specified, sets the y0 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y0 accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.


<a name="Area.y1" href="#Area.y1">#</a> Area.**y1**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Area.js#L249)

If *value* is specified, sets the y1 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y1 accessor.


This is a static method of [<code>Area</code>](#Area), and is chainable with other methods of this Class.

---

<a name="Bar"></a>
#### **Bar** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L5)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Bar](#Bar) ⇐ [<code>Shape</code>](#Shape)
    * [new Bar()](#new_Bar_new)
    * [.render([*callback*])](#Bar.render) ↩︎
    * [.height([*value*])](#Bar.height) ↩︎
    * [.width([*value*])](#Bar.width) ↩︎
    * [.x0([*value*])](#Bar.x0) ↩︎
    * [.x1([*value*])](#Bar.x1) ↩︎
    * [.y0([*value*])](#Bar.y0) ↩︎
    * [.y1([*value*])](#Bar.y1) ↩︎


<a name="new_Bar_new" href="#new_Bar_new">#</a> new **Bar**()

Creates SVG areas based on an array of data.





<a name="Bar.render" href="#Bar.render">#</a> Bar.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L45)

Draws the bars.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


<a name="Bar.height" href="#Bar.height">#</a> Bar.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L164)

If *value* is specified, sets the height accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


```js
function(d) {
  return d.height;
}
```


<a name="Bar.width" href="#Bar.width">#</a> Bar.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L178)

If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


```js
function(d) {
  return d.width;
}
```


<a name="Bar.x0" href="#Bar.x0">#</a> Bar.**x0**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L188)

If *value* is specified, sets the x0 accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


<a name="Bar.x1" href="#Bar.x1">#</a> Bar.**x1**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L201)

If *value* is specified, sets the x1 accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


<a name="Bar.y0" href="#Bar.y0">#</a> Bar.**y0**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L211)

If *value* is specified, sets the y0 accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.


<a name="Bar.y1" href="#Bar.y1">#</a> Bar.**y1**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Bar.js#L224)

If *value* is specified, sets the y1 accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Bar</code>](#Bar), and is chainable with other methods of this Class.

---

<a name="Box"></a>
#### **Box** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L15)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Box](#Box) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Box()](#new_Box_new)
    * [.render([*callback*])](#Box.render) ↩︎
    * [.active([*value*])](#Box.active) ↩︎
    * [.data([*data*])](#Box.data) ↩︎
    * [.hover([*value*])](#Box.hover) ↩︎
    * [.medianConfig([*value*])](#Box.medianConfig) ↩︎
    * [.orient([*value*])](#Box.orient) ↩︎
    * [.outlier(_)](#Box.outlier) ↩︎
    * [.outlierConfig([*value*])](#Box.outlierConfig) ↩︎
    * [.rectConfig([*value*])](#Box.rectConfig) ↩︎
    * [.rectWidth([*value*])](#Box.rectWidth) ↩︎
    * [.select([*selector*])](#Box.select) ↩︎
    * [.whiskerConfig([*value*])](#Box.whiskerConfig) ↩︎
    * [.whiskerMode([*value*])](#Box.whiskerMode) ↩︎
    * [.x([*value*])](#Box.x) ↩︎
    * [.y([*value*])](#Box.y) ↩︎


<a name="new_Box_new" href="#new_Box_new">#</a> new **Box**()

Creates SVG box based on an array of data.





<a name="Box.render" href="#Box.render">#</a> Box.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L64)

Draws the Box.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.active" href="#Box.active">#</a> Box.**active**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L230)

Sets the highlight accessor to the Shape class's active function.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.data" href="#Box.data">#</a> Box.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L243)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.hover" href="#Box.hover">#</a> Box.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L253)

Sets the highlight accessor to the Shape class's hover function.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.medianConfig" href="#Box.medianConfig">#</a> Box.**medianConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L266)

If *value* is specified, sets the config method for median and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.orient" href="#Box.orient">#</a> Box.**orient**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L276)

If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.outlier" href="#Box.outlier">#</a> Box.**outlier**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L286)

If *value* is specified, sets the outlier accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.outlierConfig" href="#Box.outlierConfig">#</a> Box.**outlierConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L296)

If *value* is specified, sets the config method for each outlier point and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.rectConfig" href="#Box.rectConfig">#</a> Box.**rectConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L306)

If *value* is specified, sets the config method for rect shape and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.rectWidth" href="#Box.rectWidth">#</a> Box.**rectWidth**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L320)

If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


```js
function(d) {
  return d.width;
}
```


<a name="Box.select" href="#Box.select">#</a> Box.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L330)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.whiskerConfig" href="#Box.whiskerConfig">#</a> Box.**whiskerConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L340)

If *value* is specified, sets the config method for whisker and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.whiskerMode" href="#Box.whiskerMode">#</a> Box.**whiskerMode**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L350)

Determines the value used for each whisker. Can be passed a single value to apply for both whiskers, or an Array of 2 values for the lower and upper whiskers (in that order). Accepted values are `"tukey"`, `"extent"`, or a Number representing a quantile.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


<a name="Box.x" href="#Box.x">#</a> Box.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L364)

If *value* is specified, sets the x axis to the specified function or number and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


```js
function(d) {
  return d.x;
}
```


<a name="Box.y" href="#Box.y">#</a> Box.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Box.js#L378)

If *value* is specified, sets the y axis to the specified function or number and returns the current class instance.


This is a static method of [<code>Box</code>](#Box), and is chainable with other methods of this Class.


```js
function(d) {
  return d.y;
}
```

---

<a name="Circle"></a>
#### **Circle** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Circle.js#L6)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Circle](#Circle) ⇐ [<code>Shape</code>](#Shape)
    * [new Circle()](#new_Circle_new)
    * [.render([*callback*])](#Circle.render) ↩︎
    * [.r([*value*])](#Circle.r) ↩︎


<a name="new_Circle_new" href="#new_Circle_new">#</a> new **Circle**()

Creates SVG circles based on an array of data.





<a name="Circle.render" href="#Circle.render">#</a> Circle.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Circle.js#L48)

Draws the circles.


This is a static method of [<code>Circle</code>](#Circle), and is chainable with other methods of this Class.


<a name="Circle.r" href="#Circle.r">#</a> Circle.**r**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Circle.js#L99)

If *value* is specified, sets the radius accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Circle</code>](#Circle), and is chainable with other methods of this Class.


```js
function(d) {
  return d.r;
}
```

---

<a name="Image"></a>
#### **Image** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L6)


This is a global class.


* [Image](#Image)
    * [new Image()](#new_Image_new)
    * [.render([*callback*])](#Image.render) ↩︎
    * [.data([*data*])](#Image.data) ↩︎
    * [.duration([*ms*])](#Image.duration) ↩︎
    * [.height([*value*])](#Image.height) ↩︎
    * [.id([*value*])](#Image.id) ↩︎
    * [.opacity([*value*])](#Image.opacity) ↩︎
    * [.pointerEvents([*value*])](#Image.pointerEvents) ↩︎
    * [.select([*selector*])](#Image.select) ↩︎
    * [.url([*value*])](#Image.url) ↩︎
    * [.width([*value*])](#Image.width) ↩︎
    * [.x([*value*])](#Image.x) ↩︎
    * [.y([*value*])](#Image.y) ↩︎


<a name="new_Image_new" href="#new_Image_new">#</a> new **Image**()

Creates SVG images based on an array of data.



a sample row of data

```js
var data = {"url": "file.png", "width": "100", "height": "50"};
```
passed to the generator

```js
new Image().data([data]).render();
```
creates the following

```js
<image class="d3plus-Image" opacity="1" href="file.png" width="100" height="50" x="0" y="0"></image>
```
this is shorthand for the following

```js
image().data([data])();
```
which also allows a post-draw callback function

```js
image().data([data])(function() { alert("draw complete!"); })
```


<a name="Image.render" href="#Image.render">#</a> Image.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L46)

Renders the current Image to the page. If a *callback* is specified, it will be called once the images are done drawing.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.data" href="#Image.data">#</a> Image.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L110)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. An <image> tag will be drawn for each object in the array.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.duration" href="#Image.duration">#</a> Image.**duration**([*ms*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L120)

If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.height" href="#Image.height">#</a> Image.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L134)

If *value* is specified, sets the height accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.height;
}
```


<a name="Image.id" href="#Image.id">#</a> Image.**id**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L148)

If *value* is specified, sets the id accessor to the specified function and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.id;
}
```


<a name="Image.opacity" href="#Image.opacity">#</a> Image.**opacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L158)

Sets the opacity of the image.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.pointerEvents" href="#Image.pointerEvents">#</a> Image.**pointerEvents**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L168)

If *value* is specified, sets the pointer-events accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.select" href="#Image.select">#</a> Image.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L178)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


<a name="Image.url" href="#Image.url">#</a> Image.**url**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L192)

If *value* is specified, sets the URL accessor to the specified function and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.url;
}
```


<a name="Image.width" href="#Image.width">#</a> Image.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L206)

If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.width;
}
```


<a name="Image.x" href="#Image.x">#</a> Image.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L220)

If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.x || 0;
}
```


<a name="Image.y" href="#Image.y">#</a> Image.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Image.js#L234)

If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Image</code>](#Image), and is chainable with other methods of this Class.


```js
function(d) {
  return d.y || 0;
}
```

---

<a name="Line"></a>
#### **Line** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Line.js#L12)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Line](#Line) ⇐ [<code>Shape</code>](#Shape)
    * [new Line()](#new_Line_new)
    * [.render([*callback*])](#Line.render) ↩︎
    * [.curve([*value*])](#Line.curve) ↩︎
    * [.defined([*value*])](#Line.defined) ↩︎


<a name="new_Line_new" href="#new_Line_new">#</a> new **Line**()

Creates SVG lines based on an array of data.





<a name="Line.render" href="#Line.render">#</a> Line.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Line.js#L85)

Draws the lines.


This is a static method of [<code>Line</code>](#Line), and is chainable with other methods of this Class.


<a name="Line.curve" href="#Line.curve">#</a> Line.**curve**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Line.js#L190)

If *value* is specified, sets the area curve to the specified string and returns the current class instance. If *value* is not specified, returns the current area curve.


This is a static method of [<code>Line</code>](#Line), and is chainable with other methods of this Class.


<a name="Line.defined" href="#Line.defined">#</a> Line.**defined**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Line.js#L200)

If *value* is specified, sets the defined accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current defined accessor.


This is a static method of [<code>Line</code>](#Line), and is chainable with other methods of this Class.

---

<a name="Path"></a>
#### **Path** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Path.js#L6)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Path](#Path) ⇐ [<code>Shape</code>](#Shape)
    * [new Path()](#new_Path_new)
    * [.render([*callback*])](#Path.render) ↩︎
    * [.d([*value*])](#Path.d) ↩︎


<a name="new_Path_new" href="#new_Path_new">#</a> new **Path**()

Creates SVG Paths based on an array of data.





<a name="Path.render" href="#Path.render">#</a> Path.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Path.js#L49)

Draws the paths.


This is a static method of [<code>Path</code>](#Path), and is chainable with other methods of this Class.


<a name="Path.d" href="#Path.d">#</a> Path.**d**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Path.js#L87)

If *value* is specified, sets the "d" attribute accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Path</code>](#Path), and is chainable with other methods of this Class.


```js
function(d) {
  return d.path;
}
```

---

<a name="Rect"></a>
#### **Rect** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Rect.js#L4)


This is a global class, and extends all of the methods and functionality of [<code>Shape</code>](#Shape).


* [Rect](#Rect) ⇐ [<code>Shape</code>](#Shape)
    * [new Rect()](#new_Rect_new)
    * [.render([*callback*])](#Rect.render) ↩︎
    * [.height([*value*])](#Rect.height) ↩︎
    * [.width([*value*])](#Rect.width) ↩︎


<a name="new_Rect_new" href="#new_Rect_new">#</a> new **Rect**()

Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.





<a name="Rect.render" href="#Rect.render">#</a> Rect.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Rect.js#L31)

Draws the rectangles.


This is a static method of [<code>Rect</code>](#Rect), and is chainable with other methods of this Class.


<a name="Rect.height" href="#Rect.height">#</a> Rect.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Rect.js#L96)

If *value* is specified, sets the height accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Rect</code>](#Rect), and is chainable with other methods of this Class.


```js
function(d) {
  return d.height;
}
```


<a name="Rect.width" href="#Rect.width">#</a> Rect.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Rect.js#L110)

If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Rect</code>](#Rect), and is chainable with other methods of this Class.


```js
function(d) {
  return d.width;
}
```

---

<a name="Shape"></a>
#### **Shape** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L16)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Shape](#Shape) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Shape()](#new_Shape_new)
    * [.render([*callback*])](#Shape.render) ↩︎
    * [.active([*value*])](#Shape.active) ↩︎
    * [.activeOpacity(*value*)](#Shape.activeOpacity) ↩︎
    * [.activeStyle(*value*)](#Shape.activeStyle) ↩︎
    * [.ariaLabel(*value*)](#Shape.ariaLabel) ↩︎
    * [.backgroundImage([*value*])](#Shape.backgroundImage) ↩︎
    * [.data([*data*])](#Shape.data) ↩︎
    * [.discrete(*value*)](#Shape.discrete) ↩︎
    * [.duration([*ms*])](#Shape.duration) ↩︎
    * [.fill([*value*])](#Shape.fill) ↩︎
    * [.fillOpacity([*value*])](#Shape.fillOpacity) ↩︎
    * [.hover([*value*])](#Shape.hover) ↩︎
    * [.hoverStyle(*value*)](#Shape.hoverStyle) ↩︎
    * [.hoverOpacity([*value*])](#Shape.hoverOpacity) ↩︎
    * [.hitArea([*bounds*])](#Shape.hitArea) ↩︎
    * [.id([*value*])](#Shape.id) ↩︎
    * [.label([*value*])](#Shape.label) ↩︎
    * [.labelBounds([*bounds*])](#Shape.labelBounds) ↩︎
    * [.labelConfig([*value*])](#Shape.labelConfig) ↩︎
    * [.opacity([*value*])](#Shape.opacity) ↩︎
    * [.pointerEvents([*value*])](#Shape.pointerEvents) ↩︎
    * [.role(*value*)](#Shape.role) ↩︎
    * [.rotate([*value*])](#Shape.rotate) ↩︎
    * [.rx([*value*])](#Shape.rx) ↩︎
    * [.ry([*value*])](#Shape.ry) ↩︎
    * [.scale([*value*])](#Shape.scale) ↩︎
    * [.select([*selector*])](#Shape.select) ↩︎
    * [.shapeRendering([*value*])](#Shape.shapeRendering) ↩︎
    * [.sort([*value*])](#Shape.sort) ↩︎
    * [.stroke([*value*])](#Shape.stroke) ↩︎
    * [.strokeDasharray([*value*])](#Shape.strokeDasharray) ↩︎
    * [.strokeLinecap([*value*])](#Shape.strokeLinecap) ↩︎
    * [.strokeOpacity([*value*])](#Shape.strokeOpacity) ↩︎
    * [.strokeWidth([*value*])](#Shape.strokeWidth) ↩︎
    * [.textAnchor([*value*])](#Shape.textAnchor) ↩︎
    * [.texture([*value*])](#Shape.texture) ↩︎
    * [.textureDefault([*value*])](#Shape.textureDefault) ↩︎
    * [.vectorEffect([*value*])](#Shape.vectorEffect) ↩︎
    * [.verticalAlign([*value*])](#Shape.verticalAlign) ↩︎
    * [.x([*value*])](#Shape.x) ↩︎
    * [.y([*value*])](#Shape.y) ↩︎


<a name="new_Shape_new" href="#new_Shape_new">#</a> new **Shape**()

An abstracted class for generating shapes.





<a name="Shape.render" href="#Shape.render">#</a> Shape.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L536)

Renders the current Shape to the page. If a *callback* is specified, it will be called once the shapes are done drawing.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.active" href="#Shape.active">#</a> Shape.**active**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L700)

If *value* is specified, sets the highlight accessor to the specified function and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.activeOpacity" href="#Shape.activeOpacity">#</a> Shape.**activeOpacity**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L719)

When shapes are active, this is the opacity of any shape that is not active.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.activeStyle" href="#Shape.activeStyle">#</a> Shape.**activeStyle**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L729)

The style to apply to active shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.ariaLabel" href="#Shape.ariaLabel">#</a> Shape.**ariaLabel**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L739)

If *value* is specified, sets the aria-label attribute to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.backgroundImage" href="#Shape.backgroundImage">#</a> Shape.**backgroundImage**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L751)

If *value* is specified, sets the background-image accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.data" href="#Shape.data">#</a> Shape.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L763)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape will be drawn for each object in the array.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.discrete" href="#Shape.discrete">#</a> Shape.**discrete**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L775)

Determines if either the X or Y position is discrete along a Line, which helps in determining the nearest data point on a line for a hit area event.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.duration" href="#Shape.duration">#</a> Shape.**duration**([*ms*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L785)

If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.fill" href="#Shape.fill">#</a> Shape.**fill**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L797)

If *value* is specified, sets the fill accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.fillOpacity" href="#Shape.fillOpacity">#</a> Shape.**fillOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L809)

Defines the "fill-opacity" attribute for the shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.hover" href="#Shape.hover">#</a> Shape.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L821)

If *value* is specified, sets the highlight accessor to the specified function and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.hoverStyle" href="#Shape.hoverStyle">#</a> Shape.**hoverStyle**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L840)

The style to apply to hovered shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.hoverOpacity" href="#Shape.hoverOpacity">#</a> Shape.**hoverOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L850)

If *value* is specified, sets the hover opacity to the specified function and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.hitArea" href="#Shape.hitArea">#</a> Shape.**hitArea**([*bounds*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L869)

If *bounds* is specified, sets the mouse hit area to the specified function and returns the current class instance. If *bounds* is not specified, returns the current mouse hit area accessor.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


```js
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
```


<a name="Shape.id" href="#Shape.id">#</a> Shape.**id**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L879)

If *value* is specified, sets the id accessor to the specified function and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.label" href="#Shape.label">#</a> Shape.**label**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L889)

If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.labelBounds" href="#Shape.labelBounds">#</a> Shape.**labelBounds**([*bounds*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L908)

If *bounds* is specified, sets the label bounds to the specified function and returns the current class instance. If *bounds* is not specified, returns the current inner bounds accessor.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


```js
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
```


<a name="Shape.labelConfig" href="#Shape.labelConfig">#</a> Shape.**labelConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L918)

A pass-through to the config method of the TextBox class used to create a shape's labels.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.opacity" href="#Shape.opacity">#</a> Shape.**opacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L928)

If *value* is specified, sets the opacity accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.pointerEvents" href="#Shape.pointerEvents">#</a> Shape.**pointerEvents**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L938)

If *value* is specified, sets the pointerEvents accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.role" href="#Shape.role">#</a> Shape.**role**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L948)

If *value* is specified, sets the role attribute to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.rotate" href="#Shape.rotate">#</a> Shape.**rotate**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L960)

If *value* is specified, sets the rotate accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.rx" href="#Shape.rx">#</a> Shape.**rx**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L970)

Defines the "rx" attribute for the shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.ry" href="#Shape.ry">#</a> Shape.**ry**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L980)

Defines the "rx" attribute for the shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.scale" href="#Shape.scale">#</a> Shape.**scale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L990)

If *value* is specified, sets the scale accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.select" href="#Shape.select">#</a> Shape.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1000)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.shapeRendering" href="#Shape.shapeRendering">#</a> Shape.**shapeRendering**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1014)

If *value* is specified, sets the shape-rendering accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


```js
function(d) {
  return d.x;
}
```


<a name="Shape.sort" href="#Shape.sort">#</a> Shape.**sort**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1024)

If *value* is specified, sets the sort comparator to the specified function and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.stroke" href="#Shape.stroke">#</a> Shape.**stroke**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1034)

If *value* is specified, sets the stroke accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.strokeDasharray" href="#Shape.strokeDasharray">#</a> Shape.**strokeDasharray**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1044)

Defines the "stroke-dasharray" attribute for the shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.strokeLinecap" href="#Shape.strokeLinecap">#</a> Shape.**strokeLinecap**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1054)

Defines the "stroke-linecap" attribute for the shapes. Accepted values are `"butt"`, `"round"`, and `"square"`.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.strokeOpacity" href="#Shape.strokeOpacity">#</a> Shape.**strokeOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1064)

Defines the "stroke-opacity" attribute for the shapes.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.strokeWidth" href="#Shape.strokeWidth">#</a> Shape.**strokeWidth**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1074)

If *value* is specified, sets the stroke-width accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.textAnchor" href="#Shape.textAnchor">#</a> Shape.**textAnchor**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1084)

If *value* is specified, sets the text-anchor accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.texture" href="#Shape.texture">#</a> Shape.**texture**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1094)

Defines the texture used inside of each shape. This uses the [textures.js](https://riccardoscalco.it/textures/) package, and expects either a simple string (`"lines"` or `"circles"`) or a more complex Object containing the various properties of the texture (ie. `{texture: "lines", orientation: "3/8", stroke: "darkorange"}`). If multiple textures are necessary, provide an accsesor Function that returns the correct String/Object for each given data point and index.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.textureDefault" href="#Shape.textureDefault">#</a> Shape.**textureDefault**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1104)

A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.vectorEffect" href="#Shape.vectorEffect">#</a> Shape.**vectorEffect**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1114)

If *value* is specified, sets the vector-effect accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.verticalAlign" href="#Shape.verticalAlign">#</a> Shape.**verticalAlign**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1124)

If *value* is specified, sets the vertical alignment accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


<a name="Shape.x" href="#Shape.x">#</a> Shape.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1138)

If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


```js
function(d) {
  return d.x;
}
```


<a name="Shape.y" href="#Shape.y">#</a> Shape.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Shape.js#L1152)

If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance.


This is a static method of [<code>Shape</code>](#Shape), and is chainable with other methods of this Class.


```js
function(d) {
  return d.y;
}
```

---

<a name="Whisker"></a>
#### **Whisker** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L13)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [Whisker](#Whisker) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new Whisker()](#new_Whisker_new)
    * [.render([*callback*])](#Whisker.render) ↩︎
    * [.active([*value*])](#Whisker.active) ↩︎
    * [.data([*data*])](#Whisker.data) ↩︎
    * [.endpoint(_)](#Whisker.endpoint) ↩︎
    * [.endpointConfig([*value*])](#Whisker.endpointConfig) ↩︎
    * [.hover([*value*])](#Whisker.hover) ↩︎
    * [.length([*value*])](#Whisker.length) ↩︎
    * [.lineConfig([*value*])](#Whisker.lineConfig) ↩︎
    * [.orient([*value*])](#Whisker.orient) ↩︎
    * [.select([*selector*])](#Whisker.select) ↩︎
    * [.x([*value*])](#Whisker.x) ↩︎
    * [.y([*value*])](#Whisker.y) ↩︎


<a name="new_Whisker_new" href="#new_Whisker_new">#</a> new **Whisker**()

Creates SVG whisker based on an array of data.





<a name="Whisker.render" href="#Whisker.render">#</a> Whisker.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L49)

Draws the whisker.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.active" href="#Whisker.active">#</a> Whisker.**active**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L137)

Sets the highlight accessor to the Shape class's active function.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.data" href="#Whisker.data">#</a> Whisker.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L148)

If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.endpoint" href="#Whisker.endpoint">#</a> Whisker.**endpoint**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L158)

If *value* is specified, sets the endpoint accessor to the specified function or string and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.endpointConfig" href="#Whisker.endpointConfig">#</a> Whisker.**endpointConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L168)

If *value* is specified, sets the config method for each endpoint and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.hover" href="#Whisker.hover">#</a> Whisker.**hover**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L178)

Sets the highlight accessor to the Shape class's hover function.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.length" href="#Whisker.length">#</a> Whisker.**length**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L189)

If *value* is specified, sets the length accessor for whisker and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.lineConfig" href="#Whisker.lineConfig">#</a> Whisker.**lineConfig**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L199)

If *value* is specified, sets the config method for line shape and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.orient" href="#Whisker.orient">#</a> Whisker.**orient**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L209)

If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.select" href="#Whisker.select">#</a> Whisker.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L219)

If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


<a name="Whisker.x" href="#Whisker.x">#</a> Whisker.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L233)

If *value* is specified, sets the x axis to the specified function or number and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


```js
function(d) {
  return d.x;
}
```


<a name="Whisker.y" href="#Whisker.y">#</a> Whisker.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/shape/Whisker.js#L247)

If *value* is specified, sets the y axis to the specified function or number and returns the current class instance.


This is a static method of [<code>Whisker</code>](#Whisker), and is chainable with other methods of this Class.


```js
function(d) {
  return d.y;
}
```

---

<a name="TextBox"></a>
#### **TextBox** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L22)


This is a global class, and extends all of the methods and functionality of [<code>BaseClass</code>](#BaseClass).


* [TextBox](#TextBox) ⇐ [<code>BaseClass</code>](#BaseClass)
    * [new TextBox()](#new_TextBox_new)
    * [.render([*callback*])](#TextBox.render)
    * [.ariaHidden(*value*)](#TextBox.ariaHidden) ↩︎
    * [.data([*data*])](#TextBox.data) ↩︎
    * [.delay([*value*])](#TextBox.delay) ↩︎
    * [.duration([*value*])](#TextBox.duration) ↩︎
    * [.ellipsis([*value*])](#TextBox.ellipsis) ↩︎
    * [.fontColor([*value*])](#TextBox.fontColor) ↩︎
    * [.fontFamily([*value*])](#TextBox.fontFamily) ↩︎
    * [.fontMax([*value*])](#TextBox.fontMax) ↩︎
    * [.fontMin([*value*])](#TextBox.fontMin) ↩︎
    * [.fontOpacity([*value*])](#TextBox.fontOpacity) ↩︎
    * [.fontResize([*value*])](#TextBox.fontResize) ↩︎
    * [.fontSize([*value*])](#TextBox.fontSize) ↩︎
    * [.fontStroke([*value*])](#TextBox.fontStroke) ↩︎
    * [.fontStrokeWidth([*value*])](#TextBox.fontStrokeWidth) ↩︎
    * [.fontWeight([*value*])](#TextBox.fontWeight) ↩︎
    * [.height([*value*])](#TextBox.height) ↩︎
    * [.html([*value* &#x3D; {
                i: &#x27;font-style: italic;&#x27;,
                em: &#x27;font-style: italic;&#x27;,
                b: &#x27;font-weight: bold;&#x27;,
                strong: &#x27;font-weight: bold;&#x27;
            }])](#TextBox.html) ↩︎
    * [.id([*value*])](#TextBox.id) ↩︎
    * [.lineHeight([*value*])](#TextBox.lineHeight) ↩︎
    * [.maxLines([*value*])](#TextBox.maxLines) ↩︎
    * [.overflow([*value*])](#TextBox.overflow) ↩︎
    * [.padding([*value*])](#TextBox.padding) ↩︎
    * [.pointerEvents([*value*])](#TextBox.pointerEvents) ↩︎
    * [.rotate([*value*])](#TextBox.rotate) ↩︎
    * [.rotateAnchor(_)](#TextBox.rotateAnchor) ↩︎
    * [.select([*selector*])](#TextBox.select) ↩︎
    * [.split([*value*])](#TextBox.split) ↩︎
    * [.text([*value*])](#TextBox.text) ↩︎
    * [.textAnchor([*value*])](#TextBox.textAnchor) ↩︎
    * [.verticalAlign([*value*])](#TextBox.verticalAlign) ↩︎
    * [.width([*value*])](#TextBox.width) ↩︎
    * [.x([*value*])](#TextBox.x) ↩︎
    * [.y([*value*])](#TextBox.y) ↩︎


<a name="new_TextBox_new" href="#new_TextBox_new">#</a> new **TextBox**()

Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.





<a name="TextBox.render" href="#TextBox.render">#</a> TextBox.**render**([*callback*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L77)

Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.


This is a static method of [<code>TextBox</code>](#TextBox).


<a name="TextBox.ariaHidden" href="#TextBox.ariaHidden">#</a> TextBox.**ariaHidden**(*value*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L398)

If *value* is specified, sets the aria-hidden attribute to the specified function or string and returns the current class instance.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.data" href="#TextBox.data">#</a> TextBox.**data**([*data*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L410)

Sets the data array to the specified array. A text box will be drawn for each object in the array.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.delay" href="#TextBox.delay">#</a> TextBox.**delay**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L420)

Sets the animation delay to the specified number in milliseconds.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.duration" href="#TextBox.duration">#</a> TextBox.**duration**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L430)

Sets the animation duration to the specified number in milliseconds.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.ellipsis" href="#TextBox.ellipsis">#</a> TextBox.**ellipsis**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L444)

Sets the function that handles what to do when a line is truncated. It should return the new value for the line, and is passed 2 arguments: the String of text for the line in question, and the number of the line. By default, an ellipsis is added to the end of any line except if it is the first word that cannot fit (in that case, an empty string is returned).


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(text, line) {
  return line ? text.replace(/\.|,$/g, "") + "..." : "";
}
```


<a name="TextBox.fontColor" href="#TextBox.fontColor">#</a> TextBox.**fontColor**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L454)

Sets the font color to the specified accessor function or static string, which is inferred from the [DOM selection](#textBox.select) by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontFamily" href="#TextBox.fontFamily">#</a> TextBox.**fontFamily**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L464)

Defines the font-family to be used. The value passed can be either a *String* name of a font, a comma-separated list of font-family fallbacks, an *Array* of fallbacks, or a *Function* that returns either a *String* or an *Array*. If supplying multiple fallback fonts, the [fontExists](#fontExists) function will be used to determine the first available font on the client's machine.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontMax" href="#TextBox.fontMax">#</a> TextBox.**fontMax**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L474)

Sets the maximum font size to the specified accessor function or static number (which corresponds to pixel units), which is used when [dynamically resizing fonts](#textBox.fontResize).


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontMin" href="#TextBox.fontMin">#</a> TextBox.**fontMin**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L484)

Sets the minimum font size to the specified accessor function or static number (which corresponds to pixel units), which is used when [dynamically resizing fonts](#textBox.fontResize).


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontOpacity" href="#TextBox.fontOpacity">#</a> TextBox.**fontOpacity**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L494)

Sets the font opacity to the specified accessor function or static number between 0 and 1.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontResize" href="#TextBox.fontResize">#</a> TextBox.**fontResize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L504)

Toggles font resizing, which can either be defined as a static boolean for all data points, or an accessor function that returns a boolean. See [this example](http://d3plus.org/examples/d3plus-text/resizing-text/) for a side-by-side comparison.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontSize" href="#TextBox.fontSize">#</a> TextBox.**fontSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L514)

Sets the font size to the specified accessor function or static number (which corresponds to pixel units), which is inferred from the [DOM selection](#textBox.select) by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontStroke" href="#TextBox.fontStroke">#</a> TextBox.**fontStroke**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L524)

Sets the font stroke color for the rendered text.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontStrokeWidth" href="#TextBox.fontStrokeWidth">#</a> TextBox.**fontStrokeWidth**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L534)

Sets the font stroke width for the rendered text.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.fontWeight" href="#TextBox.fontWeight">#</a> TextBox.**fontWeight**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L544)

Sets the font weight to the specified accessor function or static number, which is inferred from the [DOM selection](#textBox.select) by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.height" href="#TextBox.height">#</a> TextBox.**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L558)

Sets the height for each box to the specified accessor function or static number.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d) {
  return d.height || 200;
}
```


<a name="TextBox.html" href="#TextBox.html">#</a> TextBox.**html**([*value* &#x3D; {
                i: &#x27;font-style: italic;&#x27;,
                em: &#x27;font-style: italic;&#x27;,
                b: &#x27;font-weight: bold;&#x27;,
                strong: &#x27;font-weight: bold;&#x27;
            }]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L573)

Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.id" href="#TextBox.id">#</a> TextBox.**id**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L588)

Defines the unique id for each box to the specified accessor function or static number.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d, i) {
  return d.id || i + "";
}
```


<a name="TextBox.lineHeight" href="#TextBox.lineHeight">#</a> TextBox.**lineHeight**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L598)

Sets the line height to the specified accessor function or static number, which is 1.2 times the [font size](#textBox.fontSize) by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.maxLines" href="#TextBox.maxLines">#</a> TextBox.**maxLines**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L608)

Restricts the maximum number of lines to wrap onto, which is null (unlimited) by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.overflow" href="#TextBox.overflow">#</a> TextBox.**overflow**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L618)

Sets the text overflow to the specified accessor function or static boolean.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.padding" href="#TextBox.padding">#</a> TextBox.**padding**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L628)

Sets the padding to the specified accessor function, CSS shorthand string, or static number, which is 0 by default.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.pointerEvents" href="#TextBox.pointerEvents">#</a> TextBox.**pointerEvents**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L638)

Sets the pointer-events to the specified accessor function or static string.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.rotate" href="#TextBox.rotate">#</a> TextBox.**rotate**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L648)

Sets the rotate percentage for each box to the specified accessor function or static string.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.rotateAnchor" href="#TextBox.rotateAnchor">#</a> TextBox.**rotateAnchor**(_) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L658)

Sets the anchor point around which to rotate the text box.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.select" href="#TextBox.select">#</a> TextBox.**select**([*selector*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L668)

Sets the SVG container element to the specified d3 selector or DOM element. If not explicitly specified, an SVG element will be added to the page for use.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.split" href="#TextBox.split">#</a> TextBox.**split**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L678)

Sets the word split behavior to the specified function, which when passed a string is expected to return that string split into an array of words.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.text" href="#TextBox.text">#</a> TextBox.**text**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L692)

Sets the text for each box to the specified accessor function or static string.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d) {
  return d.text;
}
```


<a name="TextBox.textAnchor" href="#TextBox.textAnchor">#</a> TextBox.**textAnchor**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L702)

Sets the horizontal text anchor to the specified accessor function or static string, whose values are analagous to the SVG [text-anchor](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor) property.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.verticalAlign" href="#TextBox.verticalAlign">#</a> TextBox.**verticalAlign**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L712)

Sets the vertical alignment to the specified accessor function or static string. Accepts `"top"`, `"middle"`, and `"bottom"`.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.


<a name="TextBox.width" href="#TextBox.width">#</a> TextBox.**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L726)

Sets the width for each box to the specified accessor function or static number.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d) {
  return d.width || 200;
}
```


<a name="TextBox.x" href="#TextBox.x">#</a> TextBox.**x**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L740)

Sets the x position for each box to the specified accessor function or static number. The number given should correspond to the left side of the textBox.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d) {
  return d.x || 0;
}
```


<a name="TextBox.y" href="#TextBox.y">#</a> TextBox.**y**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/TextBox.js#L754)

Sets the y position for each box to the specified accessor function or static number. The number given should correspond to the top side of the textBox.


This is a static method of [<code>TextBox</code>](#TextBox), and is chainable with other methods of this Class.
default accessor

```js
function(d) {
  return d.y || 0;
}
```

---

<a name="BaseClass"></a>
#### **BaseClass** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L44)


This is a global class.


* [BaseClass](#BaseClass)
    * [.config([*value*])](#BaseClass.config) ↩︎
    * [.locale([*value*])](#BaseClass.locale) ↩︎
    * [.on([*typenames*], [*listener*])](#BaseClass.on) ↩︎
    * [.translate([*value*])](#BaseClass.translate) ↩︎


<a name="BaseClass.config" href="#BaseClass.config">#</a> BaseClass.**config**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L72)

If *value* is specified, sets the methods that correspond to the key/value pairs and returns this class. If *value* is not specified, returns the current configuration.


This is a static method of [<code>BaseClass</code>](#BaseClass), and is chainable with other methods of this Class.


<a name="BaseClass.locale" href="#BaseClass.locale">#</a> BaseClass.**locale**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L127)

Sets the locale used for all text and number formatting. This method supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be defined as a complex Object (like in d3plus-format), a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale from d3plus-format.


This is a static method of [<code>BaseClass</code>](#BaseClass), and is chainable with other methods of this Class.


```js
{
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
```


<a name="BaseClass.on" href="#BaseClass.on">#</a> BaseClass.**on**([*typenames*], [*listener*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L146)

Adds or removes a *listener* to each object for the specified event *typenames*. If a *listener* is not specified, returns the currently assigned listener for the specified event *typename*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.


This is a static method of [<code>BaseClass</code>](#BaseClass), and is chainable with other methods of this Class.

| Param | Type |
| --- | --- |
| [*typenames*] | <code>String</code> | 
| [*listener*] | <code>function</code> | 

By default, listeners apply globally to all objects, however, passing a namespace with the class name gives control over specific elements:

```js
new Plot
  .on("click.Shape", function(d) {
    console.log("data for shape clicked:", d);
  })
  .on("click.Legend", function(d) {
    console.log("data for legend clicked:", d);
  })
```


<a name="BaseClass.translate" href="#BaseClass.translate">#</a> BaseClass.**translate**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/BaseClass.js#L170)

Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.


This is a static method of [<code>BaseClass</code>](#BaseClass), and is chainable with other methods of this Class.
For example, if we wanted to only change the string &quot;Back&quot; and allow all other string to return in English:

```js
.translate(function(d) {
  return d === "Back" ? "Get outta here" : d;
})
```

---

<a name="defaultPadding"></a>
#### d3plus.**defaultPadding**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L44)

Default padding logic that will return false if the screen is less than 600 pixels wide.


This is a global function.

---

<a name="listify"></a>
#### d3plus.**listify**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L51)

Turns an array of values into a list string.


This is a global function.

---

<a name="_thresholdFunction"></a>
#### d3plus.**_thresholdFunction**(data) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/charts/Viz.js#L542)

Applies the threshold algorithm according to the type of chart used.


This is a global function.

---

<a name="colorAdd"></a>
#### d3plus.**colorAdd**(c1, c2, [o1], [o2]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/add.js#L3)

Adds two colors together.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| c1 | <code>String</code> |  | The first color, a valid CSS color string. |
| c2 | <code>String</code> |  | The second color, also a valid CSS color string. |
| [o1] | <code>String</code> | <code>1</code> | Value from 0 to 1 of the first color's opacity. |
| [o2] | <code>String</code> | <code>1</code> | Value from 0 to 1 of the first color's opacity. |


---

<a name="colorAssign"></a>
#### d3plus.**colorAssign**(c, [u]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/assign.js#L4)

Assigns a color to a value using a predefined set of defaults.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| c | <code>String</code> |  | A valid CSS color string. |
| [u] | <code>Object</code> | <code>defaults</code> | An object containing overrides of the default colors. |


---

<a name="colorContrast"></a>
#### d3plus.**colorContrast**(c, [u]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/contrast.js#L4)

A set of default color values used when assigning colors based on data.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| c | <code>String</code> |  | A valid CSS color string. |
| [u] | <code>Object</code> | <code>defaults</code> | An object containing overrides of the default colors. |


---

<a name="colorLegible"></a>
#### d3plus.**colorLegible**(c) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/legible.js#L3)

Darkens a color so that it will appear legible on a white background.


This is a global function.

---

<a name="colorLighter"></a>
#### d3plus.**colorLighter**(c, [i]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/lighter.js#L3)

Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| c | <code>String</code> |  | A valid CSS color string. |
| [i] | <code>String</code> | <code>0.5</code> | A value from 0 to 1 dictating the strength of the function. |


---

<a name="colorSubtract"></a>
#### d3plus.**colorSubtract**(c1, c2, [o1], [o2]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/subtract.js#L3)

Subtracts one color from another.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| c1 | <code>String</code> |  | The base color, a valid CSS color string. |
| c2 | <code>String</code> |  | The color to remove from the base color, also a valid CSS color string. |
| [o1] | <code>String</code> | <code>1</code> | Value from 0 to 1 of the first color's opacity. |
| [o2] | <code>String</code> | <code>1</code> | Value from 0 to 1 of the first color's opacity. |


---

<a name="generateReference"></a>
#### d3plus.**generateReference**(position) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/components/Tooltip.js#L13)

Creates a reference element for popper.


This is a global function.
**Prrivate**:   

---

<a name="isData"></a>
#### d3plus.**isData**(data, [data], data) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/addToQueue.js#L4)

Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> \| <code>String</code> \| <code>Object</code> | The data to be loaded |
| [data] | <code>function</code> | An optional data formatter/callback |
| data | <code>String</code> | The internal Viz method to be modified |


---

<a name="dataConcat"></a>
#### d3plus.**dataConcat**(arrayOfArray, [data]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/concat.js#L1)

Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| arrayOfArray | <code>Array</code> |  | Array of elements |
| [data] | <code>String</code> | <code>&quot;data&quot;</code> | The key used for the flat data array if exists inside of the JSON object. |


---

<a name="dataFold"></a>
#### d3plus.**dataFold**(json, [data], [headers]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/fold.js#L1)

Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| json | <code>Object</code> |  | A JSON data Object with `data` and `headers` keys. |
| [data] | <code>String</code> | <code>&quot;data&quot;</code> | The key used for the flat data array inside of the JSON object. |
| [headers] | <code>String</code> | <code>&quot;headers&quot;</code> | The key used for the flat headers array inside of the JSON object. |


---

<a name="isData"></a>
#### d3plus.**isData**(dataItem) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/isData.js#L1)

Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.


This is a global function.

---

<a name="dataLoad"></a>
#### d3plus.**dataLoad**(path, [formatter], [key], [callback]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/load.js#L8)

Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array</code> \| <code>String</code> | The path to the file or url to be loaded. Also support array of paths strings. If an Array of objects is passed, the xhr request logic is skipped. |
| [formatter] | <code>function</code> | An optional formatter function that is run on the loaded data. |
| [key] | <code>String</code> | The key in the `this` context to save the resulting data to. |
| [callback] | <code>function</code> | A function that is called when the final data is loaded. It is passed 2 variables, any error present and the data loaded. |


---

<a name="merge"></a>
#### d3plus.**merge**(objects, aggs) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/data/merge.js#L4)

Combines an Array of Objects together and returns a new Object.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| objects | <code>Array</code> | The Array of objects to be merged together. |
| aggs | <code>Object</code> | An object containing specific aggregation methods (functions) for each key type. By default, numbers are summed and strings are returned as an array of unique values. |

this

```js
merge([
  {id: "foo", group: "A", value: 10, links: [1, 2]},
  {id: "bar", group: "A", value: 20, links: [1, 3]}
]);
    
```
returns this

```js
{id: ["bar", "foo"], group: "A", value: 30, links: [1, 2, 3]}
```

---

<a name="assign"></a>
#### d3plus.**assign**(...objects) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/assign.js#L14)

A deeply recursive version of `Object.assign`.


This is a global function.
this

```js
assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}));
    
```
returns this

```js
{id: "bar", deep: {group: "A", value: 20}}
```

---

<a name="attrize"></a>
#### d3plus.**attrize**(elem, attrs) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/attrize.js#L1)

Applies each key/value in an object as an attr.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>D3selection</code> | The D3 element to apply the styles to. |
| attrs | <code>Object</code> | An object of key/value attr pairs. |


---

<a name="date"></a>
#### d3plus.**date**(*date*) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/date.js#L1)

Returns a javascript Date object for a given a Number (representing either a 4-digit year or milliseconds since epoch), a String representing a Quarter (ie. "Q2 1987", mapping to the last day in that quarter), or a String that is in [valid dateString format](http://dygraphs.com/date-formats.html). Besides the 4-digit year parsing, this function is useful when needing to parse negative (BC) years, which the vanilla Date object cannot parse.


This is a global function.

---

<a name="elem"></a>
#### d3plus.**elem**(selector, params) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/elem.js#L6)

Manages the enter/update/exit pattern for a single DOM element.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| selector | <code>String</code> |  | A D3 selector, which must include the tagname and a class and/or ID. |
| params | <code>Object</code> |  | Additional parameters. |
| [params.condition] | <code>Boolean</code> | <code>true</code> | Whether or not the element should be rendered (or removed). |
| [params.enter] | <code>Object</code> | <code>{}</code> | A collection of key/value pairs that map to attributes to be given on enter. |
| [params.exit] | <code>Object</code> | <code>{}</code> | A collection of key/value pairs that map to attributes to be given on exit. |
| [params.parent] | <code>D3Selection</code> | <code>d3.select(&quot;body&quot;)</code> | The parent element for this new element to be appended to. |
| [params.duration] | <code>Number</code> | <code>0</code> | The duration for the d3 transition. |
| [params.update] | <code>Object</code> | <code>{}</code> | A collection of key/value pairs that map to attributes to be given on update. |


---

<a name="fontExists"></a>
#### d3plus.**fontExists**(font) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/fontExists.js#L10)

Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.


This is a global function.

---

<a name="isObject"></a>
#### d3plus.**isObject**(item) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/isObject.js#L1)

Detects if a variable is a javascript Object.


This is a global function.

---

<a name="parseSides"></a>
#### d3plus.**parseSides**(sides) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/parseSides.js#L1)

Converts a string of directional CSS shorthand values into an object with the values expanded.


This is a global function.

---

<a name="prefix"></a>
#### d3plus.**prefix**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/prefix.js#L1)

Returns the appropriate CSS vendor prefix, given the current browser.


This is a global function.

---

<a name="rtl"></a>
#### d3plus.**rtl**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/rtl.js#L3)

Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".


This is a global function.

---

<a name="stylize"></a>
#### d3plus.**stylize**(elem, styles) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/stylize.js#L1)

Applies each key/value in an object as a style.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>D3selection</code> | The D3 element to apply the styles to. |
| styles | <code>Object</code> | An object of key/value style pairs. |


---

<a name="htmlDecode"></a>
#### d3plus.**htmlDecode**(input) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/textWidth.js#L5)

Strips HTML and "un-escapes" escape characters.


This is a global function.

---

<a name="textWidth"></a>
#### d3plus.**textWidth**(text, [style]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/dom/textWidth.js#L12)

Given a text string, returns the predicted pixel width of the string when placed into DOM.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| text | <code>String</code> \| <code>Array</code> | Can be either a single string or an array of strings to analyze. |
| [style] | <code>Object</code> | An object of CSS font styles to apply. Accepts any of the valid [CSS font property](http://www.w3schools.com/cssref/pr_font_font.asp) values. |


---

<a name="format"></a>
#### d3plus.**format**(specifier) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/format/format.js#L4)

An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.

The new specifier strings added by d3plus-format are:
 - `.3~a` - abbreviated decimal notation with a numeric suffix (ie. "k", "M", "B", etc). This is an alias of the `formatAbbreviate` function.


This is a global function.

---

<a name="formatAbbreviate"></a>
#### d3plus.**formatAbbreviate**(n, locale) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/format/formatAbbreviate.js#L38)

Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| n | <code>Number</code> \| <code>String</code> | The number to be formatted. |
| locale | <code>Object</code> \| <code>String</code> | The locale config to be used. If *value* is an object, the function will format the numbers according the object. The object must include `suffixes`, `delimiter` and `currency` properties. |


---

<a name="formatDate"></a>
#### d3plus.**formatDate**(d, dataArray, [formatter]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/format/formatDate.js#L4)

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| d | <code>Date</code> |  | The date string to be formatted. |
| dataArray | <code>Array</code> |  | The full array of ordered Date Objects. |
| [formatter] | <code>function</code> | <code>d3.timeFormat</code> | An optional instance of d3.timeFormat to be used for localization. |


---

<a name="formatDefaultLocale"></a>
#### d3plus.**formatDefaultLocale**(definition) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/format/formatDefaultLocale.js#L4)

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.


This is a global function.

---

<a name="closest"></a>
#### d3plus.**closest**(n, arr) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/closest.js#L1)

Finds the closest numeric value in an array.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| n | <code>Number</code> | The number value to use when searching the array. |
| arr | <code>Array</code> | The array of values to test against. |


---

<a name="largestRect"></a>
#### d3plus.**largestRect**(poly, [options]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/largestRect.js#L28)

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.


This is a global function.
**Author**: Daniel Smilkov [dsmilkov@gmail.com]  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poly | <code>Array</code> |  | An Array of points that represent a polygon. |
| [options] | <code>Object</code> |  | An Object that allows for overriding various parameters of the algorithm. |
| [options.angle] | <code>Number</code> \| <code>String</code> \| <code>Array</code> | <code>d3.range(-90, 95, 5)</code> | The allowed rotations of the final rectangle. |
| [options.aspectRatio] | <code>Number</code> \| <code>String</code> \| <code>Array</code> |  | The ratio between the width and height of the rectangle. The value can be a number, a string which is parsed to a number, or an array of numbers specifying the possible aspect ratios of the final rectangle. |
| [options.maxAspectRatio] | <code>Number</code> | <code>15</code> | The maximum aspect ratio (width/height) allowed for the rectangle. This property should only be used if the aspectRatio is not provided. |
| [options.minAspectRatio] | <code>Number</code> | <code>1</code> | The minimum aspect ratio (width/height) allowed for the rectangle. This property should only be used if the aspectRatio is not provided. |
| [options.nTries] | <code>Number</code> | <code>20</code> | The number of randomly drawn points inside the polygon which the algorithm explores as possible center points of the maximal rectangle. |
| [options.minHeight] | <code>Number</code> | <code>0</code> | The minimum height of the rectangle. |
| [options.minWidth] | <code>Number</code> | <code>0</code> | The minimum width of the rectangle. |
| [options.tolerance] | <code>Number</code> | <code>0.02</code> | The simplification tolerance factor, between 0 and 1. A larger tolerance corresponds to more extensive simplification. |
| [options.origin] | <code>Array</code> |  | The center point of the rectangle. If specified, the rectangle will be fixed at that point, otherwise the algorithm optimizes across all possible points. The given value can be either a two dimensional array specifying the x and y coordinate of the origin or an array of two dimensional points specifying multiple possible center points of the rectangle. |
| [options.cache] | <code>Boolean</code> |  | Whether or not to cache the result, which would be used in subsequent calculations to preserve consistency and speed up calculation time. |


---

<a name="lineIntersection"></a>
#### d3plus.**lineIntersection**(p1, q1, p2, q2) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/lineIntersection.js#L1)

Finds the intersection point (if there is one) of the lines p1q1 and p2q2.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>Array</code> | The first point of the first line segment, which should always be an `[x, y]` formatted Array. |
| q1 | <code>Array</code> | The second point of the first line segment, which should always be an `[x, y]` formatted Array. |
| p2 | <code>Array</code> | The first point of the second line segment, which should always be an `[x, y]` formatted Array. |
| q2 | <code>Array</code> | The second point of the second line segment, which should always be an `[x, y]` formatted Array. |


---

<a name="path2polygon"></a>
#### d3plus.**path2polygon**(path, [segmentLength]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/path2polygon.js#L1)

Transforms a path string into an Array of points.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>String</code> |  | An SVG string path, commonly the "d" property of a <path> element. |
| [segmentLength] | <code>Number</code> | <code>50</code> | The length of line segments when converting curves line segments. Higher values lower computation time, but will result in curves that are more rigid. |


---

<a name="pointDistance"></a>
#### d3plus.**pointDistance**(p1, p2) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/pointDistance.js#L3)

Calculates the pixel distance between two points.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>Array</code> | The first point, which should always be an `[x, y]` formatted Array. |
| p2 | <code>Array</code> | The second point, which should always be an `[x, y]` formatted Array. |


---

<a name="pointDistanceSquared"></a>
#### d3plus.**pointDistanceSquared**(p1, p2) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/pointDistanceSquared.js#L1)

Returns the squared euclidean distance between two points.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>Array</code> | The first point, which should always be an `[x, y]` formatted Array. |
| p2 | <code>Array</code> | The second point, which should always be an `[x, y]` formatted Array. |


---

<a name="pointRotate"></a>
#### d3plus.**pointRotate**(p, alpha, [origin]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/pointRotate.js#L1)

Rotates a point around a given origin.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| p | <code>Array</code> |  | The point to be rotated, which should always be an `[x, y]` formatted Array. |
| alpha | <code>Number</code> |  | The angle in radians to rotate. |
| [origin] | <code>Array</code> | <code>[0, 0]</code> | The origin point of the rotation, which should always be an `[x, y]` formatted Array. |


---

<a name="polygonInside"></a>
#### d3plus.**polygonInside**(polyA, polyB) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/polygonInside.js#L5)

Checks if one polygon is inside another polygon.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| polyA | <code>Array</code> | An Array of `[x, y]` points to be used as the inner polygon, checking if it is inside polyA. |
| polyB | <code>Array</code> | An Array of `[x, y]` points to be used as the containing polygon. |


---

<a name="polygonRayCast"></a>
#### d3plus.**polygonRayCast**(poly, origin, [alpha]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/polygonRayCast.js#L5)

Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.


This is a global function.
**Returns**: <code>Array</code> - An array containing two values, the closest point on the left and the closest point on the right. If either point cannot be found, that value will be `null`.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poly | <code>Array</code> |  | The polygon to test against, which should be an `[x, y]` formatted Array. |
| origin | <code>Array</code> |  | The origin point of the ray to be cast, which should be an `[x, y]` formatted Array. |
| [alpha] | <code>Number</code> | <code>0</code> | The angle in radians of the ray. |


---

<a name="polygonRotate"></a>
#### d3plus.**polygonRotate**(poly, alpha, [origin]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/polygonRotate.js#L3)

Rotates a point around a given origin.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poly | <code>Array</code> |  | The polygon to be rotated, which should be an Array of `[x, y]` values. |
| alpha | <code>Number</code> |  | The angle in radians to rotate. |
| [origin] | <code>Array</code> | <code>[0, 0]</code> | The origin point of the rotation, which should be an `[x, y]` formatted Array. |


---

<a name="segmentBoxContains"></a>
#### d3plus.**segmentBoxContains**(s1, s2, p) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/segmentBoxContains.js#L1)

Checks whether a point is inside the bounding box of a line segment.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| s1 | <code>Array</code> | The first point of the line segment to be used for the bounding box, which should always be an `[x, y]` formatted Array. |
| s2 | <code>Array</code> | The second point of the line segment to be used for the bounding box, which should always be an `[x, y]` formatted Array. |
| p | <code>Array</code> | The point to be checked, which should always be an `[x, y]` formatted Array. |


---

<a name="segmentsIntersect"></a>
#### d3plus.**segmentsIntersect**(p1, q1, p2, q2) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/segmentsIntersect.js#L4)

Checks whether the line segments p1q1 && p2q2 intersect.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>Array</code> | The first point of the first line segment, which should always be an `[x, y]` formatted Array. |
| q1 | <code>Array</code> | The second point of the first line segment, which should always be an `[x, y]` formatted Array. |
| p2 | <code>Array</code> | The first point of the second line segment, which should always be an `[x, y]` formatted Array. |
| q2 | <code>Array</code> | The second point of the second line segment, which should always be an `[x, y]` formatted Array. |


---

<a name="shapeEdgePoint"></a>
#### d3plus.**shapeEdgePoint**(angle, distance) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/shapeEdgePoint.js#L3)

Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.


This is a global function.
**Returns**: <code>String</code> - [shape = "circle"] The type of shape, which can be either "circle" or "square".  

| Param | Type | Description |
| --- | --- | --- |
| angle | <code>Number</code> | The angle, in radians, of the offset point. |
| distance | <code>Number</code> | The pixel distance away from the origin. |


---

<a name="largestRect"></a>
#### d3plus.**largestRect**(poly, [tolerance], [highestQuality]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/simplify.js#L112)

Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).


This is a global function.
**Author**: Vladimir Agafonkin  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poly | <code>Array</code> |  | An Array of points that represent a polygon. |
| [tolerance] | <code>Number</code> | <code>1</code> | Affects the amount of simplification (in the same metric as the point coordinates). |
| [highestQuality] | <code>Boolean</code> | <code>false</code> | Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower. |


---

<a name="stringify"></a>
#### d3plus.**stringify**(value) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/stringify.js#L1)

Coerces value into a String.


This is a global function.

---

<a name="strip"></a>
#### d3plus.**strip**(value, [spacer]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/strip.js#L18)

Removes all non ASCII characters from a string.


This is a global function.

| Param | Type | Default |
| --- | --- | --- |
| value | <code>String</code> |  | 
| [spacer] | <code>String</code> | <code>&quot;-&quot;</code> | 


---

<a name="textSplit"></a>
#### d3plus.**textSplit**(sentence) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textSplit.js#L51)

Splits a given sentence into an array of words.


This is a global function.

---

<a name="textWrap"></a>
#### d3plus.**textWrap**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L7)

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.


This is a global function.


* [textWrap()](#textWrap)
    * [.fontFamily([*value*])](#textWrap.fontFamily)
    * [.fontSize([*value*])](#textWrap.fontSize)
    * [.fontWeight([*value*])](#textWrap.fontWeight)
    * [.height([*value*])](#textWrap.height)
    * [.lineHeight([*value*])](#textWrap.lineHeight)
    * [.maxLines([*value*])](#textWrap.maxLines)
    * [.overflow([*value*])](#textWrap.overflow)
    * [.split([*value*])](#textWrap.split)
    * [.width([*value*])](#textWrap.width)


<a name="textWrap.fontFamily" href="#textWrap.fontFamily">#</a> d3plus..**fontFamily**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L90)

If *value* is specified, sets the font family accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current font family.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.fontSize" href="#textWrap.fontSize">#</a> d3plus..**fontSize**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L99)

If *value* is specified, sets the font size accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font size.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.fontWeight" href="#textWrap.fontWeight">#</a> d3plus..**fontWeight**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L108)

If *value* is specified, sets the font weight accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font weight.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.height" href="#textWrap.height">#</a> d3plus..**height**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L117)

If *value* is specified, sets height limit to the specified value and returns this generator. If *value* is not specified, returns the current value.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.lineHeight" href="#textWrap.lineHeight">#</a> d3plus..**lineHeight**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L126)

If *value* is specified, sets the line height accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current line height accessor, which is 1.1 times the [font size](#textWrap.fontSize) by default.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.maxLines" href="#textWrap.maxLines">#</a> d3plus..**maxLines**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L135)

If *value* is specified, sets the maximum number of lines allowed when wrapping.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.overflow" href="#textWrap.overflow">#</a> d3plus..**overflow**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L144)

If *value* is specified, sets the overflow to the specified boolean and returns this generator. If *value* is not specified, returns the current overflow value.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.split" href="#textWrap.split">#</a> d3plus..**split**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L153)

If *value* is specified, sets the word split function to the specified function and returns this generator. If *value* is not specified, returns the current word split function.


This is a static method of [<code>textWrap</code>](#textWrap).


<a name="textWrap.width" href="#textWrap.width">#</a> d3plus..**width**([*value*]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/textWrap.js#L162)

If *value* is specified, sets width limit to the specified value and returns this generator. If *value* is not specified, returns the current value.


This is a static method of [<code>textWrap</code>](#textWrap).

---

<a name="titleCase"></a>
#### d3plus.**titleCase**(str) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/titleCase.js#L6)

Capitalizes the first letter of each word in a phrase/sentence.


This is a global function.

---

<a name="trim"></a>
#### d3plus.**trim**(str) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/trim.js#L1)

Cross-browser implementation of [trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim).


This is a global function.

---

<a name="trimLeft"></a>
#### d3plus.**trimLeft**(str) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/trim.js#L10)

Cross-browser implementation of [trimLeft](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft).


This is a global function.

---

<a name="trimRight"></a>
#### d3plus.**trimRight**(str) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/text/trim.js#L19)

Cross-browser implementation of [trimRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimRight).


This is a global function.

---

<a name="accessor"></a>
#### d3plus.**accessor**(key, [def]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/accessor.js#L1)

Wraps an object key in a simple accessor function.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to be returned from each Object passed to the function. |
| [def] | <code>\*</code> | A default value to be returned if the key is not present. |

this

```js
accessor("id");
    
```
returns this

```js
function(d) {
  return d["id"];
}
```

---

<a name="configPrep"></a>
#### d3plus.**configPrep**([config], [type], [nest]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/configPrep.js#L1)

Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> | <code>this._shapeConfig</code> | The configuration object to parse. |
| [type] | <code>String</code> | <code>&quot;shape&quot;</code> | The event classifier to user for "on" events. For example, the default event type of "shape" will apply all events in the "on" config object with that key, like "click.shape" and "mouseleave.shape", in addition to any gloval events like "click" and "mouseleave". |
| [nest] | <code>String</code> |  | An optional nested key to bubble up to the parent config level. |


---

<a name="constant"></a>
#### d3plus.**constant**(value) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/constant.js#L1)

Wraps non-function variables in a simple return function.


This is a global function.
this

```js
constant(42);
    
```
returns this

```js
function() {
  return 42;
}
```

---

<a name="unique"></a>
#### d3plus.**unique**(arr, [accessor]) [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/unique.js#L1)

ES5 implementation to reduce an Array of values to unique instances.


This is a global function.

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | The Array of objects to be filtered. |
| [accessor] | <code>function</code> | An optional accessor function used to extract data points from an Array of Objects. |

this

```js
unique(["apple", "banana", "apple"]);
    
```
returns this

```js
["apple", "banana"]
```

---

<a name="uuid"></a>
#### d3plus.**uuid**() [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/uuid.js#L10)


This is a global function.

---

<a name="colorDefaults"></a>
#### **colorDefaults** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/color/defaults.js#L3)

A set of default color values used when assigning colors based on data.

| Name | Default | Description |
|---|---|---|
| dark | "#555555" | Used in the [contrast](#contrast) function when the color given is very light. |
| light | "#f7f7f7" | Used in the [contrast](#contrast) function when the color given is very dark. |
| missing | "#cccccc" | Used in the [assign](#assign) function when the value passed is `null` or `undefined`. |
| off | "#C44536" | Used in the [assign](#assign) function when the value passed is `false`. |
| on | "#6A994E" | Used in the [assign](#assign) function when the value passed is `true`. |
| scale | "#4281A4", "#F6AE2D", "#C44536", "#2A9D8F", "#6A994E", "#CEB54A", "#5E548E", "#C08497", "#99582A", "#8C8C99", "#1D3557", "#D08C60", "#6D2E46", "#8BB19C", "#52796F", "#5E60CE", "#985277", "#5C374C" | An ordinal scale used in the [assign](#assign) function for non-valid color strings and numbers. |


This is a global namespace.

---

<a name="formatLocale"></a>
#### **formatLocale** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/locales/dictionaries/formatLocale.js#L1)

A set of default locale formatters used when assigning suffixes and currency in numbers.

| Name | Default | Description |
|---|---|---|
| separator | "" | Separation between the number with the suffix. |
| suffixes | [] | List of suffixes used to format numbers. |
| grouping | [3] | The array of group sizes, |
| delimiters | {thousands: ",", decimal: "."} | Decimal and group separators. |
| currency | ["$", ""] | The currency prefix and suffix. |


This is a global namespace.

---

<a name="RESET"></a>
#### **RESET** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/utils/RESET.js#L1)

String constant used to reset an individual config property.


This is a global constant.

---

<a name="LargestRect"></a>
#### **LargestRect** [<>](https://github.com/d3plus/undefined/blob/master//Users/dave/Code/d3plus/d3plus/packages/core/src/math/largestRect.js#L16)

The returned Object of the largestRect function.


This is a global typedef.
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| width | <code>Number</code> | The width of the rectangle |
| height | <code>Number</code> | The height of the rectangle |
| cx | <code>Number</code> | The x coordinate of the rectangle's center |
| cy | <code>Number</code> | The y coordinate of the rectangle's center |
| angle | <code>Number</code> | The rotation angle of the rectangle in degrees. The anchor of rotation is the center point. |
| area | <code>Number</code> | The area of the largest rectangle. |
| points | <code>Array</code> | An array of x/y coordinates for each point in the rectangle, useful for rendering paths. |


---



###### <sub>Documentation generated on Tue, 17 Dec 2024 18:36:37 GMT</sub>
