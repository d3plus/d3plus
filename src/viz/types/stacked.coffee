fetchValue = require "../../core/fetch/value.js"
graph      = require "./helpers/graph/draw.coffee"
nest       = require "./helpers/graph/nest.coffee"
sort       = require "../../array/sort.coffee"
stack      = require "./helpers/graph/stack.coffee"
threshold  = require "../../core/data/threshold.js"

# Stacked Area Chart
stacked = (vars) ->

  graph vars

  # Add padding to the top of the Y axis
  domain = vars.y.scale.viz.domain()
  vars.y.scale.viz.domain [domain[0]*1.025,domain[1]]

  data = nest vars

  # Assign x and y to each data point
  for point in data
    point.d3plus = {} unless point.d3plus
    for d in point.values

      d.d3plus.x  = vars.x.scale.viz fetchValue vars, d, vars.x.value
      d.d3plus.x += vars.axes.margin.left

      d.d3plus.y  = vars.y.scale.viz fetchValue vars, d, vars.y.value
      d.d3plus.y += vars.axes.margin.top

      if d.d3plus.merged instanceof Array
        point.d3plus.merged = [] unless point.d3plus.merged
        point.d3plus.merged = point.d3plus.merged.concat(d.d3plus.merged)
      point.d3plus.text = d.d3plus.text if d.d3plus.text and !point.d3plus.text

  data      = stack vars, data
  order     = vars.order.value or vars.size.value or vars.id.value
  sortOrder = if vars.order.sort.value is "desc" then "asc" else "desc"

  # Return the data, sorted
  sort data, order, sortOrder, vars.color.value or [], vars

# Visualization Settings and Helper Functions
stacked.filter = (vars, data) ->
  threshold vars, data, vars.x.value
stacked.requirements = ["data", "x", "y"]
stacked.setup = (vars) ->

  vars.self.x
    scale: "continuous"
    zerofill: true
  vars.self.y
    stacked: true

  y = vars.y
  size = vars.size

  if (not y.value and size.value) or (size.changed and size.previous is y.value)
    vars.self.y size.value
  else if (not size.value and y.value) or (y.changed and y.previous is size.value)
    vars.self.size y.value
  return

stacked.shapes = ["area"]
stacked.threshold = (vars) -> 20 / vars.height.viz
stacked.tooltip = "static"
module.exports  = stacked
