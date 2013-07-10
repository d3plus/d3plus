//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create a Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.create = function(params) {
  
  params.width = params.width ? params.width : 200
  params.max_width = params.max_width ? params.max_width : 386
  params.id = params.id ? params.id : "default"
  params.html = params.html ? params.html : null
  params.size = params.fullscreen ? "large" : "small"
  params.offset = params.offset ? params.offset : 0
  params.arrow_offset = params.arrow ? 12 : 0
  params.mouseevents = params.mouseevents === undefined ? true : params.mouseevents
  params.x = params.x ? params.x : 0
  params.y = params.y ? params.y : 0
  params.color = params.color ? params.color : "#333"
  
  params.anchor = {}
  if (params.fullscreen) {
    params.anchor.x = "center"
    params.anchor.y = "center"
    params.x = window.innerWidth/2
    params.y = window.innerHeight/2
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
    var curtain = d3.select("body").append("div")
      .attr("class","vizwhiz_tooltip_curtain")
      .on(vizwhiz.evt.click,function(){
        vizwhiz.tooltip.remove(params.id)
      })
  }
  
  var tooltip = d3.select("body").append("div")
    .datum(params)
    .attr("id","vizwhiz_tooltip_id_"+params.id)
    .attr("class","vizwhiz_tooltip vizwhiz_tooltip_"+params.size)
  
  var container = tooltip.append("div")
    .datum(params)
    .attr("class","vizwhiz_tooltip_container")
  
  if (params.fullscreen && params.html) {
    
    container
      .style("height",(window.innerHeight*0.75)+"px")
      .style("width",(window.innerWidth*0.75)+"px")
      
    var body = container.append("div")
      .attr("class","vizwhiz_tooltip_body")
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
      .attr("class","vizwhiz_tooltip_header")
      
    if (params.id != "default") {
      var title_id = header.append("div")
        .attr("class","vizwhiz_tooltip_id")
        .text(params.id)
      title_width -= title_id.node().offsetWidth+6
    }
  }
  
  if (params.fullscreen) {
    var close = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_close")
      .style("background-color",vizwhiz.utils.darker_color(params.color))
      .html("\&times;")
      .on(vizwhiz.evt.click,function(){
        vizwhiz.tooltip.remove(params.id)
      })
  }
  
  if (!params.mouseevents) {
    tooltip
      .style("pointer-events","none")
  }
  else if (params.mouseevents !== true) {
    
    var oldout = d3.select(params.mouseevents).on(vizwhiz.evt.out)
    
    d3.select(params.mouseevents).on(vizwhiz.evt.out,function() {
      var target = d3.event.toElement
      var class_name = target ? target.className : ""
      if (class_name.indexOf("vizwhiz_tooltip") < 0) {
        oldout()
      }
    })
    tooltip.on(vizwhiz.evt.out,function() {
      d3.event.stopPropagation()
      var target = d3.event.toElement
      var class_name = target ? target.className : ""
      if (class_name.indexOf("vizwhiz_tooltip") < 0) {
        oldout()
      }
    })
    
  }
    
  if (params.arrow) {
    var arrow = tooltip.append("div")
      .attr("class","vizwhiz_tooltip_arrow")
  }
  
  if (params.icon) {
    var title_icon = header.append("div")
      .attr("class","vizwhiz_tooltip_icon")
      .style("background-image","url("+params.icon+")")
      .style("background-color",params.color)
    title_width -= title_icon.node().offsetWidth
  }
  
  if (params.title) {
    var title = header.append("div")
      .attr("class","vizwhiz_tooltip_title")
      .style("width",title_width+"px")
      .text(params.title)
  }
  
  if (params.description) {
    var description = body.append("div")
      .attr("class","vizwhiz_tooltip_description")
      .text(params.description)
  }
  
  if (params.data || params.html && !params.fullscreen) {

    var data_container = body.append("div")
      .attr("class","vizwhiz_tooltip_data_container")
  }
  
  if (params.data) {
      
    params.data.forEach(function(d,i){
      var block = data_container.append("div")
        .attr("class","vizwhiz_tooltip_data_block")
        .text(d.name)
      if (d.highlight) {
        block
          .style("font-weight","bold")
          .style("color",vizwhiz.utils.darker_color(params.color))
      }
      
      block.append("div")
          .attr("class","vizwhiz_tooltip_data_value")
          .text(d.value)
          
      if (i != params.data.length-1) {
        data_container.append("div")
          .attr("class","vizwhiz_tooltip_data_seperator")
      }
          
    })
    
  }
    
  if (params.html && !params.fullscreen) {
    data_container.append("div")
      .style("padding","3px")
      .style("margin-bottom","3px")
      .html(params.html)
  }
  
  if (params.footer) {
    var footer = body.append("div")
      .attr("class","vizwhiz_tooltip_footer")
      .html(params.footer)
  }
  
  params.height = tooltip.node().offsetHeight
  
  if (params.html && params.fullscreen) {
    var h = params.height-38
    var w = tooltip.node().offsetWidth-params.width-44
    container.append("div")
      .attr("class","vizwhiz_tooltip_html")
      .style("width",w+"px")
      .style("height",h+"px")
      .html(params.html)
  }
  
  params.width = tooltip.node().offsetWidth
  
  if (params.anchor.y != "center") params.height += params.arrow_offset
  else params.width += params.arrow_offset
      
  if (params.data) {
    var h = params.height
    if (header) h -= header.node().offsetHeight
    if (footer) {
      footer.style("margin-top","6px")
      h -= footer.node().offsetHeight
    }
    data_container
      .style("max-height",h+"px")
  }
  
  vizwhiz.tooltip.move(params.x,params.y,params.id);
    
}

