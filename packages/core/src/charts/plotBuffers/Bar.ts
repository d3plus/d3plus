import {rectLikeBuffer} from "./rectLikeBuffer.js";

/**
    @module barBuffer
    Adds a buffer to either side of the non-discrete axis, away from 0.
    @private
*/
export default rectLikeBuffer({
  stackKey: (d, discrete) => `${d[discrete]}_${d.group}`,
  fromZero: true,
});
