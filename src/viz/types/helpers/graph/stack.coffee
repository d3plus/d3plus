fetchValue = require "../../../../core/fetch/value.coffee"

module.exports = (vars, data) ->

  stacked  = vars.axes.stacked or vars.axes.opposite
  flip     = vars[stacked].scale.viz 0
  scale    = vars[stacked].scale.value
  opposite = if stacked is "x" then "y" else "x"
  margin   = if stacked is "y" then vars.axes.margin.viz.top else vars.axes.margin.viz.left
  offset   = if scale is "share" then "expand" else "zero"

  stack = d3.layout.stack()
    .values (d) -> d.values || [d]
    .offset offset
    .x (d) -> d.d3plus[opposite]
    .y (d) -> flip - vars[stacked].scale.viz fetchValue vars, d, vars[stacked].value
    .out (d, y0, y) ->

      value    = fetchValue vars, d, vars[stacked].value
      negative = value < 0

      if scale is "share"
        d.d3plus[stacked+"0"] = (1 - y0) * flip
        d.d3plus[stacked]     = d.d3plus[stacked+"0"] - (y * flip)
      else
        d.d3plus[stacked+"0"] = flip
        d.d3plus[stacked+"0"] -= y0 if vars.axes.stacked
        d.d3plus[stacked] = d.d3plus[stacked+"0"] - y

      d.d3plus[stacked]     += margin
      d.d3plus[stacked+"0"] += margin

  positiveData = []
  negativeData = []
  for d in data
    val = fetchValue(vars, d, vars[stacked].value)
    if val instanceof Array
      neg = true
      for v in val
        if v >= 0
          neg = false
          break
      if neg then negativeData.push d else positiveData.push d
    else
      positiveData.push d if val >= 0
      negativeData.push d if val < 0

  if positiveData.length is 0 or negativeData.length is 0
    stack data
  else
    positiveData = stack positiveData if positiveData.length
    negativeData = stack negativeData if negativeData.length
    positiveData.concat(negativeData)
