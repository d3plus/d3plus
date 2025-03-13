import React from "react";
import {BarChart as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function BarChart
    @extends Viz
*/
const BarChart = props => <Viz instance={new Constructor()} {...props} />;
export default BarChart;
