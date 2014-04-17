d3plus.visualization.line = {}
d3plus.visualization.line.requirements = ["data","x","y"];
d3plus.visualization.line.tooltip = "static";
d3plus.visualization.line.shapes = ["line"];

d3plus.visualization.line.setup = function(vars) {

  vars.x.scale.value = "continuous"

}

d3plus.visualization.line.draw = function(vars) {

  return d3plus.visualization.chart.draw(vars)

}
