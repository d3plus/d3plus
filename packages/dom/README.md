# @d3plus/dom

[![NPM version](https://img.shields.io/npm/v/@d3plus/dom.svg)](https://www.npmjs.com/package/@d3plus/dom)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=dom)](https://codecov.io/gh/d3plus/d3plus/flags)

JavaScript functions for manipulating and analyzing DOM elements.

## Installing

If using npm, `npm install @d3plus/dom`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/dom).

```js
import {*} from "@d3plus/dom";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/dom"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`assign`](#assign) | A deeply recursive version of `Object.assign`. |
| [`attrize`](#attrize) | Applies each key/value in an object as an attr. |
| [`backgroundColor`](#backgroundcolor) | Given a DOM element, returns its background color by walking up the |
| [`date`](#date) | Parses numbers and strings into valid JavaScript Date objects, supporting years, quarters, months, and ISO 8601 formats. |
| [`elem`](#elem) | Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optiona |
| [`fontExists`](#fontexists) | Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false |
| [`inViewport`](#inviewport) | Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer. |
| [`isObject`](#isobject) | Detects if a variable is a javascript Object. |
| [`parseSides`](#parsesides) | Converts a string of directional CSS shorthand values into an object with the values expanded. |
| [`rtl`](#rtl) | Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "r |
| [`stylize`](#stylize) | Applies each key/value in an object as a style. |
| [`textWidth`](#textwidth) | Given a text string, returns the predicted pixel width of the string when placed into DOM. |

| Type Aliases | Description |
| --- | --- |
| [`D3Selection`](#d3selection) |  |

## Functions

<a id="assign"></a>

### assign()

> **assign**(...`objects`: `Record`\<`string`, `unknown`\>[]): `Record`\<`string`, `unknown`\>

Defined in: [assign.ts:21](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/assign.ts#L21)

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

Defined in: [attrize.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/attrize.ts#L8)

Applies each key/value in an object as an attr.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | `Attrable` | The d3 selection to apply attributes to. |
| `a` | `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\> | An object of key/value attr pairs. |

#### Returns

`void`

***

<a id="backgroundcolor"></a>

### backgroundColor()

> **backgroundColor**(`elem`: `Element`): `string`

Defined in: [backgroundColor.ts:7](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/backgroundColor.ts#L7)

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

<a id="date"></a>

### date()

> **date**(`d`: `string` \| `number` \| `false` \| `undefined`): `false` \| `Date` \| `undefined`

Defined in: [date.ts:5](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/date.ts#L5)

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

Defined in: [elem.ts:28](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/elem.ts#L28)

Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optional transitions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `selector` | `string` | A CSS selector string for the element tag and classes. |
| `p?` | `ElemParams` | Configuration object with enter, exit, update, and parent options. |

#### Returns

`Selection`

***

<a id="fontexists"></a>

### fontExists()

> **fontExists**(`font`: `string` \| `string`[]): `string` \| `false`

Defined in: [fontExists.ts:13](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/fontExists.ts#L13)

Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `font` | `string` \| `string`[] | Can be either a valid CSS font-family string (single or comma-separated names) or an Array of string names. |

#### Returns

`string` \| `false`

***

<a id="inviewport"></a>

### inViewport()

> **inViewport**(`elem`: `Element`, `buffer?`: `number`): `boolean`

Defined in: [inViewport.ts:6](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/inViewport.ts#L6)

Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `elem` | `Element` | *required* | The DOM element to check. |
| `buffer` | `number` | `0` | Extra pixel margin around the viewport boundary. |

#### Returns

`boolean`

***

<a id="isobject"></a>

### isObject()

> **isObject**(`item`: `unknown`): `boolean`

Defined in: [isObject.ts:5](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/isObject.ts#L5)

Detects if a variable is a javascript Object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `unknown` | The value to test. |

#### Returns

`boolean`

***

<a id="parsesides"></a>

### parseSides()

> **parseSides**(`sides`: `string` \| `number`): `ParsedSides`

Defined in: [parseSides.ts:12](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/parseSides.ts#L12)

Converts a string of directional CSS shorthand values into an object with the values expanded.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sides` | `string` \| `number` | The CSS shorthand string to expand. |

#### Returns

`ParsedSides`

***

<a id="rtl"></a>

### rtl()

> **rtl**(): `boolean`

Defined in: [rtl.ts:4](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/rtl.ts#L4)

Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".

#### Returns

`boolean`

***

<a id="stylize"></a>

### stylize()

> **stylize**(`e`: `Stylable`, `s?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>): `void`

Defined in: [stylize.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/stylize.ts#L8)

Applies each key/value in an object as a style.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | `Stylable` | The d3 selection to apply styles to. |
| `s` | `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\> | An object of key/value style pairs. |

#### Returns

`void`

***

<a id="textwidth"></a>

### textWidth()

#### Call Signature

> **textWidth**(`text`: `string`, `style?`: `Record`\<`string`, `string` \| `number`\>): `number`

Defined in: [textWidth.ts:49](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/textWidth.ts#L49)

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

Defined in: [textWidth.ts:53](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/textWidth.ts#L53)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string`[] |
| `style?` | `Record`\<`string`, `string` \| `number`\> |

##### Returns

`number`[]

## Type Aliases

<a id="d3selection"></a>

### D3Selection

> **D3Selection** = `ReturnType`\<*typeof* `select`\>

Defined in: [D3Selection.ts:12](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/dom/src/D3Selection.ts#L12)
