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
    {text: "Scale"},
    {text: "Scale"},
    {text: "Scale"}
  ],
  fontResize: true,
  fontMax: 72,
  fontMin: 6,
  height: (d, i) => [40, 80, 130][i],
  text: d => d.text,
  width: (d, i) => [150, 230, 320][i],
  x: 20,
  y: (d, i) => [10, 60, 150][i]
};
FontResize.parameters = {controls: {include: ["fontResize", "fontMax"]}, docs: {description: {story: "With `fontResize: true` the text grows to fill its box (bounded by `fontMin`/`fontMax`) instead of holding a fixed `fontSize` — the same word is drawn larger in each larger box. Toggle `fontResize` off in the controls to see every box snap back to one size."}}};



















































































































































































