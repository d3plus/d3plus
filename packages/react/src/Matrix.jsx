import React from "react";
import {Matrix as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Matrix
    @extends Viz
*/
const Matrix = props => <Viz type={type} {...props} />;
export default Matrix;
