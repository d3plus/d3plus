//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Line Plot
//------------------------------------------------------------------------------
d3plus.visualization.line = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This visualization is an extention of the Chart visualization.
  //----------------------------------------------------------------------------
  return d3plus.visualization.chart(vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
d3plus.visualization.line.requirements = [ "data" , "x" , "y" ]

d3plus.visualization.line.setup = function(vars) {

  vars.x.scale.value = "continuous"
  if (vars.dev.value) d3plus.console.log("\"x\" scale set to \"continuous\"")

}

d3plus.visualization.line.shapes       = [ "line" ]
d3plus.visualization.line.tooltip      = "static"
