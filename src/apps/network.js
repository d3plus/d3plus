d3plus.apps.network = {}
d3plus.apps.network.requirements = ["nodes","edges"];
d3plus.apps.network.tooltip = "static"
d3plus.apps.network.shapes = ["circle","square","donut"];
d3plus.apps.network.scale = 1.05
d3plus.apps.network.nesting = false
d3plus.apps.network.zoom = true

d3plus.apps.network.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Use filtered lists if they are available
  //-------------------------------------------------------------------
  var nodes = vars.nodes.restricted || vars.nodes.value,
      edges = vars.edges.restricted || vars.edges.value

  var x_range = d3.extent(nodes,function(n){return n.x}),
      y_range = d3.extent(nodes,function(n){return n.y})

  var val_range = d3.extent(nodes, function(d){
    var val = d3plus.variable.value(vars,d,vars.size.value)
    return val == 0 ? null : val
  });

  if (typeof val_range[0] == "undefined") val_range = [1,1]

  var max_size = d3.min(d3plus.util.distances(nodes))

  if (vars.edges.arrows.value) {
    max_size = max_size*0.45
  }
  else {
    max_size = max_size*0.6
  }

  if (val_range[0] == val_range[1]) {
    var min_size = max_size
  }
  else {

    var width = (x_range[1]+max_size*1.1)-(x_range[0]-max_size*1.1),
        height = (y_range[1]+max_size*1.1)-(y_range[0]-max_size*1.1)
        aspect = width/height,
        app = vars.app_width/vars.app_height

    if (app > aspect) {
      var scale = vars.app_height/height
    }
    else {
      var scale = vars.app_width/width
    }
    var min_size = max_size*0.25
    if (min_size*scale < 3) {
      min_size = 3/scale
    }

  }

  // Create size scale
  var radius = d3.scale[vars.size.scale.value]()
    .domain(val_range)
    .rangeRound([min_size, max_size])

  vars.zoom.bounds = [[x_range[0]-max_size*1.1,y_range[0]-max_size*1.1],[x_range[1]+max_size*1.1,y_range[1]+max_size*1.1]]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match nodes to data
  //-------------------------------------------------------------------
  var data = [], lookup = {}
  nodes.forEach(function(n){

    var d = vars.data.app.filter(function(a){
      return a[vars.id.value] == n[vars.id.value]
    })[0]

    if (d) {
      var obj = d3plus.util.merge(n,d)
    }
    else {
      var obj = d3plus.util.copy(n)
    }

    obj.d3plus = {}
    obj.d3plus.x = n.x
    obj.d3plus.y = n.y
    var val = d3plus.variable.value(vars,obj,vars.size.value)
    obj.d3plus.r = val ? radius(val) : radius.range()[0]
    lookup[obj[vars.id.value]] = {
      "x": obj.d3plus.x,
      "y": obj.d3plus.y,
      "r": obj.d3plus.r
    }
    data.push(obj)
  })

  data.sort(function(a,b){
    return b.d3plus.r - a.d3plus.r
  })

  edges.forEach(function(l,i){

    l[vars.edges.source] = d3plus.util.copy(l[vars.edges.source])
    l[vars.edges.source].d3plus = {}

    var source = lookup[l[vars.edges.source][vars.id.value]]
    l[vars.edges.source].d3plus.r = source.r
    l[vars.edges.source].d3plus.x = source.x
    l[vars.edges.source].d3plus.y = source.y

    l[vars.edges.target] = d3plus.util.copy(l[vars.edges.target])
    l[vars.edges.target].d3plus = {}

    var target = lookup[l[vars.edges.target][vars.id.value]]
    l[vars.edges.target].d3plus.r = target.r
    l[vars.edges.target].d3plus.x = target.x
    l[vars.edges.target].d3plus.y = target.y

  })

  return {"nodes": data, "edges": edges}

}
