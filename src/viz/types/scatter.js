var chart = require("./chart.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Scatterplot
//------------------------------------------------------------------------------
var scatter = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This visualization is an extention of the Chart visualization.
  //----------------------------------------------------------------------------
  return chart(vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
scatter.fill         = true
scatter.requirements = [ "data" , "x" , "y" ]
scatter.scale        = chart.scale
scatter.setup        = chart.setup
scatter.shapes       = [ "circle" , "square" , "donut" ]
scatter.tooltip      = "static"

module.exports = scatter
