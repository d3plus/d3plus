/**
  @function isData
  @desc Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with "url" and "headers" keys.
  @param {*} dataItem The value to be tested
*/
export default dataItem =>
  typeof dataItem === "string" ||
  typeof dataItem === "object" && dataItem.url && dataItem.headers;
