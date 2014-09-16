# If placing into a new container, remove it's contents
# and check text direction.
#
# Also initialized app width and height.
module.exports = (vars) ->

  vars.container.value
    .style "position", () ->
      current = d3.select(this).style("position")
      remain  = ["absolute","fixed"].indexOf(current) >= 0
      if remain then current else "relative"
    .html ""

  # Get overall width and height, if not defined
  for s in ["width","height"]

    unless vars[s].value

      checkParent = (element) ->

        if element.tagName is undefined or ["BODY","HTML"].indexOf(element.tagName) >= 0

          val  = window["inner"+s.charAt(0).toUpperCase()+s.slice(1)]
          elem = if document isnt element then d3.select(element) else false

          if elem
            if s is "width"
              val -= parseFloat elem.style("margin-left"), 10
              val -= parseFloat elem.style("margin-right"), 10
              val -= parseFloat elem.style("padding-left"), 10
              val -= parseFloat elem.style("padding-right"), 10
            else
              val -= parseFloat elem.style("margin-top"), 10
              val -= parseFloat elem.style("margin-bottom"), 10
              val -= parseFloat elem.style("padding-top"), 10
              val -= parseFloat elem.style("padding-bottom"), 10

          vars[s].value = if val <= 20 then vars[s].small else val

        else

          val = parseFloat d3.select(element).style(s), 10
          if typeof val is "number" and val > 0
            vars[s].value = val
          else if element.tagName isnt "BODY"
            checkParent element.parentNode

      checkParent vars.container.value.node()

      d3.select("body").style("overflow","hidden") if d3.selectAll("body > *:not(script)").size() is 1

  vars.container.value
    .style "width", vars.width.value+"px"
    .style "height", vars.height.value+"px"

  return
