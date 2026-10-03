// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, TextBox} from "../../../args/core/components/TextBox.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/TextBox",
  component: TextBox,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a wrapped text box for each point in an array of data.",
      },
    },
  }
};

const Template = (args) => <TextBox config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {text: "Here is text rendered in <i>SVG</i> that is <u>wrapped</u> and contains <b>HTML</b> tags."},
    {text: "这是句子 2。即使包装器中没有空格，它也有效！"},
    {text: "၎င်းသည် ချိတ်ဆက်ထားသော စာလုံးများပင်လျှင် ဘာသာစကားအများစုတွင် အလုပ်လုပ်သည်။"},
  ],
  duration: 500,
  fontSize: 16,
  height: 200,
  lineHeight: 18,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50)
};
BasicExample.parameters = {controls: {include: ["fontSize", "lineHeight", "width"]}, docs: {description: {story: "Wraps three strings inside 200px-wide boxes: inline `<i>`, `<u>`, and `<b>` tags render as styled SVG, while the Chinese and Burmese lines show wrapping still works for scripts that don't separate words with spaces."}}};

export const FontResize = Template.bind({});
FontResize.args = {
  data: [
    {text: "Big"},
    {text: "A medium-length caption"},
    {text: "A much longer passage of text that has to shrink down so every word still fits inside the very same box"}
  ],
  fontResize: true,
  fontMax: 96,
  fontMin: 6,
  height: 180,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50)
};
FontResize.parameters = {controls: {include: ["fontResize", "fontMax", "fontMin"]}, docs: {description: {story: "Three equally-sized boxes hold text of very different lengths. With `fontResize: true` each string is scaled between `fontMin` and `fontMax` to fill its box — the single word is sized way up while the long passage shrinks to fit. Toggle `fontResize` off in the controls to see them all snap back to one fixed size."}}};




















































































































































































export const Alignment = Template.bind({});
Alignment.args = {
  data: [
    {text: "textAnchor: start", anchor: "start", valign: "top"},
    {text: "textAnchor: middle", anchor: "middle", valign: "middle"},
    {text: "textAnchor: end", anchor: "end", valign: "bottom"}
  ],
  fontSize: 16,
  height: 150,
  text: d => d.text,
  textAnchor: d => d.anchor,
  verticalAlign: d => d.valign,
  width: 200,
  x: (d, i) => i * (200 + 50)
};
Alignment.parameters = {controls: {include: ["textAnchor", "verticalAlign"]}, docs: {description: {story: "`textAnchor` aligns the wrapped lines horizontally within the box (`start`, `middle`, or `end`) and `verticalAlign` places the block at the `top`, `middle`, or `bottom` of its `height`; both accept accessors, so each datum here chooses its own."}}};

export const Rotation = Template.bind({});
Rotation.args = {
  data: [
    {text: "rotate: -45", rotate: -45},
    {text: "rotate: 0", rotate: 0},
    {text: "rotate: 90", rotate: 90}
  ],
  fontSize: 16,
  height: 60,
  rotate: d => d.rotate,
  text: d => d.text,
  width: 140,
  x: (d, i) => 60 + i * 220,
  y: 80
};
Rotation.parameters = {controls: {include: ["rotate", "rotateAnchor"]}, docs: {description: {story: "`rotate` turns the whole box by that many degrees around `rotateAnchor` (its center by default), the same mechanism axes use for slanted tick labels and charts use for vertical bar labels."}}};

const long = "This passage is much longer than the two lines its box allows, so the wrapper has to decide what to do with the remainder.";
export const Truncation = Template.bind({});
Truncation.args = {
  data: [
    {text: `height: 48 — ${long}`, maxLines: null},
    {text: `maxLines: 1 — ${long}`, maxLines: 1}
  ],
  fontSize: 15,
  height: 48,
  maxLines: d => d.maxLines,
  text: d => d.text,
  width: 240,
  x: (d, i) => i * (240 + 40)
};
Truncation.parameters = {controls: {include: ["maxLines", "height"]}, docs: {description: {story: "Text that does not fit is cut at the last whole line that fits the `height`, and `maxLines` caps the line count regardless of height. The cut line is passed through `ellipsis`, a function `(text, line) => string` that appends `…` by default and can be replaced to end truncated text any other way."}}};

export const LongWords = Template.bind({});
LongWords.args = {
  data: [
    {text: "overflow: false ABCDEFGHIJKLMNOPQRSTUVWXYZ", overflow: false},
    {text: "overflow: true ABCDEFGHIJKLMNOPQRSTUVWXYZ", overflow: true}
  ],
  fontSize: 16,
  height: 80,
  overflow: d => d.overflow,
  text: d => d.text,
  width: 150,
  x: (d, i) => i * (150 + 120)
};
LongWords.parameters = {controls: {include: ["overflow", "width"]}, docs: {description: {story: "A single word wider than the box cannot be wrapped. By default the wrapper stops there and truncates; `overflow: true` lets the word run past the box's right edge instead, so nothing is lost when the box is only a sizing hint."}}};

export const FontStyling = Template.bind({});
FontStyling.args = {
  data: [
    {text: "Georgia, bold, slate", family: "Georgia, serif", weight: 700, color: "#495057"},
    {text: "Inter, regular, blue", family: "Inter, sans-serif", weight: 400, color: "#1c7ed6"},
    {text: "Monospace with a stroke", family: "ui-monospace, monospace", weight: 600, color: "#fff"}
  ],
  fontColor: d => d.color,
  fontFamily: d => d.family,
  fontSize: 18,
  fontStroke: d => (d.weight === 600 ? "#212529" : "none"),
  fontStrokeWidth: 1,
  fontWeight: d => d.weight,
  height: 80,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50)
};
FontStyling.parameters = {controls: {include: ["fontFamily", "fontWeight", "fontColor", "fontStroke"]}, docs: {description: {story: "`fontFamily`, `fontWeight`, `fontColor`, and `fontStroke`/`fontStrokeWidth` all take values or accessors. A thin dark stroke around light text is how chart labels stay legible over any fill."}}};
