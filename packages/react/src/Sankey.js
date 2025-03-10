import React from "react";
import {Sankey as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Sankey
    @extends Viz
*/
const Sankey = props => <Viz type={type} {...props} />;
export default Sankey;