vizwhiz.tooltip.arrow = function(arrow) {
  arrow
    .style("bottom", function(d){
      if (d.anchor.y != "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("top", function(d){
      if (d.anchor.y != "center" && d.flip) return "-5px"
      else if (d.anchor.y == "center") return "50%"
      else return "auto"
    })
    .style("left", function(d){
      if (d.anchor.y == "center" && d.flip) return "-5px"
      else if (d.anchor.y != "center") return "50%"
      else return "auto"
    })
    .style("right", function(d){
      if (d.anchor.y == "center" && !d.flip) return "-5px"
      else return "auto"
    })
    .style("margin-left", function(d){
      if (d.anchor.y == "center") {
        return "auto"
      }
      else {
        if (d.anchor.x == "right") {
          var arrow_x = -d.width/2+d.arrow_offset/2
        }
        else if (d.anchor.x == "left") {
          var arrow_x = d.width/2-d.arrow_offset*2 - 5
        }
        else {
          var arrow_x = -5
        }
        if (d.cx-d.width/2-5 < arrow_x) {
          arrow_x = d.cx-d.width/2-5
          if (arrow_x < 2-d.width/2) arrow_x = 2-d.width/2
        }
        else if (-(window.innerWidth-d.cx-d.width/2+5) > arrow_x) {
          var arrow_x = -(window.innerWidth-d.cx-d.width/2+5)
          if (arrow_x > d.width/2-11) arrow_x = d.width/2-11
        }
        return arrow_x+"px"
      }
    })
    .style("margin-top", function(d){
      if (d.anchor.y != "center") {
        return "auto"
      }
      else {
        if (d.anchor.y == "bottom") {
          var arrow_y = -d.height/2+d.arrow_offset/2 - 1
        }
        else if (d.anchor.y == "top") {
          var arrow_y = d.height/2-d.arrow_offset*2 - 2
        }
        else {
          var arrow_y = -9
        }
        if (d.cy-d.height/2-d.arrow_offset < arrow_y) {
          arrow_y = d.cy-d.height/2-d.arrow_offset
          if (arrow_y < 4-d.height/2) arrow_y = 4-d.height/2
        }
        else if (-(window.innerHeight-d.cy-d.height/2+d.arrow_offset) > arrow_y) {
          var arrow_y = -(window.innerHeight-d.cy-d.height/2+d.arrow_offset)
          if (arrow_y > d.height/2-22) arrow_y = d.height/2-22
        }
        return arrow_y+"px"
      }
    })
}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Destroy Tooltips
//-------------------------------------------------------------------

vizwhiz.tooltip.remove = function(id) {
  
  if (id) d3.select("div#vizwhiz_tooltip_id_"+id).remove();
  else d3.selectAll("div.vizwhiz_tooltip").remove();
  
  d3.selectAll("div.vizwhiz_tooltip_curtain").remove()

}

//===================================================================

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get X and Y position for Tooltip
//-------------------------------------------------------------------

vizwhiz.tooltip.move = function(x,y,id) {
  
  if (!id) var tooltip = d3.select("div#vizwhiz_tooltip_id_default")
  else var tooltip = d3.select("div#vizwhiz_tooltip_id_"+id)
  
  if (tooltip.node()) {
    
    var d = tooltip.datum()
  
    d.cx = x
    d.cy = y
  
    if (!d.fixed) {

      // Set initial values, based off of anchor
      if (d.anchor.y != "center") {

        if (d.anchor.x == "right") {
          d.x = d.cx - d.arrow_offset - 4
        }
        else if (d.anchor.x == "center") {
          d.x = d.cx - d.width/2
        }
        else if (d.anchor.x == "left") {
          d.x = d.cx - d.width + d.arrow_offset + 2
        }

        // Determine whether or not to flip the tooltip
        if (d.anchor.y == "bottom") {
          d.flip = d.cy + d.height + d.offset <= window.innerHeight
        }
        else if (d.anchor.y == "top") {
          d.flip = d.cy - d.height - d.offset < 0
        }
        
        if (d.flip) {
          d.y = d.cy + d.offset + d.arrow_offset
        }
        else {
          d.y = d.cy - d.height - d.offset
        }
    
      }
      else {

        d.y = d.cy - d.height/2
        
        // Determine whether or not to flip the tooltip
        if (d.anchor.x == "right") {
          d.flip = d.cx + d.width + d.offset <= window.innerWidth
        }
        else if (d.anchor.x == "left") {
          d.flip = d.cx - d.width - d.offset < 0
        }
    
        if (d.anchor.x == "center") {
          d.flip = false
          d.x = d.cx - d.width/2
        }
        else if (d.flip) {
          d.x = d.cx + d.offset + d.arrow_offset
        }
        else {
          d.x = d.cx - d.width - d.offset
        }
      }
  
      // Limit X to the bounds of the screen
      if (d.x < 0) {
        d.x = 0
      }
      else if (d.x + d.width > window.innerWidth) {
        d.x = window.innerWidth - d.width
      }
  
      // Limit Y to the bounds of the screen
      if (d.y < 0) {
        d.y = 0
      }
      else if (d.y + d.height > window.innerHeight) {
        d.y = window.innerHeight - d.height
      }
      
    }
    
    tooltip
      .style("top",d.y+"px")
      .style("left",d.x+"px")
  
    if (d.arrow) {
      tooltip.selectAll(".vizwhiz_tooltip_arrow")
        .call(vizwhiz.tooltip.arrow)
    }
    
  }
    
}

//===================================================================
