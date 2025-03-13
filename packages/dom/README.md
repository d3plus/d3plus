# @d3plus/dom
  
JavaScript functions for manipulating and analyzing DOM elements.

## Installing

If using npm, `npm install @d3plus/dom`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/dom@3.0.0-alpha.0/+esm).

```js
import modules from "@d3plus/dom";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/dom@3.0.0-alpha.0"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using @d3plus/react.

## API Reference

##### 
* [assign](#assign) - A deeply recursive version of `Object.assign`.
* [attrize](#attrize) - Applies each key/value in an object as an attr.
* [date](#date) - Parses numbers and strings to valid Javascript Date objects.
* [elem](#elem) - Manages the enter/update/exit pattern for a single DOM element.
* [fontExists](#fontExists) - Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.
* [isObject](#isObject) - Detects if a variable is a javascript Object.
* [parseSides](#parseSides) - Converts a string of directional CSS shorthand values into an object with the values expanded.
* [prefix](#prefix) - Returns the appropriate CSS vendor prefix, given the current browser.
* [rtl](#rtl) - Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".
* [stylize](#stylize) - Applies each key/value in an object as a style.
* [htmlDecode](#htmlDecode) - Strips HTML and "un-escapes" escape characters.
* [textWidth](#textWidth) - Given a text string, returns the predicted pixel width of the string when placed into DOM.

---

<a name="assign"></a>
#### d3plus.**assign**(...objects) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/assign.js#L14)

A deeply recursive version of `Object.assign`.


This is a global function
this

```js
assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}));
    
```
returns this

```js
{id: "bar", deep: {group: "A", value: 20}}
```

---

<a name="attrize"></a>
#### d3plus.**attrize**(elem, attrs) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/attrize.js#L1)

Applies each key/value in an object as an attr.


This is a global function

---

<a name="date"></a>
#### d3plus.**date**(*date*) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/date.js#L1)

Returns a javascript Date object for a given a Number (representing either a 4-digit year or milliseconds since epoch), a String representing a Quarter (ie. "Q2 1987", mapping to the last day in that quarter), or a String that is in [valid dateString format](http://dygraphs.com/date-formats.html). Besides the 4-digit year parsing, this function is useful when needing to parse negative (BC) years, which the vanilla Date object cannot parse.


This is a global function

---

<a name="elem"></a>
#### d3plus.**elem**(selector, params) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/elem.js#L6)

Manages the enter/update/exit pattern for a single DOM element.


This is a global function

---

<a name="fontExists"></a>
#### d3plus.**fontExists**(font) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/fontExists.js#L10)

Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.


This is a global function

---

<a name="isObject"></a>
#### d3plus.**isObject**(item) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/isObject.js#L1)

Detects if a variable is a javascript Object.


This is a global function

---

<a name="parseSides"></a>
#### d3plus.**parseSides**(sides) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/parseSides.js#L1)

Converts a string of directional CSS shorthand values into an object with the values expanded.


This is a global function

---

<a name="prefix"></a>
#### d3plus.**prefix**() [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/prefix.js#L1)

Returns the appropriate CSS vendor prefix, given the current browser.


This is a global function

---

<a name="rtl"></a>
#### d3plus.**rtl**() [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/rtl.js#L3)

Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".


This is a global function

---

<a name="stylize"></a>
#### d3plus.**stylize**(elem, styles) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/stylize.js#L1)

Applies each key/value in an object as a style.


This is a global function

---

<a name="htmlDecode"></a>
#### d3plus.**htmlDecode**(input) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/textWidth.js#L5)

Strips HTML and "un-escapes" escape characters.


This is a global function

---

<a name="textWidth"></a>
#### d3plus.**textWidth**(text, [style]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/dom/src/textWidth.js#L12)

Given a text string, returns the predicted pixel width of the string when placed into DOM.


This is a global function

---


###### <sub>Documentation generated on Thu, 13 Mar 2025 19:58:29 GMT</sub>
