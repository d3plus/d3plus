// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Calendar} from "../../../args/core/charts/Calendar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Calendar",
  component: Calendar,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Draws one square cell per day in a calendar grid, each colored by its\ncolorScale value: weekdays down the side and weeks across, one block per\nyear, with month outlines and localized weekday, month, and year labels.",
      },
    },
  },
};

const Template = args => <Calendar config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

/**
    Deterministic daily activity from `start` through `end` (inclusive):
    busier on weekdays and in spring, with quiet days left out of the data.
*/
const activity = (start, end, repos = ["core"]) => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pad = n => String(n).padStart(2, "0");
  const rows = [];
  for (
    let d = new Date(...start);
    d <= new Date(...end);
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const season = 1 + 0.6 * Math.sin((d.getMonth() / 12) * Math.PI * 2);
    repos.forEach((repo, r) => {
      if (random() > (weekend ? 0.25 : 0.8) / (r + 1)) return;
      const commits = Math.max(
        1,
        Math.round(random() * 9 * season * (weekend ? 0.4 : 1)),
      );
      rows.push({date, repo, commits});
    });
  }
  return rows;
};

const twoYears = activity([2024, 0, 1], [2025, 11, 31]);
const oneYear = twoYears.filter(d => d.date >= "2025");

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: twoYears,
  colorScale: "commits",
  title: "Commits per day",
};
BasicExample.parameters = {
  controls: {include: ["colorScale", "date", "cellPadding", "cellRadius"]},
  docs: {
    description: {
      story:
        'Each row\'s `date` (a `Date`, timestamp, or `"YYYY-MM-DD"` string) places it in a cell, colored by its `colorScale` value. Every whole year the data touches gets its own block, stacked, with each month outlined. Days without data are drawn in a neutral fill.',
    },
  },
};

export const WeekStartAndOrientation = Template.bind({});
WeekStartAndOrientation.args = {
  data: oneYear,
  colorScale: "commits",
  orient: "vertical",
  weekStart: "monday",
  height: 700,
};
WeekStartAndOrientation.parameters = {
  controls: {include: ["orient", "weekStart"]},
  docs: {
    description: {
      story:
        '`orient: "vertical"` runs weeks down the page with weekdays across the top, and `weekStart: "monday"` begins each week on Monday. Without `weekStart`, weeks begin on the first day of the week in the `locale`\'s region.',
    },
  },
};

export const MonthGrid = Template.bind({});
MonthGrid.args = {
  data: oneYear.filter(d => d.date < "2025-07"),
  colorScale: "commits",
  period: "month",
};
MonthGrid.parameters = {
  controls: {include: ["period", "orient", "monthFormat"]},
  docs: {
    description: {
      story:
        '`period: "month"` draws each month as its own small wall calendar, arranged in whichever grid gives the largest cells. Titles use `"%B %Y"`, shortening when a block is too narrow.',
    },
  },
};

export const Localized = Template.bind({});
Localized.args = {
  data: oneYear,
  colorScale: "commits",
  locale: "es-ES",
};
Localized.parameters = {
  controls: {include: ["locale", "weekdayFormat", "monthFormat", "yearFormat"]},
  docs: {
    description: {
      story:
        "Weekday, month, and date names come from the `locale`, and so does the first day of the week: Monday in Spain. `weekdayFormat`, `monthFormat`, and `yearFormat` take any d3-time-format specifier, read in that locale.",
    },
  },
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
  data: oneYear,
  colorScale: "commits",
  colorScaleConfig: {color: ["#9be9a8", "#40c463", "#30a14e", "#216e39"]},
  cellPadding: 3,
  cellRadius: 0,
  emptyFill: "#ebedf0",
  monthOutline: false,
  weekdayFormat: false,
};
CustomStyling.parameters = {
  controls: {
    include: [
      "cellPadding",
      "cellRadius",
      "emptyFill",
      "monthOutline",
      "weekdayFormat",
    ],
  },
  docs: {
    description: {
      story:
        "Square cells with wider gaps, a fixed `emptyFill`, a four-step green `colorScaleConfig`, and the month outlines and weekday names turned off.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: activity([2025, 0, 1], [2025, 11, 31], ["core", "docs", "render"]),
  colorScale: "commits",
  facet: "repo",
  height: 600,
};
SmallMultiples.parameters = {
  controls: {include: ["facet", "facetConfig"]},
  docs: {
    description: {
      story:
        "`facet` draws one calendar per repo. The panels share one date range, so a day sits in the same cell in each, and one color scale.",
    },
  },
};
