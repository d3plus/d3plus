var dataThreshold = require("../../core/data/threshold.js"),
    fetchValue = require("../../core/fetch/value.js"),
    groupData = require("../../core/data/group.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Tree Map
//------------------------------------------------------------------------------
var tree_map = function(vars) {

  grouped_data = groupData(vars,vars.data.app)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Pass data through the D3js .treemap() layout.
  //----------------------------------------------------------------------------
  var data = d3.layout.treemap()
    .mode(vars.type.mode.value)
    .round(true)
    .size([ vars.width.viz , vars.height.viz ])
    .children(function(d) {

      return d.values

    })
    .padding(1)
    .sort(function(a, b) {

      var sizeDiff = a.value - b.value
      return sizeDiff === 0 ? a.id < b.id : sizeDiff

    })
    .nodes({
      "name":"root",
      "values": grouped_data
    })
    .filter(function(d) {

      return !d.values && d.area

    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If the "data" array has entries...
  //----------------------------------------------------------------------------
  if (data.length) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create the "root" node to use when calculating share percentage.
    //--------------------------------------------------------------------------
    var root = data[0]

    while (root.parent) {

      root = root.parent

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Calculate the position, size, and share percentage of each square.
    //--------------------------------------------------------------------------
    var returnData = []
    data.forEach(function(d){

      d.d3plus.d3plus = d3plus.object.merge(d.d3plus.d3plus,{
        "x": d.x+d.dx/2,
        "y": d.y+d.dy/2,
        "width": d.dx,
        "height": d.dy,
        "share": d.value/root.value
      })

      returnData.push(d.d3plus)

    })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Return the data array.
  //----------------------------------------------------------------------------
  return returnData

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
tree_map.filter       = function( vars , data ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Merge data points below the threshold
  //----------------------------------------------------------------------------
  return dataThreshold( vars , data )

}
tree_map.modes        = ["squarify", "slice", "dice", "slice-dice"]
tree_map.requirements = ["data", "size"]
tree_map.shapes       = ["square"]
tree_map.threshold    = function( vars ) {
  return ( 40 * 40 ) / (vars.width.viz * vars.height.viz)
}
tree_map.tooltip      = "follow"

module.exports = tree_map
