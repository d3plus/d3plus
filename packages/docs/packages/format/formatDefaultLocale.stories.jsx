// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/formatDefaultLocale.args";
import {formatDefaultLocale} from "@d3plus/format";

export default {
  title: "Format/formatDefaultLocale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {format} from "@d3plus/format";

import CallGrid from "../../helpers/CallGrid.jsx";

const enUS = {decimal: ".", thousands: ",", grouping: [3], currency: ["$", ""]};
const deDE = {decimal: ",", thousands: ".", grouping: [3], currency: ["", " €"]};

// formatDefaultLocale changes the global default for every formatter, so the
// demo applies the German definition, formats, and restores en-US in the same
// synchronous block, leaving the rest of the docs site untouched.
const value = 1234567.891;
const specifiers = [",.2f", "$,.2f"];
const sample = (chip, definition) => {
  formatDefaultLocale(definition);
  try {
    return specifiers.map(specifier => ({
      chip,
      call: `format(${JSON.stringify(specifier)})(${value})`,
      result: JSON.stringify(format(specifier)(value)),
    }));
  } finally {
    formatDefaultLocale(enUS);
  }
};
const calls = [...sample("en-US", enUS), ...sample("de-DE", deDE)];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {format, formatDefaultLocale} from "@d3plus/format";

formatDefaultLocale({decimal: ",", thousands: ".", grouping: [3], currency: ["", "\\u00a0€"]});
${calls
  .filter(c => c.chip === "de-DE")
  .map(({call, result}) => `${call}; // ${result}`)
  .join("\n")}`,
      language: "jsx",
    },
    description: {
      story: "Sets the decimal mark, thousands separator, digit grouping, and currency affixes that every subsequent `format` call uses, the same way d3's `formatDefaultLocale` does. It is global state: the German definition flips the separators for all formatters until another definition replaces it.",
    },
  },
};
