# d3plus-export

Export methods for transforming and downloading SVG.

## Installing

If using npm, `npm install d3plus-export`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus-export/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/d3plus-export@1).

```js
import modules from "d3plus-export";
```

d3plus-export can be loaded as a standalone library or bundled as part of [D3plus](https://github.com/d3plus/d3plus). ES modules, AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3plus` global is exported:

```html
<script src="https://cdn.jsdelivr.net/npm/d3plus-export@1"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/). These examples are powered by the [d3plus-storybook](https://github.com/d3plus/d3plus-storybook/) repo, and PRs are always welcome. :beers:

## API Reference

##### 
* [saveElement](#saveElement) - Downloads an HTML Element as a bitmap PNG image.

---

<a name="saveElement"></a>
#### d3plus.**saveElement**(elem, [options], [renderOptions]) [<>](https://github.com/d3plus/d3plus-export/blob/master/src/saveElement.js#L9)

Downloads an HTML Element as a bitmap PNG image.


This is a global function.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| elem | <code>HTMLElement</code> |  | A single element to be saved to one file. |
| [options] | <code>Object</code> |  | Additional options to specify. |
| [options.filename] | <code>String</code> | <code>&quot;download&quot;</code> | Filename for the downloaded file, without the extension. |
| [options.type] | <code>String</code> | <code>&quot;png&quot;</code> | File type of the saved document. Accepted values are `"png"` and `"jpg"`. |
| [options.callback] | <code>function</code> |  | Function to be invoked after saving is complete. |
| [renderOptions] | <code>Object</code> |  | Custom options to be passed to the html-to-image function. |


---



###### <sub>Documentation generated on Tue, 04 Apr 2023 21:45:19 GMT</sub>
