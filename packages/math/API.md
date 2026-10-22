# @d3plus/math API Reference

| Functions | Description |
| --- | --- |
| [`ckmeans`](#ckmeans) | Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, minimizing within-group sum-of-squared-deviations. |
| [`clamp`](#clamp) | Constrains a number to the range from `min` to `max`, inclusive. |
| [`closest`](#closest) | Finds the closest numeric value in an array. |
| [`epanechnikovKernel`](#epanechnikovkernel) | The Epanechnikov kernel, scaled to unit variance like the gaussian kernel so a bandwidth smooths about as much with either: `3 / (4√5) · (1 - u²/5)` for `\|u\| ≤ √5`, otherwise 0. |
| [`finite`](#finite) | Whether a value is a finite number: not `NaN`, `±Infinity`, or a non-number such as a numeric string, `null`, or an array. |
| [`gaussianKernel`](#gaussiankernel) | The standard normal (gaussian) kernel: `e^(-u²/2) / √(2π)`. |
| [`kernelDensity`](#kerneldensity) | Estimates the probability density of a set of observations with a kernel density estimate, evaluated on an evenly spaced grid. |
| [`largestRect`](#largestrect) | Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios. |
| [`linearConfidence`](#linearconfidence) | Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/Sxx)`. |
| [`linearPrediction`](#linearprediction) | Builds the prediction band for a new observation under a simple linear regression of `points`: `ŷ ± t·s·√(1 + 1/n + (x − x̄)²/Sxx)`. |
| [`lineIntersection`](#lineintersection) | Finds the intersection point (if there is one) of the lines p1q1 and p2q2. |
| [`negativeSpace`](#negativespace) | Finds the open, axis-aligned rectangles inside `bounds` that lie entirely outside the marks described by `obstacles`. |
| [`path2polygon`](#path2polygon) | Transforms a path string into an Array of points, with no DOM involved. |
| [`pathBounds`](#pathbounds) | Computes the exact bounding box of an SVG path string with no DOM involved, evaluating the true extrema of each Bézier and arc segment (not a sampled approximation). |
| [`pathCommands`](#pathcommands) | Tokenizes an SVG path `d` string into its commands as written, without resolving them to absolute coordinates. |
| [`pointDistance`](#pointdistance) | Calculates the pixel distance between two points. |
| [`pointDistanceSquared`](#pointdistancesquared) | Returns the squared euclidean distance between two points. |
| [`pointRotate`](#pointrotate) | Rotates a point around a given origin. |
| [`polygonInside`](#polygoninside) | Checks if one polygon is inside another polygon. |
| [`polygonRayCast`](#polygonraycast) | Gives the two closest intersection points between a ray cast from a point inside a polygon. |
| [`polygonRotate`](#polygonrotate) | Rotates a polygon around a given origin. |
| [`regression`](#regression) | Fits a regression model to a set of `[x, y]` points. |
| [`segmentBoxContains`](#segmentboxcontains) | Checks whether a point is inside the bounding box of a line segment. |
| [`segmentsIntersect`](#segmentsintersect) | Checks whether the line segments p1q1 && p2q2 intersect. |
| [`shapeEdgePoint`](#shapeedgepoint) | Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle. |
| [`silvermanBandwidth`](#silvermanbandwidth) | Silverman's rule-of-thumb bandwidth for a gaussian kernel density estimate: `0.9 · min(σ, IQR / 1.34) · n^(-1/5)`. |
| [`simplify`](#simplify) | Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. |
| [`studentTCdf`](#studenttcdf) | The cumulative distribution function of Student's t-distribution. |
| [`studentTQuantile`](#studenttquantile) | The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportion `p` of the distribution lies. |

| Interfaces | Description |
| --- | --- |
| [`Bounds`](#bounds) | An axis-aligned box: top-left corner plus size. |
| [`KernelDensityOptions`](#kerneldensityoptions) |  |
| [`NegativeSpaceOptions`](#negativespaceoptions) | Options for `negativeSpace`: padding, minimum box size, grid resolution, and extra boxes to avoid. |
| [`PathCommand`](#pathcommand) | One command of an SVG path as written: its letter (case kept, so relative commands stay relative) and its arguments, one array per segment when the command repeats implicitly. |
| [`RegressionOptions`](#regressionoptions) |  |
| [`RegressionResult`](#regressionresult) |  |

| Type Aliases | Description |
| --- | --- |
| [`DensityPoint`](#densitypoint) | One evaluated point of a density curve: `[value, density]`. |
| [`Kernel`](#kernel) | A kernel function of the scaled distance `u = (x - xi) / bandwidth`. |
| [`KernelName`](#kernelname) | The built-in kernels, by name. |
| [`RegressionType`](#regressiontype) |  |

## Functions

<a id="ckmeans"></a>

### ckmeans()

> **ckmeans**(`data`: `number`[], `nClusters`: `number`): `number`[][]

Defined in: [ckmeans.ts:222](https://github.com/d3plus/d3plus/blob/main/packages/math/src/ckmeans.ts#L222)

Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, minimizing within-group sum-of-squared-deviations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `number`[] | input data, as an array of number values |
| `nClusters` | `number` | number of desired classes. This cannot be greater than the number of values in the data array. |

#### Returns

`number`[][]

***

<a id="clamp"></a>

### clamp()

> **clamp**(`value`: `number`, `min`: `number`, `max`: `number`): `number`

Defined in: [clamp.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/math/src/clamp.ts#L7)

Constrains a number to the range from `min` to `max`, inclusive.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `number` | The number to constrain. |
| `min` | `number` | The lower bound. |
| `max` | `number` | The upper bound; when it is below `min`, `min` wins. |

#### Returns

`number`

***

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

<a id="epanechnikovkernel"></a>

### epanechnikovKernel()

> **epanechnikovKernel**(`u`: `number`): `number`

Defined in: [kernelDensity.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L52)

The Epanechnikov kernel, scaled to unit variance like the gaussian kernel
so a bandwidth smooths about as much with either:
`3 / (4√5) · (1 - u²/5)` for `|u| ≤ √5`, otherwise 0. Its density reaches
exactly zero √5 bandwidths past the outermost observations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `u` | `number` | The scaled distance from an observation. |

#### Returns

`number`

***

<a id="finite"></a>

### finite()

> **finite**(`value`: `unknown`): `value is number`

Defined in: [finite.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/math/src/finite.ts#L6)

Whether a value is a finite number: not `NaN`, `±Infinity`, or a
non-number such as a numeric string, `null`, or an array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to check. |

#### Returns

`value is number`

***

<a id="gaussiankernel"></a>

### gaussianKernel()

> **gaussianKernel**(`u`: `number`): `number`

Defined in: [kernelDensity.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L39)

The standard normal (gaussian) kernel: `e^(-u²/2) / √(2π)`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `u` | `number` | The scaled distance from an observation. |

#### Returns

`number`

***

<a id="kerneldensity"></a>

### kernelDensity()

> **kernelDensity**(`values`: readonly `number`[], `options?`: [`KernelDensityOptions`](#kerneldensityoptions)): [`DensityPoint`](#densitypoint)[]

Defined in: [kernelDensity.ts:101](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L101)

Estimates the probability density of a set of observations with a kernel
density estimate, evaluated on an evenly spaced grid. Each observation
contributes one kernel scaled to the bandwidth, and the sum is normalized
so the curve's area is 1. Non-finite values are ignored; an empty input
returns an empty array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `number`[] | The observations. |
| `options` | [`KernelDensityOptions`](#kerneldensityoptions) | The kernel, bandwidth, and evaluation grid. |

#### Returns

[`DensityPoint`](#densitypoint)[]

The `[value, density]` points, in ascending value order.

***

<a id="largestrect"></a>

### largestRect()

> **largestRect**(`poly`: `Point`[], `options?`: `LargestRectOptions`): `LargestRectResult` \| `null`

Defined in: [largestRect.ts:322](https://github.com/d3plus/d3plus/blob/main/packages/math/src/largestRect.ts#L322)

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

<a id="linearprediction"></a>

### linearPrediction()

> **linearPrediction**(`points`: \[`number`, `number`\][], `level?`: `number`): ((`x`: `number`) => \[`number`, `number`\]) \| `null`

Defined in: [linearPrediction.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/math/src/linearPrediction.ts#L8)

Builds the prediction band for a new observation under a simple linear regression of `points`: `ŷ ± t·s·√(1 + 1/n + (x − x̄)²/Sxx)`. Wider than the confidence band of `linearConfidence`, since it covers the scatter of individual values as well as the uncertainty of the fitted line, which makes it the band to draw around a forecast. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.

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

<a id="negativespace"></a>

### negativeSpace()

> **negativeSpace**(`bounds`: [`Bounds`](#bounds), `obstacles`: [`Bounds`](#bounds)[], `options?`: [`NegativeSpaceOptions`](#negativespaceoptions)): [`Bounds`](#bounds)[]

Defined in: [negativeSpace.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L102)

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
| `options` | [`NegativeSpaceOptions`](#negativespaceoptions) | Padding and minimum-size options. |

#### Returns

[`Bounds`](#bounds)[]

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

<a id="pathcommands"></a>

### pathCommands()

> **pathCommands**(`d`: `string`): [`PathCommand`](#pathcommand)[]

Defined in: [pathParse.ts:111](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathParse.ts#L111)

Tokenizes an SVG path `d` string into its commands as written, without
resolving them to absolute coordinates. Arc
flags are read as single `0`/`1` characters, so compact arcs such as
`a1 1 0 011 1` tokenize correctly. Stops at the first character that is
not a path command.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `d` | `string` | An SVG path string (the `d` attribute of a `<path>`). |

#### Returns

[`PathCommand`](#pathcommand)[]

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

Rotates a polygon around a given origin.

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

<a id="silvermanbandwidth"></a>

### silvermanBandwidth()

> **silvermanBandwidth**(`values`: readonly `number`[]): `number`

Defined in: [kernelDensity.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L73)

Silverman's rule-of-thumb bandwidth for a gaussian kernel density estimate:
`0.9 · min(σ, IQR / 1.34) · n^(-1/5)`. When one of the two spreads is zero
the other is used; when the values don't vary at all (including a single
value) the spread falls back to a tenth of their magnitude, or 1 for zeros.
Non-finite values are ignored. Returns NaN when there are no values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `number`[] | The observations. |

#### Returns

`number`

***

<a id="simplify"></a>

### simplify()

> **simplify**(`poly`: `Point`[], `tolerance?`: `number`, `highestQuality?`: `boolean`): `Point`[]

Defined in: [simplify.ts:117](https://github.com/d3plus/d3plus/blob/main/packages/math/src/simplify.ts#L117)

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

<a id="bounds"></a>

### Bounds

Defined in: [negativeSpace.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L6)

An axis-aligned box: top-left corner plus size.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-height"></a> `height` | `number` | [negativeSpace.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L10) |
| <a id="property-width"></a> `width` | `number` | [negativeSpace.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L9) |
| <a id="property-x"></a> `x` | `number` | [negativeSpace.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L7) |
| <a id="property-y"></a> `y` | `number` | [negativeSpace.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L8) |

***

<a id="kerneldensityoptions"></a>

### KernelDensityOptions

Defined in: [kernelDensity.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L12)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bandwidth"></a> `bandwidth?` | `number` \| ((`values`: `number`[]) => `number`) | The bandwidth (smoothing window) in data units, or a function that returns one for the finite input values. Defaults to Silverman's rule of thumb (see `silvermanBandwidth`). | [kernelDensity.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L20) |
| <a id="property-cut"></a> `cut?` | `number` | How far past the smallest and largest value to evaluate, in bandwidths. Defaults to 3, where a gaussian density has fallen to about 1% of its peak. Use 0 to stop at the data's extent. Ignored when `extent` is set. | [kernelDensity.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L28) |
| <a id="property-extent"></a> `extent?` | \[`number`, `number`\] | An explicit `[min, max]` range to evaluate across. | [kernelDensity.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L30) |
| <a id="property-kernel"></a> `kernel?` | [`Kernel`](#kernel) \| [`KernelName`](#kernelname) | The kernel: `"gaussian"` (default), `"epanechnikov"`, or a custom kernel function. | [kernelDensity.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L14) |
| <a id="property-points"></a> `points?` | `number` | How many evenly spaced points to evaluate the density at. Defaults to 100 (minimum 2). | [kernelDensity.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L22) |

***

<a id="negativespaceoptions"></a>

### NegativeSpaceOptions

Defined in: [negativeSpace.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L14)

Options for `negativeSpace`: padding, minimum box size, grid resolution, and extra boxes to avoid.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-divisions"></a> `divisions?` | `number` | Number of evenly spaced grid lines added per axis, so the hull's diagonal edges are resolved finely. Default 48. | [negativeSpace.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L22) |
| <a id="property-exclude"></a> `exclude?` | [`Bounds`](#bounds)[] | Other boxes to keep clear of, each on its own rather than as part of the marks' hull (e.g. controls overlaid on the chart). | [negativeSpace.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L24) |
| <a id="property-minheight"></a> `minHeight?` | `number` | Smallest height a returned box may have. Default 1. | [negativeSpace.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L20) |
| <a id="property-minwidth"></a> `minWidth?` | `number` | Smallest width a returned box may have. Default 1. | [negativeSpace.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L18) |
| <a id="property-padding"></a> `padding?` | `number` | Space kept clear around every obstacle, in pixels. Default 0. | [negativeSpace.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/math/src/negativeSpace.ts#L16) |

***

<a id="pathcommand"></a>

### PathCommand

Defined in: [pathParse.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathParse.ts#L98)

One command of an SVG path as written: its letter (case kept, so relative
commands stay relative) and its arguments, one array per segment when the
command repeats implicitly.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-command"></a> `command` | `string` | [pathParse.ts:99](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathParse.ts#L99) |
| <a id="property-segments"></a> `segments` | `number`[][] | [pathParse.ts:100](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pathParse.ts#L100) |

***

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
| <a id="property-extent-1"></a> `extent` | \[`number`, `number`\] | The smallest and largest x values used in the fit. | [regression.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L26) |
| <a id="property-n"></a> `n` | `number` | The number of points used in the fit. | [regression.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L24) |
| <a id="property-predict"></a> `predict` | (`x`: `number`) => `number` | Predicts y for a given x. | [regression.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L20) |
| <a id="property-r2"></a> `r2` | `number` | The coefficient of determination, measured in original y units. | [regression.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L22) |
| <a id="property-type"></a> `type` | [`RegressionType`](#regressiontype) | The type of regression that was fit. | [regression.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L10) |

## Type Aliases

<a id="densitypoint"></a>

### DensityPoint

> **DensityPoint** = \[`number`, `number`\]

Defined in: [kernelDensity.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L10)

One evaluated point of a density curve: `[value, density]`.

***

<a id="kernel"></a>

### Kernel

> **Kernel** = (`u`: `number`) => `number`

Defined in: [kernelDensity.ts:4](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L4)

A kernel function of the scaled distance `u = (x - xi) / bandwidth`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `u` | `number` |

#### Returns

`number`

***

<a id="kernelname"></a>

### KernelName

> **KernelName** = `"gaussian"` \| `"epanechnikov"`

Defined in: [kernelDensity.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/math/src/kernelDensity.ts#L7)

The built-in kernels, by name.

***

<a id="regressiontype"></a>

### RegressionType

> **RegressionType** = `"linear"` \| `"exponential"` \| `"logarithmic"` \| `"power"` \| `"polynomial"`

Defined in: [regression.ts:1](https://github.com/d3plus/d3plus/blob/main/packages/math/src/regression.ts#L1)
