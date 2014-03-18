//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Cleans edges list and populates nodes list if needed
//-------------------------------------------------------------------
d3plus.data.edges = function(vars) {

  var node_req = d3plus.apps[vars.type.value].requirements.indexOf("nodes") >= 0,
      node_create = node_req && !vars.nodes.value

  if (node_create) {
    vars.nodes.value = []
    var placed = []
    vars.nodes.changed = true
  }

  vars.edges.value.forEach(function(e){

    if (typeof e.source != "object") {
      var obj = {}
      obj[vars.id.key] = e.source
      e.source = obj
    }
    if (typeof e.target != "object") {
      var obj = {}
      obj[vars.id.key] = e.target
      e.target = obj
    }

    if (node_create) {
      if (placed.indexOf(e.source[vars.id.key]) < 0) {
        placed.push(e.source[vars.id.key])
        vars.nodes.value.push(e.source)
      }
      if (placed.indexOf(e.target[vars.id.key]) < 0) {
        placed.push(e.target[vars.id.key])
        vars.nodes.value.push(e.target)
      }
    }

  })

  vars.edges.linked = true

}
