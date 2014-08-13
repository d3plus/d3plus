var chart = require("./chart.js"),
    dataThreshold = require("../../core/data/threshold.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Stacked Area Chart
//------------------------------------------------------------------------------
var stacked = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This visualization is an extention of the Chart visualization.
  //----------------------------------------------------------------------------
  return chart(vars)

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
stacked.filter       = function( vars , data ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Merge data points below the threshold
  //----------------------------------------------------------------------------
  return dataThreshold( vars , data , vars.x.value )

}
stacked.requirements = [ "data" , "x" , "y" ]

stacked.setup        = function( vars ) {

  vars.self
    .x({ "scale" : "continuous" , "zerofill" : true })
    .y({ "stacked" : true })

  var y    = vars.y
    , size = vars.size

  if ( ( !y.value && size.value ) || ( size.changed && size.previous === y.value ) ) {

    vars.self.y( size.value )

  }
  else if ( ( !size.value && y.value ) || ( y.changed && y.previous === size.value ) ) {

    vars.self.size( y.value )

  }

}

stacked.shapes       = [ "area" ]
stacked.threshold    = function( vars ) {
  return 20 / vars.height.viz
}
stacked.tooltip      = "static"

module.exports = stacked
