var fetchText    = require("../../core/fetch/text.js"),
    print        = require("../../core/console/print.coffee"),
    rejected     = require("../../core/methods/rejected.coffee"),
    stringFormat = require("../../string/format.js"),
    stringList   = require("../../string/list.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Miscellaneous Error Checks
//------------------------------------------------------------------------------
module.exports = function(vars) {

  if ( vars.dev.value ) print.time("checking for errors")

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
    missing = stringList(missing,and)
    vars.error.internal = stringFormat(str,app,missing)
  }
  else if ( missing.length === 1 ) {
    var str = vars.format.locale.value.error.method
      , app = vars.format.locale.value.visualization[vars.type.value] || vars.type.value
    vars.error.internal = stringFormat(str,app,missing[0])
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if we have focus connections, if needed
  //----------------------------------------------------------------------------
  if (!vars.error.internal && reqs.indexOf("edges") >= 0 && reqs.indexOf("focus") >= 0) {
    var connections = vars.edges.connections(vars.focus.value[0],vars.id.value)
    if (connections.length == 0) {
      var name = fetchText(vars,vars.focus.value[0],vars.depth.value)
        , str = vars.format.locale.value.error.connections
      vars.error.internal = stringFormat(str,"\""+name+"\"")
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
    missing = stringList(missing,and)
    vars.error.internal = stringFormat(str,app,missing)
  }
  else if ( missing.length === 1 ) {
    var str = vars.format.locale.value.error.lib
      , app = vars.format.locale.value.visualization[vars.type.value]
    vars.error.internal = stringFormat(str,app,missing[0])
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set shape
  //----------------------------------------------------------------------------
  var shapes = vars.shape.accepted(vars);
  if (!(shapes instanceof Array)) shapes = [shapes]
  var shape = vars.shape.value;

  if (!shape || rejected(vars, shapes, shape, "shape")) {
    vars.self.shape(shapes[0]);
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the requested app supports the set "mode"
  //----------------------------------------------------------------------------
  if ("modes" in vars.types[vars.type.value]) {

    var modes = vars.types[vars.type.value].modes
    if (!(modes instanceof Array)) modes = [modes]
    var mode = vars.type.mode.value

    if (!mode || rejected(vars, modes, mode, "mode")) {
      vars.self.type({"mode": modes[0]})
    }

  }

  if ( vars.dev.value ) print.timeEnd("checking for errors")

}
