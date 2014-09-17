module.exports = (rendering) ->

  accepted  = ["auto", "optimizeSpeed", "crispEdges", "geometricPrecision"]
  rendering = "crispEdges" unless accepted.indexOf(rendering) >= 0

  accepted: accepted
  value:    rendering
