import React from "react";
import {Plot as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Plot
    @extends Viz
*/
const Plot = props => <Viz instance={new Constructor()} {...props} />;
export default Plot;
