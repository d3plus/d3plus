module.exports = (data, vars) ->

  max_depth     = vars.id.nesting.length - 1
  current_depth = vars.depth.value
  restricted    = vars.types[vars.type.value].nesting is false

  if restricted
    0
  else if data.d3plus.merged or current_depth < max_depth and (not data or vars.id.nesting[vars.depth.value + 1] of data)
    1
  else if (current_depth is max_depth or (data and (vars.id.nesting[vars.depth.value + 1] not of data))) and (vars.small or not vars.tooltip.html.value)
    -1
  else
    0
