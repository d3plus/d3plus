import React from "react";
import {Tree as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Tree
    @extends Viz
*/
const Tree = props => <Viz instance={new Constructor()} {...props} />;
export default Tree;
