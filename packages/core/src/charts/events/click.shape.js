/**
    @desc On click event for all shapes in a Viz.
    @param {Object} *d* The data object being interacted with.
    @param {Number} *i* The index of the data object being interacted with.
    @private
*/
export default function(d, i, x, event) {
  event.stopPropagation();

  if (this._drawDepth < this._groupBy.length - 1) {

    this._select.style("cursor", "auto");

    const filterGroup = this._groupBy[this._drawDepth],
          filterId = filterGroup(d, i);

    this.hover(false);
    if (this._tooltip(d, i)) this._tooltipClass.data([]).render();

    const oldFilter = this._filter;

    this._history.push({
      depth: this._depth,
      filter: oldFilter
    });

    this.config({
      depth: this._drawDepth + 1,
      filter: (f, x) => (!oldFilter || oldFilter(f, x)) && filterGroup(f, x) === filterId
    }).render();

  }

}
