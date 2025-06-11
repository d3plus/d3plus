# @d3plus/text
  
A smart SVG text box with line wrapping and automatic font size scaling.

## Installing

If using npm, `npm install @d3plus/text`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/text).

```js
import modules from "@d3plus/text";
```

In vanilla JavaScript, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/text@3.0.0-alpha.3"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using @d3plus/react.

## API Reference

##### 
* [stringify](#stringify) - Coerces value into a String.
* [strip](#strip) - Removes all non ASCII characters from a string.
* [textSplit](#textSplit) - Splits a given sentence into an array of words.
* [textWrap](#textWrap) - Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.
* [titleCase](#titleCase) - Capitalizes the first letter of each word in a phrase/sentence.
* [trim](#trim) - Cross-browser implementation of [trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim).
* [trimLeft](#trimLeft) - Cross-browser implementation of [trimLeft](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft).
* [trimRight](#trimRight) - Cross-browser implementation of [trimRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimRight).

##### 
* [fontFamily](#fontFamily) - The default fallback font list used for all text labels as an Array of Strings.
* [fontFamilyStringify](#fontFamilyStringify) - Converts an Array of font-family names into a CSS font-family string.

---

<a name="stringify"></a>
#### d3plus.**stringify**(value) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/stringify.js#L1)

Coerces value into a String.


This is a global function

---

<a name="strip"></a>
#### d3plus.**strip**(value, [spacer]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/strip.js#L18)

Removes all non ASCII characters from a string.


This is a global function

---

<a name="textSplit"></a>
#### d3plus.**textSplit**(sentence) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textSplit.js#L51)

Splits a given sentence into an array of words.


This is a global function

---

<a name="textWrap"></a>
#### d3plus.**textWrap**() [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L7)

Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.


This is a global function


* [textWrap()](#textWrap)
    * [.fontFamily([*value*])](#textWrap.fontFamily)
    * [.fontSize([*value*])](#textWrap.fontSize)
    * [.fontWeight([*value*])](#textWrap.fontWeight)
    * [.height([*value*])](#textWrap.height)
    * [.lineHeight([*value*])](#textWrap.lineHeight)
    * [.maxLines([*value*])](#textWrap.maxLines)
    * [.overflow([*value*])](#textWrap.overflow)
    * [.split([*value*])](#textWrap.split)
    * [.width([*value*])](#textWrap.width)


<a name="textWrap.fontFamily" href="#textWrap.fontFamily">#</a> d3plus..**fontFamily**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L90)

If *value* is specified, sets the font family accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current font family.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.fontSize" href="#textWrap.fontSize">#</a> d3plus..**fontSize**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L99)

If *value* is specified, sets the font size accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font size.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.fontWeight" href="#textWrap.fontWeight">#</a> d3plus..**fontWeight**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L108)

If *value* is specified, sets the font weight accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font weight.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.height" href="#textWrap.height">#</a> d3plus..**height**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L117)

If *value* is specified, sets height limit to the specified value and returns this generator. If *value* is not specified, returns the current value.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.lineHeight" href="#textWrap.lineHeight">#</a> d3plus..**lineHeight**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L126)

If *value* is specified, sets the line height accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current line height accessor, which is 1.1 times the [font size](#textWrap.fontSize) by default.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.maxLines" href="#textWrap.maxLines">#</a> d3plus..**maxLines**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L135)

If *value* is specified, sets the maximum number of lines allowed when wrapping.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.overflow" href="#textWrap.overflow">#</a> d3plus..**overflow**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L144)

If *value* is specified, sets the overflow to the specified boolean and returns this generator. If *value* is not specified, returns the current overflow value.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.split" href="#textWrap.split">#</a> d3plus..**split**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L153)

If *value* is specified, sets the word split function to the specified function and returns this generator. If *value* is not specified, returns the current word split function.


This is a static method of [<code>textWrap</code>](#textWrap)


<a name="textWrap.width" href="#textWrap.width">#</a> d3plus..**width**([*value*]) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/textWrap.js#L162)

If *value* is specified, sets width limit to the specified value and returns this generator. If *value* is not specified, returns the current value.


This is a static method of [<code>textWrap</code>](#textWrap)

---

<a name="titleCase"></a>
#### d3plus.**titleCase**(str) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/titleCase.js#L6)

Capitalizes the first letter of each word in a phrase/sentence.


This is a global function

---

<a name="trim"></a>
#### d3plus.**trim**(str) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/trim.js#L1)

Cross-browser implementation of [trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim).


This is a global function

---

<a name="trimLeft"></a>
#### d3plus.**trimLeft**(str) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/trim.js#L10)

Cross-browser implementation of [trimLeft](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft).


This is a global function

---

<a name="trimRight"></a>
#### d3plus.**trimRight**(str) [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/trim.js#L19)

Cross-browser implementation of [trimRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimRight).


This is a global function

---

<a name="fontFamily"></a>
#### **fontFamily** [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.js#L1)

The default fallback font list used for all text labels as an Array of Strings.


This is a global constant

---

<a name="fontFamilyStringify"></a>
#### **fontFamilyStringify** [<>](https://github.com/d3plus/d3plus/blob/main/packages/text/src/fontFamily.js#L8)

Converts an Array of font-family names into a CSS font-family string.


This is a global constant

---

