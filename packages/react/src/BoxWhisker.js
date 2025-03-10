import React from "react";
import {BoxWhisker as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function BoxWhisker
    @extends Viz
*/
const BoxWhisker = props => <Viz type={type} {...props} />;
export default BoxWhisker;
