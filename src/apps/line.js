d3plus.apps.line = {}
d3plus.apps.line.data = "grouped";
d3plus.apps.line.requirements = ["x","y"];
d3plus.apps.line.tooltip = "static";
d3plus.apps.line.shapes = ["line"];

d3plus.apps.line.setup = function(vars) {

  vars.x.scale.value = "continuous"
  
}

d3plus.apps.line.draw = function(vars) {
  
  return d3plus.apps.chart.draw(vars)
  
}
