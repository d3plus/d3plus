import React from "react";
import {AreaPlot as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function AreaPlot
    @extends Viz
*/
const AreaPlot = props => <Viz instance={new Constructor()} {...props} />;
export default AreaPlot;
