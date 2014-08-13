var chart = require("./chart.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Line Plot
//------------------------------------------------------------------------------
var line = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This visualization is an extention of the Chart visualization.
  //----------------------------------------------------------------------------
  return chart(vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
line.requirements = [ "data" , "x" , "y" ]
line.setup = function(vars) {
  vars.self.x({ "scale" : "continuous" })
}
line.shapes       = [ "line" ]
line.tooltip      = "static"

module.exports = line
