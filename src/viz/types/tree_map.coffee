dataThreshold = require("../../core/data/threshold.js")
groupData     = require("../../core/data/group.coffee")
mergeObject   = require("../../object/merge.coffee")

tree_map = (vars) ->

  groupedData = groupData(vars, vars.data.viz)

  # Pass data through the D3js .treemap() layout.
  data = d3.layout.treemap()
    .mode vars.type.mode.value
    .round true
    .size [vars.width.viz, vars.height.viz]
    .children (d) -> d.values
    .padding vars.data.padding.value
    .sort (a, b) ->
      sizeDiff = a.value - b.value
      if sizeDiff is 0 then a.id < b.id else sizeDiff
    .nodes
      name:   "root"
      values: groupedData
    .filter (d) -> not d.values and d.area

  # If the "data" array has entries...
  if data.length

    # Create the "root" node to use when calculating share percentage.
    root = data[0]
    root = root.parent  while root.parent

    # Calculate the position, size, and share percentage of each square.
    returnData = []
    for d in data

      d.d3plus.d3plus = mergeObject d.d3plus.d3plus,
        x:      d.x + d.dx / 2
        y:      d.y + d.dy / 2
        width:  d.dx
        height: d.dy
        share:  d.value / root.value

      returnData.push d.d3plus

  # Return the data array.
  returnData

# Visualization Settings and Helper Functions
tree_map.filter       = dataThreshold
tree_map.modes        = ["squarify", "slice", "dice", "slice-dice"]
tree_map.requirements = ["data", "size"]
tree_map.shapes       = ["square"]
tree_map.threshold    = (vars) -> (40 * 40) / (vars.width.viz * vars.height.viz)

module.exports = tree_map
