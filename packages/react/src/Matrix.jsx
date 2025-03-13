import React from "react";
import {Matrix as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Matrix
    @extends Viz
*/
const Matrix = props => <Viz instance={new Constructor()} {...props} />;
export default Matrix;
