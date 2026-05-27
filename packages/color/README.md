# @d3plus/color

[![NPM version](https://img.shields.io/npm/v/@d3plus/color.svg)](https://www.npmjs.com/package/@d3plus/color)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=color)](https://codecov.io/gh/d3plus/d3plus/flags)

Color functions that extent the ability of d3-color.

## Installing

If using npm, `npm install @d3plus/color`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/color).

```js
import {*} from "@d3plus/color";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/color"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`colorAdd`](#coloradd) | Adds two colors together. |
| [`colorAssign`](#colorassign) | Assigns a color to a value using a predefined set of defaults. |
| [`colorContrast`](#colorcontrast) | A set of default color values used when assigning colors based on data. |
| [`colorLegible`](#colorlegible) | Darkens a color so that it will appear legible on a white background. |
| [`colorLighter`](#colorlighter) | Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon. |
| [`colorSubtract`](#colorsubtract) | Subtracts one color from another. |

| Variables | Description |
| --- | --- |
| [`colorDefaults`](#colordefaults) | A set of default color values used when assigning colors based on data. |

| Interfaces | Description |
| --- | --- |
| [`ColorDefaults`](#colordefaults) |  |

## Functions

<a id="coloradd"></a>

### colorAdd()

> **colorAdd**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: [add.ts:10](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/add.ts#L10)

Adds two colors together.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `c1` | `string` | *required* | The first color, a valid CSS color string. |
| `c2` | `string` | *required* | The second color, also a valid CSS color string. |
| `o1` | `number` | `1` | Value from 0 to 1 of the first color's opacity. |
| `o2` | `number` | `1` | Value from 0 to 1 of the first color's opacity. |

#### Returns

`string`

***

<a id="colorassign"></a>

### colorAssign()

> **colorAssign**(`c`: `string` \| `boolean` \| `null` \| `undefined`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults)\>): `string`

Defined in: [assign.ts:9](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/assign.ts#L9)

Assigns a color to a value using a predefined set of defaults.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` \| `boolean` \| `null` \| *required* | A valid CSS color string. |
| `u` | `Partial`\<[`ColorDefaults`](#colordefaults)\> | An object containing overrides of the default colors. |

#### Returns

`string`

***

<a id="colorcontrast"></a>

### colorContrast()

> **colorContrast**(`c`: `string`, `u?`: `Partial`\<[`ColorDefaults`](#colordefaults)\>): `string`

Defined in: [contrast.ts:9](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/contrast.ts#L9)

A set of default color values used when assigning colors based on data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c` | `string` | A valid CSS color string. |
| `u` | `Partial`\<[`ColorDefaults`](#colordefaults)\> | An object containing overrides of the default colors. |

#### Returns

`string`

***

<a id="colorlegible"></a>

### colorLegible()

> **colorLegible**(`c`: `string`): `string`

Defined in: [legible.ts:7](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/legible.ts#L7)

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

Defined in: [lighter.ts:8](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/lighter.ts#L8)

Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `c` | `string` | *required* | A valid CSS color string. |
| `i` | `number` | `0.5` | Strength of the lightening effect, from 0 to 1. |

#### Returns

`string`

***

<a id="colorsubtract"></a>

### colorSubtract()

> **colorSubtract**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: [subtract.ts:10](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/subtract.ts#L10)

Subtracts one color from another.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `c1` | `string` | *required* | The base color, a valid CSS color string. |
| `c2` | `string` | *required* | The color to remove from the base color, also a valid CSS color string. |
| `o1` | `number` | `1` | Value from 0 to 1 of the first color's opacity. |
| `o2` | `number` | `1` | Value from 0 to 1 of the first color's opacity. |

#### Returns

`string`

## Variables

<a id="colordefaults-1"></a>

### colorDefaults

> `const` **colorDefaults**: [`ColorDefaults`](#colordefaults)

Defined in: [defaults.ts:37](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L37)

A set of default color values used when assigning colors based on data.

#### Default Value

```
{
  dark: "#495057",
  light: "#f8f9fa",
  missing: "#ced4da",
  off: "#c92a2a",
  on: "#2b8a3e",
  scale: d3.scaleOrdinal().range([
    "#364fc7", "#fab005", "#c92a2a",
    "#2b8a3e", "#fd7e14", "#862e9c",
    "#15aabf", "#e64980", "#82c91e",
    "#74c0fc", "#faa2c1", "#c0eb75",
    "#b197fc", "#c5f6fa", "#ffe8cc",
    "#d3f9d8", "#f3d9fa", "#ffe3e3"
  ])
}
```

## Interfaces

<a id="colordefaults"></a>

### ColorDefaults

Defined in: [defaults.ts:6](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L6)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-dark"></a> `dark` | `string` | [defaults.ts:7](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L7) |
| <a id="property-light"></a> `light` | `string` | [defaults.ts:8](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L8) |
| <a id="property-missing"></a> `missing` | `string` | [defaults.ts:9](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L9) |
| <a id="property-off"></a> `off` | `string` | [defaults.ts:10](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L10) |
| <a id="property-on"></a> `on` | `string` | [defaults.ts:11](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L11) |
| <a id="property-scale"></a> `scale` | `ScaleOrdinal`\<`string`, `string`\> | [defaults.ts:12](https://github.com/d3plus/d3plus/blob/8f2709e21b3d3a023dc9796ba539513696f413f7/packages/color/src/defaults.ts#L12) |
