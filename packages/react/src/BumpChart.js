import React from "react";
import {BumpChart as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function BumpChart
    @extends Viz
*/
const BumpChart = props => <Viz type={type} {...props} />;
export default BumpChart;
