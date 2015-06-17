module.exports = (data, vars) ->

  max_depth  = vars.id.nesting.length - 1
  depth      = vars.depth.value
  nextDepth  = vars.id.nesting[vars.depth.value + 1]

  if vars.types[vars.type.value].nesting is false
    0
  else if (data.d3plus.merged or (nextDepth of data and depth < max_depth)) and (not data or nextDepth of data)
    1
  else if (depth is max_depth or (data and (nextDepth not of data))) and (vars.small or not vars.tooltip.html.value)
    -1
  else
    0
