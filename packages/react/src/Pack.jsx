import React from "react";
import {Pack as Constructor} from "@d3plus/core";
import Viz from "./Viz.jsx";

/**
    @function Pack
    @extends Viz
*/
const Pack = props => <Viz instance={new Constructor()} {...props} />;
export default Pack;
