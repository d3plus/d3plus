# @d3plus/data

[![NPM version](https://img.shields.io/npm/v/@d3plus/data.svg)](https://www.npmjs.com/package/@d3plus/data)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=data)](https://codecov.io/gh/d3plus/d3plus/flags)

JavaScript data loading, manipulation, and analysis functions.

## Installing

If using npm, `npm install @d3plus/data`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/data).

```js
import {*} from "@d3plus/data";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/data"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`addToQueue`](#addtoqueue) | Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualiz |
| [`concat`](#concat) | Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat th |
| [`fold`](#fold) | Given a JSON object where the data values and headers have been split into separate key lookups, this function will comb |
| [`isData`](#isdata) | Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid d |
| [`load`](#load) | Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function. |
| [`merge`](#merge) | Combines an Array of Objects together and returns a new Object. |
| [`nestGroups`](#nestgroups) | Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy. |
| [`unique`](#unique) | ES5 implementation to reduce an Array of values to unique instances. |

| Interfaces | Description |
| --- | --- |
| [`DataPoint`](#datapoint) | DataPoint |
| [`MergedDataPoint`](#mergeddatapoint) |  |

## Functions

<a id="addtoqueue"></a>

### addToQueue()

> **addToQueue**(`this`: `VizContext`, `_`: `string` \| [`DataPoint`](#datapoint)[] \| `Record`\<`string`, `unknown`\>, `f`: `DataFormatter` \| `undefined`, `key`: `string`): `void`

Defined in: [addToQueue.ts:26](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/addToQueue.ts#L26)

Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `this` | `VizContext` | - |
| `_` | `string` \| [`DataPoint`](#datapoint)[] \| `Record`\<`string`, `unknown`\> | - |
| `f` | `DataFormatter` \| *required* | Optional formatter function applied to the loaded data. |
| `key` | `string` | The property name on the instance to store the loaded data. |

#### Returns

`void`

***

<a id="concat"></a>

### concat()

> **concat**(`arrayOfArrays`: ([`DataPoint`](#datapoint)[] \| `Record`\<`string`, [`DataPoint`](#datapoint)[]\>)[], `data?`: `string`): [`DataPoint`](#datapoint)[]

Defined in: [concat.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/concat.ts#L8)

Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `arrayOfArrays` | ([`DataPoint`](#datapoint)[] \| `Record`\<`string`, [`DataPoint`](#datapoint)[]\>)[] | *required* | Array of elements |
| `data` | `string` | `"data"` | The key in each element that contains the sub-array to concatenate. |

#### Returns

[`DataPoint`](#datapoint)[]

***

<a id="fold"></a>

### fold()

> **fold**(`json`: `FoldableJSON`, `data?`: `string`, `headers?`: `string`): [`DataPoint`](#datapoint)[]

Defined in: [fold.ts:13](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/fold.ts#L13)

Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `json` | `FoldableJSON` | *required* | A JSON data Object with `data` and `headers` keys. |
| `data` | `string` | `"data"` | The key in the JSON object that contains the data array. |
| `headers` | `string` | `"headers"` | The key used for the flat headers array inside of the JSON object. |

#### Returns

[`DataPoint`](#datapoint)[]

***

<a id="isdata"></a>

### isData()

> **isData**(`dataItem`: `unknown`): `boolean`

Defined in: [isData.ts:5](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/isData.ts#L5)

Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dataItem` | `unknown` | The value to be tested |

#### Returns

`boolean`

***

<a id="load"></a>

### load()

> **load**(`this`: `VizContext`, `path`: `string` \| [`DataPoint`](#datapoint)[] \| (`string` \| [`DataPoint`](#datapoint)[] \| `LoadRequestConfig`)[], `formatter?`: `DataFormatter`, `key?`: `string`, `callback?`: (`error`: `Error` \| `null` \| `undefined`, `data`: [`DataPoint`](#datapoint)[] \| [`DataPoint`](#datapoint)[][] \| `undefined`) => `void`): `void`

Defined in: [load.ts:33](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/load.ts#L33)

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

Defined in: [merge.ts:30](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/merge.ts#L30)

Combines an Array of Objects together and returns a new Object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `objects` | [`DataPoint`](#datapoint)[] | The Array of objects to be merged together. |
| `aggs` | `Record`\<`string`, `AggregationFunction`\> | An object containing specific aggregation methods (functions) for each key type. By default, numbers are summed and strings are returned as an array of unique values. |

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

Defined in: [nest.ts:33](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/nest.ts#L33)

Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`DataPoint`](#datapoint)[] | The flat data array to nest. |
| `fns` | `KeyAccessor`[] | An array of key accessor functions, one per nesting level. |

#### Returns

`NestEntry`[]

***

<a id="unique"></a>

### unique()

> **unique**\<`T`\>(`arr`: `T`[], `accessor?`: (`d`: `T`) => `unknown`): `T`[]

Defined in: [unique.ts:10](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/unique.ts#L10)

ES5 implementation to reduce an Array of values to unique instances.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arr` | `T`[] | The Array of objects to be filtered. |
| `accessor` | (`d`: `T`) => `unknown` | An optional accessor function used to extract data points from an Array of Objects. |

#### Returns

`T`[]

#### Examples

```ts
unique(["apple", "banana", "apple"]);
```

```ts
["apple", "banana"]
```

## Interfaces

<a id="datapoint"></a>

### DataPoint

Defined in: [DataPoint.ts:5](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/DataPoint.ts#L5)

DataPoint
Represents a single data point object used throughout d3plus visualizations.

#### Indexable

> \[`key`: `string`\]: `string` \| `number` \| `boolean` \| [`DataPoint`](#datapoint)

***

<a id="mergeddatapoint"></a>

### MergedDataPoint

Defined in: [merge.ts:9](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/data/src/merge.ts#L9)

#### Indexable

> \[`key`: `string`\]: `MergedValue`
