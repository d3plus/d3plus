# @d3plus/svelte

[![NPM version](https://img.shields.io/npm/v/@d3plus/svelte.svg)](https://www.npmjs.com/package/@d3plus/svelte)

A [Svelte action](https://svelte.dev/docs/svelte/use) for rendering d3plus visualizations.

## Installing

`npm install @d3plus/svelte`. Requires `svelte` (4 or 5) as a peer dependency, and `@d3plus/core` for the visualization classes.

## Usage

Apply the `d3plus` action to a container element with `use:d3plus`, passing the visualization class and its config:

```svelte
<script>
  import {d3plus} from "@d3plus/svelte";
  import {Treemap} from "@d3plus/core";

  let config = $state({
    data: [
      {parent: "Group 1", id: "alpha", value: 29},
      {parent: "Group 2", id: "beta", value: 10},
    ],
    groupBy: ["parent", "id"],
    sum: "value",
  });
</script>

<div use:d3plus={{constructor: Treemap, config}} style="height: 400px"></div>
```

The action creates an `<svg>` inside the host element, instantiates the visualization, and re-renders whenever the parameters change. A single instance is reused across updates so the chart tweens between states rather than restarting; it is destroyed when the element unmounts. Swapping `constructor` rebuilds from scratch.

Because `config` is reactive, reassigning it (or mutating `$state`) drives updates automatically. Assigning a structurally-identical config is a no-op — set `forceUpdate: true` to render on every update.

## Parameters

The action takes a single object parameter:

| Property | Description |
| --- | --- |
| `constructor` | **Required.** The d3plus visualization class to instantiate (e.g. `Treemap`). |
| `config` | Config object forwarded to the instance's `.config()` method. |
| `globalConfig` | Config merged ahead of `config` — a shared baseline across charts. |
| `callback` | A function invoked at the end of each render cycle. |
| `forceUpdate` | When `true`, re-renders on every update even if the config is unchanged. |
