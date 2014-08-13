//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cleans edges list and populates nodes list if needed
//-------------------------------------------------------------------
module.exports = function( vars ) {

  if ( vars.dev.value ) {
    var timerString = "analyzing edges list"
    d3plus.console.time( timerString )
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

    if (typeof e[vars.edges.source] !== "object") {
      var obj = {}
      obj[vars.id.value] = e[vars.edges.source]
      e[vars.edges.source] = obj
    }
    if (typeof e[vars.edges.target] !== "object") {
      var obj = {}
      obj[vars.id.value] = e[vars.edges.target]
      e[vars.edges.target] = obj
    }

    if (!("keys" in vars.data)) {
      vars.data.keys = {}
    }

    if (!(vars.id.value in vars.data.keys)) {
      vars.data.keys[vars.id.value] = typeof e[vars.edges.source][vars.id.value]
    }

    if ( createNodes ) {
      if (placed.indexOf(e[vars.edges.source][vars.id.value]) < 0) {
        placed.push(e[vars.edges.source][vars.id.value])
        vars.nodes.value.push(e[vars.edges.source])
      }
      if (placed.indexOf(e[vars.edges.target][vars.id.value]) < 0) {
        placed.push(e[vars.edges.target][vars.id.value])
        vars.nodes.value.push(e[vars.edges.target])
      }
    }

  })

  vars.edges.value = vars.edges.value.filter(function(e){

    var source = e[vars.edges.source][vars.id.value]
      , target = e[vars.edges.target][vars.id.value]

    if ( source === target ) {
      var str = vars.format.locale.value.dev.sameEdge
      d3plus.console.warning(d3plus.string.format(str,"\""+source+"\"") , "edges" )
      return false
    }
    else {
      return true
    }

  })

  vars.edges.linked = true

  if ( vars.dev.value ) d3plus.console.timeEnd( timerString )

}
