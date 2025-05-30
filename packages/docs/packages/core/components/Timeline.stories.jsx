// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Timeline} from "../../../args/core/components/Timeline.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Timeline",
  component: Timeline,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "",
      },
    },
  }
};

const Template = (args) => <Timeline config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  align: "start",
  brushing: false,
  domain: [2012, 2020],
  height: 100,
  playButton: true,
  width: 400
};
BasicExample.parameters = {controls: {include: ["domain", "playButton"]}};