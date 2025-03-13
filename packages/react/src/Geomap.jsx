import React from "react";
import {Geomap as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Geomap
    @extends Viz
*/
const Geomap = props => <Viz instance={new Constructor()} {...props} />;
export default Geomap;
