copy        = require "../../../util/copy.coffee"
distance    = require "../../../network/distance.coffee"
fetchText   = require "../../../core/fetch/text.js"
fontSizes   = require "../../../font/sizes.coffee"
largestRect = require "../../../geom/largestRect.coffee"
path2poly   = require "../../../geom/path2poly.coffee"
shapeStyle  = require "./style.coffee"

labels = {}

module.exports = (vars, selection, enter, exit) ->

  # Define the geographical projection
  projection = d3.geo[vars.coords.projection.value]()

  projection.center(vars.coords.center) if projection.center

  vars.zoom.scale = 1 unless vars.zoom.scale
  vars.zoom.area  = 1/vars.zoom.scale/vars.zoom.scale
  vars.path = d3.geo.path().projection(projection)

  if vars.draw.timing
    selection.selectAll "path.d3plus_data"
      .attr "d", vars.path
      .transition().duration(vars.draw.timing)
        .call shapeStyle, vars
  else
    selection.selectAll("path.d3plus_data")
      .attr "d", vars.path
      .call shapeStyle, vars

  enter.append "path"
    .attr "id", (d) -> d.id
    .attr "class", "d3plus_data"
    .attr "d", vars.path
    .call shapeStyle, vars

  size_change = vars.old_height isnt vars.height.viz or vars.height.changed or
                vars.old_width isnt vars.width.viz or vars.width.changed

  vars.old_height = vars.height.viz
  vars.old_width  = vars.width.viz

  if vars.coords.changed or size_change or vars.coords.mute.changed or
     vars.coords.solo.changed or vars.type.changed or vars.text.changed or
     vars.coords.projection.changed or vars.labels.changed

    vars.zoom.bounds = null
    vars.zoom.reset  = true
    vars.zoom.coords = {}

    selection.each (d) ->

      if vars.coords.simplify.value and d.geometry.coordinates.length > 1

        distances = []
        areas     = []
        areaM     = 0
        largest = copy d
        reduced = copy d

        d.geometry.coordinates = d.geometry.coordinates.filter (c, i) ->

          reduced.geometry.coordinates = [c]
          a = vars.path.area reduced

          if a > 0
            areas.push(a)
            if a > areaM
              largest.geometry.coordinates = [c]
              areaM = a
            true
          else false

        center = vars.path.centroid largest
        for c, i in d.geometry.coordinates
          reduced.geometry.coordinates = [c]
          distances.push distance(vars.path.centroid(reduced), center)

        dist_values = distances.reduce (arr, dist, i) ->
          arr.push areas[i]/dist if dist
          return arr
        , []

        dist_cutoff = d3.quantile dist_values, vars.coords.threshold.value

        reduced.geometry.coordinates = d.geometry.coordinates.filter (c,i) ->
          dist = distances[i]
          a = areas[i]
          dist is 0 or a/dist >= dist_cutoff

        coords = largest.geometry.coordinates[0]
        if coords and largest.geometry.type is "MultiPolygon"
          coords = coords[0]
          largest.geometry.coordinates[0] = coords
          largest.geometry.type = "Polygon"

      else
        reduced = d
        largest = d
        coords = d.geometry.coordinates[0]

      vars.zoom.coords[d.d3plus.id] = reduced

      delete d.d3plus_label

      if vars.labels.value
        names = fetchText vars, d

        if coords and names.length

          path = path2poly vars.path(largest)
          style =
            "font-weight": vars.labels.font.weight
            "font-family": vars.labels.font.family.value

          ratio = null
          if names[0].split(" ").length is 1
            size = fontSizes(names[0],style)[0]
            ratio = size.width/size.height

          rect = largestRect path,
            angle:       0
            aspectRatio: ratio

          if rect

            rect = rect[0]

            d.d3plus_label =
              anchor: "middle"
              valign: "center"
              h:      rect.height
              w:      rect.width
              x:      rect.cx
              y:      rect.cy
              names:  names

      labels[d.id] = d.d3plus_label

      b = vars.path.bounds reduced
      unless vars.zoom.bounds
        vars.zoom.bounds = b
      else
        if vars.zoom.bounds[0][0] > b[0][0]
          vars.zoom.bounds[0][0] = b[0][0]
        if vars.zoom.bounds[0][1] > b[0][1]
          vars.zoom.bounds[0][1] = b[0][1]
        if vars.zoom.bounds[1][0] < b[1][0]
          vars.zoom.bounds[1][0] = b[1][0]
        if vars.zoom.bounds[1][1] < b[1][1]
          vars.zoom.bounds[1][1] = b[1][1]

  else if !vars.focus.value.length
    vars.zoom.viewport = false
    selection.each (d) -> d.d3plus_label = labels[d.id]
