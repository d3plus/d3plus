# Defines button color
module.exports = (elem, vars) ->

  legible   = require "../../../../color/legible.coffee"
  lighter   = require "../../../../color/lighter.coffee"
  textColor = require "../../../../color/text.coffee"

  elem.style "background-color", (d) ->

    if vars.focus.value is d[vars.id.value]
      color = vars.ui.color.secondary.value
    else
      color = vars.ui.color.primary.value

    if vars.hover.value is d[vars.id.value]
      color = d3.rgb(color).darker(0.15).toString()

    color

  .style "color", (d) ->

    if vars.focus.value is d[vars.id.value]
      opacity = 0.75
    else
      opacity = 1

    image = d[vars.icon.value] and vars.data.viz.length < vars.data.large

    if !image and d[vars.color.value]
      color = legible d[vars.color.value]
    else

      if vars.focus.value is d[vars.id.value]
        bg = vars.ui.color.secondary.value
      else
        bg = vars.ui.color.primary.value

      if vars.hover.value is d[vars.id.value]
        bg = d3.rgb(bg).darker(0.15).toString()

      color = textColor bg

    color = d3.rgb color
    "rgba(" + color.r + "," + color.g + "," + color.b + "," + opacity + ")"

  .style 'border-color', vars.ui.color.secondary.value
