// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, FanChart} from "../../../args/core/charts/FanChart.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/FanChart",
  component: FanChart,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Creates a fan chart from an array of data: a line per series with nested\nconfidence bands around it, outermost first, shaded from the widest\n(lightest) to the narrowest (darkest). The bands open from the last point\nbefore they spread away from the line, and the stretch after it is marked\nas a forecast: a shaded backdrop, a rule at its start, a "Forecast" label,\nand a dashed line (see forecast and forecastConfig).',
      },
    },
  },
};

const Template = args => <FanChart config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Seeded quarterly forecasts, written as a self-contained expression so each
// story's "Show code" snippet prints this generator rather than every row.
// Actuals run through Q4 2024; after that each row carries three nested
// intervals that widen with the forecast horizon.
const forecasts = datafy(`(() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const series = [["CPI Inflation", 2.4, -0.06, 0.55, "Inflation"], ["Core Inflation", 2.9, -0.08, 0.4, "Inflation"], ["GDP Growth", 1.8, 0.03, 0.7, "Growth"], ["Unemployment", 4.1, 0.02, 0.3, "Growth"]];
  const rows = [];
  series.forEach(([id, level, drift, spread, topic]) => {
    let value = level;
    for (let k = 0; k < 36; k++) {
      const date = (2019 + Math.floor(k / 4)) + "-" + String((k % 4) * 3 + 1).padStart(2, "0") + "-01";
      const h = k - 23;
      value = h <= 0 ? value + (random() - 0.5) * 0.9 : value + drift;
      const row = {id, topic, date, value: Math.round(value * 100) / 100};
      if (h >= 0) {
        const w = spread * Math.sqrt(h);
        row.p05 = Math.round((row.value - 1.645 * w) * 100) / 100;
        row.p95 = Math.round((row.value + 1.645 * w * 1.15) * 100) / 100;
        row.p20 = Math.round((row.value - 0.842 * w) * 100) / 100;
        row.p80 = Math.round((row.value + 0.842 * w * 1.15) * 100) / 100;
        row.p35 = Math.round((row.value - 0.385 * w) * 100) / 100;
        row.p65 = Math.round((row.value + 0.385 * w * 1.15) * 100) / 100;
      }
      rows.push(row);
    }
  });
  return rows;
})()`);

const inflation = forecasts.filter(d => d.id === "CPI Inflation");

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: inflation,
  groupBy: "id",
  x: "date",
  time: "date",
  y: "value",
  confidence: [
    ["p05", "p95", "90%"],
    ["p20", "p80", "60%"],
    ["p35", "p65", "30%"],
  ],
  legend: false,
  timeline: false,
};
BasicExample.parameters = {
  controls: {include: ["confidence", "confidenceConfig", "forecast"]},
  docs: {
    description: {
      story:
        "Pass `confidence` a list of `[lower, upper, label]` bands, outermost first. Each band fans out from the last actual point, the widest drawn lightest and the narrowest darkest. The forecast stretch gets a shaded backdrop, a rule at its start, and a dashed line, and hovering a forecast point lists every band's range under its label.",
    },
  },
};

export const SeveralSeries = Template.bind({});
SeveralSeries.args = {
  data: forecasts.filter(d => d.topic === "Inflation"),
  groupBy: "id",
  x: "date",
  time: "date",
  y: "value",
  confidence: [
    ["p05", "p95", "90%"],
    ["p35", "p65", "30%"],
  ],
  timeline: false,
};
SeveralSeries.parameters = {
  controls: {include: ["confidence"]},
  docs: {
    description: {
      story:
        "Every series draws its own fan in its own color. The shared tooltip follows each series' value with the range of its outermost band.",
    },
  },
};

export const ExplicitForecastStart = Template.bind({});
ExplicitForecastStart.args = {
  data: inflation,
  groupBy: "id",
  x: "date",
  time: "date",
  y: "value",
  confidence: ["p20", "p80"],
  forecast: "2025-01-01",
  forecastConfig: {lineDasharray: false},
  legend: false,
  timeline: false,
};
ExplicitForecastStart.parameters = {
  controls: {include: ["confidence", "forecast", "forecastConfig"]},
  docs: {
    description: {
      story:
        "A single `[lower, upper]` pair draws one band, exactly as it does on a LinePlot. Set `forecast` to a value on the discrete axis (here a date) to start the forecast there instead of where the bands open, and `forecastConfig.lineDasharray: false` keeps the line solid.",
    },
  },
};

export const OpacityRamp = Template.bind({});
OpacityRamp.args = {
  data: inflation,
  groupBy: "id",
  x: "date",
  time: "date",
  y: "value",
  color: funcify(() => "#c0392b", '() => "#c0392b"'),
  confidence: [
    ["p05", "p95", "90%"],
    ["p20", "p80", "60%"],
    ["p35", "p65", "30%"],
  ],
  confidenceConfig: {bandOpacity: [0.08, 0.3, 0.75]},
  forecastConfig: {
    fill: "#c0392b",
    fillOpacity: 0.04,
    label: "Projection",
    stroke: "#c0392b",
  },
  legend: false,
  timeline: false,
};
OpacityRamp.parameters = {
  controls: {include: ["confidenceConfig", "forecastConfig"]},
  docs: {
    description: {
      story:
        "`confidenceConfig.bandOpacity` sets the ramp: how dark each band looks where it is the innermost band drawn, from the outermost band to the innermost. A number gives every band the same opacity. `forecastConfig` styles the backdrop, the rule, the label, and the dash of each line's forecast stretch.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: forecasts,
  groupBy: "id",
  facet: "id",
  facetConfig: {columns: 2},
  x: "date",
  time: "date",
  y: "value",
  confidence: [
    ["p05", "p95", "90%"],
    ["p20", "p80", "60%"],
    ["p35", "p65", "30%"],
  ],
  legend: false,
  timeline: false,
};
SmallMultiples.parameters = {
  controls: {include: ["facet", "facetConfig"]},
  docs: {
    description: {
      story:
        "With `facet`, each panel draws its own fan and forecast backdrop on a shared value axis.",
    },
  },
};
