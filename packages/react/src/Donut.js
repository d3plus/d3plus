import React from "react";
import {Donut as type} from "d3plus-hierarchy";
import Viz from "./Viz.js";

/**
    @function Donut
    @extends Viz
*/
const Donut = props => <Viz type={type} {...props} />;
export default Donut;
