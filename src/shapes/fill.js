//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.fill = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on enter and exit.
  //----------------------------------------------------------------------------
  function init(nodes) {
    
    nodes
      .attr("x",0)
      .attr("y",0)
      .attr("width",0)
      .attr("height",0)
      
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on update.
  //----------------------------------------------------------------------------
  function update(nodes,mod) {
    if (!mod) var mod = 0
    nodes
      .attr("x",function(d){
        return (-d.d3plus.width/2)-(mod/2)
      })
      .attr("y",function(d){
        return (-d.d3plus.height/2)-(mod/2)
      })
      .attr("width",function(d){
        return d.d3plus.width+mod
      })
      .attr("height",function(d){
        return d.d3plus.height+mod
      })
      .attr("rx",function(d){
        var rounded = ["circle","donut"].indexOf(vars.shape.default) >= 0
        return rounded ? (d.d3plus.width+mod)/2 : 0
      })
      .attr("ry",function(d){
        var rounded = ["circle","donut"].indexOf(vars.shape.default) >= 0
        return rounded ? (d.d3plus.height+mod)/2 : 0
      })
      .attr("shape-rendering",function(d){
        if (["square"].indexOf(vars.shape.default) >= 0) {
          return vars.style.rendering
        }
        else {
          return "auto"
        }
      })
  }
  
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
      if (rad == undefined) var r = d.d3plus.r
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
  // Check each data point for active and temp data
  //----------------------------------------------------------------------------
  selection.each(function(d){
  
    var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
        temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
        total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total,
        group = d3.select(this)
        
    function destroy(type) {
    
      group.selectAll("path."+type)
        .transition().duration(vars.style.timing.transitions)
        .call(size,0,d.d3plus.r,0)
        .remove()
    
    }
  
    function create(type) {

      var new_data = d3plus.utils.copy(d)
      new_data.d3plus.shapeType = type
    
      var delay = 0

      var color = d3plus.variable.color(vars,d)
    
      if (group.selectAll("path."+type).empty()) {
          
        delay = vars.style.timing.transitions
      
        if (type == "temp") {
        
          var pattern = vars.defs.append("pattern")
            .attr("id","hatch"+d.d3plus.id)
            .attr("patternUnits","userSpaceOnUse")
            .attr("x","0")
            .attr("y","0")
            .attr("width","10")
            .attr("height","10")
            .append("g")
          
          pattern.append("rect")
            .attr("x","0")
            .attr("y","0")
            .attr("width","10")
            .attr("height","10")
            .attr("fill",color)
            .attr("fill-opacity",0.25)
          
          pattern.append("line")
            .attr("x1","0")
            .attr("x2","10")
            .attr("y1","0")
            .attr("y2","10")
            .attr("stroke",color)
            .attr("stroke-width",1)
            .attr("shape-rendering",vars.style.rendering)
          
          pattern.append("line")
            .attr("x1","-1")
            .attr("x2","1")
            .attr("y1","9")
            .attr("y2","11")
            .attr("stroke",color)
            .attr("stroke-width",1)
            .attr("shape-rendering",vars.style.rendering)
          
          pattern.append("line")
            .attr("x1","9")
            .attr("x2","11")
            .attr("y1","-1")
            .attr("y2","1")
            .attr("stroke",color)
            .attr("stroke-width",1)
            .attr("shape-rendering",vars.style.rendering)
        }
      
        if (group.selectAll("#clip_"+d.d3plus.id).empty()) {
          group.insert("clipPath",".mouse")
            .attr("id","clip_"+d.d3plus.id)
            .append("rect")
              .attr("class","clipping")
              .call(init)
              .transition().duration(vars.style.timing.transitions)
                .call(update)
        }
      
        group.insert("path","rect.mouse")
          .attr("class",type)
          .attr("clip-path","url(#clip_"+d.d3plus.id+")")
          .data([new_data])
          .transition().duration(0)
            .call(size,0,d.d3plus.r,0)
            .call(d3plus.shape.style,vars)
            .transition().duration(delay)
              .call(size)
            
      }

      group.selectAll("path."+type)
        .data([new_data])
        .transition().duration(vars.style.timing.transitions)
        .delay(delay)
        .call(size)
        .call(d3plus.shape.style,vars)
      
      group.selectAll("#clip_"+d.d3plus.id)
        .select("rect")
        .data([new_data])
        .transition().duration(vars.style.timing.transitions)
        .delay(delay)
          .call(update)
        
      vars.defs.selectAll("pattern#hatch"+d.d3plus.id).selectAll("rect")
        .transition().duration(vars.style.timing.transitions)
        .delay(delay)
        .style("fill",color)
    
      vars.defs.selectAll("pattern#hatch"+d.d3plus.id).selectAll("line")
        .transition().duration(vars.style.timing.transitions)
        .delay(delay)
        .style("stroke",color)
        
    }
      
    if (total && d3plus.apps[vars.type.default].fill) {
      
      if (active && active < total) {
        create("active")
      }
      else {
        destroy("active")
      }
      
      if (temp) {
        create("temp")
      }
      else {
        destroy("temp")
      }
    
      if (!temp && !active) {
        group.selectAll("#clip_"+d.d3plus.id)
          .transition().delay(vars.style.timing.transitions)
          .remove()
      }
        
    }
    else {
      
      destroy("active")
      destroy("temp")
      
      group.selectAll("#clip_"+d.d3plus.id)
        .transition().delay(vars.style.timing.transitions)
        .remove()
    }
  })
  
}
