/**
    @function s
    @desc Returns 4 random characters, used for constructing unique identifiers.
    @private
*/
function s() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

/**
    @function uuid
    @summary Returns a unique identifier.
*/
export default function() {
  return `${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`;
}
