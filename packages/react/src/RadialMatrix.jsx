import React from "react";
import {RadialMatrix as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function RadialMatrix
    @extends Viz
*/
const RadialMatrix = props => <Viz instance={new Constructor()} {...props} />;
export default RadialMatrix;
