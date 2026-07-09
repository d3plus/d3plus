# @d3plus/text

[![NPM version](https://img.shields.io/npm/v/@d3plus/text.svg)](https://www.npmjs.com/package/@d3plus/text)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=text)](https://codecov.io/gh/d3plus/d3plus/flags)

A smart SVG text box with line wrapping and automatic font size scaling.

## Installing

If using npm, `npm install @d3plus/text`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/text).

```js
import {*} from "@d3plus/text";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/text"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`fontFamilyStringify`](#fontfamilystringify) | Converts an Array of font-family names into a CSS font-family string. |
| [`strip`](#strip) | Removes all non ASCII characters from a string. |
| [`textSplit`](#textsplit) | Splits a given sentence into an array of words. |
| [`textWrap`](#textwrap) | Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text. |
| [`titleCase`](#titlecase) | Capitalizes each significant word of a phrase, normalizing case in both |

| Variables | Description |
| --- | --- |
| [`fontFamily`](#fontfamily) | The default fallback font list used for all text labels as an Array of Strings. |

## Functions

<a id="fontfamilystringify"></a>

### fontFamilyStringify()

> **fontFamilyStringify**(`family`: `string` \| `string`[]): `string`

Defined in: [fontFamily.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.ts#L18)

Converts an Array of font-family names into a CSS font-family string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `family` | `string` \| `string`[] | A font family name or array of font family names. |

#### Returns

`string`

***

<a id="strip"></a>

### strip()

> **strip**(`value`: `string`, `spacer?`: `string`): `string`

Defined in: [strip.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/text/src/strip.ts#L33)

Removes all non ASCII characters from a string.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `value` | `string` | *required* | The HTML string to strip. |
| `spacer` | `string` | `"-"` | The character to replace whitespace with. |

#### Returns

`string`

***

<a id="textsplit"></a>

### textSplit()

> **textSplit**(`sentence`: `string`): `string`[]

Defined in: [textSplit.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textSplit.ts#L43)

Splits a given sentence into an array of words.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sentence` | `string` | The sentence to split into words. |

#### Returns

`string`[]

***

<a id="textwrap"></a>

### textWrap()

> **textWrap**(): `TextWrapGenerator`

Defined in: [textWrap.ts:328](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L328)

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.

#### Returns

`TextWrapGenerator`

***

<a id="titlecase"></a>

### titleCase()

> **titleCase**(`str`: `string` \| `undefined`, `locale?`: `string` \| `TitleCaseRules`): `string`

Defined in: [titleCase.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/text/src/titleCase.ts#L68)

Capitalizes each significant word of a phrase, normalizing case in both
directions: the locale's minor words (articles, short conjunctions/
prepositions) are forced lowercase in the middle and known acronyms are
forced uppercase — so "SOUTH BY SOUTHWEST" becomes "South by Southwest" and
"jack smith, ceo" becomes "Jack Smith, CEO". The first and last words are
always capitalized. The locale supplies the minor-word and acronym lists
(e.g. "le"/"de"/"par" for French); pass an explicit rules object for full
control, including `{style: "sentence"}` to capitalize only the first word.

#### Parameters

| Parameter | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `str` | `string` \| *required* | `undefined` | The string to capitalize. |
| `locale` | `string` \| `TitleCaseRules` | `"en-US"` | A locale code (e.g. "en-US", "fr-FR") or an explicit rules object. Defaults to "en-US". |

#### Returns

`string`

## Variables

<a id="fontfamily"></a>

### fontFamily

> `const` **fontFamily**: `string`[]

Defined in: [fontFamily.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.ts#L5)

The default fallback font list used for all text labels as an Array of Strings.

#### Default Value

`["Inter", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]`
