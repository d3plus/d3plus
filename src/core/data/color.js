var buckets = require("../../util/buckets.coffee"),
    fetchValue = require("../fetch/value.coffee"),
    print      = require("../console/print.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets color range of data, if applicable
//-------------------------------------------------------------------
module.exports = function(vars) {

  if ( vars.dev.value ) print.time("getting color data range")

  var data_range = []
  vars.data.pool.forEach(function(d){
    var val = parseFloat(fetchValue(vars,d,vars.color.value))
    if (typeof val == "number" && !isNaN(val) && data_range.indexOf(val) < 0) data_range.push(val)
  })

  if ( vars.dev.value ) print.timeEnd("getting color data range")

  if (data_range.length > 1) {

    var data_domain = null

    if ( vars.dev.value ) print.time("calculating color scale")

    data_range = d3.extent(data_range)

    if (data_range[0] < 0 && data_range[1] > 0) {
      var color_range = vars.color.range
      if (color_range.length == 3) {
        data_range.push(data_range[1])
        data_range[1] = 0
      }
    }
    else if (data_range[1] > 0 && data_range[0] >= 0) {
      var color_range = vars.color.heatmap
      data_range = buckets(data_range,color_range.length)
    }
    else {
      var color_range = vars.color.range.slice(0)
      if (data_range[0] < 0) {
        color_range.pop()
      }
      else {
        color_range.shift()
      }
    }

    vars.color.valueScale = d3.scale.sqrt()
      .domain(data_range)
      .range(color_range)
      .interpolate(d3.interpolateRgb)

    if ( vars.dev.value ) print.timeEnd("calculating color scale")

  }
  else {
    vars.color.valueScale = null
  }

}
