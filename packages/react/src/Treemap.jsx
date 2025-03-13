import React from "react";
import {Treemap as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Treemap
    @extends Viz
*/
const Treemap = props => <Viz instance={new Constructor()} {...props} />;
export default Treemap;
