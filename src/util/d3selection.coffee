# Cross-browser detect for D3 element
module.exports = (selection) ->
  (if d3plus.ie then typeof selection is "object" and selection instanceof Array else selection instanceof d3.selection)
