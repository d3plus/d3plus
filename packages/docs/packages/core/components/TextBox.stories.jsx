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
        component: "Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.",
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
FontResize.parameters = {controls: {include: ["fontResize", "fontMax"]}, docs: {description: {story: "Three equally-sized boxes hold text of very different lengths. With `fontResize: true` each string is scaled between `fontMin` and `fontMax` to fill its box — the single word is sized way up while the long passage shrinks to fit. Toggle `fontResize` off in the controls to see them all snap back to one fixed size."}}};



















































































































































































