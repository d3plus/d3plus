/**
    @function s
    @desc Returns 4 random characters, used for constructing unique identifiers.
    @private
*/
function s(): string {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

/**
    @function uuid
    @summary Returns a unique identifier.
*/
export default function uuid(): string {
  return `${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`;
}
