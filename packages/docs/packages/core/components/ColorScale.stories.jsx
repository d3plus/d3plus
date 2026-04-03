// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, ColorScale} from "../../../args/core/components/ColorScale.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/ColorScale",
  component: ColorScale,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG color scale based on an array of data.",
      },
    },
  }
};

const Template = (args) => <ColorScale config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const LinearScale = Template.bind({});
LinearScale.args = {
  data: [
    {value: 200},
    {value: 1000},
    {value: 2000},
    {value: 2010},
    {value: 2020},
    {value: 2030},
    {value: 2040},
    {value: 2100},
    {value: 6400}
  ],
  height: 100,
  width: 500
};
LinearScale.parameters = {controls: {include: []}};