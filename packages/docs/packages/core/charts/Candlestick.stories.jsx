// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {
  argTypes,
  Candlestick,
} from "../../../args/core/charts/Candlestick.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Candlestick",
  component: Candlestick,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Creates a candlestick (or OHLC bar) chart of financial periods, from rows\nwith a date and open, high, low, and close values. Each row\'s date is read\nby x (default "date"): a Date, a timestamp, or a date string.',
      },
    },
  },
};

const Template = args => <Candlestick config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// A seeded random walk of trading days (weekdays only), written as a
// self-contained expression so each story's "Show code" snippet prints this
// generator rather than every row.
const pricesSource = (symbols, days) => `(() => {
  const rows = [];
  ${JSON.stringify(symbols)}.forEach(([symbol, start], k) => {
    let seed = 11 + k * 12;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const day = new Date(2024, 0, 1);
    let close = start, n = 0;
    while (n < ${days}) {
      if (day.getDay() % 6) {
        const open = close * (1 + (random() - 0.5) * 0.02);
        close = open * (1 + (random() - 0.48) * 0.04);
        const round = v => Math.round(v * 100) / 100;
        rows.push({
          symbol,
          date: [day.getFullYear(), day.getMonth() + 1, day.getDate()].map(v => String(v).padStart(2, "0")).join("-"),
          open: round(open),
          high: round(Math.max(open, close) * (1 + random() * 0.015)),
          low: round(Math.min(open, close) * (1 - random() * 0.015)),
          close: round(close),
        });
        n++;
      }
      day.setDate(day.getDate() + 1);
    }
  });
  return rows;
})()`;

const acme = datafy(pricesSource([["ACME", 120]], 60));
const acmeYears = datafy(pricesSource([["ACME", 80]], 500));
const tickers = datafy(
  pricesSource(
    [
      ["ACME", 120],
      ["BOLT", 42],
      ["CORE", 310],
      ["DYNO", 8],
    ],
    90,
  ),
);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: acme,
  groupBy: "symbol",
};
BasicExample.parameters = {
  controls: {
    include: ["variant", "hollow", "upColor", "downColor", "bodyWidth"],
  },
  docs: {
    description: {
      story:
        "Each row is one period with a `date`, `open`, `high`, `low`, and `close` (the default keys). The wick runs from the high to the low and the body from the open to the close. Periods that closed at or above their open are drawn as green outlines, and periods that fell are filled red, so direction reads from the fill as well as the color. Hover anywhere over the plot to see the nearest period's values and its change from open to close.",
    },
  },
};

export const OHLCBars = Template.bind({});
OHLCBars.args = {
  data: acme,
  groupBy: "symbol",
  variant: "ohlc",
};
OHLCBars.parameters = {
  controls: {include: ["variant", "bodyWidth"]},
  docs: {
    description: {
      story:
        '`variant: "ohlc"` draws each period as an OHLC bar: a line from the high to the low, with the open ticked to the left and the close ticked to the right.',
    },
  },
};

export const CustomAccessors = Template.bind({});
CustomAccessors.args = {
  data: datafy(
    `${acme.__source}.map(d => ({Day: d.date, Open: d.open, High: d.high, Low: d.low, Last: d.close, Ticker: d.symbol}))`,
  ),
  groupBy: "Ticker",
  x: "Day",
  open: "Open",
  high: "High",
  low: "Low",
  close: "Last",
  hollow: false,
  upColor: "#1c7ed6",
  downColor: "#e8590c",
  yConfig: {tickFormat: funcify(d => `$${d}`, "d => `$${d}`")},
};
CustomAccessors.parameters = {
  controls: {
    include: [
      "x",
      "open",
      "high",
      "low",
      "close",
      "hollow",
      "upColor",
      "downColor",
    ],
  },
  docs: {
    description: {
      story:
        "Point `x`, `open`, `high`, `low`, and `close` at your own keys (or accessor functions). `hollow: false` fills every candle, and `upColor`/`downColor` swap the palette, here for a blue/orange pair that stays distinct for red-green color blindness. A `yConfig.tickFormat` formats the prices in the tooltip as well as on the axis.",
    },
  },
};

