d3plus.apps.tree_map = {}
d3plus.apps.tree_map.modes = ["squarify","slice","dice","slice-dice"];
d3plus.apps.tree_map.requirements = ["data","size"];
d3plus.apps.tree_map.tooltip = "follow"
d3plus.apps.tree_map.shapes = ["square"];
d3plus.apps.tree_map.threshold = 0.0005;

d3plus.apps.tree_map.draw = function(vars) {

  d3plus.data.threshold(vars)

  var grouped_data = d3.nest()

  vars.id.nesting.forEach(function(n,i){
    if (i < vars.depth.value) {
      grouped_data.key(function(d){return d[n]})
    }
  })

  grouped_data = grouped_data.entries(vars.data.app)

  var data = d3.layout.treemap()
    .mode(vars.type.mode.value)
    .round(true)
    .size([vars.app_width, vars.app_height])
    .children(function(d) { return d.values; })
    .padding(1)
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d3plus.variable.value(vars,d,vars.size.value); })
    .nodes({"name":"root", "values": grouped_data})
    .filter(function(d) {
      return !d.values && d.area;
    })

  if (data.length) {

    var root = data[0]
    while (root.parent) {
      root = root.parent
    }

    data.forEach(function(d){
      d.d3plus.x = d.x+d.dx/2
      d.d3plus.y = d.y+d.dy/2
      d.d3plus.width = d.dx
      d.d3plus.height = d.dy
      d.d3plus.share = d.value/root.value
    })

  }

  return data

}
