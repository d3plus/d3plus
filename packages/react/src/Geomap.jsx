import React from "react";
import {Geomap as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Geomap
    @extends Viz
*/
const Geomap = props => <Viz type={type} {...props} />;
export default Geomap;
