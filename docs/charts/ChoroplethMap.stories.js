import React from "react";
import {argTypes, Geomap as Viz} from "../args/Geomap.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Charts/Choropleth Map",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: "https://datausa.io/api/data?measure=Diabetes%20Prevalence&drilldowns=State&Year=2021",
  groupBy: "ID State",
  colorScale: "Diabetes Prevalence",
  colorScaleConfig: {
    axisConfig: {
      tickFormat: funcify(
        d => `${(d * 100).toFixed(1)}%`,
        "d =>`${(d * 100).toFixed(1)}%`"
      )
    }
  },
  projection: "geoAlbersUsa",
  topojson: "https://datausa.io/topojson/State.json"
};
