// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Chord} from "../../../args/core/charts/Chord.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Chord",
  component: Chord,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a Chord diagram based on a defined set of nodes and links. Groups are laid out as arcs around a circle and connected by ribbons sized by the flow between them.",
      },
    },
  }
};

const Template = (args) => <Chord config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "beta", target: "gamma"},
    {source: "gamma", target: "alpha"},
    {source: "delta", target: "alpha"}
  ]
};
BasicExample.parameters = {controls: {include: ["links"]}, docs: {description: {story: "Supplying only `links` lets the layout infer every node from the `source`/`target` ids and draw a ribbon for each directed flow."}}};

export const WeightedFlows = Template.bind({});
WeightedFlows.args = {
  value: "value",
  links: [
    {source: "Group A", target: "Group B", value: 30},
    {source: "Group A", target: "Group C", value: 20},
    {source: "Group B", target: "Group C", value: 25},
    {source: "Group C", target: "Group A", value: 15},
    {source: "Group B", target: "Group A", value: 10}
  ]
};
WeightedFlows.parameters = {controls: {include: ["value"]}, docs: {description: {story: "Each link's `value` sizes its ribbon and the arcs it attaches to, so flows are weighted by magnitude."}}};

export const Undirected = Template.bind({});
Undirected.args = {
  directed: false,
  value: "value",
  links: [
    {source: "A", target: "B", value: 5},
    {source: "B", target: "A", value: 4},
    {source: "B", target: "C", value: 2},
    {source: "C", target: "A", value: 3}
  ]
};
Undirected.parameters = {controls: {include: ["directed"]}, docs: {description: {story: "`directed(false)` uses the classic `d3.chord` layout, merging both directions of a pair into a single ribbon — best for symmetric or co-occurrence matrices. Note: an undirected group's arc size is its *outgoing* total only (`d3.chord`'s own convention) — a node with links only ever pointing *into* it gets a zero-width arc, so give every node at least one outgoing entry."}}};

export const WithArrows = Template.bind({});
WithArrows.args = {
  arrows: "target",
  value: "value",
  links: [
    {source: "alpha", target: "beta", value: 8},
    {source: "beta", target: "gamma", value: 5},
    {source: "gamma", target: "alpha", value: 6},
    {source: "alpha", target: "gamma", value: 3}
  ]
};
WithArrows.parameters = {controls: {include: ["arrows", "arrowSize"]}, docs: {description: {story: "`arrows` adds a `d3.ribbonArrow` head to the target end of every ribbon, making flow direction explicit. Unlike Network/Sankey, Chord can't put an arrowhead on the source end alone — `arrows(\"source\")` is a no-op; use `true`, `\"target\"`, or `\"both\"`."}}};

export const SelfLoop = Template.bind({});
SelfLoop.args = {
  value: "value",
  links: [
    {source: "Internal", target: "Internal", value: 12},
    {source: "Internal", target: "External", value: 5},
    {source: "External", target: "Internal", value: 3}
  ]
};
SelfLoop.parameters = {controls: {include: ["links"]}, docs: {description: {story: "A link whose `source` and `target` are the same node writes to the diagonal of the flow matrix, drawing a ribbon that leaves and re-enters its own arc — useful for a group's within-group (reflexive) flow alongside its flows to other groups."}}};

export const ArcThickness = Template.bind({});
ArcThickness.args = {
  arcThickness: 45,
  value: "value",
  links: [
    {source: "alpha", target: "beta", value: 5},
    {source: "alpha", target: "gamma", value: 3},
    {source: "beta", target: "gamma", value: 2},
    {source: "gamma", target: "alpha", value: 4}
  ]
};
ArcThickness.parameters = {controls: {include: ["arcThickness"]}, docs: {description: {story: "`arcThickness` sets the pixel width of the group arcs (default `20`); the ribbons' inner radius follows automatically, so a thicker band leaves less room for the chords."}}};

export const RibbonOpacity = Template.bind({});
RibbonOpacity.args = {
  chordOpacity: 0.2,
  value: "value",
  links: [
    {source: "alpha", target: "beta", value: 5},
    {source: "alpha", target: "gamma", value: 4},
    {source: "alpha", target: "delta", value: 3},
    {source: "beta", target: "gamma", value: 6},
    {source: "beta", target: "delta", value: 2},
    {source: "gamma", target: "delta", value: 5}
  ]
};
RibbonOpacity.parameters = {controls: {include: ["chordOpacity"]}, docs: {description: {story: "`chordOpacity` sets the fill opacity of every ribbon (default `0.6`). Lowering it helps a dense diagram stay readable where many ribbons overlap near the center."}}};

export const GroupSpacing = Template.bind({});
GroupSpacing.args = {
  padAngle: 0.06,
  value: "value",
  links: [
    {source: "alpha", target: "beta", value: 5},
    {source: "alpha", target: "gamma", value: 3},
    {source: "beta", target: "gamma", value: 2},
    {source: "gamma", target: "alpha", value: 4},
    {source: "delta", target: "alpha", value: 6}
  ]
};
GroupSpacing.parameters = {controls: {include: ["padAngle", "padPixel"]}, docs: {description: {story: "`padAngle` sets a fixed radian gap between adjacent group arcs, overriding the automatic gap `padPixel` (default `2`) would otherwise derive from the chart's radius — useful for a consistent gap across charts of different sizes."}}};

export const CustomNodeIdentifiers = Template.bind({});
CustomNodeIdentifiers.args = {
  nodeId: "key",
  label: d => d.name,
  value: "value",
  nodes: [
    {key: "eng", name: "Engineering"},
    {key: "sls", name: "Sales"},
    {key: "sup", name: "Support"},
    {key: "ops", name: "Operations"}
  ],
  links: [
    {source: "eng", target: "sup", value: 6},
    {source: "sls", target: "sup", value: 4},
    {source: "sup", target: "eng", value: 3}
  ]
};
CustomNodeIdentifiers.parameters = {controls: {include: ["nodes", "nodeId"]}, docs: {description: {story: "`nodeId` points at whatever key identifies a node — here `\"key\"` instead of the default `\"id\"` — so `links` can reference nodes by that same value. It only governs matching, though: the drawn label still defaults to reading `id`, so a custom `nodeId` needs an explicit `label` accessor (here `d => d.name`) alongside it. Supplying `nodes` explicitly (rather than letting them be inferred from `links`) also lets a node with no flows at all, like `\"Operations\"`, still get drawn as an empty arc."}}};
