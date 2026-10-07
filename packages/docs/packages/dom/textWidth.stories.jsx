// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/textWidth.args";
import {textWidth} from "@d3plus/dom";

export default {
  title: "Dom/textWidth",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Given a text string, returns the predicted pixel width of the string when placed into DOM.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {useEffect, useState} from "react";
import {onFontsLoaded} from "@d3plus/dom";

import sourceSnippet from "../../helpers/sourceSnippet.js";

const css = style => ({
  fontFamily: style["font-family"],
  fontSize: style["font-size"],
  fontWeight: style["font-weight"] || 400,
});

// Renders each string in the measured font with a bar of exactly the measured
// width beneath it, so the number can be checked against the glyphs by eye.
// Widths are re-measured once web fonts finish loading.
const Measured = ({rows}) => {
  const [, bump] = useState(0);
  useEffect(() => onFontsLoaded(() => bump(n => n + 1)), []);
  return (
    <div style={{display: "grid", gap: 14}}>
      {rows.map(([text, style]) => {
        const width = textWidth(text, style);
        return (
          <div key={`${text}-${JSON.stringify(style)}`}>
            <span style={{...css(style), whiteSpace: "pre"}}>{text}</span>
            <div style={{width, height: 3, background: "#1c7ed6", marginTop: 2}} />
            <code style={{fontSize: 12, color: "#666"}}>
              {Math.round(width * 100) / 100}px · {JSON.stringify(style)}
            </code>
          </div>
        );
      })}
    </div>
  );
};

const calls = rows =>
  rows.map(([text, style]) => ({
    call: `textWidth(${JSON.stringify(text)}, ${JSON.stringify(style)})`,
    result: String(Math.round(textWidth(text, style) * 100) / 100),
  }));

const params = (rows, story) => ({
  docs: {...sourceSnippet("dom", "textWidth", calls(rows)).docs, description: {story}},
});

const inter = {"font-family": "Inter", "font-size": 16};
const basicRows = [["Hello", inter], ["Hello world", inter], ["WWW", inter], ["iii", inter]];
export const BasicExample = () => <Measured rows={basicRows} />;
BasicExample.parameters = params(
  basicRows,
  "Predicts the pixel width a string will occupy at a given font without rendering it, using the font's actual glyph metrics, which is why `WWW` and `iii` differ so much. Every label, axis tick, and legend entry is measured this way before it is placed.",
);

const list = ["alpha", "beta", "gamma"];
export const ArrayInput = () => <Measured rows={list.map(t => [t, inter])} />;
ArrayInput.parameters = {
  docs: {
    ...sourceSnippet("dom", "textWidth", [
      {
        call: `textWidth(${JSON.stringify(list)}, ${JSON.stringify(inter)})`,
        result: JSON.stringify(textWidth(list, inter).map(w => Math.round(w * 100) / 100)),
      },
    ]).docs,
    description: {
      story: "Pass an array to measure many strings at once and get an array of widths back in the same order, which is how `textWrap` sizes every word of a sentence in one call.",
    },
  },
};

const styleRows = [
  ["Sphinx of black quartz", {"font-family": "Inter", "font-size": 12}],
  ["Sphinx of black quartz", {"font-family": "Inter", "font-size": 24}],
  ["Sphinx of black quartz", {"font-family": "Inter", "font-size": 16, "font-weight": 700}],
  ["Sphinx of black quartz", {"font-family": "Georgia, serif", "font-size": 16}],
];
export const FontStyles = () => <Measured rows={styleRows} />;
FontStyles.parameters = params(
  styleRows,
  "The style object takes CSS property names: `font-size` (a number means pixels), `font-weight`, and `font-family` all change the result, and a family list falls through to the first installed font just as CSS would.",
);
