/**
    @interface DataPoint
    @desc Represents a single data point object used throughout d3plus visualizations.
*/
export interface DataPoint {
  [key: string]: string | number | boolean | DataPoint;
}
