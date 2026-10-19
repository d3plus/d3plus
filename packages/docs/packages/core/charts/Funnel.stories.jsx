// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Funnel} from "../../../args/core/charts/Funnel.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Funnel",
  component: Funnel,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a funnel chart from an array of data: one stage per row, in data\norder unless sort reorders them, drawn as a centered bar whose width encodes its value, with necks\njoining consecutive stages. Labels show each stage's name and value, plus\nany conversion rates conversion asks for; tooltips show the conversion\nfrom the first and the previous stage.",
      },
    },
  }
};

const Template = (args) => <Funnel config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const stages = [
  {id: "Visited Site", value: 12400},
  {id: "Viewed Pricing", value: 6900},
  {id: "Started Trial", value: 3100},
  {id: "Activated", value: 1850},
  {id: "Subscribed", value: 760},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: stages,
};
BasicExample.parameters = {controls: {include: ["stagePadding", "connector", "orient"]}, docs: {description: {story: "Each row is a stage, drawn in data order as a centered bar whose width encodes its value. Necks join consecutive stages; a label goes inside its stage when it fits, otherwise beside it."}}};

export const ConversionRates = Template.bind({});
ConversionRates.args = {
  data: stages,
  conversion: "first",
};
ConversionRates.parameters = {controls: {include: ["conversion", "valueFormat"]}, docs: {description: {story: "`conversion` adds each stage's conversion rate to its label: `\"first\"` (its share of the first stage), `\"previous\"` (its share of the stage before it), or `\"both\"`. Tooltips always show both rates."}}};

export const StraightSided = Template.bind({});
StraightSided.args = {
  data: stages,
  taper: true,
  stagePadding: 0.06,
  connector: false,
  conversion: "previous",
};
StraightSided.parameters = {controls: {include: ["taper", "stagePadding", "connector"]}, docs: {description: {story: "`taper` narrows each stage from its own width to the next stage's, drawing a continuous straight-sided funnel instead of flat bars."}}};

export const SmoothFunnel = Template.bind({});
SmoothFunnel.args = {
  data: stages,
  taper: true,
  curve: "smooth",
  stagePadding: 0.04,
};
SmoothFunnel.parameters = {controls: {include: ["curve", "taper", "stagePadding"]}, docs: {description: {story: "`curve(\"smooth\")` bends the funnel's sides through each stage's width without overshooting. Without `taper`, it curves only the necks between stages."}}};

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: stages,
  orient: "horizontal",
  conversion: "first",
};
Horizontal.parameters = {controls: {include: ["orient", "conversion"]}, docs: {description: {story: "`orient(\"horizontal\")` runs the stages left to right, with each stage's height encoding its value. Labels that don't fit inside a stage go below it."}}};

export const ColoredByPhase = Template.bind({});
ColoredByPhase.args = {
  data: [
    {phase: "Awareness", stage: "Impressions", value: 52000},
    {phase: "Awareness", stage: "Clicks", value: 21000},
    {phase: "Consideration", stage: "Product Views", value: 11800},
    {phase: "Consideration", stage: "Added to Cart", value: 4200},
    {phase: "Conversion", stage: "Checkout", value: 2600},
    {phase: "Conversion", stage: "Purchased", value: 1900},
  ],
  groupBy: ["phase", "stage"],
  conversion: "previous",
  connectorConfig: {fill: "#ced4da", opacity: 0.6},
};
ColoredByPhase.parameters = {controls: {include: ["groupBy", "connectorConfig"]}, docs: {description: {story: "With several `groupBy` levels, each row of the last level is a stage and the stages take their color from the first level, which the legend names. `connectorConfig` paints the necks."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: [
    ["Search", [9800, 5200, 2600, 1500, 690]],
    ["Social", [14200, 4900, 1700, 820, 240]],
    ["Email", [4300, 3100, 1900, 1350, 720]],
  ].flatMap(([channel, values]) =>
    values.map((value, i) => ({channel, id: stages[i].id, value})),
  ),
  facet: "channel",
  conversion: "first",
  valueFormat: funcify(d => d.toLocaleString(), "d => d.toLocaleString()"),
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig", "conversion"]}, docs: {description: {story: "`facet` draws one funnel per channel. By default each panel is sized to its own first stage, so conversion reads the same way in every panel."}}};

export const SharedWidthScale = Template.bind({});
SharedWidthScale.args = {
  ...SmallMultiples.args,
  facetConfig: {scales: "shared"},
};
SharedWidthScale.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "With `facetConfig: {scales: \"shared\"}`, every panel measures its stages against the widest stage across all panels, so the panels compare volume as well as shape."}}};

export const SortedStages = Template.bind({});
SortedStages.args = {
  data: [
    {id: "Activated", step: 4, value: 1850},
    {id: "Visited Site", step: 1, value: 12400},
    {id: "Subscribed", step: 5, value: 760},
    {id: "Viewed Pricing", step: 2, value: 6900},
    {id: "Started Trial", step: 3, value: 3100},
  ],
  sort: funcify((a, b) => a.step - b.step, "(a, b) => a.step - b.step"),
  conversion: "previous",
};
SortedStages.parameters = {controls: {include: ["sort", "conversion"]}, docs: {description: {story: "Stages draw in data order unless `sort` orders them, as a comparator over two rows. Conversion rates follow the drawn order, so \"% of previous\" compares each stage with the one above it."}}};
