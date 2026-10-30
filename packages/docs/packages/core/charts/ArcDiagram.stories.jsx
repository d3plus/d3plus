// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, ArcDiagram} from "../../../args/core/charts/ArcDiagram.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/ArcDiagram",
  component: ArcDiagram,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Places a network's nodes in a row along one line and draws each link as\nan arc between its two nodes, which shows the network's structure\nwithout a force layout's tangle, in an order you choose.",
      },
    },
  },
};

const Template = args => <ArcDiagram config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const crew = [
  {id: "Ada", team: "Design"},
  {id: "Ben", team: "Engineering"},
  {id: "Cleo", team: "Research"},
  {id: "Dev", team: "Engineering"},
  {id: "Eli", team: "Design"},
  {id: "Fay", team: "Research"},
  {id: "Gus", team: "Engineering"},
  {id: "Hana", team: "Design"},
  {id: "Ivo", team: "Research"},
  {id: "Jun", team: "Engineering"},
];
const meetings = [
  {source: "Ada", target: "Eli", count: 9},
  {source: "Ada", target: "Hana", count: 6},
  {source: "Eli", target: "Hana", count: 4},
  {source: "Ben", target: "Dev", count: 8},
  {source: "Ben", target: "Gus", count: 5},
  {source: "Dev", target: "Jun", count: 7},
  {source: "Gus", target: "Jun", count: 3},
  {source: "Cleo", target: "Fay", count: 6},
  {source: "Fay", target: "Ivo", count: 5},
  {source: "Ada", target: "Ben", count: 2},
  {source: "Hana", target: "Cleo", count: 3},
  {source: "Jun", target: "Ivo", count: 2},
  {source: "Eli", target: "Dev", count: 1},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  nodes: crew,
  links: meetings,
};
BasicExample.parameters = {
  controls: {include: ["nodes", "links", "orient", "arcSide"]},
  docs: {
    description: {
      story:
        "Takes the same `nodes` and `links` as Network. Nodes sit evenly along one line in their `nodes` order, and each link arcs between its two nodes: the farther apart the nodes, the taller the arc.",
    },
  },
};

export const SortByGroup = Template.bind({});
SortByGroup.args = {
  data: crew,
  nodes: crew,
  links: meetings,
  color: "team",
  nodeSort: "group",
  linkSize: funcify(d => d.count, "d => d.count"),
};
SortByGroup.parameters = {
  controls: {include: ["nodeSort", "color", "linkSize"]},
  docs: {
    description: {
      story:
        '`nodeSort: "group"` gathers each team together (by the `color` value, then by label), so links within a team draw as small, low arcs and the few links between teams stand out as the tall ones. `"label"`, `"degree"` (most connected first), or a comparator reorder the line too. `linkSize` sets each arc\'s thickness from the number of meetings.',
    },
  },
};

export const DirectedArrows = Template.bind({});
DirectedArrows.args = {
  nodes: [
    {id: "Plan"},
    {id: "Design"},
    {id: "Build"},
    {id: "Test"},
    {id: "Release"},
  ],
  links: [
    {source: "Plan", target: "Design"},
    {source: "Design", target: "Build"},
    {source: "Build", target: "Test"},
    {source: "Test", target: "Release"},
    {source: "Plan", target: "Build"},
    {source: "Design", target: "Release"},
  ],
  arrows: true,
};
DirectedArrows.parameters = {
  controls: {include: ["arrows", "arrowSize"]},
  docs: {
    description: {
      story:
        '`arrows` draws an arrowhead where each arc meets its target node (`"source"`, `"both"`, or an accessor pick other ends), pointing along the arc.',
    },
  },
};

export const BothSides = Template.bind({});
BothSides.args = {
  nodes: [
    {id: "Plan"},
    {id: "Design"},
    {id: "Build"},
    {id: "Test"},
    {id: "Review"},
    {id: "Release"},
  ],
  links: [
    {source: "Plan", target: "Design"},
    {source: "Design", target: "Build"},
    {source: "Build", target: "Test"},
    {source: "Test", target: "Review"},
    {source: "Review", target: "Release"},
    {source: "Test", target: "Build"},
    {source: "Review", target: "Design"},
    {source: "Release", target: "Plan"},
  ],
  arcSide: "both",
  arrows: true,
  linkColor: "source",
};
BothSides.parameters = {
  controls: {include: ["arcSide", "arrows", "linkColor"]},
  docs: {
    description: {
      story:
        '`arcSide: "both"` arcs each link running forward along the line above it, and each link running back below it, so loops back to earlier steps read apart from the forward flow. `linkColor: "source"` colors every arc like the node it leaves.',
    },
  },
};
