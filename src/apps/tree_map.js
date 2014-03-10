d3plus.apps.tree_map = {}
d3plus.apps.tree_map.data = "nested";
d3plus.apps.tree_map.requirements = ["size"];
d3plus.apps.tree_map.tooltip = "follow"
d3plus.apps.tree_map.shapes = ["square"];

d3plus.apps.tree_map.draw = function(vars) {

  var data = d3.layout.treemap()
    .round(false)
    .size([vars.app_width, vars.app_height])
    .children(function(d) { return d.children; })
    .padding(1)
    .sort(function(a, b) { return a.value - b.value; })
    .value(function(d) { return d3plus.variable.value(vars,d,vars.size.key); })
    .nodes({"name":"root", "children": vars.data.app})
    .filter(function(d) {
      return d.value > 0 && !d.children && d.area;
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
