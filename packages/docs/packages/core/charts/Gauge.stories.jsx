// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Gauge} from "../../../args/core/charts/Gauge.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Gauge",
  component: Gauge,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a gauge (speedometer) from an array of data: a single dial that\nreads each row's value against its domain. One row shows its value\nunder the hub; several rows each get a needle (or a progress track),\nidentified by the legend and tooltips.",
      },
    },
  }
};

const Template = (args) => <Gauge config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const bands = [
  {max: 60, color: "#2f9e44"},
  {max: 85, color: "#f59f00"},
  {color: "#e03131"},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [{id: "Speed", value: 72}],
  domain: [0, 100],
};
BasicExample.parameters = {controls: {include: ["domain", "startAngle", "endAngle", "thickness"]}, docs: {description: {story: "Each row becomes a dial that reads its `value` against `domain`. The default 240° sweep (`startAngle` -120 to `endAngle` 120) leaves room for the value under the needle's hub."}}};

export const Bands = Template.bind({});
Bands.args = {
  data: [{id: "Engine Temperature", value: 78}],
  domain: [0, 100],
  bands,
};
Bands.parameters = {controls: {include: ["bands", "ticks", "minorTicks"]}, docs: {description: {story: "`bands` paints colored zones along the track. Each band ends at its `max` and starts where the previous one ended, so a list of thresholds is enough."}}};

export const ProgressArc = Template.bind({});
ProgressArc.args = {
  data: [{id: "CPU", value: 64}],
  domain: [0, 100],
  bands,
  indicator: "progress",
  valueFormat: funcify(d => `${d}%`, "d => `${d}%`"),
};
ProgressArc.parameters = {controls: {include: ["indicator", "valueFormat", "thickness"]}, docs: {description: {story: "`indicator(\"progress\")` fills the track up to the value instead of pointing a needle at it; bands move to a thin strip inside the track."}}};

export const MultipleNeedles = Template.bind({});
MultipleNeedles.args = {
  data: [
    {id: "North", value: 42},
    {id: "South", value: 77},
    {id: "East", value: 120},
    {id: "West", value: -5},
  ],
  domain: [0, 100],
  bands,
};
MultipleNeedles.parameters = {controls: {include: ["domain", "color"]}, docs: {description: {story: "Several rows share one dial, with a needle per row in the row's color. The legend names each needle and its tooltip gives the value. Values outside the domain pin the needle to the nearest end."}}};

export const ConcentricTracks = Template.bind({});
ConcentricTracks.args = {
  data: [
    {id: "Memory", value: 48},
    {id: "CPU", value: 72},
    {id: "Disk", value: 91},
  ],
  domain: [0, 100],
  bands,
  indicator: "progress",
};
ConcentricTracks.parameters = {controls: {include: ["indicator", "thickness"]}, docs: {description: {story: "With `indicator(\"progress\")`, each row gets its own track, stepping inward from the outer edge in data order."}}};

export const Semicircle = Template.bind({});
Semicircle.args = {
  data: [{id: "Pressure", value: 3.4}],
  startAngle: -90,
  endAngle: 90,
  ticks: 4,
};
Semicircle.parameters = {controls: {include: ["startAngle", "endAngle", "ticks"]}, docs: {description: {story: "`startAngle` and `endAngle` set the sweep in degrees clockwise from 12 o'clock. Without a `domain`, the range comes from the data, rounded out to line up with the ticks."}}};
