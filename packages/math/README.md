# @d3plus/math

[![NPM version](https://img.shields.io/npm/v/@d3plus/math.svg)](https://www.npmjs.com/package/@d3plus/math)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=math)](https://codecov.io/gh/d3plus/d3plus/flags)

Mathematical functions to aid in calculating visualizations.

## Installing

If using npm, `npm install @d3plus/math`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/math).

```js
import {*} from "@d3plus/math";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/math"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`closest`](#closest) | Finds the closest numeric value in an array. |
| [`largestRect`](#largestrect) | Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspe |
| [`linearConfidence`](#linearconfidence) | Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/S |
| [`lineIntersection`](#lineintersection) | Finds the intersection point (if there is one) of the lines p1q1 and p2q2. |
| [`path2polygon`](#path2polygon) | Transforms a path string into an Array of points, with no DOM involved. |
| [`pathBounds`](#pathbounds) | Computes the exact bounding box of an SVG path string with no DOM involved, |
| [`pointDistance`](#pointdistance) | Calculates the pixel distance between two points. |
| [`pointDistanceSquared`](#pointdistancesquared) | Returns the squared euclidean distance between two points. |
| [`pointRotate`](#pointrotate) | Rotates a point around a given origin. |
| [`polygonInside`](#polygoninside) | Checks if one polygon is inside another polygon. |
| [`polygonRayCast`](#polygonraycast) | Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on |
| [`polygonRotate`](#polygonrotate) | Rotates a point around a given origin. |
| [`regression`](#regression) | Fits a regression model to a set of `[x, y]` points. Points with non-finite values, or that fall outside a model's domai |
| [`segmentBoxContains`](#segmentboxcontains) | Checks whether a point is inside the bounding box of a line segment. |
| [`segmentsIntersect`](#segmentsintersect) | Checks whether the line segments p1q1 && p2q2 intersect. |
| [`shapeEdgePoint`](#shapeedgepoint) | Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel dis |
| [`simplify`](#simplify) | Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplificatio |
| [`studentTCdf`](#studenttcdf) | The cumulative distribution function of Student's t-distribution. |
| [`studentTQuantile`](#studenttquantile) | The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportio |

| Interfaces | Description |
| --- | --- |
| [`RegressionOptions`](#regressionoptions) |  |
| [`RegressionResult`](#regressionresult) |  |

| Type Aliases | Description |
| --- | --- |
| [`RegressionType`](#regressiontype) |  |

## Functions

<a id="closest"></a>

### closest()

> **closest**(`n`: `number`, `arr?`: `number`[]): `number` \| `undefined`

Defined in: [closest.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/math/src/closest.ts#L6)

Finds the closest numeric value in an array.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `n` | `number` | *required* | The number value to use when searching the array. |
| `arr` | `number`[] | `[]` | The array of values to test against. |

#### Returns

`number` \| `undefined`

***

<a id="largestrect"></a>

### largestRect()

> **largestRect**(`poly`: `Point`[], `options?`: `LargestRectOptions`): `LargestRectResult` \| `null`

Defined in: [largestRect.ts:315](https://github.com/d3plus/d3plus/blob/main/packages/math/src/largestRect.ts#L315)

Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios.

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | An Array of points that represent a polygon. |
| `options` | `LargestRectOptions` | An Object that allows for overriding various parameters of the algorithm. |

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

Defined in: [linearConfidence.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/math/src/linearConfidence.ts#L8)

Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/Sxx)`. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `points` | \[`number`, `number`\][] | *required* | An array of `[x, y]` pairs. |
| `level` | `number` | `0.95` | The confidence level, between 0 and 1. Defaults to 0.95. |

#### Returns

((`x`: `number`) => \[`number`, `number`\]) \| `null`

***

<a id="lineintersection"></a>

### lineIntersection()

> **lineIntersection**(`p1`: `Point`, `q1`: `Point`, `p2`: `Point`, `q2`: `Point`): `Point` \| `null`

Defined in: [lineIntersection.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/math/src/lineIntersection.ts#L11)

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

<a id="path2polygon"></a>

### path2polygon()

> **path2polygon**(`path`: `string`, `segmentLength?`: `number`): `Point`[]

Defined in: [path2polygon.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/math/src/path2polygon.ts#L24)

Transforms a path string into an Array of points, with no DOM involved.
Straight segments contribute their endpoints; curves and arcs are flattened
into line segments no longer than `segmentLength`. Higher `segmentLength`
values lower computation time but yield more rigid curves.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `path` | `string` | *required* | An SVG string path, commonly the "d" property of a <path> element. |
| `segmentLength` | `number` | `50` | The maximum length of line segments when flattening curves. |

#### Returns

`Point`[]

***

<a id="pathbounds"></a>

### pathBounds()

> **pathBounds**(`d`: `string`): `object`

Defined in: [pathBounds.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathBounds.ts#L62)

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
| `height` | `number` | [pathBounds.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathBounds.ts#L66) |
| `width` | `number` | [pathBounds.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathBounds.ts#L65) |
| `x` | `number` | [pathBounds.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathBounds.ts#L63) |
| `y` | `number` | [pathBounds.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathBounds.ts#L64) |

***

<a id="pointdistance"></a>

### pointDistance()

> **pointDistance**(`p1`: `Point`, `p2`: `Point`): `number`

Defined in: [pointDistance.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointDistance.ts#L9)

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

Defined in: [pointDistanceSquared.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointDistanceSquared.ts#L8)

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

Defined in: [pointRotate.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointRotate.ts#L9)

Rotates a point around a given origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `Point` | The point to be rotated, which should always be an `[x, y]` formatted Array. |
| `alpha` | `number` | The angle in radians to rotate. |
| `origin` | `Point` | The origin point of the rotation, which should always be an `[x, y]` formatted Array. |

#### Returns

`Point`

***

<a id="polygoninside"></a>

### polygonInside()

> **polygonInside**(`polyA`: `Point`[], `polyB`: `Point`[]): `boolean`

Defined in: [polygonInside.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonInside.ts#L11)

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

Defined in: [polygonRayCast.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonRayCast.ts#L13)

Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `poly` | `Point`[] | *required* | The polygon to test against, which should be an `[x, y]` formatted Array. |
| `origin` | `Point` | *required* | The origin point of the ray to be cast, which should be an `[x, y]` formatted Array. |
| `alpha` | `number` | `0` | The angle in radians of the ray. |

#### Returns

\[`Point` \| `null`, `Point` \| `null`\]

An array containing two values, the closest point on the left and the closest point on the right. If either point cannot be found, that value will be `null`.

***

<a id="polygonrotate"></a>

### polygonRotate()

> **polygonRotate**(`poly`: `Point`[], `alpha`: `number`, `origin?`: `Point`): `Point`[]

Defined in: [polygonRotate.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonRotate.ts#L10)

Rotates a point around a given origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `poly` | `Point`[] | The polygon to be rotated, which should be an Array of `[x, y]` values. |
| `alpha` | `number` | The angle in radians to rotate. |
| `origin` | `Point` | The origin point of the rotation, which should be an `[x, y]` formatted Array. |

#### Returns

`Point`[]

***

<a id="regression"></a>

### regression()

> **regression**(`points`: \[`number`, `number`\][], `type?`: [`RegressionType`](#regressiontype), `options?`: [`RegressionOptions`](#regressionoptions)): [`RegressionResult`](#regressionresult) \| `null`

Defined in: [regression.ts:127](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L127)

Fits a regression model to a set of `[x, y]` points. Points with non-finite values, or that fall outside a model's domain (y ≤ 0 for exponential, x ≤ 0 for logarithmic, either for power), are ignored. Returns `null` when there are too few usable points or the x values do not vary.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `points` | \[`number`, `number`\][] | *required* | An array of `[x, y]` pairs. |
| `type` | [`RegressionType`](#regressiontype) | `"linear"` | The regression model: "linear", "exponential", "logarithmic", "power", or "polynomial". |
| `options` | [`RegressionOptions`](#regressionoptions) | `{}` | Additional options, such as the polynomial `order`. |

#### Returns

[`RegressionResult`](#regressionresult) \| `null`

***

<a id="segmentboxcontains"></a>

### segmentBoxContains()

> **segmentBoxContains**(`s1`: `Point`, `s2`: `Point`, `p`: `Point`): `boolean`

Defined in: [segmentBoxContains.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/math/src/segmentBoxContains.ts#L9)

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

Defined in: [segmentsIntersect.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/math/src/segmentsIntersect.ts#L12)

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

Defined in: [shapeEdgePoint.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/math/src/shapeEdgePoint.ts#L11)

Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `angle` | `number` | *required* | The angle, in radians, of the offset point. |
| `distance` | `number` | *required* | The pixel distance away from the origin. |
| `shape` | `string` | `"circle"` | The shape type ("circle", "square", or "triangle"). |

#### Returns

`Point` \| `null`

***

<a id="simplify"></a>

### simplify()

> **simplify**(`poly`: `Point`[], `tolerance?`: `number`, `highestQuality?`: `boolean`): `Point`[]

Defined in: [simplify.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/math/src/simplify.ts#L114)

Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `poly` | `Point`[] | *required* | An Array of points that represent a polygon. |
| `tolerance` | `number` | `1` | Affects the amount of simplification (in the same metric as the point coordinates). |
| `highestQuality` | `boolean` | `false` | Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower. |

#### Returns

`Point`[]

#### Author

Vladimir Agafonkin

***

<a id="studenttcdf"></a>

### studentTCdf()

> **studentTCdf**(`t`: `number`, `df`: `number`): `number`

Defined in: [studentTQuantile.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/math/src/studentTQuantile.ts#L64)

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

Defined in: [studentTQuantile.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/math/src/studentTQuantile.ts#L74)

The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportion `p` of the distribution lies.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `number` | A probability between 0 and 1 (e.g. 0.975 for a two-sided 95% interval). |
| `df` | `number` | Degrees of freedom (greater than 0). |

#### Returns

`number`

## Interfaces

<a id="regressionoptions"></a>

### RegressionOptions

Defined in: [regression.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L29)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-order"></a> `order?` | `number` | The polynomial order (degree), used when `type` is "polynomial". Defaults to 2. | [regression.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L31) |

***

<a id="regressionresult"></a>

### RegressionResult

Defined in: [regression.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L8)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-coefficients"></a> `coefficients` | `number`[] | The fitted coefficients, in original units: - linear / polynomial: `[c0, c1, …]` for `y = c0 + c1·x + c2·x² …` - exponential: `[a, b]` for `y = a·e^(b·x)` - logarithmic: `[a, b]` for `y = a + b·ln(x)` - power: `[a, b]` for `y = a·x^b` | [regression.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L18) |
| <a id="property-extent"></a> `extent` | \[`number`, `number`\] | The smallest and largest x values used in the fit. | [regression.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L26) |
| <a id="property-n"></a> `n` | `number` | The number of points used in the fit. | [regression.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L24) |
| <a id="property-predict"></a> `predict` | (`x`: `number`) => `number` | Predicts y for a given x. | [regression.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L20) |
| <a id="property-r2"></a> `r2` | `number` | The coefficient of determination, measured in original y units. | [regression.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L22) |
| <a id="property-type"></a> `type` | [`RegressionType`](#regressiontype) | The type of regression that was fit. | [regression.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L10) |

## Type Aliases

<a id="regressiontype"></a>

### RegressionType

> **RegressionType** = `"linear"` \| `"exponential"` \| `"logarithmic"` \| `"power"` \| `"polynomial"`

Defined in: [regression.ts:1](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L1)
