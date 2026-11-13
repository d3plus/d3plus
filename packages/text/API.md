# @d3plus/text API Reference

| Functions                                     | Description                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`fontFamilyStringify`](#fontfamilystringify) | Converts an Array of font-family names into a CSS font-family string.                                                                                                                                                                                                                                                                        |
| [`strip`](#strip)                             | Removes all non ASCII characters from a string.                                                                                                                                                                                                                                                                                              |
| [`textSplit`](#textsplit)                     | Splits a given sentence into an array of words.                                                                                                                                                                                                                                                                                              |
| [`textWrap`](#textwrap)                       | Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.                                                                                                                                                                                                                                  |
| [`titleCase`](#titlecase)                     | Capitalizes each significant word of a phrase, normalizing case in both directions: the locale's minor words (articles, short conjunctions/ prepositions) are forced lowercase in the middle and known acronyms are forced uppercase — so "SOUTH BY SOUTHWEST" becomes "South by Southwest" and "jack smith, ceo" becomes "Jack Smith, CEO". |

| Variables                   | Description                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`fontFamily`](#fontfamily) | The default fallback font list used for all text labels as an Array of Strings.                                                                      |
| [`softHyphen`](#softhyphen) | The soft hyphen (U+00AD): `textSplit` ends each syllable of a hyphenated word with it, and `textWrap` draws it as a hyphen only where a line breaks. |

| Interfaces                                | Description                                                   |
| ----------------------------------------- | ------------------------------------------------------------- |
| [`TextWrapGenerator`](#textwrapgenerator) |                                                               |
| [`TextWrapResult`](#textwrapresult)       |                                                               |
| [`TextWrapWord`](#textwrapword)           | One unit of a wrapped line that justified text spreads apart. |

| Type Aliases                            | Description                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`EllipsisFunction`](#ellipsisfunction) | Builds the text that ends a truncated line, given the line's text and its 1-based number. |

## Functions

<a id="fontfamilystringify"></a>

### fontFamilyStringify()

> **fontFamilyStringify**(`family`: `string` \| `string`[]): `string`

Defined in: [fontFamily.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.ts#L18)

Converts an Array of font-family names into a CSS font-family string.

#### Parameters

| Parameter | Type                   | Description                                       |
| --------- | ---------------------- | ------------------------------------------------- |
| `family`  | `string` \| `string`[] | A font family name or array of font family names. |

#### Returns

`string`

---

<a id="strip"></a>

### strip()

> **strip**(`value`: `string`, `spacer?`: `string`): `string`

Defined in: [strip.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/text/src/strip.ts#L20)

Removes all non ASCII characters from a string.

#### Parameters

| Parameter | Type     | Default    | Description                               |
| --------- | -------- | ---------- | ----------------------------------------- |
| `value`   | `string` | _required_ | The HTML string to strip.                 |
| `spacer?` | `string` | `"-"`      | The character to replace whitespace with. |

#### Returns

`string`

---

<a id="textsplit"></a>

### textSplit()

> **textSplit**(`sentence`: `string`): `string`[]

Defined in: [textSplit.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textSplit.ts#L48)

Splits a given sentence into an array of words.

#### Parameters

| Parameter  | Type     | Description                       |
| ---------- | -------- | --------------------------------- |
| `sentence` | `string` | The sentence to split into words. |

#### Returns

`string`[]

---

<a id="textwrap"></a>

### textWrap()

> **textWrap**(): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:551](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L551)

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.

#### Returns

[`TextWrapGenerator`](#textwrapgenerator)

---

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

| Parameter | Type                         | Default     | Description                                                                             |
| --------- | ---------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `str`     | `string` \| _required_       | `undefined` | The string to capitalize.                                                               |
| `locale?` | `string` \| `TitleCaseRules` | `"en-US"`   | A locale code (e.g. "en-US", "fr-FR") or an explicit rules object. Defaults to "en-US". |

#### Returns

`string`

## Variables

<a id="fontfamily-1"></a>

### fontFamily

> `const` **fontFamily**: `string`[]

Defined in: [fontFamily.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.ts#L5)

The default fallback font list used for all text labels as an Array of Strings.

#### Default Value

`["Inter", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]`

---

<a id="softhyphen"></a>

### softHyphen

> `const` **softHyphen**: `"­"` = "\\u00AD"

Defined in: [softHyphen.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/text/src/softHyphen.ts#L5)

The soft hyphen (U+00AD): `textSplit` ends each syllable of a hyphenated
word with it, and `textWrap` draws it as a hyphen only where a line breaks.

## Interfaces

<a id="textwrapgenerator"></a>

### TextWrapGenerator()

Defined in: [textWrap.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L61)

> **TextWrapGenerator**(`sentence`: `string`): [`TextWrapResult`](#textwrapresult)

Defined in: [textWrap.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L62)

#### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `sentence` | `string` |

#### Returns

[`TextWrapResult`](#textwrapresult)

#### Methods

<a id="ellipsis"></a>

##### ellipsis()

###### Call Signature

> **ellipsis**(): [`EllipsisFunction`](#ellipsisfunction) \| `null`

Defined in: [textWrap.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L63)

###### Returns

[`EllipsisFunction`](#ellipsisfunction) \| `null`

###### Call Signature

> **ellipsis**(`value`: `string` \| [`EllipsisFunction`](#ellipsisfunction) \| `null`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L64)

###### Parameters

| Parameter | Type                                                          |
| --------- | ------------------------------------------------------------- |
| `value`   | `string` \| [`EllipsisFunction`](#ellipsisfunction) \| `null` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="fontfamily"></a>

##### fontFamily()

###### Call Signature

> **fontFamily**(): `string`

Defined in: [textWrap.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L65)

###### Returns

`string`

###### Call Signature

> **fontFamily**(`value`: `string`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L66)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `string` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="fontsize"></a>

##### fontSize()

###### Call Signature

> **fontSize**(): `number`

Defined in: [textWrap.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L67)

###### Returns

`number`

###### Call Signature

> **fontSize**(`value`: `number`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L68)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `number` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="fontweight"></a>

##### fontWeight()

###### Call Signature

> **fontWeight**(): `string` \| `number`

Defined in: [textWrap.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L69)

###### Returns

`string` \| `number`

###### Call Signature

> **fontWeight**(`value`: `string` \| `number`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L70)

###### Parameters

| Parameter | Type                 |
| --------- | -------------------- |
| `value`   | `string` \| `number` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="height"></a>

##### height()

###### Call Signature

> **height**(): `number`

Defined in: [textWrap.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L71)

###### Returns

`number`

###### Call Signature

> **height**(`value`: `number`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L72)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `number` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="lineheight"></a>

##### lineHeight()

###### Call Signature

> **lineHeight**(): `number`

Defined in: [textWrap.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L73)

###### Returns

`number`

###### Call Signature

> **lineHeight**(`value`: `number` \| `undefined`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:74](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L74)

###### Parameters

| Parameter | Type                   |
| --------- | ---------------------- |
| `value`   | `number` \| _required_ |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="maxlines"></a>

##### maxLines()

###### Call Signature

> **maxLines**(): `number` \| `null`

Defined in: [textWrap.ts:75](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L75)

###### Returns

`number` \| `null`

###### Call Signature

> **maxLines**(`value`: `number` \| `null`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:76](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L76)

###### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `value`   | `number` \| `null` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="overflow"></a>

##### overflow()

###### Call Signature

> **overflow**(): `boolean`

Defined in: [textWrap.ts:77](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L77)

###### Returns

`boolean`

###### Call Signature

> **overflow**(`value`: `boolean`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L78)

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `boolean` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="shape"></a>

##### shape()

###### Call Signature

> **shape**(): `"square"` \| `"circle"`

Defined in: [textWrap.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L79)

###### Returns

`"square"` \| `"circle"`

###### Call Signature

> **shape**(`value`: `"square"` \| `"circle"`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:80](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L80)

###### Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `value`   | `"square"` \| `"circle"` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="split"></a>

##### split()

###### Call Signature

> **split**(): (`sentence`: `string`) => `string`[]

Defined in: [textWrap.ts:81](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L81)

###### Returns

(`sentence`: `string`) => `string`[]

###### Call Signature

> **split**(`value`: (`sentence`: `string`) => `string`[]): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:82](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L82)

###### Parameters

| Parameter | Type                                 |
| --------- | ------------------------------------ |
| `value`   | (`sentence`: `string`) => `string`[] |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="truncateword"></a>

##### truncateWord()

###### Call Signature

> **truncateWord**(): `boolean`

Defined in: [textWrap.ts:83](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L83)

###### Returns

`boolean`

###### Call Signature

> **truncateWord**(`value`: `boolean`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:84](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L84)

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `boolean` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

<a id="width"></a>

##### width()

###### Call Signature

> **width**(): `number`

Defined in: [textWrap.ts:85](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L85)

###### Returns

`number`

###### Call Signature

> **width**(`value`: `number`): [`TextWrapGenerator`](#textwrapgenerator)

Defined in: [textWrap.ts:86](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L86)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `number` |

###### Returns

[`TextWrapGenerator`](#textwrapgenerator)

---

<a id="textwrapresult"></a>

### TextWrapResult

Defined in: [textWrap.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L34)

#### Properties

| Property                                      | Type                                | Description                                                                                                                                                                                                                                               | Defined in                                                                                     |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| <a id="property-hardbreaks"></a> `hardBreaks` | `boolean`[]                         | Whether each line ended at a newline in the text, rather than where the width ran out.                                                                                                                                                                    | [textWrap.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L39) |
| <a id="property-lines"></a> `lines`           | `string`[]                          | The array of wrapped line strings.                                                                                                                                                                                                                        | [textWrap.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L41) |
| <a id="property-linewords"></a> `lineWords`   | [`TextWrapWord`](#textwrapword)[][] | Each line split into the units justified text spreads apart (a word with the spaces after it, or a single CJK character or emoji), with their widths. Measured when first read, and left out of the result's keys (so printing a result doesn't list it). | [textWrap.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L48) |
| <a id="property-nextword"></a> `nextWord`     | `number`                            | The index (in `words`) of the first word that did not fit, or `words.length` when all of them did.                                                                                                                                                        | [textWrap.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L50) |
| <a id="property-sentence"></a> `sentence`     | `string`                            | The original input sentence.                                                                                                                                                                                                                              | [textWrap.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L52) |
| <a id="property-truncated"></a> `truncated`   | `boolean`                           | Whether the text was truncated.                                                                                                                                                                                                                           | [textWrap.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L54) |
| <a id="property-widths"></a> `widths`         | `number`[]                          | The pixel widths of each line.                                                                                                                                                                                                                            | [textWrap.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L56) |
| <a id="property-words"></a> `words`           | `string`[]                          | The array of words from splitting.                                                                                                                                                                                                                        | [textWrap.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L58) |

---

<a id="textwrapword"></a>

### TextWrapWord

Defined in: [textWrap.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L27)

One unit of a wrapped line that justified text spreads apart.

#### Properties

| Property                            | Type     | Description                                                            | Defined in                                                                                     |
| ----------------------------------- | -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| <a id="property-text"></a> `text`   | `string` | The unit's text, with any spaces that follow it.                       | [textWrap.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L29) |
| <a id="property-width"></a> `width` | `number` | The unit's rendered width in pixels, not counting the spaces after it. | [textWrap.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L31) |

## Type Aliases

<a id="ellipsisfunction"></a>

### EllipsisFunction

> **EllipsisFunction** = (`text`: `string`, `line`: `number`) => `string`

Defined in: [textTruncate.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textTruncate.ts#L5)

Builds the text that ends a truncated line, given the line's text and its 1-based number.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `text`    | `string` |
| `line`    | `number` |

#### Returns

`string`
