// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/locales/dictionaries/locale.args";
import {locale} from "@d3plus/locales";

export default {
  title: "Locales/Dictionaries/locale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "d3-time-format locale definitions (date and time patterns, period, day, and month names) keyed by locale code, used when formatting dates on axes, timelines, and tooltips.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {timeFormatLocale} from "d3-time-format";

import DictionaryExample, {dictionaryParams} from "../../../helpers/DictionaryExample.jsx";

const date = new Date(2024, 2, 14, 15, 30);
const specifiers = ["%A, %d %B %Y", "%x", "%X"];
const preview = entry => {
  const {format} = timeFormatLocale(entry);
  return (
    <div style={{display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "ui-monospace, monospace"}}>
      {specifiers.map(specifier => (
        <span key={specifier}>
          {JSON.stringify(specifier)} → <strong>{format(specifier)(date)}</strong>
        </span>
      ))}
    </div>
  );
};

export const BasicExample = () => <DictionaryExample dictionary={locale} initial="fr-FR" preview={preview} />;
BasicExample.parameters = {
  docs: {
    ...dictionaryParams("locales", "locale", "fr-FR", locale["fr-FR"]).docs,
    description: {
      story: "Date and time definitions in the shape `d3-time-format`'s `timeFormatLocale` expects: the `%x`/`%X`/`%c` patterns, AM/PM periods, and day and month names. Axes and timelines use the entry matching the chart's `locale`; the preview formats one date three ways with the chosen entry.",
    },
  },
};
