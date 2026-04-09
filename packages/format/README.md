# @d3plus/format

[![NPM version](https://img.shields.io/npm/v/@d3plus/format.svg)](https://www.npmjs.com/package/@d3plus/format)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=format)](https://codecov.io/gh/d3plus/d3plus/flags)

JavaScript formatters for localized numbers and dates.

## Installing

If using npm, `npm install @d3plus/format`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/format).

```js
import {*} from "@d3plus/format";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/format"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`format`](#format) |  |
| [`formatAbbreviate`](#formatabbreviate) | Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` t |
| [`formatDate`](#formatdate) | A default set of date formatters, which takes into account both the interval in between in each data point but also the  |
| [`formatDefaultLocale`](#formatdefaultlocale) | An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting t |

## Functions

<a id="format"></a>

### format()

> **format**(`specifier`: `string`): `Formatter`

Defined in: [format.ts:10](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/format/src/format.ts#L10)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `specifier` | `string` |

#### Returns

`Formatter`

***

<a id="formatabbreviate"></a>

### formatAbbreviate()

> **formatAbbreviate**(`n`: `string` \| `number`, `locale?`: `string` \| `FormatLocaleDefinition`, `precision?`: `string`): `string`

Defined in: [formatAbbreviate.ts:55](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/format/src/formatAbbreviate.ts#L55)

Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `n` | `string` \| `number` | *required* | The number to be formatted. |
| `locale` | `string` \| `FormatLocaleDefinition` | `"en-US"` | The locale config to be used. If an object is provided, the function will format the numbers according to the object. The object must include `suffixes`, `delimiter` and `currency` properties. |
| `precision?` | `string` | *required* | Number of significant digits to display. |

#### Returns

`string`

***

<a id="formatdate"></a>

### formatDate()

> **formatDate**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter`): `string`

Defined in: [formatDate.ts:12](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/format/src/formatDate.ts#L12)

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `d` | `Date` | *required* | The date to format. |
| `dataArray` | `Date`[] | *required* | The full array of ordered Date Objects. |
| `formatter` | `DateFormatter` | `timeFormat` | Optional custom format string or function. |

#### Returns

`string`

***

<a id="formatdefaultlocale"></a>

### formatDefaultLocale()

> **formatDefaultLocale**(`definition`: `FormatLocaleDefinition`): `Record`\<`string`, `unknown`\>

Defined in: [formatDefaultLocale.ts:8](https://github.com/d3plus/d3plus/blob/fe174c3153bf379a226e4a41b6a8492a86c3a1b7/packages/format/src/formatDefaultLocale.ts#L8)

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `definition` | `FormatLocaleDefinition` | The localization definition. |

#### Returns

`Record`\<`string`, `unknown`\>
