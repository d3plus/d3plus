//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.info.legend = function(vars) {
  
  var key_display = true,
      square_size = 0,
      key = vars.color.key || vars.id.key
  
  if (!vars.small && vars.legend.value && key && vars.data.pool.length) {
    
    if (vars.dev.value) d3plus.console.group("Calculating Legend")
    
    if (!vars.color_scale && vars.data.keys[key] != "number") {
    
      if (vars.dev.value) d3plus.console.time("determining color groups")
    
      var color_groups = {}, placed = []
      vars.data.pool.forEach(function(d){
        if (placed.indexOf(d[vars.id.key]) < 0) {

          var color = d3plus.variable.color(vars,d[vars.id.key])
          if (!color_groups[color]) {
            color_groups[color] = []
          }
          color_groups[color].push(d)
          placed.push(d[vars.id.key])
        }
      })
    
      if (vars.dev.value) d3plus.console.timeEnd("determining color groups")

      if (vars.dev.value) d3plus.console.time("grouping colors")
      
      var colors = []
      for (color in color_groups) {
      
        var obj = {
          "color": color,
          "icon_depth": vars.id.nesting[vars.depth.value]
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
                  obj.icon_depth = vars.id.nesting[i]
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
    
      if (vars.dev.value) d3plus.console.timeEnd("grouping colors")
        
      var available_width = vars.width.value
      
      square_size = vars.style.legend.size
      
      var key_width = square_size*colors.length+vars.style.legend.padding*(colors.length+1)
      
      if (square_size instanceof Array) {
    
        if (vars.dev.value) d3plus.console.time("calculating size")
        
        for (var i = square_size[1]; i >= square_size[0]; i--) {
          key_width = i*colors.length+vars.style.legend.padding*(colors.length+1)
          if (available_width >= key_width) {
            square_size = i
            break;
          }
        }
    
        if (vars.dev.value) d3plus.console.timeEnd("calculating size")
      
      }
      else if (typeof square_size != "number" && square_size !== false) {
        square_size = 30
      }
      
      if (available_width < key_width || colors.length == 1) {
        key_display = false
      }
      else {
        
        key_width -= vars.style.legend.padding*2

        if (vars.dev.value) d3plus.console.time("sorting colors")
        
        var sort = vars.legend.order.sort.value
        
        colors.sort(function(a,b){
          
          if (vars.legend.order.value == "color") {
          
            var a_value = a.color,
                b_value = b.color

            a_value = d3.rgb(a_value).hsl()
            b_value = d3.rgb(b_value).hsl()

            if (a_value.s == 0) a_value = 361
            else a_value = a_value.h
            if (b_value.s == 0) b_value = 361
            else b_value = b_value.h
            
          }
          else if (vars.legend.order.value == "alpha") {
            
            var a_value = a.name[0],
                b_value = b.name[0]
            
          }
                
          if(a_value < b_value) return sort == "asc" ? -1 : 1;
          if(a_value > b_value) return sort == "asc" ? 1 : -1;
          
        })
    
        if (vars.dev.value) d3plus.console.timeEnd("sorting colors")
        
        if (vars.style.legend.align == "start") {
          var start_x = vars.style.legend.padding
        }
        else if (vars.style.legend.align == "end") {
          var start_x = available_width - vars.style.legend.padding - key_width
        }
        else {
          var start_x = available_width/2 - key_width/2
        }
        
        vars.g.key.selectAll("g.d3plus_scale")
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()
        
        var keys = vars.g.key.selectAll("g.d3plus_color")
          .data(colors,function(d){
            return d.url ? d.color+"_"+d.url : d.color
          })
          
        function position(group) {
          
          group
            .attr("transform",function(g,i){
              var x = start_x + (i*(vars.style.legend.padding+square_size))
              return "translate("+x+","+vars.style.legend.padding+")"
            })
          
        }
      
        var key_enter = keys.enter().append("g")
          .attr("class","d3plus_color")
          .attr("opacity",0)
          .call(position)
          
        function style(rect) {
          
          rect
            .attr("width",square_size)
            .attr("height",square_size)
            .attr("fill",function(g){
                
              d3.select(this.parentNode).selectAll("text")
                .remove()
                
              if (g.icon) {
                
                var short_url = d3plus.utils.strip(g.icon+"_"+g.color)
                
                var pattern = vars.defs.selectAll("pattern#"+short_url)
                  .data([short_url])
              
                if (typeof vars.icon.style.value == "string") {
                  var icon_style = vars.icon.style.value
                }
                else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[g.icon_depth]) {
                  var icon_style = vars.icon.style.value[g.icon_depth]
                }
                else {
                  var icon_style = "default"
                }
                
                var color = icon_style == "knockout" ? g.color : "none"
                  
                pattern.select("rect").transition().duration(vars.style.timing.transitions)
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  
                pattern.select("image").transition().duration(vars.style.timing.transitions)
                  .attr("width",square_size)
                  .attr("height",square_size)
                
                var pattern_enter = pattern.enter().append("pattern")
                  .attr("id",short_url)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  
                pattern_enter.append("rect")
                  .attr("fill",color)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  
                pattern_enter.append("image")
                  .attr("xlink:href",g.icon)
                  .attr("width",square_size)
                  .attr("height",square_size)
                  .each(function(d){

                    d3plus.utils.dataurl(g.icon,function(base64){
                  
                      pattern.select("image")
                        .attr("xlink:href",base64)
                    
                    })
                    
                  })
                    
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
                        "width": square_size-vars.style.legend.padding*2,
                        "height": square_size-vars.style.legend.padding*2,
                        "resize": true
                      })
                      
                    }
        
                  })
                  .attr("y",function(t){
                    var h = this.getBBox().height,
                        diff = parseFloat(d3.select(this).style("font-size"),10)/5
                    return square_size/2 - h/2 - diff/2
                  })
                  .selectAll("tspan")
                    .attr("x",function(t){
                      var w = this.getComputedTextLength()
                      return square_size/2 - w/2
                    })
                
                return g.color
              }
              
            })
          
        }
        
        key_enter
          .append("rect")
            .attr("class","d3plus_color")
            .call(style)
            
        keys
          .order()
          .on(d3plus.evt.over,function(d,i){

            d3.select(this).style("cursor","pointer")
            
            if (d.name) {

              d3.select(this).style("cursor","pointer")
            
              var x = start_x + (i*(vars.style.legend.padding+square_size)),
                  y = d3.transform(d3.select(this.parentNode).attr("transform")).translate[1]
                
              x += square_size/2
              y += vars.style.legend.padding+square_size/2
              
              if (typeof vars.icon.style.value == "string") {
                var icon_style = vars.icon.style.value
              }
              else if (typeof vars.icon.style.value == "object" && vars.icon.style.value[d.icon_depth]) {
                var icon_style = vars.icon.style.value[d.icon_depth]
              }
              else {
                var icon_style = "default"
              }
              
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
                "id": "legend",
                // "mouseevents": mouse,
                "offset": square_size/2-vars.style.legend.padding,
                "parent": vars.parent,
                "style": icon_style,
                "title": d.name[0],
                "x": x,
                "y": y,
                "width": "auto"
              })
              
            }
            
          })
          .on(d3plus.evt.out,function(d){
            d3plus.tooltip.remove("legend")
          })
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)
          .call(position)
            
        keys.selectAll("rect.d3plus_color").transition().duration(vars.style.timing.transitions)
          .call(style)
            
        keys.exit()
          .transition().duration(vars.style.timing.transitions)
          .attr("opacity",0)
          .remove()
            
      }
      
    }
    else if (vars.color_scale) {
    
      if (vars.dev.value) d3plus.console.time("drawing color scale")
      
      vars.g.key.selectAll("g.d3plus_color")
        .transition().duration(vars.style.timing.transitions)
        .attr("opacity",0)
        .remove()
        
      var values = vars.color_scale.domain(),
          colors = vars.color_scale.range()
          
      if (values.length <= 2) {
        values = d3plus.utils.buckets(values,6)
      }
      
      var scale = vars.g.key.selectAll("g.d3plus_scale")
        .data(["scale"])
        
      scale.enter().append("g")
        .attr("class","d3plus_scale")
        .attr("opacity",0)
        
      var heatmap = vars.defs.selectAll("#d3plus_legend_heatmap")
        .data(["heatmap"])
        
      heatmap.enter().append("linearGradient")
        .attr("id", "d3plus_legend_heatmap")
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
          if (vars.style.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",vars.style.legend.padding)
        .attr("width", 0)
        .attr("height", vars.style.legend.gradient.height)
        .attr("stroke",vars.style.legend.tick.color)
        .attr("stroke-width",1)
        .style("fill", "url(#d3plus_legend_heatmap)")
        
      var text = scale.selectAll("text.d3plus_tick")
        .data(d3.range(0,values.length))
        
      text.enter().append("text")
        .attr("class","d3plus_tick")
        .attr("x",function(d){
          if (vars.style.legend.align == "middle") {
            return vars.width.value/2
          }
          else if (vars.style.legend.align == "end") {
            return vars.width.value
          }
          else {
            return 0
          }
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.style.legend.gradient.height+vars.style.legend.padding*2
        })
      
      var label_width = 0
      
      text
        .order()
        .style("font-weight",vars.style.legend.tick.weight)
        .attr("font-family",vars.style.legend.tick.family)
        .attr("font-size",vars.style.legend.tick.size)
        .attr("text-anchor",vars.style.legend.tick.align)
        .attr("fill",vars.style.legend.tick.color)
        .text(function(d){
          return vars.format(values[d],key)
        })
        .attr("y",function(d){
          return this.getBBox().height+vars.style.legend.gradient.height+vars.style.legend.padding*2
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
        
        if (vars.style.legend.align == "start") {
          var start_x = vars.style.legend.padding
        }
        else if (vars.style.legend.align == "end") {
          var start_x = vars.width.value - vars.style.legend.padding - key_width
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
        
        var ticks = scale.selectAll("rect.d3plus_tick")
          .data(d3.range(0,values.length))
        
        ticks.enter().append("rect")
          .attr("class","d3plus_tick")
          .attr("x",function(d){
            if (vars.style.legend.align == "middle") {
              return vars.width.value/2
            }
            else if (vars.style.legend.align == "end") {
              return vars.width.value
            }
            else {
              return 0
            }
          })
          .attr("y",vars.style.legend.padding)
          .attr("width",0)
          .attr("height",vars.style.legend.padding+vars.style.legend.gradient.height)
          .attr("fill",vars.style.legend.tick.color)
        
        ticks.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            var mod = d == 0 ? 1 : 0
            return start_x + (label_width*d) - mod
          })
          .attr("y",vars.style.legend.padding)
          .attr("width",1)
          .attr("height",vars.style.legend.padding+vars.style.legend.gradient.height)
          .attr("fill",vars.style.legend.tick.color)
        
        ticks.exit().transition().duration(vars.style.timing.transitions)
          .attr("width",0)
          .remove()
      
        gradient.transition().duration(vars.style.timing.transitions)
          .attr("x",function(d){
            if (vars.style.legend.align == "middle") {
              return vars.width.value/2 - key_width/2
            }
            else if (vars.style.legend.align == "end") {
              return vars.width.value - key_width - vars.style.legend.padding
            }
            else {
              return vars.style.legend.padding
            }
          })
          .attr("y",vars.style.legend.padding)
          .attr("width", key_width)
          .attr("height", vars.style.legend.gradient.height)
        
        scale.transition().duration(vars.style.timing.transitions)
          .attr("opacity",1)
          
        if (vars.dev.value) d3plus.console.timeEnd("drawing color scale")
          
      }
      else {
        key_display = false
      }
        
    }
    else {
      key_display = false
    }
    
  }
  else {
    key_display = false
  }
  if (vars.legend.value && key && key_display) {
    
    if (vars.dev.value) d3plus.console.time("positioning legend")
    
    if (square_size) {
      var key_height = square_size
    }
    else {
      var key_box = vars.g.key.node().getBBox(),
          key_height = key_box.height+key_box.y
    }
    
    vars.margin.bottom += key_height+(vars.style.legend.padding*2)
    
    vars.g.key.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom)+")")
    
    if (vars.dev.value) d3plus.console.timeEnd("positioning legend")
      
  }
  else {
    
    if (vars.dev.value) d3plus.console.time("hiding legend")

    vars.g.key.transition().duration(vars.style.timing.transitions)
      .attr("transform","translate(0,"+vars.height.value+")")
    
    if (vars.dev.value) d3plus.console.timeEnd("hiding legend")
      
  }
  
  if (vars.legend.value && key && vars.dev.value) {
    d3plus.console.groupEnd()
  }
  
}
