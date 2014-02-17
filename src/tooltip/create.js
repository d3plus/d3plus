//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------
d3plus.tooltip.create = function(params) {
  
  var default_width = params.fullscreen ? 250 : 200
  params.width = params.width || default_width
  params.max_width = params.max_width || 386
  params.id = params.id || "default"
  params.size = params.fullscreen || params.html ? "large" : "small"
  params.offset = params.offset || 0
  params.arrow_offset = params.arrow ? 8 : 0
  params.x = params.x || 0
  params.y = params.y || 0
  params.color = params.color || "#333"
  params.parent = params.parent || d3.select("body")
  params.curtain = params.curtain || "#fff"
  params.curtainopacity = params.curtainopacity || 0.8
  params.background = params.background || "#fff"
  params.fontcolor = params.fontcolor || "#333"
  params.fontfamily = params.fontfamily || "sans-serif"
  params.fontweight = params.fontweight || "normal"
  params.fontsize = params.fontsize || "12px"
  params.style = params.style || "default"
  params.zindex = params.size == "small" ? 2000 : 500
  if (!params.iconsize) {
    params.iconsize = params.size == "small" ? 22 : 50
  }
  
  params.limit = [
    parseFloat(params.parent.style("width"),10),
    parseFloat(params.parent.style("height"),10)
  ]
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function that closes ALL Descriptions
  //-------------------------------------------------------------------
  var close_descriptions = function() {
    d3.selectAll("div.d3plus_tooltip_data_desc").style("height","0px")
    d3.selectAll("div.d3plus_tooltip_data_help").style("background-color","#ccc")
  }
  
  d3plus.tooltip.remove(params.id)
  
  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = params.parent ? params.parent.node().offsetWidth/2 : window.innerWidth/2
    params.y = params.parent ? params.parent.node().offsetHeight/2 : window.innerHeight/2
  }
  else if (params.align) {
    var a = params.align.split(" ")
    params.anchor.y = a[0]
    if (a[1]) params.anchor.x = a[1]
    else params.anchor.x = "center"
  }
  else {
    params.anchor.x = "center"
    params.anchor.y = "top"
  }
  
  var title_width = params.width - 30
  
  if (params.fullscreen) {
    var curtain = params.parent.append("div")
      .attr("id","d3plus_tooltip_curtain_"+params.id)
      .attr("class","d3plus_tooltip_curtain")
      .style("background-color",params.curtain)
      .style("opacity",params.curtainopacity)
      .style("position","absolute")
      .style("z-index",499)
      .style("top","0px")
      .style("right","0px")
      .style("bottom","0px")
      .style("left","0px")
      .on(d3plus.evt.click,function(){
        d3plus.tooltip.remove(params.id)
      })
  }
  
  var tooltip = params.parent.append("div")
    .datum(params)
    .attr("id","d3plus_tooltip_id_"+params.id)
    .attr("class","d3plus_tooltip d3plus_tooltip_"+params.size)
    .style("color",params.fontcolor)
    .style("font-family",params.fontfamily)
    .style("font-weight",params.fontweight)
    .style("font-size",params.fontsize)
    .style("position","absolute")
    .style("z-index",params.zindex)
    .on(d3plus.evt.out,function(){
      close_descriptions()
    })
    
  if (params.max_height) {
    tooltip.style("max-height",params.max_height+"px")
  }
    
  if (params.fixed) {
    tooltip.style("z-index",500)
    params.mouseevents = true
  }
  else {
    tooltip.style("z-index",2000)
  }
  
  var container = tooltip.append("div")
    .datum(params)
    .attr("class","d3plus_tooltip_container")
    .style("background-color",params.background)
  
  if (params.fullscreen && params.html) {
    
    w = params.parent ? params.parent.node().offsetWidth*0.75 : window.innerWidth*0.75
    h = params.parent ? params.parent.node().offsetHeight*0.75 : window.innerHeight*0.75
    
    container
      .style("width",w+"px")
      .style("height",h+"px")
      
    var body = container.append("div")
      .attr("class","d3plus_tooltip_body")
      .style("display","inline-block")
      .style("z-index",1)
      .style("width",params.width+"px")
      
  }
  else {
    
    if (params.width == "auto") {
      var w = "auto"
      container.style("max-width",params.max_width+"px")
    }
    else var w = params.width-14+"px"

    var body = container
      .style("width",w)
      
  }
    
  if (params.title || params.icon) {
    var header = body.append("div")
      .attr("class","d3plus_tooltip_header")
      .style("position","relative")
      .style("z-index",1)
  }
  
  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","d3plus_tooltip_close")
      .style("background-color",params.color)
      .style("color",d3plus.color.text(params.color))
      .style("position","absolute")
      .html("\&times;")
      .on(d3plus.evt.click,function(){
        d3plus.tooltip.remove(params.id)
      })
  }
  
  if (!params.mouseevents) {
    tooltip.style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {
    
    var oldout = d3.select(params.mouseevents).on(d3plus.evt.out)
    
    var newout = function() {
      
      var target = d3.event.toElement || d3.event.relatedTarget
      if (target) {
        var c = typeof target.className == "string" ? target.className : target.className.baseVal
        var istooltip = c.indexOf("d3plus_tooltip") == 0
      }
      else {
        var istooltip = false
      }
      if (!target || (!ischild(tooltip.node(),target) && !ischild(params.mouseevents,target) && !istooltip)) {
        oldout(d3.select(params.mouseevents).datum())
        close_descriptions()
        d3.select(params.mouseevents).on(d3plus.evt.out,oldout)
      }
    }
    
    var ischild = function(parent, child) {
       var node = child.parentNode;
       while (node != null) {
         if (node == parent) {
           return true;
         }
         node = node.parentNode;
       }
       return false;
    }
    
    d3.select(params.mouseevents).on(d3plus.evt.out,newout)
    tooltip.on(d3plus.evt.out,newout)
    
    var move_event = d3.select(params.mouseevents).on(d3plus.evt.move)
    if (move_event) {
      tooltip.on(d3plus.evt.move,move_event)
    }
    
  }
    
  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","d3plus_tooltip_arrow")
      .style("background-color",params.background)
      .style("position","absolute")
  }
  
  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","d3plus_tooltip_icon")
      .style("width",params.iconsize+"px")
      .style("height",params.iconsize+"px")
      .style("z-index",1)
      .style("background-position","50%")
      .style("background-size","100%")
      .style("background-image","url("+params.icon+")")
      .style("display","inline-block")
      
    if (params.style == "knockout") {
      title_icon.style("background-color",params.color)
    }
    
    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var title = header.append("div")
      .attr("class","d3plus_tooltip_title")
      .style("vertical-align","top")
      .style("width",title_width+"px")
      .style("display","inline-block")
      .style("z-index",1)
      .text(params.title)
  }
  
  if (params.description) {
    var description = body.append("div")
      .attr("class","d3plus_tooltip_description")
      .text(params.description)
  }
  
  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","d3plus_tooltip_data_container")
  }
  
  if (params.data) {
      
    var val_width = 0, val_heights = {}
      
    var last_group = null
    params.data.forEach(function(d,i){
      
      if (d.group) {
        if (last_group != d.group) {
          last_group = d.group
          data_container.append("div")
            .attr("class","d3plus_tooltip_data_title")
            .text(d.group)
        }
      }
      
      var block = data_container.append("div")
        .attr("class","d3plus_tooltip_data_block")
        .datum(d)
        
      if (d.highlight) {
        block.style("color",d3plus.color.legible(params.color))
      }
      
      var name = block.append("div")
          .attr("class","d3plus_tooltip_data_name")
          .html(d.name)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
      
      var val = block.append("div")
          .attr("class","d3plus_tooltip_data_value")
          .text(d.value)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
      if (d3plus.rtl) {
        val.style("left","6px")
      }
      else {
        val.style("right","6px")
      }
          
      if (params.mouseevents && d.desc) {
        var desc = block.append("div")
          .attr("class","d3plus_tooltip_data_desc")
          .text(d.desc)
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
        var dh = desc.node().offsetHeight
        
        desc.style("height","0px")
          
        var help = name.append("div")
          .attr("class","d3plus_tooltip_data_help")
          .text("?")
          .on(d3plus.evt.over,function(){
            var c = d3.select(this.parentNode.parentNode).style("color")
            d3.select(this).style("background-color",c)
            desc.style("height",dh+"px")
          })
          .on(d3plus.evt.out,function(){
            d3.event.stopPropagation()
          })
          
        name
          .style("cursor","pointer")
          .on(d3plus.evt.over,function(){
            close_descriptions()
            var c = d3.select(this.parentNode).style("color")
            help.style("background-color",c)
            desc.style("height",dh+"px")
          })
          
        block.on(d3plus.evt.out,function(){
          d3.event.stopPropagation()
          close_descriptions()
        })
      }
          
      var w = parseFloat(val.style("width"),10)
      if (w > params.width/2) w = params.width/2
      if (w > val_width) val_width = w
          
      if (i != params.data.length-1) {
        if ((d.group && d.group == params.data[i+1].group) || !d.group && !params.data[i+1].group)
        data_container.append("div")
          .attr("class","d3plus_tooltip_data_seperator")
      }
          
    })
    
    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("width",function(){
        var w = parseFloat(d3.select(this.parentNode).style("width"),10)
        return (w-val_width-30)+"px"
      })
    
    data_container.selectAll(".d3plus_tooltip_data_value")
      .style("width",val_width+"px")
      .each(function(d){
        var h = parseFloat(d3.select(this).style("height"),10)
        val_heights[d.name] = h
      })
    
    data_container.selectAll(".d3plus_tooltip_data_name")
      .style("min-height",function(d){
        return val_heights[d.name]+"px"
      })
    
  }
    
  if (params.html && !params.fullscreen) {
    data_container.append("div")
      .html(params.html)
  }
  
  var footer = body.append("div")
    .attr("class","d3plus_tooltip_footer")
  
  if (params.footer) {
    footer.html(params.footer)
  }
  
  params.height = tooltip.node().offsetHeight
  
  if (params.html && params.fullscreen) {
    var h = params.height-12
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","d3plus_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .html(params.html)
  }
  
  params.width = tooltip.node().offsetWidth
  
  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset
  
  if (params.data || (!params.fullscreen && params.html)) {
    
    if (!params.fullscreen && params.html) {
      var parent_height = params.parent.node().offsetHeight
      var limit = params.fixed ? parent_height-params.y-10 : parent_height-10
      var h = params.height < limit ? params.height : limit
    }
    else {
      var h = params.height
    }
    h -= parseFloat(container.style("padding-top"),10)
    h -= parseFloat(container.style("padding-bottom"),10)
    if (header) {
      h -= header.node().offsetHeight
      h -= parseFloat(header.style("padding-top"),10)
      h -= parseFloat(header.style("padding-bottom"),10)
    }
    if (footer) {
      h -= footer.node().offsetHeight
      h -= parseFloat(footer.style("padding-top"),10)
      h -= parseFloat(footer.style("padding-bottom"),10)
    }
    data_container
      .style("max-height",h+"px")
  }
  
  params.height = tooltip.node().offsetHeight
  
  d3plus.tooltip.move(params.x,params.y,params.id);
    
}
