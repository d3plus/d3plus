import React from "react";
import {Network as type} from "@d3plus/core";
import Viz from "./Viz.js";

/**
    @function Network
    @extends Viz
*/
const Network = props => <Viz type={type} {...props} />;
export default Network;
