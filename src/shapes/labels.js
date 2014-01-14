//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "labels" using svg:text and d3plus.utils.wordwrap
//------------------------------------------------------------------------------
d3plus.shape.labels = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Exiting
  //----------------------------------------------------------------------------
  remove = function(text) {
    text
      .transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Label Styling
  //----------------------------------------------------------------------------
  style = function(text,wrap) {
    
    function x_pos(t) {
      
      var align = vars.style.labels.align,
          tspan = this.tagName == "tspan",
          share = tspan ? this.parentNode.className.baseVal == "share" : this.className.baseVal == "share",
          width = d3.select(this).node().getBBox().width
          
      if (align == "middle" || share) {
        return t.x-width/2
      }
      else if (align == "end") {
        return t.x+t.w/2-width
      }
      else {
        return t.x-t.w/2
      }
      
    }
    
    function y_pos(t) {
      
      if (d3.select(this).select("tspan").empty()) {
        return 0
      }
      else {

        var align = vars.style.labels.align,
            height = d3.select(this).node().getBBox().height,
            diff = parseFloat(d3.select(this).style("font-size"),10)/5
            
        if (this.className.baseVal == "share") {
          if (align == "end") {
            var y = t.y-t.h/2-diff
          }
          else {
            var y = t.y+t.h/2-height
          }
        }
        else {
          
          if (align == "middle") {
            var y = t.y-height/2-diff/2
          }
          else if (align == "end") {
            var y = t.y+t.h/2-height+diff/2
          }
          else {
            var y = t.y-t.h/2-diff
          }
        
        }
      
        return y
        
      }
    }
    
    text
      .style("font-weight",vars.style.font.weight)
      .attr("font-family",vars.style.font.family)
      .attr("text-anchor","start")
      .attr("fill", function(t){ 
        return d3plus.color.text(t.color); 
      })
      .attr("x",x_pos)
      .attr("y",y_pos)
      .each(function(t){
        
        if (wrap) {

          if (t.text) {

            d3plus.utils.wordwrap({
              "text": vars.format(t.text*100,"share")+"%",
              "parent": this,
              "width": t.w,
              "height": t.h,
              "resize": true,
              "font_max": 20
            })
          
          }
          else {
            
            if (vars.style.labels.align != "middle") {
              var height = t.h-t.share
            }
            else {
              var height = t.h
            }

            d3plus.utils.wordwrap({
              "text": t.names,
              "parent": this,
              "width": t.w,
              "height": height,
              "resize": true
            })
          
          }
          
        }
        
      })
      .attr("y",y_pos)
      .selectAll("tspan")
        .attr("x",x_pos)
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through each selection and analyze the labels
  //----------------------------------------------------------------------------
  if (vars.labels.default) {
    
    selection.each(function(d){
    
      var disabled = d.d3plus && "label" in d.d3plus && !d.d3plus.label,
          stat = d.d3plus && "static" in d.d3plus && d.d3plus.static
          label = d.d3plus_label,
          share = d.d3plus_share,
          names = d3plus.variable.text(vars,d),
          group = d3.select(this),
          share_size = 0,
          fill = d3plus.apps[vars.type.default].fill
          
      if (["line","area"].indexOf(vars.shape.default) >= 0) {
        var background = true
      }
      else {
        var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
            temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
            total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total,
            background = (!temp && !active) || (active == total)
      }
      
      if (!disabled && (background || !fill) && !stat) {
        
        if (share && share.w >= 20 && share.h >= 10 && d.d3plus.share && vars.style.labels.align != "middle") {
          
          share.text = d.d3plus.share
          share.color = d3plus.shape.color(d,vars)
    
          var text = group.selectAll("text.share")
            .data([share],function(t){
              return t.w+""+t.h+""+t.text
            })
    
          text.enter().insert("text",".mouse")
            .attr("class","share")
            .attr("opacity",0)
            .call(style)
    
          text
            .transition().duration(vars.style.timing.transitions/2)
            .delay(vars.style.timing.transitions/2)
            .call(style,true)
            .attr("opacity",0.5)
      
          share_size = text.node().getBBox().height
  
          text.exit()
            .call(remove)
          
        }
        else {
          group.selectAll("text.share")
            .call(remove)
        }
        
        if (label && label.w >= 20 && label.h >= 10 && names.length) {

          label.names = names
          label.color = d3plus.shape.color(d,vars)
          label.share = share_size
      
          var text = group.selectAll("text.label")
            .data([label],function(t){
              return t.w+""+t.h+""+t.names.join("")
            })
      
          text.enter().insert("text",".mouse")
            .attr("class","label")
            .attr("opacity",0)
            .call(style)
        
          text
            .transition().duration(vars.style.timing.transitions/2)
            .delay(vars.style.timing.transitions/2)
              .attr("opacity",1)
              .call(style,true)
    
          text.exit()
            .call(remove)
            
        }
        else {
          group.selectAll("text.label")
            .call(remove)
        }
        
      }
      else {
        group.selectAll("text")
          .call(remove)
      }
    })
    
  }
  else {
    
    selection.selectAll("text")
      .call(remove)
      
  }
  
}
