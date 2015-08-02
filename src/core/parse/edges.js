var print = require("../console/print.coffee"),
    stringFormat = require("../../string/format.js")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cleans edges list and populates nodes list if needed
//-------------------------------------------------------------------
module.exports = function( vars ) {

  if ( vars.dev.value ) {
    var timerString = "analyzing edges list"
    print.time( timerString )
  }

  var appReqs     = vars.types[vars.type.value].requirements
  if (!(appReqs instanceof Array)) appReqs = [appReqs]
  var createNodes = appReqs.indexOf("nodes") >= 0 && !vars.nodes.value

  if ( createNodes ) {
    vars.nodes.value = []
    var placed = []
    vars.nodes.changed = true
  }

  vars.edges.value.forEach(function(e){

    ["source", "target"].forEach(function(dir){

      var dirType = typeof e[vars.edges[dir]];

      if (dirType !== "object") {
        if (dirType === "number" && !createNodes && vars.data.keys[vars.id.value] !== "number") {
          e[vars.edges[dir]] = vars.nodes.value[e[vars.edges[dir]]];
        }
        else {
          if (createNodes && placed.indexOf(e[vars.edges[dir]]) >= 0) {
            e[vars.edges[dir]] = vars.nodes.value.filter(function(n){
              return n[vars.id.value] === e[vars.edges[dir]];
            })[0];
          }
          else {
            var obj = {};
            obj[vars.id.value] = e[vars.edges[dir]];
            e[vars.edges[dir]] = obj;
          }
        }
      }

      var newNode = e[vars.edges[dir]];
      if (createNodes) {
        if (placed.indexOf(newNode[vars.id.value]) < 0) {
          placed.push(newNode[vars.id.value]);
          vars.nodes.value.push(newNode);
        }
      }
    });

    if (!("keys" in vars.data)) {
      vars.data.keys = {};
    }

    if (!(vars.id.value in vars.data.keys)) {
      vars.data.keys[vars.id.value] = typeof e[vars.edges.source][vars.id.value];
    }

  });

  vars.edges.value = vars.edges.value.filter(function(e){

    var source = e[vars.edges.source][vars.id.value]
      , target = e[vars.edges.target][vars.id.value]

    if ( source === target ) {
      var str = vars.format.locale.value.dev.sameEdge
      print.warning(stringFormat(str,"\""+source+"\"") , "edges" )
      return false
    }
    else {
      return true
    }

  })

  vars.edges.linked = true

  if ( vars.dev.value ) print.timeEnd( timerString )

}
