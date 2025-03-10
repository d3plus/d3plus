import React from "react";
import {Radar as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Radar
    @extends Viz
*/
const Radar = props => <Viz type={type} {...props} />;
export default Radar;
