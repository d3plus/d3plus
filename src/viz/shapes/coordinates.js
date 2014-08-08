var fetchText = require("../../core/fetch/text.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.coordinates = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define the geographical projection
  //----------------------------------------------------------------------------
  var projection = d3.geo[vars.coords.projection.value]()
    .center(vars.coords.center)

  if (!vars.zoom.scale) {
    vars.zoom.scale = 1
  }

  vars.zoom.area = 1/vars.zoom.scale/vars.zoom.scale

  vars.path = d3.geo.path()
    .projection(projection)

  enter.append("path")
    .attr("id",function(d){
      return d.id
    })
    .attr("class","d3plus_data")
    .attr("d",vars.path)
    .call(d3plus.shape.style,vars)

  if (vars.draw.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.draw.timing)
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .call(d3plus.shape.style,vars)
  }

  var size_change = vars.old_height != vars.height.viz || vars.height.changed
    || vars.old_width != vars.width.viz || vars.width.changed

  vars.old_height = vars.height.viz
  vars.old_width = vars.width.viz

  if (vars.coords.changed || size_change || vars.coords.mute.changed || vars.coords.solo.changed) {

    vars.zoom.bounds = null
    vars.zoom.coords = {}
    vars.zoom.labels = {}

    selection.each(function(d){

      var b = vars.path.bounds(d)

      var areas = []
      d.geometry.coordinates = d.geometry.coordinates.filter(function(c,i){

        var test = d3plus.util.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a >= vars.coords.threshold) {
          areas.push(a)
          return true
        }
        return false

      })
      areas.sort(function(a,b){
        return a-b
      })

      var reduced = d3plus.util.copy(d),
          largest = d3plus.util.copy(d)
      reduced.geometry.coordinates = reduced.geometry.coordinates.filter(function(c,i){

        var test = d3plus.util.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a == areas[areas.length-1]) {
          largest.geometry.coordinates = test.geometry.coordinates
        }
        return a >= d3.quantile(areas,.9)

      })
      vars.zoom.coords[d.d3plus.id] = reduced

      var coords = largest.geometry.coordinates[0]
      if (coords && largest.geometry.type === "MultiPolygon") {
        coords = coords[0]
        largest.geometry.coordinates[0] = coords
        largest.geometry.type = "Polygon"
      }

      if (coords) {

        var path = vars.path(largest).split("M")[1].split("Z")[0].split("L")
        for (var i = 0; i < path.length; i++) {
          path[i] = path[i].split(",")
          path[i][0] = parseFloat(path[i][0])
          path[i][1] = parseFloat(path[i][1])
        }

        var style = {
          "font-weight": vars.labels.font.weight,
          "font-family": vars.labels.font.family.value
        }

        var names = fetchText(vars,d)

        if (names.length && names[0].split(" ").length === 1) {
          var size = d3plus.font.sizes(names[0],style)[0]
            , ratio = size.width/size.height
        }
        else {
          var ratio = null
        }

        var rect = d3plus.geom.largestRect(path,{
          "angle": 0,
          "aspectRatio": ratio
        })[0]

        if (rect) {

          var label = {
            "anchor": "middle",
            "valign": "center",
            "group": vars.g.labels,
            "h": Math.floor(rect.height),
            "w": Math.floor(rect.width),
            "x": Math.floor(rect.cx),
            "y": Math.floor(rect.cy),
            "names": names
          }

          vars.zoom.labels[d.d3plus.id] = label

        }
        else {
          delete vars.zoom.labels[d.d3plus.id]
        }

      }
      else {
        delete vars.zoom.labels[d.d3plus.id]
      }

      if (!vars.zoom.bounds) {
        vars.zoom.bounds =  b
      }
      else {
        if (vars.zoom.bounds[0][0] > b[0][0]) {
          vars.zoom.bounds[0][0] = b[0][0]
        }
        if (vars.zoom.bounds[0][1] > b[0][1]) {
          vars.zoom.bounds[0][1] = b[0][1]
        }
        if (vars.zoom.bounds[1][0] < b[1][0]) {
          vars.zoom.bounds[1][0] = b[1][0]
        }
        if (vars.zoom.bounds[1][1] < b[1][1]) {
          vars.zoom.bounds[1][1] = b[1][1]
        }
      }

    })

  }
  else if (!vars.focus.value.length) {
    vars.zoom.viewport = false
  }

}
