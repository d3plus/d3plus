//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Bubbles
//------------------------------------------------------------------------------
d3plus.visualization.bubbles = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Test for labels
  //----------------------------------------------------------------------------
  var label_height = vars.labels.value && !vars.small ? 50 : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Sort Data
  //----------------------------------------------------------------------------
  var order = vars.order.value || vars.size.value
  vars.data.app.sort(function(a,b){
    var a_value = d3plus.variable.value(vars,a,order)
      , b_value = d3plus.variable.value(vars,b,order)
    return vars.order.sort.value == "asc" ? a_value-b_value : b_value-a_value
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate rows and columns
  //----------------------------------------------------------------------------
  var dataLength = vars.data.app.length

  if (dataLength < 4) {

    var columns = dataLength
      , rows    = 1
  }
  else {

    var screenRatio = vars.app_width / vars.app_height
      , columns     = Math.ceil( Math.sqrt( dataLength * screenRatio ) )
      , rows        = Math.ceil( Math.sqrt( dataLength / screenRatio ) )

  }

  if (dataLength > 0) {

    while ((rows-1)*columns >= vars.data.app.length) {
      rows--
    }

  }

  var column_width = vars.app_width/columns,
      column_height = vars.app_height/rows

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define size scale
  //----------------------------------------------------------------------------
  var domain_min = d3.min(vars.data.app, function(d){
    if (!vars.size.value) return 0
    return d3plus.variable.value(vars,d,vars.size.value,null,"min")
  })

  var domain_max = d3.max(vars.data.app, function(d){
    if (!vars.size.value) return 0
    return d3plus.variable.value(vars,d,vars.size.value)
  })

  var padding = 5

  var size_min = 20
  var size_max = (d3.min([column_width,column_height])/2)-(padding*2)
  size_max -= label_height

  var size = d3.scale[vars.size.scale.value]()
    .domain([domain_min,domain_max])
    .rangeRound([size_min,size_max])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate bubble packing
  //----------------------------------------------------------------------------
  var pack = d3.layout.pack()
    .size([column_width-padding*2,column_height-padding*2-label_height])
    .value(function(d) {
      if (!vars.size.value) return 0
      return d3plus.variable.value(vars,d,vars.size.value)
    })
    .padding(padding)
    .radius(function(d){
      return size(d)
    })

  var data = []

  var row = 0
  vars.data.app.forEach(function(d,i){

    var temp = pack.nodes(d)

    var xoffset = (column_width*i) % vars.app_width,
        yoffset = column_height*row

    temp.forEach(function(t){
      if (!t.d3plus) t.d3plus = {}
      if (!t.d3plus.depth) t.d3plus.depth = t.depth
      t.xoffset = xoffset
      t.yoffset = yoffset+label_height
      if (t.depth < vars.depth.value) {
        t.d3plus.static = true
      }
      else {
        t.d3plus.static = false
      }
      if (temp.length == 1) {
        t.d3plus.label = false
      }
      else {
        t.d3plus.label = true
      }
    })

    data = data.concat(temp)

    if ((i+1) % columns == 0) {
      row++
    }

  })

  var downscale = size_max/d3.max(data,function(d){ return d.r })

  data.forEach(function(d){
    d.x = ((d.x-column_width/2)*downscale)+column_width/2
    d.d3plus.x = d.x+d.xoffset
    d.y = ((d.y-column_height/2)*downscale)+column_height/2
    d.d3plus.y = d.y+d.yoffset
    d.r = d.r*downscale
    d.d3plus.r = d.r
  })

  data.sort(function(a,b){
    return a.depth-b.depth
  })

  var label_data = data.filter(function(d){
    return d.depth == 0
  })

  var labels = vars.group.selectAll("text.d3plus_bubble_label")
    .data(label_data,function(d){
      if (!d.d3plus.label_height) d.d3plus.label_height = 0
      return d[vars.id.nesting[d.depth]]
    })

  function label_style(l) {
    l
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .attr("text-anchor","middle")
      .attr("font-weight",vars.style.font.weight)
      .attr("font-family",vars.style.font.family)
      .attr("font-size","12px")
      .style("fill",function(d){
        var color = d3plus.variable.color(vars,d)
        return d3plus.color.legible(color)
      })
      .each(function(d){
        if (d.r > 10 && label_height > 10) {
          var names = d3plus.variable.text(vars,d,d.depth)
          d3plus.util.wordwrap({
            "text"   : names,
            "parent" : this,
            "width"  : column_width-padding*2,
            "height" : label_height
          })
        }
      })
      .attr("y",function(d){
        d.d3plus.label_height = d3.select(this).node().getBBox().height
        return d.d3plus.y-d.r-d.d3plus.label_height-padding
      })
      .selectAll("tspan")
        .attr("x",function(d){
          return d.d3plus.x
        })
  }

  labels.enter().append("text")
    .attr("class","d3plus_bubble_label")
    .call(label_style)
    .attr("opacity",0)

  labels.transition().duration(vars.style.timing.transitions)
    .call(label_style)
    .attr("opacity",1)

  labels.exit()
    .attr("opacity",0)
    .remove()

  return data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
d3plus.visualization.bubbles.fill         = true
d3plus.visualization.bubbles.requirements = [ "data" ]
d3plus.visualization.bubbles.scale        = 1.05
d3plus.visualization.bubbles.shapes       = [ "circle" , "donut" ]
d3plus.visualization.bubbles.tooltip      = "static"
