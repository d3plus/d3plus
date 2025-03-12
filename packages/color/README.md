# @d3plus/color
  
Color functions that extent the ability of d3-color.

## Installing

If using npm, `npm install @d3plus/color`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/color@3.0.0/+esm).

```js
import modules from "@d3plus/color";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/color@3.0.0"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/).

## API Reference

##### 
* [colorAdd](#colorAdd) - Adds two colors together.
* [colorAssign](#colorAssign) - Assigns a color to a value using a predefined set of defaults.
* [colorContrast](#colorContrast) - A set of default color values used when assigning colors based on data.
* [colorLegible](#colorLegible) - Darkens a color so that it will appear legible on a white background.
* [colorLighter](#colorLighter) - Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.
* [colorSubtract](#colorSubtract) - Subtracts one color from another.

##### 
* [colorDefaults](#colorDefaults) - A set of default color values used when assigning colors based on data.

| Name | Default | Description |
|---|---|---|
| dark | "#555555" | Used in the [contrast](#contrast) function when the color given is very light. |
| light | "#f7f7f7" | Used in the [contrast](#contrast) function when the color given is very dark. |
| missing | "#cccccc" | Used in the [assign](#assign) function when the value passed is `null` or `undefined`. |
| off | "#C44536" | Used in the [assign](#assign) function when the value passed is `false`. |
| on | "#6A994E" | Used in the [assign](#assign) function when the value passed is `true`. |
| scale | "#4281A4", "#F6AE2D", "#C44536", "#2A9D8F", "#6A994E", "#CEB54A", "#5E548E", "#C08497", "#99582A", "#8C8C99", "#1D3557", "#D08C60", "#6D2E46", "#8BB19C", "#52796F", "#5E60CE", "#985277", "#5C374C" | An ordinal scale used in the [assign](#assign) function for non-valid color strings and numbers. |

---

<a name="colorAdd"></a>
#### d3plus.**colorAdd**(c1, c2, [o1], [o2]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/add.js#L3)

Adds two colors together.


This is a global function

---

<a name="colorAssign"></a>
#### d3plus.**colorAssign**(c, [u]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/assign.js#L4)

Assigns a color to a value using a predefined set of defaults.


This is a global function

---

<a name="colorContrast"></a>
#### d3plus.**colorContrast**(c, [u]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/contrast.js#L4)

A set of default color values used when assigning colors based on data.


This is a global function

---

<a name="colorLegible"></a>
#### d3plus.**colorLegible**(c) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/legible.js#L3)

Darkens a color so that it will appear legible on a white background.


This is a global function

---

<a name="colorLighter"></a>
#### d3plus.**colorLighter**(c, [i]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/lighter.js#L3)

Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.


This is a global function

---

<a name="colorSubtract"></a>
#### d3plus.**colorSubtract**(c1, c2, [o1], [o2]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/subtract.js#L3)

Subtracts one color from another.


This is a global function

---

<a name="colorDefaults"></a>
#### **colorDefaults** [<>](https://github.com/d3plus/d3plus/blob/main/packages/color/src/defaults.js#L3)

A set of default color values used when assigning colors based on data.

| Name | Default | Description |
|---|---|---|
| dark | "#555555" | Used in the [contrast](#contrast) function when the color given is very light. |
| light | "#f7f7f7" | Used in the [contrast](#contrast) function when the color given is very dark. |
| missing | "#cccccc" | Used in the [assign](#assign) function when the value passed is `null` or `undefined`. |
| off | "#C44536" | Used in the [assign](#assign) function when the value passed is `false`. |
| on | "#6A994E" | Used in the [assign](#assign) function when the value passed is `true`. |
| scale | "#4281A4", "#F6AE2D", "#C44536", "#2A9D8F", "#6A994E", "#CEB54A", "#5E548E", "#C08497", "#99582A", "#8C8C99", "#1D3557", "#D08C60", "#6D2E46", "#8BB19C", "#52796F", "#5E60CE", "#985277", "#5C374C" | An ordinal scale used in the [assign](#assign) function for non-valid color strings and numbers. |


This is a global namespace

---


###### <sub>Documentation generated on Wed, 12 Mar 2025 20:01:47 GMT</sub>
