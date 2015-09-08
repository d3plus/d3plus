# Creates a Button
module.exports = (vars) ->

  print       = require "../../../core/console/print.coffee"
  color       = require "./functions/color.coffee"
  icons       = require "./functions/icons.js"
  mouseevents = require "./functions/mouseevents.coffee"
  style       = require "./functions/style.js"

  # Bind Data to Buttons
  button = vars.container.ui.selectAll('div.d3plus_node')
    .data vars.data.viz, (d) -> d[vars.id.value]

  # Enter Buttons
  print.time "enter" if vars.dev.value
  button.enter().append("div")
    .attr "class", "d3plus_node"
    .call color, vars
    .call style, vars
    .call icons, vars
    .call mouseevents, vars
  print.timeEnd "enter" if vars.dev.value

  # Update Buttons
  if vars.draw.update or vars.draw.timing
    print.time "ordering" if vars.dev.value
    button.order()
    print.timeEnd "ordering" if vars.dev.value
    updatedButtons = button
  else
    checks = [
      vars.focus.previous, vars.focus.value,
      vars.hover.previous, vars.hover.value
    ].filter (c) -> c
    updatedButtons = button.filter (b) ->
      checks.indexOf(b[vars.id.value]) >= 0

  print.time "update" if vars.dev.value
  updatedButtons.classed "d3plus_button_active", (d) ->
    vars.focus.value is d[vars.id.value]

  if vars.draw.timing
    updatedButtons.transition().duration(vars.draw.timing)
      .call(color, vars).call style, vars
  else
    updatedButtons.call(color, vars).call style, vars
  updatedButtons.call(icons, vars).call mouseevents, vars
  print.timeEnd "update" if vars.dev.value

  # Exit Buttons
  button.exit().remove()
