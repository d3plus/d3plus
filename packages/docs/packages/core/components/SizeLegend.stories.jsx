// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, SizeLegend} from "../../../args/core/components/SizeLegend.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/SizeLegend",
  component: SizeLegend,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A nested-circle legend for a size scale: concentric circles sharing a\nbottom tangent, each labeled with the value its radius encodes.\n\nCharts that size marks by a size accessor (bubble plots, Geomap points,\nNetwork, Rings) draw one automatically in their bottom-right corner (see\nsizeLegend and sizeLegendConfig on the chart). On its own, give it\nany d3 continuous scale that maps values to pixel radii.",
      },
    },
  }
};

const Template = (args) => <SizeLegend config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

/** A square-root radius scale over `domain` onto `range`, the shape d3's `scaleSqrt` has. */
const sqrtScale = (domain, range, label) => {
  const [d0, d1] = domain.map(Math.sqrt);
  const scale = v => range[0] + ((Math.sqrt(v) - d0) / (d1 - d0)) * (range[1] - range[0]);
  scale.domain = () => domain;
  scale.invert = r => ((r - range[0]) / (range[1] - range[0]) * (d1 - d0) + d0) ** 2;
  return funcify(scale, label);
};

export const BasicExample = Template.bind({});
BasicExample.args = {
  scale: sqrtScale([10, 1000], [4, 40], "d3.scaleSqrt().domain([10, 1000]).range([4, 40])"),
  title: "Population"
};
BasicExample.parameters = {controls: {include: ["title"]}, docs: {description: {story: "Give `scale` any d3 continuous scale that maps values to pixel radii. By default the legend draws three concentric circles, for the domain's minimum, its maximum, and a round value in between. The circles share a bottom edge, and a short leader line runs from the top of each circle to its label, under a centered title."}}};

export const CustomValues = Template.bind({});
CustomValues.args = {
  scale: sqrtScale([0, 5000000], [0, 36], "d3.scaleSqrt().domain([0, 5e6]).range([0, 36])"),
  values: [5000000, 2500000, 1000000, 250000],
  tickFormat: funcify(
    d => `$${d / 1e6}M`,
    "d => `$${d / 1e6}M`"
  ),
  title: "Annual Revenue"
};
CustomValues.parameters = {controls: {include: ["values", "tickFormat", "title"]}, docs: {description: {story: "`values` picks which circles to draw: an array of values, or a number for how many to pick automatically. `tickFormat` formats each label; by default labels use the locale's abbreviated number format. Labels that would overlap, like those of the two smallest circles here, are pushed apart."}}};

export const Styled = Template.bind({});
Styled.args = {
  scale: sqrtScale([1, 100], [3, 30], "d3.scaleSqrt().domain([1, 100]).range([3, 30])"),
  shapeConfig: {fill: "#4269d0", fillOpacity: 0.15, stroke: "#4269d0", strokeWidth: 1.5},
  lineConfig: {stroke: "#4269d0", strokeDasharray: [2, 2]},
  labelConfig: {fontColor: "#4269d0", fontSize: 12},
  title: "Score",
  titleConfig: {fontColor: "#4269d0"}
};
Styled.parameters = {controls: {include: ["shapeConfig", "lineConfig", "labelConfig", "titleConfig"]}, docs: {description: {story: "`shapeConfig` styles the circles, `lineConfig` the leader lines, and `labelConfig`/`titleConfig` the text. Each object is merged into the defaults, so you only set what you want to change."}}};
