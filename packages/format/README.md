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
| [`dateFormatter`](#dateformatter) | Returns a function that labels any date in `dataArray` exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time. |
| [`dateFullFormatter`](#datefullformatter) | Returns a function that labels any date exactly as [formatDateFull](#formatDateFull) would against `dataArray`, reading the interval its dates step by once up front. |
| [`format`](#format) |  |
| [`formatAbbreviate`](#formatabbreviate) | Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. |
| [`formatDate`](#formatdate) | A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points. |
| [`formatDateFull`](#formatdatefull) | Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day. |
| [`formatDefaultLocale`](#formatdefaultlocale) | An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters. |

## Functions

<a id="dateformatter"></a>

### dateFormatter()

> **dateFormatter**(`dataArray`: `Date`[], `formatter?`: `DateFormatter`): (`d`: `Date`, `shown?`: `Date`[]) => `string`

Defined in: [formatDate.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L40)

Returns a function that labels any date in `dataArray` exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time. Pass the returned function the date to format and, optionally, the dates `shown` alongside it (sorted once for each new array it is given).

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `dataArray` | `Date`[] | *required* | The full array of ordered Date Objects. |
| `formatter` | `DateFormatter` | `timeFormat` | Optional custom format string or function. |

#### Returns

(`d`: `Date`, `shown?`: `Date`[]) => `string`

***

<a id="datefullformatter"></a>

### dateFullFormatter()

> **dateFullFormatter**(`dataArray`: `Date`[], `formatter?`: `DateFormatter`): (`d`: `Date`) => `string`

Defined in: [formatDate.ts:196](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L196)

Returns a function that labels any date exactly as [formatDateFull](#formatDateFull) would against `dataArray`, reading the interval its dates step by once up front.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `dataArray` | `Date`[] | *required* | The full array of ordered Date Objects. |
| `formatter` | `DateFormatter` | `timeFormat` | Optional custom format string or function. |

#### Returns

(`d`: `Date`) => `string`

***

<a id="format"></a>

### format()

> **format**(`specifier`: `string`): `Formatter`

Defined in: [format.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/format/src/format.ts#L10)

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

Defined in: [formatAbbreviate.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatAbbreviate.ts#L55)

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

> **formatDate**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter`, `shown?`: `Date`[]): `string`

Defined in: [formatDate.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L16)

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.

Without `shown`, the year rides on the first and last dates and on each January 1st. Given `shown` (the dates actually drawn, such as the axis labels left after thinning), it rides on the first shown date and on the first shown date after each change of year instead, so the year stays readable however the labels are thinned; at hourly steps, the date rides with the hour on the first shown date of each day. A label carrying the year at hourly steps reads its date, year, and hour.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `d` | `Date` | *required* | The date to format. |
| `dataArray` | `Date`[] | *required* | The full array of ordered Date Objects. |
| `formatter` | `DateFormatter` | `timeFormat` | Optional custom format string or function. |
| `shown?` | `Date`[] | *required* | Optional dates drawn alongside `d`, which decide which labels carry the year (and, at hourly steps, the date). |

#### Returns

`string`

***

<a id="formatdatefull"></a>

### formatDateFull()

> **formatDateFull**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter`): `string`

Defined in: [formatDate.ts:183](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L183)

Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.

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

Defined in: [formatDefaultLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDefaultLocale.ts#L8)

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `definition` | `FormatLocaleDefinition` | The localization definition. |

#### Returns

`Record`\<`string`, `unknown`\>
