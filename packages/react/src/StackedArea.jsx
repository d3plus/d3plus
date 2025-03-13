import React from "react";
import {StackedArea as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function StackedArea
    @extends Viz
*/
const StackedArea = props => <Viz instance={new Constructor()} {...props} />;
export default StackedArea;
