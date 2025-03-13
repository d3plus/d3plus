import React from "react";
import {Pie as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Pie
    @extends Viz
*/
const Pie = props => <Viz instance={new Constructor()} {...props} />;
export default Pie;
