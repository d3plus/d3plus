// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/formatDate.args";
import {formatDate} from "@d3plus/format";

export default {
  title: "Format/formatDate",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {timeFormatLocale} from "d3-time-format";
import {locale} from "@d3plus/locales";

import sourceSnippet from "../../helpers/sourceSnippet.js";

const d = (...args) => new Date(...args);
const range = (n, step) => Array.from({length: n}, (_, i) => step(i));

const yearly = range(7, i => d(2018 + i, 0, 1));
const quarterly = range(8, i => d(2022 + Math.floor(i / 4), (i % 4) * 3, 1));
const monthly = range(12, i => d(2023, i, 1));
const daily = range(10, i => d(2024, 2, 1 + i));
const hourly = range(12, i => d(2024, 2, 1, i));

const labels = (dates, formatter) => dates.map(date => formatDate(date, dates, formatter));

const stripStyle = {display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start"};
const tickStyle = {
  padding: "3px 8px",
  border: "1px solid #dee2e6",
  borderRadius: 4,
  background: "#fff",
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  whiteSpace: "nowrap",
};

// A row of axis-style tick labels, one per date in the array.
const DateStrip = ({title, dates, formatter}) => (
  <div style={{marginBottom: 12}}>
    {title ? <div style={{fontSize: 12, color: "#666", marginBottom: 4}}>{title}</div> : null}
    <div style={stripStyle}>
      {labels(dates, formatter).map((label, i) => (
        <span key={`${label}-${i}`} style={tickStyle}>
          {label}
        </span>
      ))}
    </div>
  </div>
);

const datesLiteral = dates =>
  `[${dates.map(date => `new Date(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()}${date.getHours() ? `, ${date.getHours()}` : ""})`).join(", ")}]`;

const params = (sets, story, formatterSource) => ({
  docs: {
    ...sourceSnippet(
      "format",
      "formatDate",
      sets.map(([name, dates, formatter]) => ({
        call: `const ${name} = ${datesLiteral(dates)};\n${name}.map(d => formatDate(d, ${name}${formatterSource ? `, ${formatterSource}` : ""}))`,
        result: JSON.stringify(labels(dates, formatter)),
      })),
    ).docs,
    description: {story},
  },
});

export const BasicExample = () => <DateStrip dates={yearly} />;
BasicExample.parameters = params(
  [["yearly", yearly]],
  "Given a date and the full ordered array it belongs to, `formatDate` picks a label that fits the spacing of the whole series. Dates one year apart are labeled by year alone.",
);

export const IntervalDetection = () => (
  <div>
    <DateStrip title="quarterly" dates={quarterly} />
    <DateStrip title="monthly" dates={monthly} />
    <DateStrip title="daily" dates={daily} />
    <DateStrip title="hourly" dates={hourly} />
  </div>
);
IntervalDetection.parameters = params(
  [["quarterly", quarterly], ["monthly", monthly], ["daily", daily], ["hourly", hourly]],
  "The interval between neighbouring dates decides the base format (quarter, month, day, or hour), and the first and last dates, plus any date that starts a new year or month, get a fuller label so the strip can be read without an axis title. Arrays of five dates or fewer always use the fuller label.",
);

const spanish = timeFormatLocale(locale["es-ES"]).format;
export const CustomFormatter = () => (
  <div>
    <DateStrip title="monthly, es-ES" dates={monthly} formatter={spanish} />
    <DateStrip title="daily, es-ES" dates={daily} formatter={spanish} />
  </div>
);
CustomFormatter.parameters = params(
  [["monthly", monthly, spanish], ["daily", daily, spanish]],
  "The third argument replaces d3's `timeFormat` with any function that turns a specifier into a formatter. Here a `timeFormatLocale` built from the `es-ES` dictionary in `@d3plus/locales` supplies Spanish month names.",
  'timeFormatLocale(locale["es-ES"]).format',
);
