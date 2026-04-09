# @d3plus/locales

[![NPM version](https://img.shields.io/npm/v/@d3plus/locales.svg)](https://www.npmjs.com/package/@d3plus/locales)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=locales)](https://codecov.io/gh/d3plus/d3plus/flags)

International localizations for number, date, and UI labels.

## Installing

If using npm, `npm install @d3plus/locales`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/locales).

```js
import {*} from "@d3plus/locales";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/locales"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`findLocale`](#findlocale) | Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US"). |

| Variables | Description |
| --- | --- |
| [`formatLocale`](#formatlocale) |  |
| [`locale`](#locale) |  |
| [`translateLocale`](#translatelocale) |  |

| Interfaces | Description |
| --- | --- |
| [`FormatLocaleDefinition`](#formatlocaledefinition) | formatLocale |
| [`TimeLocaleDefinition`](#timelocaledefinition) |  |
| [`TranslationStrings`](#translationstrings) |  |

## Functions

<a id="findlocale"></a>

### findLocale()

> **findLocale**(`locale`: `string`): `string`

Defined in: [findLocale.ts:49](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/findLocale.ts#L49)

Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US").

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `locale` | `string` | A 2-letter language code (e.g., "en", "fr"). |

#### Returns

`string`

## Variables

<a id="formatlocale"></a>

### formatLocale

> `const` **formatLocale**: `Record`\<`string`, [`FormatLocaleDefinition`](#formatlocaledefinition)\>

Defined in: [dictionaries/formatLocale.ts:17](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L17)

***

<a id="locale"></a>

### locale

> `const` **locale**: `Record`\<`string`, [`TimeLocaleDefinition`](#timelocaledefinition)\>

Defined in: [dictionaries/timeLocale.ts:39](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L39)

***

<a id="translatelocale"></a>

### translateLocale

> `const` **translateLocale**: `Record`\<`string`, [`TranslationStrings`](#translationstrings)\>

Defined in: [dictionaries/translateLocale.ts:21](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L21)

## Interfaces

<a id="formatlocaledefinition"></a>

### FormatLocaleDefinition

Defined in: [dictionaries/formatLocale.ts:6](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L6)

**`Namespace`**

formatLocale
A set of default locale formatters used when assigning suffixes and currency in numbers.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-currency"></a> `currency` | \[`string`, `string`\] | [dictionaries/formatLocale.ts:14](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L14) |
| <a id="property-delimiters"></a> `delimiters` | `object` | [dictionaries/formatLocale.ts:10](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L10) |
| `delimiters.decimal` | `string` | [dictionaries/formatLocale.ts:12](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L12) |
| `delimiters.thousands` | `string` | [dictionaries/formatLocale.ts:11](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L11) |
| <a id="property-grouping"></a> `grouping` | `number`[] | [dictionaries/formatLocale.ts:9](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L9) |
| <a id="property-separator"></a> `separator?` | `string` | [dictionaries/formatLocale.ts:7](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L7) |
| <a id="property-suffixes"></a> `suffixes` | `string`[] | [dictionaries/formatLocale.ts:8](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/formatLocale.ts#L8) |

***

<a id="timelocaledefinition"></a>

### TimeLocaleDefinition

Defined in: [dictionaries/timeLocale.ts:1](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L1)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-date"></a> `date` | `string` | [dictionaries/timeLocale.ts:3](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L3) |
| <a id="property-datetime"></a> `dateTime` | `string` | [dictionaries/timeLocale.ts:2](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L2) |
| <a id="property-days"></a> `days` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:7](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L7) |
| <a id="property-months"></a> `months` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:9](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L9) |
| <a id="property-periods"></a> `periods` | \[`string`, `string`\] | [dictionaries/timeLocale.ts:6](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L6) |
| <a id="property-quarter"></a> `quarter` | `string` | [dictionaries/timeLocale.ts:5](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L5) |
| <a id="property-shortdays"></a> `shortDays` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:8](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L8) |
| <a id="property-shortmonths"></a> `shortMonths` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:23](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L23) |
| <a id="property-time"></a> `time` | `string` | [dictionaries/timeLocale.ts:4](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/timeLocale.ts#L4) |

***

<a id="translationstrings"></a>

### TranslationStrings

Defined in: [dictionaries/translateLocale.ts:1](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L1)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-and"></a> `and` | `string` | [dictionaries/translateLocale.ts:2](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L2) |
| <a id="property-back"></a> `Back` | `string` | [dictionaries/translateLocale.ts:3](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L3) |
| <a id="property-click-to-expand"></a> `Click to Expand` | `string` | [dictionaries/translateLocale.ts:4](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L4) |
| <a id="property-click-to-hide"></a> `Click to Hide` | `string` | [dictionaries/translateLocale.ts:5](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L5) |
| <a id="property-click-to-highlight"></a> `Click to Highlight` | `string` | [dictionaries/translateLocale.ts:6](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L6) |
| <a id="property-click-to-show"></a> `Click to Show` | `string` | [dictionaries/translateLocale.ts:7](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L7) |
| <a id="property-click-to-show-all"></a> `Click to Show All` | `string` | [dictionaries/translateLocale.ts:8](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L8) |
| <a id="property-download"></a> `Download` | `string` | [dictionaries/translateLocale.ts:9](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L9) |
| <a id="property-loading-visualization"></a> `Loading Visualization` | `string` | [dictionaries/translateLocale.ts:10](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L10) |
| <a id="property-more"></a> `more` | `string` | [dictionaries/translateLocale.ts:11](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L11) |
| <a id="property-no-data-available"></a> `No Data Available` | `string` | [dictionaries/translateLocale.ts:12](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L12) |
| <a id="property-powered-by-d3plus"></a> `Powered by D3plus` | `string` | [dictionaries/translateLocale.ts:13](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L13) |
| <a id="property-share"></a> `Share` | `string` | [dictionaries/translateLocale.ts:14](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L14) |
| <a id="property-shiftclick-to-hide"></a> `Shift+Click to Hide` | `string` | [dictionaries/translateLocale.ts:15](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L15) |
| <a id="property-shiftclick-to-highlight"></a> `Shift+Click to Highlight` | `string` | [dictionaries/translateLocale.ts:16](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L16) |
| <a id="property-total"></a> `Total` | `string` | [dictionaries/translateLocale.ts:17](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L17) |
| <a id="property-values"></a> `Values` | `string` | [dictionaries/translateLocale.ts:18](https://github.com/d3plus/d3plus/blob/0405c9f5ac264236505d00e38073b163abf830e5/packages/locales/src/dictionaries/translateLocale.ts#L18) |
