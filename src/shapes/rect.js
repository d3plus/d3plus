//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.rect = function(vars,selection,enter,exit,transform) {

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
        var rounded = vars.shape.default == "circle"
        return rounded ? (d.d3plus.width+mod)/2 : 0
      })
      .attr("ry",function(d){
        var rounded = vars.shape.default == "circle"
        return rounded ? (d.d3plus.height+mod)/2 : 0
      })
      .attr("shape-rendering",function(d){
        if (vars.shape.default == "square") {
          return vars.style.rendering
        }
        else {
          return "auto"
        }
      })
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Enter
  //----------------------------------------------------------------------------
  enter.append("rect")
    .attr("class","data")
    .call(init)
    .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Update
  //----------------------------------------------------------------------------
  selection.selectAll("rect.data")
    .data(function(d) { 
      
      d.d3plus_label = {
        "w": 0,
        "h": 0,
        "x": 0,
        "y": 0
      }
    
      // Square bounds
      if (vars.shape.default == "square") {

        var w = d.d3plus.width-(vars.style.labels.padding*2),
            h = d.d3plus.height-(vars.style.labels.padding*2)
        
        d.d3plus_share = {
          "w": w,
          "h": h/4,
          "x": 0,
          "y": 0
        }
        
        d.d3plus_label.w = w
        d.d3plus_label.h = h
        
      }
      // Circle bounds
      else {
        d.d3plus_label.w = Math.sqrt(Math.pow(d.d3plus.width,2)/2)-(vars.style.labels.padding)
        d.d3plus_label.h = Math.sqrt(Math.pow(d.d3plus.height,2)/2)-(vars.style.labels.padding)
      }
      
      return [d];
    })
    .transition().duration(vars.style.timing.transitions)
      .call(update)
      .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Exit
  //----------------------------------------------------------------------------
  exit.selectAll("rect.data")
    .transition().duration(vars.style.timing.transitions)
    .call(init)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define mouse event shapes
  //----------------------------------------------------------------------------
  var mouses = selection.selectAll("rect.mouse")
    .data(function(d) {
      return !d.d3plus.static ? [d] : [];
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Mouse "rect" enter
  //----------------------------------------------------------------------------
  mouses.enter().append("rect")
    .attr("class","mouse")
    .call(init)
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
      
        d3.select(this.parentNode).selectAll(".data")
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)
      
        d3.select(this.parentNode)
          .transition().duration(vars.style.timing.mouseevents)
          .call(transform,true)
          
      }
        
    })
    .on(d3plus.evt.out,function(d){
      
      if (!vars.frozen) {
      
        d3.select(this.parentNode).selectAll(".data")
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",vars.style.data.opacity)
          
        d3.select(this.parentNode)
          .transition().duration(vars.style.timing.mouseevents)
          .call(transform)
          
      }
        
    })
    .transition().duration(vars.style.timing.transitions)
      .call(update,6)
  
}
