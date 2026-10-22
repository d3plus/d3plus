import {rectLikeBuffer} from "./rectLikeBuffer.js";

/**
    @module boxBuffer
    Adds a buffer to either side of the non-discrete axis.
    @private
*/
export default rectLikeBuffer({
  stackKey: (d, discrete) => d[discrete],
  fromZero: false,
});
