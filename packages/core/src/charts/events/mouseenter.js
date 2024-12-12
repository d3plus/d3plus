/**
    @desc On mouseenter event for all shapes in a Viz.
    @param {Object} *d* The data object being interacted with.
    @param {Number} *i* The index of the data object being interacted with.
    @private
*/
export default function(d, i) {

  if (this._shapeConfig.hoverOpacity !== 1) {

    let filterIds = this._id(d, i);
    if (!(filterIds instanceof Array)) filterIds = [filterIds];
    
    this.hover((h, x) => {
      let id = this._id(h, x);
      if (!(id instanceof Array)) id = [id];
      return filterIds.some(f => id.includes(f));
    });

  }

}
