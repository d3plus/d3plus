// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/locales/dictionaries/titleCaseLocale.args";
import {titleCaseLocale} from "@d3plus/locales";

export default {
  title: "Locales/Dictionaries/titleCaseLocale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Per-language rules used by titleCase, keyed by two-letter language code plus a default fallback: the minor words kept lowercase mid-title and the acronyms forced uppercase.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {titleCase} from "@d3plus/text";

import DictionaryExample, {dictionaryParams} from "../../../helpers/DictionaryExample.jsx";

const samples = {
  default: "the lord of the rings",
  en: "the lord of the rings",
  ca: "el senyor dels anells",
  da: "ringenes herre",
  de: "der herr der ringe",
  es: "el señor de los anillos",
  et: "sõrmuste isand",
  fr: "le seigneur des anneaux",
  it: "il signore degli anelli",
  pt: "o senhor dos anéis",
  sv: "sagan om ringen",
};
const preview = (entry, key) => (
  <span style={{fontFamily: "ui-monospace, monospace"}}>
    titleCase({JSON.stringify(samples[key])}, rules) → <strong>{titleCase(samples[key], entry)}</strong>
  </span>
);

export const BasicExample = () => <DictionaryExample dictionary={titleCaseLocale} initial="en" preview={preview} />;
BasicExample.parameters = {
  docs: {
    ...dictionaryParams("locales", "titleCaseLocale", "en", titleCaseLocale["en"]).docs,
    description: {
      story: "The rules `titleCase` applies per language, keyed by two-letter code: the minor words that stay lowercase in the middle of a title and the acronyms that are always uppercased. `default` capitalizes every word and is used for languages without an entry.",
    },
  },
};
