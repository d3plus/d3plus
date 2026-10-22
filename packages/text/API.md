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
| `spacer`  | `string` | `"-"`      | The character to replace whitespace with. |

#### Returns

`string`

---

<a id="textsplit"></a>

### textSplit()

> **textSplit**(`sentence`: `string`): `string`[]

Defined in: [textSplit.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textSplit.ts#L44)

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

> **textWrap**(): `TextWrapGenerator`

Defined in: [textWrap.ts:362](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.ts#L362)

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.

#### Returns

`TextWrapGenerator`

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
| `locale`  | `string` \| `TitleCaseRules` | `"en-US"`   | A locale code (e.g. "en-US", "fr-FR") or an explicit rules object. Defaults to "en-US". |

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

---

<a id="softhyphen"></a>

### softHyphen

> `const` **softHyphen**: `"­"` = "\u00AD"

Defined in: [softHyphen.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/text/src/softHyphen.ts#L5)

The soft hyphen (U+00AD): `textSplit` ends each syllable of a hyphenated
word with it, and `textWrap` draws it as a hyphen only where a line breaks.
