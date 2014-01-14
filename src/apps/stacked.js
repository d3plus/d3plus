d3plus.apps.stacked = {}
d3plus.apps.stacked.data = "grouped";
d3plus.apps.stacked.requirements = ["x","y"];
d3plus.apps.stacked.tooltip = "static";
d3plus.apps.stacked.shapes = ["area"];

d3plus.apps.stacked.setup = function(vars) {

  vars.x.scale.default = "continuous"
  vars.x.zerofill.default = true
  vars.y.stacked.default = true
  
}

d3plus.apps.stacked.draw = function(vars) {
  
  return d3plus.apps.chart.draw(vars)
  
}
