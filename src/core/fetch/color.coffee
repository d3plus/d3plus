fetchValue  = require "./value.js"
randomColor = require "../../color/random.coffee"
validColor  = require "../../color/validate.coffee"
validObject = require "../../object/validate.coffee"

# Finds an object's color and returns random if it cannot be found
module.exports = (vars, id, level) ->

  if validObject(id) and id.d3plus and id.d3plus.color and !vars.color.changed
    return id.d3plus.color

  getRandom = (c) ->
    c = fetchValue(vars, c, level) if validObject(c)
    c = c[0] if c instanceof Array
    randomColor c, vars.color.scale.value

  level = vars.id.value unless level
  level = vars.id.nesting[level] if typeof level is "number"

  unless vars.color.value
    returnColor = getRandom id
  else

    colors   = []
    i        = vars.id.nesting.indexOf(level)
    getColor = (color) ->
      unless color
        if vars.color.value and typeof vars.color.valueScale is "function"
          return vars.color.valueScale(0)
        getRandom id
      else unless vars.color.valueScale
        if validColor(color) then color else getRandom(color)
      else
        vars.color.valueScale color

    while i >= 0
      colorLevel = vars.id.nesting[i]
      if validObject(id)
        o = unless (colorLevel of id) then fetchValue(vars, id, colorLevel) else id
        value = fetchValue(vars, o, vars.color.value, colorLevel)
      else
        value = id
      if value isnt undefined and value isnt null
        color = getColor(value)
        colors.push color  if colors.indexOf(color) < 0
      i--

    returnColor = if colors.length is 1 then colors[0] else vars.color.missing

  if validObject(id) and id.d3plus
    id.d3plus.color = returnColor
  returnColor
