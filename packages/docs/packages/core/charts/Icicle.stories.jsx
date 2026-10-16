// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Icicle} from "../../../args/core/charts/Icicle.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Icicle",
  component: Icicle,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Draws a hierarchy as nested rectangles, one band per groupBy level from\nthe root edge out, where each node's breadth is proportional to its summed\nvalue. Click a rectangle to zoom into it; click the root band (or Back) to\nzoom out.",
      },
    },
  }
};

const Template = (args) => <Icicle config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const codebase = [
  {area: "Frontend", module: "Components", file: "Button", size: 120},
  {area: "Frontend", module: "Components", file: "Modal", size: 240},
  {area: "Frontend", module: "Components", file: "Table", size: 410},
  {area: "Frontend", module: "Components", file: "Tooltip", size: 90},
  {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
  {area: "Frontend", module: "Pages", file: "Settings", size: 180},
  {area: "Frontend", module: "Pages", file: "Profile", size: 140},
  {area: "Frontend", module: "Styles", file: "Theme", size: 60},
  {area: "Frontend", module: "Styles", file: "Layout", size: 45},
  {area: "Backend", module: "API", file: "Users", size: 330},
  {area: "Backend", module: "API", file: "Orders", size: 460},
  {area: "Backend", module: "API", file: "Search", size: 210},
  {area: "Backend", module: "Database", file: "Migrations", size: 380},
  {area: "Backend", module: "Database", file: "Models", size: 290},
  {area: "Backend", module: "Jobs", file: "Email", size: 70},
  {area: "Backend", module: "Jobs", file: "Reports", size: 150},
  {area: "Infrastructure", module: "CI", file: "Pipelines", size: 95},
  {area: "Infrastructure", module: "CI", file: "Caching", size: 30},
  {area: "Infrastructure", module: "Deploy", file: "Containers", size: 160},
  {area: "Infrastructure", module: "Deploy", file: "Terraform", size: 210},
  {area: "Docs", module: "Guides", file: "Getting Started", size: 85},
  {area: "Docs", module: "Guides", file: "Theming", size: 40},
  {area: "Docs", module: "Reference", file: "API Reference", size: 260},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 1", id: "beta", value: 10},
    {parent: "Group 1", id: "gamma", value: 2},
    {parent: "Group 2", id: "delta", value: 29},
    {parent: "Group 2", id: "eta", value: 25},
  ],
  groupBy: ["parent", "id"],
  sum: "value",
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "sum"]},
  docs: {
    description: {
      story:
        "Each `groupBy` level is a band of rectangles, from the root edge out. A rectangle's breadth is proportional to its `sum`, so a parent spans exactly its children, and children inherit their top-level group's color.",
    },
  },
};

export const MultiLevel = Template.bind({});
MultiLevel.args = {
  data: codebase,
  groupBy: ["area", "module", "file"],
  sum: "size",
};
MultiLevel.parameters = {
  controls: {include: ["groupBy", "depth"]},
  docs: {
    description: {
      story:
        "A three-level `groupBy` draws three bands. Each branch keeps its top-level color, a step lighter per level. Labels appear only where their whole words fit, upright or turned to run up a tall, narrow rectangle. Hover a rectangle to highlight it with its ancestors.",
    },
  },
};

export const Vertical = Template.bind({});
Vertical.args = {
  data: codebase,
  groupBy: ["area", "module", "file"],
  sum: "size",
  orient: "vertical",
};
Vertical.parameters = {
  controls: {include: ["orient"]},
  docs: {
    description: {
      story:
        '`orient: "vertical"` puts the root on top, with each level below it. Narrow columns turn their labels to read upward.',
    },
  },
};

export const DrillDown = Template.bind({});
DrillDown.args = {
  data: codebase,
  groupBy: ["area", "module", "file"],
  sum: "size",
  depth: 1,
};
DrillDown.parameters = {
  controls: {include: ["depth"]},
  docs: {
    description: {
      story:
        "Click a rectangle to zoom into it: it moves into the root band and its descendants fill the full breadth. Click the root band, or the Back button, to zoom out. With `depth` limiting the visible levels, zooming slides that window outward, so deeper levels come into view.",
    },
  },
};

export const SmallDataThreshold = Template.bind({});
SmallDataThreshold.args = {
  data: codebase,
  groupBy: ["area", "module", "file"],
  sum: "size",
  threshold: 0.03,
  thresholdName: "Files",
};
SmallDataThreshold.parameters = {
  controls: {include: ["threshold", "thresholdName"]},
  docs: {
    description: {
      story:
        "`threshold: 0.03` merges the files below 3% of the total within each module into one bucket labeled by `thresholdName`, keeping slivers from cluttering the last level.",
    },
  },
};

export const Shading = Template.bind({});
Shading.args = {
  data: codebase,
  groupBy: ["area", "module", "file"],
  sum: "size",
  shadeConfig: {step: 0.3, max: 0.5},
};
Shading.parameters = {
  controls: {include: ["shade", "shadeConfig"]},
  docs: {
    description: {
      story:
        "`shadeConfig` sets how much each level lightens (`step`), up to `max`; `shade: false` draws every rectangle in its branch's flat color. Shading applies only to the default colors, so a custom `color` or `colorScale` is drawn as given.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: codebase,
  groupBy: ["module", "file"],
  sum: "size",
  facet: "area",
};
SmallMultiples.parameters = {
  controls: {include: ["facet"]},
  docs: {
    description: {
      story:
        '`facet: "area"` draws one Icicle per area as small multiples, each laid out the way the whole chart is.',
    },
  },
};
