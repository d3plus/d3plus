import React from "react";
import {Geomap as type} from "d3plus-geomap";
import Viz from "./Viz.js";

/**
    @function Geomap
    @extends Viz
*/
const Geomap = props => <Viz type={type} {...props} />;
export default Geomap;
