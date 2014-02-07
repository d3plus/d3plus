//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a Button
//------------------------------------------------------------------------------
d3plus.forms.button = function(vars,styles,timing) {
  
  var style = function(elem) {
                      
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set font-color based on color, if it hasn't been specified
    //--------------------------------------------------------------------------
    if (!vars["font-color"]) {
      var font_color = d3plus.color.text(styles.color)
    }
    else {
      var font_color = styles["font-color"]
    }
  
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
    
    elem
      .style("position","relative")
      .style("padding",padding)
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      .style("box-shadow",function(){
        return vars.enabled ? "0px "+styles.shadow/2+"px "+styles.shadow+"px rgba(0,0,0,0.25)" : "0px 0px 0px rgba(0,0,0,0)"
      })
      .style("color",function(d,i){
        
        if (vars.enabled) {
          return font_color
        }
        else if (vars.highlight == d.value) {
          return styles.color
        }
        else {
          return d3plus.color.text(font_color)
        }
        
      })
      .style("background-color",function(d,i){
        
        if (vars.enabled) {
          if (vars.hover == d.value) {
            var background = d3plus.color.lighter(styles.color,.1)
          }
          else {
            var background = styles.color
          }
        }
        else {
          if (vars.hover == d.value) {
            var background = d3plus.color.darker(font_color,.05)
          }
          else {
            var background = font_color
          }
        }
        
        styles.border_color = vars.enabled ? background : font_color
        
        return background
        
      })
      .style("border-style","solid")
      .style("border-color",styles.border_color)
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
        else if (d.value === vars.highlight) {
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
            if ((c == "image" && !d3plus.rtl) || (c == "icon" && d3plus.rtl)) {
              return styles.padding+"px"
            }
            return "auto"
          })
          .style("right",function(c){
            if ((c == "image" && d3plus.rtl) || (c == "icon" && !d3plus.rtl)) {
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
              d3.select(this)
                .style("width",width+"px")
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
    .call(style)
    
  button
    .order()
    .on(d3plus.evt.over,function(d,i){
        
      vars.hover = d.value
  
      button.style("cursor","pointer")
        .transition().duration(60)
        .call(style)
      
    })
    .on(d3plus.evt.out,function(d){
    
      vars.hover = false
    
      button.style("cursor","auto")
        .transition().duration(60)
        .call(style)
      
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
      .call(style)
      
  button.exit().remove()
  
}
