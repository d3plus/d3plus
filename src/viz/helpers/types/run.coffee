print = require "../../../core/console/print.coffee"

module.exports = (vars) ->

  # Set vars.group to the app's specific group element
  vars.group = vars.g.apps[vars.type.value]

  # Reset mouse events for the app to use
  vars.mouse.viz = false
  vars.edges.path = false

  visualization = vars.types[vars.type.value]
  requirements  = visualization.requirements or []
  dataRequired  = requirements.indexOf("data") >= 0
  drawable      = not dataRequired or (dataRequired and vars.data.viz.length)

  if not vars.error.internal and drawable
    app = vars.format.locale.value.visualization[vars.type.value]
    print.time "running " + app if vars.dev.value
    for d in vars.data.viz
      if d.d3plus
        delete d.d3plus.shape
        delete d.d3plus.label
        delete d.d3plus.rotate
        delete d.d3plus.share
    returned = visualization(vars)
    print.timeEnd "running " + app if vars.dev.value
  else
    returned = null

  vars.returned =
    nodes: []
    edges: null

  if returned instanceof Array
    vars.returned.nodes = returned
  else if returned
    vars.returned.nodes = returned.nodes if returned.nodes
    vars.returned.edges = returned.edges if returned.edges

  return
