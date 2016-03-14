
d3sankey      = require "./sankey.js"
events        = require "../../client/pointer.coffee"
removeTooltip = require "../../tooltip/remove.coffee"
uniques       = require "../../util/uniques.coffee"

sankey = (vars) ->

  focus = vars.focus.value[0]
  padding = vars.data.stroke.width * 2
  size = if vars.size.value.constructor is Number then vars.size.value else 20

  edges = vars.edges.connections(focus, vars.id.value).filter (e) ->
    return e[vars.edges.source][vars.id.value] isnt focus or
           e[vars.edges.target][vars.id.value] isnt focus

  nodes = []
  placed = []
  edges = edges.map (e) ->
    if e[vars.edges.target][vars.id.value] is focus
      s =
        id: "left_" + e[vars.edges.source][vars.id.value]
        dupe: "left"
        data: e[vars.edges.source]
      t = e[vars.edges.target]
    else
      s = e[vars.edges.source]
      t =
        id: "right_" + e[vars.edges.target][vars.id.value]
        dupe: "right"
        data: e[vars.edges.target]
    nodes.push s if placed.indexOf(s.id) < 0
    nodes.push t if placed.indexOf(t.id) < 0
    placed.push s.id
    placed.push t.id
    # return
    source: s
    target: t
    value: e[vars.edges.strength.value] || 1

  layout = d3sankey()
    .nodeWidth size
    .nodePadding vars.data.padding.value
    .size [vars.width.viz - padding * 2, vars.height.viz - padding * 2]
    .nodes nodes
    .links edges
    .layout 2

  returnData = []
  for n in nodes
    d = n.data or n
    d =
      id: d[vars.id.value]
    d.d3plus =
      x: n.x + n.dx/2 + padding
      y: n.y + n.dy/2 + padding
      width: n.dx
      height: n.dy
      suffix: n.dupe
    returnData.push d

  vars.edges.path = layout.link()

  for e in edges
    e.d3plus =
      x: padding
      y: padding

  vars.mouse.viz = {}
  vars.mouse.viz[events.click] = (d) ->
    if d[vars.id.value] isnt vars.focus.value[0]
      removeTooltip vars.type.value
      old_focus = vars.focus.value[0]
      vars.history.states.push -> vars.self.focus(old_focus).draw()
      vars.self.focus(d[vars.id.value]).draw()

  # return
  nodes: returnData
  edges: edges

# Visualization Settings and Helper Functions
sankey.requirements = ["edges", "focus", "nodes"]
sankey.shapes       = ["square"]

module.exports = sankey
