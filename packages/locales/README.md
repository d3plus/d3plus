# @d3plus/locales
  
International localizations for number, date, and UI labels.

## Installing

If using npm, `npm install @d3plus/locales`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/locales@3.0.0/+esm).

```js
import modules from "@d3plus/locales";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/locales@3.0.0"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/).

## API Reference

##### 
* [formatLocale](#formatLocale) - A set of default locale formatters used when assigning suffixes and currency in numbers.

| Name | Default | Description |
|---|---|---|
| separator | "" | Separation between the number with the suffix. |
| suffixes | [] | List of suffixes used to format numbers. |
| grouping | [3] | The array of group sizes, |
| delimiters | {thousands: ",", decimal: "."} | Decimal and group separators. |
| currency | ["$", ""] | The currency prefix and suffix. |

---

<a name="formatLocale"></a>
#### **formatLocale** [<>](https://github.com/d3plus/d3plus/blob/main/packages/locales/src/dictionaries/formatLocale.js#L1)

A set of default locale formatters used when assigning suffixes and currency in numbers.

| Name | Default | Description |
|---|---|---|
| separator | "" | Separation between the number with the suffix. |
| suffixes | [] | List of suffixes used to format numbers. |
| grouping | [3] | The array of group sizes, |
| delimiters | {thousands: ",", decimal: "."} | Decimal and group separators. |
| currency | ["$", ""] | The currency prefix and suffix. |


This is a global namespace

---


###### <sub>Documentation generated on Thu, 13 Mar 2025 17:31:37 GMT</sub>
