# @d3plus/locales API Reference

| Functions                         | Description                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`findLocale`](#findlocale)       | Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US").                                       |
| [`findWeekStart`](#findweekstart) | Returns the first day of the week (0 = Sunday … 6 = Saturday) in a locale's region, per CLDR: `"en-US"` → 0, `"de-DE"` → 1, `"ar-EG"` → 6. |

| Variables                             | Description                                                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`formatLocale`](#formatlocale)       |                                                                                                                                                                                        |
| [`locale`](#locale)                   | d3-time-format locale definitions (date and time patterns, period, day, and month names) keyed by locale code, used when formatting dates on axes, timelines, and tooltips.            |
| [`titleCaseLocale`](#titlecaselocale) | Per-language rules used by `titleCase`, keyed by two-letter language code plus a `default` fallback: the minor words kept lowercase mid-title and the acronyms forced uppercase.       |
| [`translateLocale`](#translatelocale) | Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as `en-US` or `es-ES`. |

| Interfaces                                          | Description                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`FormatLocaleDefinition`](#formatlocaledefinition) | formatLocale A set of default locale formatters used when assigning suffixes and currency in numbers. |
| [`TimeLocaleDefinition`](#timelocaledefinition)     |                                                                                                       |
| [`TitleCaseRules`](#titlecaserules)                 |                                                                                                       |
| [`TranslationStrings`](#translationstrings)         |                                                                                                       |

## Functions

<a id="findlocale"></a>

### findLocale()

> **findLocale**(`locale`: `string`): `string`

Defined in: [findLocale.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/findLocale.ts#L7)

Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US").

#### Parameters

| Parameter | Type     | Description                                  |
| --------- | -------- | -------------------------------------------- |
| `locale`  | `string` | A 2-letter language code (e.g., "en", "fr"). |

#### Returns

`string`

---

<a id="findweekstart"></a>

### findWeekStart()

> **findWeekStart**(`locale`: `string`): `number`

Defined in: [findWeekStart.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/findWeekStart.ts#L31)

Returns the first day of the week (0 = Sunday … 6 = Saturday) in a locale's region, per CLDR: `"en-US"` → 0, `"de-DE"` → 1, `"ar-EG"` → 6. Accepts the same forms as the rest of d3plus: `"en-US"`, `"en_US"`, script tags like `"sr-Latn-RS"`, and 2-letter language codes, which resolve to their default region through `findLocale` (`"en"` → `"en-US"` → 0, `"ar"` → `"ar-SA"` → 0). A locale whose region can't be found, or anything that isn't a string, starts on Monday (1).

The region table is static on purpose: `Intl.Locale` week info differs across Node 22, Node 24, and browsers, so reading it at runtime would make server-side and browser renders of the same chart disagree.

#### Parameters

| Parameter | Type     | Description                                                                      |
| --------- | -------- | -------------------------------------------------------------------------------- |
| `locale`  | `string` | A locale code (e.g., "en-US", "de_DE") or a 2-letter language code (e.g., "en"). |

#### Returns

`number`

## Variables

<a id="formatlocale"></a>

### formatLocale

> `const` **formatLocale**: `Record`\<`string`, [`FormatLocaleDefinition`](#formatlocaledefinition)\>

Defined in: [dictionaries/formatLocale.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L17)

---

<a id="locale"></a>

### locale

> `const` **locale**: `Record`\<`string`, [`TimeLocaleDefinition`](#timelocaledefinition)\>

Defined in: [dictionaries/timeLocale.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L42)

d3-time-format locale definitions (date and time patterns, period, day, and month names) keyed by locale code, used when formatting dates on axes, timelines, and tooltips.

---

<a id="titlecaselocale"></a>

### titleCaseLocale

> `const` **titleCaseLocale**: `Record`\<`string`, [`TitleCaseRules`](#titlecaserules)\>

Defined in: [dictionaries/titleCaseLocale.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/titleCaseLocale.ts#L55)

Per-language rules used by `titleCase`, keyed by two-letter language code plus a `default` fallback: the minor words kept lowercase mid-title and the acronyms forced uppercase.

---

<a id="translatelocale"></a>

### translateLocale

> `const` **translateLocale**: `Record`\<`string`, [`TranslationStrings`](#translationstrings)\>

Defined in: [dictionaries/translateLocale.ts:79](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L79)

Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as `en-US` or `es-ES`. Each entry maps the English string to its translation.

## Interfaces

<a id="formatlocaledefinition"></a>

### FormatLocaleDefinition

Defined in: [dictionaries/formatLocale.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L6)

**`Namespace`**

formatLocale
A set of default locale formatters used when assigning suffixes and currency in numbers.

#### Properties

| Property                                      | Type                   | Defined in                                                                                                                          |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-currency"></a> `currency`     | \[`string`, `string`\] | [dictionaries/formatLocale.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L14) |
| <a id="property-delimiters"></a> `delimiters` | `object`               | [dictionaries/formatLocale.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L10) |
| `delimiters.decimal`                          | `string`               | [dictionaries/formatLocale.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L12) |
| `delimiters.thousands`                        | `string`               | [dictionaries/formatLocale.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L11) |
| <a id="property-grouping"></a> `grouping`     | `number`[]             | [dictionaries/formatLocale.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L9)   |
| <a id="property-separator"></a> `separator?`  | `string`               | [dictionaries/formatLocale.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L7)   |
| <a id="property-suffixes"></a> `suffixes`     | `string`[]             | [dictionaries/formatLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.ts#L8)   |

---

<a id="timelocaledefinition"></a>

### TimeLocaleDefinition

Defined in: [dictionaries/timeLocale.ts:1](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L1)

#### Properties

| Property                                        | Type                                                                                                                       | Defined in                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-date"></a> `date`               | `string`                                                                                                                   | [dictionaries/timeLocale.ts:3](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L3)   |
| <a id="property-datetime"></a> `dateTime`       | `string`                                                                                                                   | [dictionaries/timeLocale.ts:2](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L2)   |
| <a id="property-days"></a> `days`               | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\]                                                   | [dictionaries/timeLocale.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L7)   |
| <a id="property-months"></a> `months`           | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L9)   |
| <a id="property-periods"></a> `periods`         | \[`string`, `string`\]                                                                                                     | [dictionaries/timeLocale.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L6)   |
| <a id="property-quarter"></a> `quarter`         | `string`                                                                                                                   | [dictionaries/timeLocale.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L5)   |
| <a id="property-shortdays"></a> `shortDays`     | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`\]                                                   | [dictionaries/timeLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L8)   |
| <a id="property-shortmonths"></a> `shortMonths` | \[`string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`, `string`\] | [dictionaries/timeLocale.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L23) |
| <a id="property-time"></a> `time`               | `string`                                                                                                                   | [dictionaries/timeLocale.ts:4](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/timeLocale.ts#L4)   |

---

<a id="titlecaserules"></a>

### TitleCaseRules

Defined in: [dictionaries/titleCaseLocale.ts:1](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/titleCaseLocale.ts#L1)

#### Properties

| Property                                     | Type                      | Description                                                                                                                                                                                                                                                                                                                                     | Defined in                                                                                                                                |
| -------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-acronyms"></a> `acronyms?`   | `string`[]                | Acronyms / initialisms emitted in the given canonical casing (matched case-insensitively, so "ceo" and "CEO" both become "CEO"). Mixed-case forms ("iOS", "GmbH", "PhD") are preserved as written. Plurals ("TVs") are derived automatically — so forms whose plural collides with a real word (e.g. "IDE" → "ides") are intentionally omitted. | [dictionaries/titleCaseLocale.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/titleCaseLocale.ts#L23) |
| <a id="property-lowercase"></a> `lowercase?` | `string`[]                | Short function words (articles, conjunctions, prepositions, contractions) kept lowercase in the MIDDLE of a title. Matched case-insensitively and against the punctuation-stripped token, so "v" also covers "v." and "vs" covers "vs.".                                                                                                        | [dictionaries/titleCaseLocale.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/titleCaseLocale.ts#L15) |
| <a id="property-style"></a> `style`          | `"title"` \| `"sentence"` | "title" capitalizes each significant word, lowercasing the minor words in the middle (the English convention). "sentence" capitalizes only the first word. Acronyms are forced uppercase under both styles; the `lowercase` list is consulted only for "title".                                                                                 | [dictionaries/titleCaseLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/titleCaseLocale.ts#L8)   |

---

<a id="translationstrings"></a>

### TranslationStrings

Defined in: [dictionaries/translateLocale.ts:1](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L1)

#### Properties

| Property                                                                                | Type     | Defined in                                                                                                                                |
| --------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-of-first-stage"></a> `% of First Stage`                                 | `string` | [dictionaries/translateLocale.ts:2](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L2)   |
| <a id="property-of-previous-stage"></a> `% of Previous Stage`                           | `string` | [dictionaries/translateLocale.ts:3](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L3)   |
| <a id="property-and"></a> `and`                                                         | `string` | [dictionaries/translateLocale.ts:4](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L4)   |
| <a id="property-back"></a> `Back`                                                       | `string` | [dictionaries/translateLocale.ts:5](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L5)   |
| <a id="property-band"></a> `Band`                                                       | `string` | [dictionaries/translateLocale.ts:6](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L6)   |
| <a id="property-bar-total"></a> `Bar Total`                                             | `string` | [dictionaries/translateLocale.ts:7](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L7)   |
| <a id="property-brush-zoom"></a> `Brush Zoom`                                           | `string` | [dictionaries/translateLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L8)   |
| <a id="property-change"></a> `Change`                                                   | `string` | [dictionaries/translateLocale.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L9)   |
| <a id="property-clear"></a> `Clear`                                                     | `string` | [dictionaries/translateLocale.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L10) |
| <a id="property-click-to-expand"></a> `Click to Expand`                                 | `string` | [dictionaries/translateLocale.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L11) |
| <a id="property-click-to-hide"></a> `Click to Hide`                                     | `string` | [dictionaries/translateLocale.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L12) |
| <a id="property-click-to-highlight"></a> `Click to Highlight`                           | `string` | [dictionaries/translateLocale.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L13) |
| <a id="property-click-to-show"></a> `Click to Show`                                     | `string` | [dictionaries/translateLocale.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L14) |
| <a id="property-click-to-show-all"></a> `Click to Show All`                             | `string` | [dictionaries/translateLocale.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L15) |
| <a id="property-click-to-zoom-out"></a> `Click to Zoom Out`                             | `string` | [dictionaries/translateLocale.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L16) |
| <a id="property-close"></a> `Close`                                                     | `string` | [dictionaries/translateLocale.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L17) |
| <a id="property-comparison"></a> `Comparison`                                           | `string` | [dictionaries/translateLocale.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L18) |
| <a id="property-count"></a> `Count`                                                     | `string` | [dictionaries/translateLocale.ts:19](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L19) |
| <a id="property-decrease"></a> `Decrease`                                               | `string` | [dictionaries/translateLocale.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L20) |
| <a id="property-density"></a> `Density`                                                 | `string` | [dictionaries/translateLocale.ts:21](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L21) |
| <a id="property-double-click-or-escape-to-clear"></a> `Double-click or Escape to Clear` | `string` | [dictionaries/translateLocale.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L22) |
| <a id="property-download"></a> `Download`                                               | `string` | [dictionaries/translateLocale.ts:23](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L23) |
| <a id="property-drag-to-filter"></a> `Drag to Filter`                                   | `string` | [dictionaries/translateLocale.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L24) |
| <a id="property-equation"></a> `Equation`                                               | `string` | [dictionaries/translateLocale.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L25) |
| <a id="property-exponential"></a> `Exponential`                                         | `string` | [dictionaries/translateLocale.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L26) |
| <a id="property-forecast"></a> `Forecast`                                               | `string` | [dictionaries/translateLocale.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L27) |
| <a id="property-high"></a> `High`                                                       | `string` | [dictionaries/translateLocale.ts:28](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L28) |
| <a id="property-increase"></a> `Increase`                                               | `string` | [dictionaries/translateLocale.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L29) |
| <a id="property-linear"></a> `Linear`                                                   | `string` | [dictionaries/translateLocale.ts:30](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L30) |
| <a id="property-loading-visualization"></a> `Loading Visualization`                     | `string` | [dictionaries/translateLocale.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L31) |
| <a id="property-logarithmic"></a> `Logarithmic`                                         | `string` | [dictionaries/translateLocale.ts:32](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L32) |
| <a id="property-low"></a> `Low`                                                         | `string` | [dictionaries/translateLocale.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L33) |
| <a id="property-lower-bound"></a> `Lower Bound`                                         | `string` | [dictionaries/translateLocale.ts:34](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L34) |
| <a id="property-lower-quartile"></a> `Lower Quartile`                                   | `string` | [dictionaries/translateLocale.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L35) |
| <a id="property-match"></a> `Match`                                                     | `string` | [dictionaries/translateLocale.ts:36](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L36) |
| <a id="property-matches"></a> `Matches`                                                 | `string` | [dictionaries/translateLocale.ts:37](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L37) |
| <a id="property-maximum"></a> `Maximum`                                                 | `string` | [dictionaries/translateLocale.ts:38](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L38) |
| <a id="property-median"></a> `Median`                                                   | `string` | [dictionaries/translateLocale.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L39) |
| <a id="property-minimum"></a> `Minimum`                                                 | `string` | [dictionaries/translateLocale.ts:40](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L40) |
| <a id="property-more"></a> `more`                                                       | `string` | [dictionaries/translateLocale.ts:41](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L41) |
| <a id="property-no-data"></a> `No Data`                                                 | `string` | [dictionaries/translateLocale.ts:42](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L42) |
| <a id="property-no-data-available"></a> `No Data Available`                             | `string` | [dictionaries/translateLocale.ts:43](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L43) |
| <a id="property-no-matches"></a> `No Matches`                                           | `string` | [dictionaries/translateLocale.ts:44](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L44) |
| <a id="property-observations"></a> `Observations`                                       | `string` | [dictionaries/translateLocale.ts:45](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L45) |
| <a id="property-of-first"></a> `of first`                                               | `string` | [dictionaries/translateLocale.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L46) |
| <a id="property-of-previous"></a> `of previous`                                         | `string` | [dictionaries/translateLocale.ts:47](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L47) |
| <a id="property-open"></a> `Open`                                                       | `string` | [dictionaries/translateLocale.ts:48](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L48) |
| <a id="property-percent-of-total"></a> `Percent of Total`                               | `string` | [dictionaries/translateLocale.ts:49](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L49) |
| <a id="property-polynomial"></a> `Polynomial`                                           | `string` | [dictionaries/translateLocale.ts:50](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L50) |
| <a id="property-power"></a> `Power`                                                     | `string` | [dictionaries/translateLocale.ts:51](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L51) |
| <a id="property-powered-by-d3plus"></a> `Powered by D3plus`                             | `string` | [dictionaries/translateLocale.ts:52](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L52) |
| <a id="property-projected"></a> `Projected`                                             | `string` | [dictionaries/translateLocale.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L53) |
| <a id="property-range"></a> `Range`                                                     | `string` | [dictionaries/translateLocale.ts:54](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L54) |
| <a id="property-relative-frequency"></a> `Relative Frequency`                           | `string` | [dictionaries/translateLocale.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L55) |
| <a id="property-reset-zoom"></a> `Reset Zoom`                                           | `string` | [dictionaries/translateLocale.ts:56](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L56) |
| <a id="property-running-total"></a> `Running Total`                                     | `string` | [dictionaries/translateLocale.ts:57](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L57) |
| <a id="property-search"></a> `Search`                                                   | `string` | [dictionaries/translateLocale.ts:58](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L58) |
| <a id="property-share"></a> `Share`                                                     | `string` | [dictionaries/translateLocale.ts:59](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L59) |
| <a id="property-share-of-parent"></a> `Share of Parent`                                 | `string` | [dictionaries/translateLocale.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L60) |
| <a id="property-shiftclick-to-hide"></a> `Shift+Click to Hide`                          | `string` | [dictionaries/translateLocale.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L61) |
| <a id="property-shiftclick-to-highlight"></a> `Shift+Click to Highlight`                | `string` | [dictionaries/translateLocale.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L62) |
| <a id="property-target"></a> `Target`                                                   | `string` | [dictionaries/translateLocale.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L63) |
| <a id="property-total"></a> `Total`                                                     | `string` | [dictionaries/translateLocale.ts:64](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L64) |
| <a id="property-trend-line"></a> `Trend Line`                                           | `string` | [dictionaries/translateLocale.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L65) |
| <a id="property-upper-bound"></a> `Upper Bound`                                         | `string` | [dictionaries/translateLocale.ts:66](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L66) |
| <a id="property-upper-quartile"></a> `Upper Quartile`                                   | `string` | [dictionaries/translateLocale.ts:67](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L67) |
| <a id="property-value"></a> `Value`                                                     | `string` | [dictionaries/translateLocale.ts:68](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L68) |
| <a id="property-values"></a> `Values`                                                   | `string` | [dictionaries/translateLocale.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L69) |
| <a id="property-volume"></a> `Volume`                                                   | `string` | [dictionaries/translateLocale.ts:70](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L70) |
| <a id="property-width"></a> `Width`                                                     | `string` | [dictionaries/translateLocale.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L71) |
| <a id="property-zoom-in"></a> `Zoom In`                                                 | `string` | [dictionaries/translateLocale.ts:72](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L72) |
| <a id="property-zoom-out"></a> `Zoom Out`                                               | `string` | [dictionaries/translateLocale.ts:73](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/translateLocale.ts#L73) |
