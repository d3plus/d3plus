var fetchText = require("../../core/fetch/text.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
d3plus.draw.errors = function(vars) {

  if ( vars.dev.value ) d3plus.console.time("checking for errors")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required variables set
  //----------------------------------------------------------------------------
  var reqs = ["id"]
    , app_reqs = vars.types[vars.type.value].requirements
  if (app_reqs) {
    if (!(app_reqs instanceof Array)) reqs.push(app_reqs)
    else reqs = reqs.concat(vars.types[vars.type.value].requirements)
  }

  var missing = []
  reqs.forEach(function(r){
    if (typeof r === "string") {
      if (!vars[r].value) missing.push("\""+r+"\"")
    }
    else if (typeof r === "function") {
      var reqReturn = r(vars)
      if (!reqReturn.status && reqReturn.text) {
        missing.push("\""+reqReturn.text+"\"")
      }
    }
  })

  if ( missing.length > 1 ) {
    var str = vars.format.locale.value.error.methods
      , app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
      , and = vars.format.locale.value.ui.and
    missing = d3plus.string.list(missing,and)
    vars.internal_error = d3plus.string.format(str,app,missing)
  }
  else if ( missing.length === 1 ) {
    var str = vars.format.locale.value.error.method
      , app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
    vars.internal_error = d3plus.string.format(str,app,missing[0])
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have focus connections, if needed
  //----------------------------------------------------------------------------
  if (!vars.internal_error && reqs.indexOf("edges") >= 0 && reqs.indexOf("focus") >= 0) {
    var connections = vars.edges.connections(vars.focus.value[0],vars.id.value)
    if (connections.length == 0) {
      var name = fetchText(vars,vars.focus.value[0],vars.depth.value)
        , str = vars.format.locale.value.error.connections
      vars.internal_error = d3plus.string.format(str,"\""+name+"\"")
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have all required libraries
  //----------------------------------------------------------------------------
  var reqs = ["d3"]
  if (vars.types[vars.type.value].libs) {
    reqs = reqs.concat(vars.types[vars.type.value].libs)
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
  var shapes = vars.types[vars.type.value].shapes || ["circle"]
  if (!(shapes instanceof Array)) shapes = [shapes]

  if (!vars.shape.value) {
    vars.self.shape(shapes.length ? shapes[0] : "circle")
  }
  else if (shapes.indexOf(vars.shape.value) < 0) {
    var shapes = vars.types[vars.type.value].shapes
      , str = vars.format.locale.value.error.accepted
      , shape = "\""+vars.shape.value+"\""
      , shapeStr = vars.format.locale.value.method.shape
      , app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
    d3plus.console.warning(d3plus.string.format(str,shape,shapeStr,app,"\""+shapes.join("\", \"")+"\""),"shape")
    vars.self.shape(shapes.length ? shapes[0] : "circle")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set "mode"
  //----------------------------------------------------------------------------
  if ("modes" in vars.types[vars.type.value]) {
    if (!vars.type.mode.value) {
      vars.self.type({"mode": vars.types[vars.type.value].modes[0]})
    }
    else if (vars.types[vars.type.value].modes.indexOf(vars.type.mode.value) < 0) {
      var modes = vars.types[vars.type.value].modes.join("\", \"")
        , str = vars.format.locale.value.error.accepted
        , mode = "\""+vars.type.mode.value+"\""
        , modeStr = vars.format.locale.value.method.mode
        , app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
      d3plus.console.warning(d3plus.string.format(str,mode,modeStr,app,"\""+modes+"\""))
      vars.self.type({"mode": vars.types[vars.type.value].modes[0]})
    }
  }

  if ( vars.dev.value ) d3plus.console.timeEnd("checking for errors")

}
