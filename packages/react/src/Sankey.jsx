import React from "react";
import {Sankey as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Sankey
    @extends Viz
*/
const Sankey = props => <Viz instance={new Constructor()} {...props} />;
export default Sankey;
