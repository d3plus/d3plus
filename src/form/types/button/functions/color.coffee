# Defines button color
module.exports = (elem, vars) ->

  legible   = require "../../../../color/legible.coffee"
  lighter   = require "../../../../color/lighter.coffee"
  textColor = require "../../../../color/text.coffee"

  elem.style "background-color", (d) ->

    if vars.focus.value isnt d[vars.id.value]
      if vars.hover.value is d[vars.id.value]
        lighter vars.ui.color.secondary.value, .25
      else
        vars.ui.color.secondary.value
    else
      if vars.hover.value is d[vars.id.value]
        d3.rgb(vars.ui.color.primary.value).darker(0.15).toString()
      else
        vars.ui.color.primary.value

  .style "color", (d) ->

    if vars.focus.value is d[vars.id.value]
      opacity = 1
    else
      opacity = 0.75

    image = d[vars.icon.value] and vars.data.viz.length < vars.data.large

    if vars.focus.value is d[vars.id.value] and d[vars.color.value] and !image
      color = legible d[vars.color.value]
    else if vars.focus.value is d[vars.id.value]
      color = textColor vars.ui.color.primary.value
    else
      color = textColor vars.ui.color.secondary.value

    color = d3.rgb color
    "rgba(" + color.r + "," + color.g + "," + color.b + "," + opacity + ")"

  .style 'border-color', vars.ui.color.secondary.value
