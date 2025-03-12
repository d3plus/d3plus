import React from "react";
import {Network as type} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Network
    @extends Viz
*/
const Network = props => <Viz type={type} {...props} />;
export default Network;
