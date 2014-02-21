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
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (-w/2)-(mod/2)
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (-h/2)-(mod/2)
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w+mod
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h+mod
      })
      .attr("rx",function(d){
        var rounded = vars.shape.value == "circle"
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return rounded ? (w+mod+2)/2 : 0
      })
      .attr("ry",function(d){
        var rounded = vars.shape.value == "circle"
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return rounded ? (h+mod+2)/2 : 0
      })
      .attr("shape-rendering",function(d){
        if (vars.shape.value == "square") {
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
    .attr("class","d3plus_data")
    .call(init)
    .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Update
  //----------------------------------------------------------------------------
  selection.selectAll("rect.d3plus_data")
    .data(function(d) { 
      
      if (vars.labels.value && !d.d3plus.label) {
        
        d.d3plus_label = {
          "w": 0,
          "h": 0,
          "x": 0,
          "y": 0
        }

        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width,
            h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
    
        // Square bounds
        if (vars.shape.value == "square") {
              
          w -= vars.style.labels.padding*2
          h -= vars.style.labels.padding*2
          
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
          d.d3plus_label.w = Math.sqrt(Math.pow(w,2)*.75)-(vars.style.labels.padding)
          d.d3plus_label.h = Math.sqrt(Math.pow(h,2)*.75)-(vars.style.labels.padding)
        }
        
        if (d.d3plus_label.w < 20 && d.d3plus_label.h < 10) {
          delete d.d3plus_label
        }
        
      }
      else if (d.d3plus.label) {
        d.d3plus_label = d.d3plus.label
      }
      
      return [d];
    })
    .transition().duration(vars.style.timing.transitions)
      .call(update)
      .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Exit
  //----------------------------------------------------------------------------
  exit.selectAll("rect.d3plus_data")
    .transition().duration(vars.style.timing.transitions)
    .call(init)

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
      
        d3.select(this.parentNode).selectAll(".d3plus_data")
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)
      
        d3.select(this.parentNode)
          .transition().duration(vars.style.timing.mouseevents)
          .call(transform,true)
          
      }
        
    })
    .on(d3plus.evt.out,function(d){
      
      if (!vars.frozen) {
      
        d3.select(this.parentNode).selectAll(".d3plus_data")
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
