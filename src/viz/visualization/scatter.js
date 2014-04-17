//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Scatterplot
//------------------------------------------------------------------------------
d3plus.visualization.scatter = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This visualization is an extention of the Chart visualization.
  //----------------------------------------------------------------------------
  return d3plus.visualization.chart(vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
d3plus.visualization.scatter.deprecates     = [ "pie_scatter" ]
d3plus.visualization.scatter.fill           = true
d3plus.visualization.scatter.requirements = [ "data" , "x" , "y" ]
d3plus.visualization.scatter.scale        = d3plus.visualization.chart.scale
d3plus.visualization.scatter.shapes       = [ "circle" , "square" , "donut" ]
d3plus.visualization.scatter.tooltip      = "static"
