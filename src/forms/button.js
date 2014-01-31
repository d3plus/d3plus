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
    
    if (vars.enabled) {
      if (vars.hover) {
        var background = d3plus.color.lighter(styles.color,.1)
      }
      else {
        var background = styles.color
      }
    }
    else {
      if (vars.hover) {
        var background = d3plus.color.darker(font_color,.05)
      }
      else {
        var background = font_color
      }
    }
    
    if (vars.enabled) {
      var font_color = font_color
    }
    else if (vars.highlight) {
      var font_color = styles.color
    }
    else {
      var font_color = d3plus.color.text(font_color)
    }
    
    var border_color = vars.enabled ? background : font_color
    
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
      .style("border-style","solid")
      .style("border-color",border_color)
      .style("border-width",border_width)
      .style("padding",padding)
      .style("margin",styles.margin+"px")
      .style("display",styles.display)
      .style("color",font_color)
      .style("background-color",background)
      .style("font-family",styles["font-family"])
      .style("font-size",styles["font-size"]+"px")
      .style("font-weight",styles["font-weight"])
      .style("letter-spacing",styles["letter-spacing"])
      .style("width",function(c){
        if (typeof styles.width == "object" && "button" in styles.width) {
          return styles.width.button+"px"
        }
        return typeof styles.width == "number" ? styles.width+"px" : "auto"
      })
      .each(function(){
        
        var children = []
        if (styles.image) {
          children.push("image")
        }
        if (styles.text) {
          children.push("text")
        }
        if (styles.icon) {
          children.push("icon")
        }
        
        var items = d3.select(this).selectAll("div.d3plus_button_element")
          .data(children,function(c,i){
            return c
          })
    
        items.enter().append("div")
          .style("display","inline-block")
          .attr("id",function(c){
            return "d3plus_button_"+vars.id+"_"+c
          })
          .attr("class",function(c){
            var extra = ""
            if (styles[c] && typeof styles[c] == "object" && styles[c].class) {
              extra = " "+styles[c].class
            }
            return "d3plus_button_element" + extra
          })
      
        items.order()
          .text(function(c){
            if (c == "text") {
              return styles[vars.text]
            }
            else if (c == "icon") {
              return styles.icon.content
            }
            else {
              return ""
            }
          })
          .style("margin",function(c,i) {
            if (i == 0) return "0px";
            return "0px "+styles.padding+"px"
          })
          .style("float",function(c){
            if (d3plus.rtl) {
              return c == "icon" ? "left" : "none"
            }
            else {
              return c == "icon" ? "right" : "none"
            }
          })
    
        items.exit().remove()
        
      })
      
  }
  
  var button = vars.parent.selectAll("div#d3plus_button_"+vars.id)
    .data(["button"])
    
  button.enter().append("div")
    .attr("id","d3plus_button_"+vars.id)
    .call(style)
    
  button
    .on(d3plus.evt.over,function(){
    
      vars.hover = true
    
      d3.select(this).style("cursor","pointer")
        .transition().duration(60)
        .call(style)
      
    })
    .on(d3plus.evt.out,function(){
    
      vars.hover = false
    
      d3.select(this).style("cursor","auto")
        .transition().duration(60)
        .call(style)
      
    })
    .on(d3plus.evt.click,function(){
      
      if (!vars.propagation) {
        d3.event.stopPropagation()
      }
      
      if (vars.callback) {
      
        vars.callback({
          "image": styles.image,
          "text": styles.text,
          "value": styles.value
        })
      
      }
    
    })
    .transition().duration(vars.timing)
      .call(style)
  
}
