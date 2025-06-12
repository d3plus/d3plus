# @d3plus/format
  
JavaScript formatters for localized numbers and dates.

## Installing

If using npm, `npm install @d3plus/format`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/format).

```js
import modules from "@d3plus/format";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/format@3.0.0-alpha.4"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using @d3plus/react.

## API Reference

##### 
* [format](#format) - An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.
* [formatAbbreviate](#formatAbbreviate) - Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).
* [formatDate](#formatDate) - A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.
* [formatDefaultLocale](#formatDefaultLocale) - An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.

---

<a name="format"></a>
#### d3plus.**format**(specifier) [<>](https://github.com/d3plus/d3plus/blob/main/packages/format/src/format.js#L4)

An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.


This is a global function

---

<a name="formatAbbreviate"></a>
#### d3plus.**formatAbbreviate**(n, locale) [<>](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatAbbreviate.js#L38)

Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).


This is a global function

---

<a name="formatDate"></a>
#### d3plus.**formatDate**(d, dataArray, [formatter]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDate.js#L4)

A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.


This is a global function

---

<a name="formatDefaultLocale"></a>
#### d3plus.**formatDefaultLocale**(definition) [<>](https://github.com/d3plus/d3plus/blob/main/packages/format/src/formatDefaultLocale.js#L4)

An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.


This is a global function

---

