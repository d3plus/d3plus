import {bumpChartDef} from "./ChartDefinition.js";
import {default as Plot} from "./Plot.js";

/**
    Creates a bump chart based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .discrete("x")
  .shape("Line")
  .y2(d => this._y(d))
  .yConfig({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const startData = data.filter(d => d.x === xDomain[0]);
      const d = startData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .y2Config({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const endData = data.filter(d => d.x === xDomain[xDomain.length - 1]);
      const d = endData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .ySort((a, b) => b.y - a.y)
  .y2Sort((a, b) => b.y - a.y)
*/
export default class BumpChart extends Plot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3: scalar defaults sourced from bumpChartDef.
    this._discrete = bumpChartDef.defaults.discrete as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._shape = bumpChartDef.defaults.shape as any;
    this.y2((d: Record<string, unknown>) => this._y(d));

    this.yConfig({
      tickFormat: (val: number) => {
        const data = this._formattedData;
        const xMin =
          data[0].x instanceof Date ? data[0].x.getTime() : data[0].x;
        const startData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMin,
        );
        const d = startData.find((d: Record<string, unknown>) => d.y === val);
        return d ? this._drawLabel(d, d.i) : "";
      },
    });
    this.y2Config({
      tickFormat: (val: number) => {
        const data = this._formattedData;
        const xMax =
          data[data.length - 1].x instanceof Date
            ? data[data.length - 1].x.getTime()
            : data[data.length - 1].x;
        const endData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMax,
        );
        const d = endData.find((d: Record<string, unknown>) => d.y === val);
        return d ? this._drawLabel(d, d.i) : "";
      },
    });
    this.ySort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        this._y(b) - this._y(a),
    );
    this.y2Sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        this._y(b) - this._y(a),
    );
  }
}
