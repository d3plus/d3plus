import React from "react";
import {BoxWhisker as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function BoxWhisker
    @extends Viz
*/
const BoxWhisker = props => <Viz instance={new Constructor()} {...props} />;
export default BoxWhisker;
