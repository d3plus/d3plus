import {createContext} from "react";
import type {D3plusConfig} from "@d3plus/core";

/**
    @function D3plusContext
    @desc A React context instance used to provide global config options via a provider (D3plusContext.Provider).
*/
const D3plusContext = createContext<D3plusConfig>({});
export default D3plusContext;
