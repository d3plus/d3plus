import React from "react";
import {Treemap as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Treemap
    @extends Viz
*/
const Treemap = props => <Viz type={type} {...props} />;
export default Treemap;
