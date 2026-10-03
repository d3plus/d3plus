// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/textSplit.args";
import {textSplit} from "@d3plus/text";

export default {
  title: "Text/textSplit",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Splits a given sentence into an array of words.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const chipStyle = {
  display: "inline-block",
  margin: "2px 4px 2px 0",
  padding: "1px 6px",
  borderRadius: 4,
  background: "#eef2f7",
  whiteSpace: "pre",
};

// Trailing spaces and soft hyphens are invisible, so the chips mark them with
// ␣ and ‧ while the "Show code" snippet spells the soft hyphen as ­.
const Tokens = ({tokens}) => (
  <span>
    {tokens.map((t, i) => (
      <code key={`${t}-${i}`} style={chipStyle}>
        {t.replace(/­/g, "‧").replace(/ /g, "␣")}
      </code>
    ))}
  </span>
);

const calls = inputs =>
  inputs.map(sentence => {
    const tokens = textSplit(sentence);
    return {
      call: `textSplit(${JSON.stringify(sentence)})`,
      result: JSON.stringify(tokens).replace(/­/g, "\\u00ad"),
      tokens,
    };
  });

const renderTokens = (result, row) => <Tokens tokens={row.tokens} />;

const params = (inputs, story) => ({
  docs: {...sourceSnippet("text", "textSplit", calls(inputs)).docs, description: {story}},
});

const basicInputs = ["The quick brown fox", "one  two   three"];
export const BasicExample = () => <CallGrid calls={calls(basicInputs)} renderResult={renderTokens} />;
BasicExample.parameters = params(
  basicInputs,
  "Each word keeps the whitespace that follows it (shown as `␣`), so joining the tokens back together reproduces the original sentence exactly. That is what lets `textWrap` measure and re-flow text without losing spacing.",
);

const hyphenInputs = ["internationalization standards", "an extraordinarily unremarkable sentence"];
export const Hyphenation = () => <CallGrid calls={calls(hyphenInputs)} renderResult={renderTokens} />;
Hyphenation.parameters = params(
  hyphenInputs,
  "Words of eight or more lowercase letters are split into syllables, each ending in a soft hyphen (`‧` here, `\\u00ad` in the snippet). A line can break at any of them and the hyphen only becomes visible when it does.",
);

const cjkInputs = ["日本語のテキスト", "party time 🎉🎈"];
export const CjkAndEmoji = () => <CallGrid calls={calls(cjkInputs)} renderResult={renderTokens} />;
CjkAndEmoji.parameters = params(
  cjkInputs,
  "Chinese, Japanese, and Korean characters and emoji have no spaces to break on, so each one becomes its own token and a line can wrap between any pair of them.",
);
