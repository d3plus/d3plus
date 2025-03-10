import React from "react";
import {Rings as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Rings
    @extends Viz
*/
const Rings = props => <Viz type={type} {...props} />;
export default Rings;
