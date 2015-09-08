fetchValue = require "../../../core/fetch/value.coffee"
fetchColor = require "../../../core/fetch/color.coffee"
lighter    = require "../../../color/lighter.coffee"
segments   = require "./segments.coffee"

# Returns the correct fill color for a node
module.exports = (d, vars, stroke) ->

  shape = d.d3plus.shape or vars.shape.value

  if vars.shape.value is "line" and shape isnt "circle"
    return "none"
  else if vars.shape.value is "area" or
          shape is "active" or
          vars.shape.value is "line"
    return fetchColor(vars, d)
  else if shape is "temp"
    if stroke
      return fetchColor(vars, d)
    else
      return "url(#d3plus_hatch_" + d.d3plus.id + ")"
  else if d.d3plus.static
    return lighter fetchColor(vars, d), .75

  active = segments vars, d, "active"
  temp   = segments vars, d, "temp"
  total  = segments vars, d, "total"

  if (not vars.active.value and not vars.temp.value) or active is true or
     (active and total and active >= total and not temp) or
     (active and not total)
    fetchColor vars, d
  else if vars.active.spotlight.value
    vars.color.missing
  else
    lighter fetchColor(vars, d), .75
