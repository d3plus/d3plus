# D3plus

[![NPM version](https://img.shields.io/npm/v/@d3plus/core.svg)](https://www.npmjs.com/package/@d3plus/core)
[![License](https://img.shields.io/npm/l/d3plus.svg)](https://github.com/d3plus/d3plus/blob/main/LICENSE)

**Data visualization made easy.** An open-source TypeScript library that extends [D3](https://d3js.org/) to create beautiful, interactive SVG visualizations with minimal configuration. Tooltips, color assignments, label placements, and more — all handled automatically.

Full documentation and live examples: **[d3plus.org](https://d3plus.org/)**

## Quick Start

### React

```sh
npm install @d3plus/react
```

```tsx
import {Treemap} from "@d3plus/react";

const config = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta", value: 10},
  ],
  groupBy: "id",
  size: "value",
};

<Treemap config={config} />;
```

A global set of styles can be applied using the `D3plusContext` Provider. Per-component `config` props override globals on a key-by-key basis via deep merge.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "@d3plus/react";
import App from "src/App.jsx";

const globalConfig = {
  title: "Shared Title for All Visualizations",
};

ReactDOM.createRoot(document.getElementById("viz")).render(
  <React.StrictMode>
    <D3plusContext.Provider value={globalConfig}>
      <App />
    </D3plusContext.Provider>
  </React.StrictMode>,
);
```

### Vanilla JavaScript (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/core"></script>
<script>
  new d3plus.Treemap()
    .config({
      data: [
        {id: "alpha", value: 29},
        {id: "beta", value: 10},
      ],
      groupBy: "id",
      size: "value",
    })
    .render();
</script>
```

## Packages

D3plus is a modular monorepo — install only what you need:

| Package                                                          | Description                                      |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| [@d3plus/react](https://www.npmjs.com/package/@d3plus/react)     | React component wrappers for all chart types     |
| [@d3plus/core](https://www.npmjs.com/package/@d3plus/core)       | Charts, components, and shapes (the main engine) |
| [@d3plus/color](https://www.npmjs.com/package/@d3plus/color)     | Color scales, defaults, and utilities            |
| [@d3plus/data](https://www.npmjs.com/package/@d3plus/data)       | Data loading, filtering, and manipulation        |
| [@d3plus/dom](https://www.npmjs.com/package/@d3plus/dom)         | DOM and browser utility functions                |
| [@d3plus/export](https://www.npmjs.com/package/@d3plus/export)   | SVG and image export                             |
| [@d3plus/format](https://www.npmjs.com/package/@d3plus/format)   | Number and date formatting                       |
| [@d3plus/locales](https://www.npmjs.com/package/@d3plus/locales) | Translation dictionaries for i18n                |
| [@d3plus/math](https://www.npmjs.com/package/@d3plus/math)       | Math and geometry utilities                      |
| [@d3plus/text](https://www.npmjs.com/package/@d3plus/text)       | Text measurement, wrapping, and fitting          |
| [@d3plus/types](https://www.npmjs.com/package/@d3plus/types)     | Unified TypeScript type definitions              |

For example, to use just the number formatting:

```ts
import {formatAbbreviate} from "@d3plus/format";
```

To get all d3plus types in one import (useful for typing config objects or function parameters):

```ts
import type {Treemap, D3plusComponentProps} from "@d3plus/types";
```

## Accessibility

D3plus is built with accessibility in mind. Every visualization automatically includes ARIA attributes, semantic roles, and contextual screen reader labels tailored to each chart type. Features include optional SVG `<title>` and `<desc>` elements, inline data tables for assistive technology, color contrast utilities, and localized accessible text. See the [Accessibility](https://d3plus.org/?path=/docs/accessibility--docs) documentation for a full WCAG 2.1 AA conformance summary.

## Built with D3plus

[OEC.world](https://oec.world/) | [Data USA](https://datausa.io/) | [DataSaudi](https://datasaudi.sa/) | [Data Africa](https://dataafrica.io/) | [Puerto Rico Family Data Center](https://data.youthpr.org/en) | [COTEC Spain](https://complejidadeconomica.cotec.es/) | [CDC AR&PSP](https://arpsp.cdc.gov/) | [Healthy Communities NC](https://healthycommunitiesnc.org/) | [CNY Vitals Pro](https://pro.cnyvitals.org/) | [DataMPE Brasil](https://datampe.sebrae.com.br/) | [Estonia Statistics](https://data.stat.ee/profile/country/ee/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, development workflow, and guidelines for submitting pull requests.

## License

[MIT](LICENSE)
