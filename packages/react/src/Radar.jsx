import React from "react";
import {Radar as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Radar
    @extends Viz
*/
const Radar = props => <Viz instance={new Constructor()} {...props} />;
export default Radar;
