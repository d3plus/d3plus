import React from "react";
import {Rings as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Rings
    @extends Viz
*/
const Rings = props => <Viz instance={new Constructor()} {...props} />;
export default Rings;
