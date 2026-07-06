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
        component: "Capitalizes each significant word of a phrase, normalizing case in both\ndirections: the locale's minor words (articles, short conjunctions/\nprepositions) are forced lowercase in the middle and known acronyms are\nforced uppercase — so \"SOUTH BY SOUTHWEST\" becomes \"South by Southwest\" and\n\"jack smith, ceo\" becomes \"Jack Smith, CEO\". The first and last words are\nalways capitalized. The locale supplies the minor-word and acronym lists\n(e.g. \"le\"/\"de\"/\"par\" for French); pass an explicit rules object for full\ncontrol, including {style: \"sentence\"} to capitalize only the first word.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import sourceSnippet from "../../helpers/sourceSnippet.js";

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "0.5rem 0.85rem",
  fontFamily: "ui-monospace, monospace",
  fontSize: 13,
  maxWidth: 760,
};
const chipStyle = {
  display: "inline-block",
  marginRight: 8,
  padding: "1px 5px",
  borderRadius: 4,
  background: "#eef2f7",
  color: "#5a6b7b",
  fontSize: 11,
};

// Renders rows of live titleCase() calls — input on the left, the result on the
// right — so the examples always reflect the function's actual behavior. Each
// row is [input] (English) or [input, locale].
const Examples = ({rows}) => (
  <div style={gridStyle}>
    {rows.map(([input, locale]) => (
      <React.Fragment key={input + (locale || "")}>
        <div style={{textAlign: "right", color: "#666"}}>
          {locale ? <span style={chipStyle}>{locale}</span> : null}
          <code>{`"${input}"`}</code>
        </div>
        <div aria-hidden="true" style={{color: "#bbb"}}>→</div>
        <div>
          <strong>
            <code>{`"${titleCase(input, locale)}"`}</code>
          </strong>
        </div>
      </React.Fragment>
    ))}
  </div>
);

// Maps demo rows to the actual titleCase() calls a user would write, each
// paired with its live result, for the "Show code" panel.
const sourceParams = rows =>
  sourceSnippet(
    "text",
    "titleCase",
    rows.map(([input, locale]) => ({
      call: `titleCase(${
        locale
          ? `${JSON.stringify(input)}, ${JSON.stringify(locale)}`
          : JSON.stringify(input)
      })`,
      result: JSON.stringify(titleCase(input, locale)),
    })),
  );

const basicRows = [
  ["hello world"],
  ["the quick brown fox"],
  ["a tale of two cities"],
];
export const BasicExample = () => <Examples rows={basicRows} />;
BasicExample.parameters = {
  docs: {
    ...sourceParams(basicRows).docs,
    description: {story: "Capitalizes each word of a plain phrase; the minor word `of` stays lowercase in the middle, while `the` and `a` are capitalized here because they lead the string."},
  },
};

// Case is normalized in BOTH directions: an all-caps ("shouting") string is
// lowered to title case, a lowercase acronym is raised — and minor words stay
// lowercase except as the first or last word.
const caseRows = [
  ["SOUTH BY SOUTHWEST"],
  ["of mice and men"],
  ["jack smith, ceo"],
  ["what are you looking for"],
];
export const CaseNormalization = () => <Examples rows={caseRows} />;
CaseNormalization.parameters = {
  docs: {
    ...sourceParams(caseRows).docs,
    description: {story: "Case is fixed in both directions: the all-caps `SOUTH BY SOUTHWEST` is lowered to `South by Southwest`, the lowercase `ceo` is raised to `CEO`, and a trailing minor word like `for` is capitalized because it ends the phrase."},
  },
};

// Known acronyms are forced uppercase regardless of input case, including
// mixed-case forms like "iOS" and "SaaS", and plurals like "TVs".
const acronymRows = [
  ["the new ceo and cfo"],
  ["r&d drives gdp growth"],
  ["the ios app and saas platform"],
  ["html, css, and sql basics"],
];
export const Acronyms = () => <Examples rows={acronymRows} />;
Acronyms.parameters = {
  docs: {
    ...sourceParams(acronymRows).docs,
    description: {story: "Recognized acronyms are forced to their canonical casing no matter how they were typed — `ceo`→`CEO`, `gdp`→`GDP`, `sql`→`SQL` — including mixed-case forms like `iOS` and `SaaS`."},
  },
};

// Pass a locale to title-case with that language's minor-word and acronym
// lists — note "y"/"el", "de"/"la", "über"/"das" stay lowercase mid-title.
const localizedRows = [
  ["el rápido zorro y el perro", "es-ES"],
  ["le pdg de la société", "fr-FR"],
  ["der bericht über das bip", "de-DE"],
  ["la storia di roma", "it-IT"],
];
export const Localized = () => <Examples rows={localizedRows} />;
Localized.parameters = {
  docs: {
    ...sourceParams(localizedRows).docs,
    description: {story: "Passing a locale (`es-ES`, `fr-FR`, `de-DE`, `it-IT`) swaps in that language's minor-word list, so words such as `y`, `de`, `la`, `über`, and `di` stay lowercase mid-title."},
  },
};
