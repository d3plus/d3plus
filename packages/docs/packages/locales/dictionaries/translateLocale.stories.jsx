// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/locales/dictionaries/translateLocale.args";
import {translateLocale} from "@d3plus/locales";

export default {
  title: "Locales/Dictionaries/translateLocale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as en-US or es-ES. Each entry maps the English string to its translation.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import DictionaryExample, {dictionaryParams} from "../../../helpers/DictionaryExample.jsx";

const strings = ["Back", "Click to Expand", "Zoom Out", "Count"];
const preview = entry => (
  <table style={{borderCollapse: "collapse", fontSize: 13}}>
    <tbody>
      {strings.map(key => (
        <tr key={key}>
          <td style={{padding: "2px 12px 2px 0", color: "#666"}}>{key}</td>
          <td style={{padding: "2px 0"}}>
            <strong>{entry[key]}</strong>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const BasicExample = () => <DictionaryExample dictionary={translateLocale} initial="es-ES" preview={preview} />;
BasicExample.parameters = {
  docs: {
    ...dictionaryParams("locales", "translateLocale", "es-ES", translateLocale["es-ES"]).docs,
    description: {
      story: "Every string a chart renders in its own interface (the back button, legend and zoom controls, the table view, tooltip hints) keyed by the English original. Setting a chart's `locale` picks the matching dictionary; add your own entry to support another language.",
    },
  },
};
