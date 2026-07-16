# @d3plus/vue

[![NPM version](https://img.shields.io/npm/v/@d3plus/vue.svg)](https://www.npmjs.com/package/@d3plus/vue)

Vue 3 components for d3plus visualizations.

## Installing

`npm install @d3plus/vue`. Requires `vue` (^3.4) as a peer dependency.

```js
import {Treemap} from "@d3plus/vue";
```

## Usage

Each d3plus visualization, component, and shape is exported as a Vue component. Pass a `config` object (and optionally `callback` / `forceUpdate` / `className`):

```vue
<script setup>
import {Treemap} from "@d3plus/vue";
import {ref} from "vue";

const config = ref({
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 2", id: "beta", value: 10},
  ],
  groupBy: ["parent", "id"],
  sum: "value",
});
</script>

<template>
  <Treemap :config="config" style="height: 400px" />
</template>
```

The underlying instance is reused across `config` changes so the chart tweens between states rather than restarting, and is destroyed when the component unmounts. Reassigning `config` to a structurally-identical value is a no-op — set `:force-update="true"` to render on every update.

### Global config

Provide a config object merged ahead of every component's own config (the analogue of the React wrapper's `D3plusContext`):

```js
import {provide} from "vue";
import {D3plusConfigKey} from "@d3plus/vue";

provide(D3plusConfigKey, {locale: "es-ES"});
```

## Props

| Prop | Description |
| --- | --- |
| `config` | Config object forwarded to the instance's `.config()` method. |
| `callback` | A function invoked at the end of each render cycle. |
| `forceUpdate` | When `true`, re-renders on every update even if the config is unchanged. |
| `className` | The wrapper `<div>`'s class attribute (defaults per component type). |

## API Reference

`createD3plusComponent(Constructor, className?)` builds a component from any d3plus class, and `D3plusConfigKey` is the injection key for global config. All the named exports (`Treemap`, `BarChart`, `Geomap`, …) are built with it.
