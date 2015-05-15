arraySort  = require("../../array/sort.coffee")
fetchValue = require("../../core/fetch/value.coffee")
fetchColor = require("../../core/fetch/color.coffee")
fetchText  = require("../../core/fetch/text.js")
legible    = require("../../color/legible.coffee")
groupData  = require("../../core/data/group.coffee")

bubbles = (vars) ->

  groupedData = groupData vars, vars.data.viz
  groupedData = arraySort groupedData, null, null, null, vars

  # Calculate rows and columns
  dataLength = groupedData.length
  if dataLength < 4
    columns = dataLength
    rows    = 1
  else
    screenRatio = vars.width.viz / vars.height.viz
    columns     = Math.ceil(Math.sqrt(dataLength * screenRatio))
    rows        = Math.ceil(Math.sqrt(dataLength / screenRatio))

  rows-- while (rows - 1) * columns >= dataLength if dataLength > 0

  column_width  = vars.width.viz / columns
  column_height = vars.height.viz / rows

  # Define size scale
  if vars.size.value
    domainMin = d3.min vars.data.viz, (d) ->
      fetchValue vars, d, vars.size.value, vars.id.value, "min"
    domainMax = d3.max vars.data.viz, (d) ->
      fetchValue vars, d, vars.size.value, vars.id.value
    domain = [domainMin, domainMax]
  else
    domain = [0, 0]

  padding  = 5
  size_max = (d3.min([column_width, column_height]) / 2) - (padding * 2)
  labelHeight = if vars.labels.value and not vars.small and size_max >= 40 then d3.max([20, d3.min [size_max * 0.25, 50]]) else 0
  size_max -= labelHeight
  size_min = d3.min [size_max, vars.size.scale.min.value]

  size = vars.size.scale.value
    .domain domain
    .rangeRound [size_min, size_max]

  # Calculate bubble packing
  pack = d3.layout.pack()
    .children (d) -> d.values
    .padding padding
    .radius (d) -> size d
    .size [column_width - padding * 2, column_height - padding * 2 - labelHeight]
    .value (d) -> d.value

  data = []
  row  = 0
  for d, i in groupedData

    temp = pack.nodes(d)
    xoffset = (column_width * i) % vars.width.viz
    yoffset = column_height * row

    for t in temp
      if t.children
        obj = d3plus: {}
        obj[vars.id.value] = t.key
      else
        obj = t.d3plus
      obj.d3plus.depth   = if vars.id.grouping.value then t.depth else vars.depth.value
      obj.d3plus.x       = t.x
      obj.d3plus.xOffset = xoffset
      obj.d3plus.y       = t.y
      obj.d3plus.yOffset = yoffset + labelHeight
      obj.d3plus.r       = t.r

      data.push obj

    row++ if (i + 1) % columns is 0

  downscale = size_max / d3.max data, (d) -> d.d3plus.r
  xPadding  = pack.size()[0] / 2
  yPadding  = pack.size()[1] / 2
  for d in data

    d.d3plus.x = ((d.d3plus.x - xPadding) * downscale) + xPadding + d.d3plus.xOffset
    d.d3plus.y = ((d.d3plus.y - yPadding) * downscale) + yPadding + d.d3plus.yOffset
    d.d3plus.r = d.d3plus.r * downscale

    delete d.d3plus.xOffset
    delete d.d3plus.yOffset

    d.d3plus.static = d.d3plus.depth < vars.depth.value and vars.id.grouping.value

    if labelHeight and (d.d3plus.depth is 0 or vars.id.grouping.value is false)
      d.d3plus.text = fetchText vars, d[vars.id.value], d.d3plus.depth
      yMod = if labelHeight > vars.labels.padding * 3 then vars.labels.padding else 0
      d.d3plus.label =
        x:       0
        y:       -(size_max + yMod + labelHeight / 2)
        w:       size_max * 2
        h:       labelHeight - yMod
        padding: 0
        resize:  true
        color:   legible(fetchColor(vars, d, d.d3plus.depth))
        force:   true
    else
      delete d.d3plus.label

  data.sort (a, b) -> a.d3plus.depth - b.d3plus.depth

# Visualization Settings and Helper Functions
bubbles.fill         = true
bubbles.requirements = ["data"]
bubbles.scale        = 1.05
bubbles.shapes       = ["circle", "donut"]

module.exports = bubbles
