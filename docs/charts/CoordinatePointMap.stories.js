import React from "react";
import {argTypes, Geomap as Viz} from "../args/Geomap.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Charts/Coordinate Point Map",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: "/data/city_coords.json",
  groupBy: "slug",
  colorScale: "dma_code",
  label: funcify(
    d => d.city + ", " + d.region,
    `d => d.city + ", " + d.region`
  ),
  point: funcify(
    d => [d.longitude, d.latitude],
    "d => [d.longitude, d.latitude]"
  ),
  pointSize: funcify(
    d => d.dma_code,
    "d => d.dma_code"
  ),
  pointSizeMin: 1,
  pointSizeMax: 10
};
