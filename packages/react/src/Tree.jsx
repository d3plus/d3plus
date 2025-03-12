import React from "react";
import {Tree as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Tree
    @extends Viz
*/
const Tree = props => <Viz type={type} {...props} />;
export default Tree;
