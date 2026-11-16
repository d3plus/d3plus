# @d3plus/format API Reference

| Functions                                     | Description                                                                                                                                                                                                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`dateFormatter`](#dateformatter)             | Returns a function that labels any date in `dataArray` exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time.                                                    |
| [`dateFullFormatter`](#datefullformatter)     | Returns a function that labels any date exactly as [formatDateFull](#formatDateFull) would against `dataArray`, reading the interval its dates step by once up front.                                                                                           |
| [`dateInterval`](#dateinterval)               | The calendar interval a set of dates steps by, which [formatDate](#formatDate) labels them at: the coarsest of "year", "quarter", "month", "day", or "hour" that every step between consecutive dates is a whole multiple of, else `undefined` for finer steps. |
| [`format`](#format)                           | An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.                                                                                                                 |
| [`formatAbbreviate`](#formatabbreviate)       | Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie.                                                                                                                                                    |
| [`formatDate`](#formatdate)                   | A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.                                                                                                                  |
| [`formatDateFull`](#formatdatefull)           | Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.                          |
| [`formatDefaultLocale`](#formatdefaultlocale) | An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.                                                                                                      |
| [`formatOrdinal`](#formatordinal)             | Formats a whole number as an ordinal for the given locale (`1` to `"1st"` in English, `"1.º"` in Spanish, `"1º"` in Portuguese, `"第1"` in Chinese).                                                                                                            |

| Interfaces                                | Description                            |
| ----------------------------------------- | -------------------------------------- |
| [`DateFormatOptions`](#dateformatoptions) | Options for the date formatters.       |
| [`FormatDateOptions`](#formatdateoptions) | Options for [formatDate](#formatDate). |

| Type Aliases                            | Description                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`DateIntervalName`](#dateintervalname) | A calendar interval dates step by (see [dateInterval](#dateInterval)), or `undefined` for steps finer than an hour. |

## Functions

<a id="dateformatter"></a>

### dateFormatter()

> **dateFormatter**(`dataArray`: `Date`[], `formatter?`: `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions), `options?`: [`DateFormatOptions`](#dateformatoptions)): (`d`: `Date`, `shown?`: `Date`[]) => `string`

Defined in: [formatDate.ts:144](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L144)

Returns a function that labels any date in `dataArray` exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time. Pass the returned function the date to format and, optionally, the dates `shown` alongside it (sorted once for each new array it is given).

#### Parameters

| Parameter    | Type                                                         | Description                                                                   |
| ------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `dataArray`  | `Date`[]                                                     | The full array of ordered Date Objects.                                       |
| `formatter?` | `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions) | Optional custom format function, or the options (see `options`) in its place. |
| `options?`   | [`DateFormatOptions`](#dateformatoptions)                    | `utc: true` reads the dates in UTC (see `DateFormatOptions`).                 |

#### Returns

(`d`: `Date`, `shown?`: `Date`[]) => `string`

---

<a id="datefullformatter"></a>

### dateFullFormatter()

> **dateFullFormatter**(`dataArray`: `Date`[], `formatter?`: `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions), `options?`: [`DateFormatOptions`](#dateformatoptions)): (`d`: `Date`) => `string`

Defined in: [formatDate.ts:388](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L388)

Returns a function that labels any date exactly as [formatDateFull](#formatDateFull) would against `dataArray`, reading the interval its dates step by once up front.

#### Parameters

| Parameter    | Type                                                         | Description                                                                   |
| ------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `dataArray`  | `Date`[]                                                     | The full array of ordered Date Objects.                                       |
| `formatter?` | `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions) | Optional custom format function, or the options (see `options`) in its place. |
| `options?`   | [`DateFormatOptions`](#dateformatoptions)                    | `utc: true` reads the dates in UTC (see `DateFormatOptions`).                 |

#### Returns

(`d`: `Date`) => `string`

---

<a id="dateinterval"></a>

### dateInterval()

> **dateInterval**(`dataArray`: `Date`[], `options?`: `object`): [`DateIntervalName`](#dateintervalname)

Defined in: [formatDate.ts:451](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L451)

The calendar interval a set of dates steps by, which [formatDate](#formatDate) labels them at: the coarsest of "year", "quarter", "month", "day", or "hour" that every step between consecutive dates is a whole multiple of, else `undefined` for finer steps.

#### Parameters

| Parameter      | Type                     | Description                             |
| -------------- | ------------------------ | --------------------------------------- |
| `dataArray`    | `Date`[]                 | The full array of ordered Date Objects. |
| `options?`     | \{ `utc?`: `boolean`; \} | `utc: true` reads the dates in UTC.     |
| `options.utc?` | `boolean`                | -                                       |

#### Returns

[`DateIntervalName`](#dateintervalname)

#### Example

```ts
dateInterval([new Date(2024, 0, 1), new Date(2024, 3, 1)]); // "quarter"
```

---

<a id="format"></a>

### format()

> **format**(`specifier`: `string`): `Formatter`

Defined in: [format.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/format/src/format.ts#L10)

An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.

#### Parameters

| Parameter   | Type     | Description                                       |
| ----------- | -------- | ------------------------------------------------- |
| `specifier` | `string` | The string specifier used by the format function. |

#### Returns

`Formatter`

---

<a id="formatabbreviate"></a>

### formatAbbreviate()

> **formatAbbreviate**(`n`: `string` \| `number`, `locale?`: `string` \| `FormatLocaleDefinition`, `precision?`: `string`): `string`

Defined in: [formatAbbreviate.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatAbbreviate.ts#L55)

Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).

#### Parameters

| Parameter    | Type                                 | Default    | Description                                                                                                                                                                                      |
| ------------ | ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `n`          | `string` \| `number`                 | _required_ | The number to be formatted.                                                                                                                                                                      |
| `locale?`    | `string` \| `FormatLocaleDefinition` | `"en-US"`  | The locale config to be used. If an object is provided, the function will format the numbers according to the object. The object must include `suffixes`, `delimiter` and `currency` properties. |
| `precision?` | `string`                             | _required_ | A [d3-format](https://github.com/d3/d3-format#locale_format) specifier (e.g. `",.2f"`), used as given. Without one, trailing zeros after the decimal are dropped (`30`, not `"30.0"`).           |

#### Returns

`string`

---

<a id="formatdate"></a>

### formatDate()

> **formatDate**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter` \| [`FormatDateOptions`](#formatdateoptions), `options?`: `Date`[] \| [`FormatDateOptions`](#formatdateoptions)): `string`

Defined in: [formatDate.ts:108](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L108)

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.

Without `shown`, the year rides on the first and last dates and on each January 1st. Given `shown` (the dates actually drawn, such as the axis labels left after thinning), it rides on the first shown date and on the first shown date after each change of year instead, so the year stays readable however the labels are thinned; at hourly and finer steps, the date rides with the time on the first shown date of each day. A label carrying the year at these steps reads its date, year, and time. Times of day follow the formatter's locale: "3 PM" and "3:30 PM" on a 12-hour clock, "15:00" and "15:30" on a 24-hour one.

#### Parameters

| Parameter    | Type                                                         | Description                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `d`          | `Date`                                                       | The date to format.                                                                                                                                                                                                   |
| `dataArray`  | `Date`[]                                                     | The full array of ordered Date Objects.                                                                                                                                                                               |
| `formatter?` | `DateFormatter` \| [`FormatDateOptions`](#formatdateoptions) | Optional custom format function, or the options (see `options`) in its place.                                                                                                                                         |
| `options?`   | `Date`[] \| [`FormatDateOptions`](#formatdateoptions)        | Optional dates `shown` alongside `d`, which decide which labels carry the year (and, at hourly and finer steps, the date), as an array or as `{shown}`; `utc: true` reads the dates in UTC (see `DateFormatOptions`). |

#### Returns

`string`

#### Example

```ts
formatDate(date, dates, {utc: true});
formatDate(date, dates, locale.utcFormat, {shown, utc: true});
```

---

<a id="formatdatefull"></a>

### formatDateFull()

> **formatDateFull**(`d`: `Date`, `dataArray`: `Date`[], `formatter?`: `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions), `options?`: [`DateFormatOptions`](#dateformatoptions)): `string`

Defined in: [formatDate.ts:364](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L364)

Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.

#### Parameters

| Parameter    | Type                                                         | Description                                                                   |
| ------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `d`          | `Date`                                                       | The date to format.                                                           |
| `dataArray`  | `Date`[]                                                     | The full array of ordered Date Objects.                                       |
| `formatter?` | `DateFormatter` \| [`DateFormatOptions`](#dateformatoptions) | Optional custom format function, or the options (see `options`) in its place. |
| `options?`   | [`DateFormatOptions`](#dateformatoptions)                    | `utc: true` reads the dates in UTC (see `DateFormatOptions`).                 |

#### Returns

`string`

---

<a id="formatdefaultlocale"></a>

### formatDefaultLocale()

> **formatDefaultLocale**(`definition`: `FormatLocaleDefinition`): `Record`\<`string`, `unknown`\>

Defined in: [formatDefaultLocale.ts:8](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDefaultLocale.ts#L8)

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.

#### Parameters

| Parameter    | Type                     | Description                  |
| ------------ | ------------------------ | ---------------------------- |
| `definition` | `FormatLocaleDefinition` | The localization definition. |

#### Returns

`Record`\<`string`, `unknown`\>

---

<a id="formatordinal"></a>

### formatOrdinal()

> **formatOrdinal**(`n`: `number`, `locale?`: `string`): `string`

Defined in: [formatOrdinal.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatOrdinal.ts#L33)

Formats a whole number as an ordinal for the given locale (`1` to
`"1st"` in English, `"1.º"` in Spanish, `"1º"` in Portuguese, `"第1"` in
Chinese). A language without an ordinal form (such as Arabic) reads the
plain number, and a number that isn't whole is formatted with
`formatAbbreviate`.

#### Parameters

| Parameter | Type     | Default    | Description                                                                            |
| --------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `n`       | `number` | _required_ | The number to be formatted.                                                            |
| `locale?` | `string` | `"en-US"`  | The locale, as a language-region tag (`"es-ES"`) or a 2-letter language code (`"es"`). |

#### Returns

`string`

## Interfaces

<a id="dateformatoptions"></a>

### DateFormatOptions

Defined in: [formatDate.ts:61](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L61)

Options for the date formatters.

#### Extended by

- [`FormatDateOptions`](#formatdateoptions)

#### Properties

| Property                                     | Type            | Description                                                                                                                                                                                                                                     | Defined in                                                                                           |
| -------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| <a id="property-formatter"></a> `formatter?` | `DateFormatter` | A function that turns a specifier into a formatter, such as d3's `timeFormat` or a locale's `format`. Defaults to d3's `timeFormat`, or `utcFormat` with `utc`; with `utc`, a custom one should write UTC too (such as a locale's `utcFormat`). | [formatDate.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L63) |
| <a id="property-utc"></a> `utc?`             | `boolean`       | Read the dates' calendar in UTC instead of local time.                                                                                                                                                                                          | [formatDate.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L65) |

---

<a id="formatdateoptions"></a>

### FormatDateOptions

Defined in: [formatDate.ts:69](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L69)

Options for [formatDate](#formatDate).

#### Extends

- [`DateFormatOptions`](#dateformatoptions)

#### Properties

| Property                                       | Type            | Description                                                                                                                                                                                                                                     | Inherited from                                                               | Defined in                                                                                           |
| ---------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| <a id="property-formatter-1"></a> `formatter?` | `DateFormatter` | A function that turns a specifier into a formatter, such as d3's `timeFormat` or a locale's `format`. Defaults to d3's `timeFormat`, or `utcFormat` with `utc`; with `utc`, a custom one should write UTC too (such as a locale's `utcFormat`). | [`DateFormatOptions`](#dateformatoptions).[`formatter`](#property-formatter) | [formatDate.ts:63](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L63) |
| <a id="property-shown"></a> `shown?`           | `Date`[]        | Dates drawn alongside the date, which decide which labels carry the year (and, at hourly and finer steps, the date).                                                                                                                            | -                                                                            | [formatDate.ts:71](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L71) |
| <a id="property-utc-1"></a> `utc?`             | `boolean`       | Read the dates' calendar in UTC instead of local time.                                                                                                                                                                                          | [`DateFormatOptions`](#dateformatoptions).[`utc`](#property-utc)             | [formatDate.ts:65](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L65) |

## Type Aliases

<a id="dateintervalname"></a>

### DateIntervalName

> **DateIntervalName** = `"year"` \| `"quarter"` \| `"month"` \| `"day"` \| `"hour"` \| `undefined`

Defined in: [formatDate.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.ts#L20)

A calendar interval dates step by (see [dateInterval](#dateInterval)), or `undefined` for steps finer than an hour.
