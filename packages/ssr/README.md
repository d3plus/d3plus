# @d3plus/ssr

[![NPM version](https://img.shields.io/npm/v/@d3plus/ssr.svg)](https://www.npmjs.com/package/@d3plus/ssr)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=ssr)](https://codecov.io/gh/d3plus/d3plus/flags)

Server-side rendering for d3plus visualizations — render charts to SVG strings and PNG buffers in Node, with no browser.

## Installing

If using npm, `npm install @d3plus/ssr`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/ssr).

```js
import {*} from "@d3plus/ssr";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/ssr"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

The full API reference is in [API.md](https://github.com/d3plus/d3plus/blob/main/packages/ssr/API.md).
