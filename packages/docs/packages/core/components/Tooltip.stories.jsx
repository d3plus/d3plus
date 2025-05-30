// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Tooltip} from "../../../args/core/components/Tooltip.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Tooltip",
  component: Tooltip,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates HTML tooltips in the body of a webpage.",
      },
    },
  }
};

const Template = (args) => <Tooltip config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// export const BasicExample = Template.bind({});
// BasicExample.args = {
//   data: [
//     {"title": "D3plus Tooltip", "body": "Check out this cool table:", "position": "mouse", "label": "Position"}
//   ],
//   thead: ["Axis", d => d.label],
//   tbody: [
//     ["x", d => d.x],
//     ["y", d => d.y]
//   ],
//   position: d => [0, 0]
// };
// BasicExample.parameters = {controls: {include: ["footer"]}};
