//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.ui.key = function(vars) {
  
  var key_display = true
  
  if (vars.key.value && vars.color.key) {
    
    if (!vars.color_scale) {
    
      var color_groups = {}
      vars.data.pool.forEach(function(d){
        var color = d3plus.variable.color(vars,d[vars.id.key])
        if (!color_groups[color]) {
          color_groups[color] = []
        }
        color_groups[color].push(d)
      })
    
      var colors = []
      for (color in color_groups) {
      
        var obj = {
          "color": color
        }
        
        if (vars.depth.value > 0) {
        
          for (var i = vars.depth.value-1; i >= 0; i--) {
            var parents = d3plus.utils.uniques(color_groups[color],vars.id.nesting[i])
            if (parents.length == 1) {
              if (!obj.name) {
                var name = d3plus.variable.text(vars,parents[0],i)
                if (name) {
                  obj.name = name
                }
              }
              if (!obj.icon) {
                var icon = d3plus.variable.value(vars,parents[0],vars.icon.key,vars.id.nesting[i])
                if (icon) {
                  obj.icon = icon
                }
              }
            }
            if (obj.name && obj.icon) {
              break;
            }
          }
        
        }
        else {

          for (d in color_groups[color]) {
            if (!obj.name) {
              var name = d3plus.variable.text(vars,color_groups[color][d],vars.depth.value)
              if (name) {
                obj.name = name
              }
            }
            if (!obj.icon) {
              var icon = d3plus.variable.value(vars,color_groups[color][d],vars.icon.key)
              if (icon) {
                obj.icon = icon
              }
            }
            if (obj.name && obj.icon) {
              break;
            }
          }
        
        }
        
        colors.push(obj)
      
      }
        
      var available_width = vars.width.value
      
      var key_width = vars.style.key.size*colors.length+vars.style.key.padding*(colors.length-1)
      
      if (available_width < key_width) {
        key_display = false
      }
      else {
        
        colors.sort(function(a,b){
          
          a_value = a.color
          b_value = b.color

          a_value = d3.rgb(a_value).hsl()
          b_value = d3.rgb(b_value).hsl()
  
          if (a_value.s == 0) a_value = 361
          else a_value = a_value.h
          if (b_value.s == 0) b_value = 361
          else b_value = b_value.h
          
          return a_value - b_value
          
        })
        
        if (vars.style.key.align == "start") {
          var start_x = vars.style.key.padding
        }
        else if (vars.style.key.align == "end") {
          var start_x = vars.width.value - vars.style.key.padding - key_width
        }
        else {
          var start_x = vars.width.value/2 - key_width/2
        }
        
        vars.g.key.selectAll("g.scale")
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()
        
        var keys = vars.g.key.selectAll("g.color")
          .data(colors,function(d){
            return d.url ? d.color+"_"+d.url : d.color
          })
          
        function position(group) {
          
          group
            .attr("transform",function(g,i){
              var x = start_x + (i*(vars.style.key.padding+vars.style.key.size))
              return "translate("+x+","+vars.style.key.padding+")"
            })
          
        }
      
        var key_enter = keys.enter().append("g")
          .attr("class","color")
          .attr("opacity",0)
          .call(position)
          
        function style(rect) {
          
          rect
            .attr("width",vars.style.key.size)
            .attr("height",vars.style.key.size)
            .attr("fill",function(g){
                
              d3.select(this.parentNode).selectAll("text")
                .remove()
                
              if (g.url) {
                
                var short_url = d3plus.utils.strip(g.url+"_"+g.color)
                
                var pattern = vars.defs.selectAll("pattern#"+short_url)
                  .data([short_url])
                
                var pattern_enter = pattern.enter().append("pattern")
                  .attr("id",short_url)
                  .attr("width",vars.style.key.size)
                  .attr("height",vars.style.key.size)
                  
                pattern_enter.append("rect")
                  .attr("fill",g.color)
                  .attr("width",vars.style.key.size)
                  .attr("height",vars.style.key.size)
                  
                pattern_enter.append("image")
                  .attr("xlink:href",g.url)
                  .attr("width",vars.style.key.size)
                  .attr("height",vars.style.key.size)
                    
                return "url(#"+short_url+")"
              }
              else {
                
                d3.select(this.parentNode).append("text")
                  .style("font-weight",vars.style.font.weight)
                  .attr("font-family",vars.style.font.family)
                  .attr("text-anchor","start")
                  .attr("fill",d3plus.color.text(g.color))
                  .attr("x",0)
                  .attr("y",0)
                  .each(function(t){
        
                    if (g.name) {

                      d3plus.utils.wordwrap({
                        "text": g.name,
                        "parent": this,
                        "width": vars.style.key.size-vars.style.key.padding*2,
                        "height": vars.style.key.size-vars.style.key.padding*2,
                        "resize": true
                      })
                      
                    }
        
                  })
                  .attr("y",function(t){
                    var h = this.getBBox().height,
                        diff = parseFloat(d3.select(this).style("font-size"),10)/5
                    return vars.style.key.size/2 - h/2 - diff/2
                  })
                  .selectAll("tspan")
                    .attr("x",function(t){
                      var w = this.getBBox().width
                      return vars.style.key.size/2 - w/2
                    })
                
                return g.color
              }
              
            })
          
        }
        
        key_enter
          .append("rect")
            .attr("class","color")
            .call(style)
            
        keys
          .order()
          .on(d3plus.evt.over,function(d,i){

            d3.select(this).style("cursor","pointer")
            
            if (d.name) {

              d3.select(this).style("cursor","pointer")
            
              var x = start_x + (i*(vars.style.key.padding+vars.style.key.size)),
                  y = d3.transform(d3.select(this.parentNode).attr("transform")).translate[1]
                
              x += vars.style.key.size/2
              y += vars.style.key.padding+vars.style.key.size/2
        
              d3plus.tooltip.create({
                "align": "top center",
                "arrow": true,
                "background": vars.style.tooltip.background,
                "fontcolor": vars.style.tooltip.font.color,
                "fontfamily": vars.style.tooltip.font.family,
                "fontweight": vars.style.tooltip.font.weight,
                // "data": tooltip_data,
                "color": d.color,
                "icon": d.icon,
                "id": "key",
                // "mouseevents": mouse,
                "offset": vars.style.key.size/2-vars.style.key.padding,
                "parent": vars.parent,
                "style": vars.style.icon,
                "title": d.name[0],
                "x": x,
                "y": y,
                "rtl": vars.style.labels.dir == "rtl",
                "width": "auto"
              })
              
            }
            
          })
          .on(d3plus.evt.out,function(d){
            d3plus.tooltip.remove("key")
          })
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)
          .call(position)
            
        keys.selectAll("rect.color").transition().duration(vars.style.timing.transitions)
          .call(style)
            
        keys.exit()
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()
            
      }
      
    }
    else {
      
      vars.g.key.selectAll("g.color")
        .transition().duration(vars.style.timing.transitions)
        .attr("opacity",0)
        .remove()
        
      var values = vars.color_scale.domain(),
          colors = vars.color_scale.range()
      
      var scale = vars.g.key.selectAll("g.scale")
        .data(["scale"])
        
      scale.enter().append("g")
        .attr("class","scale")
        .attr("opacity",0)
        
      var heatmap = vars.defs.selectAll("linearGradient#heatmap")
        .data(["heatmap"])
        
      heatmap.enter().append("linearGradient")
        .attr("id", "heatmap")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
        
      var stops = heatmap.selectAll("stop")
        .data(d3.range(0,colors.length))
        
      stops.enter().append("stop")
        .attr("stop-opacity",1)
        
      stops
        .attr("offset",function(i){
          return Math.round((i/(colors.length-1))*100)+"%"
        })
        .attr("stop-color",function(i){
          return colors[i]
        })
        
      stops.exit().remove()
  
      var gradient = scale.selectAll("rect#gradient")
        .data(["gradient"])
        
      gradient.enter().append("rect")
        .attr("id","gradient")
        .attr("x",function(d){
          if (vars.style.key.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.key.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",vars.style.key.padding)
        .attr("width", 0)
        .attr("height", vars.style.key.gradient.height)
        .attr("stroke",vars.style.key.tick.color)
        .attr("stroke-width",1)
        .style("fill", "url(#heatmap)")
        
      var text = scale.selectAll("text.tick")
        .data(d3.range(0,values.length))
        
      text.enter().append("text")
        .attr("class","tick")
        .attr("y",0)
        .attr("x",function(d){
          if (vars.style.key.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.key.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
      
      var label_width = 0
      
      text
        .order()
        .style("font-weight",vars.style.key.tick.weight)
        .attr("font-family",vars.style.key.tick.family)
        .attr("font-size",vars.style.key.tick.size)
        .attr("text-anchor",vars.style.key.tick.align)
        .attr("fill",vars.style.key.tick.color)
        .text(function(d){
          return vars.format(values[d],vars.color.key)
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.style.key.gradient.height+vars.style.key.padding*2
        })
        .each(function(d){
          var w = this.offsetWidth
          if (w > label_width) label_width = w
        })
        
      label_width += vars.style.labels.padding*2
      
      var key_width = label_width * (values.length-1)
      
      if (key_width+label_width < vars.width.value) {
        
        if (key_width+label_width < vars.width.value/2) {
          key_width = vars.width.value/2
          label_width = key_width/values.length
          key_width -= label_width
        }
        
        if (vars.style.key.align == "start") {
          var start_x = vars.style.key.padding
        }
        else if (vars.style.key.align == "end") {
          var start_x = vars.width.value - vars.style.key.padding - key_width
        }
        else {
          var start_x = vars.width.value/2 - key_width/2
        }
      
        text.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            return start_x + (label_width*d)
          })
        
        text.exit().transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()
        
        var ticks = scale.selectAll("rect.tick")
          .data(d3.range(0,values.length))
        
        ticks.enter().append("rect")
          .attr("class","tick")
          .attr("x",function(d){
            if (vars.style.key.align == "middle") {
              return vars.width.value/2
            }
            else if (vars.style.key.align == "end") {
              return vars.width.value
            }
            else {
              return 0
            }
          })
          .attr("y",vars.style.key.padding)
          .attr("width",0)
          .attr("height",vars.style.key.padding+vars.style.key.gradient.height)
          .attr("fill",vars.style.key.tick.color)
        
        ticks.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            var mod = d == 0 ? 1 : 0
            return start_x + (label_width*d) - mod
          })
          .attr("y",vars.style.key.padding)
          .attr("width",1)
          .attr("height",vars.style.key.padding+vars.style.key.gradient.height)
          .attr("fill",vars.style.key.tick.color)
        
        ticks.exit().transition().duration(vars.style.timing.transitions)
          .attr("width",0)
          .remove()
      
        gradient.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            if (vars.style.key.align == "middle") {
              return vars.width.value/2 - key_width/2
            }
            else if (vars.style.key.align == "end") {
              return vars.width.value - key_width - vars.style.key.padding
            }
            else {
              return vars.style.key.padding
            }
          })
          .attr("y",vars.style.key.padding)
          .attr("width", key_width)
          .attr("height", vars.style.key.gradient.height)
        
        scale.transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)
          
      }
      else {
        key_display = false
      }
        
    }
    
  }
  
  if (vars.key.value && vars.color.key && key_display) {
    
    var key_box = vars.g.key.node().getBBox()
    var key_height = key_box.height+key_box.y

    vars.margin.bottom += key_height+vars.style.key.padding
    
    vars.g.key.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")
      
  }
  else {

    vars.g.key.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")
      
  }
  
}
