import React from "react";
import {Treemap} from "d3plus-react";
import {treemapConfig} from "./configs.js";
const dataFormat = resp => resp;

export default function Two() {
  return <Treemap config={{...treemapConfig, dataCutoff: 2000}} dataFormat={dataFormat} />;
}
