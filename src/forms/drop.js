//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates Dropdown Menu
//------------------------------------------------------------------------------
d3plus.forms.drop = function(vars,styles,timing) {
  
  if (styles.arrow.indexOf("fa-") == 0) {
    var arrow = {
      "class": "d3plus_drop_arrow fa "+styles.arrow,
      "content": ""
    }
  }
  else {
    var arrow = {
      "class": "d3plus_drop_arrow",
      "content": styles.arrow
    }
  }
    
  var new_width = 0
  vars.data.forEach(function(o,i){
    var data = d3plus.utils.merge(styles,o)
    data.arrow = arrow
    data.display = "inline-block"
    data.border = "none"
    var button = d3plus.ui(data)
      .type("button")
      .parent(vars.tester)
      .id("tester"+i)
      .timing(0)
      .draw()
    var w = button.width()
    if (w > new_width) new_width = w
    button.remove()
  })
  
  styles.width = new_width + d3plus.scrollbar
  
  var data = d3plus.utils.merge(styles,vars.focus)
  data.arrow = arrow
  var button = d3plus.ui(data)
    .type("button")
    .parent(vars.container)
    .id(vars.id)
    .timing(timing)
    .callback(vars.ui.toggle)
    .enable()
    .draw()
    
  var opposite = styles.arrow.content == "^"
  if (vars.enabled != opposite) {
    var rotate = "rotate(-180deg)"
  }
  else {
    var rotate = "rotate(0deg)"
  }
  button.select("div#d3plus_button_"+vars.id+"_arrow")
    .data(["arrow"])
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
    .style("overflow","scroll")
    .style("left","0px")
    .style("top","0px")
    .style("z-index","-1")
    .style("border-style","solid")
    
  vars.data.forEach(function(o,i){

    var data = d3plus.utils.merge(styles,o)
    data.arrow = false
    data.display = "block"
    data.border = "none"
    d3plus.ui(data)
      .type("button")
      .parent(selector)
      .id(vars.id+"_option"+i)
      .timing(timing)
      .callback(vars.ui.value)
      .draw()
      
  })
  
  var position = vars.container.node().getBoundingClientRect()
    
  selector.transition().duration(timing)
    .each("start",function(){
      if (vars.enabled) {
        d3.select(this).style("display","block")
      }
    })
    .style("border-width","0px "+styles.stroke+"px "+styles.stroke+"px "+styles.stroke+"px")
    .style("width",(styles.width+(styles.padding*2))+"px")
    .style("max-height",function(){
      var max = window.innerHeight-position.top
      max -= vars.enabled ? button.height() : 0
      max -= styles.padding
      return max < vars["max-height"] ? max+"px" : vars["max-height"]+"px"
    })
    .style("top",function(){
      return vars.enabled ? button.height()+"px" : "0px"
    })
    .style("opacity",function(){
      return vars.enabled ? 1 : 0
    })
    .each("end",function(){
      if (!vars.enabled) {
        d3.select(this).style("display","none")
      }
      else {
        d3.select(this).transition().duration(timing)
          .style("top",function(){
            return vars.enabled ? button.height()+"px" : "0px"
          })
      }
    })
  
}
