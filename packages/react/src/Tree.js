import React from "react";
import {Tree as type} from "d3plus-hierarchy";
import Viz from "./Viz.js";

/**
    @function Tree
    @extends Viz
*/
const Tree = props => <Viz type={type} {...props} />;
export default Tree;
