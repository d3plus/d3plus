// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/format.args";
import {format} from "@d3plus/format";

export default {
  title: "Format/format",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Each row is [specifier, value]; the result is the live output of
// format(specifier)(value).
const calls = rows =>
  rows.map(([specifier, value]) => ({
    call: `format(${JSON.stringify(specifier)})(${JSON.stringify(value)})`,
    result: JSON.stringify(format(specifier)(value)),
  }));

const params = (rows, story) => ({
  docs: {...sourceSnippet("format", "format", calls(rows)).docs, description: {story}},
});

const basicRows = [[",.2f", 1234.567], ["$,.0f", 1234567], [".1%", 0.256], ["08.2f", 3.14159], [".2e", 123456]];
export const BasicExample = () => <CallGrid calls={calls(basicRows)} />;
BasicExample.parameters = params(
  basicRows,
  "Takes a [d3-format specifier](https://github.com/d3/d3-format#locale_format) and returns a formatting function: `,` groups thousands, `.2f` fixes two decimals, `$` prefixes the locale currency, `%` scales by 100, `08` zero-pads to eight characters, and `e` switches to exponent notation.",
);

const abbreviateRows = [[".3~a", 1234567], [".3~a", 0.0042], [".3~a", 1234567890], [".2s", 1234567]];
export const AbbreviateSpecifier = () => <CallGrid calls={calls(abbreviateRows)} />;
AbbreviateSpecifier.parameters = params(
  abbreviateRows,
  "`\".3~a\"` is the d3plus extension: it routes to `formatAbbreviate`, so large numbers get the k/M/B suffixes charts use and small fractions keep their significant digits. Compare d3's own `\".2s\"`, which uses SI prefixes and rounds to two significant digits.",
);

const money = format("$,.2f");
const prices = [19.99, 1500, 2500000];
const reusableCalls = prices.map(value => ({call: `money(${value})`, result: JSON.stringify(money(value))}));
export const ReusableFormatter = () => <CallGrid calls={reusableCalls} />;
ReusableFormatter.parameters = {
  docs: {
    source: {
      code: `import {format} from "@d3plus/format";\n\nconst money = format("$,.2f");\n${reusableCalls
        .map(({call, result}) => `${call}; // ${result}`)
        .join("\n")}`,
      language: "jsx",
    },
    description: {
      story: "The specifier is parsed once, so keep the returned function and apply it to every value, for instance as a chart's `tooltipConfig` or axis `tickFormat`.",
    },
  },
};
