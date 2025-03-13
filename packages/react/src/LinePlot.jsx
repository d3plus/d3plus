import React from "react";
import {LinePlot as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function LinePlot
    @extends Viz
*/
const LinePlot = props => <Viz instance={new Constructor()} {...props} />;
export default LinePlot;
