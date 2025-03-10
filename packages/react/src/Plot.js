import React from "react";
import {Plot as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Plot
    @extends Viz
*/
const Plot = props => <Viz type={type} {...props} />;
export default Plot;
