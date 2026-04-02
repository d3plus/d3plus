import type {DataPoint} from "./DataPoint.js";

interface FoldableJSON {
  [key: string]: (string | number | boolean)[][] | string[];
}

/**
  @function dataFold
  @desc Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.
  @param {Object} json A JSON data Object with `data` and `headers` keys.
  @param {String} [data = "data"] The key used for the flat data array inside of the JSON object.
  @param {String} [headers = "headers"] The key used for the flat headers array inside of the JSON object.
*/
export default (
  json: FoldableJSON,
  data: string = "data",
  headers: string = "headers",
): DataPoint[] =>
  (json[data] as (string | number | boolean)[][]).map(
    (row: (string | number | boolean)[]) =>
      (json[headers] as string[]).reduce(
        (obj: DataPoint, header: string, i: number) => (
          (obj[header] = row[i]),
          obj
        ),
        {} as DataPoint,
      ),
  );
