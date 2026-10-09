// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/date.args";
import {date} from "@d3plus/dom";

export default {
  title: "Dom/date",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Parses numbers and strings into valid JavaScript Date objects, supporting years, quarters, months, and ISO 8601 formats.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const describe = d => (d instanceof Date ? d.toDateString() : JSON.stringify(d));

// Each row is [input] or [input, how to display the result].
const calls = rows =>
  rows.map(([input, display = describe]) => ({
    call: `date(${JSON.stringify(input)})`,
    result: display(date(input)),
  }));

const params = (rows, story) => ({
  docs: {...sourceSnippet("dom", "date", calls(rows)).docs, description: {story}},
});

const basicRows = [["2020"], ["Q3 2019"], ["2019-03"], ["03/15/2019"], ["2019-03-15T12:30:00"], [1577836800000]];
export const BasicExample = () => <CallGrid calls={calls(basicRows)} />;
BasicExample.parameters = params(
  basicRows,
  "Turns the loose date values found in data files into `Date` objects: a bare year, a quarter in either order (`Q3 2019` or `2019 Q3`), a year-month, a `MM/DD/YYYY` string, an ISO string, or a millisecond timestamp (any integer longer than five digits). Charts run every time value through this before building a time axis.",
);

const year = d => (d instanceof Date ? `getFullYear() → ${d.getFullYear()}` : JSON.stringify(d));
const negativeRows = [["-500", year], ["1/1/-200", year], ["Q1 -44", year]];
export const NegativeYears = () => <CallGrid calls={calls(negativeRows)} />;
NegativeYears.parameters = params(
  negativeRows,
  "Years before zero are kept rather than being mangled by the native `Date` parser, so BCE timelines work: the year is read out of the string and set explicitly after parsing.",
);
