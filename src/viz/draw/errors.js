//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.errors = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required variables set
  //----------------------------------------------------------------------------
  var reqs = ["id"]
  if (d3plus.visualization[vars.type.value].requirements) {
    reqs = reqs.concat(d3plus.visualization[vars.type.value].requirements)
  }
  var missing = []
  reqs.forEach(function(r){
    if (!vars[r].value) missing.push(r)
  })
  if (missing.length) {
    vars.internal_error = "The following variables need to be set: "+missing.join(", ")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have focus connections, if needed
  //----------------------------------------------------------------------------
  if (!vars.internal_error && reqs.indexOf("edges") >= 0 && reqs.indexOf("focus") >= 0) {
    var connections = vars.edges.connections(vars.focus.value,vars.id.value)
    if (connections.length == 0) {
      var name = d3plus.variable.text(vars,vars.focus.value,vars.depth.value)
      vars.internal_error = "No Connections Available for \""+name+"\""
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required libraries
  //----------------------------------------------------------------------------
  var reqs = ["d3"]
  if (d3plus.visualization[vars.type.value].libs) {
    reqs = reqs.concat(d3plus.visualization[vars.type.value].libs)
  }
  var missing = []
  reqs.forEach(function(r){
    if (!window[r]) missing.push(r)
  })
  if (missing.length) {
    var libs = missing.join(", ")
    vars.internal_error = "The following libraries need to be loaded: "+libs
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set shape
  //----------------------------------------------------------------------------
  if (!vars.shape.value) {
    vars.shape.value = d3plus.visualization[vars.type.value].shapes[0]
  }
  else if (d3plus.visualization[vars.type.value].shapes.indexOf(vars.shape.value) < 0) {
    var shapes = d3plus.visualization[vars.type.value].shapes.join("\", \"")
    d3plus.console.warning("\""+vars.shape.value+"\" is not an accepted shape for the \""+vars.type.value+"\" app, please use one of the following: \""+shapes+"\"")
    vars.shape.previous = vars.shape.value
    vars.shape.value = d3plus.visualization[vars.type.value].shapes[0]
    d3plus.console.log("Defaulting shape to \""+vars.shape.value+"\"")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set "mode"
  //----------------------------------------------------------------------------
  if ("modes" in d3plus.visualization[vars.type.value]) {
    if (!vars.type.mode.value) {
      vars.type.mode.value = d3plus.visualization[vars.type.value].modes[0]
    }
    else if (d3plus.visualization[vars.type.value].modes.indexOf(vars.type.mode.value) < 0) {
      var modes = d3plus.visualization[vars.type.value].modes.join("\", \"")
      d3plus.console.warning("\""+vars.type.mode.value+"\" is not an accepted mode for the \""+vars.type.value+"\" app, please use one of the following: \""+modes+"\"")
      vars.type.mode.previous = vars.type.mode.value
      vars.type.mode.value = d3plus.visualization[vars.type.value].modes[0]
      d3plus.console.log("Defaulting mode to \""+vars.type.mode.value+"\"")
    }
  }

}
