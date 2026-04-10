# @d3plus/export

[![NPM version](https://img.shields.io/npm/v/@d3plus/export.svg)](https://www.npmjs.com/package/@d3plus/export)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=export)](https://codecov.io/gh/d3plus/d3plus/flags)

Export methods for transforming and downloading SVG.

## Installing

If using npm, `npm install @d3plus/export`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/export).

```js
import {*} from "@d3plus/export";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/export"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`saveElement`](#saveelement) | Downloads an HTML Element as a bitmap PNG image. |

## Functions

<a id="saveelement"></a>

### saveElement()

> **saveElement**(`elem`: `HTMLElement`, `options?`: `SaveElementOptions`, `renderOptions?`: `SaveElementRenderOptions`): `void`

Defined in: [saveElement.ts:36](https://github.com/d3plus/d3plus/blob/28157d056a88c49bd8f644f87e79a19dcedd589b/packages/export/src/saveElement.ts#L36)

Downloads an HTML Element as a bitmap PNG image.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elem` | `HTMLElement` | The DOM element or d3 selection to export. |
| `options` | `SaveElementOptions` | Additional options to specify. |
| `renderOptions` | `SaveElementRenderOptions` | Custom options to be passed to the html-to-image function. |

#### Returns

`void`
