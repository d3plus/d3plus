//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.forms.button = function(vars,styles,timing) {
  
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
                      
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set font-color based on color, if it hasn't been specified
    //--------------------------------------------------------------------------
    var font_color = d3plus.color.text(styles.color)
    
    elem
      .style("color",function(d,i){
        
        var background = background_color(d)
        
        return d3plus.color.text(background)
        
      })
      .style("background-color",function(d,i){
        
        var background = background_color(d)
        
        styles.border_color = vars.highlight == d.value ? background : font_color
        
        return background_color(d)
        
      })
      .style("border-color",styles.secondary)
    
  }
  
  var style = function(elem) {
  
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
    
    elem
      .style("position","relative")
      .style("padding",padding)
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      // .style("box-shadow",function(d){
      //   return vars.highlight == d.value ? "0px "+styles.shadow/2+"px "+styles.shadow+"px rgba(0,0,0,0.25)" : "0px 0px 0px rgba(0,0,0,0)"
      // })
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
          .style("display","inline-block")
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
          .each(function(c){
            
            if (c != "text") {
              buffers[c] = this.offsetWidth
            }
            else if (d3.max(d3.map(buffers).values()) > 0) {
              var width = styles.width
              if (typeof width == "number") {

                if (styles["font-align"] == "center") {
                  width -= d3.max(d3.map(buffers).values())*2
                  width -= styles.padding*2
                }
                else {
                  d3.map(buffers).values().forEach(function(v){
                    width -= v
                    width -= styles.padding
                  })
                }
                
                if (width >= 0) {
                  width += "px"
                }
                else {
                  width = "0px"
                }
                
                var padding = "0px"
                
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
          })
    
        items.exit().remove()
        
      })
      
  }
  
  var button = vars.container.selectAll("div.d3plus_node")
    .data(vars.data,function(d){
      return d.id || d.value
    })
    
  button.enter().append("div")
    .attr("id","d3plus_button_"+vars.id)
    .attr("class","d3plus_node")
    .call(color)
    .call(style)
    
  button
    .order()
    .on(d3plus.evt.over,function(d,i){
        
      vars.hover = d.value
  
      if (vars.data.length == 1 || d.value != vars.highlight) {

        button
          .style("cursor","pointer")
          .transition().duration(100)
          .call(color)
          
      }
      
    })
    .on(d3plus.evt.out,function(d){
    
      vars.hover = false
    
      button
        .style("cursor","auto")
        .transition().duration(100)
        .call(color)
      
    })
    .on("click",function(d){
      
      if (!vars.propagation) {
        d3.event.stopPropagation()
      }
      
      if (vars.callback && d.value) {
      
        vars.callback(d)
      
      }
    
    })
    .transition().duration(vars.timing)
      .call(color)
      .call(style)
      
  button.exit().remove()
  
}
