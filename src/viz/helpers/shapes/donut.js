var shapeStyle = require("./style.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "donut" shapes using svg:path with arcs
//------------------------------------------------------------------------------
module.exports = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // In order to correctly animate each donut's size and arcs, we need to store
  // it's previous values in a lookup object that does not get destroyed when
  // redrawing the visualization.
  //----------------------------------------------------------------------------
  if (!vars.arcs) {
    vars.arcs = {
      "donut": {},
      "active": {},
      "temp": {}
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main arc function that determines what values to use for each
  // arc angle and radius.
  //----------------------------------------------------------------------------
  var arc = d3.svg.arc()
    .startAngle(0)
    .endAngle(function(d){
      var a = vars.arcs[d.d3plus.shape][d.d3plus.id].a;
      return a > Math.PI*2 ? Math.PI*2 : a;
    })
    .innerRadius(function(d){
      if (d.d3plus.static) return 0;
      var r = vars.arcs[d.d3plus.shape][d.d3plus.id].r;
      return r * vars.data.donut.size;
    })
    .outerRadius(function(d){
      return vars.arcs[d.d3plus.shape][d.d3plus.id].r;
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This is the main "arcTween" function where all of the animation happens
  // for each arc.
  //----------------------------------------------------------------------------
  function size(path,mod,rad,ang) {
    if (!mod) var mod = 0
    if (typeof rad != "number") var rad = undefined
    if (typeof ang != "number") var ang = undefined
    path.attrTween("d", function(d){
      if (rad == undefined) var r = d.d3plus.r ? d.d3plus.r : d3.max([d.d3plus.width,d.d3plus.height])
      else var r = rad
      if (ang == undefined) var a = d.d3plus.segments[d.d3plus.shape]
      else var a = ang
      if (!vars.arcs[d.d3plus.shape][d.d3plus.id]) {
        vars.arcs[d.d3plus.shape][d.d3plus.id] = {"r": 0}
        vars.arcs[d.d3plus.shape][d.d3plus.id].a = Math.PI * 2
      }
      var radius = d3.interpolate(vars.arcs[d.d3plus.shape][d.d3plus.id].r,r+mod),
          angle = d3.interpolate(vars.arcs[d.d3plus.shape][d.d3plus.id].a,a)
      return function(t) {
        vars.arcs[d.d3plus.shape][d.d3plus.id].r = radius(t)
        vars.arcs[d.d3plus.shape][d.d3plus.id].a = angle(t)
        return arc(d)
      }
    })
  }

  function data(d) {

    if (d.d3plus.label) {
      d.d3plus_label = d.d3plus.label;
    }
    else {
      delete d.d3plus_label;
    }

    return [d];
  }

  if (vars.draw.timing) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Exit
    //----------------------------------------------------------------------------
    exit.selectAll("path.d3plus_data").transition().duration(vars.draw.timing)
      .call(size,0,0)
      .each("end",function(d){
        delete vars.arcs[d.d3plus.shape][d.d3plus.id];
      });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Update
    //----------------------------------------------------------------------------
    selection.selectAll("path.d3plus_data")
      .data(data)
      .transition().duration(vars.draw.timing)
        .call(size)
        .call(shapeStyle,vars);

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Enter
    //----------------------------------------------------------------------------
    enter.append("path")
      .attr("class","d3plus_data")
      .transition().duration(0)
        .call(size,0,0)
        .call(shapeStyle,vars)
        .transition().duration(vars.draw.timing)
          .call(size)
          .call(shapeStyle,vars);

  }
  else {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Exit
    //----------------------------------------------------------------------------
    exit.selectAll("path.d3plus_data")
      .each(function(d){
        delete vars.arcs[d.d3plus.shape][d.d3plus.id];
      });

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Enter
    //----------------------------------------------------------------------------
    enter.append("path")
      .attr("class","d3plus_data");

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Update
    //----------------------------------------------------------------------------
    selection.selectAll("path.d3plus_data")
      .data(data)
      .call(size)
      .call(shapeStyle,vars);
  }

};
