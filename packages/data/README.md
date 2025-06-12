# @d3plus/data
  
JavaScript data loading, manipulation, and analysis functions.

## Installing

If using npm, `npm install @d3plus/data`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/data).

```js
import modules from "@d3plus/data";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/data@3.0.0-alpha.4"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using @d3plus/react.

## API Reference

##### 
* [isData](#isData) - Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.
* [dataConcat](#dataConcat) - Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.
* [dataFold](#dataFold) - Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.
* [isData](#isData) - Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.
* [dataLoad](#dataLoad) - Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.
* [merge](#merge) - Combines an Array of Objects together and returns a new Object.
* [unique](#unique) - ES5 implementation to reduce an Array of values to unique instances.

---

<a name="isData"></a>
#### d3plus.**isData**(data, [data], data) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/addToQueue.js#L4)

Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.


This is a global function

---

<a name="dataConcat"></a>
#### d3plus.**dataConcat**(arrayOfArray, [data]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/concat.js#L1)

Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.


This is a global function

---

<a name="dataFold"></a>
#### d3plus.**dataFold**(json, [data], [headers]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/fold.js#L1)

Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.


This is a global function

---

<a name="isData"></a>
#### d3plus.**isData**(dataItem) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/isData.js#L1)

Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.


This is a global function

---

<a name="dataLoad"></a>
#### d3plus.**dataLoad**(path, [formatter], [key], [callback]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/load.js#L8)

Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.


This is a global function

---

<a name="merge"></a>
#### d3plus.**merge**(objects, aggs) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/merge.js#L4)

Combines an Array of Objects together and returns a new Object.


This is a global function
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

<a name="unique"></a>
#### d3plus.**unique**(arr, [accessor]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/data/src/unique.js#L1)

ES5 implementation to reduce an Array of values to unique instances.


This is a global function
this

```js
unique(["apple", "banana", "apple"]);
    
```
returns this

```js
["apple", "banana"]
```

---

