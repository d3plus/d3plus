import React from "react";
import {Priestley as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Priestley
    @extends Viz
*/
const Priestley = props => <Viz instance={new Constructor()} {...props} />;
export default Priestley;
