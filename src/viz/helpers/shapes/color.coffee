fetchValue = require "../../../core/fetch/value.js"
fetchColor = require "../../../core/fetch/color.coffee"
lighter    = require "../../../color/lighter.coffee"

# Returns the correct fill color for a node
module.exports = (d, vars) ->

  shape = if d.d3plus then d.d3plus.shapeType else vars.shape.value

  if vars.shape.value is "line" and shape isnt "circle"
    return "none"
  else if vars.shape.value is "area" or shape is "active" or vars.shape.value is "line"
    return fetchColor(vars, d)
  else if shape is "temp"
    return "url(#d3plus_hatch_" + d.d3plus.id + ")"
  else if d.d3plus.static
    return lighter fetchColor(vars, d), .75

  active = if vars.active.value then fetchValue(vars, d, vars.active.value) else d.d3plus.active
  temp   = if vars.temp.value then fetchValue(vars, d, vars.temp.value) else d.d3plus.temp
  total  = if vars.total.value then fetchValue(vars, d, vars.total.value) else d.d3plus.total

  if (not vars.active.value and not vars.temp.value) or active is true or (active and total and active is total and not temp) or (active and not total)
    fetchColor vars, d
  else if vars.active.spotlight.value
    "#eee"
  else
    lighter fetchColor(vars, d), .75
