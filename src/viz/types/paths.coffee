shortestPath = require "../../network/shortestPath.coffee"
fetchValue   = require "../../core/fetch/value.coffee"
uniqueValues = require "../../util/uniques.coffee"

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

      edge[vars.edges.source] = vars.data.viz.filter((d) ->
        edge[vars.edges.source][vars.id.value] is d[vars.id.value] )[0]

      edge[vars.edges.target] = vars.data.viz.filter((d) ->
        edge[vars.edges.target][vars.id.value] is d[vars.id.value] )[0]

      nextDir = if edge[vars.edges.source][vars.id.value] is lastHop then "target" else "source"

      nextHop = edge[vars.edges[nextDir]][vars.id.value]

      if pathLookup[nextHop] is undefined
        pathLookup[nextHop] = pathInt

      paths[pathInt].push nextHop

      lastHop = nextHop

  rows = 0
  for pathInt, path of paths
    if pathInt isnt "all"
      newPath = 0
      for id, i in path
        if i not in [0, path.length-1] and pathLookup[id] is parseFloat(pathInt)
          newPath = 1
          prev = path[i-1]
          next = path[i+1]
          prevIndex = null
          nextIndex = null
          for col, colIndex in paths.all
            if prev in col
              prevIndex = colIndex
            if next in col
              nextIndex = colIndex
          if prevIndex isnt null and nextIndex is null
            if prevIndex + 1 is paths.all.length - 1
              paths.all.splice prevIndex + 1, 0, [id]
            else
              paths.all[prevIndex + 1].push id
          else if nextIndex - prevIndex is 1
            paths.all.splice nextIndex, 0, [id]
          else if nextIndex - prevIndex > 1
            paths.all[nextIndex - 1].push id
      rows += newPath

  rowHeight = Math.floor vars.height.viz / rows

  yDomain = []
  i = 0
  while i < rows
    if i % 2 is 0
      yDomain.push i
    else
      yDomain.unshift i
    i++

  labelSpace = if vars.size.value and !vars.small then 30 else 0

  y = d3.scale.ordinal()
    .domain yDomain
    .range d3.range rowHeight/2 - labelSpace, vars.height.viz + rowHeight/2 - labelSpace, (vars.height.viz - rowHeight)/(rows-1)

  columns = paths["all"].length

  columnWidth = Math.floor vars.width.viz / columns

  x = d3.scale.linear()
    .domain [0, columns - 1]
    .rangeRound [columnWidth/2, vars.width.viz - columnWidth/2]

  minRadius = 5
  maxRadius = d3.min([columnWidth,rowHeight - labelSpace]) * 0.4

  sizeDomain = d3.extent vars.data.viz, (node) ->
    val = fetchValue vars, node, vars.size.value
    return val or 0

  size = vars.size.scale.value
    .domain sizeDomain
    .rangeRound [minRadius, maxRadius]

  for node in vars.data.viz

    node.d3plus ?= {}

    for col, colIndex in paths["all"]
      if node[vars.id.value] in col
        node.d3plus.x = x(colIndex)

    node.d3plus.y = y(pathLookup[node[vars.id.value]])

    if vars.size.value
      val = fetchValue vars, node, vars.size.value
      node.d3plus.r = if val then size(val) else minRadius
    else
      node.d3plus.r = maxRadius

    if node.d3plus.r < columnWidth * 0.1 and !vars.small
      node.d3plus.label =
        x: 0
        y: node.d3plus.r + vars.labels.padding*2
        w: columnWidth * 0.6
        h: labelSpace + maxRadius - node.d3plus.r
        resize: false
    else
      delete node.d3plus.label

  for path, pathInt in viz.paths

    lastHop = vars.focus.value[0]

    for edge, edgeInt in path.edges

      nextDir = if edge[vars.edges.source][vars.id.value] is lastHop then "target" else "source"
      lastDir = if nextDir is "target" then "source" else "target"

      nextHop = edge[vars.edges[nextDir]][vars.id.value]

      if pathLookup[lastHop] isnt pathLookup[nextHop]

        edge.d3plus =
          spline: true

        edge[vars.edges.source].d3plus ?= {}
        edge[vars.edges.source].d3plus.edges ?= {}
        edge[vars.edges.target].d3plus ?= {}
        edge[vars.edges.target].d3plus.edges ?= {}

        xDiff = edge[nextDir].d3plus.x - edge[lastDir].d3plus.x

        edge[lastDir].d3plus.edges[edge[nextDir][vars.id.value]] =
          angle: Math.PI
          radius: columnWidth/2
        edge[nextDir].d3plus.edges[edge[lastDir][vars.id.value]] =
          angle: 0
          radius: columnWidth/2
          offset: xDiff - columnWidth

      else
        delete edge.d3plus

      lastHop = nextHop

  # return
  nodes: vars.data.viz
  edges: edges

viz.filter = (vars, data) ->

  edges = vars.edges.filtered or vars.edges.value

  viz.paths = shortestPath edges, vars.focus.value[0],
    target:     vars.focus.value[1]
    distance:   vars.edges.size.value or undefined
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

  ids = uniqueValues viz.nodes, vars.id.value, fetchValue, vars
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
