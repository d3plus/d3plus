import React from "react";
import {LinePlot as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function LinePlot
    @extends Viz
*/
const LinePlot = props => <Viz type={type} {...props} />;
export default LinePlot;
