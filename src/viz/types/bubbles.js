var fetchValue = require("../../core/fetch/value.js"),
    fetchColor = require("../../core/fetch/color.js"),
    fetchText  = require("../../core/fetch/text.js"),
    groupData = require("../../core/data/group.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Bubbles
//------------------------------------------------------------------------------
var bubbles = function(vars) {

  var groupedData = groupData(vars,vars.data.app)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Test for labels
  //----------------------------------------------------------------------------
  var maxChildren = d3.max(groupedData,function(d){return d.values instanceof Array ? d.values.length : 1})
  var label_height = vars.labels.value && !vars.small && maxChildren > 1 ? 50 : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort Data
  //----------------------------------------------------------------------------
  d3plus.array.sort( groupedData , vars.order.value || vars.size.value
                   , vars.order.sort.value , vars.color.value , vars )

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate rows and columns
  //----------------------------------------------------------------------------
  var dataLength = groupedData.length

  if (dataLength < 4) {

    var columns = dataLength
      , rows    = 1
  }
  else {

    var screenRatio = vars.width.viz / vars.height.viz
      , columns     = Math.ceil( Math.sqrt( dataLength * screenRatio ) )
      , rows        = Math.ceil( Math.sqrt( dataLength / screenRatio ) )

  }

  if (dataLength > 0) {

    while ((rows-1)*columns >= vars.data.app.length) {
      rows--
    }

  }

  var column_width = vars.width.viz/columns,
      column_height = vars.height.viz/rows

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scale
  //----------------------------------------------------------------------------
  var domain_min = d3.min(vars.data.app, function(d){
    if (!vars.size.value) return 0
    return fetchValue(vars,d,vars.size.value,vars.id.value,"min")
  })

  var domain_max = d3.max(vars.data.app, function(d){
    if (!vars.size.value) return 0
    return fetchValue(vars,d,vars.size.value,vars.id.value)
  })

  var padding = 5

  var size_min = 20
  var size_max = (d3.min([column_width,column_height])/2)-(padding*2)
  size_max -= label_height

  var size = vars.size.scale.value
    .domain([domain_min,domain_max])
    .rangeRound([size_min,size_max])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate bubble packing
  //----------------------------------------------------------------------------

  var pack = d3.layout.pack()
    .children(function(d) {
      return d.values
    })
    .padding(padding)
    .radius(function(d){
      return size(d)
    })
    .size([column_width-padding*2,column_height-padding*2-label_height])
    .value(function(d){
      return d.value
    })

  var data = []
  var row = 0
  groupedData.forEach(function(d,i){

    var temp = pack.nodes(d)

    var xoffset = (column_width*i) % vars.width.viz,
        yoffset = column_height*row

    temp.forEach(function(t){

      var obj = t.d3plus || {"d3plus": {}}
      if (t.d3plus) {
        var obj = t.d3plus
      }
      else {
        var obj = {"d3plus": {}}
        obj[vars.id.value] = t.key
      }

      obj.d3plus.depth = t.depth

      obj.d3plus.x = t.x
      obj.d3plus.xOffset = xoffset
      obj.d3plus.y = t.y
      obj.d3plus.yOffset = yoffset+label_height
      obj.d3plus.r = t.r
      data.push(obj)

    })

    if ((i+1) % columns == 0) {
      row++
    }

  })

  var downscale = size_max/d3.max(data,function(d){ return d.d3plus.r })

  var xPadding = pack.size()[0]/2,
      yPadding = pack.size()[1]/2

  data.forEach(function(d){

    d.d3plus.x = ((d.d3plus.x-xPadding)*downscale)+xPadding+d.d3plus.xOffset
    d.d3plus.y = ((d.d3plus.y-yPadding)*downscale)+yPadding+d.d3plus.yOffset
    d.d3plus.r = d.d3plus.r*downscale
    delete d.d3plus.xOffset
    delete d.d3plus.yOffset

    if (d.d3plus.depth < vars.depth.value) {
      d.d3plus.static = true

      if (d.d3plus.depth === 0) {
        d.d3plus.label = {
          "x": 0,
          "y": -(size_max+label_height/2),
          "w": size_max*1.5,
          "h": label_height,
          "color": d3plus.color.legible(fetchColor(vars,d,d.d3plus.depth)),
        }
      }
      else {
        d.d3plus.label = false
      }

    }
    else {
      d.d3plus.static = false
      delete d.d3plus.label
    }

  })

  data.sort(function( a , b ){
    return a.d3plus.depth - b.d3plus.depth
  })

  return data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
bubbles.fill         = true
bubbles.requirements = [ "data" ]
bubbles.scale        = 1.05
bubbles.shapes       = [ "circle" , "donut" ]
bubbles.tooltip      = "static"

module.exports = bubbles
