import React from "react";
import {Matrix as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Matrix
    @extends Viz
*/
const Matrix = props => <Viz type={type} {...props} />;
export default Matrix;
