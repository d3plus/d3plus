import React from "react";
import {RadialMatrix as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function RadialMatrix
    @extends Viz
*/
const RadialMatrix = props => <Viz type={type} {...props} />;
export default RadialMatrix;
