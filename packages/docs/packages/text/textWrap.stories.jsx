// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/textWrap.args";
import {textWrap} from "@d3plus/text";

export default {
  title: "Text/textWrap",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useEffect, useState} from "react";
import {onFontsLoaded} from "@d3plus/dom";

import sourceSnippet from "../../helpers/sourceSnippet.js";

const sentence =
  "The quick brown fox jumps over the lazy dog while the sun sets behind the hills.";

const configure = config => {
  const wrap = textWrap();
  Object.entries(config).forEach(([key, value]) => wrap[key](value));
  return wrap;
};

const summarize = ({lines, widths, truncated}) => ({
  lines,
  widths: widths.map(Math.round),
  truncated,
});

// Draws the wrap box (or circle) with each returned line inside it, and the
// result object beside it. Re-renders once web fonts arrive, since the line
// breaks depend on measured text widths.
const WrapBox = ({config, text = sentence}) => {
  const [, bump] = useState(0);
  useEffect(() => onFontsLoaded(() => bump(n => n + 1)), []);
  const result = configure(config)(text);
  const {
    width = 200,
    height = 200,
    fontSize = 10,
    fontFamily = "sans-serif",
    fontWeight = 400,
    shape = "square",
  } = config;
  const lineHeight = config.lineHeight || Math.ceil(fontSize * 1.4);
  const centered = shape === "circle";
  return (
    <div style={{display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", fontSize: 12}}>
      <svg
        width={width + 2}
        height={height + 2}
        style={{flex: "0 0 auto", overflow: "visible", border: "1px solid #dee2e6", borderRadius: 6, background: "#fff"}}
      >
        <g transform="translate(1,1)">
          {centered ? (
            <circle
              cx={width / 2}
              cy={height / 2}
              r={Math.min(width, height) / 2}
              fill="none"
              stroke="#adb5bd"
              strokeDasharray="4 3"
            />
          ) : (
            <rect width={width} height={height} fill="none" stroke="#adb5bd" strokeDasharray="4 3" />
          )}
          {result.lines.map((line, i) => (
            <text
              key={`${line}-${i}`}
              x={centered ? width / 2 : 0}
              y={(i + 1) * lineHeight - lineHeight * 0.25}
              textAnchor={centered ? "middle" : "start"}
              style={{fontSize, fontFamily, fontWeight}}
            >
              {line}
            </text>
          ))}
        </g>
      </svg>
      <pre style={{margin: 0, flex: "1 1 220px", minWidth: 0}}>
        {JSON.stringify(summarize(result), null, 2)}
      </pre>
    </div>
  );
};

// The snippet shows the generator chain a user would write, with the result
// as measured when the page loaded.
const params = (config, story, text = sentence) => {
  const chain = Object.entries(config)
    .map(([key, value]) => `.${key}(${JSON.stringify(value)})`)
    .join("");
  return {
    docs: {
      ...sourceSnippet("text", "textWrap", [
        {
          call: `const wrap = textWrap()${chain};\nwrap(${JSON.stringify(text)})`,
          result: JSON.stringify(summarize(configure(config)(text)), null, 2),
        },
      ]).docs,
      description: {story},
    },
  };
};

const basic = {width: 200};
export const BasicExample = () => <WrapBox config={basic} />;
BasicExample.parameters = params(
  basic,
  "`textWrap()` returns a generator: configure it, then call it with a string. `width(200)` is the only setting here, so the sentence is broken into as many 200px lines as it needs at the default 10px font, and `widths` reports the measured pixel width of each line.",
);

const truncated = {width: 160, maxLines: 2};
export const MaxLinesTruncation = () => <WrapBox config={truncated} />;
MaxLinesTruncation.parameters = params(
  truncated,
  "`maxLines(2)` keeps only the first two lines and sets `truncated: true` so a caller such as `TextBox` knows to add an ellipsis.",
);

const circle = {shape: "circle", width: 220, height: 220, fontSize: 14};
export const CircleShape = () => <WrapBox config={circle} />;
CircleShape.parameters = params(
  circle,
  "`shape(\"circle\")` limits each line to the chord of the circle at that line's height, so lines near the top and bottom are shorter than those through the middle. This is how labels fit inside Pack and Pie shapes.",
);

const styled = {width: 240, fontSize: 18, fontWeight: 700, fontFamily: "Inter"};
export const FontStyling = () => <WrapBox config={styled} />;
FontStyling.parameters = params(
  styled,
  "`fontSize`, `fontWeight`, and `fontFamily` feed the measurement, so a bold 18px Inter line holds fewer words than the 10px default. The result re-measures once the web font has loaded.",
);
