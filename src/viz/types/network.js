var smallestGap = require("../../network/smallestGap.coffee"),
    fetchValue = require("../../core/fetch/value.coffee");
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Network
//------------------------------------------------------------------------------
var network = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Use filtered lists if they are available
  //----------------------------------------------------------------------------
  var nodes = vars.nodes.restricted || vars.nodes.value,
      edges = vars.edges.restricted || vars.edges.value;

  var x_range = d3.extent(nodes,function(n){return n.x}),
      y_range = d3.extent(nodes,function(n){return n.y})

  var val_range = [ 1 , 1 ]
  if (typeof vars.size.value === "number"){
    val_range = [vars.size.value, vars.size.value]
  }
  else if (vars.size.value){
    val_range = d3.extent(nodes, function(d){
      var val = fetchValue( vars , d , vars.size.value )
      return val === 0 ? null : val
    })
  }
  if (typeof val_range[0] == "undefined") val_range = [1,1]

  if (typeof vars.size.value === "number"){
    var max_size = vars.size.value;
    var min_size = vars.size.value;
  }
  else {

    var max_size = smallestGap(nodes, {"accessor": function(n){
      return [n.x, n.y];
    }});

    var limit = max_size/2;

    var overlap = vars.size.value ? vars.nodes.overlap : 0.4
    max_size = max_size * overlap;

    if (vars.edges.arrows.value) {
      max_size = max_size * 0.5;
    }

    if (val_range[0] === val_range[1]) {
      var min_size = limit;
      max_size = limit;
    }
    else {

      var width = (x_range[1]+max_size*1.1)-(x_range[0]-max_size*1.1),
          height = (y_range[1]+max_size*1.1)-(y_range[0]-max_size*1.1),
          aspect = width/height,
          app = vars.width.viz/vars.height.viz;

      if ( app > aspect ) {
        var scale = vars.height.viz/height;
      }
      else {
        var scale = vars.width.viz/width;
      }
      var min_size = max_size * 0.25;
      if ( min_size * scale < 2 ) {
        min_size = 2/scale;
      }

    }
  }

  // Create size scale
  var radius = vars.size.scale.value
    .domain(val_range)
    .range([min_size, max_size])

  vars.zoom.bounds = [ [ x_range[0]-max_size*1.1 , y_range[0]-max_size*1.1 ]
                     , [ x_range[1]+max_size*1.1 , y_range[1]+max_size*1.1 ] ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match nodes to data
  //----------------------------------------------------------------------------
  var data = [], lookup = {}
  nodes.forEach(function(n){

    var d = vars.data.viz.filter(function(a){
      return a[vars.id.value] == n[vars.id.value]
    })[0]

    var obj = d || {}

    obj[vars.id.value] = n[vars.id.value]

    obj.d3plus = {}
    obj.d3plus.x = n.x
    obj.d3plus.y = n.y
    var val = fetchValue(vars,obj,vars.size.value)
    obj.d3plus.r = val ? radius(val) : radius.range()[0]
    lookup[obj[vars.id.value]] = {
      "x": obj.d3plus.x,
      "y": obj.d3plus.y,
      "r": obj.d3plus.r
    }

    data.push(obj)
  })

  data.sort(function(a,b){
    return b.d3plus.r - a.d3plus.r
  })

  edges.forEach(function(l,i){

    if (l.d3plus) {
      delete l.d3plus.spline
    }

    l[vars.edges.source].d3plus = {}
    var source = lookup[l[vars.edges.source][vars.id.value]]
    if (source !== undefined) {
      l[vars.edges.source].d3plus.r = source.r
      l[vars.edges.source].d3plus.x = source.x
      l[vars.edges.source].d3plus.y = source.y
    } else {
      delete l[vars.edges.source].d3plus;
    }

    l[vars.edges.target].d3plus = {}
    var target = lookup[l[vars.edges.target][vars.id.value]]
    if (target !== undefined) {
      l[vars.edges.target].d3plus.r = target.r
      l[vars.edges.target].d3plus.x = target.x
      l[vars.edges.target].d3plus.y = target.y
    } else {
      delete l[vars.edges.target].d3plus;
    }

  })

  return {"nodes": data, "edges": edges}

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
network.nesting      = false
network.requirements = ["nodes","edges"]
network.scale        = 1.05
network.shapes       = [ "circle" , "square" , "donut" ]
network.tooltip      = "static"
network.zoom         = true

module.exports = network
