import React from "react";
import {Pie as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Pie
    @extends Viz
*/
const Pie = props => <Viz type={type} {...props} />;
export default Pie;
