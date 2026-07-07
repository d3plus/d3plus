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
| [`colorContrast`](#colorcontrast) | Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on to |
| [`colorLegible`](#colorlegible) | Darkens a color so that it will appear legible on a white background. |
| [`colorLighter`](#colorlighter) | Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon. |
| [`colorRamp`](#colorramp) | Builds an `n`-step single-hue ramp from a pale tint to the given base color, |
| [`colorSubtract`](#colorsubtract) | Subtracts one color from another. |
| [`colorValidate`](#colorvalidate) | Validates a chart color palette against the computable accessibility checks. |

| Variables | Description |
| --- | --- |
| [`colorDefaults`](#colordefaults) | A set of default color values used when assigning colors based on data. |

| Interfaces | Description |
| --- | --- |
| [`ColorCheck`](#colorcheck) | One computed check in a palette validation report. |
| [`ColorDefaults`](#colordefaults) |  |
| [`ColorRampOptions`](#colorrampoptions) | Options for colorRamp. |
| [`ColorValidateOptions`](#colorvalidateoptions) | Options for colorValidate. |
| [`ColorValidation`](#colorvalidation) | The result of validating a palette. `ok` is true when no check hard-fails. |

| Type Aliases | Description |
| --- | --- |
| [`CheckState`](#checkstate) | The state of a single check. `warn` passes but obligates secondary encoding. |

## Functions

<a id="coloradd"></a>

### colorAdd()

> **colorAdd**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: [add.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/color/src/add.ts#L10)

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

Defined in: [assign.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/color/src/assign.ts#L9)

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

Defined in: [contrast.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/color/src/contrast.ts#L9)

Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on top of that provided color. The choice maximizes the WCAG 2.x contrast ratio against the background, so the more legible of the two text tokens always wins.

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

Defined in: [legible.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/color/src/legible.ts#L7)

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

Defined in: [lighter.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/color/src/lighter.ts#L8)

Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `c` | `string` | *required* | A valid CSS color string. |
| `i` | `number` | `0.5` | Strength of the lightening effect, from 0 to 1. |

#### Returns

`string`

***

<a id="colorramp"></a>

### colorRamp()

> **colorRamp**(`base`: `string`, `n`: `number`, `options?`: [`ColorRampOptions`](#colorrampoptions)): `string`[]

Defined in: [ramp.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/color/src/ramp.ts#L30)

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
| `options` | [`ColorRampOptions`](#colorrampoptions) | Ramp shaping options. |

#### Returns

`string`[]

***

<a id="colorsubtract"></a>

### colorSubtract()

> **colorSubtract**(`c1`: `string`, `c2`: `string`, `o1?`: `number`, `o2?`: `number`): `string`

Defined in: [subtract.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/color/src/subtract.ts#L10)

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

***

<a id="colorvalidate"></a>

### colorValidate()

> **colorValidate**(`palette`: `string`[], `options?`: [`ColorValidateOptions`](#colorvalidateoptions)): [`ColorValidation`](#colorvalidation)

Defined in: [validate.ts:256](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L256)

Validates a chart color palette against the computable accessibility checks.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `palette` | `string`[] | An array of CSS color strings, in slot order. |
| `options` | [`ColorValidateOptions`](#colorvalidateoptions) | Mode, surface, pair scope, and ordinal toggle. |

#### Returns

[`ColorValidation`](#colorvalidation)

## Variables

<a id="colordefaults-1"></a>

### colorDefaults

> `const` **colorDefaults**: [`ColorDefaults`](#colordefaults)

Defined in: [defaults.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L49)

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

## Interfaces

<a id="colorcheck"></a>

### ColorCheck

Defined in: [validate.ts:95](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L95)

One computed check in a palette validation report.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-detail"></a> `detail` | `string` | [validate.ts:98](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L98) |
| <a id="property-name"></a> `name` | `string` | [validate.ts:96](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L96) |
| <a id="property-state"></a> `state` | [`CheckState`](#checkstate) | [validate.ts:97](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L97) |

***

<a id="colordefaults"></a>

### ColorDefaults

Defined in: [defaults.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L6)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-dark"></a> `dark` | `string` | [defaults.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L7) |
| <a id="property-light"></a> `light` | `string` | [defaults.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L8) |
| <a id="property-missing"></a> `missing` | `string` | [defaults.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L9) |
| <a id="property-off"></a> `off` | `string` | [defaults.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L10) |
| <a id="property-on"></a> `on` | `string` | [defaults.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L11) |
| <a id="property-scale"></a> `scale` | `ScaleOrdinal`\<`string`, `string`\> | [defaults.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L12) |
| <a id="property-sequential"></a> `sequential` | `string` | [defaults.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.ts#L13) |

***

<a id="colorrampoptions"></a>

### ColorRampOptions

Defined in: [ramp.ts:4](https://github.com/d3plus/d3plus/blob/main/packages/color/src/ramp.ts#L4)

Options for [colorRamp](#colorramp).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ordinal"></a> `ordinal?` | `boolean` | Build an ordered/ordinal ramp rather than a continuous sequential one. Ordinal ramps hold the palest step darker (so it still reads against the surface) and keep more chroma across the range, since every step is a discrete mark a reader must tell apart. Continuous ramps let the light end fade nearly into the surface (it means "near zero"). | [ramp.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/color/src/ramp.ts#L12) |

***

<a id="colorvalidateoptions"></a>

### ColorValidateOptions

Defined in: [validate.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L108)

Options for [colorValidate](#colorvalidate).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode?` | `"light"` \| `"dark"` | Surface mode — sets the lightness band and default surface. | [validate.ts:110](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L110) |
| <a id="property-ordinal-1"></a> `ordinal?` | `boolean` | Validate as an ordered one-hue ramp instead of a categorical palette. | [validate.ts:116](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L116) |
| <a id="property-pairs"></a> `pairs?` | `"adjacent"` \| `"all"` | `adjacent` (bars/lines/stacks) or `all` (scatter/bubble/maps). | [validate.ts:114](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L114) |
| <a id="property-surface"></a> `surface?` | `string` | Chart surface color the marks are drawn on. | [validate.ts:112](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L112) |

***

<a id="colorvalidation"></a>

### ColorValidation

Defined in: [validate.ts:102](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L102)

The result of validating a palette. `ok` is true when no check hard-fails.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-checks"></a> `checks` | [`ColorCheck`](#colorcheck)[] | [validate.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L104) |
| <a id="property-ok"></a> `ok` | `boolean` | [validate.ts:103](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L103) |

## Type Aliases

<a id="checkstate"></a>

### CheckState

> **CheckState** = `"pass"` \| `"warn"` \| `"fail"`

Defined in: [validate.ts:92](https://github.com/d3plus/d3plus/blob/main/packages/color/src/validate.ts#L92)

The state of a single check. `warn` passes but obligates secondary encoding.
