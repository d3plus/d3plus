import React from "react";
import {Priestley as type} from "d3plus-priestley";
import Viz from "./Viz.js";

/**
    @function Priestley
    @extends Viz
*/
const Priestley = props => <Viz type={type} {...props} />;
export default Priestley;
