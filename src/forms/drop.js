//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Dropdown Menu
//------------------------------------------------------------------------------
d3plus.forms.drop = function(vars,styles,timing) {
  
  d3.select("html").on(d3plus.evt.click+"."+vars.id,function(){
    var element = d3.event.toElement.id,
        id = "d3plus_button_"+vars.id,
        child = id+"_"
        
    if (element != id && element.indexOf(child) < 0) {
      vars.ui.disable()
    }
    
  })
  
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
  
  function check_value(obj,arr) {
    
    if (typeof obj == "object" && arr) {
      var ret = false
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] in obj) {
          ret = obj[arr[i]]
          break;
        }
      }
      if (ret) {
        return ret
      }
    }
    else if (typeof obj != "object") {
      return obj
    }
    else {
      return false
    }
    
  }
  
  var drop_width = check_value(styles.width,["drop","button"])
  if (!drop_width || typeof drop_width != "number") {
    
    drop_width = 0
    
    vars.data.forEach(function(o,i){
      var data = d3plus.utils.merge(styles,o)
      data.icon = icon
      data.display = "inline-block"
      data.border = "none"
      data.width = false
      data.margin = 0
      var text = check_value(vars.text,["drop","button"])
      if (!text) {
       text = "text"
      }
      var button = d3plus.ui(data)
        .type("button")
        .text(text)
        .parent(vars.tester)
        .id("tester"+i)
        .timing(0)
        .draw()
      var w = button.width()
      if (w > drop_width) drop_width = w
      button.remove()
    })
    
    drop_width += d3plus.scrollbar()
    
  }
  
  var button_width = check_value(styles.width,["button","drop"])
  if (!button_width || typeof button_width != "number") {
    button_width = drop_width
  }
  
  var data = d3plus.utils.merge(styles,vars.focus)
  data.icon = icon
  data.width = button_width
  data.margin = 0
  var text = check_value(vars.text,["button","drop"])
  if (!text) {
   text = "text"
  }
  var button = d3plus.ui(data)
    .type("button")
    .text(text)
    .parent(vars.container)
    .id(vars.id)
    .timing(timing)
    .callback(vars.ui.toggle)
    .enable()
    .draw()
    
  var opposite = styles.icon.content == "^"
  if (vars.enabled != opposite) {
    var rotate = "rotate(-180deg)"
  }
  else {
    var rotate = "rotate(0deg)"
  }
  button.select("div#d3plus_button_"+vars.id+"_icon")
    .data(["icon"])
    .style("transition",(timing/1000)+"s")
    .style("-webkit-transition",(timing/1000)+"s")
    .style("transform",rotate)
    .style("-ms-transform",rotate)
    .style("-webkit-transform",rotate)
    .style("opacity",function(){
      return vars.enabled ? 0.5 : 1
    })
  
  var selector = vars.container.selectAll("div.d3plus_drop_selector")
    .data(["selector"])
    
  selector.enter().append("div")
    .attr("class","d3plus_drop_selector")
    .style("position","absolute")
    .style("overflow-y","auto")
    .style("overflow-x","hidden")
    .style("top","0px")
    .style("z-index","-1")
    .style("border-style","solid")
    
  vars.data.forEach(function(o,i){

    var data = d3plus.utils.merge(styles,o)
    data.icon = false
    data.display = "block"
    data.border = "none"
    data.width = drop_width - (styles.stroke*2)
    data.margin = 0
    var text = check_value(vars.text,["drop","button"])
    if (!text) {
     text = "text"
    }
    var option = d3plus.ui(data)
      .type("button")
      .text(text)
      .parent(selector)
      .id(vars.id+"_option"+i)
      .timing(timing)
      .callback(vars.ui.value)
      
    if (o.value == vars.focus.value) {
      option.highlight(true)
    }
      
    option.draw()
      
  })
  
  var position = vars.container.node().getBoundingClientRect()
  
  if (d3plus.scrollbar() == 0) {
    selector.classed("d3plus_noscrollbar",true)
  }
  
  var top_offset = vars.enabled ? 1 : 2
  

  var max = window.innerHeight-position.top
  max -= vars.enabled ? button.height() : 0
  max -= 10
  max = max < vars["max-height"] ? max : vars["max-height"]
  
  var height = vars.enabled ? button.height()*vars.data.length : 0
  height = max < height ? max : height
    
  selector.transition().duration(timing)
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
    .style("width",(drop_width+(styles.padding*2))+"px")
    .style("top",(button.height()-top_offset)+"px")
    .each("end",function(){
      d3.select(this).transition().duration(timing)
        .style("top",(button.height()-top_offset)+"px")
    })
  
}
