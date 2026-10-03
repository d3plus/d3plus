// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/locales/dictionaries/formatLocale.args";
import {formatLocale} from "@d3plus/locales";

export default {
  title: "Locales/Dictionaries/formatLocale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A set of default locale formatters used when assigning suffixes and currency in numbers.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {formatAbbreviate} from "@d3plus/format";

import DictionaryExample, {dictionaryParams} from "../../../helpers/DictionaryExample.jsx";

const samples = [1234567.891, 0.0042, 12500];
const preview = entry => (
  <div style={{display: "flex", gap: 16, fontFamily: "ui-monospace, monospace", flexWrap: "wrap"}}>
    {samples.map(n => (
      <span key={n}>
        {n} → <strong>{formatAbbreviate(n, entry)}</strong>
      </span>
    ))}
  </div>
);

export const BasicExample = () => <DictionaryExample dictionary={formatLocale} initial="en-US" preview={preview} />;
BasicExample.parameters = {
  docs: {
    ...dictionaryParams("locales", "formatLocale", "en-US", formatLocale["en-US"]).docs,
    description: {
      story: "Number-formatting rules per locale: the thousands and decimal delimiters, digit grouping, currency affixes, and the suffixes `formatAbbreviate` appends (k, M, B, …). Pick a locale to see the entry and the same three numbers formatted with it.",
    },
  },
};
