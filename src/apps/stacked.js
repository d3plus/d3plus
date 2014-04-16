d3plus.apps.stacked = {}
d3plus.apps.stacked.requirements = ["data","x","y"];
d3plus.apps.stacked.tooltip = "static";
d3plus.apps.stacked.shapes = ["area"];
d3plus.apps.stacked.threshold = 0.03;

d3plus.apps.stacked.setup = function(vars) {

  if (vars.dev.value) d3plus.console.time("setting local variables")
  vars.x.scale.value = "continuous"
  if (vars.dev.value) console.log("\"x\" scale set to \"continuous\"")
  vars.x.zerofill.value = true
  if (vars.dev.value) console.log("\"x\" zerofill set to \"true\"")
  vars.y.stacked.value = true
  if ((!vars.y.value && vars.size.value) || (vars.size.changed && vars.size.previous == vars.y.value)) {
    vars.y.value = vars.size.value
    vars.y.changed = true
  }
  else if ((!vars.size.value && vars.y.value) || (vars.y.changed && vars.y.previous == vars.size.value)) {
    vars.size.value = vars.y.value
    vars.size.changed = true
  }
  if (vars.dev.value) console.log("\"y\" stacked set to \"true\"")
  if (vars.dev.value) d3plus.console.timeEnd("setting local variables")

}

d3plus.apps.stacked.draw = function(vars) {

  d3plus.data.threshold(vars,vars.x.value)

  return d3plus.apps.chart.draw(vars)

}
