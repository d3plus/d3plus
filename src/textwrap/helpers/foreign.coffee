# Flows the text as a foreign element.
module.exports = (vars) ->

  text    = vars.container.value
  family  = text.attr("font-family") or
            text.style("font-family")
  anchor  = vars.align.value or
            text.attr("text-anchor") or
            text.style("text-anchor")
  color   = text.attr("fill") or text.style("fill")
  opacity = text.attr("opacity") or text.style("opacity")
  anchor  = if anchor is "end" then "right" else
            (if anchor is "middle" then "center" else "left")

  d3.select(text.node().parentNode).append "foreignObject"
    .attr "width" , vars.width.value + "px"
    .attr "height", vars.height.value + "px"
    .attr "x"     , "0px"
    .attr "y"     , "0px"
    .append "xhtml:div"
      .style "font-family", family
      .style "font-size"  , vars.size.value[1]+"px"
      .style "color"      , color
      .style "text-align" , anchor
      .style "opacity"    , opacity
      .text vars.text.current

  return
