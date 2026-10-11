// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/formatDateFull.args";
import {formatDateFull} from "@d3plus/format";

export default {
  title: "Format/formatDateFull",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from dataArray (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {timeFormatLocale} from "d3-time-format";
import {formatDate} from "@d3plus/format";
import {locale} from "@d3plus/locales";

import sourceSnippet from "../../helpers/sourceSnippet.js";

const d = (...args) => new Date(...args);
const range = (n, step) => Array.from({length: n}, (_, i) => step(i));

const quarterly = range(8, i => d(2022 + Math.floor(i / 4), (i % 4) * 3, 1));
const monthly = range(12, i => d(2023, i, 1));
const daily = range(10, i => d(2024, 2, 1 + i));
const hourly = range(12, i => d(2024, 2, 1, i));

const full = (dates, formatter) => dates.map(date => formatDateFull(date, dates, formatter));
const ticks = dates => dates.map(date => formatDate(date, dates));

const stripStyle = {display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start"};
const labelStyle = {
  padding: "3px 8px",
  border: "1px solid #dee2e6",
  borderRadius: 4,
  background: "#fff",
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  whiteSpace: "nowrap",
};

// A row of labels, one per date in the array.
const Strip = ({title, labels}) => (
  <div style={{marginBottom: 12}}>
    {title ? <div style={{fontSize: 12, color: "#666", marginBottom: 4}}>{title}</div> : null}
    <div style={stripStyle}>
      {labels.map((label, i) => (
        <span key={`${label}-${i}`} style={labelStyle}>
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
      "formatDateFull",
      sets.map(([name, dates, formatter]) => ({
        call: `const ${name} = ${datesLiteral(dates)};\n${name}.map(d => formatDateFull(d, ${name}${formatterSource ? `, ${formatterSource}` : ""}))`,
        result: JSON.stringify(full(dates, formatter)),
      })),
    ).docs,
    description: {story},
  },
});

export const BasicExample = () => (
  <div>
    <Strip title="formatDateFull" labels={full(monthly)} />
    <Strip title="formatDate (axis ticks)" labels={ticks(monthly)} />
  </div>
);
BasicExample.parameters = params(
  [["monthly", monthly]],
  "`formatDateFull` labels a date at the same interval `formatDate` picks from the whole series, but every label carries its year, so each one can be read alone (d3plus uses it for time values in tooltips). `formatDate` leaves the year off middle ticks, where the neighbouring labels supply it.",
);

export const IntervalDetection = () => (
  <div>
    <Strip title="quarterly" labels={full(quarterly)} />
    <Strip title="daily" labels={full(daily)} />
    <Strip title="hourly" labels={full(hourly)} />
  </div>
);
IntervalDetection.parameters = params(
  [["quarterly", quarterly], ["daily", daily], ["hourly", hourly]],
  "The spacing between neighbouring dates picks the interval (year, quarter, month, day, hour, or finer). Below a day, the label adds the time of day.",
);

const spanish = timeFormatLocale(locale["es-ES"]).format;
export const CustomFormatter = () => <Strip title="monthly, es-ES" labels={full(monthly, spanish)} />;
CustomFormatter.parameters = params(
  [["monthly", monthly, spanish]],
  "The third argument replaces d3's `timeFormat` with any function that turns a specifier into a formatter. Here a `timeFormatLocale` built from the `es-ES` dictionary in `@d3plus/locales` supplies Spanish month names.",
  'timeFormatLocale(locale["es-ES"]).format',
);
