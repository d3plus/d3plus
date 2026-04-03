import type {DataPoint} from "./DataPoint.js";

/**
  Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.
  @param arrayOfArrays Array of elements
  @param data The key in each element that contains the sub-array to concatenate.
*/
export default function (
  arrayOfArrays: (DataPoint[] | Record<string, DataPoint[]>)[],
  data: string = "data",
): DataPoint[] {
  return arrayOfArrays.reduce<DataPoint[]>((acc, item) => {
    let dataArray: DataPoint[] = [];
    if (Array.isArray(item)) {
      dataArray = item;
    } else if (item[data]) {
      dataArray = item[data] as DataPoint[];
    }
    return acc.concat(dataArray);
  }, []);
}
