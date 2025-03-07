/**
  @function dataFold
  @desc Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.
  @param {Object} json A JSON data Object with `data` and `headers` keys.
  @param {String} [data = "data"] The key used for the flat data array inside of the JSON object.
  @param {String} [headers = "headers"] The key used for the flat headers array inside of the JSON object.
*/
export default (json, data = "data", headers = "headers") =>
  json[data].map(data =>
    json[headers].reduce((obj, header, i) =>
      (obj[header] = data[i], obj), {}));
