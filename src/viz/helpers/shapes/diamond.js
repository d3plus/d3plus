var shapeStyle  = require("./style.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
module.exports = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize check scale on enter and exit.
  //----------------------------------------------------------------------------
  function init(paths){
    paths.attr("d", d3.svg.symbol().type("diamond").size(10))
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Change scale of check on update.
  //---------------------------------------------------------------------------
  function update(paths){
    paths.attr("d", d3.svg.symbol().type("diamond").size(function(d){
      var smaller_dim = Math.min(d.d3plus.width, d.d3plus.height);
      return d3.scale.pow().exponent(2)(smaller_dim/2);
    }))
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Enter
  //----------------------------------------------------------------------------
  enter.append("path").attr("class","d3plus_data")
    .call(init)
    .call(shapeStyle,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Update
  //----------------------------------------------------------------------------
  selection.selectAll("path.d3plus_data")
    .data(function(d) {
      return [d];
    })

  if (vars.draw.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.draw.timing)
        .call(update)
        .call(shapeStyle,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .call(update)
      .call(shapeStyle,vars)
  }

}
