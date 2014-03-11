d3plus.apps.network = {}
d3plus.apps.network.data = "object";
d3plus.apps.network.requirements = ["nodes","edges"];
d3plus.apps.network.tooltip = "static"
d3plus.apps.network.shapes = ["circle","square","donut"];
d3plus.apps.network.scale = 1.05
d3plus.apps.network.nesting = false

d3plus.apps.network.draw = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Use filtered lists if they are available
  //-------------------------------------------------------------------
  var nodes = vars.nodes.restricted || vars.nodes.value,
      edges = vars.edges.restricted || vars.edges.value

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Determine Size Scale
  //-------------------------------------------------------------------
  var x_range = d3.extent(d3.values(nodes), function(d){return d.x}),
      y_range = d3.extent(d3.values(nodes), function(d){return d.y}),
      aspect = (x_range[1]-x_range[0])/(y_range[1]-y_range[0])

  // Calculate overall network size based on aspect ratio
  if (aspect > vars.app_width/vars.app_height) {
    var network_height = vars.app_width/aspect,
        network_width = vars.app_width,
        offset_top = ((vars.app_height-network_height)/2),
        offset_left = 0
  } else {
    var network_width = vars.app_height*aspect,
        network_height = vars.app_height,
        offset_left = ((vars.app_width-network_width)/2),
        offset_top = 0
  }

  // Set X and Y position scales
  var scale = {}
  scale.x = d3.scale.linear()
    .domain(x_range)
    .range([offset_left, vars.app_width-offset_left])
  scale.y = d3.scale.linear()
    .domain(y_range)
    .range([offset_top, vars.app_height-offset_top])

  var val_range = d3.extent(d3.values(vars.data.app), function(d){
    var val = d3plus.variable.value(vars,d,vars.size.key)
    return val == 0 ? null : val
  });

  if (typeof val_range[0] == "undefined") val_range = [1,1]

  var distances = []
  nodes.forEach(function(n1){
    nodes.forEach(function(n2){
      if (n1 != n2) {
        var xx = Math.abs(scale.x(n1.x)-scale.x(n2.x));
        var yy = Math.abs(scale.y(n1.y)-scale.y(n2.y));
        distances.push(Math.sqrt((xx*xx)+(yy*yy)))
      }
    })
  })

  var max_size = d3.min(distances,function(d){
    return d;
  })
  max_size = max_size*(max_size/800)
  var min_size = 4;

  // Add buffers to position scales
  scale.x.range([offset_left+(max_size*1.5), vars.app_width-(max_size*1.5)-offset_left])
  scale.y.range([offset_top+(max_size*1.5), vars.app_height-(max_size*1.5)-offset_top])

  // Create size scale
  scale.r = d3.scale[vars.size.scale.value]()
    .domain(val_range)
    .range([min_size, max_size])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match nodes to data
  //-------------------------------------------------------------------
  var data = [], lookup = {}
  nodes.forEach(function(n){
    if (vars.data.app[n[vars.id.key]]) {
      var obj = d3plus.utils.merge(n,vars.data.app[n[vars.id.key]])
    }
    else {
      var obj = d3plus.utils.copy(n)
    }
    obj.d3plus = {}
    obj.d3plus.x = scale.x(n.x)
    obj.d3plus.y = scale.y(n.y)
    lookup[obj[vars.id.key]] = {
      "x": obj.d3plus.x,
      "y": obj.d3plus.y
    }
    var val = d3plus.variable.value(vars,obj,vars.size.key)
    obj.d3plus.r = val ? scale.r(val) : scale.r.range()[0]
    data.push(obj)
  })

  data.sort(function(a,b){
    return b.d3plus.r - a.d3plus.r
  })

  edges.forEach(function(l,i){
    if (typeof l.source != "object") {
      var obj = {}
      obj[vars.id.key] = l.source
      l.source = obj
    }
    l.source.d3plus = {}
    var id = l.source[vars.id.key]
    l.source.d3plus.x = lookup[id].x
    l.source.d3plus.y = lookup[id].y
    if (typeof l.target != "object") {
      var obj = {}
      obj[vars.id.key] = l.target
      l.target = obj
    }
    l.target.d3plus = {}
    var id = l.target[vars.id.key]
    l.target.d3plus.x = lookup[id].x
    l.target.d3plus.y = lookup[id].y
  })

  return {"nodes": data, "edges": edges}

}
