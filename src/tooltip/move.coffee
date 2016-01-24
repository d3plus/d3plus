scroll = require "../client/scroll.js"

# Set X and Y position for Tooltip
module.exports = (x, y, id) ->

  id      = "default" unless id
  tooltip = d3.select("div#d3plus_tooltip_id_" + id)

  if tooltip.node()

    d    = tooltip.datum()
    d.cx = x
    d.cy = y

    unless d.fixed

      if d.parent.node().tagName.toLowerCase() is "body"
        mins = [scroll.x(), scroll.y()]
      else
        mins = [0, 0]

      # Set initial values, based off of anchor
      unless d.anchor.y is "center"

        if d.anchor.x is "right"
          d.x = d.cx - d.arrow_offset - 4
        else if d.anchor.x is "center"
          d.x = d.cx - d.width / 2
        else
          d.x = d.cx - d.width + d.arrow_offset + 2 if d.anchor.x is "left"

        # Determine whether or not to flip the tooltip
        if d.anchor.y is "bottom"
          d.flip = d.cy + d.height + d.offset <= d.limit[1]
        else
          d.flip = d.cy - d.height - d.offset < mins[1] if d.anchor.y is "top"

        if d.flip
          d.y = d.cy + d.offset + d.arrow_offset
        else
          d.y = d.cy - d.height - d.offset - d.arrow_offset

      else

        d.y = d.cy - d.height / 2

        # Determine whether or not to flip the tooltip
        if d.anchor.x is "right"
          d.flip = d.cx + d.width + d.offset <= d.limit[0]
        else
          d.flip = d.cx - d.width - d.offset < mins[0] if d.anchor.x is "left"

        if d.anchor.x is "center"
          d.flip = false
          d.x = d.cx - d.width / 2
        else if d.flip
          d.x = d.cx + d.offset + d.arrow_offset
        else
          d.x = d.cx - d.width - d.offset

      # Limit X to the bounds of the screen
      if d.x < mins[0]
        d.x = mins[0]
      else
        d.x = d.limit[0] - d.width if d.x + d.width > d.limit[0]

      # Limit Y to the bounds of the screen
      if d.y < mins[1]
        d.y = mins[1]
      else
        d.y = d.limit[1] - d.height if d.y + d.height > d.limit[1]

    tooltip
      .style "top", d.y + "px"
      .style "left", d.x + "px"

    tooltip.selectAll(".d3plus_tooltip_arrow").call arrowStyle if d.arrow

  tooltip

# Correctly positions the tooltip's arrow
arrowStyle = (arrow) ->
  arrow
    .style "bottom", (d) ->
      if d.anchor.y isnt "center" and not d.flip then "-5px" else "auto"
    .style "right", (d) ->
      if d.anchor.y is "center" and not d.flip then "-5px" else "auto"
    .style "top", (d) ->
      if d.anchor.y isnt "center" and d.flip
        "-5px"
      else if d.anchor.y is "center"
        "50%"
      else
        "auto"
    .style "left", (d) ->
      if d.anchor.y is "center" and d.flip
        "-5px"
      else unless d.anchor.y is "center"
        "50%"
      else
        "auto"
    .style "margin-left", (d) ->
      if d.anchor.y is "center"
        "auto"
      else
        if d.anchor.x is "right"
          arrow_x = -d.width / 2 + d.arrow_offset / 2
        else if d.anchor.x is "left"
          arrow_x = d.width / 2 - d.arrow_offset * 2 - 5
        else
          arrow_x = -5
        if d.cx - d.width / 2 - 5 < arrow_x
          arrow_x = d.cx - d.width / 2 - 5
          arrow_x = 2 - d.width / 2  if arrow_x < 2 - d.width / 2
        else if -(d.limit[0] - d.cx - d.width / 2 + 5) > arrow_x
          arrow_x = -(d.limit[0] - d.cx - d.width / 2 + 5)
          arrow_x = d.width / 2 - 11  if arrow_x > d.width / 2 - 11
        arrow_x + "px"
    .style "margin-top", (d) ->
      unless d.anchor.y is "center"
        "auto"
      else
        if d.anchor.y is "bottom"
          arrow_y = -d.height / 2 + d.arrow_offset / 2 - 1
        else if d.anchor.y is "top"
          arrow_y = d.height / 2 - d.arrow_offset * 2 - 2
        else
          arrow_y = -9
        if d.cy - d.height / 2 - d.arrow_offset < arrow_y
          arrow_y = d.cy - d.height / 2 - d.arrow_offset
          arrow_y = 4 - d.height / 2  if arrow_y < 4 - d.height / 2
        else if -(d.limit[1] - d.cy - d.height / 2 + d.arrow_offset) > arrow_y
          arrow_y = -(d.limit[1] - d.cy - d.height / 2 + d.arrow_offset)
          arrow_y = d.height / 2 - 22  if arrow_y > d.height / 2 - 22
        arrow_y + "px"
