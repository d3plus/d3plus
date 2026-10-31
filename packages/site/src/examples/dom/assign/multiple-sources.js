import {assign} from "@d3plus/dom";

const defaults = {font: {size: 12, family: "Inter"}, color: "#1c7ed6"};
const theme = {font: {size: 14}};
const overrides = {color: "#c92a2a"};

assign({}, defaults, theme, overrides);
