import type {DataPoint} from "./DataPoint.js";

/**
  @function dataConcat
  @desc Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.
  @param {Array} arrayOfArray Array of elements
  @param {String} [data = "data"] The key used for the flat data array if exists inside of the JSON object.
*/
export default (
  arrayOfArrays: (DataPoint[] | Record<string, DataPoint[]>)[],
  data: string = "data",
): DataPoint[] =>
  arrayOfArrays.reduce<DataPoint[]>((acc, item) => {
    let dataArray: DataPoint[] = [];
    if (Array.isArray(item)) {
      dataArray = item;
    } else if (item[data]) {
      dataArray = item[data] as DataPoint[];
    }
    return acc.concat(dataArray);
  }, []);
