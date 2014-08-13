###*
 * Creates an invisible test element to populate
 ###
module.exports = (type) ->

  type = "div" if [ "div", "svg" ].indexOf(type) < 0
  styles =
    position: "absolute"
    left: "-9999px"
    top: "-9999px"
    visibility: "hidden"
    display: "block"

  tester = d3.select("body").selectAll(type + ".d3plus_tester").data([ "d3plus_tester" ])
  tester.enter().append(type).attr("class", "d3plus_tester").style styles

  tester
