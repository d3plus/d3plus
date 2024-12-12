import React from "react";
import {RadialMatrix as type} from "d3plus-matrix";
import Viz from "./Viz.js";

/**
    @function RadialMatrix
    @extends Viz
*/
const RadialMatrix = props => <Viz type={type} {...props} />;
export default RadialMatrix;
