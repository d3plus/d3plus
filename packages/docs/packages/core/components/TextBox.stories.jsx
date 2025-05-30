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
BasicExample.parameters = {controls: {include: ["fontSize", "lineHeight", "width"]}};



















































































































































































