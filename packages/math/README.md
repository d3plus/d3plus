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
| [`lineIntersection`](#lineintersection) | Finds the intersection point (if there is one) of the lines p1q1 and p2q2. |
| [`path2polygon`](#path2polygon) | Transforms a path string into an Array of points. |
| [`pointDistance`](#pointdistance) | Calculates the pixel distance between two points. |
| [`pointDistanceSquared`](#pointdistancesquared) | Returns the squared euclidean distance between two points. |
| [`pointRotate`](#pointrotate) | Rotates a point around a given origin. |
| [`polygonInside`](#polygoninside) | Checks if one polygon is inside another polygon. |
| [`polygonRayCast`](#polygonraycast) | Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on |
| [`polygonRotate`](#polygonrotate) | Rotates a point around a given origin. |
| [`segmentBoxContains`](#segmentboxcontains) | Checks whether a point is inside the bounding box of a line segment. |
| [`segmentsIntersect`](#segmentsintersect) | Checks whether the line segments p1q1 && p2q2 intersect. |
| [`shapeEdgePoint`](#shapeedgepoint) | Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel dis |
| [`simplify`](#simplify) | Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplificatio |

## Functions

<a id="closest"></a>

### closest()

> **closest**(`n`: `number`, `arr?`: `number`[]): `number` \| `undefined`

Defined in: [closest.ts:6](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/closest.ts#L6)

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

Defined in: [largestRect.ts:92](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/largestRect.ts#L92)

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

<a id="lineintersection"></a>

### lineIntersection()

> **lineIntersection**(`p1`: `Point`, `q1`: `Point`, `p2`: `Point`, `q2`: `Point`): `Point` \| `null`

Defined in: [lineIntersection.ts:11](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/lineIntersection.ts#L11)

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

Defined in: [path2polygon.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/path2polygon.ts#L8)

Transforms a path string into an Array of points.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `path` | `string` | *required* | An SVG string path, commonly the "d" property of a <path> element. |
| `segmentLength` | `number` | `50` | The length of line segments when converting curves line segments. Higher values lower computation time, but will result in curves that are more rigid. |

#### Returns

`Point`[]

***

<a id="pointdistance"></a>

### pointDistance()

> **pointDistance**(`p1`: `Point`, `p2`: `Point`): `number`

Defined in: [pointDistance.ts:9](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/pointDistance.ts#L9)

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

Defined in: [pointDistanceSquared.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/pointDistanceSquared.ts#L8)

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

Defined in: [pointRotate.ts:9](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/pointRotate.ts#L9)

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

Defined in: [polygonInside.ts:11](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/polygonInside.ts#L11)

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

Defined in: [polygonRayCast.ts:13](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/polygonRayCast.ts#L13)

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

Defined in: [polygonRotate.ts:10](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/polygonRotate.ts#L10)

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

<a id="segmentboxcontains"></a>

### segmentBoxContains()

> **segmentBoxContains**(`s1`: `Point`, `s2`: `Point`, `p`: `Point`): `boolean`

Defined in: [segmentBoxContains.ts:9](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/segmentBoxContains.ts#L9)

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

Defined in: [segmentsIntersect.ts:12](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/segmentsIntersect.ts#L12)

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

Defined in: [shapeEdgePoint.ts:11](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/shapeEdgePoint.ts#L11)

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

Defined in: [simplify.ts:114](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/math/src/simplify.ts#L114)

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
