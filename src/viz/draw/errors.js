//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.errors = function(vars) {

  if ( vars.dev.value ) d3plus.console.time("checking for errors")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required variables set
  //----------------------------------------------------------------------------
  var reqs = ["id"]
  if (d3plus.visualization[vars.type.value].requirements) {
    reqs = reqs.concat(d3plus.visualization[vars.type.value].requirements)
  }

  var missing = []
  reqs.forEach(function(r){
    if (!vars[r].value) missing.push("\""+r+"\"")
  })

  if ( missing.length > 1 ) {
    var str = vars.format.locale.value.error.methods
      , app = vars.format.locale.value.visualization[vars.type.value]
      , and = vars.format.locale.value.ui.and
    missing = d3plus.string.list(missing,and)
    vars.internal_error = d3plus.string.format(str,app,missing)
  }
  else if ( missing.length === 1 ) {
    var str = vars.format.locale.value.error.method
      , app = vars.format.locale.value.visualization[vars.type.value]
    vars.internal_error = d3plus.string.format(str,app,missing[0])
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have focus connections, if needed
  //----------------------------------------------------------------------------
  if (!vars.internal_error && reqs.indexOf("edges") >= 0 && reqs.indexOf("focus") >= 0) {
    var connections = vars.edges.connections(vars.focus.value,vars.id.value)
    if (connections.length == 0) {
      var name = d3plus.variable.text(vars,vars.focus.value,vars.depth.value)
        , str = vars.format.locale.value.error.connections
      vars.internal_error = d3plus.string.format(str,"\""+name+"\"")
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
    if (!window[r]) missing.push("\""+r+"\"")
  })

  if ( missing.length > 1 ) {
    var str = vars.format.locale.value.error.libs
      , app = vars.format.locale.value.visualization[vars.type.value]
      , and = vars.format.locale.value.ui.and
    missing = d3plus.string.list(missing,and)
    vars.internal_error = d3plus.string.format(str,app,missing)
  }
  else if ( missing.length === 1 ) {
    var str = vars.format.locale.value.error.lib
      , app = vars.format.locale.value.visualization[vars.type.value]
    vars.internal_error = d3plus.string.format(str,app,missing[0])
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set shape
  //----------------------------------------------------------------------------
  if (!vars.shape.value) {
    vars.shape.value = d3plus.visualization[vars.type.value].shapes[0]
  }
  else if (d3plus.visualization[vars.type.value].shapes.indexOf(vars.shape.value) < 0) {
    var shapes = d3plus.visualization[vars.type.value].shapes.join("\", \"")
      , str = vars.format.locale.value.error.accepted
      , shape = "\""+vars.shape.value+"\""
      , shapeStr = vars.format.locale.value.method.shape
      , app = vars.format.locale.value.visualization[vars.type.value]
    d3plus.console.warning(d3plus.string.format(str,shape,shapeStr,app,"\""+shapes+"\""))
    vars.shape.previous = vars.shape.value
    vars.shape.value = d3plus.visualization[vars.type.value].shapes[0]
    var str = vars.format.locale.value.dev.setLong
      , shape = "\""+vars.shape.value+"\""
    d3plus.console.warning(d3plus.string.format(str,shapeStr,shape))
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
        , str = vars.format.locale.value.error.accepted
        , mode = "\""+vars.type.mode.value+"\""
        , modeStr = vars.format.locale.value.method.mode
        , app = vars.format.locale.value.visualization[vars.type.value]
      d3plus.console.warning(d3plus.string.format(str,mode,modeStr,app,"\""+modes+"\""))
      vars.type.mode.previous = vars.type.mode.value
      vars.type.mode.value = d3plus.visualization[vars.type.value].modes[0]
      var str = vars.format.locale.value.dev.setLong
        , mode = "\""+vars.type.mode.value+"\""
      d3plus.console.warning(d3plus.string.format(str,modeStr,mode))
    }
  }

  if ( vars.dev.value ) d3plus.console.timeEnd("checking for errors")

}
