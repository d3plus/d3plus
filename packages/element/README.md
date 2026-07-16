# @d3plus/element

[![NPM version](https://img.shields.io/npm/v/@d3plus/element.svg)](https://www.npmjs.com/package/@d3plus/element)

Framework-agnostic [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (Web Components) for d3plus visualizations. Because they are native custom elements, they work in plain HTML and in any framework that renders the DOM — including Angular, Astro, and server-rendered apps.

## Installing

If using npm, `npm install @d3plus/element`.

```js
import {defineElements} from "@d3plus/element";

// Register <d3plus-treemap>, <d3plus-bar-chart>, … (call once, in the browser).
defineElements();
```

Every d3plus class is registered as `d3plus-<kebab-case-name>` (e.g. `Treemap` → `d3plus-treemap`, `BarChart` → `d3plus-bar-chart`, `RadialMatrix` → `d3plus-radial-matrix`). Pass an optional prefix to `defineElements("my-prefix")` to change the namespace.

## Usage

Config is supplied via the `.config` **property** (an object — so it can carry accessor functions and nested options, which string attributes cannot):

```html
<d3plus-treemap id="chart"></d3plus-treemap>
<script type="module">
  import {defineElements} from "@d3plus/element";
  defineElements();

  document.getElementById("chart").config = {
    data: [
      {parent: "Group 1", id: "alpha", value: 29},
      {parent: "Group 2", id: "beta", value: 10},
    ],
    groupBy: ["parent", "id"],
    sum: "value",
  };
</script>
```

The element instantiates the visualization on connect, re-renders whenever `.config` is assigned a structurally-different value (so the chart tweens between states rather than restarting), and destroys the instance when removed from the DOM. Assigning a structurally-identical config is a no-op; set `.forceUpdate = true` to render on every assignment.

### Global config

`setGlobalConfig()` sets a config object merged into every d3plus element ahead of its own config — the analogue of the React wrapper's `D3plusContext`:

```js
import {setGlobalConfig} from "@d3plus/element";
setGlobalConfig({locale: "es-ES"});
```

## API Reference

| Export | Description |
| --- | --- |
| `defineElements(prefix?)` | Registers a custom element for every d3plus class. Idempotent; a no-op where `customElements` is unavailable (SSR). Returns a map of class name → tag name. |
| `D3plusElement` | Base `HTMLElement` subclass. Set its static `viz` to a d3plus class to make a custom element. |
| `CLASSES` | Map of PascalCase class name → d3plus class, the source of the registered tags. |
| `setGlobalConfig(config?)` | Replaces the global config merged into every element. |
| `globalConfig` | The current global config object. |
