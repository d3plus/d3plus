// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Ridgeline} from "../../../args/core/charts/Ridgeline.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Ridgeline",
  component: Ridgeline,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a ridgeline (joyplot) from an array of raw observations: the value of each row is summarized per group as a kernel density estimate, and each group's curve rises from its own baseline down the y axis, sharing the x axis. overlap sets how far ridges rise into the ones above; medianSort orders them by median.",
      },
    },
  }
};

const Template = (args) => <Ridgeline config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Seeded daily temperatures, written as a self-contained expression so each
// story's "Show code" snippet prints this generator rather than every row.
const weather = datafy(`(() => {
  let seed = 23;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const cities = [["Lincoln", 12, 14, 6], ["Seattle", 12, 6, 3.5]];
  return cities.flatMap(([city, mean, swing, sd]) =>
    months.flatMap((month, m) =>
      Array.from({length: 30}, (_, day) => ({
        city,
        month,
        day: day + 1,
        "Mean Temperature (°C)": Math.round((mean - swing * Math.cos((2 * Math.PI * (m + 0.5)) / 12) + sd * normal()) * 10) / 10,
      })),
    ),
  );
})()`);

// Seeded track lengths: some genres mix a short and a long format.
const tracks = datafy(`(() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const genres = ["Ambient", "Blues", "Classical", "Country", "Electronic", "Folk", "Jazz", "Metal", "Pop", "Rock"];
  return genres.flatMap((genre, g) =>
    Array.from({length: 80}, (_, i) => {
      const long = g % 3 === 0 && random() < 0.35;
      const minutes = 3 + (g % 4) * 0.6 + (long ? 4 : 0) + (0.6 + (g % 3) * 0.3) * normal();
      return {genre, track: genre + " " + (i + 1), "Length (minutes)": Math.round(Math.max(0.5, minutes) * 10) / 10};
    }),
  );
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: weather.filter(d => d.city === "Lincoln"),
  groupBy: "month",
  legend: false,
  value: "Mean Temperature (°C)",
};
BasicExample.parameters = {controls: {include: ["value", "overlap", "densityScale", "densityConfig"]}, docs: {description: {story: "Each group's `value`s become a kernel density estimate rising from the group's baseline, the first group on top. Ridges share the x axis, so a year of daily temperatures reads as one shifting shape. Hover a ridge for its observation count and quartiles."}}};

export const SortedByMedian = Template.bind({});
SortedByMedian.args = {
  data: tracks,
  groupBy: "genre",
  legend: false,
  medianSort: "descending",
  value: "Length (minutes)",
};
SortedByMedian.parameters = {controls: {include: ["medianSort"]}, docs: {description: {story: "`medianSort` orders the ridges by median, `\"descending\"` putting the longest tracks on top. Genres that mix two formats show two peaks."}}};

export const LowOverlap = Template.bind({});
LowOverlap.args = {
  data: tracks,
  densityScale: "width",
  groupBy: "genre",
  legend: false,
  overlap: 0.9,
  value: "Length (minutes)",
};
LowOverlap.parameters = {controls: {include: ["overlap", "densityScale"]}, docs: {description: {story: "`overlap` is how far the tallest ridge rises, in rows: below 1 every ridge stays in its own row. `densityScale: \"width\"` scales each ridge to its own peak, so every ridge reaches the same height."}}};

export const TwoSeriesPerRow = Template.bind({});
TwoSeriesPerRow.args = {
  color: "city",
  data: weather,
  groupBy: ["month", "city"],
  shapeConfig: {Area: {fillOpacity: 0.6}},
  value: "Mean Temperature (°C)",
};
TwoSeriesPerRow.parameters = {controls: {include: ["groupBy", "color", "shapeConfig"]}, docs: {description: {story: "With two `groupBy` levels, the first picks the row and the second overlays one ridge per series within it. Lower `fillOpacity` keeps both visible."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: weather,
  facet: "city",
  groupBy: "month",
  legend: false,
  value: "Mean Temperature (°C)",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws one panel per city, sharing the temperature axis so the panels compare directly."}}};
