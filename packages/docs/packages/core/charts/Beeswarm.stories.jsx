// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Beeswarm} from "../../../args/core/charts/Beeswarm.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Beeswarm",
  component: Beeswarm,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a beeswarm from an array of data: each circle sits at its value along one axis, packed beside its neighbors so none overlap.",
      },
    },
  }
};

const Template = (args) => <Beeswarm config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {Plot} from "../../../args/core/charts/Plot.args";
import datafy from "../../../helpers/datafy";

// Seeded country-like rows, written as a self-contained expression so each
// story's "Show code" snippet prints this generator rather than every row.
const countries = datafy(`(() => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  return Array.from({length: 180}, (_, i) => {
    const region = regions[i % 5];
    const income = Math.round(Math.exp(8.6 + 0.3 * (i % 5) + 0.8 * normal()));
    return {
      country: "Country " + (i + 1),
      region,
      "GDP per Capita": income,
      "Life Expectancy": Math.round((48 + 3 * Math.log(income) + 2.5 * normal()) * 10) / 10,
      Population: Math.round(Math.exp(15.5 + 1.3 * normal())),
    };
  });
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: countries,
  groupBy: "country",
  x: "Life Expectancy",
};
BasicExample.parameters = {controls: {include: ["x", "swarmConfig"]}, docs: {description: {story: "Each circle sits at its value along `x` and is nudged up or down just far enough to clear its neighbors, so dense values pile up into a shape that reads like a distribution while every point stays visible. The layout is deterministic: the same data always draws the same swarm."}}};

export const CategoryLanes = Template.bind({});
CategoryLanes.args = {
  data: countries,
  groupBy: "country",
  color: "region",
  x: "Life Expectancy",
  y: "region",
};
CategoryLanes.parameters = {controls: {include: ["x", "y", "color"]}, docs: {description: {story: "Set the other axis to a categorical key and each category gets its own swarm, centered on its band. Swap `x` and `y` for vertical swarms."}}};

export const VerticalLanes = Template.bind({});
VerticalLanes.args = {
  data: countries,
  groupBy: "country",
  color: "region",
  x: "region",
  y: "Life Expectancy",
};
VerticalLanes.parameters = {controls: {include: ["x", "y"]}, docs: {description: {story: "With a numeric `y` and a categorical `x`, the swarms run vertically."}}};

export const SizedCircles = Template.bind({});
SizedCircles.args = {
  data: countries,
  groupBy: "country",
  color: "region",
  size: "Population",
  x: "GDP per Capita",
  y: "region",
};
SizedCircles.parameters = {controls: {include: ["size", "sizeMin", "sizeMax", "swarmConfig"]}, docs: {description: {story: "A `size` accessor scales each circle, and the packing respects every radius. When a swarm is too tall for its band, `swarmConfig.overflow` decides what gives: `\"shrink\"` (default) scales all circles down together, `\"clamp\"` keeps their sizes and holds the outliers at the band's edge, and `\"visible\"` lets the swarm spill over."}}};

export const ScatterToSwarm = {
  render: () => {
    const [swarm, setSwarm] = React.useState(false);
    return (
      <div>
        <button onClick={() => setSwarm(!swarm)} style={{marginBottom: "12px", font: "inherit", padding: "4px 12px"}}>
          {swarm ? "Show scatter" : "Show beeswarm"}
        </button>
        <div style={{height: "400px"}}>
          <Plot config={{
            data: countries,
            groupBy: "country",
            color: "region",
            x: "GDP per Capita",
            y: "Life Expectancy",
            swarm,
            duration: 800,
            shapeConfig: {Circle: {trail: false}},
          }} />
        </div>
      </div>
    );
  },
  parameters: {
    controls: {disable: true},
    docs: {
      description: {story: "`swarm` is a Plot option, so one chart can switch between a scatter and a beeswarm. Each circle keeps its id, so it glides from its scatter position into the swarm and back. With `swarm` on, the y values are ignored and the y axis steps aside. Plot circles leave motion trails when they move; `shapeConfig.Circle.trail: false` turns them off for a clean glide."},
      source: {code: `import {Plot} from "@d3plus/react";
import {useState} from "react";

const data = ${countries.__source};

function ScatterToSwarm() {
  const [swarm, setSwarm] = useState(false);
  return (
    <div>
      <button onClick={() => setSwarm(!swarm)}>
        {swarm ? "Show scatter" : "Show beeswarm"}
      </button>
      <Plot config={{
        data,
        groupBy: "country",
        color: "region",
        x: "GDP per Capita",
        y: "Life Expectancy",
        swarm,
        duration: 800,
        shapeConfig: {Circle: {trail: false}},
      }} />
    </div>
  );
}`}
    }
  }
};
