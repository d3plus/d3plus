# @d3plus/math
  
Mathematical functions to aid in calculating visualizations.

## Installing

If using npm, `npm install @d3plus/math`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/math@3.0.0/+esm).

```js
import modules from "@d3plus/math";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/math@3.0.0"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/).

## API Reference

##### 
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

##### 
* [LargestRect](#LargestRect) - The returned Object of the largestRect function.

---

<a name="closest"></a>
#### d3plus.**closest**(n, arr) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/closest.js#L1)

Finds the closest numeric value in an array.


This is a global function

---

<a name="largestRect"></a>
#### d3plus.**largestRect**(poly, [options]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/largestRect.js#L28)

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.


This is a global function
**Author**: Daniel Smilkov [dsmilkov@gmail.com]  

---

<a name="lineIntersection"></a>
#### d3plus.**lineIntersection**(p1, q1, p2, q2) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/lineIntersection.js#L1)

Finds the intersection point (if there is one) of the lines p1q1 and p2q2.


This is a global function

---

<a name="path2polygon"></a>
#### d3plus.**path2polygon**(path, [segmentLength]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/path2polygon.js#L1)

Transforms a path string into an Array of points.


This is a global function

---

<a name="pointDistance"></a>
#### d3plus.**pointDistance**(p1, p2) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointDistance.js#L3)

Calculates the pixel distance between two points.


This is a global function

---

<a name="pointDistanceSquared"></a>
#### d3plus.**pointDistanceSquared**(p1, p2) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointDistanceSquared.js#L1)

Returns the squared euclidean distance between two points.


This is a global function

---

<a name="pointRotate"></a>
#### d3plus.**pointRotate**(p, alpha, [origin]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/pointRotate.js#L1)

Rotates a point around a given origin.


This is a global function

---

<a name="polygonInside"></a>
#### d3plus.**polygonInside**(polyA, polyB) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonInside.js#L5)

Checks if one polygon is inside another polygon.


This is a global function

---

<a name="polygonRayCast"></a>
#### d3plus.**polygonRayCast**(poly, origin, [alpha]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonRayCast.js#L5)

Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.


This is a global function
**Returns**: <code>Array</code> - An array containing two values, the closest point on the left and the closest point on the right. If either point cannot be found, that value will be `null`.  

---

<a name="polygonRotate"></a>
#### d3plus.**polygonRotate**(poly, alpha, [origin]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/polygonRotate.js#L3)

Rotates a point around a given origin.


This is a global function

---

<a name="segmentBoxContains"></a>
#### d3plus.**segmentBoxContains**(s1, s2, p) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/segmentBoxContains.js#L1)

Checks whether a point is inside the bounding box of a line segment.


This is a global function

---

<a name="segmentsIntersect"></a>
#### d3plus.**segmentsIntersect**(p1, q1, p2, q2) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/segmentsIntersect.js#L4)

Checks whether the line segments p1q1 && p2q2 intersect.


This is a global function

---

<a name="shapeEdgePoint"></a>
#### d3plus.**shapeEdgePoint**(angle, distance) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/shapeEdgePoint.js#L3)

Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.


This is a global function
**Returns**: <code>String</code> - [shape = "circle"] The type of shape, which can be either "circle" or "square".  

---

<a name="largestRect"></a>
#### d3plus.**largestRect**(poly, [tolerance], [highestQuality]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/simplify.js#L112)

Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).


This is a global function
**Author**: Vladimir Agafonkin  

---

<a name="LargestRect"></a>
#### **LargestRect** [<>](https://github.com/d3plus/d3plus/blob/main/packages/math/src/largestRect.js#L16)

The returned Object of the largestRect function.


This is a global typedef
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


###### <sub>Documentation generated on Fri, 07 Mar 2025 16:27:09 GMT</sub>
