//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "donut" shapes using svg:path with arcs
//------------------------------------------------------------------------------
d3plus.shape.donut = function(vars,selection,enter,exit,transform) {
  
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
      var a = vars.arcs[d.d3plus.shapeType][d.d3plus.id].a
      return a > Math.PI*2 ? Math.PI*2 : a;
    })
    .innerRadius(function(d){
      if (shape == "donut" && !d.d3plus.static) {
        var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
        return r * vars.style.data.donut.size
      }
      else {
        return 0
      }
    })
    .outerRadius(function(d){
      var r = vars.arcs[d.d3plus.shapeType][d.d3plus.id].r
      if (d.d3plus.shapeType != "donut") return r*2
      else return r
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
      if (ang == undefined) var a = d.d3plus.a[d.d3plus.shapeType]
      else var a = ang
      if (!vars.arcs[d.d3plus.shapeType][d.d3plus.id]) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id] = {"r": 0}
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = d.d3plus.shapeType == "donut" ? Math.PI * 2 : 0
      }
      var radius = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].r,r+mod),
          angle = d3.interpolate(vars.arcs[d.d3plus.shapeType][d.d3plus.id].a,a)
      return function(t) {
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].r = radius(t)
        vars.arcs[d.d3plus.shapeType][d.d3plus.id].a = angle(t)
        return arc(d)
      }
    })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Enter
  //----------------------------------------------------------------------------
  enter.append("path")
    .attr("class","d3plus_data")
    .transition().duration(0)
      .call(size,0,0)
      .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Update
  //----------------------------------------------------------------------------
  selection.selectAll("path.d3plus_data")
    .data(function(d) {
      return [d];
    })
    .transition().duration(vars.style.timing.transitions)
      .call(size)
      .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Exit
  //----------------------------------------------------------------------------
  exit.selectAll("path.d3plus_data")
    .transition().duration(vars.style.timing.transitions)
      .call(size,0,0)
      .each("end",function(d){
        delete vars.arcs[d.d3plus.shapeType][d.d3plus.id]
      })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define mouse event shapes
  //----------------------------------------------------------------------------
  var mouses = selection.selectAll("rect.d3plus_mouse")
    .data(function(d) {
      return !d.d3plus.static ? [d] : [];
    })
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Mouse "rect" enter
  //----------------------------------------------------------------------------
  mouses.enter().append("rect")
    .attr("class","d3plus_mouse")
    .attr("x",0)
    .attr("y",0)
    .attr("width",0)
    .attr("height",0)
    .attr("opacity",0)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Mouse "rect" update and mouse events
  //----------------------------------------------------------------------------
  mouses
    .data(function(d) {
      return !d.d3plus.static ? [d] : [];
    })
    .on(d3plus.evt.over,function(d){
      
      if (!vars.frozen) {

        d3.select(this).style("cursor","pointer")
  
        d3.select(this.parentNode).selectAll("path.d3plus_data")
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)
  
        d3.select(this.parentNode)
          .transition().duration(vars.style.timing.mouseevents)
          .call(transform,true)
          
      }
    
    })
    .on(d3plus.evt.out,function(d){
      
      if (!vars.frozen) {

        d3.select(this.parentNode).selectAll("path.d3plus_data")
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",vars.style.data.opacity)
      
        d3.select(this.parentNode)
          .transition().duration(vars.style.timing.mouseevents)
          .call(transform)
          
      }
    
    })
    .transition().duration(vars.style.timing.transitions)
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (-w/2)-3
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (-h/2)-3
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w+6
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h+6
      })
      .attr("rx",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (w+6)/2
      })
      .attr("ry",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (h+6)/2
      })
      .attr("shape-rendering","auto")
  
}
