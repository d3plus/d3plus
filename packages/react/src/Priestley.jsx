import React from "react";
import {Priestley as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Priestley
    @extends Viz
*/
const Priestley = props => <Viz type={type} {...props} />;
export default Priestley;
