import React from "react";
import {Plot} from "../index.jsx";
import {sharedConfig, icon} from "./Logo-Frames.js";

const Icon = () => {
  return <Plot config={{...sharedConfig, ...icon}} />;
};

export default Icon;
