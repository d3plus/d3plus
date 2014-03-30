d3plus.apps.scatter = {}
d3plus.apps.chart.fill = true;
d3plus.apps.chart.deprecates = ["pie_scatter"];
d3plus.apps.scatter.requirements = ["data","x","y"];
d3plus.apps.scatter.tooltip = "static";
d3plus.apps.scatter.shapes = ["circle","square","donut"];
d3plus.apps.scatter.scale = d3plus.apps.chart.scale;

d3plus.apps.scatter.draw = function(vars) {

  return d3plus.apps.chart.draw(vars)

}
