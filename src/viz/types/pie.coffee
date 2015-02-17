comparator    = require "../../array/comparator.coffee"
dataThreshold = require("../../core/data/threshold.js")
fetchValue    = require("../../core/fetch/value.coffee")
groupData     = require("../../core/data/group.coffee")

order = {}

pie = (vars) ->

  pieLayout   = d3.layout.pie()
    .value (d) -> d.value
    .sort (a, b) ->
      if vars.order.value
        comparator a.d3plus, b.d3plus, [vars.order.value], vars.order.sort.value, [], vars
      else
        aID = fetchValue vars, a.d3plus, vars.id.value
        order[aID] = a.value if order[aID] is undefined
        bID = fetchValue vars, b.d3plus, vars.id.value
        order[bID] = b.value if order[bID] is undefined
        if order[bID] < order[aID] then -1 else 1

  groupedData = groupData vars, vars.data.viz, []
  pieData     = pieLayout groupedData
  returnData  = []

  radius = d3.min([vars.width.viz, vars.height.viz])/2 - vars.labels.padding * 2

  for d in pieData

    item                   = d.data.d3plus
    item.d3plus.startAngle = d.startAngle
    item.d3plus.endAngle   = d.endAngle
    item.d3plus.r          = radius
    item.d3plus.x          = vars.width.viz/2
    item.d3plus.y          = vars.height.viz/2

    returnData.push item

  returnData

# Visualization Settings and Helper Functions
pie.filter       = dataThreshold
pie.requirements = ["data", "size"]
pie.shapes       = ["arc"]
pie.threshold    = (vars) -> (40 * 40) / (vars.width.viz * vars.height.viz)

module.exports   = pie
