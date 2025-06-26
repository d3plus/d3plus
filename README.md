# d3plus

D3plus is an open-source visualization library, written in JavaScript, that streamlines the creation of SVG data visualizations. After providing a configuration object that details the specifics of the data at hand, D3plus will create a visualization that includes all of the repeatable, generic things out of the box, such as setting up tooltips, color assignments, and label placements. Full documentation and examples can be found on [d3plus.org](https://d3plus.org/).

## ES Modules

Under the hood, D3plus is broken out into multiple packages based on the functionality offered by the exported code. These packages include:

* [@d3plus/react](https://www.npmjs.com/package/@d3plus/react)
* [@d3plus/core](https://www.npmjs.com/package/@d3plus/core)
* [@d3plus/color](https://www.npmjs.com/package/@d3plus/color)
* [@d3plus/data](https://www.npmjs.com/package/@d3plus/data)
* [@d3plus/dom](https://www.npmjs.com/package/@d3plus/dom)
* [@d3plus/export](https://www.npmjs.com/package/@d3plus/export)
* [@d3plus/format](https://www.npmjs.com/package/@d3plus/format)
* [@d3plus/locales](https://www.npmjs.com/package/@d3plus/locales)
* [@d3plus/math](https://www.npmjs.com/package/@d3plus/math)
* [@d3plus/text](https://www.npmjs.com/package/@d3plus/text)

For example, if you are interested in using the `formatAbbreviate` function used internally for prettifying numbers:

```sh
npm install @d3plus/format
```

You can then import named functions and classes as ES modules:

```js
import {formatAbbreviate} from "@d3plus/format";
```

## React Components

While the underlying library is written in JavaScript, we supply a wrapper package for rendering charts and components in a React environment:

```sh
npm install @d3plus/react
```

An _Object_ containing configuration information about the data and visual representation at hand then needs to be passed to the `config` prop of every visualization. The options available in this configuration _Object_ vary by visualization type, and the most commonly used methods are shown in the examples on this site. Full documentation of all available methods is available in each packages README file.

```jsx
import {Treemap} from "@d3plus/react";

const methods = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta",  value: 10}
  ],
  groupBy: "id",
  size: "value"
};

<Treemap config={methods} />
```

Additionally, a global set of styles can be set using the `D3plusContext` Provider. This allows you to set base styles on all of your visualizations in one place, often in an external file. A component's `config` set by props will override global defaults key-by-key using a deep cloning function.

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "@d3plus/react";
import App from "src/App.jsx";

const globalConfig = {
  title: "Shared Title for All Visualizations"
};

ReactDOM.createRoot(document.getElementById("viz")).render(
  <React.StrictMode>
    <D3plusContext.Provider value={globalConfig}>
      <App />
    </D3plusContext.Provider>
  </React.StrictMode>
);
```

## Script Tags

Additionally, each module is available from a CDN for vanilla JavaScript environments (bundled with all dependencies):

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/core"></script>
```

A global `d3plus` object is exported, which contains all of the available methods and classes:

```html
<script>
  new d3plus.Treemap()
    .config({
      data: [
        {id: "alpha", value: 29},
        {id: "beta",  value: 10}
      ],
      groupBy: "id",
      size: "value"
    })
    .render();
</script>
```
