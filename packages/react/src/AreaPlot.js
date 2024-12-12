import React from "react";
import {AreaPlot as type} from "d3plus-plot";
import Viz from "./Viz.js";

/**
    @function AreaPlot
    @extends Viz
*/
const AreaPlot = props => <Viz type={type} {...props} />;
export default AreaPlot;
