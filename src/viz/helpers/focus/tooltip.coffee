createTooltip = require "../tooltip/create.js"
fetchValue    = require "../../../core/fetch/value.coffee"
print         = require "../../../core/console/print.coffee"
removeTooltip = require "../../../tooltip/remove.coffee"

# Creates focus tooltip, if applicable
module.exports = (vars) ->

  focus = vars.focus

  if not vars.error.internal and focus.value.length is 1 and
     focus.value.length and not vars.small and focus.tooltip.value

    print.time "drawing focus tooltip" if vars.dev.value
    data = vars.data.pool.filter (d) ->
      fetchValue(vars, d, vars.id.value) is focus.value[0]

    if data.length >= 1
      data = data[0]
    else
      data = {}
      data[vars.id.value] = focus.value[0]

    offset = vars.labels.padding

    createTooltip
      anchor:      "top left"
      arrow:       false
      data:        data
      fullscreen:  false
      id:          "visualization_focus"
      length:      "long"
      maxheight:   vars.height.viz - offset * 2
      mouseevents: true
      offset:      0
      vars:        vars
      width:       vars.tooltip.large
      x:           vars.width.value - vars.margin.right - offset
      y:           vars.margin.top + offset

    vars.width.viz -= (vars.tooltip.large + offset * 2)

    print.timeEnd "drawing focus tooltip" if vars.dev.value

  else
    removeTooltip "visualization_focus"

  return
