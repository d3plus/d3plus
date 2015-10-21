shapeStyle   = require "./style.coffee"
radii        = {}
angles       = {}
interpolates = {r: {}, a: {}}

module.exports = (vars, selection, enter, exit) ->

  nextLevel = vars.id.nesting[vars.depth.value + 1]
  radial = d3.svg.line.radial()
    .interpolate "linear-closed"
    .radius (d) -> d.d3plus.r
    .angle (d) -> d.d3plus.a

  # Calculate label position and pass data from parent.
  data = (d) ->
    if vars.labels.value
      if d.d3plus.label
        d.d3plus_label = d.d3plus.label
      else
        delete d.d3plus_label
    [d]

  if vars.draw.timing

    selection.each (d) ->
      for c in d[nextLevel]
        c.d3plus.id = c[vars.id.value] + "_" + c[nextLevel]

    newRadial = d3.svg.line.radial()
      .interpolate "linear-closed"
      .radius (d, i) ->
        radii[d.d3plus.id] = 0 if radii[d.d3plus.id] is undefined
        radii[d.d3plus.id] = d.d3plus.r if isNaN(radii[d.d3plus.id])
        radii[d.d3plus.id]
      .angle (d, i) ->
        angles[d.d3plus.id] = d.d3plus.a if angles[d.d3plus.id] is undefined
        angles[d.d3plus.id] = d.d3plus.a if isNaN(angles[d.d3plus.id])
        angles[d.d3plus.id]

    radialTween = (arcs, newRadius) ->
      arcs.attrTween "d", (d) ->

        for c, i in d[nextLevel]

          a = c.d3plus.a
          if newRadius is undefined
            r = c.d3plus.r
          else if newRadius is 0
            r = 0

          interpolates.a[c.d3plus.id] = d3.interpolate(angles[c.d3plus.id], a)
          interpolates.r[c.d3plus.id] = d3.interpolate(radii[c.d3plus.id], r)

        (t) ->
          for c, i in d[nextLevel]
            angles[c.d3plus.id] = interpolates.a[c.d3plus.id](t)
            radii[c.d3plus.id] = interpolates.r[c.d3plus.id](t)
          newRadial d[nextLevel]

    enter.append("path")
      .attr "class", "d3plus_data"
      .call shapeStyle, vars
      .attr "d", (d) -> newRadial(d[nextLevel])

    selection.selectAll("path.d3plus_data").data data
      .transition().duration vars.draw.timing
      .call shapeStyle, vars
      .call radialTween

    exit.selectAll("path.d3plus_data")
      .transition().duration vars.draw.timing
      .call radialTween, 0

  else

    enter.append("path").attr "class", "d3plus_data"

    selection.selectAll("path.d3plus_data").data data
      .call shapeStyle, vars
      .attr "d", (d) -> radial(d[nextLevel])

  return
