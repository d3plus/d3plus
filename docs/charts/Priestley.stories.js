import React from "react";
import {argTypes, Priestley as Viz} from "../args/Priestley.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Priestley",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {element: "alpha",   birth: 2004, death: 2007},
    {element: "epsilon", birth: 2007, death: 2012},
    {element: "beta",    birth: 2005, death: 2010}
  ],
  end: "death",
  groupBy: "element",
  start: "birth"
};
