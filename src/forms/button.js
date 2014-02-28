//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.forms.button = function(vars,styles,timing) {
  
  if (vars.dev) d3plus.console.time("calculating borders and padding")
  if (styles.border == "all") {
    var border_width = styles.stroke+"px",
        padding = styles.padding+"px"
  }
  else {
    var sides = ["top","right","bottom","left"]
    var border_width = "", padding = ""
    sides.forEach(function(s,i){
      if (styles.border.indexOf(s) >= 0) {
        border_width += styles.stroke+"px"
        padding += styles.padding+"px"
      }
      else {
        border_width += "0px"
        padding += (styles.padding+styles.stroke)+"px"
      }
      if (i < sides.length-1) {
        border_width += " "
        padding += " "
      }
    })
  }
  
  var reversed = (styles["font-align"] == "right" && !d3plus.rtl) || (d3plus.rtl && styles["font-align"] == "right")
  if (vars.dev) d3plus.console.timeEnd("calculating borders and padding")
  
  var background_color = function(d) {

    if (vars.highlight != d.value) {
      if (vars.hover == d.value) {
        if (vars.highlight) {
          var background = d3plus.color.lighter(styles.secondary,.025)
        }
        else {
          var background = d3plus.color.lighter(styles.secondary,.1)
        }
      }
      else {
        var background = styles.secondary
      }
    }
    else {
      if (vars.hover == d.value && vars.enabled) {
        var background = d3plus.color.darker(styles.color,.025)
      }
      else {
        var background = styles.color
      }
    }
    
    return background
    
  }
  
  var color = function(elem) {
    
    elem
      .each(function(d){
        d.bg = background_color(d)
      })
      .style("color",function(d){
        
        var text_color = d3plus.color.text(d.bg)
        
        if (text_color != "#fff" && vars.selected == d.value && d.color && !d.image) {
          return d3plus.color.legible(d.color)
        }
        
        return text_color
        
      })
      .style("background-color",function(d){
        
        return d.bg
        
      })
      .style("border-color",styles.secondary)
    
  }
  
  var style = function(elem) {
    
    elem
      .style("position","relative")
      .style("padding",padding)
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      .style("opacity",function(d){
        if ([vars.selected,vars.highlight].indexOf(d.value) < 0) {
          return 0.75
        }
        return 1
      })
      .style("border-style","solid")
      .style("border-width",border_width)
      .style("font-family",styles["font-family"])
      .style("font-size",styles["font-size"]+"px")
      .style("font-weight",styles["font-weight"])
      .style("text-align",styles["font-align"])
      .style("width",function(){
        if (typeof styles.width == "object" && "button" in styles.width) {
          return styles.width.button+"px"
        }
        return typeof styles.width == "number" ? styles.width+"px" : "auto"
      })
      .each(function(d,i){
        
        var children = []
        
        if (d.image) {
          children.push("image")
        }
        
        if (styles.icon) {
          d.icon = d3plus.utils.copy(styles.icon)
          children.push("icon")
        }
        else if (d.value === vars.selected) {
          if (d3plus.fontawesome) {
            d.icon = {
              "class": "fa fa-check",
              "content": ""
            }
          }
          else {
            d.icon = {
              "class": "",
              "content": "&#x2713;"
            }
          }
          children.push("icon")
        }
        
        if (d.text) {
          children.push("text")
        }
        
        var items = d3.select(this).selectAll("div.d3plus_button_element")
          .data(children,function(c,i){
            return c
          })
    
        items.enter().append("div")
          .style("display","block")
          .attr("id",function(c){
            return "d3plus_button_element_"+vars.id+"_"+c
          })
          .attr("class",function(c){
            var extra = ""
            if (c == "icon" && d.icon.class) {
              extra = " "+d[c].class
            }
            return "d3plus_button_element" + extra
          })
          
        var buffers = {
          "icon": 0,
          "image": 0
        }
      
        items.order()
          .html(function(c){
            if (c == "text") {
              return d[vars.text]
            }
            else if (c == "icon") {
              return d.icon.content
            }
            else {
              return ""
            }
          })
          .style("background-image",function(c){
            if (c == "image") {
              return "url('"+d.image+"')"
            }
            return "none"
          })
          .style("background-color",function(c){
            if (c == "image" && d.style == "knockout") {
              return d.color || vars.color
            }
            return "transparent"
          })
          .style("background-size","100%")
          .style("letter-spacing",function(c){
            return c != "text" ? "0px" : styles["font-spacing"]+"px"
          })
          .style("position",function(c){
            return c == "text" ? "static" : "absolute"
          })
          .style("left",function(c){
            if ((c == "image" && !reversed) || (c == "icon" && reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })
          .style("right",function(c){
            if ((c == "image" && reversed) || (c == "icon" && !reversed)) {
              return styles.padding+"px"
            }
            return "auto"
          })
          .style("width",function(c){
            if (c == "image") {
              var s = styles.height || this.parentNode.offsetHeight
              return (s-(styles.padding*2)-(styles.stroke*2))+"px"
            }
            return "auto"
          })
          .style("height",function(c){
            if (c == "image") {
              var s = styles.height || this.parentNode.offsetHeight
              return (s-(styles.padding*2)-(styles.stroke*2))+"px"
            }
            return "auto"
          })
          .each(function(c){
            
            if (c != "text") {
              if (c == "image") {
                buffers[c] = parseFloat(d3.select(this).style("width"),10)
              }
              else {
                buffers[c] = this.offsetWidth
              }
            }
            else if (d3.max(d3.map(buffers).values()) > 0) {
              
              var width = styles.width
              
              if (typeof width == "number") {

                if (styles["font-align"] == "center") {
                  width -= d3.max(d3.map(buffers).values())*2
                  width -= styles.padding*2
                  
                  var padding = "0px"
                  
                }
                else {
                  
                  d3.map(buffers).values().forEach(function(v){
                    width -= v
                    width -= styles.padding
                  })
                  
                  if ((buffers.image && !reversed) || (buffers.icon && reversed)) {
                    var padding = "0px "+ (d3.max(d3.map(buffers).values())+styles.padding)+"px"
                  }
                  else {
                    var padding = "0px"
                  }
                  
                }
                
                if (width >= 0) {
                  width += "px"
                }
                else {
                  width = "0px"
                }
                
              } 
              else {
                
                width = "auto"
                var buffer = d3.max(d3.map(buffers).values())+styles.padding
                
                if (styles["font-align"] == "center") {
                  var padding = "0px "+buffer+"px"
                }
                else {
                  var padding = "0px"
                
                  if ((buffers.icon && !reversed) || (buffers.image && reversed)) {
                    padding += " "+buffer+"px"
                  }
                  else {
                    padding += " 0px"
                  }
                  padding += " 0px"
                  if ((buffers.icon && reversed) || (buffers.image && !reversed)) {
                    padding += " "+buffer+"px"
                  }
                  else {
                    padding += " 0px"
                  }
                
                }
              }
              d3.select(this)
                .style("width",width+"px")
                .style("padding",padding)
            }
            else {
              d3.select(this)
                .style("width","auto")
                .style("padding","0px")
            }
          })
    
        items.exit().remove()
        
      })
      
  }
  
  var button = vars.container.selectAll("div.d3plus_node")
    .data(vars.data.array,function(d){
      return d.id || d.value
    })
    
  if (vars.dev) d3plus.console.time("update")
  button.transition().duration(vars.timing)
    .call(color)
    .call(style)
  if (vars.dev) d3plus.console.timeEnd("update")
    
  if (vars.dev) d3plus.console.time("enter")
  button.enter().append("div")
    .attr("id","d3plus_button_"+vars.id)
    .attr("class","d3plus_node")
    .call(color)
    .call(style)
  if (vars.dev) d3plus.console.timeEnd("enter")
    
  if (vars.dev) d3plus.console.time("events")
  button
    .order()
    .on(d3plus.evt.over,function(d,i){
        
      vars.hover = d.value
  
      if (vars.data.array.length == 1 || d.value != vars.highlight) {

        d3.select(this).style("cursor","pointer")
          .transition().duration(100)
          .call(color)
          
      }
      
    })
    .on(d3plus.evt.out,function(d){
    
      vars.hover = false
  
      if (vars.data.array.length == 1 || d.value != vars.highlight) {

        d3.select(this).style("cursor","auto")
          .transition().duration(100)
          .call(color)
          
      }
      
    })
    .on("click",function(d){
      
      if (!vars.propagation) {
        d3.event.stopPropagation()
      }
      
      if (vars.callback && d.value) {
      
        vars.callback(d)
      
      }
    
    })
  if (vars.dev) d3plus.console.timeEnd("events")
      
  button.exit().remove()
  
}
