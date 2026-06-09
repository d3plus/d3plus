// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/titleCase.args";
import {titleCase} from "@d3plus/text";

export default {
  title: "Text/titleCase",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Capitalizes the first letter of each word in a phrase/sentence, accounting for words in English that should be kept lowercase such as \"and\" or \"of\", as well as acronym that should be kept uppercase such as \"CEO\" or \"TVs\".",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = () => {
  const strings = ["hello world", "the quick brown fox", "a tale of two cities"];
  return (
    <ul style={{fontFamily: "sans-serif", lineHeight: 1.8}}>
      {strings.map(s => (
        <li key={s}><code>{s}</code> → <strong>{titleCase(s)}</strong></li>
      ))}
    </ul>
  );
};
