import React from "react";
import {Network as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Network
    @extends Viz
*/
const Network = props => <Viz instance={new Constructor()} {...props} />;
export default Network;
