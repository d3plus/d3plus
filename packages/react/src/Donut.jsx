import React from "react";
import {Donut as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Donut
    @extends Viz
*/
const Donut = props => <Viz instance={new Constructor()} {...props} />;
export default Donut;