export const WithVolume = Template.bind({});
WithVolume.args = {
  data: datafy(
    `${acme.__source}.map((d, i) => ({...d, volume: Math.round(1e6 * (1 + (i * 7919 % 13) / 13 + Math.abs(d.close - d.open) / d.open * 60))}))`,
  ),
  groupBy: "symbol",
  volume: "volume",
};
WithVolume.parameters = {
  controls: {include: ["volume", "volumeConfig", "variant", "hollow"]},
  docs: {
    description: {
      story:
        "`volume` draws a strip of volume bars under the candles, one per candle in its up or down color, on its own small axis with abbreviated ticks (e.g. 1.2M). The price axis shrinks to make room, the x axis sits under the strip, and the tooltip adds a Volume row. Bars stay filled when candles are hollow, so short bars remain easy to read. `volumeConfig` sets the strip's `height` (a share of the plot, default `0.2`), the `gap` above it, and `axisConfig`/`shapeConfig` for its axis and bars. When rows merge, volumes add up; `aggs` overrides it.",
    },
  },
};

export const IntradayRollup = Template.bind({});
IntradayRollup.args = {
  data: datafy(`(() => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const round = v => Math.round(v * 100) / 100;
  const rows = [];
  const day = new Date(2024, 0, 1);
  let price = 120, n = 0;
  while (n < 30) {
    if (day.getDay() % 6) {
      const date = [day.getFullYear(), day.getMonth() + 1, day.getDate()].map(v => String(v).padStart(2, "0")).join("-");
      for (let hour = 10; hour <= 16; hour++) {
        const open = price;
        price = open * (1 + (random() - 0.49) * 0.012);
        rows.push({
          symbol: "ACME",
          day: date,
          time: date + "T" + hour + ":00",
          open: round(open),
          high: round(Math.max(open, price) * (1 + random() * 0.004)),
          low: round(Math.min(open, price) * (1 - random() * 0.004)),
          close: round(price),
        });
      }
      n++;
    }
    day.setDate(day.getDate() + 1);
  }
  return rows;
})()`),
  groupBy: "symbol",
  x: "day",
};
IntradayRollup.parameters = {
  controls: {include: ["x", "aggs"]},
  docs: {
    description: {
      story:
        "Rows that share a series and a period merge into one candle: the first row's open, the highest high, the lowest low, and the last row's close. Rows merge in data order, so sort them oldest first. Here seven hourly rows a day, with `x` pointed at their `day`, roll up to daily candles. An `aggs` entry overrides any of the four, keyed by the data key (or, for a function accessor, by the field name: `aggs: {close: (rows, value) => ...}`).",
    },
  },
};

export const CalendarGaps = Template.bind({});
CalendarGaps.args = {
  data: datafy(`${acme.__source}.slice(0, 25)`),
  groupBy: "symbol",
  skipGaps: false,
};
CalendarGaps.parameters = {
  controls: {include: ["skipGaps"]},
  docs: {
    description: {
      story:
        "By default periods are spaced evenly in date order, so weekends and holidays leave no gaps, and the axis ticks the first period of each week, month, quarter, or year. `skipGaps: false` places each period at its date on a continuous time axis instead, which shows the gaps.",
    },
  },
};

export const ManyPeriods = Template.bind({});
ManyPeriods.args = {
  data: acmeYears,
  groupBy: "symbol",
  renderer: "canvas",
};
ManyPeriods.parameters = {
  controls: {include: ["renderer", "skipGaps", "bodyWidth"]},
  docs: {
    description: {
      story:
        "Two years of daily candles. The Canvas renderer draws dense charts quickly while keeping the snapped tooltip; candles narrow to fit, down to a single pixel.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: tickers,
  groupBy: "symbol",
  facet: "symbol",
  facetConfig: {scales: "independent"},
  height: 600,
};
SmallMultiples.parameters = {
  controls: {include: ["facet", "facetConfig"]},
  docs: {
    description: {
      story:
        '`facet` draws one panel per ticker. With `facetConfig.scales: "independent"`, each panel\'s value axis fits its own price range.',
    },
  },
};
