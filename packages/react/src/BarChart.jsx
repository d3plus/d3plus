import React from "react";
import {BarChart as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function BarChart
    @extends Viz
*/
const BarChart = props => <Viz type={type} {...props} />;
export default BarChart;
