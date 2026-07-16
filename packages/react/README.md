# @d3plus/react

[![NPM version](https://img.shields.io/npm/v/@d3plus/react.svg)](https://www.npmjs.com/package/@d3plus/react)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=react)](https://codecov.io/gh/d3plus/d3plus/flags)

React components for d3plus visualizations.

## Installing

`npm install @d3plus/react`. Requires `react` and `react-dom` (18 or 19) as peer dependencies.

## Usage

Each d3plus visualization, component, and shape is exported as a React component that takes a `config` prop:

```jsx
import {Treemap} from "@d3plus/react";

const config = {
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 2", id: "beta",  value: 10}
  ],
  groupBy: ["parent", "id"],
  sum: "value"
};

export default () => <Treemap config={config} />;
```

The underlying instance is reused across `config` changes so the chart tweens between states rather than restarting, and is destroyed on unmount. Reassigning `config` to a structurally-identical value (functions compared by source) is a no-op — pass `forceUpdate` to render on every update.

### Global config

Set shared defaults for every visualization with the `D3plusContext` provider; per-component `config` props deep-merge over it:

```jsx
import {D3plusContext} from "@d3plus/react";

<D3plusContext.Provider value={{locale: "es-ES"}}>
  <App />
</D3plusContext.Provider>
```

## Components

Every d3plus class is exported as a React component:

- **Charts** — `AreaPlot`, `BarChart`, `BoxWhisker`, `BumpChart`, `Donut`, `Geomap`, `LinePlot`, `Matrix`, `Network`, `Pack`, `Pie`, `Plot`, `Priestley`, `Radar`, `RadialMatrix`, `Rings`, `Sankey`, `StackedArea`, `Tree`, `Treemap`, `Viz`
- **Components** — `Axis`, `AxisBottom`, `AxisLeft`, `AxisRight`, `AxisTop`, `ColorScale`, `Legend`, `Message`, `TextBox`, `Timeline`, `Tooltip`
- **Shapes** — `Area`, `Bar`, `Box`, `Circle`, `Image`, `Line`, `Path`, `Rect`, `Shape`, `Whisker`
- **Utilities** — `BaseClass`

The package also exports `D3plusContext`, the `Renderer` component each of the above is built on, and the `RendererProps` / `D3plusConfig` / `D3plusConstructor` types.

## Props

Every component accepts the same props:

| Prop | Description |
| --- | --- |
| `config` | Config object passed to the visualization's `.config()` method. |
| `callback` | A function invoked at the end of each render cycle. |
| `forceUpdate` | When `true`, re-renders on every React render even if the config is unchanged. |
| `className` | The class attribute for the wrapper `<div>` (defaults per component type: `chart`, `component`, or `shape`). |

## Other frameworks

d3plus ships official wrappers for **Vue**, **Svelte**, and **Angular**, plus framework-agnostic **Web Components** — see the [Frameworks guide](https://d3plus.org) for all of them.
