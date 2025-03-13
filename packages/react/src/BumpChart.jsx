import React from "react";
import {BumpChart as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function BumpChart
    @extends Viz
*/
const BumpChart = props => <Viz instance={new Constructor()} {...props} />;
export default BumpChart;
