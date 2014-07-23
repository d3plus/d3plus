shortestPath = require "../../network/shortestPath.coffee"
fetchValue   = require "../../core/fetch/value.js"

# Paths Visualization
viz = (vars) ->

  edges = []
  pathLookup = {}
  pathLookup[vars.focus.value[0]] = 0
  pathLookup[vars.focus.value[1]] = 0
  paths = {all: [[vars.focus.value[0]],[vars.focus.value[1]]]}
  for path, pathInt in viz.paths

    edges = edges.concat path.edges
    lastHop = vars.focus.value[0]
    paths[pathInt] = [lastHop]

    for edge, edgeInt in path.edges

      edge[vars.edges.source] = vars.data.app.filter((d) ->
        edge[vars.edges.source][vars.id.value] is d[vars.id.value] )[0]

      edge[vars.edges.target] = vars.data.app.filter((d) ->
        edge[vars.edges.target][vars.id.value] is d[vars.id.value] )[0]

      direction = if edge[vars.edges.source][vars.id.value] is lastHop then "target" else "source"

      nextHop = edge[vars.edges[direction]][vars.id.value]

      if pathLookup[nextHop] is undefined
        pathLookup[nextHop] = pathInt

      paths[pathInt].push nextHop

      lastHop = nextHop

  for pathInt, path of paths
    if pathInt isnt "all"
      for id, i in path
        if i not in [0, path.length-1] and pathLookup[id] is parseFloat(pathInt)
          prev = path[i-1]
          next = path[i+1]
          prevIndex = null
          nextIndex = null
          for col, colIndex in paths["all"]
            if prev in col
              prevIndex = colIndex
            if next in col
              nextIndex = colIndex
          if nextIndex - prevIndex is 1
            paths["all"].splice nextIndex, 0, [id]
          else if nextIndex - prevIndex > 1
            paths["all"][nextIndex - 1].push id
          else
            console.log pathInt, paths[pathInt]
            console.log prev, prevIndex, id, next, nextIndex

  console.log paths["all"]

  columns = paths["all"].length

  columnWidth = Math.floor vars.width.viz / columns

  rows = viz.paths.length

  rowHeight = Math.floor vars.height.viz / rows

  overlap = if vars.size.value then vars.nodes.overlap else 0.45

  maxRadius = d3.min([columnWidth,rowHeight]) * overlap

  sizeDomain = d3.extent vars.data.app, (node) ->
    fetchValue vars, node, vars.size.value

  size = vars.size.scale.value
    .domain sizeDomain
    .rangeRound [2, maxRadius]

  x = d3.scale.linear()
    .domain [0, columns - 1]
    .rangeRound [columnWidth/2, vars.width.viz - columnWidth/2]

  yDomain = []
  i = 0
  while i < rows
    if i % 2 is 0
      yDomain.push i
    else
      yDomain.unshift i
    i++

  y = d3.scale.ordinal()
    .domain yDomain
    .range d3.range rowHeight/2, vars.height.viz + rowHeight/2, (vars.height.viz - rowHeight)/(rows-1)

  for node in vars.data.app

    node.d3plus ?= {}

    for col, colIndex in paths["all"]
      if node[vars.id.value] in col
        node.d3plus.x = x(colIndex)

    node.d3plus.y = y(pathLookup[node[vars.id.value]])

    if vars.size.value
      node.d3plus.r = size(fetchValue vars, node, vars.size.value)
    else
      node.d3plus.r = maxRadius

  console.log "\n"
  console.log "Returning:"
  console.log vars.data.app, edges
  console.log "\n"
  # return
  nodes: vars.data.app
  edges: edges

viz.filter = (vars, data) ->

  edges = vars.edges.filtered or vars.edges.value

  viz.paths = shortestPath edges, vars.focus.value[0],
    target:     vars.focus.value[1]
    distance:   vars.edges.size or undefined
    nodeid:     vars.id.value
    startpoint: vars.edges.source
    endpoint:   vars.edges.target
    K:          vars.edges.limit.value or 5

  viz.nodes = []
  added = []
  for path in viz.paths
    for edge in path.edges
      source = edge[vars.edges.source]
      target = edge[vars.edges.target]
      if added.indexOf(source[vars.id.value]) < 0
        viz.nodes.push source
        added.push source[vars.id.value]
      if added.indexOf(target[vars.id.value]) < 0
        viz.nodes.push target
        added.push target[vars.id.value]

  ids = d3plus.util.uniques(viz.nodes, vars.id.value)
  returnData = []
  for id in ids
    d = data.filter (d) ->
      d[vars.id.value] is id
    unless d[0]
      obj = d3plus: {}
      obj[vars.id.value] = id
      returnData.push obj
    else
      returnData.push d[0]

  returnData

viz.modes        = ["right", "left", "center"]
viz.nesting      = false
viz.requirements = [
  (vars) ->
    status: vars.focus.value.length == 2
    text: vars.format.locale.value.method.focus + " x 2"
  "edges"
]
viz.scale   = 1
viz.shapes  = ["circle", "square", "donut"]
viz.tooltip = "static"

module.exports = viz
