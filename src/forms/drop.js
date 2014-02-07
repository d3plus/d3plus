//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Dropdown Menu
//------------------------------------------------------------------------------
d3plus.forms.drop = function(vars,styles,timing) {
  
  if (vars.element) {
    vars.element.on("focus."+vars.id,function(){
      vars.ui.hover(true).draw()
    })
    vars.element.on("blur."+vars.id,function(){
      var search = vars.search ? d3.event.relatedTarget != vars.container.select("input").node() : true
      if (search) {
        vars.ui.hover(false).draw()
      }
    })
    vars.element.on("change."+vars.id,function(){
      vars.ui.value(vars.data[this.selectedIndex])
    })
    vars.element.on("keydown.cancel_"+vars.id,function(){
      // Only let TAB work
      var key = d3.event.keyCode
      if (key != 9) {
        d3.event.preventDefault()
      }
    })
  }
  
  d3.select(document).on("keydown."+vars.id,function(){
    
    if (vars.enabled || vars.hover === true) {
  
      var key = d3.event.keyCode,
          options = list.select("div").selectAll("div.d3plus_node"),
          index = 0
          
      if (typeof vars.hover == "boolean") {
        options.each(function(d,i){
          if (d.value == vars.focus) {
            index = i
          }
        })
      }
      else {
        options.each(function(d,i){
          if (d.value == vars.hover) {
            index = i
          }
        })
      }
      
      // Tab
      if ([9].indexOf(key) >= 0 && (!vars.search || (vars.search && !d3.event.shiftKey))) {
        vars.ui.disable()
      }
      // Down Arrow
      else if ([40].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index >= options.size()-1) {
            index = 0
          }
          else {
            index += 1
          }
        }
        
        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }
        
        if (vars.enabled) {
          vars.ui.hover(hover).draw(60)
        }
        else {
          vars.ui.hover(hover).enable()
        }
        
      }
      // Up Arrow
      else if ([38].indexOf(key) >= 0) {
        if (vars.enabled) {
          if (index <= 0) {
            index = options.size()-1
          }
          else {
            index -= 1
          }
        }
        
        if (typeof vars.hover != "boolean") {
          var hover = options.data()[index].value
        }
        else {
          var hover = vars.focus
        }
        
        if (vars.enabled) {
          vars.ui.hover(hover).draw(60)
        }
        else {
          vars.ui.hover(hover).enable()
        }
        
      }
      // Enter/Return
      else if ([13].indexOf(key) >= 0) {
        if (typeof vars.hover != "boolean") {
          vars.ui.value(vars.hover).hover(true).draw()
        }
        else {
          vars.ui.hover(vars.focus).toggle()
        }
      }
      // Esc
      else if ([27].indexOf(key) >= 0) {
        if (vars.enabled) {
          vars.ui.hover(true).disable()
        }
        else if (vars.hover === true) {
          vars.ui.hover(false).draw()
        }
      }
      
    }
    
  })
  
  d3.select("html").on("click."+vars.id,function(){
    
    var element = d3.event.target || d3.event.toElement
    element = element.id
    var child = "_"+vars.id
        
    if (element.indexOf(child) < 0 && vars.enabled) {
      vars.ui.disable()
    }
    
  })
  
  if (styles.icon) {

    if (styles.icon.indexOf("fa-") == 0) {
      var icon = {
        "class": "d3plus_drop_icon fa "+styles.icon,
        "content": ""
      }
    }
    else {
      var icon = {
        "class": "d3plus_drop_icon",
        "content": styles.icon
      }
    }
    
  }
  else {
    var icon = false
  }
  
  var drop_width = d3plus.forms.value(styles.width,["drop","button"])
  if (!drop_width || typeof drop_width != "number") {
      
    var data = d3plus.utils.copy(styles)
    data.icon = icon
    data.display = "inline-block"
    data.border = "none"
    data.width = false
    data.margin = 0
    
    var text = d3plus.forms.value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }
    
    var button = d3plus.ui(data)
      .type("button")
      .text(text)
      .data(vars.data)
      .parent(vars.tester)
      .id(vars.id)
      .timing(0)
      .draw()
      
    var w = button.width()
    drop_width = d3.max(w)
    button.remove()
    
    if (icon) {
      drop_width += styles.padding
    }
    
  }
  
  if (typeof styles.width != "object") {
    styles.width = {}
  }
  
  styles.width.drop = drop_width
  
  drop_width -= (styles.padding*2+styles.stroke*2)
  drop_width += d3plus.scrollbar()
  
  var button_width = d3plus.forms.value(styles.width,["button","drop"])
  if (!button_width || typeof button_width != "number") {
    button_width = drop_width
  }
  
  styles.width.button = button_width
  
  button_width -= ((styles.padding*2)+(styles.stroke*2))
  button_width += d3plus.scrollbar()
  
  var style = d3plus.utils.copy(styles)
  style.icon = icon
  style.width = button_width
  style.margin = 0
  if (vars.enabled) {
    style.shadow = 0
  }
  var text = d3plus.forms.value(vars.text,["button","drop"])
  if (!text) {
   text = "text"
  }
  var data = vars.data.filter(function(d){
    return d.value == vars.focus
  })[0]
  data.id = "drop_button"
  var hover = vars.hover === true ? vars.focus : false
  var button = d3plus.ui(style)
    .type("button")
    .text(text)
    .parent(vars.container)
    .id(vars.id)
    .timing(timing)
    .hover(hover)
    .data([data])
    .enable()
    .callback(vars.ui.toggle)
    
  button
    .draw()
    
  var offset = icon.content == "&#x27A4;" ? 90 : 0
  if (vars.enabled) {
    var rotate = "rotate(-"+(180-offset)+"deg)"
  }
  else {
    var rotate = "rotate("+offset+"deg)"
  }
  
  button.select("div#d3plus_button_element_"+vars.id+"_icon")
    .data(["icon"])
    .style("transition",(timing/1000)+"s")
    .style("-webkit-transition",(timing/1000)+"s")
    .style("transform",rotate)
    .style("-ms-transform",rotate)
    .style("-webkit-transform",rotate)
    .style("opacity",function(){
      return vars.enabled ? 0.5 : 1
    })
    .style("top",function(){
      return this.parentNode.offsetHeight/2 - this.offsetHeight/2 - 2 + "px"
    })
  
  var selector = vars.container.selectAll("div.d3plus_drop_selector")
    .data(["selector"])
    
  selector.enter().append("div")
    .attr("class","d3plus_drop_selector")
    .style("position","absolute")
    .style("top","0px")
    .style("padding","0px")
    .style("z-index","-1")
    .style("border-style","solid")
    .style("overflow","hidden")
    
  var search_data = vars.search ? ["search"] : []
    
  var search = selector.selectAll("div.d3plus_drop_search")
    .data(search_data)
    
  search.enter().append("div")
    .attr("class","d3plus_drop_search")
    .attr("id","d3plus_drop_search_"+vars.id)
    .append("input")
      .attr("id","d3plus_drop_input_"+vars.id)
    
  var search_width = styles.width.drop
  search_width -= styles.padding*4
  search_width -= styles.stroke*2
  
  search.transition().duration(timing)
    .style("padding","0px "+styles.padding+"px "+styles.padding+"px")
    .style("display","block")
    .style("background-color",styles.color)
    
  search.select("input").transition().duration(timing)
    .style("padding",styles.padding+"px")
    .style("width",search_width+"px")
    .style("border-style","solid")
    .style("border-width","0px")
    .style("font-family",styles["font-family"])
    .style("font-size",styles["font-size"]+"px")
    .style("font-weight",styles["font-weight"])
    .style("text-align",styles["font-align"])
    .attr("placeholder",vars.format("Search"))
    .style("outline","none")
    
  if (vars.search && vars.enabled) {
    search.select("input").node().focus()
  }
    
  search.select("input").on("keyup."+vars.id,function(d){
    if (vars.filter != this.value) {
      vars.filter = this.value
      vars.ui.draw()
    }
  })
    
  search.exit().remove()
  
  var list = selector.selectAll("div.d3plus_drop_list")
    .data(["list"])
    
  list.enter().append("div")
    .attr("class","d3plus_drop_list")
    .attr("id","d3plus_drop_list_"+vars.id)
    .style("overflow-y","auto")
    .style("overflow-x","hidden")

  var style = d3plus.utils.copy(styles)
  style.icon = false
  style.display = "block"
  style.border = "none"
  style.width = drop_width - (styles.stroke*2)
  style.margin = 0
  var text = d3plus.forms.value(vars.text,["drop","button"])
  if (!text) {
   text = "text"
  }
  
  var data = vars.data.filter(function(d){
    var text = d3plus.utils.strip(d.text.toLowerCase()),
        search = d3plus.utils.strip(vars.filter.toLowerCase())
    return text.indexOf(search) >= 0
  })
  
  if (data.length == 0) {
    data = [
      {
        "text": vars.format("No results match")+" \""+vars.filter+"\""
      }
    ]
  }
  
  d3plus.ui(style)
    .type("button")
    .text(text)
    .data(data)
    .parent(list)
    .id(vars.id+"_option")
    .timing(timing)
    .callback(vars.ui.value)
    .highlight(vars.focus)
    .hover(vars.hover)
    .draw()
  
  var position = vars.container.node().getBoundingClientRect()
  
  var hidden = false
  if (selector.style("display") == "none") {
    var hidden = true
  }
  
  if (hidden) selector.style("display","block")
  
  var search_height = vars.search ? search[0][0].offsetHeight : 0
  if (vars.enabled) {
    var old_height = selector.style("height"),
        old_scroll = selector.property("scrollTop"),
        list_height = list.style("max-height"),
        list_scroll = list.property("scrollTop")
        
    selector.style("height","auto")
    list.style("max-height","200000px")
    
    var height = parseFloat(selector.style("height"),10)

    list
      .style("max-height",list_height)
      .property("scrollTop",list_scroll)
    selector
      .style("height",old_height)
      .property("scrollTop",old_scroll)
  }
  else {
    var height = 0
  }
  
  var max = window.innerHeight-position.top
  max -= button.height()
  max -= 10
  var scrolling = false
  if (max > vars["max-height"]) {
    max = vars["max-height"]
  }
  
  if (height > max) {
    height = max
    scrolling = true
  }
  
  if (hidden) selector.style("display","none")
  
  function scrollTopTween(scrollTop) { 
      return function() { 
          var i = d3.interpolateNumber(this.scrollTop, scrollTop); 
          return function(t) { this.scrollTop = i(t); }; 
      }; 
  } 
  
  if (scrolling) {
    
    var index = 0
    var options = list.select("div").selectAll("div.d3plus_node")
    if (typeof vars.hover == "boolean") {
      options.each(function(d,i){
        if (d.value == vars.focus) {
          index = i
        }
      })
    }
    else {
      options.each(function(d,i){
        if (d.value == vars.hover) {
          index = i
        }
      })
    }
    
    var hidden = false
    if (selector.style("display") == "none") {
      hidden = true
    }
    var option = options[0][index]
    if (hidden) selector.style("display","block")
    var button_top = option.offsetTop,
        button_height = option.offsetHeight,
        list_top = list.property("scrollTop")
        
    if (hidden) selector.style("display","none")
    var scroll = list_top
    if (button_top < list_top) {
      var scroll = button_top
    }
    else if (button_top+button_height > list_top+max-search_height) {
      var scroll = button_top - (max-button_height-search_height)
    }
    
  }
  else {
    var scroll = 0
  }
  
  selector.transition().duration(timing)
    .each("start",function(){
      d3.select(this)
        .style("display",vars.enabled ? "block" : "")
    })
    .style("left",function(){
      if (styles.align == "left") {
        return "0px"
      }
      else if (styles.align == "center") {
        return -((drop_width-button_width)/2)+"px"
      }
      else {
        return "auto"
      }
    })
    .style("right",function(){
      return styles.align == "right" ? "0px" : "auto"
    })
    .style("height",height+"px")
    .style("border-width",styles.stroke+"px")
    .style("border-color",styles.color)
    .style("box-shadow",function(){
      return vars.enabled ? "0px "+styles.shadow/2+"px "+styles.shadow+"px rgba(0,0,0,0.25)" : "0px 0px 0px rgba(0,0,0,0)"
    })
    .style("width",(drop_width+(styles.padding*2))+"px")
    .style("top",button.height()+"px")
    .style("opacity",vars.enabled ? 1 : 0)
    .each("end",function(){
      d3.select(this).transition().duration(timing)
        .style("top",button.height()+"px")
        .style("display",!vars.enabled ? "none" : "")
    })
    
  list.transition().duration(timing)
    .style("max-height",(max-search_height)+"px")
    .tween("scroll",scrollTopTween(scroll))
  
}
