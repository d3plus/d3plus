// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/assign.args";
import {assign} from "@d3plus/dom";

export default {
  title: "Dom/assign",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A deeply recursive version of Object.assign.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";

const show = value => JSON.stringify(value, null, 2);

const example = (code, result, story) => {
  const Story = () => <FunctionExample input={code} output={show(result)} />;
  Story.parameters = {
    docs: {
      source: {code: `import {assign} from "@d3plus/dom";\n\n${code};\n// → ${show(result).replace(/\n/g, "\n//   ")}`, language: "jsx"},
      description: {story},
    },
  };
  return Story;
};

export const BasicExample = example(
  `assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}})`,
  assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}),
  "A deep `Object.assign`: later sources win for plain values, but nested objects are merged rather than replaced, so `deep.group` survives alongside the new `deep.value`. This is how every d3plus `config()` call layers over the existing configuration.",
);

export const ArraysReplaced = example(
  `assign({tags: ["a", "b"], deep: {list: [1]}}, {tags: ["c"], deep: {list: [2, 3]}})`,
  assign({tags: ["a", "b"], deep: {list: [1]}}, {tags: ["c"], deep: {list: [2, 3]}}),
  "Arrays are copied, not merged: a source array replaces the target's array at that key wholesale, which is what you want for a new `data` or `groupBy` list.",
);

const defaults = {font: {size: 12, family: "Inter"}, color: "#1c7ed6"};
const theme = {font: {size: 14}};
const overrides = {color: "#c92a2a"};
export const MultipleSources = example(
  `const defaults = {font: {size: 12, family: "Inter"}, color: "#1c7ed6"};
const theme = {font: {size: 14}};
const overrides = {color: "#c92a2a"};

assign({}, defaults, theme, overrides)`,
  assign({}, defaults, theme, overrides),
  "Any number of sources can be passed and they are applied left to right. Starting from an empty object leaves `defaults` untouched for the next call.",
);
