import React from "react";
import {StackedArea as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function StackedArea
    @extends Viz
*/
const StackedArea = props => <Viz type={type} {...props} />;
export default StackedArea;
