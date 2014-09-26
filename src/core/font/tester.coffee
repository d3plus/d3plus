# Creates an invisible test element to populate
module.exports = (type) ->

  type   = "div" if [ "div", "svg" ].indexOf(type) < 0
  styles =
    position:   "absolute"
    left:       "-9999px"
    top:        "-9999px"
    visibility: "hidden"
    display:    "block"

  attrs = if type is "div" then {} else
    position: "absolute"

  tester = d3.select("body").selectAll(type + ".d3plus_tester").data([0])
  tester.enter().append(type).attr("class", "d3plus_tester")
    .style(styles).attr(attrs)

  tester
